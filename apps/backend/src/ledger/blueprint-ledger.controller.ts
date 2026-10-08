import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
  Query,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';
import { LedgerService } from './ledger.service';
import { CreateLedgerEntryDTO } from '@ovds/dto';

function resolveCompany(headers: Record<string, string | undefined>, req: any): string | undefined {
  return (headers['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('accounting')
@ApiHeader({ name: 'x-company-id', description: 'Active company context', required: false })
@Controller('accounting/ledgers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlueprintLedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Post a balanced double-entry ledger transaction' })
  async recordTransaction(
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: CreateLedgerEntryDTO,
  ) {
    const companyId = resolveCompany(headers, null);
    if (!companyId) throw new BadRequestException('x-company-id header is required');

    // 1. Structural Layer Inputs Validation Checks
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException(
        'A valid ledger entry must contain at least 2 balanced journal lines.',
      );
    }

    const enriched: CreateLedgerEntryDTO = { ...dto, companyId };
    return this.ledgerService.postJournalEntry(enriched);
  }

  @Get('accounts')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get chart of accounts for the active company' })
  async listAccounts(
    @Headers() headers: Record<string, string | undefined>,
    @Query('type') type?: string,
  ) {
    const companyId = resolveCompany(headers, null);
    if (!companyId) return { success: true, data: [] };

    const where: Record<string, unknown> = { companyId };
    if (type) where.type = type;

    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: [{ code: 'asc' }],
    });

    return { success: true, data: accounts };
  }
}
