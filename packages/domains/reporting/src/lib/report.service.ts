/**
 * ReportService — Ethiopian IFRS financial statements + MoR submission package.
 * Migrated from apps/backend/src/reporting/report.service.ts into @ovds/domains-reporting.
 *
 * Delegates statement building to the pure builders in @ovds/shared.
 * Accounting data is fetched via IReportAccountingDeps (injected at app level).
 */
import { Injectable } from '@nestjs/common';
import {
  BaseService,
  IAuditLogger,
  IPrismaClient,
} from '@ovds/domains-infrastructure';
import {
  buildAccountingCycle,
  buildIncomeStatement,
  buildBalanceSheet,
  buildCashFlowStatement,
  buildEquityStatement,
  buildScheduleA,
  buildIFRSNotes,
  buildMoRSubmissionPackage,
  ETH_TAX,
} from '@ovds/shared';
import type {
  EthiopianCompanyHeader,
  EthiopianHRSummary,
  EthiopianVATReturn,
  EthiopianWHTSummary,
  EthiopianTOTReturn,
  MoRSubmissionPackage,
} from '@ovds/shared';

/** Accounting methods required by the reporting lib — injected from app level */
export interface IReportAccountingDeps {
  getProfitAndLoss: (companyId: string, startDate: string, endDate: string) => Promise<any>;
  getBalanceSheet: (companyId: string, endDate: string) => Promise<any>;
  getCashFlow: (companyId: string, startDate: string, endDate: string) => Promise<any>;
  getTrialBalance: (companyId: string, endDate: string) => Promise<any>;
}

@Injectable()
export class ReportService extends BaseService {

  constructor(
    prisma: IPrismaClient,
    audit: IAuditLogger,
    private readonly accounting: IReportAccountingDeps,
  ) {
    super(prisma, audit, 'ReportService');
  }

  // ── Main entry point ───────────────────────────────────────────────────────

  async generateMoRPackage(
    companyId: string,
    startDate: string,
    endDate: string,
    submissionType: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' = 'ANNUAL',
  ): Promise<MoRSubmissionPackage> {
    const [pl, bs, cf, tb, company, payrollData, vatData, whtData] = await Promise.all([
      this.accounting.getProfitAndLoss(companyId, startDate, endDate).catch(() => null),
      this.accounting.getBalanceSheet(companyId, endDate).catch(() => null),
      this.accounting.getCashFlow(companyId, startDate, endDate).catch(() => null),
      this.accounting.getTrialBalance(companyId, endDate).catch(() => null),
      this.prisma.company.findFirst({ where: { id: companyId } }),
      this._aggregatePayroll(companyId, startDate, endDate),
      this._aggregateVAT(companyId, startDate, endDate),
      this._aggregateWHT(companyId, startDate, endDate),
    ]);

    const fiscalYear = new Date(endDate).getFullYear();
    const annualRevenue = Number((pl as any)?.income?.total ?? 0);
    const ercaCategory = annualRevenue > 1_000_000 ? 'A' : annualRevenue >= 500_000 ? 'B' : 'C';
    const isVatRegistered = annualRevenue >= 2_000_000;

    const header: EthiopianCompanyHeader = {
      companyId,
      companyName: (company as any)?.name ?? 'Ethiopian Business',
      tin: (company as any)?.tin ?? '0000000000000',
      vatNumber: (company as any)?.vatNumber ?? undefined,
      businessType: ((company as any)?.type as any) ?? 'PLC',
      sector: (company as any)?.industry ?? 'SERVICES',
      address: (company as any)?.location ?? 'Addis Ababa, Ethiopia',
      city: 'Addis Ababa / አዲስ አበባ',
      fiscalYear: `EFY ${fiscalYear - 1}/${fiscalYear}`,
      ifrsStandard: ercaCategory === 'A' ? 'IFRS_FULL' : 'IFRS_SME',
      currency: 'ETB',
      functionalCurrency: 'ETB',
      presentationCurrency: 'ETB',
      roundingUnit: annualRevenue > 10_000_000 ? 'THOUSANDS' : 'BIRR',
      ercaCategory,
      auditRequired: ercaCategory === 'A',
      preparedDate: new Date().toISOString().slice(0, 10),
      preparedBy: 'System — IFRS Reporting Module',
    };

    const plAny = pl as any;
    const grossProfit = Number(plAny?.grossProfit ?? 0);
    const netProfit = Number(plAny?.netProfit ?? 0);
    const totalExpenses = Number(plAny?.expenses?.total ?? 0);
    const revenue = Number(plAny?.income?.total ?? 0);

    const incomeStatement = buildIncomeStatement(header, {
      period: endDate,
      salesOfGoods: Number(plAny?.income?.goods ?? revenue * 0.6),
      servicesRevenue: Number(plAny?.income?.services ?? revenue * 0.4),
      costOfSales: Number(plAny?.expenses?.cogs ?? totalExpenses * 0.45),
      grossSalaries: payrollData.grossPayroll,
      pensionEmployer: payrollData.employerPension,
      gratuityCharge: payrollData.gratuityCharge,
      depreciation: Number(plAny?.expenses?.depreciation ?? 0),
      rentUtilities: Number(plAny?.expenses?.rent ?? 0),
      sellingExpenses: Number(plAny?.expenses?.selling ?? totalExpenses * 0.05),
      adminExpenses: Number(plAny?.expenses?.admin ?? totalExpenses * 0.1),
      eclProvision: Number(plAny?.expenses?.ecl ?? 0),
      vatNonRecoverable: vatData.nonRecoverableVAT,
      totExpense: isVatRegistered ? 0 : vatData.totExpense,
      otherOperatingExpenses: Number(plAny?.expenses?.other ?? 0),
      interestExpense: Number(plAny?.expenses?.interest ?? 0),
      fxGainLoss: Number(plAny?.income?.fxGain ?? 0) - Number(plAny?.expenses?.fxLoss ?? 0),
      annualRevenue: revenue,
    });

    const bsData = bs ?? {};
    const balanceSheet = buildBalanceSheet(header, {
      asAt: endDate,
      cash: Number((bsData as any)?.assets?.cash ?? 0),
      bankDeposits: Number((bsData as any)?.assets?.bank ?? 0),
      tradeReceivables: Number((bsData as any)?.assets?.receivables ?? 0),
      inventories: Number((bsData as any)?.assets?.inventory ?? 0),
      prepaidExpenses: Number((bsData as any)?.assets?.prepaid ?? 0),
      vatInputRecoverable: vatData.inputVAT,
      ppeCost: Number((bsData as any)?.assets?.ppeCost ?? 0),
      ppeAccumDepreciation: Number((bsData as any)?.assets?.ppeAccumDep ?? 0),
      deferredTaxAssets: Number((bsData as any)?.assets?.deferredTax ?? 0),
      tradePayables: Number((bsData as any)?.liabilities?.payables ?? 0),
      vatPayable: vatData.netVATPayable > 0 ? vatData.netVATPayable : 0,
      whtPayable: whtData.outstanding,
      payePayable: payrollData.pitOutstanding,
      pensionPayable: payrollData.pensionOutstanding,
      drrfPayable: payrollData.drrfOutstanding,
      corporateTaxPayable: Math.max(0, incomeStatement.incomeTax.totalIncomeTax),
      accruals: payrollData.accruals,
      gratuityObligation: payrollData.gratuityObligation,
      shareCapital: Number((bsData as any)?.equity?.capital ?? 0),
      retainedEarnings: Number((bsData as any)?.equity?.retained ?? 0),
      currentYearProfit: netProfit,
    });

    const cashFlowStatement = buildCashFlowStatement(header, {
      period: endDate,
      profitBeforeTax: netProfit + Number(incomeStatement.incomeTax.totalIncomeTax),
      depreciation: Number(plAny?.expenses?.depreciation ?? 0),
      ovdsExpense: Number(plAny?.expenses?.interest ?? 0),
      fxUnrealised: 0,
      receivablesChange: Number((cf as any)?.workingCapital?.receivables ?? 0),
      inventoriesChange: Number((cf as any)?.workingCapital?.inventories ?? 0),
      payablesChange: Number((cf as any)?.workingCapital?.payables ?? 0),
      taxPayablesChange: Number((cf as any)?.workingCapital?.taxPayables ?? 0),
      taxPaid: Number((cf as any)?.taxPaid ?? 0),
      purchasePPE: Number((cf as any)?.investing?.purchasePPE ?? 0),
      proceedsDisposal: Number((cf as any)?.investing?.proceeds ?? 0),
      loanProceeds: Number((cf as any)?.financing?.loanProceeds ?? 0),
      loanRepayments: Number((cf as any)?.financing?.loanRepayments ?? 0),
      leasePayments: Number((cf as any)?.financing?.leasePayments ?? 0),
      interestPaid: Number((cf as any)?.financing?.interestPaid ?? 0),
      dividendsPaid: Number((cf as any)?.financing?.dividends ?? 0),
      openingCash: Number((cf as any)?.openingCash ?? 0),
    });

    const equityStatement = buildEquityStatement(header, {
      period: endDate,
      openingShareCapital: Number((bsData as any)?.equity?.capital ?? 0),
      openingRetainedEarnings: Number((bsData as any)?.equity?.retained ?? 0),
      profitForPeriod: netProfit,
      dividendsDeclared: Number((cf as any)?.financing?.dividends ?? 0),
    });

    const profitBeforeTax = netProfit + Number(incomeStatement.incomeTax.totalIncomeTax);
    const scheduleA = buildScheduleA(header, {
      fiscalYear,
      accountingProfitBeforeTax: profitBeforeTax,
      grossRevenue: revenue,
      nonDeductiblePenalties: 0,
      whtCredits: whtData.whtCertificatesReceived,
      provisionalTaxPaid: 0,
      deferredTaxAssets: Number((bsData as any)?.assets?.deferredTax ?? 0),
    });

    const hrSummary: EthiopianHRSummary = {
      reportingPeriod: `${startDate}/${endDate}`,
      totalEmployees: payrollData.employeeCount,
      newHires: payrollData.newHires,
      exits: payrollData.exits,
      trainingParticipants: 0,
      performanceAppraisalCount: 0,
      openRelationsCases: 0,
      payroll: {
        grossPayroll: payrollData.grossPayroll,
        employeePension: payrollData.employeePension,
        employerPension: payrollData.employerPension,
        pitWithheld: payrollData.pitWithheld,
        drrfDeducted: payrollData.drrfTotal,
        netPay: payrollData.netPay,
        pitDeclaredMoR: payrollData.pitDeclared,
        pensionRemittedPFSA: payrollData.pensionRemitted,
        ercaRemittanceRef: payrollData.ercaRef ?? undefined,
        pfsaRemittanceRef: payrollData.pfsaRef ?? undefined,
      },
      compliance: {
        payeFiledOnTime: payrollData.overduePAYE === 0,
        pensionRemittedOnTime: payrollData.overduePension === 0,
        laborLawCompliant: true,
        overduePAYEMonths: payrollData.overduePAYE,
        overduePensionMonths: payrollData.overduePension,
      },
      ias19: {
        shortTermBenefitsExpense: payrollData.grossPayroll,
        gratuityProvision: payrollData.gratuityObligation,
        leaveAccrual: payrollData.leaveAccrual,
        pensionCost: payrollData.employerPension,
      },
    };

    const vatReturn: EthiopianVATReturn | undefined = isVatRegistered ? {
      header, period: endDate.slice(0, 7), taxableSales: revenue, zeroRatedSales: 0, exemptSales: 0,
      outputVAT: vatData.outputVAT, reverseChargeVAT: vatData.reverseChargeVAT,
      claimableInputVAT: vatData.inputVAT, nonClaimableInputVAT: vatData.nonRecoverableVAT,
      netVATPayable: vatData.netVATPayable, withheldVAT: vatData.withheldVAT,
      vatRefundClaim: vatData.refundClaims,
      balanceDue: Math.max(0, vatData.netVATPayable - vatData.withheldVAT),
      dueDate: this._nextVATDueDate(endDate),
    } : undefined;

    const whtSummary: EthiopianWHTSummary = {
      header, period: endDate.slice(0, 7),
      whtOnGoods: whtData.goods, whtOnServices: whtData.services,
      whtOnNonResidentServices: whtData.nonResident, whtOnDividends: whtData.dividends,
      whtOnInterest: whtData.interest, whtOnRent: whtData.rent,
      totalWHT: whtData.total, remittedToMoR: whtData.remitted,
      outstanding: whtData.outstanding, dueDate: this._nextVATDueDate(endDate),
    };

    const totReturn: EthiopianTOTReturn | undefined = !isVatRegistered ? {
      header, period: endDate.slice(0, 7),
      goodsSales: revenue * 0.6, servicesSales: revenue * 0.4, constructionSales: 0,
      totOnGoods: revenue * 0.6 * ETH_TAX.TOT_GOODS_RATE,
      totOnServices: revenue * 0.4 * ETH_TAX.TOT_SERVICES_RATE,
      totOnConstruction: 0,
      totalTOT: revenue * 0.6 * ETH_TAX.TOT_GOODS_RATE + revenue * 0.4 * ETH_TAX.TOT_SERVICES_RATE,
      dueDate: this._nextVATDueDate(endDate),
    } : undefined;

    const notesToAccounts = buildIFRSNotes(header, {
      period: endDate, ifrsStandard: header.ifrsStandard,
      ppeCost: Number((bsData as any)?.assets?.ppeCost ?? 0),
      ppeAccumDep: Number((bsData as any)?.assets?.ppeAccumDep ?? 0),
      ppeAdditions: Number((cf as any)?.investing?.purchasePPE ?? 0),
      ppeDisposals: 0,
      grossSalaries: payrollData.grossPayroll, employeePension: payrollData.employeePension,
      employerPension: payrollData.employerPension, drrfTotal: payrollData.drrfTotal,
      pitWithheld: payrollData.pitWithheld, netPay: payrollData.netPay,
      employeeCount: payrollData.employeeCount,
      vatOutputTotal: vatData.outputVAT, vatInputTotal: vatData.inputVAT,
      vatNetPayable: vatData.netVATPayable, citPayable: scheduleA.finalTaxPayable,
      matApplies: scheduleA.matApplies, whtTotal: whtData.total,
      ecl: Number((pl as any)?.expenses?.ecl ?? 0),
      tradeReceivablesGross: Number((bsData as any)?.assets?.receivables ?? 0),
      gratuityObligation: payrollData.gratuityObligation,
    });

    const accountingCycle = buildAccountingCycle({
      hasIotData: false, hasSrmData: false, hasOfflineSync: false,
      journalCount: Number((tb as any)?.lines?.length ?? 0),
      trialBalanced: (tb as any)?.isBalanced ?? false,
      adjustmentsDone: Number((tb as any)?.lines?.length ?? 0) > 0,
      statementsGenerated: true,
    });

    return buildMoRSubmissionPackage({
      header, incomeStatement, balanceSheet, cashFlowStatement, equityStatement,
      notesToAccounts, scheduleA, vatReturn, whtSummary, totReturn, hrSummary,
      accountingCycle, period: endDate, submissionType,
    });
  }

  // ── Convenience methods ────────────────────────────────────────────────────

  async getEthiopianIncomeStatement(companyId: string, startDate: string, endDate: string) {
    return (await this.generateMoRPackage(companyId, startDate, endDate)).incomeStatement;
  }

  async getEthiopianBalanceSheet(companyId: string, endDate: string) {
    const startDate = `${new Date(endDate).getFullYear()}-01-01`;
    return (await this.generateMoRPackage(companyId, startDate, endDate)).balanceSheet;
  }

  async getEthiopianCashFlow(companyId: string, startDate: string, endDate: string) {
    return (await this.generateMoRPackage(companyId, startDate, endDate)).cashFlowStatement;
  }

  async getScheduleA(companyId: string, startDate: string, endDate: string) {
    return (await this.generateMoRPackage(companyId, startDate, endDate)).scheduleA;
  }

  async getComplianceStatus(companyId: string, startDate: string, endDate: string) {
    return (await this.generateMoRPackage(companyId, startDate, endDate)).compliance;
  }

  async getHRPayrollSummary(companyId: string, startDate: string, endDate: string) {
    return (await this.generateMoRPackage(companyId, startDate, endDate)).hrSummary;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _aggregatePayroll(companyId: string, startDate: string, endDate: string) {
    const [sd, ed] = [new Date(startDate), new Date(endDate)];
    const records = await this.prisma.payrollRecord.findMany({ where: { companyId, createdAt: { gte: sd, lte: ed }, status: { not: 'CANCELLED' } } });

    const grossPayroll = records.reduce((s: number, r: any) => s + Number(r.grossTotal ?? r.grossPay ?? 0), 0);
    const employeePension = records.reduce((s: number, r: any) => s + Number(r.employeePension ?? 0), 0);
    const employerPension = records.reduce((s: number, r: any) => s + Number(r.employerPension ?? 0), 0);
    const pitWithheld = records.reduce((s: number, r: any) => s + Number(r.incomeTax ?? 0), 0);
    const drrfTotal = Math.round(grossPayroll * ETH_TAX.DRRF_RATE * 100) / 100;
    const netPay = records.reduce((s: number, r: any) => s + Number(r.netPay ?? 0), 0);
    const employeeCount = new Set(records.map((r: any) => r.employeeId)).size;

    const payeDecls = await this.prisma.payeDeclaration.findMany({ where: { companyId, createdAt: { gte: sd, lte: ed } } });
    const pitDeclared = payeDecls.reduce((s: number, d: any) => s + Number(d.totalPit ?? 0), 0);
    const overduePAYE = payeDecls.filter((d: any) => d.status !== 'PAID' && d.dueDate && new Date(d.dueDate) < new Date()).length;

    const penRemits = await this.prisma.pensionRemittance.findMany({ where: { companyId, createdAt: { gte: sd, lte: ed } } });
    const pensionRemitted = penRemits.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + Number(p.totalContrib ?? 0), 0);
    const overduePension = penRemits.filter((p: any) => p.status !== 'PAID' && p.dueDate && new Date(p.dueDate) < new Date()).length;

    const newHires = await this.prisma.employee.count({ where: { companyId, createdAt: { gte: sd, lte: ed } } }).catch(() => 0);
    const gratuityObligation = Math.round(grossPayroll * 0.0833 * 100) / 100;
    const accruals = Math.round((netPay / Math.max(1, records.length > 0 ? 12 : 1)) * 100) / 100;
    const leaveAccrual = Math.round((grossPayroll / 260) * 20 * 100) / 100;
    const ercaRef = payeDecls.find((d: any) => d.ercaReference)?.ercaReference ?? null;
    const pfsaRef = (penRemits.find((p: any) => p.pfsaReference) as any)?.pfsaReference ?? null;

    return { grossPayroll: Math.round(grossPayroll * 100) / 100, employeePension: Math.round(employeePension * 100) / 100, employerPension: Math.round(employerPension * 100) / 100, pitWithheld: Math.round(pitWithheld * 100) / 100, drrfTotal, netPay: Math.round(netPay * 100) / 100, employeeCount, newHires, exits: 0, pitDeclared: Math.round(pitDeclared * 100) / 100, overduePAYE, pensionRemitted: Math.round(pensionRemitted * 100) / 100, overduePension, gratuityObligation, gratuityCharge: gratuityObligation * 0.1, accruals, leaveAccrual, pitOutstanding: Math.max(0, Math.round((pitWithheld - pitDeclared) * 100) / 100), pensionOutstanding: Math.max(0, Math.round((employeePension + employerPension - pensionRemitted) * 100) / 100), drrfOutstanding: drrfTotal, ercaRef, pfsaRef };
  }

  private async _aggregateVAT(companyId: string, startDate: string, endDate: string) {
    const [sd, ed] = [new Date(startDate), new Date(endDate)];
    const [invoices, bills, reverseCharges, withholdingRows] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { companyId, status: 'PAID', date: { gte: sd, lte: ed } }, _sum: { vatAmount: true, subtotal: true } }),
      this.prisma.bill.aggregate({ where: { companyId, status: 'PAID', createdAt: { gte: sd, lte: ed } }, _sum: { vatAmount: true } }),
      this.prisma.$queryRaw<{ vatDue: string }[]>`SELECT COALESCE(SUM(vatDue),0) as vatDue FROM vatreverscharge WHERE companyId = ${companyId} AND invoiceDate BETWEEN ${sd} AND ${ed}`.catch(() => [{ vatDue: '0' }]),
      this.prisma.$queryRaw<{ withheldVat: string }[]>`SELECT COALESCE(SUM(withheldVat),0) as withheldVat FROM vatwithholding WHERE companyId = ${companyId} AND invoiceDate BETWEEN ${sd} AND ${ed}`.catch(() => [{ withheldVat: '0' }]),
    ]);
    const outputVAT = Math.round(Number(invoices._sum.vatAmount ?? 0) * 100) / 100;
    const inputVAT = Math.round(Number(bills._sum.vatAmount ?? 0) * 100) / 100;
    const reverseChargeVAT = Math.round(Number(reverseCharges[0]?.vatDue ?? 0) * 100) / 100;
    const withheldVAT = Math.round(Number(withholdingRows[0]?.withheldVat ?? 0) * 100) / 100;
    const netVATPayable = Math.max(0, Math.round((outputVAT - inputVAT + reverseChargeVAT) * 100) / 100);
    const refundClaims = Math.max(0, inputVAT - outputVAT);
    const whtCertData = await this.prisma.$queryRaw<{ total: string }[]>`SELECT COALESCE(SUM(withheldVat),0) as total FROM vatwithholding WHERE companyId = ${companyId} AND remitted = 1 AND invoiceDate BETWEEN ${sd} AND ${ed}`.catch(() => [{ total: '0' }]);
    // ── Non-recoverable VAT: read from most recent VatFiling apportionment ──
    const endPeriod = endDate.slice(0, 7);
    const vatFiling = await this.prisma.vatFiling.findFirst({ where: { companyId, period: { lte: endPeriod } }, orderBy: { period: 'desc' }, select: { inputApportionmentPct: true } }).catch(() => null);
    const apportionmentPct = Number((vatFiling as any)?.inputApportionmentPct ?? 1);
    const blockedRaw = await this.prisma.$queryRaw<{ total: string }[]>`SELECT COALESCE(SUM(vatAmount),0) as total FROM vatinputledger WHERE companyId = ${companyId} AND claimable = 0 AND date BETWEEN ${sd} AND ${ed}`.catch(() => [{ total: '0' }]);
    const nonRecoverableVAT = Math.round((inputVAT * (1 - apportionmentPct) + Number(blockedRaw[0]?.total ?? 0)) * 100) / 100;
    return { outputVAT, inputVAT, reverseChargeVAT, withheldVAT, netVATPayable, nonRecoverableVAT, totExpense: 0, refundClaims, whtCertificatesReceived: Number(whtCertData[0]?.total ?? 0) };
  }

  private async _aggregateWHT(companyId: string, startDate: string, endDate: string) {
    const [sd, ed] = [new Date(startDate), new Date(endDate)];
    const whRows = await this.prisma.$queryRaw<{ withheldVat: string; remitted: number }[]>`SELECT withheldVat, remitted FROM vatwithholding WHERE companyId = ${companyId} AND invoiceDate BETWEEN ${sd} AND ${ed}`.catch(() => []);
    const services = whRows.reduce((s: number, r: any) => s + Number(r.withheldVat ?? 0), 0);
    const remitted = whRows.filter((r: any) => r.remitted).reduce((s: number, r: any) => s + Number(r.withheldVat ?? 0), 0);
    const total = Math.round(services * 100) / 100;
    return { goods: 0, services: Math.round(services * 100) / 100, nonResident: 0, dividends: 0, interest: 0, rent: 0, total, remitted: Math.round(remitted * 100) / 100, outstanding: Math.round(Math.max(0, total - remitted) * 100) / 100, whtCertificatesReceived: 0 };
  }

  private _nextVATDueDate(endDate: string): string {
    const d = new Date(endDate);
    const y = d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
    const m = (d.getMonth() + 1) % 12;
    return `${y}-${String(m + 1).padStart(2, '0')}-30`;
  }
}
