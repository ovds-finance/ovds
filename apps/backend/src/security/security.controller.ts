import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('security')
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
  @Get('events')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List security events' })
  getEvents() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Get('evaluations')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List security evaluations' })
  getEvaluations() {
    return { success: true, data: [] };
  }

  @Post('evaluations')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create security evaluation' })
  createEvaluation(@Body() body: any) {
    return { success: true, data: { ...body, id: 'se-' + Date.now() } };
  }
}
