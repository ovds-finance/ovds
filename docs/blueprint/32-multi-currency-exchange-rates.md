# 32 — Multi-Currency and Exchange Rate Handling

## 1. Currency Architecture

The system supports multi-currency operations with automatic conversion based on daily exchange rates.

```prisma
model Currency {
  code        String   @id @db.Char(3) // ISO 4217
  name        String
  symbol      String
  decimalPlaces Int    @default(2)
  isBase      Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ExchangeRate {
  id            String   @id @default(cuid())
  fromCurrency  String
  toCurrency    String
  rate          Decimal  @db.Decimal(18, 6)
  effectiveDate DateTime
  source        String   // "ecb", "manual", "api"
  createdAt     DateTime @default(now())

  @@unique([fromCurrency, toCurrency, effectiveDate])
  @@index([fromCurrency, toCurrency, effectiveDate])
}
```

## 2. Currency Service

```typescript
// currencies/currency.service.ts
@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  async getBaseCurrency(): Promise<Currency> {
    return this.prisma.currency.findFirst({ where: { isBase: true } });
  }

  async getExchangeRate(from: string, to: string, date: Date): Promise<Decimal> {
    if (from === to) return Decimal(1);

    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: from,
        toCurrency: to,
        effectiveDate: { lte: date },
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rate) {
      throw new ExchangeRateNotFoundException(from, to, date);
    }

    return Decimal(rate.rate);
  }

  async convert(amount: Decimal, from: string, to: string, date: Date): Promise<Decimal> {
    const rate = await this.getExchangeRate(from, to, date);
    return amount.times(rate);
  }
}
```

## 3. Exchange Rate Ingestion

```typescript
// currencies/services/exchange-rate-ingestion.service.ts
@Injectable()
export class ExchangeRateIngestionService {
  constructor(private readonly currencyService: CurrencyService, private readonly queueService: QueueService) {}

  async ingestDailyRates(): Promise<void> {
    const baseCurrency = await this.currencyService.getBaseCurrency();
    const currencies = await this.currencyService.findActive();

    for (const currency of currencies) {
      if (currency.code === baseCurrency.code) continue;

      await this.queueService.addToDefault('fetch_exchange_rate', {
        fromCurrency: baseCurrency.code,
        toCurrency: currency.code,
        date: new Date(),
      });
    }
  }
}

// queue/processors/exchange-rate.processor.ts
@Processor('default')
export class ExchangeRateProcessor {
  constructor(private readonly currencyService: CurrencyService) {}

  @Process('fetch_exchange_rate')
  async fetchRate(job: Job<ExchangeRateJobData>) {
    const { fromCurrency, toCurrency, date } = job.data;
    const rate = await this.fetchFromECB(fromCurrency, toCurrency, date);

    await this.prisma.exchangeRate.create({
      data: {
        fromCurrency,
        toCurrency,
        rate: rate.toString(),
        effectiveDate: date,
        source: 'ecb',
      },
    });
  }

  private async fetchFromECB(from: string, to: string, date: Date): Promise<Decimal> {
    // European Central Bank API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const data = await response.json();
    return Decimal(data.rates[to]);
  }
}
```

## 4. Transaction Currency Conversion

```typescript
// transactions/services/currency-conversion.service.ts
@Injectable()
export class CurrencyConversionService {
  constructor(private readonly currencyService: CurrencyService) {}

  async convertTransaction(transaction: Transaction): Promise<ConvertedTransaction> {
    const org = await this.organizationService.findById(transaction.organizationId);
    const baseCurrency = org.currencyCode;

    if (transaction.currencyCode === baseCurrency) {
      return {
        ...transaction,
        convertedNetAmount: transaction.netAmount,
        convertedVatAmount: transaction.vatAmount || 0,
        convertedGrossAmount: transaction.grossAmount,
        exchangeRate: Decimal(1),
      };
    }

    const exchangeRate = await this.currencyService.getExchangeRate(
      transaction.currencyCode,
      baseCurrency,
      transaction.transactionDate,
    );

    const convertedNetAmount = transaction.netAmount.times(exchangeRate);
    const convertedVatAmount = (transaction.vatAmount || 0).times(exchangeRate);
    const convertedGrossAmount = transaction.grossAmount.times(exchangeRate);

    return {
      ...transaction,
      convertedNetAmount,
      convertedVatAmount,
      convertedGrossAmount,
      exchangeRate,
    };
  }
}
```

## 5. Currency Formatting

```typescript
// libs/shared/src/utils/currency.ts
export function formatCurrency(amount: Decimal, currencyCode: string, locale = 'en'): string {
  const currency = getCurrencyByCode(currencyCode);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  }).format(amount.toNumber());
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  return currency.symbol;
}

export function formatExchangeRate(rate: Decimal, from: string, to: string): string {
  return `1 ${from} = ${rate.toFixed(4)} ${to}`;
}
```

## 6. Reporting in Base Currency

```typescript
// reporting/services/base-currency-report.service.ts
@Injectable()
export class BaseCurrencyReportService {
  async generateVatSummary(orgId: string, period: DateRange): Promise<VatSummaryReport> {
    const org = await this.organizationService.findById(orgId);
    const baseCurrency = org.currencyCode;

    const transactions = await this.transactionService.findMany(orgId, { dateRange: period });

    const converted = await Promise.all(
      transactions.map((t) => this.currencyConversionService.convertTransaction(t)),
    );

    const summary = converted.reduce(
      (acc, t) => {
        acc.totalSales += t.convertedGrossAmount;
        acc.totalVat += t.convertedVatAmount;
        return acc;
      },
      { totalSales: Decimal(0), totalVat: Decimal(0) },
    );

    return {
      organizationId: orgId,
      period,
      currency: baseCurrency,
      totalSales: this.roundingService.roundCurrency(summary.totalSales),
      totalVat: this.roundingService.roundVat(summary.totalVat),
      transactionCount: converted.length,
    };
  }
}
```

## 7. Exchange Rate Exposure

```typescript
// currencies/services/exposure.service.ts
@Injectable()
export class CurrencyExposureService {
  async calculateExposure(orgId: string, asOfDate: Date): Promise<CurrencyExposure> {
    const openTransactions = await this.prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        isReconciled: false,
        transactionDate: { lte: asOfDate },
      },
    });

    const byCurrency = new Map<string, Decimal>();

    for (const transaction of openTransactions) {
      const converted = await this.currencyConversionService.convertTransaction(transaction);
      const current = byCurrency.get(transaction.currencyCode) || Decimal(0);
      byCurrency.set(transaction.currencyCode, current.plus(converted.convertedGrossAmount));
    }

    return {
      asOfDate,
      baseCurrency: (await this.organizationService.findById(orgId)).currencyCode,
      exposures: Array.from(byCurrency.entries()).map(([currency, amount]) => ({
        currency,
        amount: this.roundingService.roundCurrency(amount),
      })),
    };
  }
}
```

## 8. Hedging and Risk Management

```typescript
// currencies/services/hedging.service.ts
export interface Hedge {
  id: string;
  organizationId: string;
  currencyPair: string;
  amount: Decimal;
  rate: Decimal;
  startDate: Date;
  endDate: Date;
  type: 'forward' | 'option';
  status: 'active' | 'expired' | 'closed';
}

@Injectable()
export class HedgingService {
  async createHedge(orgId: string, params: CreateHedgeParams): Promise<Hedge> {
    return this.prisma.hedge.create({
      data: {
        organizationId: orgId,
        currencyPair: `${params.fromCurrency}/${params.toCurrency}`,
        amount: params.amount,
        rate: params.rate,
        startDate: params.startDate,
        endDate: params.endDate,
        type: params.type,
        status: 'active',
      },
    });
  }

  async calculateHedgeEffectiveness(hedgeId: string): Promise<HedgeEffectiveness> {
    const hedge = await this.prisma.hedge.findUnique({ where: { id: hedgeId } });
    const currentRate = await this.currencyService.getExchangeRate(
      hedge.currencyPair.split('/')[0],
      hedge.currencyPair.split('/')[1],
      new Date(),
    );

    const hedgedValue = hedge.amount.times(hedge.rate);
    const unhedgedValue = hedge.amount.times(currentRate);
    const pnl = hedgedValue.minus(unhedgedValue);

    return {
      hedgeId,
      hedgedValue,
      unhedgedValue,
      pnl,
      effectiveness: Math.abs(pnl.toNumber() / hedgedValue.toNumber()),
    };
  }
}
```

## 9. Historical Rate Lookback

```typescript
// currencies/services/historical-rate.service.ts
@Injectable()
export class HistoricalRateService {
  async getRateAtDate(from: string, to: string, date: Date): Promise<ExchangeRate> {
    return this.prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: from,
        toCurrency: to,
        effectiveDate: { lte: date },
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async getRateForTransaction(transaction: Transaction): Promise<Decimal> {
    // Use rate from transaction date or nearest available
    const rate = await this.getRateAtDate(
      transaction.currencyCode,
      transaction.exchangeRateCurrency,
      transaction.transactionDate,
    );

    return Decimal(rate.rate);
  }
}
```

## 10. Currency Precision Rules

| Currency | Decimal Places | Rounding Rule |
|----------|---------------|---------------|
| USD, EUR, GBP | 2 | Half-up |
| JPY, KRW | 0 | Half-up |
| BHD, KWD | 3 | Half-up |
| BTC, ETH | 8 | Half-up |
