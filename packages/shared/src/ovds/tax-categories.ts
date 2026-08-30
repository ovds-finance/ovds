/**
 * Ethiopian tax category helpers — two distinct schedules must not be conflated:
 *
 * - **Income tax schedule (BIT/MAT):** Proclamation bands at ETB 500K and ETB 1M turnover.
 * - **VAT/TOT compliance band:** VAT mandatory registration at ETB 2M; TOT applies below that.
 */

export type IncomeTaxSchedule = 'A' | 'B' | 'C';
export type VatTotComplianceBand = 'A' | 'B' | 'C';

export const VAT_REGISTRATION_THRESHOLD_ETB = 2_000_000;
export const INCOME_TAX_SCHEDULE_A_MIN_ETB = 1_000_000;
export const INCOME_TAX_SCHEDULE_B_MIN_ETB = 500_000;

/** BIT/MAT schedule: A > 1M, B 500K–1M, C < 500K (annual turnover). */
export function getIncomeTaxSchedule(turnover: number): IncomeTaxSchedule {
  if (turnover > INCOME_TAX_SCHEDULE_A_MIN_ETB) return 'A';
  if (turnover >= INCOME_TAX_SCHEDULE_B_MIN_ETB) return 'B';
  return 'C';
}

/**
 * VAT/TOT compliance band (threshold monitor, TOT automation):
 * A ≥ 2M (VAT registered, TOT N/A), B 500K–2M, C < 500K.
 */
export function getVatTotComplianceBand(
  annualRevenue: number,
): VatTotComplianceBand {
  if (annualRevenue >= VAT_REGISTRATION_THRESHOLD_ETB) return 'A';
  if (annualRevenue >= INCOME_TAX_SCHEDULE_B_MIN_ETB) return 'B';
  return 'C';
}

/** @deprecated Use getIncomeTaxSchedule — kept for existing API fields named taxpayerCategory. */
export function getTaxpayerCategory(turnover: number): IncomeTaxSchedule {
  return getIncomeTaxSchedule(turnover);
}
