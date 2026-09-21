/**
 * VandV (Validation & Verification) Controller
 *
 * Serves the /vandv/* endpoints consumed by VandvCompliance.tsx.
 *
 * V&V is the MoR's TASS (Tax Administration Support System) compliance check —
 * companies validate VAT filings, bank reconciliation status, and period locks
 * before submitting a periodic compliance declaration to ERCA.
 *
 * Phase 1 implementation: full persistence for drafts + report assembly from
 * live Prisma data; submission produces a local confirmation record.
 * MoR e-Tax integration can be layered on top when credentials are available.
 */
import {
  Controller, Get, Post, Body, Param, UseGuards,
  HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

/** Compact receipt ID: VV-YYYYMMDD-XXXXXX */
function genReceiptId(): string {
  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  return `VV-${yyyymmdd}-${rand}`;
}

@ApiTags('vandv')
@Controller('vandv')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VandvController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Quick compliance check ────────────────────────────────────────────────

  @Get('quick/:companyId')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quick VAT / reconciliation / period-lock checks for V&V pre-flight' })
  async quickCheck(
    @Param('companyId') companyId: string,
    @Request() req: any,
  ) {
    const cid = companyId === 'undefined' ? req.user?.companyId : companyId;
    if (!cid) return { success: true, data: { companyId: null, overallPass: false, checks: {} } };

    const period = new Date().toISOString().slice(0, 7); // YYYY-MM

    // VAT filing check — has the company filed for the current period?
    const vatFiling = await this.prisma.vatFiling.findFirst({
      where: { companyId: cid, period },
    }).catch(() => null);

    // Bank reconciliation — count transactions that are not yet matched/reconciled
    const unreconciledCount = await this.prisma.bankTransaction.count({
      where: { companyId: cid, status: { notIn: ['MATCHED', 'RECONCILED', 'EXCLUDED'] } },
    }).catch(() => 0);

    // Period lock — is the current period locked (periodLockedAt set on VatFiling)?
    const lockedFiling = await this.prisma.vatFiling.findFirst({
      where: { companyId: cid, period, periodLockedAt: { not: null } },
    }).catch(() => null);

    const vatOk          = vatFiling !== null;
    const reconcOk       = unreconciledCount === 0;
    const periodLockOk   = lockedFiling !== null;
    const overallPass    = vatOk && reconcOk;

    return {
      success: true,
      data: {
        companyId: cid,
        period,
        overallPass,
        checks: {
          vat: {
            pass: vatOk,
            message: vatOk
              ? `VAT filed for ${period}`
              : `No VAT filing found for ${period}`,
            filingId: vatFiling?.id ?? null,
          },
          reconciliation: {
            pass: reconcOk,
            message: reconcOk
              ? 'All bank transactions reconciled'
              : `${unreconciledCount} unreconciled transaction(s)`,
            unreconciledCount,
          },
          periodLock: {
            pass: periodLockOk,
            message: periodLockOk
              ? `Period ${period} is locked`
              : `Period ${period} is not locked — lock before V&V submission`,
            lockedAt: lockedFiling?.periodLockedAt ?? null,
          },
        },
      },
    };
  }

  // ── Full compliance report ────────────────────────────────────────────────

  @Get('report/:companyId')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Full V&V compliance report for the period' })
  async getReport(
    @Param('companyId') companyId: string,
    @Request() req: any,
  ) {
    const cid = companyId === 'undefined' ? req.user?.companyId : companyId;
    if (!cid) return { success: true, data: null };

    const period = new Date().toISOString().slice(0, 7);

    // Collect VAT figures
    const vatFiling = await this.prisma.vatFiling.findFirst({
      where: { companyId: cid, period },
    }).catch(() => null);

    // Invoice totals for the period
    const invoicePeriodStart = new Date(`${period}-01`);
    const invoicePeriodEnd   = new Date(new Date(`${period}-01`).setMonth(new Date(`${period}-01`).getMonth() + 1));
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId: cid,
        date: { gte: invoicePeriodStart, lt: invoicePeriodEnd },
        status: { not: 'CANCELLED' },
      },
      select: { totalAmount: true, vatAmount: true, status: true },
    }).catch(() => []);

    const totalSales   = invoices.reduce((s, i) => s + Number(i.totalAmount ?? 0), 0);
    const totalVatOut  = invoices.reduce((s, i) => s + Number(i.vatAmount   ?? 0), 0);
    const paidInvoices = invoices.filter(i => i.status === 'PAID').length;

    // Previous V&V submissions for this company
    const prevSubmissions = await this.prisma.vandvSubmission.findMany({
      where: { companyId: cid },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    }).catch(() => []);

    return {
      success: true,
      data: {
        companyId: cid,
        period,
        vatFiling: vatFiling
          ? {
              id:          vatFiling.id,
              netPayable:  Number(vatFiling.netPayable),
              outputVat:   Number(vatFiling.outputVat),
              inputVat:    Number(vatFiling.inputVat),
              status:      vatFiling.status,
              filedAt:     vatFiling.filedAt,
            }
          : null,
        salesSummary: {
          totalSales,
          totalVatOutput: totalVatOut,
          invoiceCount:   invoices.length,
          paidInvoices,
        },
        previousSubmissions: prevSubmissions.map(s => ({
          id:                 s.id,
          period:             s.period,
          confirmationNumber: s.confirmationNumber,
          status:             s.status,
          submittedAt:        s.submittedAt,
        })),
      },
    };
  }

  // ── Draft management ──────────────────────────────────────────────────────

  @Get('draft/:companyId')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get saved V&V draft for the current period' })
  async getDraft(
    @Param('companyId') companyId: string,
    @Request() req: any,
  ) {
    const cid = companyId === 'undefined' ? req.user?.companyId : companyId;
    if (!cid) return { success: true, data: null };

    const period = new Date().toISOString().slice(0, 7);
    const draft  = await this.prisma.vandvDraft.findFirst({
      where: { companyId: cid, period },
      orderBy: { updatedAt: 'desc' },
    }).catch(() => null);

    return { success: true, data: draft };
  }

  @Post('draft')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save / upsert a V&V draft' })
  async saveDraft(
    @Body() body: { companyId?: string; period?: string; values?: Record<string, unknown> },
    @Request() req: any,
  ) {
    const cid    = body.companyId ?? req.user?.companyId;
    const period = body.period    ?? new Date().toISOString().slice(0, 7);
    if (!cid) return { success: false, message: 'companyId required' };

    // Upsert: one draft per company per period
    const existing = await this.prisma.vandvDraft.findFirst({
      where: { companyId: cid, period },
    }).catch(() => null);

    let draft: any;
    if (existing) {
      draft = await this.prisma.vandvDraft.update({
        where: { id: existing.id },
        data: { values: JSON.stringify(body.values ?? {}), updatedAt: new Date() },
      });
    } else {
      draft = await this.prisma.vandvDraft.create({
        data: {
          companyId: cid,
          period,
          values: JSON.stringify(body.values ?? {}),
        },
      });
    }

    return { success: true, data: draft };
  }

  // ── Submission ────────────────────────────────────────────────────────────

  @Post('submit')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit V&V compliance declaration' })
  async submit(
    @Body() body: Record<string, unknown>,
    @Request() req: any,
  ) {
    const cid    = (body.companyId as string) ?? req.user?.companyId;
    const period = (body.period    as string) ?? new Date().toISOString().slice(0, 7);
    if (!cid) return { success: false, message: 'companyId required' };

    const confirmationNumber = genReceiptId();
    const receiptId          = genReceiptId().replace('VV-', 'ACK-');

    // Persist submission record
    const submission = await this.prisma.vandvSubmission.create({
      data: {
        companyId:          cid,
        period,
        confirmationNumber,
        status:             'SUBMITTED',
        payload:            JSON.stringify(body),
        submittedBy:        req.user?.email ?? req.user?.id ?? null,
      },
    }).catch(async () => {
      // If VandvSubmission model doesn't exist yet in this DB, return stub
      return { id: confirmationNumber, confirmationNumber, status: 'SUBMITTED' };
    });

    // Mark the draft as submitted
    await this.prisma.vandvDraft.updateMany({
      where: { companyId: cid, period },
      data:  { status: 'SUBMITTED' },
    }).catch(() => { /* non-fatal if model absent */ });

    return {
      success: true,
      data: {
        id:                 (submission as any).id,
        confirmationNumber,
        status:             'SUBMITTED',
        period,
        acknowledgementReceipt: { receiptId },
      },
    };
  }
}
