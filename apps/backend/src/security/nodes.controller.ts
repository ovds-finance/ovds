/**
 * NodesController — real Prisma-backed network node registry.
 * Nodes are IotDevice records with deviceType = CONTROLLER or ROUTER.
 */
import {
  Controller, Get, Post, Put, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

/** Device types treated as network nodes */
const NODE_TYPES = ['CONTROLLER', 'ROUTER'];

@ApiTags('nodes')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('nodes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NodesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List network nodes (CONTROLLER / ROUTER type devices)' })
  async getNodes(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { deviceType: { in: NODE_TYPES } };
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;
    const data = await this.prisma.iotDevice.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  }

  @Post('register')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a network node' })
  async registerNode(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.name)         throw new BadRequestException('name is required');
    if (!body.serialNumber) throw new BadRequestException('serialNumber is required');
    const data = await this.prisma.iotDevice.create({
      data: {
        ...body,
        companyId,
        deviceType: (body.deviceType as string | undefined) ?? 'CONTROLLER',
        status:     'ACTIVE',
        createdBy:  req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Put(':id/heartbeat')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update node last-seen heartbeat timestamp' })
  async heartbeat(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, deviceType: { in: NODE_TYPES }, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Node ${id} not found`);
    await this.prisma.iotDevice.update({
      where: { id },
      data: { lastSeenAt: new Date(), status: 'ACTIVE' } as any,
    });
    return { success: true };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a node record' })
  async updateNode(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, deviceType: { in: NODE_TYPES }, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Node ${id} not found`);
    const data = await this.prisma.iotDevice.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decommission a node' })
  async deleteNode(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, deviceType: { in: NODE_TYPES }, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Node ${id} not found`);
    await this.prisma.iotDevice.update({
      where: { id },
      data: { status: 'DECOMMISSIONED' } as any,
    });
    return { success: true };
  }
}
