import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus, Request, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';


function resolveCompanyId(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

/**
 * AuditLogController
 *
 * Read-only API for querying audit log entries scoped to the current tenant.
 *
 * RBAC:
 *   - ADMIN, SUPERADMIN, SPURADMIN: full access to all logs in their company
 *   - AUDITOR: read-only access for compliance reviews
 *
 * Tenant isolation:
 *   - companyId is derived from x-company-id header or JWT claim
 *   - The Prisma $extends interceptor auto-scopes all queries
 */
@ApiTags('audit')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('logs')
  @Roles('ADMIN', 'SUPERADMIN', 'SPURADMIN', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List audit log entries for the current company' })
  async getAuditLogs(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const companyId = resolveCompanyId(h, req);
    const pg = parseInt(page, 10);
    const lm = Math.min(parseInt(take, 10), 100);

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (action)    where.action    = { contains: action, mode: 'insensitive' };
    if (userId)    where.userId    = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (pg - 1) * lm,
        take: lm,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          action: true,
          details: true,
          companyId: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: {
        data,
        pagination: {
          total,
          page: pg,
          take: lm,
          pages: Math.ceil(total / lm),
        },
      },
    };
  }

  @Get('logs/actions')
  @Roles('ADMIN', 'SUPERADMIN', 'SPURADMIN', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List distinct audit log actions for filtering' })
  async getAuditActions(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompanyId(h, req);

    // Use findMany + groupBy to avoid raw SQL and keep tenant isolation.
    // Prisma's `distinct` + `select` is the safe, parameterized equivalent of
    // SELECT DISTINCT "action" … WHERE companyId = $1.
    const rows = await this.prisma.auditLog.findMany({
      where: companyId ? { companyId } : undefined,
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });

    return {
      success: true,
      data: rows.map((r) => r.action).filter(Boolean),
    };
  }

  @Get('logs/stats')
  @Roles('ADMIN', 'SUPERADMIN', 'SPURADMIN', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Audit log statistics for the current company' })
  async getAuditStats(
    @Headers() h: Record<string, string>,
    @Request() req: any,
  ) {
    const companyId = resolveCompanyId(h, req);
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const where = companyId ? { companyId } : {};
    const where24h = { ...where, createdAt: { gte: last24h } };
    const where7d = { ...where, createdAt: { gte: last7d } };

    // groupBy gives us the top actions without touching raw SQL.
    // Prisma returns rows ordered by the groupBy key by default; we sort
    // in JS after receiving the results so we don't need a raw ORDER BY.
    const topActionsRaw = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where: where7d,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    });

    const [total, last24hCount, last7dCount] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({ where: where24h }),
      this.prisma.auditLog.count({ where: where7d }),
    ]);

    return {
      success: true,
      data: {
        total,
        last24h: last24hCount,
        last7d: last7dCount,
        topActions: topActionsRaw.map((a) => ({ action: a.action, count: a._count.action })),
      },
    };
  }
}
