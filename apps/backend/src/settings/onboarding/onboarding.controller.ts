/**
 * OnboardingController — real Prisma-backed onboarding flow management.
 * Queries the OnboardingResponse model.
 */
import {
  Controller, Get, Post, Body, Patch, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../common/prisma.service';

function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('onboarding')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnboardingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get onboarding status for the current user' })
  async getOnboarding(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const userId = req?.user?.userId;
    const record = userId
      ? await this.prisma.onboardingResponse.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }).catch(() => null)
      : null;

    const step = (record as any)?.step ?? 'WELCOME';
    const completed = (record as any)?.completedAt != null;
    return {
      success: true,
      data: {
        completed,
        step,
        record: record ?? null,
      },
    };
  }

  @Get('list')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all onboarding responses (admin)' })
  async listOnboardings(
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    const where: any = {};
    if (status)     where.status     = status;
    if (assignedTo) where.assignedTo = assignedTo;
    const data = await this.prisma.onboardingResponse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit or update onboarding response' })
  async submitOnboarding(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const userId = (body.userId as string | undefined) ?? req?.user?.userId;
    const step   = (body.step   as string | undefined) ?? 'WELCOME';

    const data = await this.prisma.onboardingResponse.create({
      data: {
        ...body,
        userId,
        step,
        status:      (body.status as string | undefined) ?? 'PENDING',
        submittedBy: (body.submittedBy as string | undefined) ?? userId ?? null,
        data:        body.data ? (typeof body.data === 'string' ? body.data : JSON.stringify(body.data)) : '{}',
      } as any,
    });
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an onboarding response (admin use)' })
  async updateOnboarding(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.onboardingResponse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Onboarding record ${id} not found`);
    const updateData: any = { ...body };
    if (body.status === 'COMPLETED' && !(existing as any).completedAt) {
      updateData.completedAt = new Date();
    }
    const data = await this.prisma.onboardingResponse.update({ where: { id }, data: updateData });
    return { success: true, data };
  }
}
