/**
 * ExchangeTransformerService (NestJS wrapper)
 * ─────────────────────────────────────────────
 * Thin injectable wrapper around the framework-agnostic ExchangeTransformer.
 *
 * Provides two things beyond the pure math engine:
 *   1. Rate resolution — looks up a live or cached rate from the FxRate table
 *      for any currency pair before delegating to the pure transformer.
 *   2. Dependency injection — makes the transformer available via NestJS DI
 *      so controllers and services don't need to reach into @ovds/shared directly.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ExchangeTransformer,
  type DualAmount,
  type DualInvoiceTotals,
  type LineItemInput,
  type CurrencyCode,
} from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ExchangeTransformerService {
  private readonly logger = new Logger(ExchangeTransformerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the exchange rate for a given currency pair.
   *
   * Lookup order:
   *   1. Prisma FxRate table (most recent active rate for the pair).
   *   2. Falls back to 1.0 if the foreign currency equals the base currency.
   *   3. Returns 1.0 with a warning if no rate is found (prevents hard failure).
   *
   * @param foreignCurrency  The transaction currency (e.g. "USD")
   * @param baseCurrency     The tenant's functional currency (e.g. "ETB")
   * @param companyId        Optional — scopes the lookup to company-specific rates
   */
  async resolveRate(
    foreignCurrency: CurrencyCode,
    baseCurrency: CurrencyCode,
    companyId?: string | null,
  ): Promise<{ rate: number; rateAt: Date }> {
    if (ExchangeTransformer.isBaseCurrency(foreignCurrency, baseCurrency)) {
      return { rate: 1, rateAt: new Date() };
    }

    try {
      // Look for company-scoped rate first, then fall back to global
      const fxRate = await (this.prisma as any).fxRate?.findFirst({
        where: {
          fromCurrency: foreignCurrency.toUpperCase(),
          toCurrency: baseCurrency.toUpperCase(),
          isActive: true,
          ...(companyId ? { companyId } : {}),
        },
        orderBy: { effectiveDate: 'desc' },
        select: { rate: true, effectiveDate: true },
      });

      if (fxRate) {
        return {
          rate: Number(fxRate.rate),
          rateAt: fxRate.effectiveDate ?? new Date(),
        };
      }
    } catch {
      // FxRate table may not exist on minimal schemas — degrade gracefully
    }

    this.logger.warn(
      `ExchangeTransformerService: No rate found for ${foreignCurrency} → ${baseCurrency}. Defaulting to 1.0`,
    );
    return { rate: 1, rateAt: new Date() };
  }

  /**
   * Convert a single amount, resolving the rate automatically.
   */
  async convert(
    foreign: number,
    foreignCurrency: CurrencyCode,
    baseCurrency: CurrencyCode,
    companyId?: string | null,
  ): Promise<DualAmount> {
    const { rate, rateAt } = await this.resolveRate(foreignCurrency, baseCurrency, companyId);
    return ExchangeTransformer.convert(foreign, foreignCurrency, rate, baseCurrency, rateAt);
  }

  /**
   * Compute full invoice totals in both currencies.
   * Rate is resolved automatically from the FxRate table.
   */
  async computeInvoiceTotals(params: {
    items: LineItemInput[];
    vatRate: number;
    drrfRate: number;
    foreignCurrency: CurrencyCode;
    baseCurrency: CurrencyCode;
    companyId?: string | null;
    invoiceDiscount?: number;
    invoiceDiscountType?: 'FIXED' | 'PERCENT';
    /** If already known, skip the DB lookup */
    rateOverride?: number;
  }): Promise<DualInvoiceTotals> {
    const { rate, rateAt } = params.rateOverride !== undefined
      ? { rate: params.rateOverride, rateAt: new Date() }
      : await this.resolveRate(params.foreignCurrency, params.baseCurrency, params.companyId);

    return ExchangeTransformer.computeInvoiceTotals(
      params.items,
      params.vatRate,
      params.drrfRate,
      params.foreignCurrency,
      rate,
      params.baseCurrency,
      params.invoiceDiscount,
      params.invoiceDiscountType,
      rateAt,
    );
  }

  /**
   * Re-expose the pure static helpers for call sites that already have a rate.
   */
  readonly pure = ExchangeTransformer;
}
