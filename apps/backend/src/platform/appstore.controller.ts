/**
 * AppstoreController — real Prisma-backed app store.
 *
 * Queries the App and AppInstallation models so that companies can browse,
 * install, configure, and uninstall apps from the in-product app store.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PrismaService } from '../common/prisma.service';

function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('appstore')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('appstore')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('apps:read')
export class AppstoreController {
  constructor(private readonly prisma: PrismaService) {}

  // ── App catalogue ─────────────────────────────────────────────────────────

  @Get('apps')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List available apps in the catalogue' })
  async getApps(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('free') free?: string,
  ) {
    const where: Record<string, unknown> = { isActive: true };
    if (category)             where.category = category;
    if (free === 'true')      where.isFree   = true;
    if (search) {
      where.OR = [
        { name:        { contains: search } },
        { description: { contains: search } },
        { category:    { contains: search } },
      ];
    }
    const data = await this.prisma.app.findMany({
      where,
      orderBy: [{ downloads: 'desc' }, { name: 'asc' }],
      select: {
        id: true, name: true, slug: true, description: true,
        version: true, category: true, isFree: true, price: true,
        rating: true, downloads: true, developer: true, iconUrl: true,
        createdAt: true,
      },
    });
    return { success: true, data };
  }

  @Get('apps/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single app by ID or slug' })
  async getApp(@Param('id') id: string) {
    const app = await this.prisma.app.findFirst({
      where: { OR: [{ id }, { slug: id }], isActive: true },
    });
    if (!app) throw new NotFoundException(`App ${id} not found`);
    return { success: true, data: app };
  }

  // ── Installations ─────────────────────────────────────────────────────────

  @Get('installations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List installed apps for the company' })
  async getInstallations(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    if (!companyId) return { success: true, data: [] };

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;

    const data = await this.prisma.appInstallation.findMany({
      where,
      include: {
        app: {
          select: {
            id: true, name: true, slug: true, description: true,
            version: true, category: true, iconUrl: true,
          },
        },
      },
      orderBy: { installedAt: 'desc' },
    });
    return { success: true, data };
  }

  @Get('installations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an installation record by ID' })
  async getInstallation(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const where: Record<string, unknown> = { id };
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.appInstallation.findFirst({
      where,
      include: { app: true },
    });
    if (!data) throw new NotFoundException(`Installation ${id} not found`);
    return { success: true, data };
  }

  @Post('installations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Install an app for the company' })
  async installApp(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { appId: string; config?: Record<string, unknown> },
  ) {
    const companyId = cid(h, req);
    if (!companyId) throw new BadRequestException('x-company-id header or authenticated company is required');
    if (!body.appId) throw new BadRequestException('appId is required');

    const app = await this.prisma.app.findFirst({ where: { OR: [{ id: body.appId }, { slug: body.appId }], isActive: true } });
    if (!app) throw new NotFoundException(`App ${body.appId} not found or not active`);

    // Upsert — re-activating a previously uninstalled app
    const data = await this.prisma.appInstallation.upsert({
      where: { companyId_appId: { companyId, appId: app.id } },
      create: {
        companyId,
        appId: app.id,
        version: app.version,
        status: 'ACTIVE',
        config: body.config ? JSON.stringify(body.config) : null,
        installedBy: (req?.user?.userId as string | undefined) ?? 'system',
      } as any,
      update: {
        status: 'ACTIVE',
        version: app.version,
        config: body.config ? JSON.stringify(body.config) : undefined,
        updatedAt: new Date(),
      } as any,
      include: { app: { select: { id: true, name: true, slug: true, version: true, iconUrl: true } } },
    });

    // Increment download counter (fire-and-forget)
    this.prisma.app.update({ where: { id: app.id }, data: { downloads: { increment: 1 } } as any }).catch(() => undefined);

    return { success: true, data };
  }

  @Patch('installations/:id/config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update installation config' })
  async updateInstallationConfig(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.appInstallation.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Installation ${id} not found`);
    const data = await this.prisma.appInstallation.update({
      where: { id },
      data: { config: JSON.stringify(body) } as any,
    });
    return { success: true, data };
  }

  @Delete('installations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Uninstall an app (sets status to DISABLED)' })
  async uninstallApp(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.appInstallation.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Installation ${id} not found`);
    // Soft-disable rather than hard-delete to preserve audit trail
    await this.prisma.appInstallation.update({
      where: { id },
      data: { status: 'DISABLED' } as any,
    });
    return { success: true };
  }
}
