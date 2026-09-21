/**
 * SecurityController — real Prisma-backed security dashboard.
 *
 * Events   → AuditLog (existing shared model; security-relevant actions)
 * Assessments → SecurityAssessment + SecurityFinding
 * Readiness → derived from SecurityAssessment aggregates
 */
import {
  Controller, Get, Post, Body, Patch, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('security')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);
  constructor(private readonly prisma: PrismaService) {}

  // ── Security Events (from AuditLog) ───────────────────────────────────────

  @Get('events')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List security-relevant audit events' })
  async getEvents(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('action') action?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (action)    where.action    = action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  // ── ABAC Access Denials (written by AccessPolicyService) ─────────────────

  @Get('access-denials')
  @Roles('ADMIN', 'SECURITY', 'SPURADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List ACCESS_DENIED audit log entries written by ABAC enforcer' })
  async getAccessDenials(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = '50',
    @Query('userId') userId?: string,
    @Query('since') since?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = Math.min(parseInt(take, 10), 200);

    const where: any = { action: 'ACCESS_DENIED' };
    if (companyId) where.companyId = companyId;
    if (userId)    where.userId    = userId;
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) where.createdAt = { gte: sinceDate };
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pg - 1) * lm,
        take: lm,
        select: {
          id: true,
          action: true,
          userId: true,
          companyId: true,
          details: true,
          createdAt: true,
          // join user for display name
          user: { select: { username: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Parse the details JSON blob written by AccessPolicyService.deny()
    const data = rows.map((r: any) => {
      let parsed: { reason?: string; permissions?: string[] } = {};
      try { parsed = r.details ? JSON.parse(r.details) : {}; } catch { /* ignore */ }
      return {
        id:          r.id,
        userId:      r.userId,
        username:    r.user?.username ?? null,
        email:       r.user?.email    ?? null,
        role:        r.user?.role     ?? null,
        companyId:   r.companyId,
        reason:      parsed.reason      ?? null,
        permissions: parsed.permissions ?? [],
        createdAt:   r.createdAt,
      };
    });

    return {
      success: true,
      data: {
        data,
        pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) },
        summary: {
          total,
          last24h: await this.prisma.auditLog.count({
            where: { ...where, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
          }),
        },
      },
    };
  }

  // ── Security Evaluations (SecurityAssessment) ─────────────────────────────

  @Get('evaluations')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List security assessments' })
  async getEvaluations(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;
    const data = await this.prisma.securityAssessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { findings: true, scans: true } } },
    });
    return { success: true, data };
  }

  @Get('evaluations/:id')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a security assessment by ID' })
  async getEvaluation(@Param('id') id: string) {
    const data = await this.prisma.securityAssessment.findUnique({
      where: { id },
      include: { findings: true, scans: true },
    });
    if (!data) throw new NotFoundException(`Security assessment ${id} not found`);
    return { success: true, data };
  }

  @Post('evaluations')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a security assessment' })
  async createEvaluation(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req) ?? (body.companyId as string);
    if (!companyId)    throw new NotFoundException('companyId is required (x-company-id header or JWT claim)');
    if (!body.name)    throw new NotFoundException('name is required');
    const data = await this.prisma.securityAssessment.create({
      data: {
        ...body,
        companyId,
        status: (body.status as string | undefined) ?? 'SCHEDULED',
        conductedBy: (body.conductedBy as string | undefined) ?? req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('evaluations/:id')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a security assessment' })
  async updateEvaluation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.prisma.securityAssessment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Security assessment ${id} not found`);
    const data = await this.prisma.securityAssessment.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  // ── Readiness Score (derived) ─────────────────────────────────────────────

  @Get('readiness')
  @Roles('ADMIN', 'SECURITY', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Security readiness score and finding summary' })
  async getReadiness(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const findings = await this.prisma.securityFinding.findMany({
      where: { assessment: { ...where } } as any,
      select: { severity: true, status: true },
    });

    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, passed: 0 };
    for (const f of findings) {
      if (f.status === 'RESOLVED' || f.status === 'FALSE_POSITIVE') {
        counts.passed++;
      } else {
        const sev = f.severity as keyof typeof counts;
        if (sev in counts) counts[sev]++;
      }
    }
    const total = findings.length;
    const penalty = counts.CRITICAL * 20 + counts.HIGH * 10 + counts.MEDIUM * 5 + counts.LOW * 2;
    const readinessScore = Math.max(0, Math.min(100, 100 - penalty));

    const assessments = await this.prisma.securityAssessment.findMany({
      where,
      select: { id: true, name: true, status: true, completedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      success: true,
      data: {
        summary: {
          readinessScore,
          criticalCount: counts.CRITICAL,
          highCount: counts.HIGH,
          mediumCount: counts.MEDIUM,
          lowCount: counts.LOW,
          passedCount: counts.passed,
          totalCount: total,
        },
        recentAssessments: assessments,
      },
    };
  }

  // ── Checklist ─────────────────────────────────────────────────────────────

  @Get('checklist')
  @Roles('ADMIN', 'SECURITY', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Security compliance checklist derived from open findings' })
  async getChecklist(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const findings = await this.prisma.securityFinding.findMany({
      where: { assessment: { ...where } } as any,
      orderBy: { severity: 'asc' },
    });

    const items = findings.map((f: any) => ({
      id:          f.id,
      title:       f.title,
      category:    f.category,
      severity:    f.severity,
      status:      f.status,
      passed:      f.status === 'RESOLVED' || f.status === 'FALSE_POSITIVE',
      remediation: f.remediation,
    }));

    const passed = items.filter((i: any) => i.passed).length;
    return {
      success: true,
      data: {
        items,
        summary: { total: items.length, passed, failed: items.length - passed },
      },
    };
  }

  // ── Health Status ─────────────────────────────────────────────────────────

  @Get('health')
  @Roles('ADMIN', 'SECURITY', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Security health — count of open critical + high findings' })
  async getHealth(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const [critical, high, total] = await Promise.all([
      this.prisma.securityFinding.count({
        where: { assessment: { ...where }, severity: 'CRITICAL', status: 'OPEN' } as any,
      }),
      this.prisma.securityFinding.count({
        where: { assessment: { ...where }, severity: 'HIGH', status: 'OPEN' } as any,
      }),
      this.prisma.securityFinding.count({
        where: { assessment: { ...where }, status: { not: 'RESOLVED' } } as any,
      }),
    ]);

    const status = critical > 0 ? 'critical' : high > 0 ? 'warning' : 'ok';
    return {
      success: true,
      data: { status, openCritical: critical, openHigh: high, totalOpen: total },
    };
  }

  // ── Alerts (open CRITICAL + HIGH findings) ────────────────────────────────

  @Get('alerts')
  @Roles('ADMIN', 'SECURITY', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Security alerts — open critical and high findings' })
  async getAlerts(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const data = await this.prisma.securityFinding.findMany({
      where: {
        assessment: { ...(companyId ? { companyId } : {}) },
        severity: { in: ['CRITICAL', 'HIGH'] },
        status: 'OPEN',
      } as any,
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
    return { success: true, data };
  }

  // ── DOM Tampering Alert (unauthenticated beacon from security-shield.js) ──
  //
  // NOTE: This stub is intentionally unreachable — the real implementation
  // lives in SecurityPublicController to avoid the class-level JwtAuthGuard.
  // It is kept here only as documentation for the API surface.
  //
  // See: apps/backend/src/security/security-public.controller.ts
}

