/**
 * @file vat-rule-engine.ts
 * @package @ovds/core/vat
 *
 * VatRuleEngine — the abstract interface and base class every country
 * VAT rule-set must implement.
 *
 * Inspired by Akaunting's "thick library, thin app" principle:
 *  - The ENGINE defines the contract.
 *  - Country MODULES provide the implementation.
 *  - The ORCHESTRATOR selects the right module at runtime.
 *
 * No NestJS, no Prisma, no HTTP — pure domain logic.
 */

import type {
  VatContext,
  VatResult,
  VatLineResult,
  VatRate,
  VatFilingPeriod,
  VatComplianceResult,
  VatComplianceIssue,
  VatReturnDraft,
  VatJurisdictionInfo,
  VatRateType,
  FilingFrequency,
} from './vat-types';

// ─── Core interface ──────────────────────────────────────────────────────────

/**
 * Every pluggable country VAT rule-set implements this interface.
 *
 * Method contract:
 *  calculate()   — pure arithmetic; must be deterministic and side-effect-free
 *  validate()    — rules-based compliance check; may be async for DB look-ups
 *  periods()     — generate filing periods for a given calendar year
 *  buildReturn() — assemble the official authority return from ledger data
 *  jurisdiction()— static metadata about the jurisdiction
 */
export interface IVatRuleEngine {
  readonly countryCode: string;
  readonly ruleSetVersion: string;

  /** Calculate VAT for a single transaction context */
  calculate(ctx: VatContext): VatResult;

  /** Validate a transaction or draft return for compliance */
  validate(ctx: VatContext): Promise<VatComplianceResult>;

  /** Generate all filing periods for the given calendar year */
  periods(year: number, frequency?: FilingFrequency): VatFilingPeriod[];

  /** Build a draft VAT return from raw ledger totals */
  buildReturn(
    companyId: string,
    periodKey: string,
    inputVat: number,
    outputVat: number,
    currency: string,
  ): VatReturnDraft;

  /** Retrieve current active rates */
  activeRates(asOfDate?: string): VatRate[];

  /** Jurisdiction metadata */
  jurisdiction(): VatJurisdictionInfo;
}

// ─── Abstract base class ─────────────────────────────────────────────────────

/**
 * AbstractVatRuleEngine
 *
 * Provides:
 *  • Rate resolution helpers (resolveRate, resolveRateForCode)
 *  • Shared calculation skeleton (applyRates)
 *  • Default compliance rules (override validateCustomRules for jurisdiction-specific rules)
 *  • Period-generation utility (generatePeriods)
 *  • Logging stub (override with real logger)
 */
export abstract class AbstractVatRuleEngine implements IVatRuleEngine {
  abstract readonly countryCode: string;
  abstract readonly ruleSetVersion: string;

  // ── Abstract methods every jurisdiction must implement ───────────────────

  abstract jurisdiction(): VatJurisdictionInfo;

  /** Return ALL rate definitions for this jurisdiction (active + historical) */
  protected abstract allRates(): VatRate[];

  /** Jurisdiction-specific compliance rules — supplement the base rules */
  protected abstract validateCustomRules(ctx: VatContext): Promise<VatComplianceIssue[]>;

  // ── Rate helpers ─────────────────────────────────────────────────────────

  activeRates(asOfDate?: string): VatRate[] {
    const date = asOfDate ?? new Date().toISOString().slice(0, 10);
    return this.allRates().filter((r) => {
      if (r.effectiveFrom > date) return false;
      if (r.effectiveTo && r.effectiveTo < date) return false;
      return true;
    });
  }

  protected resolveRate(
    rateType: VatRateType,
    asOfDate?: string,
  ): VatRate | undefined {
    return this.activeRates(asOfDate).find((r) => r.rateType === rateType);
  }

  protected resolveRateForCode(
    hsCode: string,
    asOfDate?: string,
  ): VatRate | undefined {
    const active = this.activeRates(asOfDate);
    // First try: explicit HS code mapping
    for (const rate of active) {
      if (rate.applicableCodes?.includes(hsCode)) return rate;
    }
    // Fall back to STANDARD
    return active.find((r) => r.rateType === 'STANDARD');
  }

  // ── Calculate ────────────────────────────────────────────────────────────

  /**
   * Default implementation: resolve the applicable rate via HS code (if
   * present), then apply it straightforwardly.  Subclasses can override
   * for more complex multi-line logic (e.g. UAE mixed-rate invoices).
   */
  calculate(ctx: VatContext): VatResult {
    const date = ctx.transactionDate;
    const rate = ctx.hsCode
      ? this.resolveRateForCode(ctx.hsCode, date)
      : (this.resolveRate('STANDARD', date) ?? this.activeRates(date)[0]);

    const warnings: string[] = [];

    if (!rate) {
      warnings.push(`No active VAT rate found for ${this.countryCode} on ${date}. Zero VAT applied.`);
      return this.buildZeroResult(ctx, warnings);
    }

    if (ctx.hsCode && !rate.applicableCodes?.includes(ctx.hsCode)) {
      warnings.push(
        `HS code "${ctx.hsCode}" not mapped to a specific rate — standard rate applied.`,
      );
    }

    const lines = this.applyRates(ctx, [rate], warnings);
    return this.assembleResult(ctx, lines, warnings);
  }

  /** Build the line items from a resolved set of rates */
  protected applyRates(
    ctx: VatContext,
    rates: VatRate[],
    warnings: string[],
  ): VatLineResult[] {
    return rates.map((rate) => {
      const isZeroOrExempt =
        rate.rateType === 'ZERO_RATED' || rate.rateType === 'EXEMPT';

      // Reverse-charge: buyer accounts for VAT; no cash changes hands
      const effectiveRate = ctx.reverseCharge && !isZeroOrExempt ? rate.rate : rate.rate;

      const taxableAmount = ctx.subtotal;
      const vatAmount = isZeroOrExempt ? 0 : round2(taxableAmount * (effectiveRate / 100));

      return {
        description: `${rate.label} @ ${effectiveRate}%${ctx.reverseCharge ? ' (Reverse Charge)' : ''}`,
        rateType: rate.rateType,
        rate: effectiveRate,
        taxableAmount,
        vatAmount,
      };
    });
  }

  protected assembleResult(
    ctx: VatContext,
    lines: VatLineResult[],
    warnings: string[],
  ): VatResult {
    const totalVat = round2(lines.reduce((s, l) => s + l.vatAmount, 0));
    const grandTotal = round2(ctx.subtotal + totalVat);
    const effectiveRate = ctx.subtotal > 0
      ? round2((totalVat / ctx.subtotal) * 100)
      : 0;

    const dominant = lines.reduce<VatLineResult | undefined>((prev, cur) =>
      !prev || cur.vatAmount > prev.vatAmount ? cur : prev,
      undefined,
    );

    return {
      countryCode: this.countryCode,
      subtotal: ctx.subtotal,
      totalVat,
      grandTotal,
      currency: ctx.currency,
      lines,
      effectiveRate,
      reverseChargeApplied: !!ctx.reverseCharge && totalVat > 0,
      dominantRateType: dominant?.rateType ?? 'STANDARD',
      calculatedAt: new Date().toISOString(),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  protected buildZeroResult(ctx: VatContext, warnings: string[]): VatResult {
    return {
      countryCode: this.countryCode,
      subtotal: ctx.subtotal,
      totalVat: 0,
      grandTotal: ctx.subtotal,
      currency: ctx.currency,
      lines: [{
        description: 'No applicable VAT rate',
        rateType: 'EXEMPT',
        rate: 0,
        taxableAmount: ctx.subtotal,
        vatAmount: 0,
      }],
      effectiveRate: 0,
      reverseChargeApplied: false,
      dominantRateType: 'EXEMPT',
      calculatedAt: new Date().toISOString(),
      warnings,
    };
  }

  // ── Validate ─────────────────────────────────────────────────────────────

  async validate(ctx: VatContext): Promise<VatComplianceResult> {
    const issues: VatComplianceIssue[] = [];

    // Base rules shared by all jurisdictions
    issues.push(...this.validateBaseRules(ctx));

    // Jurisdiction-specific rules
    issues.push(...await this.validateCustomRules(ctx));

    return {
      passed: !issues.some((i) => i.severity === 'ERROR'),
      issues,
      ruleSetVersion: this.ruleSetVersion,
      checkedAt: new Date().toISOString(),
    };
  }

  private validateBaseRules(ctx: VatContext): VatComplianceIssue[] {
    const issues: VatComplianceIssue[] = [];

    if (!ctx.companyId) {
      issues.push({ code: 'BASE-001', severity: 'ERROR', message: 'companyId is required', field: 'companyId' });
    }
    if (!ctx.transactionDate || !/^\d{4}-\d{2}-\d{2}$/.test(ctx.transactionDate)) {
      issues.push({ code: 'BASE-002', severity: 'ERROR', message: 'transactionDate must be YYYY-MM-DD', field: 'transactionDate' });
    }
    if (ctx.subtotal < 0) {
      issues.push({ code: 'BASE-003', severity: 'ERROR', message: 'subtotal cannot be negative', field: 'subtotal' });
    }
    if (!ctx.currency || ctx.currency.length !== 3) {
      issues.push({ code: 'BASE-004', severity: 'WARNING', message: 'currency should be a 3-letter ISO code', field: 'currency' });
    }

    return issues;
  }

  // ── Period generation ─────────────────────────────────────────────────────

  /**
   * Utility for subclasses: generates monthly, quarterly, semi-annual or
   * annual VatFilingPeriod objects for the given year.
   *
   * `deadlineOffsetDays` — number of days after period end that the return is due.
   */
  protected generatePeriods(
    year: number,
    frequency: FilingFrequency,
    deadlineOffsetDays: number,
  ): VatFilingPeriod[] {
    const today = new Date().toISOString().slice(0, 10);

    const monthEnds = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // Account for leap years
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      monthEnds[1] = 29;
    }

    const periods: VatFilingPeriod[] = [];

    if (frequency === 'MONTHLY') {
      for (let m = 1; m <= 12; m++) {
        const start = `${year}-${pad2(m)}-01`;
        const end = `${year}-${pad2(m)}-${monthEnds[m - 1]}`;
        const due = addDays(end, deadlineOffsetDays);
        periods.push({
          periodKey: `${year}-${pad2(m)}`,
          label: `${monthName(m)} ${year}`,
          frequency,
          startDate: start,
          endDate: end,
          dueDate: due,
          isOpen: today >= start && today <= due,
        });
      }
    } else if (frequency === 'QUARTERLY') {
      const quarters = [
        { q: 'Q1', months: [1, 2, 3] },
        { q: 'Q2', months: [4, 5, 6] },
        { q: 'Q3', months: [7, 8, 9] },
        { q: 'Q4', months: [10, 11, 12] },
      ];
      for (const { q, months } of quarters) {
        const firstM = months[0];
        const lastM = months[months.length - 1];
        const start = `${year}-${pad2(firstM)}-01`;
        const end = `${year}-${pad2(lastM)}-${monthEnds[lastM - 1]}`;
        const due = addDays(end, deadlineOffsetDays);
        periods.push({
          periodKey: `${year}-${q}`,
          label: `${q} ${year}`,
          frequency,
          startDate: start,
          endDate: end,
          dueDate: due,
          isOpen: today >= start && today <= due,
        });
      }
    } else if (frequency === 'SEMI_ANNUAL') {
      const halves = [
        { h: 'H1', months: [1, 6] },
        { h: 'H2', months: [7, 12] },
      ];
      for (const { h, months } of halves) {
        const firstM = months[0];
        const lastM = months[months.length - 1];
        const start = `${year}-${pad2(firstM)}-01`;
        const end = `${year}-${pad2(lastM)}-${monthEnds[lastM - 1]}`;
        const due = addDays(end, deadlineOffsetDays);
        periods.push({
          periodKey: `${year}-${h}`,
          label: `${h} ${year}`,
          frequency,
          startDate: start,
          endDate: end,
          dueDate: due,
          isOpen: today >= start && today <= due,
        });
      }
    } else {
      // ANNUAL
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const due = addDays(end, deadlineOffsetDays);
      periods.push({
        periodKey: `${year}`,
        label: `FY${year}`,
        frequency,
        startDate: start,
        endDate: end,
        dueDate: due,
        isOpen: today >= start && today <= due,
      });
    }

    return periods;
  }

  // ── Default periods (subclasses override for jurisdiction-specific logic) ──

  periods(year: number, frequency?: FilingFrequency): VatFilingPeriod[] {
    const freq = frequency ?? this.jurisdiction().filingFrequencies[0] ?? 'MONTHLY';
    return this.generatePeriods(year, freq, 30);
  }

  // ── buildReturn default skeleton ──────────────────────────────────────────

  buildReturn(
    companyId: string,
    periodKey: string,
    inputVat: number,
    outputVat: number,
    currency: string,
  ): VatReturnDraft {
    const netVatPayable = round2(outputVat - inputVat);
    return {
      countryCode: this.countryCode,
      periodKey,
      companyId,
      lines: [
        { boxCode: 'OUTPUT_VAT', label: 'Output VAT (Sales)', amount: 0, taxAmount: outputVat },
        { boxCode: 'INPUT_VAT',  label: 'Input VAT (Purchases)', amount: 0, taxAmount: inputVat },
        { boxCode: 'NET_VAT',    label: 'Net VAT Payable', amount: netVatPayable },
      ],
      netVatPayable,
      currency,
      preparedAt: new Date().toISOString(),
    };
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function monthName(m: number): string {
  return [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][m];
}
