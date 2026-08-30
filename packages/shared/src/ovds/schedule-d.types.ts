/**
 * Schedule D — Other Income & Capital Taxes (Ethiopia)
 * Proclamation No. 979/2016 as amended
 * Administered by: Ministry of Revenues (MoR) — formerly ERCA
 * Portal: etax.mor.gov.et
 *
 * Schedule D covers flat-rate taxes on specific income sources:
 * dividends, interest, capital gains, royalties, digital content,
 * games of chance, repatriated profits, and management/technical fees.
 */

// ---------------------------------------------------------------------------
// Schedule D Tax Types
// ---------------------------------------------------------------------------

export type ScheduleDTaxType =
  | 'DIVIDEND'
  | 'INTEREST_STANDARD'
  | 'INTEREST_FINANCIAL_INSTITUTION'
  | 'CAPITAL_GAINS'
  | 'ROYALTY_ARTISTIC'
  | 'ROYALTY_TECHNICAL'
  | 'DIGITAL_CONTENT'
  | 'GAMES_OF_CHANCE'
  | 'REPATRIATED_PROFIT'
  | 'UNDISTRIBUTED_PROFIT'
  | 'MANAGEMENT_FEES'
  | 'TECHNICAL_FEES';

// ---------------------------------------------------------------------------
// Flat rates per Proclamation No. 1395/2025
// ---------------------------------------------------------------------------

export const SCHEDULE_D_RATES: Record<ScheduleDTaxType, {
  rate: number;
  description: string;
  proclamationRef: string;
  withheldAtSource: boolean;
  notes?: string;
}> = {
  DIVIDEND: {
    rate: 0.15,
    description: 'Dividend Income Tax',
    proclamationRef: 'Proc. 1395/2025 Art. 52',
    withheldAtSource: true,
    notes: 'Applies to distributed corporate profits and withdrawals from private companies',
  },
  INTEREST_STANDARD: {
    rate: 0.10,
    description: 'Interest Income Tax (standard)',
    proclamationRef: 'Proc. 1395/2025 Art. 53',
    withheldAtSource: true,
    notes: 'Applies to savings/credit interest for regular entities',
  },
  INTEREST_FINANCIAL_INSTITUTION: {
    rate: 0.30,
    description: 'Interest Income Tax (financial institutions / sales on credit)',
    proclamationRef: 'Proc. 1395/2025 Art. 53',
    withheldAtSource: false,
    notes: 'Applies to banks, MFIs, and credit sales; 30% on gross interest income',
  },
  CAPITAL_GAINS: {
    rate: 0.15,
    description: 'Capital Gains Tax (Gain on Disposal)',
    proclamationRef: 'Proc. 1395/2025 Art. 59',
    withheldAtSource: false,
    notes: 'Applies to profits from transferring shares, bonds, or immovable assets (buildings)',
  },
  ROYALTY_ARTISTIC: {
    rate: 0.05,
    description: 'Royalty Income Tax — Artistic / Cultural',
    proclamationRef: 'Proc. 1395/2025 Art. 56',
    withheldAtSource: true,
    notes: '5% on payments for artistic and cultural creations',
  },
  ROYALTY_TECHNICAL: {
    rate: 0.10,
    description: 'Royalty Income Tax — Technical / Industrial / Copyright',
    proclamationRef: 'Proc. 1395/2025 Art. 56',
    withheldAtSource: true,
    notes: '10% on technical/industrial property, patents, and copyrights',
  },
  DIGITAL_CONTENT: {
    rate: 0.15,
    description: 'Digital Content Creation Income Tax',
    proclamationRef: 'Proc. 1395/2025 Art. 57',
    withheldAtSource: false,
    notes: 'Revenues from streaming, sponsorships, affiliate links; reported under digital schedule',
  },
  GAMES_OF_CHANCE: {
    rate: 0.20,
    description: 'Games of Chance Tax',
    proclamationRef: 'Proc. 1395/2025 Art. 58',
    withheldAtSource: true,
    notes: 'Applies to winnings from lotteries, tombolas, and luck-based gaming',
  },
  REPATRIATED_PROFIT: {
    rate: 0.15,
    description: 'Repatriated Branch Profit Tax',
    proclamationRef: 'Proc. 1395/2025 Art. 60',
    withheldAtSource: false,
    notes: 'International branch profits repatriated out of Ethiopia',
  },
  UNDISTRIBUTED_PROFIT: {
    rate: 0.15,
    description: 'Undistributed Profit Tax',
    proclamationRef: 'Proc. 1395/2025 Art. 61',
    withheldAtSource: false,
    notes: 'Applies when companies choose not to distribute profits',
  },
  MANAGEMENT_FEES: {
    rate: 0.15,
    description: 'Management Fees Tax (non-resident)',
    proclamationRef: 'Proc. 1395/2025 Art. 62',
    withheldAtSource: true,
    notes: '15% WHT on fees paid to non-residents providing managerial services',
  },
  TECHNICAL_FEES: {
    rate: 0.15,
    description: 'Technical Services Fees Tax (non-resident)',
    proclamationRef: 'Proc. 1395/2025 Art. 62',
    withheldAtSource: true,
    notes: '15% WHT on fees paid to non-residents providing technical services',
  },
};

// ---------------------------------------------------------------------------
// Schedule B — Rental Income Tax
// ---------------------------------------------------------------------------

/** Individual landlord rental income — progressive annual brackets */
export const RENTAL_INCOME_BRACKETS = [
  { min: 0,        max: 7_200,   rate: 0,    deduction: 0,     notes: 'Tax-free up to ETB 7,200/year' },
  { min: 7_201,    max: 19_800,  rate: 0.10, deduction: 720,   notes: '10% bracket' },
  { min: 19_801,   max: 38_400,  rate: 0.15, deduction: 1_710, notes: '15% bracket' },
  { min: 38_401,   max: 63_000,  rate: 0.20, deduction: 3_630, notes: '20% bracket' },
  { min: 63_001,   max: 93_600,  rate: 0.25, deduction: 6_780, notes: '25% bracket' },
  { min: 93_601,   max: 130_800, rate: 0.30, deduction: 11_460, notes: '30% bracket' },
  { min: 130_801,  max: Infinity, rate: 0.35, deduction: 18_000, notes: '35% top bracket' },
] as const;

/** Corporate/body rental income — flat 30% */
export const CORPORATE_RENTAL_RATE = 0.30;

/** Allowable deductions for rental income: 40% of gross rent as maintenance allowance */
export const RENTAL_ALLOWABLE_EXPENSE_PCT = 0.40;

// ---------------------------------------------------------------------------
// Capital Gains Asset Types
// ---------------------------------------------------------------------------

export type CapitalGainsAssetType =
  | 'SHARES'
  | 'BONDS'
  | 'IMMOVABLE_PROPERTY'
  | 'OTHER_SECURITIES';

// ---------------------------------------------------------------------------
// Customs Duty
// ---------------------------------------------------------------------------

/** Customs duty band ranges (CIF-based) per Ethiopian Customs Tariff */
export const CUSTOMS_DUTY_BANDS = [
  { min: 0,    rate: 0.00, label: 'Exempt (essential goods, raw materials)' },
  { min: 0,    rate: 0.05, label: '5% (basic inputs)' },
  { min: 0,    rate: 0.10, label: '10% (semi-processed goods)' },
  { min: 0,    rate: 0.15, label: '15% (intermediate goods)' },
  { min: 0,    rate: 0.20, label: '20% (consumer goods, light manufactures)' },
  { min: 0,    rate: 0.25, label: '25% (selected consumer goods)' },
  { min: 0,    rate: 0.30, label: '30% (luxury consumer goods)' },
  { min: 0,    rate: 0.35, label: '35% (maximum — vehicles, alcohol, finished goods)' },
] as const;

export const CUSTOMS_DUTY_MIN_RATE = 0.00;
export const CUSTOMS_DUTY_MAX_RATE = 0.35;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ScheduleDTaxRecord {
  id: string;
  companyId: string;
  taxType: ScheduleDTaxType;
  period: string;           // YYYY-MM
  grossAmount: number;
  taxRate: number;
  taxAmount: number;
  netAmount: number;
  payerName?: string;
  payerTin?: string;
  recipientName?: string;
  recipientTin?: string;
  assetType?: CapitalGainsAssetType;
  acquisitionCost?: number;
  disposalProceeds?: number;
  capitalGain?: number;
  withheldAtSource: boolean;
  status: 'DRAFT' | 'FILED' | 'PAID' | 'EXEMPT';
  /** MoR reference number for this Schedule D filing (field kept as ercaReference for DB compat) */
  ercaReference?: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface RentalIncomeTaxRecord {
  id: string;
  companyId: string;
  taxpayerType: 'INDIVIDUAL' | 'CORPORATE';
  period: string;           // YYYY (annual assessment)
  grossRentalIncome: number;
  allowableExpenses: number;
  netRentalIncome: number;
  taxPayable: number;
  effectiveRate: number;
  status: 'DRAFT' | 'ASSESSED' | 'FILED' | 'PAID';
  propertyId?: string;
  notes?: string;
  createdAt: string;
}

export interface CustomsDutyRecord {
  id: string;
  companyId: string;
  declarationNo: string;
  importDate: string;
  goodsDescription: string;
  hsCode?: string;
  cifValue: number;
  customsDutyRate: number;
  customsDutyAmount: number;
  exciseDuty?: number;
  surtaxAmount?: number;
  vatOnImport?: number;
  totalTaxBurden: number;
  status: 'DRAFT' | 'ASSESSED' | 'PAID' | 'CLEARED';
  notes?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Calculators
// ---------------------------------------------------------------------------

export interface ScheduleDCalcResult {
  grossAmount: number;
  taxRate: number;
  taxAmount: number;
  netAmount: number;
  taxType: ScheduleDTaxType;
  description: string;
  withheldAtSource: boolean;
}

/**
 * Calculate Schedule D flat-rate tax.
 * @param grossAmount  Gross payment or income amount
 * @param taxType      Which Schedule D category applies
 */
export function calculateScheduleD(
  grossAmount: number,
  taxType: ScheduleDTaxType,
): ScheduleDCalcResult {
  const config = SCHEDULE_D_RATES[taxType];
  const taxAmount = Math.round(grossAmount * config.rate * 100) / 100;
  return {
    grossAmount,
    taxRate: config.rate,
    taxAmount,
    netAmount: Math.round((grossAmount - taxAmount) * 100) / 100,
    taxType,
    description: config.description,
    withheldAtSource: config.withheldAtSource,
  };
}

/**
 * Calculate Capital Gains Tax on disposal of assets.
 * @param acquisitionCost   Original purchase price (ETB)
 * @param disposalProceeds  Selling / transfer price (ETB)
 * @param assetType         Type of asset
 */
export function calculateCapitalGains(
  acquisitionCost: number,
  disposalProceeds: number,
  assetType: CapitalGainsAssetType = 'SHARES',
): {
  capitalGain: number;
  taxAmount: number;
  taxRate: number;
  netProceeds: number;
  applicable: boolean;
  assetType: CapitalGainsAssetType;
} {
  const capitalGain = Math.max(0, disposalProceeds - acquisitionCost);
  const rate = SCHEDULE_D_RATES.CAPITAL_GAINS.rate; // 15%
  const taxAmount = Math.round(capitalGain * rate * 100) / 100;
  return {
    capitalGain: Math.round(capitalGain * 100) / 100,
    taxAmount,
    taxRate: rate,
    netProceeds: Math.round((disposalProceeds - taxAmount) * 100) / 100,
    applicable: capitalGain > 0,
    assetType,
  };
}

/**
 * Calculate individual rental income tax using progressive annual brackets.
 * Applies 40% standard expense deduction before applying brackets.
 *
 * @param grossAnnualRent  Total annual rental receipts (ETB)
 * @param actualExpenses   Optional: use actual expenses instead of 40% allowance
 */
export function calculateRentalIncomeTax(
  grossAnnualRent: number,
  actualExpenses?: number,
): {
  grossRent: number;
  deductibleExpenses: number;
  netRentalIncome: number;
  taxPayable: number;
  effectiveRate: number;
  bracket: (typeof RENTAL_INCOME_BRACKETS)[number] | null;
} {
  const deductibleExpenses = actualExpenses !== undefined
    ? actualExpenses
    : grossAnnualRent * RENTAL_ALLOWABLE_EXPENSE_PCT;
  const netRentalIncome = Math.max(0, grossAnnualRent - deductibleExpenses);

  let taxPayable = 0;
  let matchedBracket: (typeof RENTAL_INCOME_BRACKETS)[number] | null = null;

  for (let i = RENTAL_INCOME_BRACKETS.length - 1; i >= 0; i--) {
    const b = RENTAL_INCOME_BRACKETS[i];
    if (netRentalIncome >= b.min) {
      taxPayable = Math.max(0, netRentalIncome * b.rate - b.deduction);
      matchedBracket = b;
      break;
    }
  }

  taxPayable = Math.round(taxPayable * 100) / 100;
  return {
    grossRent: grossAnnualRent,
    deductibleExpenses: Math.round(deductibleExpenses * 100) / 100,
    netRentalIncome: Math.round(netRentalIncome * 100) / 100,
    taxPayable,
    effectiveRate: netRentalIncome > 0 ? taxPayable / netRentalIncome : 0,
    bracket: matchedBracket,
  };
}

/**
 * Calculate corporate / body rental income tax — flat 30%.
 */
export function calculateCorporateRentalTax(netRentalIncome: number): {
  netRentalIncome: number;
  taxRate: number;
  taxPayable: number;
} {
  const taxPayable = Math.round(netRentalIncome * CORPORATE_RENTAL_RATE * 100) / 100;
  return { netRentalIncome, taxRate: CORPORATE_RENTAL_RATE, taxPayable };
}

/**
 * Calculate total customs import duty.
 * @param cifValue        Cost + Insurance + Freight (CIF) value in ETB
 * @param customsDutyRate Applicable tariff rate (0.00–0.35)
 */
export function calculateCustomsDuty(
  cifValue: number,
  customsDutyRate: number,
): {
  cifValue: number;
  customsDutyRate: number;
  customsDutyAmount: number;
} {
  const rate = Math.min(Math.max(customsDutyRate, CUSTOMS_DUTY_MIN_RATE), CUSTOMS_DUTY_MAX_RATE);
  return {
    cifValue,
    customsDutyRate: rate,
    customsDutyAmount: Math.round(cifValue * rate * 100) / 100,
  };
}
