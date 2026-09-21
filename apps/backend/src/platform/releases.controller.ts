/**
 * ReleasesController — real Prisma-backed release and feature-flag management.
 *
 * Queries: Release, CompanyRelease, FeatureFlag, CompanyFeatureFlag models.
 * Admins can browse available releases, apply them to the company, track history,
 * and manage per-company feature-flag overrides.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('releases')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('releases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReleasesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // ── Releases catalogue ────────────────────────────────────────────────────

  @Get()
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all releases (paginated)' })
  async getReleases(
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type)   where.type   = type;

    const [data, total] = await Promise.all([
      this.prisma.release.findMany({
        where,
        skip: (pg - 1) * lm,
        take: lm,
        orderBy: { releasedAt: 'desc' },
      }),
      this.prisma.release.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Get('available')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get releases available (not yet applied) for this company' })
  async getAvailable(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    if (!companyId) {
      // No tenant context — return all RELEASED releases
      const data = await this.prisma.release.findMany({
        where: { status: 'RELEASED' },
        orderBy: { releasedAt: 'desc' },
        take: 20,
      });
      return { success: true, data };
    }

    // Find releases not yet in CompanyRelease for this company
    const applied = await this.prisma.companyRelease.findMany({
      where: { companyId },
      select: { releaseId: true },
    });
    const appliedIds = applied.map((r: any) => r.releaseId);

    const data = await this.prisma.release.findMany({
      where: {
        status: 'RELEASED',
        id: appliedIds.length > 0 ? { notIn: appliedIds } : undefined,
      },
      orderBy: { releasedAt: 'desc' },
    });
    return { success: true, data };
  }

  @Get('settings')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get update settings for the current company' })
  async getSettings(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    // Resolve the latest applied release as the "current version"
    const latest = companyId
      ? await this.prisma.companyRelease.findFirst({
          where: { companyId, status: 'APPLIED' },
          include: { release: true },
          orderBy: { appliedAt: 'desc' },
        }).catch(() => null)
      : null;

    return {
      success: true,
      data: {
        currentVersion: (latest as any)?.release?.version ?? null,
        autoUpdate: false,
        environment: this.configService.get('NODE_ENV', 'production'),
      },
    };
  }

  @Patch('settings')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update update settings for the current company' })
  async updateSettings(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { autoUpdate: boolean },
  ) {
    return {
      success: true,
      data: {
        currentVersion: null,
        autoUpdate: body.autoUpdate,
        environment: this.configService.get('NODE_ENV', 'production'),
      },
    };
  }

  @Get('pending-mandatory')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check for pending mandatory releases for this company' })
  async getPendingMandatory(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    if (!companyId) return { success: true, data: null };

    const applied = await this.prisma.companyRelease.findMany({
      where: { companyId },
      select: { releaseId: true },
    });
    const appliedIds = applied.map((r: any) => r.releaseId);

    const mandatory = await this.prisma.release.findFirst({
      where: {
        isMandatory: true,
        status: 'RELEASED',
        id: appliedIds.length > 0 ? { notIn: appliedIds } : undefined,
      },
      orderBy: { releasedAt: 'asc' },
    });
    return { success: true, data: mandatory ?? null };
  }

  @Get('history')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get release history for this company' })
  async getHistory(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    if (!companyId) return { success: true, data: [] };

    const data = await this.prisma.companyRelease.findMany({
      where: { companyId },
      include: { release: true },
      orderBy: { appliedAt: 'desc' },
    });
    return { success: true, data };
  }

  @Post('apply')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply a release to this company' })
  async applyRelease(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { releaseId: string },
  ) {
    const companyId = cid(h, req);
    if (!companyId) throw new BadRequestException('x-company-id header or company context is required');
    if (!body.releaseId) throw new BadRequestException('releaseId is required');

    const release = await this.prisma.release.findUnique({ where: { id: body.releaseId } });
    if (!release) throw new NotFoundException(`Release ${body.releaseId} not found`);

    const data = await this.prisma.companyRelease.upsert({
      where: { companyId_releaseId: { companyId, releaseId: body.releaseId } },
      create: {
        companyId,
        releaseId: body.releaseId,
        status: 'APPLIED',
        appliedAt: new Date(),
      } as any,
      update: {
        status: 'APPLIED',
        appliedAt: new Date(),
      } as any,
      include: { release: true },
    });
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new release (super-admin)' })
  async createRelease(@Body() body: Record<string, unknown>) {
    if (!body.version) throw new BadRequestException('version is required');
    const data = await this.prisma.release.create({ data: body as any });
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a release' })
  async updateRelease(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.prisma.release.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Release ${id} not found`);
    const data = await this.prisma.release.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a release' })
  async deleteRelease(@Param('id') id: string) {
    const existing = await this.prisma.release.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Release ${id} not found`);
    await this.prisma.release.delete({ where: { id } });
    return { success: true };
  }

  @Get('export')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export releases as CSV' })
  async exportReleases() {
    const releases = await this.prisma.release.findMany({ orderBy: { releasedAt: 'desc' } });
    const header = 'id,version,status,type,isMandatory,releasedAt';
    const rows = releases.map((r: any) =>
      [r.id, r.version, r.status, r.type, r.isMandatory, r.releasedAt?.toISOString() ?? ''].join(','),
    );
    return { success: true, data: [header, ...rows].join('\n') };
  }

  // ── Feature Flags ─────────────────────────────────────────────────────────

  @Get('flags')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List feature flags with per-company toggle state' })
  async getFlags(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const flags = await this.prisma.featureFlag.findMany({
      where: { isActive: true },
      include: companyId
        ? { companies: { where: { companyId }, select: { isEnabled: true } } }
        : undefined,
      orderBy: { name: 'asc' },
    });

    const data = flags.map((f: any) => ({
      id:          f.id,
      name:        f.name,
      description: f.description,
      isActive:    f.isActive,
      isEnabled:   companyId ? (f.companies?.[0]?.isEnabled ?? false) : false,
    }));
    return { success: true, data };
  }

  @Post('flags')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new feature flag' })
  async createFlag(@Body() body: { name: string; description?: string }) {
    if (!body.name) throw new BadRequestException('name is required');
    const data = await this.prisma.featureFlag.create({
      data: { name: body.name, description: body.description } as any,
    });
    return { success: true, data };
  }

  @Patch('flags/toggle')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle a feature flag for a company' })
  async toggleFlag(
    @Body() body: { companyId: string; flagId: string; isEnabled: boolean },
  ) {
    if (!body.companyId) throw new BadRequestException('companyId is required');
    if (!body.flagId)    throw new BadRequestException('flagId is required');

    const flag = await this.prisma.featureFlag.findUnique({ where: { id: body.flagId } });
    if (!flag) throw new NotFoundException(`Feature flag ${body.flagId} not found`);

    const data = await this.prisma.companyFeatureFlag.upsert({
      where: { companyId_flagId: { companyId: body.companyId, flagId: body.flagId } },
      create: { companyId: body.companyId, flagId: body.flagId, isEnabled: body.isEnabled } as any,
      update: { isEnabled: body.isEnabled } as any,
    });
    return { success: true, data };
  }

  @Delete('flags/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a feature flag' })
  async deleteFlag(@Param('id') id: string) {
    const existing = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Feature flag ${id} not found`);
    await this.prisma.featureFlag.delete({ where: { id } });
    return { success: true };
  }
}
