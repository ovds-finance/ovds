/**
 * Excise Tax — Ethiopia
 * Based on: Excise Tax Proclamation No. 1186/2020
 * Administered by: Ministry of Revenues (MoR) — formerly Ethiopian Revenues and
 * Customs Authority (ERCA), restructured under Proclamation No. 1097/2018.
 * Portal: etax.mor.gov.et
 *
 * Excise tax applies to locally manufactured goods and imported goods before sale.
 * Some goods carry both VAT + Excise; excise is levied on the ex-factory price (local)
 * or CIF value (imports).
 */

export type ExciseGoodsCategory =
  | 'TOBACCO_CIGARETTES'
  | 'TOBACCO_OTHER'
  | 'ALCOHOL_WINE'
  | 'ALCOHOL_BEER'
  | 'ALCOHOL_SPIRITS'
  | 'SOFT_DRINKS'
  | 'PERFUMES_COSMETICS'
  | 'VEHICLES_UP_TO_1300CC'
  | 'VEHICLES_1300_TO_1800CC'
  | 'VEHICLES_ABOVE_1800CC'
  | 'VEHICLES_TRUCKS'
  | 'FUEL_PETROL'
  | 'FUEL_DIESEL'
  | 'PLASTIC_BAGS'
  | 'ELECTRONICS'
  | 'LUXURY_GOODS'
  | 'SALT'
  | 'SUGAR'
  | 'OTHER';

export type ExciseTaxBasis = 'PERCENTAGE' | 'SPECIFIC_ETB' | 'HYBRID';
export type ExciseTaxStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'FILED' | 'OVERDUE' | 'EXEMPTED';
export type ExciseTaxOrigin = 'LOCAL' | 'IMPORT';

/** Excise rates per Proclamation No. 1186/2020 */
export const EXCISE_RATES: Record<ExciseGoodsCategory, {
  rate?: number;
  specificRate?: number;
  unit?: string;
  basis: ExciseTaxBasis;
  notes: string;
}> = {
  TOBACCO_CIGARETTES:       { rate: 1.50, basis: 'PERCENTAGE',   notes: '150% of ex-factory/CIF value' },
  TOBACCO_OTHER:            { rate: 0.75, basis: 'PERCENTAGE',   notes: '75% of ex-factory/CIF value' },
  ALCOHOL_WINE:             { rate: 0.50, basis: 'PERCENTAGE',   notes: '50% of ex-factory/CIF value' },
  ALCOHOL_BEER:             { rate: 0.50, basis: 'PERCENTAGE',   notes: '50% of ex-factory/CIF value' },
  ALCOHOL_SPIRITS:          { rate: 0.75, basis: 'PERCENTAGE',   notes: '75% of ex-factory/CIF value' },
  SOFT_DRINKS:              { rate: 0.30, basis: 'PERCENTAGE',   notes: '30% of ex-factory/CIF value' },
  PERFUMES_COSMETICS:       { rate: 0.30, basis: 'PERCENTAGE',   notes: '30% of ex-factory/CIF value' },
  VEHICLES_UP_TO_1300CC:    { rate: 0.30, basis: 'PERCENTAGE',   notes: '30% of CIF value (new or reconditioned)' },
  VEHICLES_1300_TO_1800CC:  { rate: 0.60, basis: 'PERCENTAGE',   notes: '60% of CIF value' },
  VEHICLES_ABOVE_1800CC:    { rate: 1.00, basis: 'PERCENTAGE',   notes: '100% of CIF value' },
  VEHICLES_TRUCKS:          { rate: 0.00, basis: 'PERCENTAGE',   notes: 'Exempt (commercial trucks)' },
  FUEL_PETROL:              { specificRate: 2.89, unit: 'per litre', basis: 'SPECIFIC_ETB', notes: 'ETB 2.89 per litre (Regulation 2023)' },
  FUEL_DIESEL:              { specificRate: 1.86, unit: 'per litre', basis: 'SPECIFIC_ETB', notes: 'ETB 1.86 per litre (Regulation 2023)' },
  PLASTIC_BAGS:             { specificRate: 5.00, unit: 'per kg',   basis: 'SPECIFIC_ETB', notes: 'ETB 5 per kg — Proc. 1186/2020' },
  ELECTRONICS:              { rate: 0.05, basis: 'PERCENTAGE',   notes: '5% of CIF value' },
  LUXURY_GOODS:             { rate: 0.30, basis: 'PERCENTAGE',   notes: '30% of CIF value (watches, jewellery, etc.)' },
  SALT:                     { specificRate: 0.10, unit: 'per kg', basis: 'SPECIFIC_ETB', notes: 'ETB 0.10 per kg' },
  SUGAR:                    { specificRate: 0.50, unit: 'per kg', basis: 'SPECIFIC_ETB', notes: 'ETB 0.50 per kg' },
  OTHER:                    { rate: 0.10, basis: 'PERCENTAGE',   notes: '10% default rate' },
};

export interface ExciseTaxRecord {
  id: string;
  companyId: string;
  period: string;            // YYYY-MM
  goodsCategory: ExciseGoodsCategory;
  goodsDescription: string;
  origin: ExciseTaxOrigin;
  quantity: number;
  unit: string;
  baseValue: number;        // ex-factory price or CIF value
  exciseRate?: number;
  specificRate?: number;
  exciseTaxDue: number;
  vatOnExcise?: number;     // VAT applied on (value + excise) for some goods
  totalTaxDue: number;
  status: ExciseTaxStatus;
  customsDeclarationNo?: string;
  filedAt?: string;
  paidAt?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

export interface ExciseTaxFiling {
  id: string;
  companyId: string;
  period: string;
  totalExciseDue: number;
  totalPaid: number;
  penaltyAmount: number;
  status: ExciseTaxStatus;
  /** MoR reference number (field kept as ercaReferenceNo for DB compat) */
  ercaReferenceNo?: string;
  filedAt?: string;
  dueDate: string;
  recordCount: number;
  notes?: string;
  createdAt: string;
}

export interface ExciseTaxDashboard {
  period: string;
  totalExciseDue: number;
  totalPaid: number;
  totalOutstanding: number;
  penaltiesAccrued: number;
  byCategory: Record<string, number>;
  complianceRate: number;
  nextDueDate: string;
  overdueCount: number;
}

// -- Excise Tax Calculator -----------------------------------------------------

export interface ExciseCalcInput {
  category: ExciseGoodsCategory;
  baseValue: number;
  quantity?: number;
  applyVatOnTop?: boolean; // Some goods: VAT = 15% × (baseValue + excise)
}

export interface ExciseCalcResult {
  exciseTaxDue: number;
  vatIfApplied?: number;
  totalTaxBurden: number;
  effectiveRate: number;
  notes: string;
}

export function calculateExciseTax(input: ExciseCalcInput): ExciseCalcResult {
  const config = EXCISE_RATES[input.category];
  let exciseTaxDue = 0;

  if (config.basis === 'PERCENTAGE' && config.rate !== undefined) {
    exciseTaxDue = input.baseValue * config.rate;
  } else if (config.basis === 'SPECIFIC_ETB' && config.specificRate !== undefined) {
    exciseTaxDue = (input.quantity ?? 1) * config.specificRate;
  } else if (config.basis === 'HYBRID') {
    // Both percentage and specific apply
    exciseTaxDue = (input.baseValue * (config.rate ?? 0)) +
                   ((input.quantity ?? 1) * (config.specificRate ?? 0));
  }

  const vatIfApplied = input.applyVatOnTop
    ? (input.baseValue + exciseTaxDue) * 0.15
    : undefined;

  const totalTaxBurden = exciseTaxDue + (vatIfApplied ?? 0);
  const effectiveRate = input.baseValue > 0 ? exciseTaxDue / input.baseValue : 0;

  return {
    exciseTaxDue,
    vatIfApplied,
    totalTaxBurden,
    effectiveRate,
    notes: config.notes,
  };
}
