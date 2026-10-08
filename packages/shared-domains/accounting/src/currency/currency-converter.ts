import { PrismaClient, Prisma, Decimal } from '@ovds/database';

export interface CurrencyRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  source: string;
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateDate: Date;
  source: string;
}

export class CurrencyConverter {
  private rateCache = new Map<string, CurrencyRate>();

  constructor(private prisma: PrismaClient) {}

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date = new Date()
  ): Promise<ConversionResult> {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        fromCurrency,
        toCurrency,
        rate: 1,
        rateDate: date,
        source: 'direct',
      };
    }

    const rate = await this.getRate(fromCurrency, toCurrency, date);

    return {
      originalAmount: amount,
      convertedAmount: Number((amount * rate.rate).toFixed(4)),
      fromCurrency,
      toCurrency,
      rate: rate.rate,
      rateDate: rate.date,
      source: rate.source,
    };
  }

  async convertMultiple(
    amounts: Array<{ amount: number; fromCurrency: string }>,
    toCurrency: string,
    date: Date = new Date()
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];

    for (const { amount, fromCurrency } of amounts) {
      results.push(await this.convert(amount, fromCurrency, toCurrency, date));
    }

    return results;
  }

  async getRate(
    fromCurrency: string,
    toCurrency: string,
    date: Date
  ): Promise<CurrencyRate> {
    const cacheKey = `${fromCurrency}_${toCurrency}_${date.toISOString().split('T')[0]}`;

    if (this.rateCache.has(cacheKey)) {
      return this.rateCache.get(cacheKey)!;
    }

    const directRate = await this.prisma.currencyRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });

    if (directRate) {
      const rate: CurrencyRate = {
        fromCurrency: directRate.fromCurrency,
        toCurrency: directRate.toCurrency,
        rate: Number(directRate.rate),
        date: directRate.date,
        source: directRate.source,
      };
      this.rateCache.set(cacheKey, rate);
      return rate;
    }

    const reverseRate = await this.prisma.currencyRate.findFirst({
      where: {
        fromCurrency: toCurrency,
        toCurrency: fromCurrency,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });

    if (reverseRate) {
      const rate: CurrencyRate = {
        fromCurrency,
        toCurrency,
        rate: 1 / Number(reverseRate.rate),
        date: reverseRate.date,
        source: `${reverseRate.source} (inverted)`,
      };
      this.rateCache.set(cacheKey, rate);
      return rate;
    }

    const etbRate = await this.getRateViaBaseCurrency(fromCurrency, toCurrency, date);
    if (etbRate) {
      this.rateCache.set(cacheKey, etbRate);
      return etbRate;
    }

    throw new Error(
      `No exchange rate found for ${fromCurrency} to ${toCurrency} on or before ${date.toISOString().split('T')[0]}`
    );
  }

  private async getRateViaBaseCurrency(
    fromCurrency: string,
    toCurrency: string,
    date: Date
  ): Promise<CurrencyRate | null> {
    const baseCurrency = 'ETB';

    if (fromCurrency === baseCurrency || toCurrency === baseCurrency) {
      return null;
    }

    const fromBase = await this.getRate(fromCurrency, baseCurrency, date);
    const toBase = await this.getRate(toCurrency, baseCurrency, date);

    return {
      fromCurrency,
      toCurrency,
      rate: fromBase.rate / toBase.rate,
      date,
      source: 'cross-rate via ETB',
    };
  }

  async updateRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    date: Date = new Date(),
    source: string = 'MANUAL'
  ): Promise<void> {
    await this.prisma.currencyRate.upsert({
      where: {
        fromCurrency_toCurrency_date: {
          fromCurrency,
          toCurrency,
          date,
        },
      },
      update: { rate, source },
      create: { fromCurrency, toCurrency, rate, date, source },
    });

    this.clearCache();
  }

  async getHistoricalRates(
    fromCurrency: string,
    toCurrency: string,
    startDate: Date,
    endDate: Date
  ): Promise<CurrencyRate[]> {
    const rates = await this.prisma.currencyRate.findMany({
      where: {
        fromCurrency,
        toCurrency,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    return rates.map((r: { fromCurrency: string; toCurrency: string; rate: Decimal; date: Date; source: string }) => ({
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: Number(r.rate),
      date: r.date,
      source: r.source,
    }));
  }

  clearCache(): void {
    this.rateCache.clear();
  }
}
