/**
 * Ethiopian Business Workflow Engine — @ovds/shared
 *
 * Maps business size / type / sector to the correct tax types, IFRS standards,
 * filing obligations, and module set. Used by all layers (frontend, backend,
 * compliance engine) to derive the correct compliance posture for each company.
 *
 * Governing frameworks:
 *   - Income Tax Proclamation No. 1395/2025 (Category A/B/C schedule)
 *   - VAT Proclamation No. 1341/2024 (ETB 2M registration threshold)
 *   - Commercial Code of Ethiopia 2021 (business type classification)
 *   - AABE Directive No. 2/2012 (IFRS full vs IFRS for SMEs applicability)
 */

import { getBusinessModuleConfig } from './workflow-engine.types';

// ---------------------------------------------------------------------------
// Business Size Classification (AABE / Ethiopian Investment Commission)
// ---------------------------------------------------------------------------

export type BusinessSize =
  | 'MICRO'        // Annual turnover < ETB 500K — individual / sole trader
  | 'SMALL'        // ETB 500K – 5M  — Category B taxpayer (TOT)
  | 'MEDIUM'       // ETB 5M – 50M   — Category B/A boundary
  | 'LARGE'        // ETB 50M – 500M — Category A taxpayer (full CIT)
  | 'ENTERPRISE';  // ETB 500M+      — Large corporate / financial institution

export type EthBusinessType =
  | 'SOLE_PROPRIETOR'
  | 'PARTNERSHIP'
  | 'PLC'                 // Private Limited Company
  | 'SC'                  // Share Company (public)
  | 'NGO'
  | 'GOVERNMENT'
  | 'FINANCIAL_INSTITUTION'
  | 'COOPERATIVE'
  | 'BRANCH_OFFICE';      // Foreign branch

export type BusinessSectorCategory =
  | 'MANUFACTURING'
  | 'TRADE'               // Import / Export / Wholesale / Retail
  | 'SERVICES'
  | 'CONSTRUCTION'
  | 'AGRICULTURE'
  | 'HOSPITALITY'
  | 'REAL_ESTATE'
  | 'FINANCIAL_SERVICES'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'TECHNOLOGY'
  | 'TRANSPORT'
  | 'MINING'
  | 'OTHER';

// ---------------------------------------------------------------------------
// Tax Obligation — per applicable tax type with rates & thresholds
// ---------------------------------------------------------------------------

export interface TaxObligation {
  taxType: string;                  // e.g. 'VAT', 'TOT', 'PIT', 'CIT', 'WHT'
  rate: number;                     // primary rate (decimal)
  threshold?: number;               // ETB minimum before obligation applies
  period: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  applies: boolean;
  rationale: string;                // human-readable reason
  proclamationRef: string;
}

// ---------------------------------------------------------------------------
// Taxpayer Category (Ministry of Revenues / MoR classification)
// Formerly called "ERCA classification" — MoR restructured from ERCA
// under Proclamation No. 1097/2018.
// Source: Federal Income Tax Proclamation No. 979/2016, Art. 3
// ---------------------------------------------------------------------------

/**
 * MoR taxpayer category based on annual gross income.
 * Previously referred to as "ERCA category".
 *  A: Body or person with annual gross income ≥ ETB 1,000,000
 *  B: Person (not body) with annual gross income ETB 500,000–999,999
 *  C: Person (not body) with annual gross income < ETB 500,000
 */
export type ErcaTaxpayerCategory = 'A' | 'B' | 'C';

/** Determine MoR taxpayer category based on annual turnover (Proclamation No. 979/2016) */
export function getErcaTaxpayerCategory(annualTurnover: number): ErcaTaxpayerCategory {
  if (annualTurnover >= 1_000_000) return 'A';  // Full CIT + VAT — file via etax.mor.gov.et
  if (annualTurnover >= 500_000)  return 'B';   // BIT progressive + possibly VAT/TOT
  return 'C';                                    // TOT only (< ETB 500K)
}

// ---------------------------------------------------------------------------
// Business Profile — the full compliance descriptor
// ---------------------------------------------------------------------------

export interface BusinessProfile {
  businessId: string;
  name: string;
  tin: string;
  size: BusinessSize;
  type: EthBusinessType;
  sector: BusinessSectorCategory;
  annualTurnover: number;
  employeeCount: number;
  isVatRegistered: boolean;
  ercaCategory: ErcaTaxpayerCategory;
  ifrsStandard: 'IFRS_FULL' | 'IFRS_SME' | 'LOCAL_GAAP';
  /** Modules enabled for this business — from BUSINESS_MODULE_MAP */
  enabledModules: string[];
  taxObligations: TaxObligation[];
}

// ---------------------------------------------------------------------------
// IFRS Standard Applicability (AABE Directive)
// ---------------------------------------------------------------------------

/** Determine which IFRS standard applies.
 *  AABE Directive No. 2/2012:
 *  - Tier 1 (full IFRS): public interest entities, FIs, large companies (> ETB 200M assets)
 *  - Tier 2 (IFRS for SMEs): all others with public accountability
 *  - Tier 3 (local GAAP): micro entities without public accountability
 */
export function getIfrsStandard(
  type: EthBusinessType,
  size: BusinessSize,
  annualTurnover: number,
): 'IFRS_FULL' | 'IFRS_SME' | 'LOCAL_GAAP' {
  if (
    type === 'SC' ||
    type === 'FINANCIAL_INSTITUTION' ||
    type === 'GOVERNMENT' ||
    size === 'ENTERPRISE' ||
    (size === 'LARGE' && annualTurnover >= 200_000_000)
  ) {
    return 'IFRS_FULL';
  }
  if (size === 'MICRO' && annualTurnover < 500_000) return 'LOCAL_GAAP';
  return 'IFRS_SME';
}

// ---------------------------------------------------------------------------
// Tax Obligation Builder — derive all applicable obligations from profile
// ---------------------------------------------------------------------------

/**
 * Returns the full set of tax obligations for a business based on its
 * size, type, sector, and registration status.
 */
export function buildTaxObligations(
  size: BusinessSize,
  type: EthBusinessType,
  sector: BusinessSectorCategory,
  annualTurnover: number,
  isVatRegistered: boolean,
  employeeCount: number,
): TaxObligation[] {
  const obligations: TaxObligation[] = [];
  const VAT_THRESHOLD = 2_000_000;
  const TOT_THRESHOLD = 500_000;

  // 1. VAT — 15% (Proclamation No. 1341/2024)
  obligations.push({
    taxType: 'VAT',
    rate: 0.15,
    threshold: VAT_THRESHOLD,
    period: 'MONTHLY',
    applies: isVatRegistered || annualTurnover >= VAT_THRESHOLD,
    rationale: annualTurnover >= VAT_THRESHOLD
      ? 'Annual turnover ≥ ETB 2M — mandatory VAT registration'
      : isVatRegistered
        ? 'Voluntarily VAT registered'
        : 'Below VAT threshold — not applicable',
    proclamationRef: 'Proclamation No. 1341/2024, Art. 16',
  });

  // 2. TOT — Turnover Tax (2% goods / 10% services) — only if NOT VAT registered
  obligations.push({
    taxType: 'TOT',
    rate: sector === 'SERVICES' ? 0.10 : 0.02,
    threshold: TOT_THRESHOLD,
    period: 'MONTHLY',
    applies: !isVatRegistered && annualTurnover >= TOT_THRESHOLD && annualTurnover < VAT_THRESHOLD,
    rationale: !isVatRegistered
      ? `TOT applies: ${sector === 'SERVICES' ? '10% on services' : '2% on goods'} (ETB 500K–2M band)`
      : 'VAT-registered — TOT not applicable',
    proclamationRef: 'Proclamation No. 1395/2025, Art. 35–38',
  });

  // 3. PIT / CIT — Business Income Tax
  if (type === 'SOLE_PROPRIETOR' || type === 'PARTNERSHIP') {
    obligations.push({
      taxType: 'PIT_BUSINESS',
      rate: 0.35, // top rate — Schedule A progressive
      period: 'ANNUAL',
      applies: annualTurnover > 0,
      rationale: 'Individual/partnership — progressive BIT (Schedule A), max 35%',
      proclamationRef: 'Proclamation No. 1395/2025, Art. 12–20',
    });
  } else {
    obligations.push({
      taxType: 'CIT',
      rate: 0.30, // 30% flat for bodies (PLC, SC, etc.)
      period: 'ANNUAL',
      applies: type !== 'NGO',
      rationale: type === 'NGO' ? 'NGO — exempt from CIT on grant income' : '30% flat Corporate Income Tax',
      proclamationRef: 'Proclamation No. 979/2016, Art. 19; Proc. 1395/2025',
    });
  }

  // 4. WHT — Withholding Tax on payments to suppliers
  obligations.push({
    taxType: 'WHT_GOODS',
    rate: 0.03,
    threshold: 10_000,
    period: 'MONTHLY',
    applies: annualTurnover >= TOT_THRESHOLD,
    rationale: '3% WHT on goods purchases ≥ ETB 10,000 — Proc. 1395/2025 Art. 94 (raised from 2%)',
    proclamationRef: 'Proclamation No. 1395/2025, Art. 94',
  });
  obligations.push({
    taxType: 'WHT_SERVICES',
    rate: 0.03,
    threshold: 3_000,
    period: 'MONTHLY',
    applies: annualTurnover >= TOT_THRESHOLD,
    rationale: '3% WHT on service payments ≥ ETB 3,000',
    proclamationRef: 'Proclamation No. 979/2016, Art. 94',
  });

  // 5. Payroll taxes — PIT + Pension + DRRF (applies if has employees)
  if (employeeCount > 0) {
    obligations.push({
      taxType: 'PAYROLL_PIT',
      rate: 0.35, // max bracket
      period: 'MONTHLY',
      applies: true,
      rationale: 'PAYE — deduct progressive PIT from employee salaries monthly',
      proclamationRef: 'Proclamation No. 1395/2025, Art. 7–11',
    });
    obligations.push({
      taxType: 'PENSION',
      rate: 0.18, // 7% employee + 11% employer
      period: 'MONTHLY',
      applies: true,
      rationale: '7% employee + 11% employer pension contribution to PFSA',
      proclamationRef: 'Pension Proclamation No. 714/2011',
    });
    obligations.push({
      taxType: 'DRRF',
      rate: 0.01,
      period: 'QUARTERLY',
      applies: true,
      rationale: '1% DRRF levy on qualifying transactions',
      proclamationRef: 'Regulation No. 570/2025',
    });
  }

  // 6. Excise Tax — manufacturing/trade of excisable goods
  if (sector === 'MANUFACTURING' || sector === 'TRADE') {
    obligations.push({
      taxType: 'EXCISE',
      rate: 0.15, // example: alcohol 15%
      period: 'MONTHLY',
      applies: sector === 'MANUFACTURING',
      rationale: 'Excise tax on manufacture/import of excisable goods',
      proclamationRef: 'Proclamation No. 1186/2020',
    });
  }

  // 7. Dividend WHT — when distributing profits
  if (type === 'PLC' || type === 'SC' || type === 'FINANCIAL_INSTITUTION') {
    obligations.push({
      taxType: 'WHT_DIVIDEND',
      rate: 0.15,
      period: 'ANNUAL',
      applies: true,
      rationale: '15% WHT on dividends distributed to shareholders',
      proclamationRef: 'Proclamation No. 1395/2025, Art. 52',
    });
  }

  // 8. Capital Gains Tax — Schedule D
  obligations.push({
    taxType: 'CAPITAL_GAINS',
    rate: 0.15,
    period: 'ANNUAL',
    applies: true,
    rationale: '15% CGT on disposal of shares, bonds, or investment property',
    proclamationRef: 'Proclamation No. 1395/2025, Art. 59–63',
  });

  return obligations;
}

// ---------------------------------------------------------------------------
// Full Business Profile Builder
// ---------------------------------------------------------------------------

/**
 * Build a complete BusinessProfile from raw company data.
 * Call this once when company is created / settings change.
 */
export function buildBusinessProfile(input: {
  businessId: string;
  name: string;
  tin: string;
  type: EthBusinessType;
  sector: BusinessSectorCategory;
  annualTurnover: number;
  employeeCount: number;
  isVatRegistered: boolean;
}): BusinessProfile {
  const { annualTurnover, type, sector, employeeCount, isVatRegistered } = input;

  // Derive size from turnover
  let size: BusinessSize;
  if (annualTurnover < 500_000) size = 'MICRO';
  else if (annualTurnover < 5_000_000) size = 'SMALL';
  else if (annualTurnover < 50_000_000) size = 'MEDIUM';
  else if (annualTurnover < 500_000_000) size = 'LARGE';
  else size = 'ENTERPRISE';

  const ercaCategory = getErcaTaxpayerCategory(annualTurnover);
  const ifrsStandard = getIfrsStandard(type, size, annualTurnover);
  const taxObligations = buildTaxObligations(
    size, type, sector, annualTurnover, isVatRegistered, employeeCount,
  );

  // Derive enabled modules from BUSINESS_MODULE_CONFIGS + broad parent keys
  const moduleConfig = getBusinessModuleConfig(size);
  const enabledModules = [
    ...moduleConfig.requiredModules,
    ...moduleConfig.optionalModules,
    // Broad parent keys used by workflow engine gating
    'ovds', 'tax', 'reports', 'admin',
    ...(employeeCount > 0 ? ['hr', 'payroll'] : []),
    ...(size !== 'MICRO' ? ['crm', 'inventory'] : []),
    ...(size === 'LARGE' || size === 'ENTERPRISE' ? ['audit', 'ifrs', 'treasury', 'api_integration'] : []),
    ...(type === 'FINANCIAL_INSTITUTION' ? ['banking', 'investments'] : []),
  ];

  return {
    businessId: input.businessId,
    name: input.name,
    tin: input.tin,
    size,
    type,
    sector,
    annualTurnover,
    employeeCount,
    isVatRegistered,
    ercaCategory,
    ifrsStandard,
    enabledModules: [...new Set(enabledModules)],
    taxObligations,
  };
}

// ---------------------------------------------------------------------------
// Workflow Steps — 7-module lifecycle
// ---------------------------------------------------------------------------

export type WorkflowModule =
  | 'CORE_OPERATIONS'
  | 'PEOPLE'
  | 'ovds'
  | 'COMPLIANCE'
  | 'REPORTING'
  | 'ADMIN'
  | 'DEVELOPER';

export interface WorkflowStep {
  module: WorkflowModule;
  name: string;
  description: string;
  applies: boolean;
  ifrsPrinciples: string[];
  taxObligation: string;
  autoActions: string[];
}

/** Get the 7-step accounting workflow for a given business profile */
export function getWorkflowSteps(profile: BusinessProfile): WorkflowStep[] {
  const hasTax = profile.taxObligations.some(o => o.applies && o.taxType !== 'DRRF');
  const hasEmployees = profile.employeeCount > 0;
  const hasVat = profile.isVatRegistered;
  const isFullIfrs = profile.ifrsStandard === 'IFRS_FULL';
  const isLarge = profile.size === 'LARGE' || profile.size === 'ENTERPRISE';

  return [
    {
      module: 'CORE_OPERATIONS',
      name: 'Sales, Procurement & Inventory',
      description: 'Record invoices, bills, GRNs, inventory movements with automatic tax computation.',
      applies: true,
      ifrsPrinciples: ['IFRS 15 — Revenue Recognition', 'IAS 2 — Inventory Valuation (FIFO/AVCO)'],
      taxObligation: hasVat
        ? 'Auto-compute 15% VAT on taxable sales; WHT on supplier payments'
        : 'Auto-compute TOT (2%/10%) on eligible transactions',
      autoActions: [
        'Post Dr AR / Cr Revenue + VAT Payable on invoice approval',
        'Post Dr Inventory / Cr AP on GRN; compute COGS via FIFO or AVCO',
        'Apply IAS 2 NRV write-down if cost > net realisable value',
        'Flag WHT obligation on supplier invoices ≥ threshold',
      ],
    },
    {
      module: 'PEOPLE',
      name: 'Payroll & HR',
      description: 'Process monthly payroll with progressive PIT, pension, DRRF and IAS 19 benefits.',
      applies: hasEmployees,
      ifrsPrinciples: ['IAS 19 — Employee Benefits (gratuity, leave accrual)', 'IAS 37 — Provisions'],
      taxObligation: 'PAYE (PIT) + Pension (7%+11%) + DRRF (1%) — remit by 30th following month',
      autoActions: [
        'Calculate PIT using Proclamation No. 1395/2025 brackets',
        'Deduct 7% employee pension; accrue 11% employer cost',
        'Accrue leave liability: remaining days × (basic salary / 30)',
        'Compute gratuity obligation per Labour Proc. 1156/2019',
        'Post full payroll GL journal on approval',
      ],
    },
    {
      module: 'ovds',
      name: 'General Ledger, Assets & Banking',
      description: 'Manage Chart of Accounts, fixed assets (dual depreciation), banking, FX, ECL.',
      applies: !!(isLarge || isFullIfrs || profile.enabledModules.includes('ovds')),
      ifrsPrinciples: [
        'IAS 16 — Property, Plant & Equipment',
        'IAS 21 — FX Translation',
        'IFRS 9 — Expected Credit Loss',
        'IFRS 16 — Leases',
      ],
      taxObligation: 'Dual depreciation: IFRS straight-line vs. Ethiopian tax pool (Cat 1–4)',
      autoActions: [
        'Post monthly depreciation to both IFRS and Tax books',
        'Revalue FX monetary items at NBE closing rate; P&L or OCI per IAS 21',
        'Compute ECL provision matrix (Stage 1/2/3) on receivables',
        'Track CGT on asset disposals at 15% (Schedule D)',
        'Reconcile bank statements; auto-match transactions',
      ],
    },
    {
      module: 'COMPLIANCE',
      name: 'Tax Reconciliation & Returns',
      description: 'Reconcile IFRS profit with taxable profit; generate all tax return drafts.',
      applies: hasTax,
      ifrsPrinciples: ['IAS 12 — Deferred Tax (30% rate)'],
      taxObligation: profile.type === 'SOLE_PROPRIETOR'
        ? 'Annual BIT declaration (progressive Schedule A)'
        : '30% CIT + optional 2.5% MAT on turnover',
      autoActions: [
        'Run IAS 12 bridge: permanent + temporary adjustments',
        'Compute deferred tax assets (DTAs) and liabilities (DTLs)',
        'Generate VAT return draft — output vs input VAT',
        'Generate WHT register — outgoing certificates + incoming',
        'Generate DRRF quarterly levy computation',
        'Lock period to prevent backdating after filing',
      ],
    },
    {
      module: 'REPORTING',
      name: 'Financial Statements',
      description: 'Generate IFRS-compliant statements and Ethiopian statutory schedules.',
      applies: true,
      ifrsPrinciples: [
        'IAS 1 — Presentation of Financial Statements',
        'IAS 7 — Cash Flow Statement',
        'IAS 33 — EPS (listed entities)',
        'IFRS 18 — P&L category classification (Operating/Investing/Financing)',
      ],
      taxObligation: 'Schedule A (CIT computation), VAT return summary, WHT ledger',
      autoActions: [
        'Generate Statement of Financial Position (Balance Sheet)',
        'Generate Statement of Comprehensive Income (P&L by IFRS 18 category)',
        'Generate Statement of Cash Flows (indirect method)',
        'Generate Statement of Changes in Equity',
        'Output Schedule A: CIT computation with non-deductible add-backs',
        'Generate AABE-compliant disclosure notes',
      ],
    },
    {
      module: 'ADMIN',
      name: 'RBAC, Audit Trails & Multi-Currency',
      description: 'Role-based access control, immutable audit logs, dual calendar, FX rate management.',
      applies: true,
      ifrsPrinciples: ['AABE audit standards', 'Data retention requirements'],
      taxObligation: 'Enforce lock-period immutability; restrict tax file access by role',
      autoActions: [
        'Lock accounting periods after VAT/BIT filing deadline passes',
        'Log every manual override with user, timestamp, and reason',
        'Manage ETB/USD exchange rates from NBE daily feeds',
        'Enforce Ethiopian fiscal calendar (Hamle–Sene) for EFY reporting',
        'Manage company-level AABE compliance settings',
      ],
    },
    {
      module: 'DEVELOPER',
      name: 'API & eTax Integration',
      description: 'REST API layer, MoR eTax portal integration, webhook automation.',
      applies: true,
      ifrsPrinciples: ['Automated IFRS standard update notifications (IASB)'],
      taxObligation: 'Direct REST submission to MoR eTax gateway for VAT, WHT, BIT filings',
      autoActions: [
        'Build MoR-compliant JSON tax payloads (TaxpayerDeclaration schema)',
        'Sign payloads with SHA-256 application signature',
        'Store eTax receipt IDs and payment slips',
        'Expose /api/v1/etax/submit endpoint for direct MoR integration',
        'Webhook notifications on filing status changes',
      ],
    },
  ];
}
