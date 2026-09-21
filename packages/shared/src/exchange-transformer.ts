/**
 * ExchangeTransformer — Ovds SaaS Multi-Currency Engine
 * ──────────────────────────────────────────────────────
 * Isolated multi-currency math engine for Ovds SaaS.
 *
 * Ovds SaaS architecture principle:
 *   "All core math calculations run through an isolated Exchange Transformer.
 *    When an invoice is created in a vendor's foreign currency, the state
 *    manager retains BOTH the base transaction value AND the calculated
 *    converted local currency simultaneously."
 *
 * This module is intentionally framework-agnostic: no NestJS decorators,
 * no Prisma, no side-effects. It is pure computation consumed by the
 * backend service layer, the frontend InvoiceFormAk, and tests alike.
 */

// ── Core types ────────────────────────────────────────────────────────────────

/** ISO-4217 currency code, e.g. "ETB", "USD", "EUR". */
export type CurrencyCode = string;

/**
 * A monetary amount that always carries both its original (foreign) value
 * and its equivalent in the tenant's functional (base) currency.
 *
 * This dual representation is the single most important invariant of the
 * ExchangeTransformer: once a value is converted, neither side is lost.
 */
export interface DualAmount {
  /** Amount in the original transaction currency */
  foreign: number;
  /** ISO-4217 code of the foreign currency, e.g. "USD" */
  foreignCurrency: CurrencyCode;
  /** Exchange rate applied: 1 unit of foreignCurrency = rate × baseCurrency */
  rate: number;
  /** Equivalent amount in the tenant's base (functional) currency */
  base: number;
  /** ISO-4217 code of the base (functional) currency, e.g. "ETB" */
  baseCurrency: CurrencyCode;
  /** Timestamp when the rate was captured — important for audit trails */
  rateAt: Date;
}

/**
 * A complete invoice monetary breakdown in both currencies.
 */
export interface DualInvoiceTotals {
  subtotal:     DualAmount;
  vatAmount:    DualAmount;
  drrfAmount:   DualAmount;
  totalAmount:  DualAmount;
  discountAmount: DualAmount;
}

/**
 * Input for a single line item, currency-agnostic.
 */
export interface LineItemInput {
  quantity: number;
  price: number;
  /** Line-level discount value */
  discountValue?: number;
  /** 'FIXED' | 'PERCENT' */
  discountType?: string;
  /** Whether VAT applies to this line (default: true) */
  taxable?: boolean;
}

/**
 * Rounding strategy — mirrors Ethiopian MoR expectations.
 * All monetary values are rounded to 2 decimal places.
 */
const PRECISION = 2;
function round(n: number): number {
  return Math.round(n * 10 ** PRECISION) / 10 ** PRECISION;
}

// ── ExchangeTransformer ───────────────────────────────────────────────────────

export class ExchangeTransformer {
  /**
   * Convert a single foreign-currency amount to the base currency.
   *
   * @param foreign        Amount in the foreign currency
   * @param foreignCurrency ISO-4217 code of the foreign currency
   * @param rate           Exchange rate: 1 foreignCurrency = rate baseCurrency units
   * @param baseCurrency   ISO-4217 code of the tenant's functional currency
   * @param rateAt         Timestamp the rate was captured (defaults to now)
   */
  static convert(
    foreign: number,
    foreignCurrency: CurrencyCode,
    rate: number,
    baseCurrency: CurrencyCode,
    rateAt: Date = new Date(),
  ): DualAmount {
    if (rate <= 0) {
      throw new RangeError(
        `ExchangeTransformer: rate must be > 0, got ${rate}`,
      );
    }
    return {
      foreign: round(foreign),
      foreignCurrency,
      rate,
      base: round(foreign * rate),
      baseCurrency,
      rateAt,
    };
  }

  /**
   * Compute full invoice totals, returning every monetary component as a
   * DualAmount so the caller always has both foreign and base representations.
   *
   * @param items           Line items (prices already in foreignCurrency)
   * @param vatRate         VAT rate as a percentage, e.g. 15 for 15%
   * @param drrfRate        DRRF rate as a percentage, e.g. 1 for 1%
   * @param foreignCurrency ISO-4217 code of the invoice currency
   * @param rate            Exchange rate to the tenant's base currency
   * @param baseCurrency    Tenant's functional currency (e.g. "ETB")
   * @param invoiceDiscount Invoice-level discount (applied before DRRF)
   * @param invoiceDiscountType 'FIXED' | 'PERCENT'
   * @param rateAt          When the rate was captured
   */
  static computeInvoiceTotals(
    items: LineItemInput[],
    vatRate: number,
    drrfRate: number,
    foreignCurrency: CurrencyCode,
    rate: number,
    baseCurrency: CurrencyCode,
    invoiceDiscount = 0,
    invoiceDiscountType: 'FIXED' | 'PERCENT' = 'FIXED',
    rateAt: Date = new Date(),
  ): DualInvoiceTotals {
    // 1. Compute foreign-currency subtotal from line items
    const subtotalForeign = items.reduce((acc, item) => {
      const gross = item.price * item.quantity;
      const disc =
        (item.discountType ?? 'FIXED') === 'PERCENT'
          ? gross * ((item.discountValue ?? 0) / 100)
          : (item.discountValue ?? 0);
      return acc + Math.max(0, gross - disc);
    }, 0);

    // 2. Invoice-level discount (applied on top of line discounts)
    const invoiceDiscForeign =
      invoiceDiscountType === 'PERCENT'
        ? subtotalForeign * (invoiceDiscount / 100)
        : invoiceDiscount;
    const subtotalAfterDiscForeign = Math.max(0, subtotalForeign - invoiceDiscForeign);

    // 3. VAT (applied per taxable line, on their individual net amounts)
    const vatForeign = items.reduce((acc, item) => {
      if (item.taxable === false) return acc;
      const gross = item.price * item.quantity;
      const disc =
        (item.discountType ?? 'FIXED') === 'PERCENT'
          ? gross * ((item.discountValue ?? 0) / 100)
          : (item.discountValue ?? 0);
      const net = Math.max(0, gross - disc);
      return acc + net * (vatRate / 100);
    }, 0);

    // 4. DRRF: 1% of subtotal after invoice-level discount (Regulation 570/2025)
    const drrfForeign = subtotalAfterDiscForeign * (drrfRate / 100);

    // 5. Grand total
    const totalForeign = subtotalAfterDiscForeign + vatForeign + drrfForeign;

    const mk = (f: number) =>
      ExchangeTransformer.convert(f, foreignCurrency, rate, baseCurrency, rateAt);

    return {
      subtotal:      mk(subtotalAfterDiscForeign),
      vatAmount:     mk(vatForeign),
      drrfAmount:    mk(drrfForeign),
      totalAmount:   mk(totalForeign),
      discountAmount: mk(invoiceDiscForeign),
    };
  }

  /**
   * Re-state a historical DualAmount at a new exchange rate.
   * Useful when displaying an old invoice that was recorded in a foreign
   * currency but needs to show its current-rate equivalent in a report.
   */
  static restate(amount: DualAmount, newRate: number, newRateAt: Date = new Date()): DualAmount {
    return {
      ...amount,
      rate: newRate,
      base: round(amount.foreign * newRate),
      rateAt: newRateAt,
    };
  }

  /**
   * Check whether a transaction currency is the same as the base currency.
   * When true, rate is always 1 and no conversion is needed.
   */
  static isBaseCurrency(
    foreignCurrency: CurrencyCode,
    baseCurrency: CurrencyCode,
  ): boolean {
    return foreignCurrency.toUpperCase() === baseCurrency.toUpperCase();
  }

  /**
   * Format a DualAmount for display: returns a locale string in the
   * foreign currency, with an optional parenthetical base equivalent.
   *
   * Example: "USD 1,250.00 (ETB 72,500.00)"
   */
  static format(
    amount: DualAmount,
    locale = 'en-ET',
    showBase = true,
  ): string {
    const fmtForeign = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: amount.foreignCurrency,
      minimumFractionDigits: PRECISION,
    }).format(amount.foreign);

    if (!showBase || ExchangeTransformer.isBaseCurrency(amount.foreignCurrency, amount.baseCurrency)) {
      return fmtForeign;
    }

    const fmtBase = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: amount.baseCurrency,
      minimumFractionDigits: PRECISION,
    }).format(amount.base);

    return `${fmtForeign} (${fmtBase})`;
  }
}

// ── Convenience re-exports ────────────────────────────────────────────────────

export { round as roundCurrency };
