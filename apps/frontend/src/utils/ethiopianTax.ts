/**
 * Ethiopian Tax Utilities — re-exported from @ovds/shared (single source of truth).
 *
 * The full implementation lives in packages/shared/src/ovds/tax-calc.ts
 * so both frontend and backend use identical tax logic.
 *
 * DO NOT add implementations here. Edit packages/shared/src/ovds/tax-calc.ts instead.
 */

// `export { X } from '...'` re-exports X but does NOT bind it in this module's
// scope. calcLineTax() below needs the values at runtime, so they are imported
// as well — without this the file throws
// "ReferenceError: TaxCalculationType is not defined" on first call.
import { TaxCalculationType, computeTaxFromType } from '@ovds/shared';

export {
  ETH_TAX,
  PIT_BRACKETS,
  calculatePIT,
  calcVAT,
  calcWHT,
  getWhtLabel,
  calculateCorporateBIT,
  calculateBIT,
  calcDRRF,
  fmtETB,
  fmtCurrency,
  isVatRegistered,
  classifyIfrs18,
  getEthFiscalYear,
  getEthFiscalYearDates,
  getBITFilingDeadline,
  getNextVatDeadline,
  getNextDrrfDeadline,
  getVatPeriod,
  TaxCalculationType,
  TAX_CALCULATION_TYPE_LABELS,
  computeTaxFromType,
  TaxCalculationTypeSchema,
} from '@ovds/shared';

export type {
  PitResult,
  VatResult,
  WhtType,
  DrrfCategory,
  Ifrs18Category,
  Ifrs18LineItem,
  TaxCalculationInput,
  TaxCalculationResult,
} from '@ovds/shared';

export function calcLineTax(
  net: number,
  ratePercent: number,
  calculationType: TaxCalculationType = TaxCalculationType.NORMAL,
  fixedAmount = 0,
  baseTax = 0,
): number {
  const result = computeTaxFromType(calculationType, {
    amount: net,
    rate: ratePercent / 100,
    fixedAmount,
    baseTax,
  });
  return Math.round(result.tax * 100) / 100;
}
