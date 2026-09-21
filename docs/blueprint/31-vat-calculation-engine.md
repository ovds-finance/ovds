# 31 — Advanced VAT Calculation Engine

## 1. Calculation Architecture

The VAT calculation engine handles complex tax scenarios including multiple rates, exemptions, reverse charges, and cross-border transactions.

```
┌─────────────────────────────────────────────────────────────┐
│                    VAT Calculation Engine                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Rate      │  │   Rule      │  │   Context           │  │
│  │   Resolver  │  │   Engine    │  │   Builder           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         ▼                ▼                    ▼              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Calculator                         │   │
│  │  - Gross amount derivation                           │   │
│  │  - Line-level calculations                           │   │
│  │  - Rounding and precision                            │   │
│  │  - Cross-validation                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 2. VAT Rate Resolver

```typescript
// vat/rate-resolver.service.ts
@Injectable()
export class VatRateResolverService {
  constructor(private readonly jurisdictionService: JurisdictionService) {}

  async resolveRate(params: RateResolutionParams): Promise<VatRateResolution> {
    const jurisdiction = await this.jurisdictionService.findById(params.jurisdictionId);

    // 1. Check for specific rate override
    if (params.rateCode) {
      const rate = jurisdiction.vatRates.find((r) => r.code === params.rateCode && r.isActive);
      if (rate) return { rate, source: 'override' };
    }

    // 2. Check for product-specific rate
    if (params.productCategory) {
      const rate = this.findRateByCategory(jurisdiction, params.productCategory);
      if (rate) return { rate, source: 'category' };
    }

    // 3. Check for customer-specific rate (B2B reverse charge, etc.)
    if (params.customerVatNumber) {
      const specialRate = await this.checkSpecialCustomerRate(params);
      if (specialRate) return { rate: specialRate, source: 'customer' };
    }

    // 4. Check for transaction-specific rate
    if (params.transactionType === 'intra_community') {
      return { rate: { rate: 0, type: 'zero', code: 'ZR' }, source: 'intra_community' };
    }

    // 5. Default standard rate
    const standardRate = jurisdiction.vatRates.find((r) => r.type === 'standard' && r.isActive);
    if (standardRate) return { rate: standardRate, source: 'default' };

    throw new NoApplicableVatRateException(params.jurisdictionId);
  }

  private findRateByCategory(jurisdiction: Jurisdiction, category: string): VatRate | null {
    const categoryRates: Record<string, string> = {
      'books': 'RED',
      'food': 'RED',
      'medical': 'ZR',
      'education': 'ZR',
      'standard': 'STD',
    };

    const code = categoryRates[category] || 'STD';
    return jurisdiction.vatRates.find((r) => r.code === code && r.isActive) || null;
  }
}
```

## 3. Calculation Context Builder

```typescript
// vat/context-builder.service.ts
export interface CalculationContext {
  jurisdictionId: string;
  transactionDate: Date;
  customer?: {
    vatNumber?: string;
    countryCode?: string;
    isBusiness: boolean;
  };
  supplier?: {
    vatNumber?: string;
    countryCode?: string;
  };
  productCategory?: string;
  transactionType: 'domestic' | 'intra_community' | 'export' | 'import';
  specialScheme?: string; // "MOSS", "OSS", "IOSS"
}

@Injectable()
export class CalculationContextBuilderService {
  async build(params: BuildContextParams): Promise<CalculationContext> {
    const jurisdiction = await this.jurisdictionService.findById(params.jurisdictionId);
    const customer = params.customerId ? await this.contactService.findById(params.customerId) : undefined;

    const transactionType = this.determineTransactionType(jurisdiction, customer);

    return {
      jurisdictionId: params.jurisdictionId,
      transactionDate: params.transactionDate || new Date(),
      customer: customer ? {
        vatNumber: customer.vatId,
        countryCode: customer.countryCode,
        isBusiness: customer.isBusiness,
      } : undefined,
      supplier: params.supplier,
      productCategory: params.productCategory,
      transactionType,
      specialScheme: params.specialScheme,
    };
  }

  private determineTransactionType(jurisdiction: Jurisdiction, customer?: Contact): TransactionType {
    if (!customer) return 'domestic';
    if (customer.countryCode === jurisdiction.countryCode) return 'domestic';
    if (customer.isBusiness && customer.vatId) return 'intra_community';
    if (!customer.isBusiness) return 'export';
    return 'domestic';
  }
}
```

## 4. VAT Calculator

```typescript
// vat/calculator.service.ts
@Injectable()
export class VatCalculatorService {
  constructor(
    private readonly rateResolver: VatRateResolverService,
    private readonly contextBuilder: CalculationContextBuilderService,
    private readonly roundingService: RoundingService,
  ) {}

  async calculateLine(params: CalculateLineParams): Promise<LineCalculationResult> {
    const context = await this.contextBuilder.build({
      jurisdictionId: params.jurisdictionId,
      transactionDate: params.transactionDate,
      customerId: params.customerId,
      productCategory: params.productCategory,
      transactionType: params.transactionType,
      specialScheme: params.specialScheme,
    });

    const { rate } = await this.rateResolver.resolveRate({
      jurisdictionId: params.jurisdictionId,
      rateCode: params.rateCode,
      productCategory: params.productCategory,
      customerVatNumber: context.customer?.vatNumber,
      transactionType: context.transactionType,
    });

    const isReverseCharge = this.isReverseCharge(context, rate);
    const isExempt = rate.type === 'exempt' || rate.type === 'zero';

    let netAmount = params.netAmount || this.calculateNet(params.grossAmount, rate.rate);
    let vatAmount = 0;
    let grossAmount = netAmount;

    if (!isExempt && !isReverseCharge) {
      vatAmount = this.roundingService.roundVat(netAmount * (rate.rate / 100));
      grossAmount = netAmount + vatAmount;
    } else if (isReverseCharge) {
      vatAmount = 0;
      grossAmount = netAmount;
    }

    return {
      netAmount,
      vatAmount,
      grossAmount,
      vatRate: rate.rate,
      vatRateCode: rate.code,
      vatRateType: rate.type,
      isReverseCharge,
      isExempt,
      breakdown: {
        rateSource: 'standard',
        calculationMethod: 'gross_to_net',
        precision: 2,
      },
    };
  }

  async calculateReturn(params: CalculateReturnParams): Promise<ReturnCalculationResult> {
    const items = await Promise.all(
      params.items.map((item) => this.calculateLine({ ...item, jurisdictionId: params.jurisdictionId }))
    );

    const totals = items.reduce(
      (acc, item) => {
        acc.netSales += item.netAmount;
        acc.vatOnSales += item.vatAmount;
        acc.grossSales += item.grossAmount;

        if (item.type === 'purchase') {
          acc.netPurchases += item.netAmount;
          acc.vatOnPurchases += item.vatAmount;
        }

        return acc;
      },
      { netSales: 0, vatOnSales: 0, grossSales: 0, netPurchases: 0, vatOnPurchases: 0 },
    );

    totals.vatDue = totals.vatOnSales - totals.vatOnPurchases;
    totals.netVatDue = this.roundingService.roundCurrency(totals.vatDue);

    return {
      items,
      totals,
      summary: {
        totalSales: totals.grossSales,
        totalPurchases: totals.netPurchases + totals.vatOnPurchases,
        totalVatDue: totals.vatOnSales,
        totalVatReclaim: totals.vatOnPurchases,
        netVatDue: totals.netVatDue,
      },
    };
  }

  private calculateNet(grossAmount: Decimal, vatRate: Decimal): Decimal {
    return this.roundingService.roundCurrency(grossAmount / (1 + vatRate / 100));
  }

  private isReverseCharge(context: CalculationContext, rate: VatRate): boolean {
    return (
      context.transactionType === 'intra_community' &&
      context.customer?.isBusiness &&
      rate.type !== 'zero'
    );
  }
}
```

## 5. Rounding Service

```typescript
// vat/rounding.service.ts
@Injectable()
export class RoundingService {
  private readonly currencyPrecision = 2;
  private readonly vatPrecision = 2;

  roundCurrency(amount: Decimal): Decimal {
    return amount.toDecimalPlaces(this.currencyPrecision, Decimal.ROUND_HALF_UP);
  }

  roundVat(amount: Decimal): Decimal {
    return amount.toDecimalPlaces(this.vatPrecision, Decimal.ROUND_HALF_UP);
  }

  distributeRounding(total: Decimal, count: number): Decimal[] {
    const base = this.roundCurrency(total.dividedBy(count));
    const remainder = total.minus(base.times(count));
    const distribution: Decimal[] = [];

    for (let i = 0; i < count; i++) {
      const rounded = i < remainder.toNumber() ? base.plus(0.01) : base;
      distribution.push(this.roundCurrency(rounded));
    }

    return distribution;
  }

  // VAT rounding per line, then totals
  calculateLineVat(netAmount: Decimal, vatRate: Decimal): Decimal {
    const vat = netAmount.times(vatRate.dividedBy(100));
    return this.roundVat(vat);
  }

  // Per-line rounding can cause small discrepancies; adjust last line
  adjustForRoundingDiscrepancy(lines: LineCalculationResult[], expectedTotal: Decimal): LineCalculationResult[] {
    const actualTotal = lines.reduce((sum, line) => sum.plus(line.vatAmount), Decimal.ZERO);
    const discrepancy = expectedTotal.minus(actualTotal);

    if (discrepancy.isZero()) return lines;

    const adjustedLines = [...lines];
    adjustedLines[adjustedLines.length - 1].vatAmount = this.roundVat(
      adjustedLines[adjustedLines.length - 1].vatAmount.plus(discrepancy),
    );
    adjustedLines[adjustedLines.length - 1].grossAmount = this.roundCurrency(
      adjustedLines[adjustedLines.length - 1].netAmount.plus(adjustedLines[adjustedLines.length - 1].vatAmount),
    );

    return adjustedLines;
  }
}
```

## 6. Reverse Charge Mechanism

```typescript
// vat/reverse-charge.service.ts
@Injectable()
export class ReverseChargeService {
  async applyReverseCharge(params: ReverseChargeParams): Promise<ReverseChargeResult> {
    const netAmount = params.grossAmount;
    const vatRate = await this.getVatRate(params.jurisdictionId);

    // Reverse charge: customer accounts for VAT
    return {
      netAmount,
      vatAmount: 0,
      grossAmount: netAmount,
      reverseChargeVat: this.calculateVat(netAmount, vatRate),
      reverseChargeNote: 'Reverse charge - VAT to be accounted by customer',
      accountingEntries: [
        { account: 'sales', debit: netAmount, credit: 0 },
        { account: 'vat_output', debit: 0, credit: 0 },
        { account: 'accounts_receivable', debit: 0, credit: netAmount },
      ],
    };
  }
}
```

## 7. Special VAT Schemes

### 7.1 MOSS (Mini One Stop Shop)

```typescript
// vat/schemes/moss.service.ts
@Injectable()
export class MossService {
  async calculateMossReturn(orgId: string, period: DateRange): Promise<MossReturn> {
    const b2cTransactions = await this.transactionService.findB2CDigitalServices(orgId, period);

    const byCountry = this.groupByCountry(b2cTransactions);
    const totals = new Map<string, MossCountryTotal>();

    for (const [countryCode, transactions] of Object.entries(byCountry)) {
      const netTotal = transactions.reduce((sum, t) => sum.plus(t.grossAmount), Decimal.ZERO);
      const vatTotal = transactions.reduce((sum, t) => sum.plus(t.vatAmount), Decimal.ZERO);

      totals.set(countryCode, {
        countryCode,
        netTotal: this.roundingService.roundCurrency(netTotal),
        vatTotal: this.roundingService.roundVat(vatTotal),
        transactionCount: transactions.length,
      });
    }

    return { period, totals: Array.from(totals.values()) };
  }
}
```

### 7.2 OSS (One Stop Shop)

```typescript
// vat/schemes/oss.service.ts
@Injectable()
export class OssService {
  async calculateOSSReturn(orgId: string, period: DateRange): Promise<OSSTReturn> {
    // OSS applies to B2B and B2C intra-community supplies
    const transactions = await this.transactionService.findIntraCommunity(orgId, period);

    const byCountry = this.groupByCountry(transactions);
    // Similar to MOSS but includes B2B
    return this.buildReturn(byCountry, includeB2B: true);
  }
}
```

## 8. VAT Return Validation

```typescript
// vat/validation/return-validator.service.ts
@Injectable()
export class ReturnValidatorService {
  async validate(returnId: string): Promise<ValidationResult> {
    const vatReturn = await this.vatReturnService.findById(returnId);
    const items = await this.vatReturnItemService.findByReturnId(returnId);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Line-level validation
    for (const item of items) {
      const expectedGross = item.netAmount + item.vatAmount;
      if (Math.abs(expectedGross - item.grossAmount) > 0.01) {
        errors.push({
          field: `items.${item.id}.grossAmount`,
          message: `Gross amount does not match net + VAT`,
          expected: expectedGross,
          actual: item.grossAmount,
        });
      }
    }

    // 2. Total validation
    const calculatedTotals = await this.vatCalculator.calculateReturn({
      items,
      jurisdictionId: vatReturn.jurisdictionId,
    });

    if (Math.abs(calculatedTotals.totals.netVatDue - (vatReturn.netVatDue || 0)) > 0.01) {
      errors.push({
        field: 'netVatDue',
        message: 'Return total does not match sum of items',
        expected: calculatedTotals.totals.netVatDue,
        actual: vatReturn.netVatDue,
      });
    }

    // 3. Period validation
    if (vatReturn.periodStart >= vatReturn.periodEnd) {
      errors.push({
        field: 'period',
        message: 'Period start must be before period end',
      });
    }

    // 4. Warnings
    if (items.length === 0) {
      warnings.push({
        field: 'items',
        message: 'Return has no line items',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
```

## 9. VAT Reconciliation

```typescript
// vat/reconciliation.service.ts
@Injectable()
export class VatReconciliationService {
  async reconcile(orgId: string, period: DateRange): Promise<ReconciliationResult> {
    const [accountingVat, declaredVat] = await Promise.all([
      this.getAccountingVat(orgId, period),
      this.getDeclaredVat(orgId, period),
    ]);

    const discrepancies: Discrepancy[] = [];

    for (const jurisdiction of accountingVat.jurisdictions) {
      const declared = declaredVat.byJurisdiction[jurisdiction.id] || 0;
      const accounting = jurisdiction.vatAmount;

      if (Math.abs(accounting - declared) > 0.01) {
        discrepancies.push({
          jurisdictionId: jurisdiction.id,
          accountingVat: accounting,
          declaredVat: declared,
          difference: accounting - declared,
        });
      }
    }

    return {
      period,
      totalAccountingVat: accountingVat.total,
      totalDeclaredVat: declaredVat.total,
      difference: accountingVat.total - declaredVat.total,
      discrepancies,
      isReconciled: discrepancies.length === 0,
    };
  }
}
```

## 10. Audit Trail for Calculations

```typescript
// vat/audit/calculation-audit.service.ts
@Injectable()
export class CalculationAuditService {
  async auditCalculation(params: AuditCalculationParams): Promise<CalculationAudit> {
    const audit: CalculationAudit = {
      id: randomUUID(),
      entityType: params.entityType,
      entityId: params.entityId,
      calculationType: params.calculationType,
      input: params.input,
      output: params.output,
      rates: params.rates,
      context: params.context,
      calculatedAt: new Date(),
      calculatedBy: params.userId,
    };

    await this.prisma.calculationAudit.create({
      data: audit,
    });

    return audit;
  }
}
```
