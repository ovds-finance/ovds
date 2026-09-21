/**
 * ProjectsController — real Prisma-backed project management.
 * Queries the Project and ProjectTask models, tenant-scoped via companyId.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PrismaService } from '../common/prisma.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('projects')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ovds:read')
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Projects ──────────────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List projects for the company' })
  async getProjects(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { tasks: true } } },
      }),
      this.prisma.project.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Project statistics' })
  async getStats(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const byStatus = await this.prisma.project.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    }).catch(() => []);
    return { success: true, data: byStatus };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a project by ID' })
  async getProject(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.project.findFirst({
      where,
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });
    if (!data) throw new NotFoundException(`Project ${id} not found`);
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a project' })
  async createProject(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.name) throw new BadRequestException('name is required');
    const data = await this.prisma.project.create({
      data: {
        ...body,
        companyId,
        createdBy: (body.createdBy as string | undefined) ?? req?.user?.userId,
      } as any,
    });
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a project' })
  async updateProject(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.project.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);
    const data = await this.prisma.project.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project' })
  async deleteProject(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.project.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  @Get(':projectId/tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List tasks for a project' })
  async getTasks(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
  ) {
    const where: any = { projectId };
    if (status) where.status = status;
    const data = await this.prisma.projectTask.findMany({ where, orderBy: { createdAt: 'asc' } });
    return { success: true, data };
  }

  @Post(':projectId/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task for a project' })
  async createTask(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, unknown>,
  ) {
    if (!body.title && !body.name) throw new BadRequestException('title is required');
    const data = await this.prisma.projectTask.create({
      data: { ...body, projectId, title: (body.title ?? body.name) as string } as any,
    });
    return { success: true, data };
  }

  @Patch(':projectId/tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a project task' })
  async updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.projectTask.findFirst({ where: { id: taskId, projectId } });
    if (!existing) throw new NotFoundException(`Task ${taskId} not found`);
    const data = await this.prisma.projectTask.update({ where: { id: taskId }, data: body as any });
    return { success: true, data };
  }

  @Delete(':projectId/tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project task' })
  async deleteTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    const existing = await this.prisma.projectTask.findFirst({ where: { id: taskId, projectId } });
    if (!existing) throw new NotFoundException(`Task ${taskId} not found`);
    await this.prisma.projectTask.delete({ where: { id: taskId } });
    return { success: true };
  }
}
