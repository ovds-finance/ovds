import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

@ApiTags('admin')
@Controller('admin-menu-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminMenuItemsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List admin-created menu items.
   * Readable by any authenticated user (the sidebar merges these into the nav tree),
   * but only ADMINs may create/update/delete them (see below).
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List admin-created menu items' })
  @ApiResponse({ status: 200, description: 'Admin-created menu items' })
  async getMenuItems(@Query('isActive') isActive?: string) {
    const where = isActive === 'true' ? { isActive: true } : {};
    const items = await this.prisma.adminCreatedMenuItem.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    const data = items.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create admin menu item' })
  async createMenuItem(@Body() body: any, @Req() req: any) {
    const created = await this.prisma.adminCreatedMenuItem.create({
      data: {
        label: body.label,
        path: body.path,
        to: body.to ?? null,
        icon: body.icon ?? null,
        parentKey: body.parentKey ?? null,
        order: typeof body.order === 'number' ? body.order : (body.priority ?? 0),
        roles: body.roles ?? null,
        isActive: body.isActive ?? true,
        companyId: req?.user?.companyId ?? null,
        adminId: req?.user?.userId ?? null,
      },
    });
    return { success: true, data: created };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update admin menu item' })
  async updateMenuItem(@Param('id') id: string, @Body() body: any) {
    const updated = await this.prisma.adminCreatedMenuItem.update({
      where: { id },
      data: {
        ...(body.label !== undefined ? { label: body.label } : {}),
        ...(body.path !== undefined ? { path: body.path } : {}),
        ...(body.to !== undefined ? { to: body.to } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.parentKey !== undefined ? { parentKey: body.parentKey } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
        ...(body.priority !== undefined ? { order: body.priority } : {}),
        ...(body.roles !== undefined ? { roles: body.roles } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    return { success: true, data: updated };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete admin menu item' })
  async deleteMenuItem(@Param('id') id: string) {
    await this.prisma.adminCreatedMenuItem.delete({ where: { id } });
    return { success: true };
  }
}

