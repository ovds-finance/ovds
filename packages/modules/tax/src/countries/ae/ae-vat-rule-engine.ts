/**
 * @file ae-vat-rule-engine.ts
 * @module @ovds/tax/countries/ae
 *
 * UAE VAT Rule Engine
 * ───────────────────
 * Implements UAE Federal VAT per:
 *  • Federal Decree-Law No. 8 of 2017 (VAT Law)
 *  • Cabinet Decision No. 52 of 2017 (Executive Regulation)
 *  • Federal Tax Authority (FTA) Public Clarifications
 *
 * Key rules:
 *  • Standard rate:  5% on all taxable supplies (effective 1 Jan 2018)
 *  • Zero-rated:     Exports of goods/services, international transport,
 *                    certain healthcare, certain education, newly constructed
 *                    residential buildings (first supply), crude oil/gas
 *  • Exempt:         Bare land, residential property (subsequent supply),
 *                    local passenger transport, certain financial services
 *  • Registration threshold: AED 375,000 mandatory / AED 187,500 voluntary
 *  • Reverse charge: Imports of goods (Customs), imported services
 *  • Filing: Quarterly (due 28th day after period end) or Monthly (if annual
 *    turnover > AED 150 million)
 *  • Designated zones: special rules — treated as outside UAE for VAT
 *  • Profit Margin Scheme: second-hand goods (Art. 31 Exec. Reg.)
 */

import { AbstractVatRuleEngine } from '@ovds/core/vat';
import type {
  VatRate,
  VatContext,
  VatComplianceIssue,
  VatReturnDraft,
  VatJurisdictionInfo,
  VatFilingPeriod,
  VatLineResult,
  FilingFrequency,
} from '@ovds/core/vat';

// ─── Zero-rated category codes ────────────────────────────────────────────────
const ZERO_RATED_SUPPLY_TYPES = new Set([
  'EXPORT_GOODS',
  'EXPORT_SERVICES',
  'INTERNATIONAL_TRANSPORT',
  'HEALTHCARE_ZERO',
  'EDUCATION_ZERO',
  'INVESTMENT_GOLD',
  'CRUDE_OIL',
  'NATURAL_GAS',
  'FIRST_RESIDENTIAL_SUPPLY',
]);

// ─── Exempt supply types ──────────────────────────────────────────────────────
const EXEMPT_SUPPLY_TYPES = new Set([
  'BARE_LAND',
  'RESIDENTIAL_PROPERTY_SUBSEQUENT',
  'LOCAL_PASSENGER_TRANSPORT',
  'FINANCIAL_SERVICES_MARGIN',
]);

export class AeVatRuleEngine extends AbstractVatRuleEngine {
  readonly countryCode    = 'AE';
  readonly ruleSetVersion = '1.3.0'; // FDL 8/2017 + 2024 FTA clarifications

  // ── Rate definitions ─────────────────────────────────────────────────────

  protected allRates(): VatRate[] {
    return [
      {
        countryCode:   'AE',
        label:         'Standard Rate',
        rateType:      'STANDARD',
        rate:          5,
        effectiveFrom: '2018-01-01',
        effectiveTo:   null,
      },
      {
        countryCode:   'AE',
        label:         'Zero-Rated',
        rateType:      'ZERO_RATED',
        rate:          0,
        effectiveFrom: '2018-01-01',
        effectiveTo:   null,
      },
      {
        countryCode:   'AE',
        label:         'Exempt',
        rateType:      'EXEMPT',
        rate:          0,
        effectiveFrom: '2018-01-01',
        effectiveTo:   null,
      },
    ];
  }

  // ── Calculate — UAE mixed-supply logic ───────────────────────────────────

  calculate(ctx: VatContext) {
    const date     = ctx.transactionDate;
    const warnings: string[] = [];

    const supplyType = (ctx.meta?.supplyType as string) ?? '';

    // 1. Zero-rated supplies
    if (ctx.isExport || ZERO_RATED_SUPPLY_TYPES.has(supplyType)) {
      const zeroRate = this.resolveRate('ZERO_RATED', date)!;
      return this.assembleResult(ctx, this.applyRates(ctx, [zeroRate], warnings), warnings);
    }

    // 2. Exempt supplies
    if (EXEMPT_SUPPLY_TYPES.has(supplyType)) {
      const exemptRate = this.resolveRate('EXEMPT', date)!;
      return this.assembleResult(ctx, this.applyRates(ctx, [exemptRate], warnings), warnings);
    }

    // 3. Designated zone — treated as outside UAE; no UAE VAT
    if (ctx.meta?.isDesignatedZone === true) {
      const exemptRate = this.resolveRate('EXEMPT', date)!;
      warnings.push('Supply involves a UAE Designated Zone — treated as outside UAE for VAT purposes.');
      return this.assembleResult(ctx, this.applyRates(ctx, [exemptRate], warnings), warnings);
    }

    // 4. Profit Margin Scheme (second-hand goods) — VAT on margin only
    if (ctx.meta?.profitMarginScheme === true) {
      const margin     = (ctx.meta.margin as number) ?? 0;
      const stdRate    = this.resolveRate('STANDARD', date)!;
      const vatAmount  = round2(margin * (stdRate.rate / 100));
      const line: VatLineResult = {
        description:   `Profit Margin Scheme VAT @ ${stdRate.rate}% on margin of AED ${margin}`,
        rateType:      'STANDARD',
        rate:          stdRate.rate,
        taxableAmount: margin,
        vatAmount,
      };
      warnings.push('Profit Margin Scheme applied — VAT calculated on margin, not full value.');
      return this.assembleResult(ctx, [line], warnings);
    }

    // 5. Reverse charge on imported services / goods
    if (ctx.reverseCharge || ctx.isImport) {
      const stdRate = this.resolveRate('STANDARD', date)!;
      warnings.push('Reverse-charge VAT applied on imported supply (Art. 48, FDL 8/2017).');
      return this.assembleResult(ctx, this.applyRates(ctx, [stdRate], warnings), warnings);
    }

    // 6. Standard taxable supply @ 5%
    const stdRate = this.resolveRate('STANDARD', date)!;
    return this.assembleResult(ctx, this.applyRates(ctx, [stdRate], warnings), warnings);
  }

  // ── Custom compliance rules ───────────────────────────────────────────────

  protected async validateCustomRules(ctx: VatContext): Promise<VatComplianceIssue[]> {
    const issues: VatComplianceIssue[] = [];

    if (ctx.currency !== 'AED' && ctx.currency !== 'USD') {
      issues.push({
        code: 'AE-001',
        severity: 'WARNING',
        message: 'UAE VAT returns must be reported in AED. USD is acceptable with daily CBU rate conversion.',
        field: 'currency',
        regulationRef: 'Art. 69, FDL 8/2017',
      });
    }

    // TRN (Tax Registration Number) required on B2B invoices > AED 10,000
    const invoiceAmount = ctx.subtotal ?? 0;
    const buyerTrn      = ctx.meta?.buyerTrn as string | undefined;
    if (invoiceAmount > 10_000 && !buyerTrn) {
      issues.push({
        code: 'AE-002',
        severity: 'WARNING',
        message: 'Buyer TRN should be stated on invoices exceeding AED 10,000.',
        field: 'buyerTrn',
        regulationRef: 'Art. 59(4), Cabinet Decision 52/2017',
      });
    }

    // Tax invoice must include FTA-required fields
    const hasTaxInvoiceFields =
      ctx.meta?.invoiceNumber && ctx.meta?.supplierTrn && ctx.meta?.invoiceDate;
    if (!hasTaxInvoiceFields) {
      issues.push({
        code: 'AE-003',
        severity: 'INFO',
        message: 'Tax invoice must include: unique invoice number, supplier TRN, invoice date, and item descriptions.',
        regulationRef: 'Art. 59, Cabinet Decision 52/2017',
      });
    }

    return issues;
  }

  // ── Period generation ─────────────────────────────────────────────────────
  // UAE: quarterly (due 28 days after period end) for most; monthly for large taxpayers

  periods(year: number, frequency?: FilingFrequency): VatFilingPeriod[] {
    const freq = frequency ?? 'QUARTERLY';
    return this.generatePeriods(year, freq, 28);
  }

  // ── Official FTA VAT Return (Form VAT201) ─────────────────────────────────

  buildReturn(
    companyId: string,
    periodKey: string,
    inputVat: number,
    outputVat: number,
    currency: string,
  ): VatReturnDraft {
    const netVatPayable = round2(outputVat - inputVat);

    return {
      countryCode: 'AE',
      periodKey,
      companyId,
      lines: [
        // Section 1 — VAT on Sales
        { boxCode: '1a', label: 'Standard-rated supplies in UAE (5%)',      amount: 0, taxAmount: outputVat  },
        { boxCode: '1b', label: 'Tax amount on 1a',                         amount: 0, taxAmount: outputVat  },
        { boxCode: '2',  label: 'Tax refunds under tourist refund scheme',  amount: 0                         },
        { boxCode: '3',  label: 'Supplies subject to reverse charge',       amount: 0                         },
        { boxCode: '4',  label: 'Zero-rated supplies',                      amount: 0                         },
        { boxCode: '5',  label: 'Exempt supplies',                          amount: 0                         },
        { boxCode: '6',  label: 'Goods imported into UAE',                  amount: 0                         },
        { boxCode: '7',  label: 'Adjustments to output VAT',                amount: 0                         },
        { boxCode: '8',  label: 'Total Output VAT (Payable)',               amount: 0, taxAmount: outputVat  },
        // Section 2 — VAT on Purchases
        { boxCode: '9',  label: 'Standard-rated expenses',                  amount: 0, taxAmount: inputVat   },
        { boxCode: '10', label: 'Tax amount on 9',                          amount: 0, taxAmount: inputVat   },
        { boxCode: '11', label: 'Supplies subject to reverse charge',       amount: 0                         },
        { boxCode: '12', label: 'Tax amount on 11 (reverse charge)',        amount: 0                         },
        { boxCode: '13', label: 'Adjustments to input VAT',                 amount: 0                         },
        { boxCode: '14', label: 'Total Input VAT (Recoverable)',            amount: 0, taxAmount: inputVat   },
        // Section 3 — Net
        { boxCode: '15', label: 'Net VAT Payable (8 − 14)',                amount: netVatPayable             },
      ],
      netVatPayable,
      currency,
      preparedAt: new Date().toISOString(),
      formData: {
        formId:        'VAT201',
        formVersion:   'v3',
        authorityCode: 'FTA',
        submissionUrl: 'https://tax.gov.ae/en/services/tax.return.aspx',
      },
    };
  }

  // ── Jurisdiction metadata ─────────────────────────────────────────────────

  jurisdiction(): VatJurisdictionInfo {
    return {
      countryCode:            'AE',
      countryName:            'United Arab Emirates',
      authorityName:          'Federal Tax Authority',
      authorityAbbrev:        'FTA',
      authorityUrl:           'https://tax.gov.ae',
      currency:               'AED',
      rates:                  this.activeRates(),
      filingFrequencies:      ['QUARTERLY', 'MONTHLY'],
      eFilingMandatory:       true,
      registrationThreshold:  375_000, // AED 375,000 mandatory; 187,500 voluntary
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
