/**
 * HelpdeskController — real Prisma-backed helpdesk ticket management.
 *
 * Tickets are stored as Notification records with:
 *   type = 'HELPDESK' (a supported NotificationType value)
 *   title = ticket subject
 *   message = ticket body
 *   link = optional ticket reference URL
 *
 * This avoids adding a new model while keeping the data persistent and queryable.
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

@ApiTags('helpdesk')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('helpdesk')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('notifications:read')
export class HelpdeskController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('tickets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List helpdesk tickets' })
  async getTickets(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    // Tickets stored as Notifications with type 'HELPDESK'
    // isRead=false → open, isRead=true → resolved
    const where: any = { type: 'HELPDESK' };
    if (companyId) where.companyId = companyId;
    if (status === 'OPEN')     where.isRead = false;
    if (status === 'RESOLVED') where.isRead = true;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Map notification fields to ticket-shaped response
    const tickets = data.map((n: any) => ({
      id:        n.id,
      subject:   n.title,
      message:   n.message,
      status:    n.isRead ? 'RESOLVED' : 'OPEN',
      priority:  n.link ?? 'NORMAL',
      companyId: n.companyId,
      userId:    n.userId,
      createdAt: n.createdAt,
    }));

    return {
      success: true,
      data: { data: tickets, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Get('tickets/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Helpdesk ticket statistics' })
  async getStats(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = { type: 'HELPDESK' };
    if (companyId) where.companyId = companyId;

    const [total, open, resolved] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
      this.prisma.notification.count({ where: { ...where, isRead: true } }),
    ]);
    return { success: true, data: { total, open, resolved } };
  }

  @Get('tickets/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a helpdesk ticket by ID' })
  async getTicket(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { id, type: 'HELPDESK' };
    if (companyId) where.companyId = companyId;
    const n = await this.prisma.notification.findFirst({ where });
    if (!n) throw new NotFoundException(`Ticket ${id} not found`);
    return {
      success: true,
      data: {
        id: n.id, subject: n.title, message: n.message,
        status: n.isRead ? 'RESOLVED' : 'OPEN',
        priority: (n as any).link ?? 'NORMAL',
        companyId: n.companyId, userId: n.userId, createdAt: n.createdAt,
      },
    };
  }

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a helpdesk ticket' })
  async createTicket(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.subject && !body.title) throw new BadRequestException('subject is required');
    const n = await this.prisma.notification.create({
      data: {
        companyId,
        userId:  (body.userId  as string | undefined) ?? req?.user?.userId ?? null,
        type:    'HELPDESK' as any,
        title:   (body.subject ?? body.title) as string,
        message: (body.message ?? body.description ?? '') as string,
        link:    (body.priority as string | undefined) ?? 'NORMAL',
        isRead:  false,
      } as any,
    });
    return {
      success: true,
      data: {
        id: n.id, subject: n.title, message: n.message,
        status: 'OPEN', priority: (n as any).link ?? 'NORMAL',
        companyId: n.companyId, createdAt: n.createdAt,
      },
    };
  }

  @Patch('tickets/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a ticket (change status, subject, message)' })
  async updateTicket(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const where: any = { id, type: 'HELPDESK' };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.notification.findFirst({ where });
    if (!existing) throw new NotFoundException(`Ticket ${id} not found`);

    const updateData: any = {};
    if (body.subject || body.title) updateData.title   = (body.subject ?? body.title) as string;
    if (body.message)               updateData.message = body.message as string;
    if (body.status === 'RESOLVED') updateData.isRead  = true;
    if (body.status === 'OPEN')     updateData.isRead  = false;
    if (body.priority)              updateData.link    = body.priority as string;

    const n = await this.prisma.notification.update({ where: { id }, data: updateData });
    return {
      success: true,
      data: {
        id: n.id, subject: n.title, message: n.message,
        status: n.isRead ? 'RESOLVED' : 'OPEN',
        priority: (n as any).link ?? 'NORMAL',
        companyId: n.companyId, createdAt: n.createdAt,
      },
    };
  }

  @Delete('tickets/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a helpdesk ticket' })
  async deleteTicket(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { id, type: 'HELPDESK' };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.notification.findFirst({ where });
    if (!existing) throw new NotFoundException(`Ticket ${id} not found`);
    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }
}
