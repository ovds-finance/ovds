import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('helpdesk')
@Controller('helpdesk')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('notifications:read')
export class HelpdeskController {
  @Get('tickets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List helpdesk tickets' })
  getTickets() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create helpdesk ticket' })
  createTicket(@Body() body: any) {
    return { success: true, data: { ...body, id: 'ticket-' + Date.now() } };
  }

  @Patch('tickets/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update helpdesk ticket' })
  updateTicket(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete('tickets/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete helpdesk ticket' })
  deleteTicket(@Param('id') id: string) {
    return { success: true };
  }
}

