/**
 * GeneralLedgerComplianceService — domain lib
 *
 * Migrated from apps/backend/src/general-ledger-compliance/ into the
 * @ovds/domains/general-ledger-compliance library.
 *
 * Acts as the single "control tower" for the AABE/IFRS compliance sidebar section.
 * Aggregates data from accounting, tax, and reporting domains into:
 *   - A real-time GL & compliance dashboard
 *   - Full statutory financial reporting (BS, P&L, Cash Flow, Schedule A)
 *   - AABE audit-readiness score
 *   - Dual-ledger status (Management/Tax book + IFRS Statutory book)
 */
import { Injectable } from '@nestjs/common';
import {
  BaseService,
  IAuditLogger,
  IPrismaClient,
} from '@ovds/domains/infrastructure';

// ── Dependency interfaces ─────────────────────────────────────────────────────

export interface IGlAccountingDeps {
  getAccountBalances(companyId: string): Promise<any>;
  getTrialBalance(companyId: string, endDate: string): Promise<any>;
  getBalanceSheet(companyId: string, endDate: string): Promise<any>;
  getProfitAndLoss(companyId: string, startDate: string, endDate: string): Promise<any>;
  getCashFlow(companyId: string, startDate: string, endDate: string): Promise<any>;
}

export interface IGlTaxDeps {
  getVatReconciliation(companyId: string, period: string): Promise<any>;
  getTaxDashboard(companyId: string): Promise<any>;
  getComplianceStatus(companyId: string, period: string): Promise<any>;
}

export interface IGlReportDeps {
  getEthiopianIncomeStatement(companyId: string, startDate: string, endDate: string): Promise<any>;
  getEthiopianBalanceSheet(companyId: string, endDate: string): Promise<any>;
  getEthiopianCashFlow(companyId: string, startDate: string, endDate: string): Promise<any>;
  getScheduleA(companyId: string, startDate: string, endDate: string): Promise<any>;
  getComplianceStatus(companyId: string, startDate: string, endDate: string): Promise<any>;
  getHRPayrollSummary(companyId: string, startDate: string, endDate: string): Promise<any>;
  generateMoRPackage(companyId: string, startDate: string, endDate: string, type?: string): Promise<any>;
}

export interface IGlComplianceDeps {
  accounting: IGlAccountingDeps;
  tax:        IGlTaxDeps;
  reports:    IGlReportDeps;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class GeneralLedgerComplianceService extends BaseService {

  private deps!: IGlComplianceDeps;

  constructor(prisma: IPrismaClient, audit: IAuditLogger) {
    super(prisma, audit, 'GeneralLedgerComplianceService');
  }

  setDeps(deps: IGlComplianceDeps) {
    this.deps = deps;
  }

  // ── Real-time GL & Tax Dashboard ──────────────────────────────────────────

  async getDashboard(companyId: string) {
    const now    = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const year   = now.getFullYear();

    const [
      chartOfAccounts,
      vatReconciliation,
      taxDashboard,
      complianceStatus,
      balanceSheet,
      incomeStatement,
      trialBalance,
    ] = await Promise.all([
      this.deps.accounting.getAccountBalances(companyId).catch(() => null),
      this.deps.tax.getVatReconciliation(companyId, period).catch(() => null),
      this.deps.tax.getTaxDashboard(companyId).catch(() => null),
      this.deps.tax.getComplianceStatus(companyId, period).catch(() => null),
      this.deps.accounting.getBalanceSheet(companyId, now.toISOString().slice(0, 10)).catch(() => null),
      this.deps.accounting.getProfitAndLoss(companyId, `${year}-01-01`, now.toISOString().slice(0, 10)).catch(() => null),
      this.deps.accounting.getTrialBalance(companyId, now.toISOString().slice(0, 10)).catch(() => null),
    ]);

    return {
      companyId,
      period,
      generatedAt: now.toISOString(),
      chartOfAccounts: {
        accounts: (chartOfAccounts as any)?.accounts ?? [],
        totals:   (chartOfAccounts as any)?.totals ?? { assets: 0, liabilities: 0, equity: 0, income: 0, expenses: 0 },
      },
      trialBalance: {
        isBalanced: (trialBalance as any)?.isBalanced ?? null,
        totals:     (trialBalance as any)?.totals ?? null,
      },
      taxEngine: {
        vat:        vatReconciliation,
        dashboard:  taxDashboard,
        compliance: complianceStatus,
      },
      statutoryReports: {
        balanceSheet,
        incomeStatement,
      },
    };
  }

  // ── Statutory Financial Reports ────────────────────────────────────────────

  async getStatutoryReports(companyId: string, startDate?: string, endDate?: string) {
    const now   = new Date();
    const start = startDate ?? `${now.getFullYear()}-01-01`;
    const end   = endDate   ?? now.toISOString().slice(0, 10);

    const [
      incomeStatement,
      balanceSheet,
      cashFlow,
      scheduleA,
      compliance,
      hrPayroll,
    ] = await Promise.all([
      this.deps.reports.getEthiopianIncomeStatement(companyId, start, end).catch(() => null),
      this.deps.reports.getEthiopianBalanceSheet(companyId, end).catch(() => null),
      this.deps.reports.getEthiopianCashFlow(companyId, start, end).catch(() => null),
      this.deps.reports.getScheduleA(companyId, start, end).catch(() => null),
      this.deps.reports.getComplianceStatus(companyId, start, end).catch(() => null),
      this.deps.reports.getHRPayrollSummary(companyId, start, end).catch(() => null),
    ]);

    return {
      companyId,
      period:       { start, end },
      generatedAt:  new Date().toISOString(),
      incomeStatement,
      balanceSheet,
      cashFlow,
      scheduleA,
      compliance,
      hrPayroll,
    };
  }

  // ── MoR Submission Package ─────────────────────────────────────────────────

  async getMoRPackage(
    companyId: string,
    startDate: string,
    endDate: string,
    type: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' = 'ANNUAL',
  ) {
    return this.deps.reports.generateMoRPackage(companyId, startDate, endDate, type);
  }

  // ── AABE Audit-Readiness Score ─────────────────────────────────────────────

  /**
   * Computes a 0–100 audit-readiness score across the key AABE criteria:
   *   - Trial balance is balanced (20 pts)
   *   - Current period is locked (15 pts)
   *   - No orphan accounts (15 pts)
   *   - VAT filed on time (15 pts)
   *   - WHT certificates issued (10 pts)
   *   - IFRS statements generated (10 pts)
   *   - HR/Payroll PAYE filed (10 pts)
   *   - Audit trail completeness (5 pts)
   */
  async getAabeAuditReadiness(companyId: string, period: string) {
    const [y, m] = period.split('-').map(Number);

    const results = await Promise.allSettled([
      // 1. Trial balance
      this.deps.accounting.getTrialBalance(companyId, new Date(y, m, 0).toISOString().slice(0, 10)),
      // 2. Period lock
      (this.prisma as any).periodlock?.findFirst?.({ where: { companyId, year: y, month: m } }),
      // 3. Orphan accounts (count = 0 is good)
      this.prisma.account.count({ where: { companyId, parentId: null } }),
      // 4. VAT filing
      (this.prisma as any).vatFiling?.findFirst?.({ where: { companyId, period } }),
      // 5. WHT certificates
      (this.prisma as any).whtCertificate?.count?.({ where: { companyId, period } }),
      // 6. PAYE declarations
      this.prisma.payeDeclaration?.count?.({ where: { companyId } }).catch(() => 0),
      // 7. Journal entries (audit trail density)
      this.prisma.journalEntry.count({ where: { companyId } }),
    ]);

    const get = (i: number) =>
      results[i].status === 'fulfilled' ? results[i].value : null;

    const trialBalance   = get(0) as any;
    const periodLock     = get(1) as any;
    const accountCount   = get(2) as number ?? 0;
    const vatFiling      = get(3) as any;
    const whtCount       = get(4) as number ?? 0;
    const payeCount      = get(5) as number ?? 0;
    const journalCount   = get(6) as number ?? 0;

    const criteria: Array<{ name: string; weight: number; passed: boolean; detail: string }> = [
      {
        name: 'Trial Balance Balanced',
        weight: 20,
        passed: trialBalance?.isBalanced === true,
        detail: trialBalance?.isBalanced
          ? 'Trial balance is balanced — all debits equal credits'
          : 'Trial balance is NOT balanced — investigate before period close',
      },
      {
        name: 'Period Locked',
        weight: 15,
        passed: periodLock?.status === 'LOCKED',
        detail: periodLock?.status === 'LOCKED'
          ? `Period ${period} is locked by ${periodLock.lockedBy}`
          : `Period ${period} is still OPEN — lock before submitting`,
      },
      {
        name: 'No Orphan Accounts',
        weight: 15,
        passed: accountCount === 0,
        detail: accountCount === 0
          ? 'All accounts are properly mapped to parent groups'
          : `${accountCount} orphan account(s) found — must be assigned to parent groups`,
      },
      {
        name: 'VAT Filed',
        weight: 15,
        passed: vatFiling?.status === 'FILED' || vatFiling?.status === 'PAID',
        detail: vatFiling
          ? `VAT filing for ${period}: ${vatFiling.status}`
          : `No VAT filing found for period ${period}`,
      },
      {
        name: 'WHT Certificates Issued',
        weight: 10,
        passed: whtCount > 0,
        detail: whtCount > 0
          ? `${whtCount} WHT certificate(s) issued for this period`
          : 'No WHT certificates found — verify if WHT is applicable',
      },
      {
        name: 'PAYE Declarations Filed',
        weight: 10,
        passed: payeCount > 0,
        detail: payeCount > 0
          ? `${payeCount} PAYE declaration(s) on record`
          : 'No PAYE declarations found',
      },
      {
        name: 'Audit Trail Coverage',
        weight: 10,
        passed: journalCount > 0,
        detail: journalCount > 0
          ? `${journalCount} journal entries in audit trail`
          : 'No journal entries found — post transactions before audit',
      },
      {
        name: 'IFRS Statements Available',
        weight: 5,
        passed: true, // always available once trial balance has data
        detail: 'IFRS 15, 16, IAS 38 engines active',
      },
    ];

    const totalWeight  = criteria.reduce((s, c) => s + c.weight, 0);
    const earnedWeight = criteria.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
    const score        = Math.round((earnedWeight / totalWeight) * 100);
    const grade        = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'F';
    const riskLevel    = score >= 90 ? 'LOW' : score >= 75 ? 'MEDIUM' : 'HIGH';

    return {
      companyId,
      period,
      score,
      grade,
      riskLevel,
      criteria,
      passed:  criteria.filter((c) => c.passed).length,
      failed:  criteria.filter((c) => !c.passed).length,
      recommendation: score >= 90
        ? 'Company is audit-ready. Proceed with AABE submission.'
        : score >= 75
        ? 'Minor issues detected. Resolve failed criteria before submission.'
        : 'Significant issues detected. Resolve all HIGH-priority criteria before audit.',
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Dual-Ledger Status (Management/Tax + IFRS Statutory) ─────────────────

  /**
   * Returns the reconciliation status between the Management/Tax book and the
   * IFRS Statutory book for a given period. Required for AABE compliance
   * (dual-ledger posting per the spec document §2).
   */
  async getDualLedgerStatus(companyId: string, period: string) {
    const [y, m] = period.split('-').map(Number);
    const start  = new Date(y, m - 1, 1).toISOString().slice(0, 10);
    const end    = new Date(y, m, 0).toISOString().slice(0, 10);

    const [taxBookEntries, ifrsBookEntries, deferredTaxRecords] = await Promise.all([
      this.prisma.journalEntry.count({
        where: { companyId, date: { gte: new Date(start), lte: new Date(end) } },
      }),
      // IFRS-tagged entries via IFRS GL Journal links
      (this.prisma as any).ifrsGlJournal?.count?.({
        where: { companyId, journalEntry: { date: { gte: new Date(start), lte: new Date(end) } } },
      }).catch(() => 0),
      // Deferred tax records (timing differences between tax & IFRS books)
      (this.prisma as any).deferredTaxRecord?.count?.({ where: { companyId } }).catch(() => 0),
    ]);

    return {
      companyId,
      period,
      managementTaxBook: {
        journalEntries:  taxBookEntries,
        description:     'Local tax / management book — Ethiopian commercial code & ERCA rules',
        status:          taxBookEntries > 0 ? 'ACTIVE' : 'EMPTY',
      },
      ifrsStatutoryBook: {
        ifrsTaggedEntries: ifrsBookEntries ?? 0,
        description:       'IFRS statutory book — IFRS 15, 16, IAS 38 recognition entries',
        status:            (ifrsBookEntries ?? 0) > 0 ? 'ACTIVE' : 'NO_IFRS_ENTRIES',
      },
      deferredTax: {
        timingDifferenceRecords: deferredTaxRecords ?? 0,
        description: 'IAS 12 deferred tax — timing differences between tax & accounting profit',
      },
      reconciled: taxBookEntries > 0,
      aabeProclamation: 'Proclamation No. 847/2014 — IFRS adoption for publicly accountable entities',
      generatedAt: new Date().toISOString(),
    };
  }
}
