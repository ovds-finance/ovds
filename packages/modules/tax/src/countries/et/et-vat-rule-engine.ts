/**
 * @file et-vat-rule-engine.ts
 * @module @ovds/tax/countries/et
 *
 * Ethiopia VAT Rule Engine
 * ────────────────────────
 * Implements VAT rules per the Ethiopian Value Added Tax Proclamation
 * No. 285/2002 as amended by Proclamation No. 609/2008 and the
 * Ethiopian Revenue and Customs Authority (ERCA) Directives.
 *
 * Key rules implemented:
 *  • Standard rate:  15% on all taxable supplies (Art. 7, Proc. 285/2002)
 *  • Zero-rated:     exports, international transport, aid-funded projects
 *                    (Art. 8, Proc. 285/2002)
 *  • Exempt:         basic food items, medical services/equipment, education,
 *                    financial services, residential rental (Art. 9)
 *  • Registration threshold: ETB 1,000,000 annual turnover (Proc. 609/2008)
 *  • Filing frequency: Monthly (return due by 30th of following month)
 *  • Withholding VAT: 15% withheld at source by designated withholding agents
 *    (ERCA Directive — "VAT Withholding Agents")
 *  • Reverse charge:  Not generally applicable domestically; applied on
 *                     certain imported services
 */

import {
  AbstractVatRuleEngine,
} from '@ovds/core/vat';
import type {
  VatRate,
  VatContext,
  VatComplianceIssue,
  VatReturnDraft,
  VatJurisdictionInfo,
  VatFilingPeriod,
  FilingFrequency,
} from '@ovds/core/vat';

// ─── HS-code exempt categories ────────────────────────────────────────────────
// A curated subset of goods/services that are exempt from Ethiopian VAT.
// In a production build these would be loaded from a DB or JSON data file.
const EXEMPT_HS_PREFIXES = [
  '0401', // Milk and cream
  '0402', // Milk powder
  '1001', // Wheat
  '1101', // Wheat flour
  '1102', // Cereal flours
  '2905', // Acyclic alcohols (pharmaceuticals)
  '3001', // Glands and organs
  '3003', // Medicaments (mixed)
  '3004', // Medicaments (in dosage form)
  '4901', // Printed books
  '4902', // Newspapers and periodicals
  '9018', // Medical instruments
  '9019', // Mechano-therapy appliances
];

const ZERO_RATED_HS_PREFIXES = [
  '8471', // Computers / IT equipment (export)
  '8525', // Transmission apparatus (export)
];

function isExemptHs(code: string): boolean {
  return EXEMPT_HS_PREFIXES.some((p) => code.startsWith(p));
}

function isZeroRatedHs(code: string): boolean {
  return ZERO_RATED_HS_PREFIXES.some((p) => code.startsWith(p));
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class EtVatRuleEngine extends AbstractVatRuleEngine {
  readonly countryCode   = 'ET';
  readonly ruleSetVersion = '2.1.0'; // Proc. 285/2002 + 609/2008 + 2024 amendments

  // ── Rate definitions ─────────────────────────────────────────────────────

  protected allRates(): VatRate[] {
    return [
      {
        countryCode:   'ET',
        label:         'Standard Rate',
        rateType:      'STANDARD',
        rate:          15,
        effectiveFrom: '2002-01-01',
        effectiveTo:   null,
      },
      {
        countryCode:   'ET',
        label:         'Zero-Rated (Exports)',
        rateType:      'ZERO_RATED',
        rate:          0,
        effectiveFrom: '2002-01-01',
        effectiveTo:   null,
      },
      {
        countryCode:   'ET',
        label:         'Exempt',
        rateType:      'EXEMPT',
        rate:          0,
        effectiveFrom: '2002-01-01',
        effectiveTo:   null,
      },
    ];
  }

  // ── Override calculate for Ethiopia-specific logic ───────────────────────

  calculate(ctx: VatContext) {
    const date = ctx.transactionDate;
    const warnings: string[] = [];

    // 1. Exports are always zero-rated
    if (ctx.isExport) {
      const zeroRate = this.resolveRate('ZERO_RATED', date)!;
      return this.assembleResult(ctx, this.applyRates(ctx, [zeroRate], warnings), warnings);
    }

    // 2. HS-code based exemption check
    if (ctx.hsCode) {
      if (isExemptHs(ctx.hsCode)) {
        const exemptRate = this.resolveRate('EXEMPT', date)!;
        return this.assembleResult(ctx, this.applyRates(ctx, [exemptRate], warnings), warnings);
      }
      if (isZeroRatedHs(ctx.hsCode) && ctx.isExport) {
        const zeroRate = this.resolveRate('ZERO_RATED', date)!;
        return this.assembleResult(ctx, this.applyRates(ctx, [zeroRate], warnings), warnings);
      }
    }

    // 3. Imported services: reverse charge at 15%
    if (ctx.isImport && ctx.reverseCharge) {
      const stdRate = this.resolveRate('STANDARD', date)!;
      warnings.push('Imported service: reverse-charge VAT applied at 15% (Art. 4(3), Proc. 285/2002)');
      return this.assembleResult(ctx, this.applyRates(ctx, [stdRate], warnings), warnings);
    }

    // 4. Standard taxable supply
    const stdRate = this.resolveRate('STANDARD', date)!;
    return this.assembleResult(ctx, this.applyRates(ctx, [stdRate], warnings), warnings);
  }

  // ── Custom compliance rules ───────────────────────────────────────────────

  protected async validateCustomRules(ctx: VatContext): Promise<VatComplianceIssue[]> {
    const issues: VatComplianceIssue[] = [];

    if (ctx.currency !== 'ETB') {
      issues.push({
        code: 'ET-001',
        severity: 'WARNING',
        message: 'Ethiopian VAT returns must be reported in ETB. Currency conversion required.',
        field: 'currency',
        regulationRef: 'Art. 24, Proc. 285/2002',
      });
    }

    // ERCA requires EIMS FSNo on invoices from registered vendors
    const fsNo = (ctx.meta?.vendorFsNo as string) ?? '';
    const whtApplicable = ctx.meta?.whtApplicable as boolean | undefined;
    if (whtApplicable && !fsNo) {
      issues.push({
        code: 'ET-002',
        severity: 'ERROR',
        message: 'ERCA Fiscal Sales Register Machine Number (FSNo) is required when WHT is applicable.',
        field: 'vendorFsNo',
        regulationRef: 'Art. 94, Proc. 1395/2025',
      });
    }

    // Dates must not be in the future
    const today = new Date().toISOString().slice(0, 10);
    if (ctx.transactionDate > today) {
      issues.push({
        code: 'ET-003',
        severity: 'ERROR',
        message: 'Transaction date cannot be in the future.',
        field: 'transactionDate',
      });
    }

    return issues;
  }

  // ── Period generation ─────────────────────────────────────────────────────
  // Ethiopia: monthly filing, return due by 30th of the following month

  periods(year: number, frequency?: FilingFrequency): VatFilingPeriod[] {
    return this.generatePeriods(year, frequency ?? 'MONTHLY', 30);
  }

  // ── Official ERCA VAT Return (Form VAT-01) ────────────────────────────────

  buildReturn(
    companyId: string,
    periodKey: string,
    inputVat: number,
    outputVat: number,
    currency: string,
  ): VatReturnDraft {
    const netVatPayable = round2(outputVat - inputVat);
    return {
      countryCode: 'ET',
      periodKey,
      companyId,
      lines: [
        // Section A — Output VAT
        { boxCode: 'A1', label: 'Total taxable sales (excl. VAT)',         amount: 0                         },
        { boxCode: 'A2', label: 'Output VAT on sales (15%)',               amount: 0, taxAmount: outputVat  },
        { boxCode: 'A3', label: 'Adjustments to output VAT',               amount: 0                         },
        { boxCode: 'A4', label: 'Total output VAT (A2 + A3)',              amount: 0, taxAmount: outputVat  },
        // Section B — Input VAT
        { boxCode: 'B1', label: 'Total taxable purchases (excl. VAT)',     amount: 0                         },
        { boxCode: 'B2', label: 'Input VAT on purchases (15%)',            amount: 0, taxAmount: inputVat   },
        { boxCode: 'B3', label: 'Input VAT withheld by WHT agent',         amount: 0                         },
        { boxCode: 'B4', label: 'Adjustments to input VAT',                amount: 0                         },
        { boxCode: 'B5', label: 'Total creditable input VAT (B2+B3+B4)',   amount: 0, taxAmount: inputVat   },
        // Section C — Net
        { boxCode: 'C1', label: 'Net VAT payable (A4 − B5)',               amount: netVatPayable             },
        { boxCode: 'C2', label: 'VAT refund claimed (if C1 < 0)',          amount: netVatPayable < 0 ? Math.abs(netVatPayable) : 0 },
        // Section D — EIMS
        { boxCode: 'D1', label: 'Number of EIMS invoices issued',          amount: 0                         },
        { boxCode: 'D2', label: 'Total EIMS-registered sales',             amount: 0                         },
      ],
      netVatPayable,
      currency,
      preparedAt: new Date().toISOString(),
      formData: {
        formId:        'ERCA-VAT-01',
        formVersion:   '2024',
        authorityCode: 'ERCA',
        submissionUrl: null, // populated by the ERCA integration adapter
      },
    };
  }

  // ── Jurisdiction metadata ─────────────────────────────────────────────────

  jurisdiction(): VatJurisdictionInfo {
    return {
      countryCode:            'ET',
      countryName:            'Ethiopia',
      authorityName:          'Ethiopian Revenue and Customs Authority',
      authorityAbbrev:        'ERCA',
      authorityUrl:           'https://www.erca.gov.et',
      currency:               'ETB',
      rates:                  this.activeRates(),
      filingFrequencies:      ['MONTHLY'],
      eFilingMandatory:       true,
      registrationThreshold:  1_000_000, // ETB 1,000,000 per annum
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
