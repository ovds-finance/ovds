/**
 * System-wide constants for the OVDS monorepo.
 * Shared between frontend (React) and backend (NestJS).
 */

// -- App Identity --------------------------------------------------------------
export const APP_NAME    = 'OVDS';
export const APP_VERSION = '1.0.0';
export const API_VERSION = 'v1';
export const API_PREFIX  = '/api';

// -- Brand Colors (mirrors design-system tokens for non-Tailwind contexts) -----
export const BRAND = {
  primary:      '#00E784',
  primaryDark:  '#00C96E',
  primaryLight: '#6EFFC0',
  sidebar:      '#1e293b',
  danger:       '#dc2626',
  warning:      '#d97706',
  info:         '#0284c7',
  success:      '#00C96E',
  textMain:     '#333333',
  textMuted:    '#64748b',
  surface:      '#ffffff',
  border:       '#e2e8f0',
} as const;

// -- Ethiopian Tax Constants (Proclamation No. 1395/2025) ----------------------
export const ETH_TAX = {
  // -- VAT -------------------------------------------------------------------
  VAT_RATE:              0.15,   // 15% standard VAT (Proc. 1341/2024)
  VAT_REGISTRATION_THRESHOLD: 2_000_000, // ETB 2M/year (Regulation No. 570/2025)

  // -- Withholding Tax (Proc. 1395/2025) -------------------------------------
  // Canonical Procurement & AP rule: 3% WHT on domestic supplier payments
  // exceeding ETB 10,000 (goods) or ETB 500 (services). Raised from 2% to 3%
  // by the Federal Income Tax (Amendment) Proclamation No. 1395/2025 Art. 94.
  // Generated automatically on eligible payments and remitted to the MoR with
  // a printed certificate.
  WHT_IMPORT_RATE:       0.03,   // 3% withholding on imports
  WHT_SERVICE_RATE:      0.03,   // 3% on domestic services ≥ ETB 500
  WHT_GOODS_RATE:        0.03,   // 3% on domestic goods ≥ ETB 10,000
  WHT_GOVERNMENT_RATE:   0.30,   // 30% on government contract payments
  WHT_DIVIDEND_RATE:     0.15,   // 15% dividend WHT (Proc. 1395/2025 Art. 52)
  WHT_INTEREST_RATE:     0.10,   // 10% standard interest WHT
  WHT_INTEREST_FI_RATE:  0.30,   // 30% interest — financial institutions/credit sales
  WHT_ROYALTY_ARTISTIC:  0.05,   // 5%  royalties on artistic/cultural works
  WHT_ROYALTY_TECHNICAL: 0.10,   // 10% royalties on technical/industrial/copyright
  WHT_MGMT_FEES_NR:      0.15,   // 15% management fees — non-resident
  WHT_TECH_FEES_NR:      0.15,   // 15% technical fees — non-resident
  WHT_SERVICE_NR_RATE:   0.15,   // 15% non-resident services (general)
  WHT_SERVICE_THRESHOLD: 500,    // ETB 500 minimum for service WHT
  WHT_GOODS_THRESHOLD:   10_000, // ETB 10,000 minimum for goods WHT

  // -- Schedule D flat rates (Proc. 1395/2025) -------------------------------
  CAPITAL_GAINS_RATE:    0.15,   // 15% on disposal of shares, bonds, buildings
  GAMES_OF_CHANCE_RATE:  0.20,   // 20% on lottery/tombola winnings
  REPATRIATED_PROFIT_RATE: 0.15, // 15% on branch profits repatriated abroad
  UNDISTRIBUTED_PROFIT_RATE: 0.15, // 15% on undistributed profits
  DIGITAL_CONTENT_RATE:  0.15,   // 15% on digital content creator income

  // -- Turnover Tax (TOT) — Category C taxpayers ----------------------------
  TOT_GOODS_RATE:        0.02,   // 2% on locally sold goods
  TOT_CONSTRUCTION_RATE: 0.02,   // 2% on construction contractors, grain mills, farm machinery
  TOT_SERVICES_RATE:     0.10,   // 10% on all other general services
  TOT_THRESHOLD_ETB:     500_000, // Annual turnover below which TOT applies (VAT < 2M)

  // -- Business Income Tax (BIT / CIT) ----------------------------------------
  BIT_MAX_RATE:          0.30,   // 30% flat on corporate taxable profit (Proc. 979/2016)
  MAT_RATE:              0.025,  // 2.5% Minimum Alternative Tax on turnover
  CAT_A_THRESHOLD:       1_000_000, // ETB 1M annual turnover → mandatory VAT + BIT (Proc. 1395/2025)

  // -- Expense deductibility: electronic settlement cap ----------------------
  // Any single business-to-business payment above ETB 50,000 must be settled
  // electronically or by cheque to remain a deductible expense. Cash-settled
  // payments above this cap are added back as non-deductible during a MoR
  // audit, so the expense must carry a payment/cheque reference.
  CASH_PAYMENT_DEDUCTION_CAP: 50_000,
  /** Payment modes that satisfy the electronic-settlement requirement above the cap. */
  ELECTRONIC_SETTLEMENT_MODES: [
    'CHEQUE',
    'CPO',
    'Local Bank Transfer',
    'SWIFT',
    'Wire Transfer',
    'Letter of Credit',
    'Card',
  ],

  // -- Rental Income Tax (Schedule B) ----------------------------------------
  CORPORATE_RENTAL_RATE: 0.30,   // 30% flat for entities/bodies on rental income

  // -- Import & Customs -------------------------------------------------------
  IMPORT_SURTAX_RATE:    0.10,   // 10% import surtax on CIF + Customs Duty + Excise
  CUSTOMS_DUTY_MIN:      0.00,   // Minimum customs tariff (exempt)
  CUSTOMS_DUTY_MAX:      0.35,   // Maximum customs tariff (35%)

  // -- Excise Tax (Proc. 1186/2020 + Amend. 1239/2021) -----------------------
  EXCISE_RATE_MIN:       0.05,   // 5% minimum
  EXCISE_RATE_MAX:       5.00,   // 500% maximum (cigarettes)
  EXCISE_RATES: {
    ALCOHOL:              0.15,
    TOBACCO:              0.20,
    AUTOMOBILE_GT_1800CC: 0.55,
    AUTOMOBILE_LT_1800CC: 0.47,
    AUTOMOBILE_ELECTRIC:  0.25,
    JEWELRY:              0.30,
    YACHT:                0.35,
    PRIVATE_AIRCRAFT:     0.50,
    FIREARMS:             0.40,
    SUGAR_SWEETENED:      0.10,
    ENERGY_DRINK:         0.175,
    PLASTIC:              0.05,
  },

  // -- Stamp Duty (Proc. 110/1998) -------------------------------------------
  STAMP_DUTY_MIN:        500,    // ETB 500 minimum on legal contracts

  // -- DRRF (Disaster Risk Response Fund) ------------------------------------
  DRRF_RATE:             0.01,   // 1% levy

  // -- Payroll / Pension ------------------------------------------------------
  PENSION_EMPLOYEE:      0.07,   // 7% employee contribution
  PENSION_EMPLOYER:      0.11,   // 11% employer contribution
  PENSION_CAP_ETB:       15_000, // ETB 15,000 insurable earnings cap

  // -- Misc -------------------------------------------------------------------
  CURRENCY:              'ETB',
  FISCAL_YEAR_START:     7,      // Ethiopian fiscal year starts July (Hamle)

  // -- Graduate Tax (Higher Education Cost Sharing — Reg. 154/2008) ----------
  GRADUATE_TAX_MIN_RATE:    0.10,   // ≥10% of monthly income
  GRADUATE_TAX_BOARDING_PCT: 1.00,  // 100% of boarding/lodging costs
  GRADUATE_TAX_TUITION_MIN:  0.15,  // Minimum 15% of tuition-related costs

  // -- Import & Advance BIT (Schedule C — Proc. 979/2016) --------------------
  ADVANCE_BIT_RATE:          0.03,  // 3% of CIF value for Schedule C importers
  COMESA_RATE_REDUCTION:     0.10,  // 10% reduction from standard customs duty

  // -- Transfer Pricing (Directive 2015) -------------------------------------
  TP_DOCUMENTATION_THRESHOLD: 500_000, // ETB 500,000 annual TP documentation threshold

  // -- Tax Dispute Deposits (Proc. 983/2016 s.27) ----------------------------
  TAC_DEPOSIT_PCT:    0.50,  // 50% of disputed tax required for TAC appeal
  HIGH_COURT_DEPOSIT_PCT: 0.75,  // 75% required for Federal High Court appeal

  // -- Thin Capitalisation (Proc. 979/2016 s.20.3) ---------------------------
  THIN_CAP_RATIO:     2.0,   // Debt:equity ratio threshold (2:1)

  // -- Foreign Tax Credit (Proc. 979/2016 s.20.1) ----------------------------
  FOREIGN_CREDIT_YEARS: 2,   // Must be paid within 2 years of year-end

  // -- Tax Loss Carry Forward (Proc. 979/2016 s.25) --------------------------
  LOSS_CARRY_FORWARD_YEARS: 5,    // Maximum 5 tax years
  LOSS_CONSECUTIVE_MAX:     2,    // Disallowed after 2 consecutive loss years
} as const;

// -- PIT Brackets (Proclamation No. 1395/2025 — effective July 7, 2025) --------
// Tax-free threshold raised from ETB 600 → ETB 2,000
// 6 brackets (reduced from 7); top rate 35% applies above ETB 14,000
export const PIT_BRACKETS_2025 = [
  { min: 0,       max: 2_000,  rate: 0,    deduction: 0 },
  { min: 2_001,   max: 4_000,  rate: 0.15, deduction: 300 },
  { min: 4_001,   max: 7_000,  rate: 0.20, deduction: 500 },
  { min: 7_001,   max: 10_000, rate: 0.25, deduction: 850 },
  { min: 10_001,  max: 14_000, rate: 0.30, deduction: 1_350 },
  { min: 14_001,  max: Infinity, rate: 0.35, deduction: 2_050 },
] as const;

export const PIT_BRACKETS_2016 = [
  { min: 0,       max: 600,    rate: 0,    deduction: 0 },
  { min: 601,     max: 1_650,  rate: 0.10, deduction: 60 },
  { min: 1_651,   max: 3_200,  rate: 0.15, deduction: 142.50 },
  { min: 3_201,   max: 5_250,  rate: 0.20, deduction: 302.50 },
  { min: 5_251,   max: 7_800,  rate: 0.25, deduction: 565 },
  { min: 7_801,   max: 10_900, rate: 0.30, deduction: 955 },
  { min: 10_901,  max: Infinity, rate: 0.35, deduction: 1_500 },
] as const;

export const PIT_BRACKETS = PIT_BRACKETS_2025;

export type PitBracketSet = typeof PIT_BRACKETS_2025 | typeof PIT_BRACKETS_2016;

// -- PAYE / Employment Income Tax (PIT) calculator ----------------------------
// Proclamation No. 1395/2025 — progressive monthly brackets (see PIT_BRACKETS).
// Employee pension (7%) and employer pension (11%) are capped at the
// ETB 15,000 insurable-earnings limit; taxable income = gross − employee pension.

export interface PITResult {
  grossSalary: number;
  pensionEmployee: number;
  taxableIncome: number;
  incomeTax: number;
  pensionEmployer: number;
  drrf: number;
  netSalary: number;
  effectiveRate: number;
}

/** CamelCase alias consumed by frontend / ui packages. */
export type PitResult = PITResult;

/**
 * Compute Ethiopian Pay-As-You-Earn (PAYE) for a single employee.
 * @param grossSalary           Monthly gross earnings (ETB)
 * @param pensionRate          Employee pension rate (default 7% — Proc. 1268/2023)
 * @param employerPensionRate  Employer pension rate (default 11%)
 * @param brackets             Optional bracket set (defaults to PIT_BRACKETS)
 */
export function calculatePIT(
  grossSalary: number,
  pensionRate: number = ETH_TAX.PENSION_EMPLOYEE,
  employerPensionRate: number = ETH_TAX.PENSION_EMPLOYER,
  brackets: PitBracketSet = PIT_BRACKETS,
): PITResult {
  const insurableEarnings = Math.min(grossSalary, ETH_TAX.PENSION_CAP_ETB);
  const pensionEmployee = Math.round(insurableEarnings * pensionRate * 100) / 100;
  const taxableIncome = Math.round(Math.max(0, grossSalary - pensionEmployee) * 100) / 100;

  let rawIncomeTax = 0;
  for (let i = brackets.length - 1; i >= 0; i--) {
    const b = brackets[i];
    if (taxableIncome >= b.min) {
      rawIncomeTax = Math.max(0, taxableIncome * b.rate - b.deduction);
      break;
    }
  }
  const incomeTax = Math.round(rawIncomeTax * 100) / 100;
  const pensionEmployer = Math.round(insurableEarnings * employerPensionRate * 100) / 100;
  const drrf = Math.round(grossSalary * ETH_TAX.DRRF_RATE * 100) / 100;
  const netSalary = Math.round((grossSalary - pensionEmployee - incomeTax - drrf) * 100) / 100;
  const effectiveRate = grossSalary > 0 ? incomeTax / grossSalary : 0;

  return {
    grossSalary: Math.round(grossSalary * 100) / 100,
    pensionEmployee,
    taxableIncome,
    incomeTax,
    pensionEmployer,
    drrf,
    netSalary,
    effectiveRate,
  };
}

// -- Pagination Defaults -------------------------------------------------------
export const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     200,
} as const;

// -- Business Type → Allowed Modules mapping -----------------------------------
export const BUSINESS_MODULE_MAP: Record<string, string[]> = {
  MANUFACTURING:     ['hr', 'payroll', 'inventory', 'ovds', 'tax', 'reports'],
  LARGE_ENTERPRISE:  ['hr', 'payroll', 'inventory', 'ovds', 'tax', 'crm', 'reports', 'audit', 'ifrs'],
  MEDIUM_ENTERPRISE: ['hr', 'payroll', 'ovds', 'tax', 'crm', 'reports'],
  SMALL_BUSINESS:    ['hr', 'ovds', 'tax', 'reports'],
  FREELANCER:        ['ovds', 'tax', 'reports'],
  GOVERNMENT:        ['hr', 'payroll', 'ovds', 'tax', 'reports', 'audit'],
  RETAIL:            ['hr', 'inventory', 'ovds', 'tax', 'crm', 'reports'],
  WHOLESALE:         ['hr', 'inventory', 'ovds', 'tax', 'crm', 'reports'],
  SERVICE:           ['hr', 'payroll', 'ovds', 'tax', 'crm', 'reports'],
  NGO:               ['hr', 'payroll', 'ovds', 'reports'],
};

// -- Date / Time ---------------------------------------------------------------
export const DATE_FORMAT    = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const DISPLAY_DATE   = 'dd MMM yyyy';

// -- File Upload ---------------------------------------------------------------
export const UPLOAD = {
  MAX_SIZE_MB:    10,
  ALLOWED_IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCS:   ['application/pdf', 'text/csv', 'application/vnd.ms-excel',
                   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
} as const;

// -- Cache TTLs (seconds) ------------------------------------------------------
export const CACHE_TTL = {
  SHORT:   30,
  MEDIUM:  300,
  LONG:    3_600,
  DAY:     86_400,
} as const;

// -- WebSocket Events ----------------------------------------------------------
export const WS_EVENTS = {
  ATTENDANCE_UPDATE:  'attendance:update',
  NOTIFICATION_NEW:   'notification:new',
  PAYROLL_GENERATED:  'payroll:generated',
  INVOICE_PAID:       'invoice:paid',
  DASHBOARD_REFRESH:  'dashboard:refresh',
  PRESENCE_UPDATE:    'presence:update',
} as const;

// ── Ethiopian Ministry of Revenues (MoR) — Portal URLs & Authority Info ───────
// ERCA was officially restructured as the Ministry of Revenues (MoR).
// All domestic tax and customs obligations are administered under MoR.

export const MOR_PORTALS = {
  /** Ministry of Revenue Online e-Tax — domestic tax filings and taxpayer accounts */
  ETAX: {
    label:       'MoR Online e-Tax',
    url:         'https://etax.erca.gov.et',
    api:         'https://api.etax.erca.gov.et',
    description: 'VAT, PAYE, WHT, BIT, TOT, DRRF — all domestic tax declarations',
  },
  /** Tax Administration Support System — SRM management, vehicle verification, declarations */
  TASS: {
    label:       'Tax Administration Support System (TASS)',
    url:         'https://tass.mor.gov.et',
    description: 'Sales device (SRM/EFD) registration, vehicle tax verification, declaration submission',
  },
  /** Ethiopia Customs Trade Portal — e-SADs, e-Manifests, tariff engine, tax simulator */
  CUSTOMS: {
    label:       'Ethiopia Customs Trade Portal',
    url:         'https://trade.gov.et',
    api:         'https://api.trade.gov.et',
    description: 'e-SADs, e-Manifests, HS Tariff search, Import Tax Simulator, ASYCUDA World',
  },
  /** Ministry of Revenue Official Site */
  MOR_OFFICIAL: {
    label:       'Ministry of Revenue Official Site',
    url:         'https://www.mor.gov.et',
    contact:     '+251 116 62 64 35',
    email:       'info@mor.gov.et',
    description: 'Tax legislation, forms, regional office locator',
  },
  /** Ethiopian Customs Commission */
  ECC_OFFICIAL: {
    label:       'Ethiopian Customs Commission',
    url:         'https://customs.gov.et',
    description: 'Customs procedures, tariff schedules, trade statistics',
  },
  /** ASYCUDA World Ethiopia */
  ASYCUDA: {
    label:       'ASYCUDA World Ethiopia',
    url:         'https://asycuda.et',
    description: 'Customs declaration status and clearance tracking',
  },
  /** Regional Tax Centre Locator */
  REGIONAL: {
    label:       'Find Your Regional Tax Centre',
    url:         'https://www.mor.gov.et/branches',
    description: 'Locate your assigned MoR branch for in-person inquiries and account issues',
  },
  /** ESLSE — Ethiopian Shipping and Logistics Services Enterprise */
  ESLSE: {
    label:       'ESLSE Sea-Freight Tracking',
    url:         'https://www.eslse.et',
    description: 'Track sea-freight shipments via Ethiopian Shipping and Logistics',
  },
  /** Ethiopian Airlines Cargo */
  EAL_CARGO: {
    label:       'Ethiopian Airlines Cargo Tracking',
    url:         'https://www.ethiopianairlines.com/aa/cargo/track-shipment',
    description: 'Air-freight AWB tracking',
  },
} as const;

export type MorPortalKey = keyof typeof MOR_PORTALS;

// ── MoR Filing Deadlines (Gregorian calendar) ─────────────────────────────────

export const MOR_DEADLINES = {
  /** VAT / TOT / WHT — 30th of the following month (Proclamation 1341/2024) */
  MONTHLY_RETURN_DAY:          30,
  /** PAYE — last day of the following month (Proclamation 1395/2025) */
  PAYE_DUE_DAY:                30,
  /** Pension remittance → PFSA — 30th of following month */
  PENSION_DUE_DAY:             30,
  /** BIT annual declaration — November 7 of the following year */
  BIT_ANNUAL_MONTH:            11,   // November (Gregorian month 11)
  BIT_ANNUAL_DAY:               7,
  /** DRRF quarterly levy — 15th of last month of the quarter */
  DRRF_QUARTERLY_DAY:          15,
  DRRF_QUARTER_END_MONTHS:     [3, 6, 9, 12] as const,
  /** Schedule D final withholding — 30 days after month-end or 2 months after transaction */
  SCHEDULE_D_MONTHLY_DAYS:     30,
  SCHEDULE_D_TRANSACTION_MONTHS: 2,
  /** Graduate Tax (Higher Education Cost Sharing) — monthly with PAYE */
  GRADUATE_TAX_DUE_DAY:        30,
  /** Capital gains tax — within 2 months of disposal */
  CAPITAL_GAINS_DUE_MONTHS:    2,
  /** Customs duties — at time of clearance from customs area */
  CUSTOMS_DUE:                 'AT_CLEARANCE' as const,
  /** Excise tax on local production — within 30 days of production */
  EXCISE_LOCAL_DAYS:           30,
} as const;

// ── MoR Taxpayer Category Thresholds ─────────────────────────────────────────

export const MOR_THRESHOLDS = {
  /** Category A: annual gross income ≥ ETB 1,000,000 (bodies) */
  CATEGORY_A_ETB:    1_000_000,
  /** Category B: ETB 500,000 – ETB 999,999 */
  CATEGORY_B_MIN_ETB:  500_000,
  CATEGORY_B_MAX_ETB:  999_999,
  /** Category C: < ETB 500,000 */
  CATEGORY_C_MAX_ETB:  499_999,
  /** VAT mandatory registration threshold (Regulation 570/2025) */
  VAT_REGISTRATION_ETB: 2_000_000,
  /** TOT applies when annual revenue < ETB 2M (same as VAT threshold) */
  TOT_MAX_REVENUE_ETB:  2_000_000,
  /** Transfer pricing documentation required (Directive 2015) */
  TP_DOC_THRESHOLD_ETB: 500_000,
  /** WHT goods threshold (≥ ETB 10,000) */
  WHT_GOODS_THRESHOLD_ETB:   10_000,
  /** WHT services threshold (≥ ETB 500) */
  WHT_SERVICE_THRESHOLD_ETB: 500,
} as const;

// ── COMESA Member Countries (for preferential customs duty) ───────────────────
// Ethiopia is a NON-FTA member — standard COMESA rate (−10%) applies.
// FTA members (full tariff elimination): Djibouti, Kenya, Madagascar, Malawi,
// Mauritius, Sudan, Zambia, Zimbabwe, Burundi, Rwanda.

export const COMESA_MEMBERS = [
  'BI', 'KM', 'CD', 'DJ', 'EG', 'ER', 'ET', 'SZ',
  'KE', 'LY', 'MG', 'MW', 'MU', 'RW', 'SC', 'SD',
  'SO', 'TN', 'UG', 'ZM', 'ZW',
] as const;

export const COMESA_FTA_MEMBERS = [
  'DJ', 'KE', 'MG', 'MW', 'MU', 'SD', 'ZM', 'ZW', 'BI', 'RW',
] as const;

export type ComesaMember = typeof COMESA_MEMBERS[number];
