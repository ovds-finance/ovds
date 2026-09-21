/**
 * LoyaltyController — real Prisma-backed loyalty program management.
 *
 * Programs  → LoyaltyTierConfig  (tier definitions with benefits + multipliers)
 * Members   → CustomerLoyalty    (per-customer loyalty account + points balance)
 * Rewards   → LoyaltyTransaction (point-earn and redemption events)
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

@ApiTags('loyalty')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('loyalty')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('loyalty:read')
export class LoyaltyController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Programs (LoyaltyTierConfig) ─────────────────────────────────────────

  @Get('programs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loyalty tier programs' })
  async getPrograms(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.loyaltyTierConfig.findMany({
      where,
      orderBy: { minPoints: 'asc' },
    });
    return { success: true, data };
  }

  @Get('programs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a loyalty tier by ID' })
  async getProgram(@Param('id') id: string) {
    const data = await this.prisma.loyaltyTierConfig.findUnique({ where: { id } });
    if (!data) throw new NotFoundException(`Loyalty program ${id} not found`);
    return { success: true, data };
  }

  @Post('programs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a loyalty tier configuration' })
  async createProgram(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.name) throw new BadRequestException('name is required');
    if (!body.tier) throw new BadRequestException('tier (BRONZE|SILVER|GOLD|PLATINUM|DIAMOND) is required');
    const data = await this.prisma.loyaltyTierConfig.create({
      data: { ...body, companyId } as any,
    });
    return { success: true, data };
  }

  @Patch('programs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a loyalty tier' })
  async updateProgram(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.prisma.loyaltyTierConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Loyalty program ${id} not found`);
    const data = await this.prisma.loyaltyTierConfig.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('programs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a loyalty tier' })
  async deleteProgram(@Param('id') id: string) {
    const existing = await this.prisma.loyaltyTierConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Loyalty program ${id} not found`);
    await this.prisma.loyaltyTierConfig.delete({ where: { id } });
    return { success: true };
  }

  // ── Members (CustomerLoyalty) ─────────────────────────────────────────────

  @Get('members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loyalty members' })
  async getMembers(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('tier') tier?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (tier)      where.currentTier = tier;

    const [data, total] = await Promise.all([
      this.prisma.customerLoyalty.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { totalPoints: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          loyaltyTierConfig: { select: { name: true, multiplier: true } },
        },
      }),
      this.prisma.customerLoyalty.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Get('members/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a loyalty member by CustomerLoyalty ID or customerId' })
  async getMember(@Param('id') id: string) {
    const data = await this.prisma.customerLoyalty.findFirst({
      where: { OR: [{ id }, { customerId: id }] },
      include: {
        customer: true,
        loyaltyTierConfig: true,
        loyaltyTransaction: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!data) throw new NotFoundException(`Loyalty member ${id} not found`);
    return { success: true, data };
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enroll a customer in the loyalty program' })
  async enrollMember(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.customerId) throw new BadRequestException('customerId is required');
    const data = await this.prisma.customerLoyalty.create({
      data: {
        ...body,
        companyId,
        currentTier: (body.currentTier as any) ?? 'BRONZE',
        totalPoints: 0,
        lifetimePoints: 0,
        balance: 0,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('members/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a loyalty member record' })
  async updateMember(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.prisma.customerLoyalty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Loyalty member ${id} not found`);
    const data = await this.prisma.customerLoyalty.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  // ── Rewards / Transactions (LoyaltyTransaction) ───────────────────────────

  @Get('rewards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loyalty point transactions (earn and redeem events)' })
  async getRewards(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('type') type?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (type)      where.type      = type;

    const [data, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
        include: { customerLoyalty: { include: { customer: { select: { name: true } } } } },
      }),
      this.prisma.loyaltyTransaction.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Post('rewards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue or redeem loyalty points' })
  async createReward(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.customerLoyaltyId) throw new BadRequestException('customerLoyaltyId is required');
    if (!body.points)            throw new BadRequestException('points is required');
    if (!body.type)              throw new BadRequestException('type (EARN|REDEEM|EXPIRE|ADJUST) is required');
    if (!body.reason)            throw new BadRequestException('reason is required');

    const txn = await this.prisma.loyaltyTransaction.create({
      data: { ...body, companyId } as any,
    });

    // Update member's running balance
    const delta = ['EARN', 'BONUS', 'REFERRAL'].includes(body.type as string)
      ? Number(body.points)
      : -Math.abs(Number(body.points));

    await this.prisma.customerLoyalty.update({
      where: { id: body.customerLoyaltyId as string },
      data: {
        totalPoints:    { increment: delta > 0 ? delta : 0 } as any,
        lifetimePoints: { increment: delta > 0 ? delta : 0 } as any,
        balance:        { increment: delta } as any,
      } as any,
    });

    return { success: true, data: txn };
  }
}
