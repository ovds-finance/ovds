import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ovds:read')
export class ProjectsController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List projects' })
  getProjects() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create project' })
  createProject(@Body() body: any) {
    return { success: true, data: { ...body, id: 'proj-' + Date.now() } };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update project' })
  updateProject(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project' })
  deleteProject(@Param('id') id: string) {
    return { success: true };
  }
}
