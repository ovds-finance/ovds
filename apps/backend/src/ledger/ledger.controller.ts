/**
 * LedgerController — Journal Entry & General Ledger CRUD
 *
 * Serves the `/accounting/journal-entries` and `/accounting/ledger` routes
 * consumed by the frontend JournalEntries, DoubleEntry, TrialBalance and
 * SubLedger pages.
 *
 * Double-entry integrity rule: every POST/PUT that creates journal entries
 * validates sum(debit) == sum(credit) before persisting. Any imbalance returns
 * HTTP 422 Unprocessable Entity so the frontend can prompt the user to fix the
 * entry before it reaches the database.
 *
 * Company context is resolved from x-company-id header (preferred) or the
 * authenticated user's companyId JWT claim.
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';
import { Prisma } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleSubscriptionGuard, RequiredModule } from '../auth/guards/module-subscription.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';


function resolveCompany(
  headers: Record<string, string | undefined>,
  req: any,
): string | undefined {
  return (headers['x-company-id'] as string | undefined) || req?.user?.companyId;
}

interface JournalLineInput {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  taxType?: string;
  costCenterId?: string;
}

interface CreateJournalEntryDto {
  date: string;
  description: string;
  reference?: string;
  period?: string;
  bookType?: string;
  lines: JournalLineInput[];
}

function validateDoubleEntry(lines: JournalLineInput[]): void {
  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  // Allow 1-cent rounding tolerance
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new UnprocessableEntityException(
      `Journal entry is not balanced: total debit ${totalDebit.toFixed(2)} ≠ total credit ${totalCredit.toFixed(2)}. ` +
      'Every journal entry must have equal debits and credits (double-entry principle).',
    );
  }
  if (lines.length < 2) {
    throw new BadRequestException('A journal entry requires at least two lines (one debit and one credit).');
  }
}

@ApiTags('accounting')
@ApiHeader({ name: 'x-company-id', description: 'Active company context', required: false })
@RequiredModule('double-entry')
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LedgerController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Journal Entries ────────────────────────────────────────────────────────

  @Get('journal-entries')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List journal entries with optional period and status filters' })
  async listJournalEntries(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('status') status?: string,
    @Query('bookType') bookType?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1, take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }

    const where: Prisma.JournalEntryWhereInput = { companyId };
    if (period) where.period = period;
    if (status) where.status = status;
    if (bookType) where.bookType = bookType;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, Math.max(1, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT));
    const skip = (pageNum - 1) * takeNum;

    const [total, entries] = await Promise.all([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        include: {
          journalLine: { include: { account: true } },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: takeNum,
      }),
    ]);

    return {
      success: true,
      data: {
        data: entries,
        pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) },
      },
    };
  }

  @Get('journal-entries/:id')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single journal entry with its lines' })
  async getJournalEntry(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
      include: {
        journalLine: { include: { account: true, costCenter: true } },
        ledgerEntries: { include: { account: true } },
      },
    });
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    return { success: true, data: entry };
  }

  @Post('journal-entries')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a balanced journal entry (double-entry enforced)' })
  async createJournalEntry(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: CreateJournalEntryDto,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    if (!body.description) throw new BadRequestException('description is required');
    if (!body.date) throw new BadRequestException('date is required');
    if (!Array.isArray(body.lines) || body.lines.length < 2) {
      throw new BadRequestException('At least two journal lines are required');
    }

    validateDoubleEntry(body.lines);

    const entry = await this.prisma.$transaction(async (tx) => {
      const je = await tx.journalEntry.create({
        data: {
          date: new Date(body.date),
          description: body.description,
          reference: body.reference,
          period: body.period ?? body.date.slice(0, 7),
          status: 'POSTED',
          bookType: body.bookType ?? null,
          companyId,
          postedBy: req?.user?.userId ?? null,
          journalLine: {
            create: body.lines.map((l) => ({
              accountId: l.accountId,
              description: l.description,
              debit: new Prisma.Decimal(l.debit || 0),
              credit: new Prisma.Decimal(l.credit || 0),
              taxType: l.taxType as any ?? null,
              costCenterId: l.costCenterId ?? null,
              companyId,
            })),
          },
        },
        include: { journalLine: { include: { account: true } } },
      });

      // Post immutable ledger entries — one per journal line
      await tx.ledgerEntry.createMany({
        data: je.journalLine.map((jl) => ({
          journalEntryId: je.id,
          accountId: jl.accountId,
          companyId,
          debit: jl.debit,
          credit: jl.credit,
        })),
      });

      return je;
    });

    return { success: true, data: entry };
  }

  @Patch('journal-entries/:id')
  @Roles('ADMIN', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update journal entry metadata (description, reference) — lines are immutable once posted' })
  async updateJournalEntry(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { description?: string; reference?: string; bookType?: string },
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Journal entry ${id} not found`);

    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.reference !== undefined && { reference: body.reference }),
        ...(body.bookType !== undefined && { bookType: body.bookType }),
      },
      include: { journalLine: true },
    });

    return { success: true, data: updated };
  }

  @Delete('journal-entries/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void a journal entry (marks status=VOIDED, never physically deleted)' })
  async voidJournalEntry(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Journal entry ${id} not found`);
    if (existing.status === 'VOIDED') {
      throw new BadRequestException('Journal entry is already voided');
    }

    const voided = await this.prisma.journalEntry.update({
      where: { id },
      data: { status: 'VOIDED' },
    });

    return { success: true, data: voided };
  }

  // ── Chart of Accounts ──────────────────────────────────────────────────────

  @Get('accounts')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the chart of accounts for the company' })
  async listAccounts(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: [] };

    const where: Prisma.AccountWhereInput = { companyId };
    if (type) where.type = type as any;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: [{ code: 'asc' }],
    });

    return { success: true, data: accounts };
  }

  @Get('accounts/:id')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get account by ID with sub-accounts and recent ledger entries' })
  async getAccount(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const account = await this.prisma.account.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
      include: {
        subAccounts: true,
        ledgerEntries: {
          orderBy: { journalEntry: { date: 'desc' } },
          take: 50,
          include: { journalEntry: true },
        },
      },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return { success: true, data: account };
  }

  @Post('accounts')
  @Roles('ADMIN', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account in the chart of accounts' })
  async createAccount(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: {
      code: string;
      name: string;
      type: string;
      category: string;
      description?: string;
      parentId?: string;
      isLeaf?: boolean;
      allowPosting?: boolean;
    },
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    if (!body.code) throw new BadRequestException('Account code is required');
    if (!body.name) throw new BadRequestException('Account name is required');

    const existing = await this.prisma.account.findFirst({
      where: { code: body.code, companyId },
    });
    if (existing) throw new BadRequestException(`Account code ${body.code} already exists`);

    const account = await this.prisma.account.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type as any,
        category: body.category as any,
        description: body.description,
        parentId: body.parentId ?? null,
        isLeaf: body.isLeaf ?? true,
        allowPosting: body.allowPosting ?? true,
        companyId,
      },
    });

    return { success: true, data: account };
  }

  @Patch('accounts/:id')
  @Roles('ADMIN', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an account (name, description, active state)' })
  async updateAccount(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; isActive?: boolean; allowPosting?: boolean },
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.account.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Account ${id} not found`);

    const updated = await this.prisma.account.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.allowPosting !== undefined && { allowPosting: body.allowPosting }),
      },
    });

    return { success: true, data: updated };
  }

  // ── General Ledger / Trial Balance ─────────────────────────────────────────

  @Get('ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'General ledger — all ledger entries for a company, filterable by account and period' })
  async getGeneralLedger(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('accountId') accountId?: string,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: [] };

    const where: Prisma.LedgerEntryWhereInput = { companyId };
    if (accountId) where.accountId = accountId;
    if (period) where.journalEntry = { period };

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      include: {
        account: true,
        journalEntry: true,
      },
      orderBy: { journalEntry: { date: 'desc' } },
      take: 500,
    });

    return { success: true, data: entries };
  }

  @Get('trial-balance')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trial balance — sum of debits and credits per account for a period' })
  async getTrialBalance(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: [] };

    const where: Prisma.LedgerEntryWhereInput = { companyId };
    if (period) where.journalEntry = { period };

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      include: { account: { select: { id: true, code: true, name: true, type: true, category: true } } },
    });

    // Aggregate per account
    const accountMap = new Map<string, {
      accountId: string; code: string; name: string; type: string; category: string;
      totalDebit: number; totalCredit: number;
    }>();

    for (const e of entries) {
      const key = e.accountId;
      if (!accountMap.has(key)) {
        accountMap.set(key, {
          accountId: e.accountId,
          code: e.account.code,
          name: e.account.name,
          type: e.account.type,
          category: e.account.category,
          totalDebit: 0,
          totalCredit: 0,
        });
      }
      const row = accountMap.get(key)!;
      row.totalDebit += e.debit.toNumber();
      row.totalCredit += e.credit.toNumber();
    }

    const rows = Array.from(accountMap.values()).map((r) => ({
      ...r,
      balance: r.totalDebit - r.totalCredit,
      totalDebit: Math.round(r.totalDebit * 100) / 100,
      totalCredit: Math.round(r.totalCredit * 100) / 100,
    }));

    const grandTotalDebit = rows.reduce((s, r) => s + r.totalDebit, 0);
    const grandTotalCredit = rows.reduce((s, r) => s + r.totalCredit, 0);
    const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

    return {
      success: true,
      data: {
        rows: rows.sort((a, b) => a.code.localeCompare(b.code)),
        summary: {
          totalDebit: Math.round(grandTotalDebit * 100) / 100,
          totalCredit: Math.round(grandTotalCredit * 100) / 100,
          isBalanced,
          period: period ?? null,
        },
      },
    };
  }
}
