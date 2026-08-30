/**
 * Ethiopian Business Environment — IFRS & Regulatory Compliance Map
 *
 * This file is the authoritative cross-reference between the OVDS accounting
 * architecture and the applicable legal/regulatory framework for Ethiopia.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LEGAL HIERARCHY (highest → lowest authority)                      │
 * │  1. Federal Constitution of Ethiopia (1995)                        │
 * │  2. Commercial Code (Proclamation No. 1243/2021 — revised code)    │
 * │  3. Federal Tax Proclamations (income tax, VAT, excise)            │
 * │  4. Council of Ministers Regulations (implementation details)      │
 * │  5. Ministry of Revenues (MoR) Directives & Practice Notes        │
 * │  6. IFRS / IAS Standards (adopted by AABE for eligible entities)  │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * IFRS Framework applicability (AABE — Accounting & Auditing Board of Ethiopia):
 *  - Full IFRS: Public Interest Entities (PIEs) — banks, insurers, listed cos.
 *  - IFRS for SMEs: Medium-sized private companies (turnover-based threshold)
 *  - Ethiopian Financial Reporting Standard (EFRS): Small entities (below SME threshold)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. IFRS Standard → Module Mapping
// ─────────────────────────────────────────────────────────────────────────────

export interface IFRSModuleMapping {
  standard: string;
  title: string;
  modules: string[];
  models: string[];
  keyCompliance: string[];
  hasSmeSimplification: boolean;
  ethiopianNote?: string;
}

export const IFRS_MODULE_MAPPINGS: IFRSModuleMapping[] = [
  {
    standard: 'IAS 1',
    title: 'Presentation of Financial Statements',
    modules: ['reporting', 'accounting'],
    models: ['FinancialStatementTemplate', 'JournalEntry'],
    keyCompliance: [
      'Balance Sheet / Statement of Financial Position',
      'Income Statement (IFRS 18 categories: OPERATING/INVESTING/FINANCING/TAX)',
      'Statement of Changes in Equity',
      'Statement of Cash Flows (indirect method)',
      'Comparative period presentation (prior year)',
      'Going concern assessment',
    ],
    hasSmeSimplification: true,
    ethiopianNote: 'AABE requires ETB presentation; dual-currency disclosure for multi-currency entities per NBE directives.',
  },
  {
    standard: 'IAS 2',
    title: 'Inventories',
    modules: ['inventory'],
    models: ['Item', 'StockTransaction', 'StockValuationLayer'],
    keyCompliance: [
      'FIFO or Weighted Average Cost (LIFO prohibited)',
      'Lower of cost or Net Realisable Value (NRV)',
      'Cost of conversion including allocated overhead',
    ],
    hasSmeSimplification: true,
    ethiopianNote: 'Ethiopian Customs Commission values imports at CIF — this CIF value is the IAS 2 acquisition cost base.',
  },
  {
    standard: 'IAS 7',
    title: 'Statement of Cash Flows',
    modules: ['reporting', 'treasury'],
    models: ['JournalEntry', 'BankTransaction'],
    keyCompliance: [
      'Operating: indirect method (profit + adjustments)',
      'Investing: PPE purchases/disposals, loans made/repaid',
      'Financing: borrowings, IFRS 16 lease payments, dividends paid',
    ],
    hasSmeSimplification: false,
    ethiopianNote: 'NBE requires banks to submit Cash Flow Statements; mandatory for Ethiopian PIEs.',
  },
  {
    standard: 'IAS 12',
    title: 'Income Taxes (Deferred Tax)',
    modules: ['accounting', 'tax'],
    models: ['JournalEntry', 'JournalLine', 'IncomeTaxFiling'],
    keyCompliance: [
      'Ethiopian CIT rate: 30% flat (Proc. 979/2016)',
      'Temporary differences: IAS 16 vs. tax pool depreciation (CAT 1–4)',
      'ECL provisions deductible only when legally uncollectable',
      'IAS 12.46: total income tax expense = current + deferred movement',
      'IAS 12.81 reconciliation: effective rate to 30% statutory',
    ],
    hasSmeSimplification: false,
    ethiopianNote: 'Tax base differs from IFRS carrying amount due to pool depreciation (Art. 25 Proc. 979/2016) and expense timing restrictions.',
  },
  {
    standard: 'IFRS 15',
    title: 'Revenue from Contracts with Customers',
    modules: ['invoice'],
    models: ['Invoice', 'InvoiceItem'],
    keyCompliance: [
      'Five-step model: identify contract → obligations → price → allocate → recognise',
      'Point-in-time vs over-time recognition',
      'Variable consideration (discounts, volume rebates)',
      'ifrs15Step1–5Complete flags on Invoice model',
    ],
    hasSmeSimplification: true,
    ethiopianNote: 'Ethiopian VAT trigger is invoice date (Proc. 1341/2024) — may differ from IFRS revenue recognition date.',
  },
  {
    standard: 'IAS 16',
    title: 'Property, Plant and Equipment',
    modules: ['accounting'],
    models: ['FixedAsset', 'DepreciationSchedule'],
    keyCompliance: [
      'Component depreciation (each significant component separately)',
      'Dual book: IFRS carrying amount vs. Ethiopian tax pool (Art. 25)',
      'Deferred tax on temporary difference × 30%',
    ],
    hasSmeSimplification: true,
    ethiopianNote: 'CAT 1 (25%), CAT 2 (20%), CAT 3 (15%), CAT 4 (10%) — declining-balance pool per Proc. 979/2016.',
  },
  {
    standard: 'IAS 19',
    title: 'Employee Benefits',
    modules: ['hr', 'accounting'],
    models: ['Employee', 'PayrollRecord', 'EmployeeBenefitObligation', 'GratuityRecord'],
    keyCompliance: [
      'Annual leave accrual: unused days × daily rate (IAS 19.13)',
      'Gratuity: 1 month/year of service (Labour Proc. 1156/2019)',
      'Pension: PFSA 7% employee + 11% employer (insurable cap ETB 15,000)',
      'Actuarial discount rate: Ethiopian govt bond yield (~10%)',
    ],
    hasSmeSimplification: true,
    ethiopianNote: 'PFSA/POESSA manages pension. Gratuity is a present obligation under Labour Proc. 1156/2019 — must be accrued.',
  },
  {
    standard: 'IAS 21',
    title: 'Effects of Changes in Foreign Exchange Rates',
    modules: ['currency', 'accounting'],
    models: ['fxdifference', 'currencyrate'],
    keyCompliance: [
      'Functional currency: ETB for Ethiopian-resident entities',
      'Monetary items retranslated at closing NBE rate; differences to P&L',
      'Non-monetary items at historical rate',
    ],
    hasSmeSimplification: false,
    ethiopianNote: 'NBE sets daily exchange rates. Parallel rate risk: use official NBE rate for accounting.',
  },
  {
    standard: 'IAS 37',
    title: 'Provisions, Contingent Liabilities',
    modules: ['accounting'],
    models: ['Provision', 'EmployeeBenefitObligation'],
    keyCompliance: [
      'Provision: present obligation + probable outflow + reliable estimate',
      'Discounted when time value material (IAS 37.36)',
      'MoR tax assessments: provision if objection likely to fail',
    ],
    hasSmeSimplification: false,
  },
  {
    standard: 'IFRS 9',
    title: 'Financial Instruments — ECL',
    modules: ['accounting', 'invoice'],
    models: ['Invoice', 'CollectionCase'],
    keyCompliance: [
      'Simplified approach: lifetime ECL from initial recognition for trade receivables',
      'ECL provision NOT tax-deductible (IAS 12 temporary difference)',
      'Specific provision deductible only when debtor legally exhausted',
    ],
    hasSmeSimplification: true,
    ethiopianNote: 'Ethiopian banks apply NBE ECL directives (stricter in some buckets). Non-banks apply IFRS 9 simplified approach.',
  },
  {
    standard: 'IFRS 16',
    title: 'Leases',
    modules: ['accounting'],
    models: ['Lease', 'LeasePayment', 'LeaseJournalEntry'],
    keyCompliance: [
      'Right-of-Use asset + lease liability for all leases',
      'Exemptions: short-term (≤12 months), low-value (<USD 5,000)',
      'Monthly: interest expense on liability + depreciation on ROU',
      'Lease liability NOT tax base — only cash payments deductible',
    ],
    hasSmeSimplification: false,
    ethiopianNote: 'Ethiopian office leases rarely include implicit rate; use incremental borrowing rate (~12–15%).',
  },
  {
    standard: 'IFRS 18',
    title: 'Presentation and Disclosure (effective 2027)',
    modules: ['reporting', 'accounting'],
    models: ['JournalLine', 'FinancialStatementTemplate'],
    keyCompliance: [
      'Five categories: OPERATING, INVESTING, FINANCING, INCOME_TAX, DISCONTINUED',
      'ifrs18Category field on JournalLine enforces classification at posting time',
      'Management performance measures (MPMs) reconciled in notes',
    ],
    hasSmeSimplification: false,
    ethiopianNote: 'Mandatory for Ethiopian PIEs from 1 January 2027 per AABE adoption timeline.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Ethiopian Commercial Code — Module Mapping
//    Proclamation No. 1243/2021 (Commercial Code of Ethiopia, revised)
// ─────────────────────────────────────────────────────────────────────────────

export interface CommercialCodeMapping {
  /** Article or part of Commercial Code */
  provision: string;
  title: string;
  /** How OVDS implements the requirement */
  implementation: string;
  /** OVDS modules/models involved */
  modules: string[];
}

export const COMMERCIAL_CODE_MAPPINGS: CommercialCodeMapping[] = [
  {
    provision: 'Proc. 1243/2021 — Book II (Commercial Undertakings)',
    title: 'Mandatory Accounting Records',
    implementation: 'Journal entries with double-entry enforcement; period lock prevents retroactive changes; audit trail on all mutations.',
    modules: ['accounting', 'JournalEntry', 'JournalLine', 'AuditLog'],
  },
  {
    provision: 'Proc. 1243/2021 Art. 93 — Annual Accounts',
    title: 'Annual Financial Statements',
    implementation: 'FinancialStatementTemplate generates Balance Sheet, Income Statement, Cash Flow, and Notes compliant with IFRS/EFRS.',
    modules: ['reporting', 'FinancialStatementTemplate'],
  },
  {
    provision: 'Proc. 1243/2021 Art. 95 — Books of Accounts',
    title: 'Books Must Be Kept for 10 Years',
    implementation: 'JournalEntry records are immutable once posted; period-lock prevents deletion. Soft-delete with retention policy enforced.',
    modules: ['accounting', 'periodlock', 'JournalEntry'],
  },
  {
    provision: 'Proc. 1243/2021 Art. 101 — Profit Distribution',
    title: 'Dividends Require Approved Financial Statements',
    implementation: 'ScheduleDFiling tracks dividend WHT (15%). Dividend declaration linked to approved income statement.',
    modules: ['tax', 'ScheduleDFiling', 'IncomeTaxFiling'],
  },
  {
    provision: 'Labour Proclamation No. 1156/2019',
    title: 'End-of-Service Gratuity',
    implementation: 'GratuityRecord calculates severance per termination type; EmployeeBenefitObligation accrues IAS 19 liability.',
    modules: ['hr', 'GratuityRecord', 'EmployeeBenefitObligation'],
  },
  {
    provision: 'Labour Proclamation No. 1156/2019 Art. 40',
    title: 'Annual Leave (22 working days minimum)',
    implementation: 'Employee.leaveEntitlement stores entitlement; Leave model tracks approvals; IAS 19 leave accrual computed monthly.',
    modules: ['hr', 'Employee', 'Leave', 'EmployeeBenefitObligation'],
  },
  {
    provision: 'Investment Proclamation No. 1180/2020',
    title: 'Foreign Investment Restrictions',
    implementation: 'Company.businessType and role-based RBAC prevent restricted sector operations. Trade shipments track FOREX approvals.',
    modules: ['auth', 'trade', 'ForexApproval'],
  },
  {
    provision: 'NBE Directive No. FXD/74/2023',
    title: 'Foreign Currency Retention (30%)',
    implementation: 'FundTransfer tracks ETB/USD splits. FX difference model reconciles at NBE official rate.',
    modules: ['treasury', 'currency', 'fxdifference'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. Ministry of Revenues (MoR) Proclamation Mandate Map
//    Covers: DRRF Quarterly Reports, TOT Filing, Excise Tax, BIT Declaration
// ─────────────────────────────────────────────────────────────────────────────

export interface MoRMandateMapping {
  /** Tax / levy type */
  mandate: string;
  /** Governing proclamation */
  proclamation: string;
  /** Filing frequency */
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'AT_TRANSACTION' | 'AT_CLEARANCE';
  /** MoR portal used for e-filing */
  portal: 'ETAX' | 'TASS' | 'CUSTOMS';
  /** OVDS model(s) that store the filing data */
  models: string[];
  /** Key rates or thresholds */
  rates: string[];
  /** Filing deadline rule */
  deadline: string;
  /** OVDS automation level */
  automation: 'FULL' | 'PARTIAL' | 'MANUAL';
  /** OVDS services implementing this mandate */
  services: string[];
}

export const MOR_MANDATE_MAPPINGS: MoRMandateMapping[] = [
  // ── VAT (Output / Input) ────────────────────────────────────────────────
  {
    mandate: 'VAT Return',
    proclamation: 'Proclamation No. 1341/2024 (VAT); Regulation No. 570/2025',
    frequency: 'MONTHLY',
    portal: 'ETAX',
    models: ['VatFiling', 'VatInputLedger', 'VatOutputLedger', 'ETaxSubmissionRecord'],
    rates: ['Standard rate: 15%', 'Zero rate: 0% (exports, basic goods)', 'Exempt: financial services, education, health'],
    deadline: '30th of the following month (etax.mor.gov.et)',
    automation: 'FULL',
    services: ['VatService', 'ETaxExportService'],
  },
  // ── Turnover Tax (TOT) ──────────────────────────────────────────────────
  {
    mandate: 'TOT Filing (Turnover Tax)',
    proclamation: 'Proclamation No. 1395/2025 Art. 35–38',
    frequency: 'MONTHLY',
    portal: 'ETAX',
    models: ['TotFiling', 'ETaxSubmissionRecord'],
    rates: [
      '2% on locally sold goods',
      '2% on construction contractors, grain mills, farm machinery services',
      '10% on all other general services',
      'Applies only when annual turnover < ETB 2,000,000 (not VAT-registered)',
    ],
    deadline: '30th of the following month',
    automation: 'FULL',
    services: ['TaxService', 'ETaxExportService'],
  },
  // ── Withholding Tax (WHT) ───────────────────────────────────────────────
  {
    mandate: 'Withholding Tax Remittance',
    proclamation: 'Proclamation No. 1395/2025 Art. 94',
    frequency: 'MONTHLY',
    portal: 'ETAX',
    models: ['WhtCertificate', 'ETaxSubmissionRecord'],
    rates: [
      '3% on goods ≥ ETB 10,000 (raised from 2% under Proc. 1395/2025)',
      '3% on domestic services ≥ ETB 3,000',
      '15% on non-resident services (general)',
      '15% dividends, 10% standard interest, 30% rent (corporate)',
    ],
    deadline: '30th of the following month; WHT certificates issued within 5 days',
    automation: 'FULL',
    services: ['WhtCertificateService'],
  },
  // ── PAYE (Employment Income Tax) ────────────────────────────────────────
  {
    mandate: 'PAYE Declaration (PIT + DRRF)',
    proclamation: 'Proclamation No. 1395/2025 Art. 7–11',
    frequency: 'MONTHLY',
    portal: 'ETAX',
    models: ['PayeDeclaration', 'PayrollRecord', 'ETaxSubmissionRecord'],
    rates: [
      'PIT brackets: 0% (≤ ETB 2,000), 15%, 20%, 25%, 30%, 35% (> ETB 14,000)',
      'DRRF levy: 1% of gross salary',
      'Pension employee: 7% (to PFSA)', 'Pension employer: 11% (to PFSA)',
    ],
    deadline: '30th of the following month for PIT+DRRF to MoR; pension to PFSA same deadline',
    automation: 'FULL',
    services: ['TaxService', 'ETaxExportService'],
  },
  // ── DRRF Quarterly ──────────────────────────────────────────────────────
  {
    mandate: 'DRRF Quarterly Levy (Disaster Risk Response Fund)',
    proclamation: 'Regulation No. 570/2025 (DRRF); Proclamation No. 1264/2021',
    frequency: 'QUARTERLY',
    portal: 'ETAX',
    models: ['DisasterFundContribution', 'DisasterFundRemittance', 'DisasterFundReport'],
    rates: [
      '1% on loan disbursements, insurance premiums, service fees, airtime',
      '1% on ticket sales, annual sales revenue, fuel sales, tobacco/alcohol',
      '1% on government services, salary contributions, telecom/digital, dividends',
      'Quarterly report format: DRRF Form Q (MoR standard)',
    ],
    deadline: '15th of the last month of each Ethiopian quarter (Dec 15, Mar 15, Jun 15, Sep 15)',
    automation: 'PARTIAL',
    services: ['DisasterFundService', 'ETaxExportService'],
  },
  // ── Business Income Tax (BIT) Declaration ───────────────────────────────
  {
    mandate: 'Business Income Tax (BIT) / CIT Declaration',
    proclamation: 'Proclamation No. 979/2016 (BIT); Proclamation No. 1395/2025 (amendments)',
    frequency: 'ANNUAL',
    portal: 'ETAX',
    models: ['IncomeTaxFiling', 'TaxLossCarryforward', 'ProvisionalTaxPayment', 'ETaxSubmissionRecord'],
    rates: [
      'Corporate flat rate: 30% on taxable net income',
      'Minimum Alternative Tax (MAT): 2.5% of gross annual turnover',
      'Final tax = max(CIT, MAT)',
      'Loss carry-forward: up to 5 years (2 consecutive disallowed)',
      'Provisional payment: 50% of prior year BIT by month 7 of fiscal year',
    ],
    deadline: 'November 7 of the following year (4 months after EFY end)',
    automation: 'PARTIAL',
    services: ['TaxService', 'ETaxExportService'],
  },
  // ── Excise Tax ──────────────────────────────────────────────────────────
  {
    mandate: 'Excise Tax Filing',
    proclamation: 'Proclamation No. 1186/2020; Amendment Proclamation No. 1239/2021',
    frequency: 'MONTHLY',
    portal: 'ETAX',
    models: ['ExciseTaxRecord', 'ExciseTaxFiling', 'ETaxSubmissionRecord'],
    rates: [
      '150% on cigarettes; 75% other tobacco; 75% spirits; 50% beer/wine',
      '30% soft drinks, perfumes, luxury goods; 100% vehicles >1800cc; 60% 1300–1800cc',
      '30% vehicles up to 1300cc; ETB 2.89/litre petrol; ETB 1.86/litre diesel',
      '10% electronics; ETB 5/kg plastic bags',
    ],
    deadline: '30 days after production date (local) or at customs clearance (imports)',
    automation: 'PARTIAL',
    services: ['ExciseStampService'],
  },
  // ── Schedule D ──────────────────────────────────────────────────────────
  {
    mandate: 'Schedule D — Other Income (Capital Gains, Dividends, Interest, Royalties)',
    proclamation: 'Proclamation No. 1395/2025 Art. 52–62',
    frequency: 'AT_TRANSACTION',
    portal: 'ETAX',
    models: ['ScheduleDFiling', 'ETaxSubmissionRecord'],
    rates: [
      '15% dividends; 10% standard interest; 30% FI/credit interest',
      '15% capital gains on shares/bonds/immovable property',
      '5% artistic royalties; 10% technical/industrial royalties',
      '15% digital content; 20% games of chance; 15% repatriated/undistributed profits',
      '15% non-resident management/technical fees',
    ],
    deadline: '30 days after month-end; capital gains within 2 months of disposal',
    automation: 'PARTIAL',
    services: ['ScheduleDService'],
  },
  // ── Stamp Duty ──────────────────────────────────────────────────────────
  {
    mandate: 'Stamp Duty',
    proclamation: 'Proclamation No. 110/1998',
    frequency: 'AT_TRANSACTION',
    portal: 'ETAX',
    models: ['StampDutyRecord'],
    rates: ['1% of contract value (minimum ETB 500)'],
    deadline: 'At time of document execution',
    automation: 'PARTIAL',
    services: ['ExciseStampService'],
  },
  // ── Property Tax ────────────────────────────────────────────────────────
  {
    mandate: 'Property Tax',
    proclamation: 'Proclamation No. 1161/2019',
    frequency: 'ANNUAL',
    portal: 'ETAX',
    models: ['PropertyRecord', 'PropertyAssessment'],
    rates: ['1% of assessed value (standard); municipal rates may vary by city'],
    deadline: 'Annual assessment by municipality; payment by municipal deadline',
    automation: 'MANUAL',
    services: ['PropertyTaxService'],
  },
  // ── Pension Remittance (PFSA) ────────────────────────────────────────────
  {
    mandate: 'Pension Remittance to PFSA',
    proclamation: 'Private Organisations Employees Pension Proclamation No. 715/2011',
    frequency: 'MONTHLY',
    portal: 'ETAX',
    models: ['PensionRemittance', 'PayrollRecord'],
    rates: ['Employee: 7% of insurable earnings', 'Employer: 11% of insurable earnings', 'Total: 18%; insurable cap: ETB 15,000/month'],
    deadline: '30th of the following month (to PFSA, not MoR)',
    automation: 'FULL',
    services: ['TaxService'],
  },
  // ── SRM / EFD Registration ────────────────────────────────────────────────
  {
    mandate: 'Sales Register Machine (SRM/EFD) Registration',
    proclamation: 'Tax Administration Procedure Proclamation No. 983/2016 s.26.1; MoR TASS Directive',
    frequency: 'AT_TRANSACTION',
    portal: 'TASS',
    models: ['SrmDevice', 'PortalSubmissionLog'],
    rates: ['ETB 50,000 penalty per unregistered device (Tax Admin. Proc. s.26.1)'],
    deadline: 'Before first transaction; annual Z-report reconciliation',
    automation: 'PARTIAL',
    services: ['TassService'],
  },
  // ── Customs Declaration ──────────────────────────────────────────────────
  {
    mandate: 'Customs Declaration (e-SAD)',
    proclamation: 'Ethiopian Customs Proclamation No. 1265/2021; ASYCUDA World',
    frequency: 'AT_CLEARANCE',
    portal: 'CUSTOMS',
    models: ['CustomsDeclaration', 'TradeShipment', 'HsTariffEntry'],
    rates: ['Customs duty: 0–35% of CIF', 'Surtax: 10% on CIF+duty+excise (capital goods exempt)', 'VAT on imports: 15%', 'Advance BIT: 3% of CIF (Schedule C importers)'],
    deadline: 'Before goods released from customs area',
    automation: 'PARTIAL',
    services: ['CustomsService'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. IFRS Framework Selector
//    Determines which reporting framework applies based on entity classification
//    per AABE (Accounting & Auditing Board of Ethiopia) thresholds
// ─────────────────────────────────────────────────────────────────────────────

export type AABEFramework =
  | 'FULL_IFRS'         // Public Interest Entities (PIEs): banks, insurers, listed companies
  | 'IFRS_FOR_SMES'     // Medium private companies below PIE threshold
  | 'EFRS_SMALL'        // Small entities using Ethiopian Financial Reporting Standard
  | 'EFRS_MICRO';       // Micro-entities (cash basis permitted under EFRS)

export interface AABEClassification {
  framework: AABEFramework;
  label: string;
  description: string;
  /** Annual turnover threshold (ETB) used for classification */
  turnoverThresholdEtb: number | null;
  /** Whether statutory audit is mandatory */
  auditMandatory: boolean;
  /** Filing deadline after year-end */
  filingDeadlineMonths: number;
  /** IFRS standards that must be fully applied */
  mandatoryStandards: string[];
}

export const AABE_FRAMEWORK_THRESHOLDS: Record<AABEFramework, AABEClassification> = {
  FULL_IFRS: {
    framework: 'FULL_IFRS',
    label: 'Full IFRS (Public Interest Entity)',
    description: 'Banks, insurance companies, microovds institutions, public companies, and entities with public accountability.',
    turnoverThresholdEtb: null,   // Not turnover-based — determined by regulatory status
    auditMandatory: true,
    filingDeadlineMonths: 3,      // 3 months after year-end for PIEs
    mandatoryStandards: [
      'IAS 1', 'IAS 2', 'IAS 7', 'IAS 8', 'IAS 10', 'IAS 12',
      'IAS 16', 'IAS 19', 'IAS 21', 'IAS 24', 'IAS 32', 'IAS 33',
      'IAS 36', 'IAS 37', 'IAS 38', 'IAS 40',
      'IFRS 7', 'IFRS 9', 'IFRS 10', 'IFRS 13', 'IFRS 15', 'IFRS 16',
    ],
  },
  IFRS_FOR_SMES: {
    framework: 'IFRS_FOR_SMES',
    label: 'IFRS for SMEs',
    description: 'Private companies with annual turnover ≥ ETB 5,000,000 that are not PIEs. Reduced disclosure requirements.',
    turnoverThresholdEtb: 5_000_000,
    auditMandatory: true,
    filingDeadlineMonths: 4,
    mandatoryStandards: [
      'IFRS for SMEs Section 3 (Financial Statement Presentation)',
      'IFRS for SMEs Section 13 (Inventories)',
      'IFRS for SMEs Section 17 (PPE)',
      'IFRS for SMEs Section 20 (Leases)',
      'IFRS for SMEs Section 21 (Provisions)',
      'IFRS for SMEs Section 22 (Liabilities and Equity)',
      'IFRS for SMEs Section 23 (Revenue)',
      'IFRS for SMEs Section 28 (Employee Benefits)',
      'IFRS for SMEs Section 29 (Income Tax)',
    ],
  },
  EFRS_SMALL: {
    framework: 'EFRS_SMALL',
    label: 'Ethiopian Financial Reporting Standard — Small Entity',
    description: 'Private companies with annual turnover ETB 500,000–5,000,000. Accrual basis required; simplified disclosures.',
    turnoverThresholdEtb: 500_000,
    auditMandatory: false,        // Review engagement sufficient
    filingDeadlineMonths: 4,
    mandatoryStandards: [
      'EFRS for Small Entities — AABE Directive',
      'Accrual basis accounting',
      'Basic financial statements: Balance Sheet + Income Statement',
    ],
  },
  EFRS_MICRO: {
    framework: 'EFRS_MICRO',
    label: 'Ethiopian Financial Reporting Standard — Micro Entity',
    description: 'Sole proprietors and micro-businesses with annual turnover < ETB 500,000. Cash basis permitted.',
    turnoverThresholdEtb: 0,
    auditMandatory: false,
    filingDeadlineMonths: 6,
    mandatoryStandards: [
      'EFRS for Micro Entities — AABE Directive',
      'Cash basis or accrual basis permitted',
      'Basic income and expense statement',
    ],
  },
};

/**
 * Determine the applicable AABE financial reporting framework for an entity.
 *
 * @param annualTurnoverEtb  Annual gross turnover in ETB
 * @param isPublicInterestEntity  True for banks, insurers, listed companies, NBE-licensed entities
 */
export function selectAABEFramework(
  annualTurnoverEtb: number,
  isPublicInterestEntity: boolean,
): AABEFramework {
  if (isPublicInterestEntity) return 'FULL_IFRS';
  if (annualTurnoverEtb >= 5_000_000) return 'IFRS_FOR_SMES';
  if (annualTurnoverEtb >= 500_000) return 'EFRS_SMALL';
  return 'EFRS_MICRO';
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MoR Penalty Calculator
//    Proclamation No. 983/2016 (Tax Administration) — Sections 79–90
//    Covers: late filing, late payment, non-filing, false return penalties
// ─────────────────────────────────────────────────────────────────────────────

export type PenaltyType =
  | 'LATE_FILING'          // Filed but past deadline
  | 'LATE_PAYMENT'         // Tax paid but after due date
  | 'NON_FILING'           // Failed to file at all
  | 'FALSE_RETURN'         // Materially incorrect return
  | 'FAILURE_TO_REGISTER'  // Did not register when required
  | 'SRM_UNREGISTERED';    // Sales device not registered with TASS

export interface PenaltyCalcInput {
  type: PenaltyType;
  taxAmountEtb: number;
  /** Number of days past the deadline */
  daysLate: number;
  /** Whether the taxpayer voluntarily disclosed (reduces penalty) */
  voluntaryDisclosure?: boolean;
}

export interface PenaltyCalcResult {
  penaltyType: PenaltyType;
  basePenaltyEtb: number;
  interestEtb: number;
  totalPenaltyEtb: number;
  penaltyRate: number;
  interestRate: number;
  proclamationRef: string;
  notes: string;
}

/**
 * Daily interest rate on late payments — 2% per month = ~0.0667% per day
 * Proclamation No. 983/2016 Art. 82: interest at NBE lending rate + 2%
 * Approximated here at 2% per month (conservative estimate).
 */
const LATE_PAYMENT_INTEREST_RATE_MONTHLY = 0.02;
const LATE_PAYMENT_INTEREST_RATE_DAILY   = LATE_PAYMENT_INTEREST_RATE_MONTHLY / 30;

/**
 * Calculate MoR penalties and interest for late or non-filing.
 * Proclamation No. 983/2016 (Tax Administration Procedure Proclamation).
 */
export function calculateMoRPenalty(input: PenaltyCalcInput): PenaltyCalcResult {
  const { type, taxAmountEtb, daysLate, voluntaryDisclosure } = input;

  let basePenaltyEtb = 0;
  let penaltyRate    = 0;
  let interestEtb    = 0;
  let proclamationRef: string;
  let notes: string;

  switch (type) {
    case 'LATE_FILING':
      // Art. 79: 5% of tax for first 30 days; additional 2% per subsequent 30 days (max 25%)
      penaltyRate = Math.min(0.05 + Math.floor(Math.max(0, daysLate - 30) / 30) * 0.02, 0.25);
      if (voluntaryDisclosure) penaltyRate = Math.max(0, penaltyRate * 0.5); // 50% reduction
      basePenaltyEtb = Math.round(taxAmountEtb * penaltyRate * 100) / 100;
      interestEtb    = Math.round(taxAmountEtb * LATE_PAYMENT_INTEREST_RATE_DAILY * daysLate * 100) / 100;
      proclamationRef = 'Tax Admin. Proc. No. 983/2016 Art. 79';
      notes = `${(penaltyRate * 100).toFixed(0)}% late filing penalty${voluntaryDisclosure ? ' (50% reduction for voluntary disclosure)' : ''} + ${(LATE_PAYMENT_INTEREST_RATE_MONTHLY * 100).toFixed(0)}%/month interest`;
      break;

    case 'LATE_PAYMENT':
      // Art. 82: Interest at NBE lending rate + 2% per annum (monthly compounding)
      penaltyRate = 0;
      interestEtb = Math.round(taxAmountEtb * LATE_PAYMENT_INTEREST_RATE_DAILY * daysLate * 100) / 100;
      proclamationRef = 'Tax Admin. Proc. No. 983/2016 Art. 82';
      notes = `${(LATE_PAYMENT_INTEREST_RATE_MONTHLY * 100).toFixed(0)}%/month interest on unpaid tax (NBE lending rate + 2% p.a.)`;
      break;

    case 'NON_FILING':
      // Art. 80: 5% of assessed tax + 2% per 30-day period beyond the first (max 50%)
      penaltyRate = Math.min(0.05 + Math.floor(daysLate / 30) * 0.02, 0.50);
      if (voluntaryDisclosure) penaltyRate = Math.max(0, penaltyRate * 0.5);
      basePenaltyEtb = Math.round(taxAmountEtb * penaltyRate * 100) / 100;
      interestEtb    = Math.round(taxAmountEtb * LATE_PAYMENT_INTEREST_RATE_DAILY * daysLate * 100) / 100;
      proclamationRef = 'Tax Admin. Proc. No. 983/2016 Art. 80';
      notes = `${(penaltyRate * 100).toFixed(0)}% non-filing penalty (max 50%)${voluntaryDisclosure ? ' (50% reduction for voluntary disclosure)' : ''}`;
      break;

    case 'FALSE_RETURN':
      // Art. 84: 75% of additional tax assessed (100% if fraud established)
      penaltyRate    = 0.75;
      basePenaltyEtb = Math.round(taxAmountEtb * penaltyRate * 100) / 100;
      interestEtb    = Math.round(taxAmountEtb * LATE_PAYMENT_INTEREST_RATE_DAILY * daysLate * 100) / 100;
      proclamationRef = 'Tax Admin. Proc. No. 983/2016 Art. 84';
      notes = '75% of underpaid tax (increases to 100% if fraud established)';
      break;

    case 'FAILURE_TO_REGISTER':
      // Art. 78: ETB 500 per month; max ETB 5,000 + back taxes with interest
      basePenaltyEtb = Math.min(500 * Math.ceil(daysLate / 30), 5_000);
      penaltyRate    = taxAmountEtb > 0 ? basePenaltyEtb / taxAmountEtb : 0;
      interestEtb    = Math.round(taxAmountEtb * LATE_PAYMENT_INTEREST_RATE_DAILY * daysLate * 100) / 100;
      proclamationRef = 'Tax Admin. Proc. No. 983/2016 Art. 78';
      notes = 'ETB 500/month (max ETB 5,000) + back taxes + interest';
      break;

    case 'SRM_UNREGISTERED':
      // TASS Directive: ETB 50,000 per unregistered device
      basePenaltyEtb  = 50_000;
      penaltyRate     = 0;
      interestEtb     = 0;
      proclamationRef = 'Tax Admin. Proc. No. 983/2016 s.26.1 (TASS SRM Directive)';
      notes = 'Flat ETB 50,000 penalty per unregistered Sales Register Machine';
      break;

    default:
      basePenaltyEtb  = 0;
      penaltyRate     = 0;
      interestEtb     = 0;
      proclamationRef = 'Tax Admin. Proc. No. 983/2016';
      notes = 'Unknown penalty type';
  }

  return {
    penaltyType: type,
    basePenaltyEtb,
    interestEtb,
    totalPenaltyEtb: Math.round((basePenaltyEtb + interestEtb) * 100) / 100,
    penaltyRate,
    interestRate: LATE_PAYMENT_INTEREST_RATE_MONTHLY,
    proclamationRef,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. IFRS SMLE (Small & Medium Large Entities) vs Full IFRS — Feature Gate Map
//    Maps each OVDS accounting feature to the minimum framework that requires it
// ─────────────────────────────────────────────────────────────────────────────

export type IFRSFrameworkLevel =
  | 'ALL'           // Required under all frameworks (even EFRS Micro)
  | 'EFRS_SMALL'    // Required from EFRS Small Entity upwards
  | 'IFRS_SMES'     // Required from IFRS for SMEs upwards
  | 'FULL_IFRS';    // Required only under full IFRS (PIEs)

export interface IFRSFeatureGate {
  feature: string;
  description: string;
  minimumFramework: IFRSFrameworkLevel;
  ovdsModule: string;
  proclamationOrStandard: string;
}

export const IFRS_FEATURE_GATES: IFRSFeatureGate[] = [
  // ALL frameworks
  { feature: 'double_entry_ledger',       description: 'Double-entry general ledger with debit/credit enforcement',              minimumFramework: 'ALL',        ovdsModule: 'accounting',  proclamationOrStandard: 'Proc. 1243/2021 Art. 95; IAS 1' },
  { feature: 'invoice',                 description: 'Invoices with VAT/TOT calculation and audit trail',                      minimumFramework: 'ALL',        ovdsModule: 'invoice',   proclamationOrStandard: 'Proc. 1341/2024; Proc. 1395/2025' },
  { feature: 'payroll_pit',               description: 'Employee payroll with PIT, pension, and DRRF deductions',                minimumFramework: 'ALL',        ovdsModule: 'hr',          proclamationOrStandard: 'Proc. 1395/2025 Art. 7-11' },
  { feature: 'vat_or_tot',               description: 'VAT returns (registered) or TOT filing (unregistered)',                   minimumFramework: 'ALL',        ovdsModule: 'tax',         proclamationOrStandard: 'Proc. 1341/2024; Proc. 1395/2025 Art. 35' },
  { feature: 'wht_certificates',         description: 'WHT deduction and certificate issuance per Proc. 1395/2025',             minimumFramework: 'ALL',        ovdsModule: 'tax',         proclamationOrStandard: 'Proc. 1395/2025 Art. 94' },
  { feature: 'bit_declaration',          description: 'Annual BIT/CIT declaration and MAT comparison',                           minimumFramework: 'ALL',        ovdsModule: 'tax',         proclamationOrStandard: 'Proc. 979/2016; Proc. 1395/2025' },
  { feature: 'period_lock',              description: 'Month-end period lock preventing retroactive journal changes',             minimumFramework: 'ALL',        ovdsModule: 'accounting',  proclamationOrStandard: 'Proc. 1243/2021 Art. 95; IAS 1.38' },

  // EFRS Small and above
  { feature: 'accrual_prepayments',      description: 'Accruals and prepayments (IAS 1 accrual basis)',                         minimumFramework: 'EFRS_SMALL', ovdsModule: 'accounting',  proclamationOrStandard: 'IAS 1; EFRS Small Entity Standard' },
  { feature: 'fixed_assets_register',    description: 'Fixed asset register with straight-line depreciation',                   minimumFramework: 'EFRS_SMALL', ovdsModule: 'accounting',  proclamationOrStandard: 'IAS 16; Proc. 979/2016 Art. 25' },
  { feature: 'inventory_valuation',      description: 'FIFO/AVCO inventory costing with NRV test',                              minimumFramework: 'EFRS_SMALL', ovdsModule: 'inventory',   proclamationOrStandard: 'IAS 2; IFRS for SMEs Section 13' },
  { feature: 'provisions',               description: 'Provisions and contingent liabilities (IAS 37)',                          minimumFramework: 'EFRS_SMALL', ovdsModule: 'accounting',  proclamationOrStandard: 'IAS 37; IFRS for SMEs Section 21' },
  { feature: 'ias19_employee_benefits',  description: 'Leave accrual and gratuity provision (IAS 19)',                          minimumFramework: 'EFRS_SMALL', ovdsModule: 'hr',          proclamationOrStandard: 'IAS 19; Labour Proc. 1156/2019' },
  { feature: 'financial_statements',     description: 'Full IFRS-compliant financial statement set (BS + P&L + CF + Notes)',    minimumFramework: 'EFRS_SMALL', ovdsModule: 'reporting',   proclamationOrStandard: 'IAS 1; AABE Framework' },

  // IFRS for SMEs and above
  { feature: 'dual_depreciation',        description: 'Dual-book: IFRS component depreciation + Ethiopian tax pool (Art. 25)',  minimumFramework: 'IFRS_SMES',  ovdsModule: 'accounting',  proclamationOrStandard: 'IAS 16; IFRS for SMEs Section 17; Proc. 979/2016 Art. 25' },
  { feature: 'deferred_tax',             description: 'Deferred tax assets/liabilities (IAS 12)',                               minimumFramework: 'IFRS_SMES',  ovdsModule: 'accounting',  proclamationOrStandard: 'IAS 12; IFRS for SMEs Section 29' },
  { feature: 'ifrs16_leases',            description: 'Right-of-Use assets and lease liabilities (IFRS 16)',                    minimumFramework: 'IFRS_SMES',  ovdsModule: 'accounting',  proclamationOrStandard: 'IFRS 16; IFRS for SMEs Section 20' },
  { feature: 'revenue_recognition',      description: 'IFRS 15 five-step revenue recognition (performance obligations)',        minimumFramework: 'IFRS_SMES',  ovdsModule: 'invoice',   proclamationOrStandard: 'IFRS 15; IFRS for SMEs Section 23' },
  { feature: 'budget_variance',          description: 'Budget vs. actuals reporting with variance analysis',                    minimumFramework: 'IFRS_SMES',  ovdsModule: 'reporting',   proclamationOrStandard: 'IFRS for SMEs Section 3; IAS 1' },
  { feature: 'cost_centers',             description: 'Cost centre allocation for segment/departmental reporting',               minimumFramework: 'IFRS_SMES',  ovdsModule: 'accounting',  proclamationOrStandard: 'IFRS 8; IFRS for SMEs Section 11' },
  { feature: 'bank_reconciliation',      description: 'Automated bank statement reconciliation',                                minimumFramework: 'IFRS_SMES',  ovdsModule: 'treasury',    proclamationOrStandard: 'IAS 7; IFRS for SMEs Section 7' },

  // Full IFRS only (PIEs)
  { feature: 'ecl_provision',            description: 'IFRS 9 three-stage Expected Credit Loss provision matrix',               minimumFramework: 'FULL_IFRS',  ovdsModule: 'accounting',  proclamationOrStandard: 'IFRS 9; NBE Directive (banks)' },
  { feature: 'consolidation',            description: 'IFRS 10 group consolidation with intercompany eliminations',             minimumFramework: 'FULL_IFRS',  ovdsModule: 'accounting',  proclamationOrStandard: 'IFRS 10; IAS 27' },
  { feature: 'fx_translation',           description: 'IAS 21 foreign currency retranslation and OCI recycling',               minimumFramework: 'FULL_IFRS',  ovdsModule: 'currency',    proclamationOrStandard: 'IAS 21; NBE FXD/74/2023' },
  { feature: 'ias12_full_reconciliation', description: 'Full IAS 12 deferred tax reconciliation bridge (permanent/temporary)',  minimumFramework: 'FULL_IFRS',  ovdsModule: 'accounting',  proclamationOrStandard: 'IAS 12.81; Proc. 979/2016' },
  { feature: 'ifrs18_pl_categories',     description: 'IFRS 18 mandatory P&L categorisation (OPERATING/INVESTING/FINANCING)',  minimumFramework: 'FULL_IFRS',  ovdsModule: 'reporting',   proclamationOrStandard: 'IFRS 18 (effective 2027)' },
  { feature: 'transfer_pricing',         description: 'Transfer pricing register and arm\'s length documentation',             minimumFramework: 'FULL_IFRS',  ovdsModule: 'tax',         proclamationOrStandard: 'Proc. 979/2016 s.20.5; OECD TP Guidelines' },
  { feature: 'thin_capitalisation',      description: 'Thin capitalisation monitor (2:1 debt:equity threshold)',               minimumFramework: 'FULL_IFRS',  ovdsModule: 'tax',         proclamationOrStandard: 'Proc. 979/2016 s.20.3' },
  { feature: 'foreign_tax_credit',       description: 'Foreign tax credit application against Ethiopian BIT',                  minimumFramework: 'FULL_IFRS',  ovdsModule: 'tax',         proclamationOrStandard: 'Proc. 979/2016 s.20.1' },
  { feature: 'audit_engagement',         description: 'Statutory audit engagement with external auditor management',            minimumFramework: 'FULL_IFRS',  ovdsModule: 'audit',       proclamationOrStandard: 'Proc. 1243/2021 Art. 93; AABE Audit Standard' },
];

/**
 * Get all features required (or available) for a given AABE framework level.
 * Returns features whose minimumFramework is AT or BELOW the given level.
 *
 * Framework hierarchy: EFRS_MICRO < EFRS_SMALL < IFRS_SMES < FULL_IFRS
 */
export function getFeaturesForFramework(framework: AABEFramework): IFRSFeatureGate[] {
  const order: IFRSFrameworkLevel[] = ['ALL', 'EFRS_SMALL', 'IFRS_SMES', 'FULL_IFRS'];
  // Map AABEFramework to IFRSFrameworkLevel for gate comparison
  const levelMap: Record<AABEFramework, number> = {
    EFRS_MICRO:   0,  // only 'ALL' features
    EFRS_SMALL:   1,
    IFRS_FOR_SMES: 2,
    FULL_IFRS:    3,
  };
  const entityLevel = levelMap[framework];
  return IFRS_FEATURE_GATES.filter(
    (f) => order.indexOf(f.minimumFramework) <= entityLevel,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Compliance Dashboard Summary
//    Generates a runtime compliance checklist for a given company profile
// ─────────────────────────────────────────────────────────────────────────────

export interface ComplianceCheckItem {
  id: string;
  category: 'TAX' | 'IFRS' | 'COMMERCIAL_CODE' | 'LABOUR' | 'CUSTOMS';
  title: string;
  status: 'COMPLIANT' | 'PENDING' | 'OVERDUE' | 'NOT_APPLICABLE' | 'NEEDS_REVIEW';
  dueDate?: string;           // ISO date string
  daysUntilDue?: number;      // negative = overdue
  proclamationRef: string;
  ovdsLink?: string;          // Frontend route that handles this item
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ComplianceProfile {
  companyId: string;
  annualTurnoverEtb: number;
  isVatRegistered: boolean;
  isPublicInterestEntity: boolean;
  currentPeriod: string;       // YYYY-MM
  efyYear: number;
  hasEmployees: boolean;
  hasImports: boolean;
  hasLeases: boolean;
  hasForeignOperations: boolean;
}

/**
 * Generate a compliance checklist for a company profile.
 * Used by the Tax Dashboard and Compliance Auditor pages.
 */
export function generateComplianceChecklist(
  profile: ComplianceProfile,
  now: Date = new Date(),
): ComplianceCheckItem[] {
  const items: ComplianceCheckItem[] = [];
  const [y, m] = profile.currentPeriod.split('-').map(Number);

  // Helper: deadline = last day of next month
  function nextMonthDeadline(dayOfMonth = 30): Date {
    const d = new Date(m === 12 ? y + 1 : y, m === 12 ? 0 : m, dayOfMonth);
    return d;
  }

  function daysLeft(d: Date): number {
    return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
  }

  function toStatus(dl: Date): ComplianceCheckItem['status'] {
    const d = daysLeft(dl);
    if (d < 0) return 'OVERDUE';
    if (d <= 7) return 'PENDING';
    return 'PENDING';
  }

  // ── Monthly: VAT or TOT ───────────────────────────────────────────────────
  if (profile.isVatRegistered) {
    const dl = nextMonthDeadline(30);
    items.push({
      id: `vat-${profile.currentPeriod}`,
      category: 'TAX',
      title: `VAT Return — ${profile.currentPeriod}`,
      status: toStatus(dl),
      dueDate: dl.toISOString().slice(0, 10),
      daysUntilDue: daysLeft(dl),
      proclamationRef: 'Proc. 1341/2024 Art. 24',
      ovdsLink: '/tax/vat',
      severity: 'CRITICAL',
    });
  } else if (profile.annualTurnoverEtb >= 500_000) {
    const dl = nextMonthDeadline(30);
    items.push({
      id: `tot-${profile.currentPeriod}`,
      category: 'TAX',
      title: `TOT Filing — ${profile.currentPeriod}`,
      status: toStatus(dl),
      dueDate: dl.toISOString().slice(0, 10),
      daysUntilDue: daysLeft(dl),
      proclamationRef: 'Proc. 1395/2025 Art. 35',
      ovdsLink: '/ovds/tot-filing',
      severity: 'HIGH',
    });
  }

  // ── Monthly: PAYE + Pension ───────────────────────────────────────────────
  if (profile.hasEmployees) {
    const dl = nextMonthDeadline(30);
    items.push({
      id: `paye-${profile.currentPeriod}`,
      category: 'TAX',
      title: `PAYE Declaration (PIT + DRRF) — ${profile.currentPeriod}`,
      status: toStatus(dl),
      dueDate: dl.toISOString().slice(0, 10),
      daysUntilDue: daysLeft(dl),
      proclamationRef: 'Proc. 1395/2025 Art. 7-11',
      ovdsLink: '/ovds/paye-declarations',
      severity: 'CRITICAL',
    });
    items.push({
      id: `pension-${profile.currentPeriod}`,
      category: 'TAX',
      title: `Pension Remittance to PFSA — ${profile.currentPeriod}`,
      status: toStatus(dl),
      dueDate: dl.toISOString().slice(0, 10),
      daysUntilDue: daysLeft(dl),
      proclamationRef: 'Pension Proc. No. 715/2011',
      ovdsLink: '/hr/payroll',
      severity: 'HIGH',
    });
  }

  // ── Monthly: WHT certificates (always relevant if paying suppliers) ───────
  {
    const dl = nextMonthDeadline(30);
    items.push({
      id: `wht-${profile.currentPeriod}`,
      category: 'TAX',
      title: `WHT Remittance — ${profile.currentPeriod}`,
      status: toStatus(dl),
      dueDate: dl.toISOString().slice(0, 10),
      daysUntilDue: daysLeft(dl),
      proclamationRef: 'Proc. 1395/2025 Art. 94',
      ovdsLink: '/ovds/wht-certificates',
      severity: 'HIGH',
    });
  }

  // ── Quarterly: DRRF levy (Ethiopian quarter deadlines) ────────────────────
  {
    const etQuarterEndMonths = [3, 6, 9, 12]; // Gregorian approximations
    const nextQEnd = etQuarterEndMonths.find((qm) => qm >= m) ?? 12;
    const qYear = nextQEnd < m ? y + 1 : y;
    const drrfDl = new Date(qYear, nextQEnd - 1, 15);
    items.push({
      id: `drrf-q-${qYear}-${nextQEnd}`,
      category: 'TAX',
      title: `DRRF Quarterly Levy Report — Q ending ${qYear}-${String(nextQEnd).padStart(2, '0')}`,
      status: toStatus(drrfDl),
      dueDate: drrfDl.toISOString().slice(0, 10),
      daysUntilDue: daysLeft(drrfDl),
      proclamationRef: 'Regulation No. 570/2025',
      ovdsLink: '/ovds/disaster-fund',
      severity: 'HIGH',
    });
  }

  // ── Annual: BIT Declaration ───────────────────────────────────────────────
  {
    // November 7 of the year following EFY end (EFY ends ~Sep 10)
    const bitDl = new Date(profile.efyYear + 8, 10, 7); // month 10 = November (0-indexed)
    items.push({
      id: `bit-${profile.efyYear}`,
      category: 'TAX',
      title: `BIT / CIT Declaration — EFY ${profile.efyYear}`,
      status: toStatus(bitDl),
      dueDate: bitDl.toISOString().slice(0, 10),
      daysUntilDue: daysLeft(bitDl),
      proclamationRef: 'Proc. 979/2016; Proc. 1395/2025',
      ovdsLink: '/ovds/business-income-tax',
      severity: 'CRITICAL',
    });
  }

  // ── IFRS: Period Close ────────────────────────────────────────────────────
  {
    const pcDl = nextMonthDeadline(10); // Best practice: close by 10th of following month
    items.push({
      id: `period-close-${profile.currentPeriod}`,
      category: 'IFRS',
      title: `Period Close — ${profile.currentPeriod}`,
      status: 'PENDING',
      dueDate: pcDl.toISOString().slice(0, 10),
      daysUntilDue: daysLeft(pcDl),
      proclamationRef: 'IAS 1; Proc. 1243/2021 Art. 95',
      ovdsLink: '/ovds/period-close',
      severity: 'HIGH',
    });
  }

  // ── IFRS: IAS 19 Monthly Accruals ─────────────────────────────────────────
  if (profile.hasEmployees) {
    items.push({
      id: `ias19-accrual-${profile.currentPeriod}`,
      category: 'IFRS',
      title: `IAS 19 Leave & Gratuity Accrual — ${profile.currentPeriod}`,
      status: 'NEEDS_REVIEW',
      proclamationRef: 'IAS 19; Labour Proc. 1156/2019',
      ovdsLink: '/hr/payroll',
      severity: 'MEDIUM',
    });
  }

  // ── IFRS: IFRS 16 Monthly Lease Posting ───────────────────────────────────
  if (profile.hasLeases) {
    items.push({
      id: `ifrs16-${profile.currentPeriod}`,
      category: 'IFRS',
      title: `IFRS 16 Lease Amortisation — ${profile.currentPeriod}`,
      status: 'NEEDS_REVIEW',
      proclamationRef: 'IFRS 16',
      ovdsLink: '/ovds/leases',
      severity: 'MEDIUM',
    });
  }

  // ── Customs: Import Compliance ────────────────────────────────────────────
  if (profile.hasImports) {
    items.push({
      id: `customs-compliance-${profile.currentPeriod}`,
      category: 'CUSTOMS',
      title: 'Customs Declarations — Review pending e-SADs',
      status: 'NEEDS_REVIEW',
      proclamationRef: 'Ethiopian Customs Proc. 1265/2021',
      ovdsLink: '/ovds/trade',
      severity: 'HIGH',
    });
  }

  return items;
}
