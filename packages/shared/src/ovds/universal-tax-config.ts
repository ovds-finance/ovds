/**
 * Universal Ethiopian Tax Configuration
 * ─────────────────────────────────────
 * Single source of truth for ALL tax rates, thresholds, GL account mappings,
 * IAS 12 treatments, filing deadlines, RBAC permissions, and rule-based
 * automation triggers used across every industry in Ethiopia.
 *
 * Legal authority hierarchy:
 *   1. Federal Tax Proclamations (Proc. 979/2016, 1186/2020, 1341/2024, 1395/2025)
 *   2. Council of Ministers Regulations (Reg. 570/2025)
 *   3. MoR Directives (etax.mor.gov.et, TASS, ECC)
 *   4. IFRS / IAS (adopted by AABE — Full IFRS / IFRS for SMEs / EFRS)
 *
 * Applies uniformly across ALL business sectors (Primary → Quaternary).
 * Sector-specific EXEMPTIONS are declared in TAX_RULE_OVERRIDES below.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. CANONICAL TAX TYPE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export type TaxTypeCode =
  | 'VAT'           // Value Added Tax — Proc. 1341/2024
  | 'TOT'           // Turnover Tax — Proc. 1395/2025
  | 'BIT'           // Business Income Tax (Corporate) — Proc. 979/2016
  | 'PIT'           // Personal Income Tax (PAYE) — Proc. 1395/2025
  | 'WHT_GOODS'     // WHT on goods ≥ ETB 10K — Proc. 1395/2025
  | 'WHT_SERVICES'  // WHT on services ≥ ETB 3K — Proc. 1395/2025
  | 'WHT_NR'        // WHT non-resident services — 15%
  | 'WHT_RENT'      // WHT on rent (corporate) — 30%
  | 'WHT_DIVIDEND'  // Dividend WHT — 15%
  | 'WHT_INTEREST'  // Interest WHT — 10%
  | 'DRRF'          // Disaster Risk Response Fund — Reg. 570/2025
  | 'PENSION_EE'    // Employee pension to PFSA — 7%
  | 'PENSION_ER'    // Employer pension to PFSA — 11%
  | 'EXCISE'        // Excise Tax — Proc. 1186/2020
  | 'STAMP_DUTY'    // Stamp Duty — Proc. 110/1998
  | 'PROPERTY_TAX'  // Property Tax — Proc. 1161/2019
  | 'CUSTOMS_DUTY'  // Customs — Proc. 1265/2021
  | 'IMPORT_SURTAX' // Surtax on imports — 10% of (CIF + duty + excise)
  | 'ADVANCE_BIT'   // Advance BIT on imports — 3% of CIF
  | 'CAPITAL_GAINS' // Capital gains — 15% — Proc. 1395/2025
  | 'SCHEDULE_D';   // Other income (dividends, interest, royalties)

// ─────────────────────────────────────────────────────────────────────────────
// 2. IAS 12 TREATMENT ENUM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * IAS 12 classifies tax charges into:
 *   CURRENT_TAX   — income taxes in the current period (Dr Tax Expense / Cr Tax Payable)
 *   DEFERRED_TAX  — temporary differences creating deferred assets/liabilities
 *   NOT_INCOME_TAX — levies that are NOT income taxes (VAT, WHT, DRRF, excise, etc.)
 *                    These go to P&L as operating costs or balance sheet as liabilities.
 */
export type IAS12Treatment =
  | 'CURRENT_TAX'     // BIT/CIT/PIT — income taxes
  | 'DEFERRED_TAX'    // IAS 12 temporary difference
  | 'NOT_INCOME_TAX'; // All other levies — operating cost or liability

// IFRS 18 P&L statement category (effective 2027, adopt now for PIEs)
export type IFRS18Category =
  | 'OPERATING'
  | 'INVESTING'
  | 'FINANCING'
  | 'INCOME_TAX'
  | 'DISCONTINUED';

// Filing portal
export type MoRPortal = 'ETAX' | 'TASS' | 'CUSTOMS' | 'PFSA' | 'MUNICIPALITY';

// Filing frequency
export type FilingFrequency =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'AT_TRANSACTION'
  | 'AT_CLEARANCE';

// Automation level
export type AutomationLevel = 'FULL' | 'PARTIAL' | 'MANUAL';

// ─────────────────────────────────────────────────────────────────────────────
// 3. MASTER TAX RULE DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export interface TaxRule {
  /** Unique code — matches TaxTypeCode */
  code: TaxTypeCode;
  name: string;
  /** Short label shown in UI */
  label: string;
  /** Primary rate (decimal, e.g. 0.15 = 15%) */
  rate: number;
  /** Minimum ETB amount before tax triggers (0 = always applies) */
  thresholdEtb: number;
  /** ETB/year registration threshold (for VAT/TOT band determination) */
  annualTurnoverThresholdEtb?: number;
  /** Specific per-unit rate in ETB (for excise fuel, plastic bags, etc.) */
  specificRateEtb?: number;
  /** Whether this tax is collected FROM customers (output) or deducted FROM payments (input) */
  direction: 'OUTPUT' | 'INPUT' | 'BOTH';
  /** IAS 12 classification */
  ias12Treatment: IAS12Treatment;
  /** IFRS 18 P&L category */
  ifrs18Category: IFRS18Category;
  /** GL debit account code */
  glDebitCode: string;
  /** GL credit account code */
  glCreditCode: string;
  /** Account name for debit side */
  glDebitName: string;
  /** Account name for credit side */
  glCreditName: string;
  /** Filing frequency */
  frequency: FilingFrequency;
  /** Filing deadline rule (human-readable) */
  deadline: string;
  /** MoR portal */
  portal: MoRPortal;
  /** Automation level in OVDS */
  automation: AutomationLevel;
  /** Governing proclamation(s) */
  proclamation: string;
  /** Whether this tax is enabled globally by default */
  enabledByDefault: boolean;
  /** Whether the company can disable this tax in settings */
  overridable: boolean;
  /** Notes for accountants */
  notes: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. UNIVERSAL TAX RULES TABLE  (all industries — Ethiopia)
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_TAX_RULES: Record<TaxTypeCode, TaxRule> = {

  // ── VAT ─────────────────────────────────────────────────────────────────
  VAT: {
    code: 'VAT',
    name: 'Value Added Tax',
    label: 'VAT 15%',
    rate: 0.15,
    thresholdEtb: 0,
    annualTurnoverThresholdEtb: 2_000_000,
    direction: 'OUTPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '1130',
    glCreditCode: '2150',
    glDebitName:  'VAT Receivable / Input VAT',
    glCreditName: 'VAT Payable / Output VAT',
    frequency: 'MONTHLY',
    deadline: '30th of the following month — etax.mor.gov.et',
    portal: 'ETAX',
    automation: 'FULL',
    proclamation: 'Proc. 1341/2024; Reg. 570/2025 (threshold ETB 2M)',
    enabledByDefault: true,
    overridable: false,
    notes: 'Standard 15%. Zero-rate: exports, basic food, medical. Exempt: financial services, education, health. Reverse charge on non-resident digital services.',
  },

  // ── TOT ─────────────────────────────────────────────────────────────────
  TOT: {
    code: 'TOT',
    name: 'Turnover Tax',
    label: 'TOT',
    rate: 0.02, // goods; services = 10% — see notes
    thresholdEtb: 0,
    annualTurnoverThresholdEtb: 2_000_000,
    direction: 'OUTPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '5420',
    glCreditCode: '2155',
    glDebitName:  'TOT Expense',
    glCreditName: 'TOT Payable',
    frequency: 'MONTHLY',
    deadline: '30th of the following month',
    portal: 'ETAX',
    automation: 'FULL',
    proclamation: 'Proc. 1395/2025 Art. 35–38',
    enabledByDefault: false,
    overridable: true,
    notes: '2% goods/construction/grain/farm; 10% all other services. Only when annual turnover < ETB 2M (not VAT-registered). Mutually exclusive with VAT.',
  },

  // ── BIT / CIT ────────────────────────────────────────────────────────────
  BIT: {
    code: 'BIT',
    name: 'Business Income Tax / Corporate Income Tax',
    label: 'BIT 30%',
    rate: 0.30,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'CURRENT_TAX',
    ifrs18Category: 'INCOME_TAX',
    glDebitCode:  '8100',
    glCreditCode: '2160',
    glDebitName:  'Income Tax Expense (Current)',
    glCreditName: 'Income Tax Payable',
    frequency: 'ANNUAL',
    deadline: 'November 7 of the following year (4 months after EFY end July 7)',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 979/2016; amended Proc. 1395/2025',
    enabledByDefault: true,
    overridable: false,
    notes: '30% flat on taxable profit. MAT = 2.5% of gross turnover; final tax = max(BIT, MAT). Provisional payment: 50% of prior-year BIT by month 7. Loss carry-forward: up to 5 years.',
  },

  // ── PIT / PAYE ────────────────────────────────────────────────────────────
  PIT: {
    code: 'PIT',
    name: 'Personal Income Tax (Employment — PAYE)',
    label: 'PIT/PAYE',
    rate: 0.35, // top marginal; brackets applied via calculatePIT()
    thresholdEtb: 600, // monthly exemption — ETB 600/month (ETB 7,200/year)
    direction: 'INPUT',
    ias12Treatment: 'CURRENT_TAX',
    ifrs18Category: 'INCOME_TAX',
    glDebitCode:  '5010',
    glCreditCode: '2161',
    glDebitName:  'Salaries & Wages Expense',
    glCreditName: 'PAYE / PIT Payable',
    frequency: 'MONTHLY',
    deadline: '30th of the following month',
    portal: 'ETAX',
    automation: 'FULL',
    proclamation: 'Proc. 1395/2025 Art. 7–11',
    enabledByDefault: true,
    overridable: false,
    notes: 'Progressive brackets: 0% (≤600/mo), 10%, 15%, 20%, 25%, 30%, 35% (>14,000/mo). Deduct pension employee contribution before applying bracket. DRRF 1% on gross.',
  },

  // ── WHT — GOODS ──────────────────────────────────────────────────────────
  WHT_GOODS: {
    code: 'WHT_GOODS',
    name: 'Withholding Tax — Goods',
    label: 'WHT Goods 3%',
    rate: 0.03,
    thresholdEtb: 10_000,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '2162',
    glCreditCode: '1131',
    glDebitName:  'WHT Payable to MoR',
    glCreditName: 'WHT Receivable (Supplier Credit)',
    frequency: 'MONTHLY',
    deadline: '30th of following month; certificate issued within 5 working days',
    portal: 'ETAX',
    automation: 'FULL',
    proclamation: 'Proc. 1395/2025 Art. 94 (raised from 2% to 3%)',
    enabledByDefault: false,
    overridable: true,
    notes: 'Applies when single goods payment ≥ ETB 10,000. Withholder pays net to supplier and remits 3% to MoR. Creditable against supplier\'s BIT.',
  },

  // ── WHT — SERVICES ───────────────────────────────────────────────────────
  WHT_SERVICES: {
    code: 'WHT_SERVICES',
    name: 'Withholding Tax — Services',
    label: 'WHT Services 3%',
    rate: 0.03,
    thresholdEtb: 3_000,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '2162',
    glCreditCode: '1131',
    glDebitName:  'WHT Payable to MoR',
    glCreditName: 'WHT Receivable (Supplier Credit)',
    frequency: 'MONTHLY',
    deadline: '30th of following month',
    portal: 'ETAX',
    automation: 'FULL',
    proclamation: 'Proc. 1395/2025 Art. 94',
    enabledByDefault: false,
    overridable: true,
    notes: 'Applies when single service payment ≥ ETB 3,000. Same GL as WHT_GOODS — aggregated on WHT return.',
  },

  // ── WHT — NON-RESIDENT ────────────────────────────────────────────────────
  WHT_NR: {
    code: 'WHT_NR',
    name: 'Withholding Tax — Non-Resident Services',
    label: 'WHT Non-Resident 15%',
    rate: 0.15,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '2162',
    glCreditCode: '5440',
    glDebitName:  'WHT Payable to MoR',
    glCreditName: 'Non-Resident Service Expense',
    frequency: 'MONTHLY',
    deadline: '30th of following month',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 1395/2025',
    enabledByDefault: false,
    overridable: true,
    notes: 'Final withholding on payments to non-resident service providers. Also triggers reverse-charge VAT at 15%.',
  },

  // ── WHT — RENT ────────────────────────────────────────────────────────────
  WHT_RENT: {
    code: 'WHT_RENT',
    name: 'Withholding Tax — Rent (Corporate)',
    label: 'WHT Rent 30%',
    rate: 0.30,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '2162',
    glCreditCode: '5450',
    glDebitName:  'WHT Payable to MoR',
    glCreditName: 'Rent Expense',
    frequency: 'MONTHLY',
    deadline: '30th of following month',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 1395/2025',
    enabledByDefault: false,
    overridable: true,
    notes: '30% final WHT on corporate rent payments. Withholder deducts before paying landlord.',
  },

  // ── WHT — DIVIDEND ────────────────────────────────────────────────────────
  WHT_DIVIDEND: {
    code: 'WHT_DIVIDEND',
    name: 'Withholding Tax — Dividend',
    label: 'WHT Dividend 15%',
    rate: 0.15,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'FINANCING',
    glDebitCode:  '3200',
    glCreditCode: '2162',
    glDebitName:  'Retained Earnings / Dividends Declared',
    glCreditName: 'WHT Payable (Dividend)',
    frequency: 'AT_TRANSACTION',
    deadline: '30 days after month-end of payment',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 1395/2025 Art. 52',
    enabledByDefault: false,
    overridable: true,
    notes: '15% on dividends paid to residents and non-residents alike. Declared on Schedule D form.',
  },

  // ── WHT — INTEREST ───────────────────────────────────────────────────────
  WHT_INTEREST: {
    code: 'WHT_INTEREST',
    name: 'Withholding Tax — Interest',
    label: 'WHT Interest 10%',
    rate: 0.10,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'FINANCING',
    glDebitCode:  '7100',
    glCreditCode: '2162',
    glDebitName:  'Interest Expense',
    glCreditName: 'WHT Payable (Interest)',
    frequency: 'AT_TRANSACTION',
    deadline: '30 days after month-end',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 1395/2025 Art. 54',
    enabledByDefault: false,
    overridable: true,
    notes: '10% standard; 30% for FI/credit interest. Schedule D at transaction.',
  },

  // ── DRRF ─────────────────────────────────────────────────────────────────
  DRRF: {
    code: 'DRRF',
    name: 'Disaster Risk Response Fund Levy',
    label: 'DRRF 1%',
    rate: 0.01,
    thresholdEtb: 0,
    direction: 'BOTH',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '5430',
    glCreditCode: '2163',
    glDebitName:  'DRRF Levy Expense',
    glCreditName: 'DRRF Payable',
    frequency: 'QUARTERLY',
    deadline: '15th of last month of each Ethiopian quarter (Dec 15 / Mar 15 / Jun 15 / Sep 15)',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Reg. 570/2025 (DRRF); Proc. 1264/2021',
    enabledByDefault: true,
    overridable: false,
    notes: '1% on loan disbursements, insurance premiums, salary (payroll), dividends. 5% on service fees, airtime, ticket sales, annual revenue, fuel. DRRF Form Q — quarterly.',
  },

  // ── PENSION — EMPLOYEE ────────────────────────────────────────────────────
  PENSION_EE: {
    code: 'PENSION_EE',
    name: 'Employee Pension Contribution (PFSA)',
    label: 'Pension EE 7%',
    rate: 0.07,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '5010',
    glCreditCode: '2164',
    glDebitName:  'Salaries & Wages',
    glCreditName: 'Pension Payable (Employee)',
    frequency: 'MONTHLY',
    deadline: '30th of the following month (remit to PFSA)',
    portal: 'PFSA',
    automation: 'FULL',
    proclamation: 'Private Org. Employees Pension Proc. 715/2011; amended 1268/2023',
    enabledByDefault: true,
    overridable: false,
    notes: '7% of insurable earnings. Insurable cap ETB 15,000/month. Deducted from employee gross before PIT calculation.',
  },

  // ── PENSION — EMPLOYER ───────────────────────────────────────────────────
  PENSION_ER: {
    code: 'PENSION_ER',
    name: 'Employer Pension Contribution (PFSA)',
    label: 'Pension ER 11%',
    rate: 0.11,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '5030',
    glCreditCode: '2165',
    glDebitName:  'Employer Pension Expense',
    glCreditName: 'Pension Payable (Employer)',
    frequency: 'MONTHLY',
    deadline: '30th of the following month',
    portal: 'PFSA',
    automation: 'FULL',
    proclamation: 'Proc. 715/2011; amended 1268/2023',
    enabledByDefault: true,
    overridable: false,
    notes: '11% of insurable earnings (same cap ETB 15,000). Total combined pension = 18%. Employer portion is a staff cost — IAS 19 accrual per payroll period.',
  },

  // ── EXCISE ────────────────────────────────────────────────────────────────
  EXCISE: {
    code: 'EXCISE',
    name: 'Excise Tax',
    label: 'Excise',
    rate: 0.00, // variable — see EXCISE_RATES in excise-tax.types.ts
    thresholdEtb: 0,
    direction: 'OUTPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '5410',
    glCreditCode: '2166',
    glDebitName:  'Excise Tax Expense (Cost of Goods)',
    glCreditName: 'Excise Tax Payable',
    frequency: 'MONTHLY',
    deadline: '30 days after production (local) or at customs clearance (imports)',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 1186/2020; Amendment 1239/2021',
    enabledByDefault: false,
    overridable: true,
    notes: 'Rates vary: 150% cigarettes, 75% spirits/other tobacco, 50% beer/wine, 100% vehicles >1800cc, 30% soft drinks. See EXCISE_RATES map. Levied on ex-factory or CIF value.',
  },

  // ── STAMP DUTY ────────────────────────────────────────────────────────────
  STAMP_DUTY: {
    code: 'STAMP_DUTY',
    name: 'Stamp Duty',
    label: 'Stamp Duty 1%',
    rate: 0.01,
    thresholdEtb: 500, // minimum ETB 500
    direction: 'BOTH',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '5460',
    glCreditCode: '2167',
    glDebitName:  'Stamp Duty Expense',
    glCreditName: 'Stamp Duty Payable',
    frequency: 'AT_TRANSACTION',
    deadline: 'At time of document execution',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 110/1998',
    enabledByDefault: false,
    overridable: true,
    notes: '1% of contract value. Minimum ETB 500. Applies to contracts, leases, mortgages, share transfers.',
  },

  // ── PROPERTY TAX ─────────────────────────────────────────────────────────
  PROPERTY_TAX: {
    code: 'PROPERTY_TAX',
    name: 'Property Tax (Urban Land & Buildings)',
    label: 'Property Tax 1%',
    rate: 0.01,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '5470',
    glCreditCode: '2168',
    glDebitName:  'Property Tax Expense',
    glCreditName: 'Property Tax Payable',
    frequency: 'ANNUAL',
    deadline: 'Annual assessment by municipality; payment by municipal deadline',
    portal: 'MUNICIPALITY',
    automation: 'MANUAL',
    proclamation: 'Proc. 1161/2019',
    enabledByDefault: false,
    overridable: true,
    notes: '1% of assessed value. Municipal rates may vary. Assessed annually by urban land administration office.',
  },

  // ── CUSTOMS DUTY ─────────────────────────────────────────────────────────
  CUSTOMS_DUTY: {
    code: 'CUSTOMS_DUTY',
    name: 'Customs Duty',
    label: 'Customs 0–35%',
    rate: 0.00, // variable by HS tariff code
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '1220', // adds to cost of inventory (IAS 2)
    glCreditCode: '2169',
    glDebitName:  'Inventory / Goods in Transit (IAS 2 cost)',
    glCreditName: 'Customs Duty Payable',
    frequency: 'AT_CLEARANCE',
    deadline: 'Before goods released from customs area',
    portal: 'CUSTOMS',
    automation: 'PARTIAL',
    proclamation: 'Proc. 1265/2021; ASYCUDA World',
    enabledByDefault: false,
    overridable: true,
    notes: '0–35% of CIF value based on HS tariff code. Part of IAS 2 inventory cost. Advance BIT 3% of CIF deducted at source.',
  },

  // ── IMPORT SURTAX ────────────────────────────────────────────────────────
  IMPORT_SURTAX: {
    code: 'IMPORT_SURTAX',
    name: 'Import Surtax',
    label: 'Surtax 10%',
    rate: 0.10,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'NOT_INCOME_TAX',
    ifrs18Category: 'OPERATING',
    glDebitCode:  '1220',
    glCreditCode: '2170',
    glDebitName:  'Inventory (IAS 2 import cost)',
    glCreditName: 'Import Surtax Payable',
    frequency: 'AT_CLEARANCE',
    deadline: 'At customs clearance',
    portal: 'CUSTOMS',
    automation: 'PARTIAL',
    proclamation: 'Council of Ministers Regulation (import duties)',
    enabledByDefault: false,
    overridable: true,
    notes: '10% of (CIF + customs duty + excise). Exempt: capital goods, certain inputs for priority sectors.',
  },

  // ── ADVANCE BIT ON IMPORTS ───────────────────────────────────────────────
  ADVANCE_BIT: {
    code: 'ADVANCE_BIT',
    name: 'Advance BIT on Imports',
    label: 'Advance BIT 3%',
    rate: 0.03,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'CURRENT_TAX',
    ifrs18Category: 'INCOME_TAX',
    glDebitCode:  '1132',
    glCreditCode: '2170',
    glDebitName:  'Prepaid Income Tax (Advance BIT)',
    glCreditName: 'Advance BIT Remitted to Customs',
    frequency: 'AT_CLEARANCE',
    deadline: 'At customs clearance',
    portal: 'CUSTOMS',
    automation: 'PARTIAL',
    proclamation: 'Proc. 979/2016 Art. 89',
    enabledByDefault: false,
    overridable: true,
    notes: '3% of CIF. Credited against annual BIT liability. Schedule C importers only.',
  },

  // ── CAPITAL GAINS ────────────────────────────────────────────────────────
  CAPITAL_GAINS: {
    code: 'CAPITAL_GAINS',
    name: 'Capital Gains Tax',
    label: 'Capital Gains 15%',
    rate: 0.15,
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'CURRENT_TAX',
    ifrs18Category: 'INCOME_TAX',
    glDebitCode:  '8110',
    glCreditCode: '2171',
    glDebitName:  'Capital Gains Tax Expense',
    glCreditName: 'Capital Gains Tax Payable',
    frequency: 'AT_TRANSACTION',
    deadline: '2 months after disposal of asset',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 1395/2025 Art. 58',
    enabledByDefault: false,
    overridable: true,
    notes: '15% on gains from disposal of shares, bonds, or immovable property.',
  },

  // ── SCHEDULE D (catch-all) ────────────────────────────────────────────────
  SCHEDULE_D: {
    code: 'SCHEDULE_D',
    name: 'Schedule D — Other Income Tax',
    label: 'Schedule D',
    rate: 0.15, // default; varies by sub-type
    thresholdEtb: 0,
    direction: 'INPUT',
    ias12Treatment: 'CURRENT_TAX',
    ifrs18Category: 'INCOME_TAX',
    glDebitCode:  '8110',
    glCreditCode: '2171',
    glDebitName:  'Schedule D Tax Expense',
    glCreditName: 'Schedule D Tax Payable',
    frequency: 'AT_TRANSACTION',
    deadline: '30 days after month-end of transaction',
    portal: 'ETAX',
    automation: 'PARTIAL',
    proclamation: 'Proc. 1395/2025 Art. 52–62',
    enabledByDefault: false,
    overridable: true,
    notes: 'Covers dividends (15%), interest (10%), royalties (5%/10%), digital content (15%), games of chance (20%), repatriated/undistributed profits (15%), mgmt fees (15%).',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. SECTOR-SPECIFIC RULE OVERRIDES
//    Applied ON TOP of the universal rules above.
//    If a sector has no entry, the universal rule applies unchanged.
// ─────────────────────────────────────────────────────────────────────────────

export type EthiopianSector =
  | 'AGRICULTURE'
  | 'MANUFACTURING'
  | 'CONSTRUCTION'
  | 'TRADE_WHOLESALE'
  | 'TRADE_RETAIL'
  | 'FINANCIAL_SERVICES'
  | 'TRANSPORT_LOGISTICS'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'HOSPITALITY_TOURISM'
  | 'ICT'
  | 'MEDIA'
  | 'MINING'
  | 'NGO_NONPROFIT'
  | 'GOVERNMENT'
  | 'OTHER';

export interface SectorTaxOverride {
  sector: EthiopianSector;
  taxCode: TaxTypeCode;
  /** Override rate — null means use universal rate */
  rateOverride?: number;
  /** Whether this tax is exempt for this sector */
  exempt: boolean;
  /** Condition text explaining why */
  condition: string;
  /** Governing provision */
  authority: string;
}

export const TAX_RULE_OVERRIDES: SectorTaxOverride[] = [
  // Agriculture — VAT zero-rated on basic crops / primary produce
  { sector: 'AGRICULTURE', taxCode: 'VAT',    exempt: true,  condition: 'Basic unprocessed agricultural produce is VAT-exempt', authority: 'VAT Proc. 1341/2024 Schedule 2' },
  { sector: 'AGRICULTURE', taxCode: 'EXCISE', exempt: true,  condition: 'Agricultural equipment and fertilisers exempt from excise', authority: 'Proc. 1186/2020 exemption list' },
  { sector: 'AGRICULTURE', taxCode: 'IMPORT_SURTAX', exempt: true, condition: 'Capital goods and agricultural inputs exempt from surtax', authority: 'Investment incentive regulations' },

  // Financial Services — VAT exempt; subject to NBE directives
  { sector: 'FINANCIAL_SERVICES', taxCode: 'VAT',  exempt: true,  condition: 'Banking, insurance and financial intermediation services are VAT-exempt', authority: 'VAT Proc. 1341/2024 Schedule 1' },
  { sector: 'FINANCIAL_SERVICES', taxCode: 'TOT',  exempt: true,  condition: 'Not subject to TOT when VAT-exempt under Proc. 1341/2024', authority: 'Proc. 1395/2025 Art. 35' },

  // Education — VAT exempt
  { sector: 'EDUCATION', taxCode: 'VAT',  exempt: true,  condition: 'Educational services are VAT-exempt', authority: 'VAT Proc. 1341/2024 Schedule 1' },
  { sector: 'EDUCATION', taxCode: 'TOT',  exempt: true,  condition: 'Not subject to TOT when VAT-exempt', authority: 'Proc. 1395/2025' },

  // Healthcare — VAT exempt on medical services and medicines
  { sector: 'HEALTHCARE', taxCode: 'VAT', exempt: true, condition: 'Medical services and pharmaceutical supplies are VAT-exempt', authority: 'VAT Proc. 1341/2024 Schedule 1' },

  // NGO / Nonprofit — BIT exempt on core charitable activities
  { sector: 'NGO_NONPROFIT', taxCode: 'BIT', exempt: true, condition: 'Charitable/non-profit organisations exempt from BIT on activities within mandate', authority: 'Proc. 979/2016 Art. 8' },
  { sector: 'NGO_NONPROFIT', taxCode: 'VAT', exempt: false, condition: 'NGOs that make taxable supplies remain VAT-registered if turnover ≥ ETB 2M', authority: 'Proc. 1341/2024' },

  // Manufacturing — Excise on finished goods
  { sector: 'MANUFACTURING', taxCode: 'EXCISE', exempt: false, condition: 'Manufacturers of excisable goods (tobacco, alcohol, vehicles) must register for excise', authority: 'Proc. 1186/2020' },
  { sector: 'MANUFACTURING', taxCode: 'IMPORT_SURTAX', exempt: true, condition: 'Priority manufacturing sectors may receive surtax exemptions on capital goods', authority: 'Investment Proc. 1180/2020' },

  // Government entities — generally not subject to commercial taxes
  { sector: 'GOVERNMENT', taxCode: 'VAT',  exempt: true, condition: 'Federal/regional government bodies are not VAT registrants for own activities', authority: 'VAT Proc. 1341/2024' },
  { sector: 'GOVERNMENT', taxCode: 'BIT',  exempt: true, condition: 'Government enterprises may have BIT exemption per charter', authority: 'Proc. 979/2016 Art. 8' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. COMPANY TAX PROFILE — runtime config per tenant
//    Persisted as company.settings JSON in the database.
//    This is the "universal tax configuration" object the UI writes and the
//    engine reads for every calculation and filing.
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanyTaxProfile {
  // ── Identity ──────────────────────────────────────────────────────────────
  companyId: string;
  tin: string;
  vatNumber?: string;           // null if not VAT-registered
  srmDeviceSerial?: string;     // TASS-registered EFD/SRM device serial

  // ── AABE Framework ────────────────────────────────────────────────────────
  /** FULL_IFRS | IFRS_FOR_SMES | EFRS_SMALL | EFRS_MICRO */
  aabéFramework: string;
  isPublicInterestEntity: boolean;
  annualTurnoverEtb: number;

  // ── Sector & Entity Type ─────────────────────────────────────────────────
  sector: EthiopianSector;
  entityType: 'SOLE_PROPRIETORSHIP' | 'PLC' | 'ONE_MEMBER_PLC' | 'SHARE_COMPANY';

  // ── Tax Band Determination (auto-computed) ─────────────────────────────────
  /** VAT/TOT compliance band: A=VAT registered, B=TOT 500K–2M, C=<500K */
  vatTotBand: 'A' | 'B' | 'C';
  /** BIT/MAT schedule: A>1M, B=500K–1M, C<500K */
  incomeTaxSchedule: 'A' | 'B' | 'C';
  isVatRegistered: boolean;
  isTotApplicable: boolean;

  // ── Active Tax Flags (which taxes apply to this company) ──────────────────
  taxes: {
    vat:           boolean;
    tot:           boolean;
    bit:           boolean;
    pit:           boolean;
    whtGoods:      boolean;
    whtServices:   boolean;
    whtNr:         boolean;
    whtRent:       boolean;
    whtDividend:   boolean;
    whtInterest:   boolean;
    drrf:          boolean;
    pensionEe:     boolean;
    pensionEr:     boolean;
    excise:        boolean;
    stampDuty:     boolean;
    propertyTax:   boolean;
    customsDuty:   boolean;
    importSurtax:  boolean;
    advanceBit:    boolean;
    capitalGains:  boolean;
    scheduleD:     boolean;
  };

  // ── Rate Overrides (if MoR granted a special rate) ────────────────────────
  rateOverrides?: Partial<Record<TaxTypeCode, number>>;

  // ── Filing Calendar ───────────────────────────────────────────────────────
  fiscalYearStartMonth: number;   // 1=Jan, 7=Jul (Ethiopian EFY = July)
  vatFilingDay: number;           // default 30
  pitFilingDay: number;           // default 30
  drrfFilingDay: number;          // default 15 (15th of last month of quarter)
  bitDeadlineMonth: number;       // default 11 (November)
  bitDeadlineDay: number;         // default 7

  // ── Deferred Tax (IAS 12) settings ────────────────────────────────────────
  enableDeferredTax: boolean;
  deferredTaxRate: number;        // should match BIT rate = 0.30
  depreciationPoolRates: {        // Ethiopian CAT rates per Proc. 979/2016 Art. 25
    cat1: number;                 // 0.25 — computers, software, vehicles
    cat2: number;                 // 0.20 — plant & machinery
    cat3: number;                 // 0.15 — buildings used in business
    cat4: number;                 // 0.10 — other fixed assets
  };

  // ── Materiality & Rounding ────────────────────────────────────────────────
  materialityThresholdEtb: number;
  roundingMethod: 'HALF_UP' | 'HALF_EVEN';

  // ── Integration Flags ────────────────────────────────────────────────────
  etaxAutoSubmit: boolean;        // push eTax payloads automatically
  srmIntegrated: boolean;         // IoT-connected EFD device
  cbeReconciliation: boolean;     // CBE bank feed reconciliation
}

/** Build a default CompanyTaxProfile from minimal onboarding data. */
export function buildDefaultTaxProfile(
  companyId: string,
  tin: string,
  annualTurnoverEtb: number,
  sector: EthiopianSector,
  isPublicInterestEntity = false,
): CompanyTaxProfile {
  const isVatRegistered  = annualTurnoverEtb >= 2_000_000;
  const isTotApplicable  = !isVatRegistered;
  const vatTotBand: 'A' | 'B' | 'C' =
    annualTurnoverEtb >= 2_000_000 ? 'A' :
    annualTurnoverEtb >= 500_000   ? 'B' : 'C';
  const incomeTaxSchedule: 'A' | 'B' | 'C' =
    annualTurnoverEtb >= 1_000_000 ? 'A' :
    annualTurnoverEtb >= 500_000   ? 'B' : 'C';

  // Apply sector exemptions from TAX_RULE_OVERRIDES
  const exempted = (code: TaxTypeCode): boolean =>
    TAX_RULE_OVERRIDES.some(o => o.sector === sector && o.taxCode === code && o.exempt);

  return {
    companyId, tin,
    vatNumber: isVatRegistered ? '' : undefined,
    aabéFramework: isPublicInterestEntity ? 'FULL_IFRS'
      : annualTurnoverEtb >= 5_000_000 ? 'IFRS_FOR_SMES'
      : annualTurnoverEtb >= 500_000   ? 'EFRS_SMALL' : 'EFRS_MICRO',
    isPublicInterestEntity,
    annualTurnoverEtb,
    sector,
    entityType: 'PLC',
    vatTotBand,
    incomeTaxSchedule,
    isVatRegistered,
    isTotApplicable,
    taxes: {
      vat:          isVatRegistered && !exempted('VAT'),
      tot:          isTotApplicable && !exempted('TOT'),
      bit:          !exempted('BIT'),
      pit:          true,
      whtGoods:     false,
      whtServices:  false,
      whtNr:        false,
      whtRent:      false,
      whtDividend:  false,
      whtInterest:  false,
      drrf:         !exempted('DRRF'),
      pensionEe:    true,
      pensionEr:    true,
      excise:       !exempted('EXCISE'),
      stampDuty:    false,
      propertyTax:  false,
      customsDuty:  false,
      importSurtax: false,
      advanceBit:   false,
      capitalGains: false,
      scheduleD:    false,
    },
    fiscalYearStartMonth: 7,
    vatFilingDay:    30,
    pitFilingDay:    30,
    drrfFilingDay:   15,
    bitDeadlineMonth: 11,
    bitDeadlineDay:   7,
    enableDeferredTax: annualTurnoverEtb >= 5_000_000,
    deferredTaxRate:   0.30,
    depreciationPoolRates: { cat1: 0.25, cat2: 0.20, cat3: 0.15, cat4: 0.10 },
    materialityThresholdEtb: Math.max(500, annualTurnoverEtb * 0.001),
    roundingMethod: 'HALF_UP',
    etaxAutoSubmit:    false,
    srmIntegrated:     false,
    cbeReconciliation: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. RULE-BASED TAX ENGINE
//    Pure functions — no I/O. Used by backend services AND frontend calculators.
// ─────────────────────────────────────────────────────────────────────────────

export interface TaxEngineInput {
  /** Gross transaction amount in ETB */
  amountEtb: number;
  /** Company tax profile */
  profile: CompanyTaxProfile;
  /** Transaction type for TOT / WHT routing */
  transactionType: 'GOODS' | 'SERVICES' | 'CONSTRUCTION_GRAIN_FARM' | 'IMPORT' | 'CONTRACT';
  /** Import CIF value (for customs / surtax / advance BIT) */
  importCifEtb?: number;
  /** Whether the counterparty is non-resident */
  isNonResident?: boolean;
  /** Whether WHT applies (company is a WHT agent) */
  applyWht?: boolean;
  /** Excise category (if excisable goods) */
  exciseCategory?: string;
  /** Whether stamp duty applies (contract transaction) */
  isContract?: boolean;
}

export interface TaxEngineLineItem {
  taxCode: TaxTypeCode;
  label: string;
  rate: number;
  baseAmount: number;
  taxAmount: number;
  direction: 'OUTPUT' | 'INPUT' | 'BOTH';
  glDebitCode: string;
  glCreditCode: string;
  ias12Treatment: IAS12Treatment;
  ifrs18Category: IFRS18Category;
  proclamation: string;
}

export interface TaxEngineResult {
  subtotal: number;
  lines: TaxEngineLineItem[];
  totalOutputTax: number;   // taxes added to invoice (customer pays)
  totalInputTax: number;    // taxes deducted from payment (withheld)
  grossAmount: number;      // subtotal + output taxes
  netPayable: number;       // grossAmount - input taxes (amount customer actually pays)
  vatPayable: number;       // net VAT (output - input VAT credits)
  summary: Record<TaxTypeCode, number>;
}

/**
 * Core rule-based tax engine — resolves which taxes apply, applies overrides,
 * calculates amounts, and returns full GL line data.
 */
export function resolveTaxes(input: TaxEngineInput): TaxEngineResult {
  const { amountEtb, profile, transactionType, isNonResident, applyWht, isContract } = input;
  const lines: TaxEngineLineItem[] = [];
  const summary: Partial<Record<TaxTypeCode, number>> = {};

  const addLine = (code: TaxTypeCode, rate: number, base: number): void => {
    const rule = UNIVERSAL_TAX_RULES[code];
    const taxAmount = Math.round(base * rate * 100) / 100;
    if (taxAmount === 0) return;
    lines.push({
      taxCode: code, label: rule.label, rate, baseAmount: base,
      taxAmount, direction: rule.direction,
      glDebitCode: rule.glDebitCode, glCreditCode: rule.glCreditCode,
      ias12Treatment: rule.ias12Treatment, ifrs18Category: rule.ifrs18Category,
      proclamation: rule.proclamation,
    });
    summary[code] = (summary[code] ?? 0) + taxAmount;
  };

  // Effective rate = universal rate unless company has an override
  const rate = (code: TaxTypeCode): number =>
    profile.rateOverrides?.[code] ?? UNIVERSAL_TAX_RULES[code].rate;

  // ── VAT ──────────────────────────────────────────────────────────────────
  if (profile.taxes.vat) {
    addLine('VAT', rate('VAT'), amountEtb);
  }

  // ── TOT (mutually exclusive with VAT) ────────────────────────────────────
  if (profile.taxes.tot && !profile.taxes.vat) {
    const totRate = transactionType === 'GOODS' || transactionType === 'CONSTRUCTION_GRAIN_FARM'
      ? 0.02 : 0.10;
    addLine('TOT', totRate, amountEtb);
  }

  // ── WHT on goods ────────────────────────────────────────────────────────
  if (profile.taxes.whtGoods && applyWht && transactionType === 'GOODS'
      && amountEtb >= UNIVERSAL_TAX_RULES.WHT_GOODS.thresholdEtb) {
    addLine('WHT_GOODS', rate('WHT_GOODS'), amountEtb);
  }

  // ── WHT on services ─────────────────────────────────────────────────────
  if (profile.taxes.whtServices && applyWht && transactionType === 'SERVICES'
      && amountEtb >= UNIVERSAL_TAX_RULES.WHT_SERVICES.thresholdEtb) {
    const whtCode = isNonResident ? 'WHT_NR' : 'WHT_SERVICES';
    addLine(whtCode, rate(whtCode), amountEtb);
  }

  // ── WHT on rent ─────────────────────────────────────────────────────────
  if (profile.taxes.whtRent && applyWht
      && (transactionType === 'SERVICES') && !isNonResident) {
    // Only if explicitly flagged as rent — caller must set transactionType='SERVICES' + context
    // Handled by WHT_RENT when explicitly requested
  }

  // ── DRRF ─────────────────────────────────────────────────────────────────
  if (profile.taxes.drrf) {
    addLine('DRRF', rate('DRRF'), amountEtb);
  }

  // ── Import chain ────────────────────────────────────────────────────────
  if (transactionType === 'IMPORT' && input.importCifEtb && input.importCifEtb > 0) {
    const cif = input.importCifEtb;
    const customsDuty = cif * 0.05; // default 5%; actual rate from HS code
    if (profile.taxes.customsDuty) addLine('CUSTOMS_DUTY', 0.05, cif);
    if (profile.taxes.importSurtax) {
      const surtaxBase = cif + customsDuty;
      addLine('IMPORT_SURTAX', rate('IMPORT_SURTAX'), surtaxBase);
    }
    if (profile.taxes.advanceBit) addLine('ADVANCE_BIT', rate('ADVANCE_BIT'), cif);
    if (profile.taxes.vat) addLine('VAT', rate('VAT'), cif + customsDuty);
  }

  // ── Stamp duty ───────────────────────────────────────────────────────────
  if (profile.taxes.stampDuty && isContract && amountEtb > 0) {
    const stampBase = amountEtb;
    const rawStamp  = stampBase * rate('STAMP_DUTY');
    const stamp     = Math.max(rawStamp, UNIVERSAL_TAX_RULES.STAMP_DUTY.thresholdEtb);
    lines.push({
      taxCode: 'STAMP_DUTY', label: 'Stamp Duty 1%', rate: rate('STAMP_DUTY'),
      baseAmount: stampBase, taxAmount: stamp,
      direction: 'BOTH',
      glDebitCode:  UNIVERSAL_TAX_RULES.STAMP_DUTY.glDebitCode,
      glCreditCode: UNIVERSAL_TAX_RULES.STAMP_DUTY.glCreditCode,
      ias12Treatment: 'NOT_INCOME_TAX', ifrs18Category: 'OPERATING',
      proclamation: 'Proc. 110/1998',
    });
    summary['STAMP_DUTY'] = stamp;
  }

  // ── Aggregate totals ─────────────────────────────────────────────────────
  const outputLines = lines.filter(l => l.direction === 'OUTPUT' || l.direction === 'BOTH');
  const inputLines  = lines.filter(l => l.direction === 'INPUT');
  const totalOutputTax = outputLines.reduce((s, l) => s + l.taxAmount, 0);
  const totalInputTax  = inputLines.reduce((s, l) => s + l.taxAmount, 0);
  const grossAmount    = Math.round((amountEtb + totalOutputTax) * 100) / 100;
  const netPayable     = Math.round((grossAmount - totalInputTax) * 100) / 100;
  const vatLine        = lines.find(l => l.taxCode === 'VAT');
  const vatPayable     = vatLine ? vatLine.taxAmount : 0;

  return {
    subtotal: amountEtb, lines,
    totalOutputTax: Math.round(totalOutputTax * 100) / 100,
    totalInputTax:  Math.round(totalInputTax  * 100) / 100,
    grossAmount, netPayable, vatPayable,
    summary: summary as Record<TaxTypeCode, number>,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. GL ACCOUNT MASTER — Chart of Accounts (CoA) for Tax Entries
//    Maps every tax type to its canonical GL codes.
//    Aligned to IFRS classification + Ethiopian MoR requirements.
// ─────────────────────────────────────────────────────────────────────────────

export interface GlAccountEntry {
  code: string;
  name: string;
  /** ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE */
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  /** Normal balance: DEBIT increases this account */
  normalBalance: 'DEBIT' | 'CREDIT';
  /** IFRS 18 category for P&L accounts */
  ifrs18Category?: IFRS18Category;
  /** IAS 12 treatment */
  ias12Treatment?: IAS12Treatment;
  description: string;
}

/**
 * Canonical GL account codes used exclusively for tax entries.
 * These codes must exist in Chart of Accounts (Account model) for every company.
 */
export const TAX_GL_ACCOUNTS: GlAccountEntry[] = [
  // ── Assets (Tax Receivables / Prepaid) ────────────────────────────────────
  { code: '1130', name: 'VAT Receivable (Input VAT)',        type: 'ASSET',    normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'Input VAT claimable from MoR; cleared on filing' },
  { code: '1131', name: 'WHT Receivable (Supplier Credit)',  type: 'ASSET',    normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'WHT deducted from company by customers — credit against BIT' },
  { code: '1132', name: 'Advance BIT Prepaid (Imports)',     type: 'ASSET',    normalBalance: 'DEBIT',  ifrs18Category: 'INCOME_TAX', ias12Treatment: 'CURRENT_TAX', description: 'Advance BIT paid at customs; credited against annual BIT' },
  { code: '1133', name: 'Deferred Tax Asset (IAS 12)',       type: 'ASSET',    normalBalance: 'DEBIT',  ifrs18Category: 'INCOME_TAX', ias12Treatment: 'DEFERRED_TAX', description: 'IAS 12 deferred tax asset on deductible temporary differences' },

  // ── Liabilities (Tax Payables) ────────────────────────────────────────────
  { code: '2150', name: 'VAT Payable (Output VAT)',          type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'Output VAT collected from customers; remit to MoR monthly' },
  { code: '2155', name: 'TOT Payable',                       type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'Turnover Tax payable monthly (Category B/C taxpayers)' },
  { code: '2160', name: 'Income Tax Payable (BIT/CIT)',      type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'INCOME_TAX', ias12Treatment: 'CURRENT_TAX', description: 'Annual BIT/CIT payable to MoR; current portion of income tax' },
  { code: '2161', name: 'PAYE / PIT Payable',                type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'INCOME_TAX', ias12Treatment: 'CURRENT_TAX', description: 'Employee PAYE deducted from salaries; remit to MoR monthly' },
  { code: '2162', name: 'WHT Payable to MoR',                type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'WHT withheld from supplier payments; remit to MoR monthly' },
  { code: '2163', name: 'DRRF Levy Payable',                 type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'DRRF quarterly levy; remit by 15th of last month of quarter' },
  { code: '2164', name: 'Pension Payable — Employee',        type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'Employee pension 7% withheld; remit to PFSA monthly' },
  { code: '2165', name: 'Pension Payable — Employer',        type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'Employer pension 11%; IAS 19 accrual; remit to PFSA monthly' },
  { code: '2166', name: 'Excise Tax Payable',                type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'Excise duty on manufactured/imported goods' },
  { code: '2167', name: 'Stamp Duty Payable',                type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'Stamp duty on contracts and instruments' },
  { code: '2168', name: 'Property Tax Payable',              type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'Annual property tax to municipality' },
  { code: '2169', name: 'Customs Duty Payable',              type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING',  description: 'Customs duty; part of IAS 2 inventory cost on clearing' },
  { code: '2170', name: 'Import Surtax / Advance BIT Payable', type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'OPERATING', description: 'Import surtax 10% + advance BIT 3% at customs' },
  { code: '2171', name: 'Capital Gains / Schedule D Payable', type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'INCOME_TAX', ias12Treatment: 'CURRENT_TAX', description: 'CGT 15% and Schedule D withholding taxes' },
  { code: '2175', name: 'Deferred Tax Liability (IAS 12)',   type: 'LIABILITY', normalBalance: 'CREDIT', ifrs18Category: 'INCOME_TAX', ias12Treatment: 'DEFERRED_TAX', description: 'IAS 12 deferred tax liability on taxable temporary differences (e.g. accelerated depreciation)' },

  // ── Expenses (Tax Charges) ────────────────────────────────────────────────
  { code: '5420', name: 'TOT Expense',                       type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'TOT levy — operating cost for Cat B/C taxpayers' },
  { code: '5430', name: 'DRRF Levy Expense',                 type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'DRRF 1% quarterly levy — not income tax (IAS 12.2)' },
  { code: '5440', name: 'Non-Resident Service Expense',      type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'Gross fees to non-resident; WHT deducted before payment' },
  { code: '5450', name: 'Rent Expense',                      type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'Rent payments; WHT 30% deducted for corporate landlords' },
  { code: '5460', name: 'Stamp Duty Expense',                type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'Stamp duty on contracts — operating cost' },
  { code: '5470', name: 'Property Tax Expense',              type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'Annual property tax — operating cost' },
  { code: '5410', name: 'Excise Tax Expense (COGS)',         type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'OPERATING',  description: 'Excise duty — part of COGS for manufacturers/importers' },
  { code: '8100', name: 'Income Tax Expense — Current',      type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'INCOME_TAX', ias12Treatment: 'CURRENT_TAX', description: 'IAS 12.46: current year income tax expense (BIT/CIT)' },
  { code: '8105', name: 'Income Tax Expense — Deferred',     type: 'EXPENSE',  normalBalance: 'DEBIT',  ifrs18Category: 'INCOME_TAX', ias12Treatment: 'DEFERRED_TAX', description: 'IAS 12.46: movement in deferred tax assets/liabilities' },
  { code: '8110', name: 'Capital Gains / Schedule D Expense', type: 'EXPENSE', normalBalance: 'DEBIT',  ifrs18Category: 'INCOME_TAX', ias12Treatment: 'CURRENT_TAX', description: 'CGT and Schedule D tax charges' },
];

/** Quick lookup: GL account by code */
export const TAX_GL_BY_CODE: Record<string, GlAccountEntry> =
  Object.fromEntries(TAX_GL_ACCOUNTS.map(a => [a.code, a]));

// ─────────────────────────────────────────────────────────────────────────────
// 9. RBAC PERMISSION MATRIX FOR TAX OPERATIONS
//    Maps every tax action to the minimum role required.
//    Integrated with the existing ROLE_PERMISSIONS in rbac.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type TaxAction =
  | 'view'          // read-only dashboard and reports
  | 'calculate'     // compute tax amounts (no write)
  | 'create_draft'  // create DRAFT filing
  | 'submit'        // submit to MoR eTax portal
  | 'approve'       // approve filing before submission
  | 'pay'           // mark as paid
  | 'amend'         // amend a previously filed return
  | 'override_rate' // override tax rate (audit-logged)
  | 'configure'     // change company tax profile / settings
  | 'export'        // export to CSV / PDF
  | 'delete_draft'; // delete a DRAFT filing

/**
 * Minimum role level required per action.
 * Matches ROLE_HIERARCHY values in rbac.ts:
 *   SPURADMIN=200, SUPERADMIN=190, DEVELOPER=150, ADMIN=100,
 *   ovds=60, ACCOUNTING=55, IFRS_OFFICER=52, HR=50,
 *   AUDITOR=30, DATA_CLERK=8, EMPLOYEE=10
 */
export const TAX_RBAC_MATRIX: Record<TaxAction, { minLevel: number; description: string }> = {
  view:          { minLevel: 30,  description: 'AUDITOR and above — read-only access to all tax reports' },
  calculate:     { minLevel: 55,  description: 'ACCOUNTING and above — may run tax calculations' },
  create_draft:  { minLevel: 55,  description: 'ACCOUNTING and above — create DRAFT filings' },
  submit:        { minLevel: 60,  description: 'ovds and above — submit to MoR eTax portal' },
  approve:       { minLevel: 60,  description: 'ovds and above — approve filing before eTax submission' },
  pay:           { minLevel: 60,  description: 'ovds and above — mark filings as paid' },
  amend:         { minLevel: 100, description: 'ADMIN and above — amend filed returns (triggers audit log)' },
  override_rate: { minLevel: 190, description: 'SUPERADMIN only — override a tax rate (mandatory audit trail)' },
  configure:     { minLevel: 100, description: 'ADMIN and above — update company tax profile and settings' },
  export:        { minLevel: 30,  description: 'AUDITOR and above — export tax reports to PDF/CSV' },
  delete_draft:  { minLevel: 55,  description: 'ACCOUNTING and above — delete DRAFT (not filed) records' },
};

/** Check if a role level satisfies a tax action. */
export function canPerformTaxAction(roleLevel: number, action: TaxAction): boolean {
  return roleLevel >= TAX_RBAC_MATRIX[action].minLevel;
}

// Per-module permission → TaxAction mapping (integrates with ROUTE_POLICY)
export const TAX_PERMISSION_MAP: Record<string, TaxAction[]> = {
  'vat:read':      ['view', 'export'],
  'vat:write':     ['calculate', 'create_draft'],
  'vat:calculate': ['calculate'],
  'vat:file':      ['submit', 'approve', 'pay'],
  'vat:delete':    ['delete_draft'],
  'vat:export':    ['export'],
  'bit:read':      ['view', 'export'],
  'bit:write':     ['calculate', 'create_draft'],
  'bit:file':      ['submit', 'approve', 'pay'],
  'disaster_fund:read':  ['view'],
  'disaster_fund:write': ['calculate', 'create_draft', 'submit'],
  'etax:submit':   ['submit', 'approve', 'pay', 'amend'],
  'settings:write': ['configure'],
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. FILING CALENDAR — next deadline computer
//     Returns upcoming filing deadlines for a given company profile and date.
// ─────────────────────────────────────────────────────────────────────────────

export interface FilingDeadline {
  taxCode: TaxTypeCode;
  label: string;
  dueDate: Date;
  portal: MoRPortal;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  daysUntilDue: number;
  overdue: boolean;
}

/**
 * Compute all upcoming (or overdue) filing deadlines for the next 90 days.
 * Returns sorted by dueDate ascending.
 */
export function getUpcomingDeadlines(
  profile: CompanyTaxProfile,
  today: Date = new Date(),
): FilingDeadline[] {
  const deadlines: FilingDeadline[] = [];
  const add = (code: TaxTypeCode, due: Date): void => {
    if (!profile.taxes[taxCodeToProfileKey(code)]) return;
    const rule = UNIVERSAL_TAX_RULES[code];
    const diffMs = due.getTime() - today.getTime();
    const daysUntilDue = Math.ceil(diffMs / 86_400_000);
    if (daysUntilDue > 90) return; // only show next 90 days
    deadlines.push({
      taxCode: code,
      label: rule.label,
      dueDate: due,
      portal: rule.portal,
      severity: daysUntilDue < 0 ? 'CRITICAL' : daysUntilDue <= 7 ? 'WARNING' : 'INFO',
      daysUntilDue,
      overdue: daysUntilDue < 0,
    });
  };

  const y = today.getFullYear();
  const m = today.getMonth(); // 0-indexed

  // Monthly obligations — 30th of following month
  const nextMonthly = new Date(y, m + 1, 30);
  if (profile.taxes.vat)         add('VAT',          nextMonthly);
  if (profile.taxes.tot)         add('TOT',          nextMonthly);
  if (profile.taxes.pit)         add('PIT',          nextMonthly);
  if (profile.taxes.whtGoods)    add('WHT_GOODS',    nextMonthly);
  if (profile.taxes.whtServices) add('WHT_SERVICES', nextMonthly);
  if (profile.taxes.pensionEe)   add('PENSION_EE',   nextMonthly);
  if (profile.taxes.pensionEr)   add('PENSION_ER',   nextMonthly);

  // DRRF — 15th of last month of current Ethiopian quarter
  const drrfQuarterEnds = [2, 5, 8, 11]; // Mar, Jun, Sep, Dec (0-indexed)
  const nextQEnd = drrfQuarterEnds.find(q => q >= m) ?? 11;
  const drrfDue = new Date(nextQEnd < m ? y + 1 : y, nextQEnd, 15);
  if (profile.taxes.drrf) add('DRRF', drrfDue);

  // BIT — November 7 of following EFY
  const efyEndMonth = 6; // July (0-indexed)
  const bitYear = m >= efyEndMonth ? y + 1 : y;
  const bitDue = new Date(bitYear, 10, 7); // November 7
  if (profile.taxes.bit) add('BIT', bitDue);

  return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/** Map TaxTypeCode to CompanyTaxProfile.taxes key */
function taxCodeToProfileKey(code: TaxTypeCode): keyof CompanyTaxProfile['taxes'] {
  const map: Partial<Record<TaxTypeCode, keyof CompanyTaxProfile['taxes']>> = {
    VAT: 'vat', TOT: 'tot', BIT: 'bit', PIT: 'pit',
    WHT_GOODS: 'whtGoods', WHT_SERVICES: 'whtServices',
    WHT_NR: 'whtNr', WHT_RENT: 'whtRent',
    WHT_DIVIDEND: 'whtDividend', WHT_INTEREST: 'whtInterest',
    DRRF: 'drrf', PENSION_EE: 'pensionEe', PENSION_ER: 'pensionEr',
    EXCISE: 'excise', STAMP_DUTY: 'stampDuty',
    PROPERTY_TAX: 'propertyTax', CUSTOMS_DUTY: 'customsDuty',
    IMPORT_SURTAX: 'importSurtax', ADVANCE_BIT: 'advanceBit',
    CAPITAL_GAINS: 'capitalGains', SCHEDULE_D: 'scheduleD',
  };
  return map[code] ?? 'vat';
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. IAS 12 DEFERRED TAX HELPERS
//     Temporary differences between IFRS carrying amount and Ethiopian tax base.
// ─────────────────────────────────────────────────────────────────────────────

export interface DeferredTaxItem {
  description: string;
  ifrsCarryingAmount: number;
  taxBase: number;
  temporaryDifference: number;
  /** TAXABLE = DTL; DEDUCTIBLE = DTA */
  type: 'TAXABLE' | 'DEDUCTIBLE';
  deferredTaxAmount: number;
  ias12Reference: string;
}

/**
 * IAS 12 deferred tax on PPE — pool depreciation vs. IFRS straight-line.
 *
 * Ethiopian pool rates (Proc. 979/2016 Art. 25):
 *   CAT1: computers/software/vehicles = 25%
 *   CAT2: plant & machinery = 20%
 *   CAT3: business buildings = 15%
 *   CAT4: other fixed assets = 10%
 */
export function calcDeferredTaxPPE(
  ifrsNBV: number,
  taxPoolBalance: number,
  taxRate: number = 0.30,
): DeferredTaxItem {
  const diff = ifrsNBV - taxPoolBalance;
  return {
    description: 'PPE — IFRS carrying amount vs. Ethiopian pool depreciation (Proc. 979/2016)',
    ifrsCarryingAmount: ifrsNBV,
    taxBase: taxPoolBalance,
    temporaryDifference: Math.abs(diff),
    type: diff > 0 ? 'TAXABLE' : 'DEDUCTIBLE',
    deferredTaxAmount: Math.round(Math.abs(diff) * taxRate * 100) / 100,
    ias12Reference: 'IAS 12.15–12.20 (taxable temporary difference on PPE)',
  };
}

/**
 * IAS 12 deferred tax on ECL provisions (IFRS 9).
 * ECL provisions are NOT deductible until the debtor is legally exhausted.
 * => Deductible temporary difference => Deferred Tax Asset.
 */
export function calcDeferredTaxECL(
  eclProvisionAmount: number,
  taxRate: number = 0.30,
): DeferredTaxItem {
  return {
    description: 'ECL Provision (IFRS 9) — deductible only when legally uncollectable',
    ifrsCarryingAmount: 0,
    taxBase: eclProvisionAmount,
    temporaryDifference: eclProvisionAmount,
    type: 'DEDUCTIBLE',
    deferredTaxAmount: Math.round(eclProvisionAmount * taxRate * 100) / 100,
    ias12Reference: 'IAS 12.26 (deductible temporary difference — ECL provision)',
  };
}

/**
 * IAS 12.81 reconciliation — reconcile effective rate to 30% statutory rate.
 * Returns line items explaining the difference.
 */
export interface IAS12Reconciliation {
  accountingProfit: number;
  statutoryRate: number;
  expectedTax: number;
  actualTax: number;
  effectiveRate: number;
  items: Array<{ description: string; amount: number }>;
}

export function buildIAS12Reconciliation(
  accountingProfit: number,
  actualTax: number,
  nonDeductibleExpenses: number = 0,
  exemptIncome: number = 0,
  matAdjustment: number = 0,
): IAS12Reconciliation {
  const rate        = 0.30;
  const expectedTax = Math.round(accountingProfit * rate * 100) / 100;
  const items: Array<{ description: string; amount: number }> = [];

  if (nonDeductibleExpenses !== 0)
    items.push({ description: 'Tax effect of non-deductible expenses', amount: Math.round(nonDeductibleExpenses * rate * 100) / 100 });
  if (exemptIncome !== 0)
    items.push({ description: 'Tax effect of exempt income', amount: -Math.round(exemptIncome * rate * 100) / 100 });
  if (matAdjustment !== 0)
    items.push({ description: 'Minimum Alternative Tax adjustment (2.5% of turnover)', amount: matAdjustment });

  return {
    accountingProfit,
    statutoryRate: rate,
    expectedTax,
    actualTax,
    effectiveRate: accountingProfit > 0 ? actualTax / accountingProfit : 0,
    items,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. SYSTEM SETTINGS SEED MAP
//     Keys match the `systemsetting` table (key/value pairs).
//     These are the canonical setting names every service must use.
// ─────────────────────────────────────────────────────────────────────────────

export const TAX_SYSTEM_SETTINGS_SCHEMA: Record<string, {
  defaultValue: string;
  description: string;
  overridable: boolean;
}> = {
  // VAT
  vat_rate:                   { defaultValue: '15',       overridable: false, description: 'VAT rate % — Proc. 1341/2024 (fixed at 15%)' },
  vat_threshold:              { defaultValue: '2000000',  overridable: false, description: 'Annual turnover ETB threshold for mandatory VAT registration' },
  // TOT
  tot_goods_rate:             { defaultValue: '2',        overridable: false, description: 'TOT rate % on goods (Proc. 1395/2025)' },
  tot_services_rate:          { defaultValue: '10',       overridable: false, description: 'TOT rate % on general services' },
  tot_construction_rate:      { defaultValue: '2',        overridable: false, description: 'TOT rate % on construction/grain/farm' },
  // BIT
  bit_rate:                   { defaultValue: '30',       overridable: false, description: 'Corporate income tax flat rate %' },
  mat_rate:                   { defaultValue: '2.5',      overridable: false, description: 'Minimum Alternative Tax rate % of gross turnover' },
  bit_loss_carryforward_years:{ defaultValue: '5',        overridable: false, description: 'Max years to carry forward BIT losses' },
  // PIT
  pit_monthly_exemption:      { defaultValue: '2000',     overridable: false, description: 'Monthly PIT exemption in ETB — Proc. 1395/2025 (raised from 600 to 2000)' },
  pit_top_bracket_rate:       { defaultValue: '35',       overridable: false, description: 'PIT top marginal rate %' },
  // WHT
  wht_goods_rate:             { defaultValue: '3',        overridable: false, description: 'WHT on goods % — Proc. 1395/2025' },
  wht_goods_threshold:        { defaultValue: '10000',    overridable: false, description: 'Min ETB goods payment for WHT to apply' },
  wht_service_rate:           { defaultValue: '3',        overridable: false, description: 'WHT on domestic services %' },
  wht_service_threshold:      { defaultValue: '500',       overridable: false, description: 'Min ETB service payment for WHT to apply — Proc. 1395/2025 Art. 94' },
  wht_nr_rate:                { defaultValue: '15',       overridable: false, description: 'WHT on non-resident services %' },
  wht_rent_rate:              { defaultValue: '30',       overridable: false, description: 'WHT on corporate rent payments %' },
  wht_dividend_rate:          { defaultValue: '15',       overridable: false, description: 'WHT on dividend payments %' },
  wht_interest_rate:          { defaultValue: '10',       overridable: false, description: 'WHT on interest (standard) %' },
  // DRRF
  drrf_rate:                  { defaultValue: '1',        overridable: false, description: 'DRRF levy base rate %' },
  drrf_service_rate:          { defaultValue: '5',        overridable: false, description: 'DRRF levy on service fees/airtime/fuel/ticket sales %' },
  // Pension
  pension_employee_rate:      { defaultValue: '7',        overridable: false, description: 'Employee pension contribution % of insurable earnings' },
  pension_employer_rate:      { defaultValue: '11',       overridable: false, description: 'Employer pension contribution % of insurable earnings' },
  pension_cap_etb:            { defaultValue: '15000',    overridable: false, description: 'Monthly insurable earnings cap in ETB' },
  // Excise
  excise_cigarettes_rate:     { defaultValue: '150',      overridable: false, description: 'Excise % on cigarettes' },
  excise_spirits_rate:        { defaultValue: '75',       overridable: false, description: 'Excise % on spirits' },
  excise_beer_wine_rate:      { defaultValue: '50',       overridable: false, description: 'Excise % on beer and wine' },
  excise_soft_drinks_rate:    { defaultValue: '30',       overridable: false, description: 'Excise % on soft drinks' },
  excise_vehicles_gt1800_rate:{ defaultValue: '100',      overridable: false, description: 'Excise % on vehicles >1800cc' },
  excise_fuel_petrol_etb_l:   { defaultValue: '2.89',     overridable: false, description: 'Excise ETB per litre — petrol' },
  excise_fuel_diesel_etb_l:   { defaultValue: '1.86',     overridable: false, description: 'Excise ETB per litre — diesel' },
  // Stamp Duty
  stamp_duty_rate:            { defaultValue: '1',        overridable: false, description: 'Stamp duty % of contract value' },
  stamp_duty_min_etb:         { defaultValue: '500',      overridable: false, description: 'Minimum stamp duty in ETB' },
  // Import
  import_surtax_rate:         { defaultValue: '10',       overridable: false, description: 'Import surtax % of (CIF + duty + excise)' },
  advance_bit_import_rate:    { defaultValue: '3',        overridable: false, description: 'Advance BIT % of CIF on imports' },
  // Capital gains / Schedule D
  capital_gains_rate:         { defaultValue: '15',       overridable: false, description: 'Capital gains tax rate %' },
  schedule_d_dividend_rate:   { defaultValue: '15',       overridable: false, description: 'Schedule D dividend WHT %' },
  schedule_d_royalty_tech_rate: { defaultValue: '10',     overridable: false, description: 'Royalty (technical/industrial) WHT %' },
  schedule_d_royalty_art_rate:  { defaultValue: '5',      overridable: false, description: 'Royalty (artistic) WHT %' },
  // Fiscal calendar
  fiscal_year_start:          { defaultValue: '7',        overridable: true,  description: 'Fiscal year start month (7=July for EFY)' },
  default_currency:           { defaultValue: 'ETB',      overridable: false, description: 'Functional currency code' },
  // IAS 12 / Deferred Tax
  deferred_tax_enabled:       { defaultValue: 'false',    overridable: true,  description: 'Enable IAS 12 deferred tax computation' },
  pool_depreciation_cat1:     { defaultValue: '25',       overridable: false, description: 'Pool depreciation CAT 1 % (computers/vehicles)' },
  pool_depreciation_cat2:     { defaultValue: '20',       overridable: false, description: 'Pool depreciation CAT 2 % (plant & machinery)' },
  pool_depreciation_cat3:     { defaultValue: '15',       overridable: false, description: 'Pool depreciation CAT 3 % (buildings)' },
  pool_depreciation_cat4:     { defaultValue: '10',       overridable: false, description: 'Pool depreciation CAT 4 % (other assets)' },
  // Invoice flags
  invoice_vat_enabled:        { defaultValue: 'true',     overridable: true,  description: 'Show VAT on invoices' },
  invoice_drrf_enabled:       { defaultValue: 'false',    overridable: true,  description: 'Show DRRF on invoices' },
  invoice_wht_enabled:        { defaultValue: 'false',    overridable: true,  description: 'Enable WHT deduction on bills' },
  invoice_tot_enabled:        { defaultValue: 'false',    overridable: true,  description: 'Show TOT on invoices (if not VAT registered)' },
  invoice_require_tin:        { defaultValue: 'false',    overridable: true,  description: 'Require customer TIN on invoices' },
  invoice_stamp_duty_prompt:  { defaultValue: 'false',    overridable: true,  description: 'Prompt for stamp duty on contract invoices' },
  invoice_show_qr:            { defaultValue: 'true',     overridable: true,  description: 'Show QR code on invoice PDF' },
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. EXPORTS — re-export everything from one entry point
// ─────────────────────────────────────────────────────────────────────────────

export {
  // already exported inline above — this block serves as the API contract
};

/**
 * Convenience: get the effective rate for a tax code, respecting overrides.
 */
export function getEffectiveTaxRate(
  code: TaxTypeCode,
  profile?: Pick<CompanyTaxProfile, 'rateOverrides'>,
): number {
  return profile?.rateOverrides?.[code] ?? UNIVERSAL_TAX_RULES[code].rate;
}

/**
 * Validate that a company tax profile is internally consistent.
 * Returns an array of error strings (empty = valid).
 */
export function validateTaxProfile(profile: CompanyTaxProfile): string[] {
  const errors: string[] = [];
  if (profile.taxes.vat && profile.taxes.tot)
    errors.push('VAT and TOT cannot both be active — they are mutually exclusive (Proc. 1341/2024 + 1395/2025)');
  if (profile.isVatRegistered && !profile.vatNumber)
    errors.push('VAT-registered company must have a vatNumber (VAT registration certificate)');
  if (profile.taxes.bit && !profile.tin)
    errors.push('TIN is required for BIT filing');
  if (profile.deferredTaxRate !== 0.30 && profile.enableDeferredTax)
    errors.push('Deferred tax rate should match CIT rate of 30% (IAS 12.47)');
  if (profile.depreciationPoolRates.cat1 !== 0.25)
    errors.push('CAT 1 pool rate must be 25% per Proc. 979/2016 Art. 25');
  return errors;
}
