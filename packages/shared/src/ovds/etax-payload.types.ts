/**
 * Ethiopian Ministry of Revenues (MoR) eTax Gateway — JSON Payload Types
 *
 * Defines the canonical outbound JSON schema for submitting tax declarations
 * to the MoR National e-Tax System via HTTPS POST.
 *
 * Based on: MoR API specification + Ethiopian tax proclamations.
 * All monetary amounts in ETB (Ethiopian Birr), 2 decimal places.
 */

// No top-level crypto import — use dynamic require in Node.js only (avoids Vite browser-bundle error)

// ---------------------------------------------------------------------------
// Core Header
// ---------------------------------------------------------------------------

export type CalendarSystem = 'Gregorian' | 'Ethiopian';

export interface ETaxHeader {
  TaxpayerTIN: string;           // 10–15 digit TIN
  TaxpayerName: string;
  FilingPeriodCode: string;       // Gregorian: "2026-06" / Ethiopian: "2018-10"
  CalendarSystem: CalendarSystem;
  DeclarationTimestamp: string;  // ISO 8601 UTC
  FiscalYear?: string;            // e.g. "EFY 2018/19"
  AmendmentNumber?: number;       // 0 = original, 1+ = amendment
}

// ---------------------------------------------------------------------------
// VAT Summary (Proclamation No. 1341/2024)
// ---------------------------------------------------------------------------

export interface ETaxVatSummary {
  StandardTaxableSalesETB: number;    // 15% VAT applies
  OutputVatCollectedETB: number;      // = Standard × 15%
  ZeroRatedSalesETB: number;          // Exports, basic goods — 0%
  ExemptSalesETB: number;             // Exempt supplies
  TotalEligibleInputVatETB: number;   // Input VAT claimable
  NetVatPayableRefundableETB: number; // Output − Input (positive = payable)
}

// ---------------------------------------------------------------------------
// TOT Summary (Proclamation No. 1395/2025, Art. 35–38)
// ---------------------------------------------------------------------------

export interface ETaxTotSummary {
  GoodsSalesETB: number;       // 2% rate
  ServicesSalesETB: number;    // 10% rate
  TotOnGoodsETB: number;
  TotOnServicesETB: number;
  TotalTotPayableETB: number;
}

// ---------------------------------------------------------------------------
// Withholding Tax Summary (Proclamation No. 1395/2025, Art. 94)
// ---------------------------------------------------------------------------

export interface ETaxWhtSummary {
  Wht3PctGoodsBaseETB: number;           // Goods ≥ ETB 10,000 (3% WHT per Proc. 1395/2025)
  Wht3PctGoodsWithheldETB: number;
  Wht3PctServicesBaseETB: number;        // Services ≥ ETB 3,000 (3% WHT per Proc. 1395/2025)
  Wht3PctServicesWithheldETB: number;
  Wht15PctDividendsETB: number;
  Wht10PctInterestETB: number;
  Wht15PctNonResidentServicesETB: number;
  TotalWhtToRemitETB: number;
}

// ---------------------------------------------------------------------------
// PAYE Summary (Proclamation No. 1395/2025, Art. 7–11)
// ---------------------------------------------------------------------------

export interface ETaxPayeSummary {
  EmployeeCount: number;
  TotalGrossSalaryETB: number;
  TotalPitWithheldETB: number;
  TotalEmployeePensionETB: number;   // 7% → PFSA
  TotalEmployerPensionETB: number;   // 11% → PFSA
  TotalDrrfETB: number;              // 1% → DRRF fund
  NetPayableErcaETB: number;         // PIT + DRRF → Ministry of Revenues (MoR) via etax.mor.gov.et
                                     // Field name kept as NetPayableErcaETB for MoR API schema compat
  NetPayablePfsaETB: number;         // Employee + Employer pension → PFSA
}

// ---------------------------------------------------------------------------
// Business Income Tax / CIT (Proclamation No. 979/2016)
// ---------------------------------------------------------------------------

export interface ETaxBitSummary {
  FiscalYear: number;
  AccountingProfitBeforeTaxETB: number;
  PermanentAddBacksETB: number;         // Non-deductible items
  PermanentDeductionsETB: number;       // Tax-exempt income
  TemporaryDifferencesNetETB: number;   // IAS 12 timing diffs
  TaxableNetIncomeETB: number;
  RegularCitETB: number;                // 30% of taxable income
  MatBaseETB: number;                   // Gross turnover for MAT
  MatAmountETB: number;                 // 2.5% of turnover
  MatApplies: boolean;
  FinalTaxPayableETB: number;           // max(CIT, MAT)
  WhtCreditsAppliedETB: number;
  ProvisionalTaxPaidETB: number;
  BalanceDueETB: number;
}

// ---------------------------------------------------------------------------
// Excise Tax Summary (Proclamation No. 1186/2020)
// ---------------------------------------------------------------------------

export interface ETaxExciseSummary {
  /** Period type — monthly for manufacturers, per-import for importers */
  PeriodType: 'MONTHLY' | 'PER_IMPORT';
  AlcoholBaseETB: number;          // 15%
  TobaccoBaseETB: number;          // 20%
  AutomobileGt1800ccBaseETB: number; // 55%
  AutomobileLt1800ccBaseETB: number; // 47%
  AutomobileElectricBaseETB: number; // 25%
  SugarSweetenedBaseETB: number;   // 10%
  EnergyDrinkBaseETB: number;      // 17.5%
  PlasticBaseETB: number;          // 5%
  OtherExcisableBaseETB: number;
  TotalExciseDueETB: number;
}

// ---------------------------------------------------------------------------
// DRRF Levy Summary (Regulation No. 570/2025)
// ---------------------------------------------------------------------------

export interface ETaxDrrfSummary {
  Quarter: string;                    // e.g. "Q1-2026"
  DigitalBankingBaseETB: number;
  TelecomAirtimeBaseETB: number;
  LoanDisbursementsBaseETB: number;
  InsurancePremiumsBaseETB: number;
  DividendsBaseETB: number;
  TotalLevyETB: number;
}

// ---------------------------------------------------------------------------
// System Security Metadata
// ---------------------------------------------------------------------------

export interface ETaxSystemSecurity {
  ApplicationSignature: string;   // SHA-256 of payload content
  AuditLogReference: string;      // Internal audit log ID
  SubmittedByUserId?: string;
  IPAddress?: string;
}

// ---------------------------------------------------------------------------
// Full TaxpayerDeclaration — the complete MoR submission payload
// ---------------------------------------------------------------------------

export interface TaxpayerDeclaration {
  Header: ETaxHeader;
  VatSummary?: ETaxVatSummary;
  TotSummary?: ETaxTotSummary;
  WithholdingTaxSummary?: ETaxWhtSummary;
  PayeSummary?: ETaxPayeSummary;
  BusinessIncomeTaxSummary?: ETaxBitSummary;
  ExciseSummary?: ETaxExciseSummary;
  DrrfSummary?: ETaxDrrfSummary;
  SystemSecurity: ETaxSystemSecurity;
}

// ---------------------------------------------------------------------------
// MoR API Response
// ---------------------------------------------------------------------------

export interface ETaxSubmissionResponse {
  status: 'SUCCESS' | 'REJECTED' | 'PENDING';
  receiptId?: string;
  paymentSlipUrl?: string;
  validationErrors?: string[];
  timestamp: string;
  requestId: string;
}

// ---------------------------------------------------------------------------
// Payload Builder Utility
// ---------------------------------------------------------------------------

/**
 * Build a complete TaxpayerDeclaration payload for MoR submission.
 * Call this in the backend eTax export service before signing and posting.
 */
export function buildTaxpayerDeclaration(params: {
  tin: string;
  taxpayerName: string;
  period: string;                  // YYYY-MM
  calendarSystem?: CalendarSystem;
  auditLogRef: string;
  vat?: ETaxVatSummary;
  tot?: ETaxTotSummary;
  wht?: ETaxWhtSummary;
  paye?: ETaxPayeSummary;
  bit?: ETaxBitSummary;
  excise?: ETaxExciseSummary;
  drrf?: ETaxDrrfSummary;
  submittedByUserId?: string;
}): TaxpayerDeclaration {
  const payload: Omit<TaxpayerDeclaration, 'SystemSecurity'> = {
    Header: {
      TaxpayerTIN: params.tin,
      TaxpayerName: params.taxpayerName,
      FilingPeriodCode: params.period,
      CalendarSystem: params.calendarSystem ?? 'Gregorian',
      DeclarationTimestamp: new Date().toISOString(),
    },
    ...(params.vat    && { VatSummary: params.vat }),
    ...(params.tot    && { TotSummary: params.tot }),
    ...(params.wht    && { WithholdingTaxSummary: params.wht }),
    ...(params.paye   && { PayeSummary: params.paye }),
    ...(params.bit    && { BusinessIncomeTaxSummary: params.bit }),
    ...(params.excise && { ExciseSummary: params.excise }),
    ...(params.drrf   && { DrrfSummary: params.drrf }),
  };

  // SHA-256 signature of the serialised payload body
  // Dynamic require so bundlers (Vite) don't try to bundle Node's crypto for the browser
  const payloadJson = JSON.stringify(payload);
  let signature: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createHash } = require('crypto') as typeof import('crypto');
    signature = `sha256-${createHash('sha256').update(payloadJson).digest('hex')}`;
  } catch {
    // Browser environment — use payload length as a lightweight fingerprint
    // (actual signing always happens server-side; this branch is never called in prod)
    signature = `sha256-len-${payloadJson.length}`;
  }

  return {
    ...payload,
    SystemSecurity: {
      ApplicationSignature: signature,
      AuditLogReference: params.auditLogRef,
      SubmittedByUserId: params.submittedByUserId,
    },
  };
}

/**
 * Validate a TaxpayerDeclaration payload before submission.
 * Returns array of error strings; empty = valid.
 */
export function validateTaxpayerDeclaration(d: TaxpayerDeclaration): string[] {
  const errors: string[] = [];

  // Header
  if (!d.Header.TaxpayerTIN || d.Header.TaxpayerTIN.length < 10)
    errors.push('TaxpayerTIN must be at least 10 characters');
  if (!/^\d+$/.test(d.Header.TaxpayerTIN ?? ''))
    errors.push('TaxpayerTIN must contain only numeric digits');
  if (!d.Header.FilingPeriodCode || !/^\d{4}-\d{2}$/.test(d.Header.FilingPeriodCode))
    errors.push('FilingPeriodCode must be in YYYY-MM format');
  if (!d.Header.DeclarationTimestamp)
    errors.push('DeclarationTimestamp is required');
  if (!d.Header.TaxpayerName?.trim())
    errors.push('TaxpayerName is required');

  // At least one tax section required
  if (!d.VatSummary && !d.TotSummary && !d.WithholdingTaxSummary &&
      !d.PayeSummary && !d.BusinessIncomeTaxSummary && !d.ExciseSummary)
    errors.push('At least one tax summary section (VAT, TOT, WHT, PAYE, BIT, or Excise) is required');

  // VAT section
  if (d.VatSummary) {
    const v = d.VatSummary;
    if (v.OutputVatCollectedETB < 0) errors.push('OutputVatCollectedETB cannot be negative');
    if (v.TotalEligibleInputVatETB < 0) errors.push('TotalEligibleInputVatETB cannot be negative');
    const expectedOutput = Math.round(v.StandardTaxableSalesETB * 0.15 * 100) / 100;
    const actualOutput   = Math.round(v.OutputVatCollectedETB * 100) / 100;
    if (Math.abs(expectedOutput - actualOutput) > 1)
      errors.push(`OutputVatCollectedETB (${actualOutput}) does not match StandardTaxableSales × 15% (${expectedOutput})`);
    const expectedNet = Math.round((v.OutputVatCollectedETB - v.TotalEligibleInputVatETB) * 100) / 100;
    const actualNet   = Math.round(v.NetVatPayableRefundableETB * 100) / 100;
    if (Math.abs(expectedNet - actualNet) > 1)
      errors.push(`NetVatPayableRefundableETB (${actualNet}) does not equal Output − Input (${expectedNet})`);
  }

  // TOT section — VAT and TOT are mutually exclusive
  if (d.VatSummary && d.TotSummary)
    errors.push('VatSummary and TotSummary cannot both be present — VAT and TOT are mutually exclusive');
  if (d.TotSummary) {
    const t = d.TotSummary;
    const expectedGoods    = Math.round(t.GoodsSalesETB * 0.02 * 100) / 100;
    const expectedServices = Math.round(t.ServicesSalesETB * 0.10 * 100) / 100;
    if (Math.abs(expectedGoods - t.TotOnGoodsETB) > 1)
      errors.push(`TotOnGoodsETB (${t.TotOnGoodsETB}) should be GoodsSales × 2% (${expectedGoods})`);
    if (Math.abs(expectedServices - t.TotOnServicesETB) > 1)
      errors.push(`TotOnServicesETB (${t.TotOnServicesETB}) should be ServicesSales × 10% (${expectedServices})`);
  }

  // WHT section
  if (d.WithholdingTaxSummary) {
    const w = d.WithholdingTaxSummary;
    // Goods WHT: 3% per Proclamation No. 1395/2025 (raised from 2%)
    const expectedGoodsWht    = Math.round(w.Wht3PctGoodsBaseETB * 0.03 * 100) / 100;
    const expectedServicesWht = Math.round(w.Wht3PctServicesBaseETB * 0.03 * 100) / 100;
    if (Math.abs(expectedGoodsWht - w.Wht3PctGoodsWithheldETB) > 1)
      errors.push(`Wht3PctGoodsWithheldETB (${w.Wht3PctGoodsWithheldETB}) should be GoodsBase × 3% (${expectedGoodsWht}) per Proc. 1395/2025`);
    if (Math.abs(expectedServicesWht - w.Wht3PctServicesWithheldETB) > 1)
      errors.push(`Wht3PctServicesWithheldETB (${w.Wht3PctServicesWithheldETB}) should be ServicesBase × 3% (${expectedServicesWht})`);
    const computedTotal = w.Wht3PctGoodsWithheldETB + w.Wht3PctServicesWithheldETB +
                          w.Wht15PctDividendsETB + w.Wht10PctInterestETB +
                          w.Wht15PctNonResidentServicesETB;
    if (Math.abs(computedTotal - w.TotalWhtToRemitETB) > 1)
      errors.push(`TotalWhtToRemitETB (${w.TotalWhtToRemitETB}) does not match sum of components (${Math.round(computedTotal * 100) / 100})`);
  }

  // PAYE section
  if (d.PayeSummary) {
    const p = d.PayeSummary;
    if (p.EmployeeCount <= 0) errors.push('PayeSummary.EmployeeCount must be > 0');
    if (p.TotalPitWithheldETB < 0) errors.push('TotalPitWithheldETB cannot be negative');
    if (p.TotalDrrfETB < 0) errors.push('TotalDrrfETB cannot be negative');
    const expectedErca = Math.round((p.TotalPitWithheldETB + p.TotalDrrfETB) * 100) / 100;
    if (Math.abs(expectedErca - p.NetPayableErcaETB) > 1)
      errors.push(`NetPayableErcaETB (${p.NetPayableErcaETB}) should equal PIT + DRRF (${expectedErca})`);
    const expectedPfsa = Math.round((p.TotalEmployeePensionETB + p.TotalEmployerPensionETB) * 100) / 100;
    if (Math.abs(expectedPfsa - p.NetPayablePfsaETB) > 1)
      errors.push(`NetPayablePfsaETB (${p.NetPayablePfsaETB}) should equal employee + employer pension (${expectedPfsa})`);
  }

  // BIT section
  if (d.BusinessIncomeTaxSummary) {
    const b = d.BusinessIncomeTaxSummary;
    if (b.TaxableNetIncomeETB < 0 && b.FinalTaxPayableETB > 0)
      errors.push('FinalTaxPayableETB should be 0 when TaxableNetIncomeETB is negative (loss year)');
    if (b.BalanceDueETB !== Math.round((b.FinalTaxPayableETB - b.WhtCreditsAppliedETB - b.ProvisionalTaxPaidETB) * 100) / 100)
      errors.push('BalanceDueETB must equal FinalTaxPayable − WhtCredits − ProvisionalPaid');
  }

  // Excise section
  if (d.ExciseSummary) {
    const e = d.ExciseSummary;
    if (e.TotalExciseDueETB < 0) errors.push('TotalExciseDueETB cannot be negative');
  }

  // DRRF section
  if (d.DrrfSummary) {
    if (d.DrrfSummary.TotalLevyETB < 0) errors.push('DrrfSummary.TotalLevyETB cannot be negative');
    if (!d.DrrfSummary.Quarter || !/^Q[1-4]-\d{4}$/.test(d.DrrfSummary.Quarter))
      errors.push('DrrfSummary.Quarter must be in format Q1-2026');
  }

  return errors;
}
