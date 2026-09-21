/**
 * Ethiopian tax category helpers — two distinct schedules must not be conflated:
 *
 * - **Income tax schedule (BIT/MAT):** Proclamation bands at ETB 500K and ETB 1M turnover.
 * - **VAT/TOT compliance band:** VAT mandatory registration at ETB 2M; TOT applies below that.
 */
export type IncomeTaxSchedule = 'A' | 'B' | 'C';
export type VatTotComplianceBand = 'A' | 'B' | 'C';
export declare const VAT_REGISTRATION_THRESHOLD_ETB = 2000000;
export declare const INCOME_TAX_SCHEDULE_A_MIN_ETB = 1000000;
export declare const INCOME_TAX_SCHEDULE_B_MIN_ETB = 500000;
/** BIT/MAT schedule: A > 1M, B 500K–1M, C < 500K (annual turnover). */
export declare function getIncomeTaxSchedule(turnover: number): IncomeTaxSchedule;
/**
 * VAT/TOT compliance band (threshold monitor, TOT automation):
 * A ≥ 2M (VAT registered, TOT N/A), B 500K–2M, C < 500K.
 */
export declare function getVatTotComplianceBand(annualRevenue: number): VatTotComplianceBand;
/** @deprecated Use getIncomeTaxSchedule — kept for existing API fields named taxpayerCategory. */
export declare function getTaxpayerCategory(turnover: number): IncomeTaxSchedule;
//# sourceMappingURL=tax-categories.d.ts.map