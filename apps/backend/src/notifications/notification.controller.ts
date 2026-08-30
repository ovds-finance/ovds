import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Query, Body, Request, UseGuards,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationService } from './notification.service';
import { NotificationAdminService } from './notification-admin.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly svc: NotificationService,
    private readonly admin: NotificationAdminService,
  ) {}

  /* ─── User: in-app feed ──────────────────────────────────────────────── */

  @Get()
  @ApiOperation({ summary: 'Get paginated in-app notifications for the current user' })
  async list(
    @Request() req: any,
    @Query('page')  page  = '1',
    @Query('limit') limit = '20',
  ) {
    return this.svc.getForUser(req.user.userId, Number(page), Number(limit));
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Request() req: any) {
    await this.svc.markAllRead(req.user.userId);
    return { success: true };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id') id: string, @Request() req: any) {
    await this.svc.markRead(id, req.user.userId);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.svc.delete(id, req.user.userId);
    return { success: true };
  }

  /* ─── Admin: integration config ─────────────────────────────────────── */

  @Get('config')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Get notification integration config' })
  async getConfig(@Request() req: any) {
    return this.admin.getConfig(req.user.companyId);
  }

  @Patch('config')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification integration config' })
  async setConfig(@Request() req: any, @Body() body: Record<string, unknown>) {
    return this.admin.setConfig(req.user.companyId, body);
  }

  @Post('test')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test notification on a channel' })
  async testChannel(
    @Request() req: any,
    @Body() body: { channel: 'email' | 'slack' | 'intercom' },
  ) {
    if (!body.channel) throw new BadRequestException('channel is required');
    await this.admin.testChannel(body.channel, req.user.userId);
    return { success: true };
  }

  /* ─── Admin: templates ───────────────────────────────────────────────── */

  @Get('templates')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'List notification templates' })
  async listTemplates(@Request() req: any) {
    return this.admin.listTemplates(req.user.companyId);
  }

  @Post('template')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a notification template' })
  async createTemplate(@Request() req: any, @Body() body: any) {
    return this.admin.createTemplate(req.user.companyId, body);
  }

  @Put('template/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a notification template' })
  async updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateTemplate(id, body);
  }

  @Delete('template/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification template' })
  async deleteTemplate(@Param('id') id: string) {
    await this.admin.deleteTemplate(id);
    return { success: true };
  }

  /* ─── Admin: campaigns ───────────────────────────────────────────────── */

  @Get('campaigns')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'List notification campaigns' })
  async listCampaigns(@Request() req: any) {
    return this.admin.listCampaigns(req.user.companyId);
  }

  @Post('campaign')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a notification campaign' })
  async createCampaign(@Request() req: any, @Body() body: any) {
    return this.admin.createCampaign(req.user.companyId, body);
  }

  @Post('campaign/:id/send')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch a campaign immediately' })
  async sendCampaign(@Param('id') id: string, @Request() req: any) {
    return this.admin.sendCampaign(id, req.user.userId);
  }

  /* ─── Admin: send a one-off notification ────────────────────────────── */

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a one-off notification to a user' })
  async send(
    @Body() body: {
      userId: string;
      title: string;
      body: string;
      type?: string;
      link?: string;
      channels?: string[];
    },
  ) {
    if (!body.userId || !body.title || !body.body) {
      throw new BadRequestException('userId, title, and body are required');
    }
    await this.svc.dispatchDirect({
      userId:   body.userId,
      title:    body.title,
      message:  body.body,
      link:     body.link,
      channels: (body.channels as any) ?? ['in_app'],
    });
    return { success: true };
  }
}
