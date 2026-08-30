/**
 * vat-declaration.ts — exact-integer monthly VAT declaration computation for
 * the Ethiopian Ministry of Revenues (MoR).
 *
 * All arithmetic runs in santim (see money.ts) so the declared totals always
 * reconcile with the sum of the line items. A VAT return whose TaxValue does
 * not equal the sum of line TaxAmounts is rejected by the MoR core API with a
 * tax-calculation mismatch, so "close enough" float maths is not an option.
 *
 * Legal basis:
 *   - VAT Proclamation No. 1341/2024 — 15% standard rate
 *   - Regulation No. 570/2025 — ETB 2,000,000 registration threshold
 *   - Federal Income Tax (Amendment) Proclamation No. 1395/2025 — 3% domestic WHT
 */
import { ETH_TAX } from '../constants';
import {
  applyRateToCents,
  assertCents,
  extractInclusiveTaxCents,
  sumCents,
  toCents,
} from './money';

/** How a supply is treated for VAT. */
export type VatTreatment =
  /** 15% standard rate. */
  | 'STANDARD'
  /** 0% but still a taxable supply — exports, and input VAT IS recoverable. */
  | 'ZERO_RATED'
  /** Outside VAT — input VAT is NOT recoverable. */
  | 'EXEMPT';

/** Whether a line is an output (sale) or input (purchase). */
export type VatDirection = 'OUTPUT' | 'INPUT';

/**
 * What an input purchase is used for, which decides recoverability.
 *
 * Input VAT is recoverable when the purchase is attributable to taxable
 * supplies — including ZERO-RATED exports, which are taxable at 0% and so keep
 * full recovery. It is NOT recoverable when attributable to exempt supplies.
 * Mixed use is apportioned by the caller (see allocateCents in money.ts).
 */
export type InputAttribution = 'TAXABLE' | 'EXEMPT';

export interface VatDeclarationLineInput {
  /** Stable reference — invoice number or IRN. */
  invoiceReference: string;
  direction: VatDirection;
  /**
   * The VAT treatment actually applied to this line.
   *
   * For OUTPUT lines this is how the sale was taxed.
   * For INPUT lines this is the rate the SUPPLIER charged — an exporter buys
   * at STANDARD 15% even though it sells ZERO_RATED.
   */
  treatment: VatTreatment;
  /**
   * INPUT lines only: what the purchase is used for. Defaults to 'TAXABLE'.
   * Set to 'EXEMPT' to block recovery.
   */
  attributableTo?: InputAttribution;
  /**
   * Line amount in ETB. A decimal string is preferred (lossless); numbers are
   * accepted and converted half-up.
   */
  amount: number | string;
  /** True when `amount` already includes VAT. */
  amountIsVatInclusive?: boolean;
  /**
   * Override the statutory rate as a decimal fraction (e.g. 0.15).
   * Only for historic periods filed under a superseded rate.
   */
  rateOverride?: number;
}

export interface VatDeclarationLineResult {
  invoiceReference: string;
  direction: VatDirection;
  treatment: VatTreatment;
  /** INPUT lines only — what the purchase is attributable to. */
  attributableTo?: InputAttribution;
  /** Rate applied, as a decimal fraction. */
  rate: number;
  /** Net (VAT-exclusive) amount, santim. */
  netCents: number;
  /** VAT amount, santim. */
  vatCents: number;
  /** net + vat, santim. */
  grossCents: number;
  /** True when this line's VAT counts toward recoverable input VAT. */
  recoverable: boolean;
}

export interface VatDeclarationTotals {
  /** Net standard-rated + zero-rated + exempt sales, santim. */
  totalSalesCents: number;
  /** Net purchases, santim. */
  totalPurchasesCents: number;
  /** VAT charged on sales, santim. */
  outputVatCents: number;
  /** VAT paid on purchases that is recoverable, santim. */
  inputVatCents: number;
  /** VAT paid on purchases that is NOT recoverable (exempt supplies), santim. */
  nonRecoverableInputVatCents: number;
  /**
   * output - recoverable input, santim.
   * Positive = payable to the MoR. Negative = credit carried forward / refundable.
   */
  netVatPayableCents: number;
  /** Net standard-rated sales only, santim. */
  standardRatedSalesCents: number;
  zeroRatedSalesCents: number;
  exemptSalesCents: number;
}

export interface VatDeclarationComputation extends VatDeclarationTotals {
  lines: VatDeclarationLineResult[];
  /** Rate used for STANDARD lines without an override. */
  standardRate: number;
}

function rateFor(line: VatDeclarationLineInput): number {
  if (line.rateOverride !== undefined) {
    if (!Number.isFinite(line.rateOverride) || line.rateOverride < 0) {
      throw new Error(
        `Invalid rateOverride ${line.rateOverride} on line ${line.invoiceReference}`,
      );
    }
    return line.rateOverride;
  }
  return line.treatment === 'STANDARD' ? ETH_TAX.VAT_RATE : 0;
}

/**
 * Compute a full monthly VAT declaration in exact santim.
 *
 * Each line's VAT is rounded half-up exactly once; the totals are then integer
 * sums of already-rounded line values, so `outputVatCents` always equals the
 * sum of the output line `vatCents` with no residual santim.
 */
export function computeVatDeclaration(
  lines: readonly VatDeclarationLineInput[],
): VatDeclarationComputation {
  const results: VatDeclarationLineResult[] = lines.map((line) => {
    const rate = rateFor(line);
    const rawCents = toCents(line.amount);

    let netCents: number;
    let vatCents: number;

    if (line.amountIsVatInclusive && rate > 0) {
      const extracted = extractInclusiveTaxCents(rawCents, rate);
      netCents = extracted.netCents;
      vatCents = extracted.taxCents;
    } else {
      netCents = rawCents;
      vatCents = applyRateToCents(rawCents, rate);
    }

    return {
      invoiceReference: line.invoiceReference,
      direction: line.direction,
      treatment: line.treatment,
      attributableTo: line.direction === 'INPUT' ? (line.attributableTo ?? 'TAXABLE') : undefined,
      rate,
      netCents,
      vatCents,
      grossCents: netCents + vatCents,
      // Input VAT is recoverable when the purchase is attributable to taxable
      // supplies — which includes ZERO_RATED exports (taxable at 0%). It is NOT
      // recoverable when attributable to EXEMPT supplies.
      recoverable:
        line.direction === 'INPUT' &&
        (line.attributableTo ?? 'TAXABLE') === 'TAXABLE',
    };
  });

  const outputs = results.filter((r) => r.direction === 'OUTPUT');
  const inputs = results.filter((r) => r.direction === 'INPUT');

  const totalSalesCents = sumCents(outputs.map((r) => r.netCents));
  const totalPurchasesCents = sumCents(inputs.map((r) => r.netCents));
  const outputVatCents = sumCents(outputs.map((r) => r.vatCents));
  const inputVatCents = sumCents(
    inputs.filter((r) => r.recoverable).map((r) => r.vatCents),
  );
  const nonRecoverableInputVatCents = sumCents(
    inputs.filter((r) => !r.recoverable).map((r) => r.vatCents),
  );

  const byTreatment = (t: VatTreatment) =>
    sumCents(outputs.filter((r) => r.treatment === t).map((r) => r.netCents));

  return {
    lines: results,
    standardRate: ETH_TAX.VAT_RATE,
    totalSalesCents,
    totalPurchasesCents,
    outputVatCents,
    inputVatCents,
    nonRecoverableInputVatCents,
    netVatPayableCents: outputVatCents - inputVatCents,
    standardRatedSalesCents: byTreatment('STANDARD'),
    zeroRatedSalesCents: byTreatment('ZERO_RATED'),
    exemptSalesCents: byTreatment('EXEMPT'),
  };
}

/**
 * Verify a computation is internally consistent before it is filed.
 *
 * Cheap integer assertions that catch a corrupted payload or a bad manual
 * override before the MoR rejects the whole return.
 */
export function validateVatDeclaration(
  computation: VatDeclarationComputation,
): string[] {
  const errors: string[] = [];

  for (const key of [
    'totalSalesCents',
    'totalPurchasesCents',
    'outputVatCents',
    'inputVatCents',
    'netVatPayableCents',
  ] as const) {
    try {
      assertCents(computation[key]);
    } catch {
      errors.push(`${key} is not an exact santim integer`);
    }
  }

  const outputs = computation.lines.filter((l) => l.direction === 'OUTPUT');
  const recalculatedOutputVat = outputs.reduce((s, l) => s + l.vatCents, 0);
  if (recalculatedOutputVat !== computation.outputVatCents) {
    errors.push(
      `outputVatCents ${computation.outputVatCents} does not equal the sum of ` +
        `output line VAT ${recalculatedOutputVat}`,
    );
  }

  const salesByTreatment =
    computation.standardRatedSalesCents +
    computation.zeroRatedSalesCents +
    computation.exemptSalesCents;
  if (salesByTreatment !== computation.totalSalesCents) {
    errors.push(
      `Sales split by treatment ${salesByTreatment} does not equal ` +
        `totalSalesCents ${computation.totalSalesCents}`,
    );
  }

  if (
    computation.netVatPayableCents !==
    computation.outputVatCents - computation.inputVatCents
  ) {
    errors.push('netVatPayableCents does not equal outputVat - inputVat');
  }

  for (const line of computation.lines) {
    if (line.netCents + line.vatCents !== line.grossCents) {
      errors.push(
        `Line ${line.invoiceReference}: net + vat does not equal gross`,
      );
    }
  }

  return errors;
}

/** Minimum Alternative Tax: 2.5% of annual turnover, in santim. */
export function computeMatCents(annualTurnoverCents: number): number {
  return applyRateToCents(annualTurnoverCents, ETH_TAX.MAT_RATE);
}

/** True when annual turnover reaches the mandatory VAT registration threshold. */
export function requiresVatRegistration(annualTurnoverCents: number): boolean {
  assertCents(annualTurnoverCents);
  return annualTurnoverCents >= toCents(ETH_TAX.VAT_REGISTRATION_THRESHOLD);
}
