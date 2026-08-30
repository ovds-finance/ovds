/**
 * Property Tax — Ethiopia
 * Based on: Property Tax Proclamation No. 1161/2019 and Regulations
 * Administered by: Regional/City Revenue Bureaus + Ministry of Revenues (MoR) oversight
 * MoR was formerly the Ethiopian Revenues and Customs Authority (ERCA).
 * Restructured under Proclamation No. 1097/2018.
 */

export type PropertyTaxType = 'URBAN_LAND' | 'BUILDING' | 'AGRICULTURAL_LAND' | 'RENTAL_INCOME';
export type PropertyUseType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE' | 'AGRICULTURAL';
export type ValuationMethod = 'MARKET_VALUE' | 'REPLACEMENT_COST' | 'INCOME_CAPITALIZATION' | 'AREA_BASED';
export type PropertyTaxStatus = 'DRAFT' | 'ASSESSED' | 'NOTIFIED' | 'PAID' | 'OVERDUE' | 'DISPUTED' | 'EXEMPT';

/** Annual urban land use fee rates by municipality (ETB per m²) */
export const URBAN_LAND_RATE_ETB_PER_SQM = {
  ADDIS_ABABA_GRADE_1: 3.50,
  ADDIS_ABABA_GRADE_2: 2.50,
  ADDIS_ABABA_GRADE_3: 1.80,
  ADDIS_ABABA_GRADE_4: 1.20,
  REGIONAL_CAPITAL:    1.00,
  SECONDARY_CITY:      0.70,
  RURAL_TOWN:          0.40,
} as const;

/** Building depreciation rate for replacement-cost valuation */
export const BUILDING_ANNUAL_DEPRECIATION = 0.02; // 2% straight-line per year

/** Rental income tax rate (applicable to rental property) */
export const RENTAL_INCOME_TAX_RATE = 0.15; // 15% on net rental income

/** House/building tax rate on assessed value */
export const BUILDING_TAX_RATE = 0.01; // 1% of assessed value annually

export interface PropertyRecord {
  id: string;
  companyId: string;
  propertyCode: string;
  description: string;
  address: string;
  city: string;
  subcity?: string;
  woreda?: string;
  kebele?: string;
  propertyType: PropertyTaxType;
  useType: PropertyUseType;
  landAreaSqm: number;
  buildingAreaSqm?: number;
  yearBuilt?: number;
  registrationNumber?: string;
  titleDeedNumber?: string;
  assessedValue: number;
  marketValue?: number;
  annualTaxPayable: number;
  valuationMethod: ValuationMethod;
  lastValuationDate?: string;
  nextValuationDate?: string;
  exemptReason?: string;
  isExempt: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyTaxAssessment {
  id: string;
  propertyId: string;
  period: string; // YYYY
  assessedValue: number;
  taxRate: number;
  annualTaxDue: number;
  penaltyAmount: number;
  interestAmount: number;
  totalPayable: number;
  status: PropertyTaxStatus;
  assessedBy?: string;
  assessedAt?: string;
  dueDate: string;
  paidAt?: string;
  paymentReference?: string;
  municipality: string;
  notes?: string;
  createdAt: string;
}

export interface PropertyTaxPayment {
  id: string;
  assessmentId: string;
  propertyId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  bankName?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface PropertyTaxDashboard {
  totalProperties: number;
  totalAssessedValue: number;
  totalAnnualTaxDue: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  propertiesByType: Record<PropertyTaxType, number>;
  propertiesByStatus: Record<PropertyTaxStatus, number>;
  complianceRate: number;
  nextDueDate?: string;
  penaltiesAccrued: number;
}

export interface PropertyTaxSummary {
  period: string;
  totalTaxDue: number;
  totalPaid: number;
  totalOutstanding: number;
  overduePenalty: number;
  propertyCount: number;
  paidCount: number;
  overdueCount: number;
}

// -- Property Tax Calculation --------------------------------------------------

export interface PropertyTaxCalcInput {
  propertyType: PropertyTaxType;
  useType: PropertyUseType;
  assessedValue: number;
  landAreaSqm?: number;
  municipality?: keyof typeof URBAN_LAND_RATE_ETB_PER_SQM;
  annualRentalIncome?: number;
  allowableExpenses?: number;
  daysOverdue?: number;
}

export interface PropertyTaxCalcResult {
  annualTaxDue: number;
  taxRate: number;
  rentalTax?: number;
  landUseFee?: number;
  buildingTax?: number;
  penaltyAmount: number;
  totalPayable: number;
  notes: string[];
}

export function calculatePropertyTax(input: PropertyTaxCalcInput): PropertyTaxCalcResult {
  const notes: string[] = [];
  let annualTaxDue = 0;
  let taxRate = 0;
  let rentalTax: number | undefined;
  let landUseFee: number | undefined;
  let buildingTax: number | undefined;

  switch (input.propertyType) {
    case 'URBAN_LAND': {
      const ratePerSqm = input.municipality
        ? URBAN_LAND_RATE_ETB_PER_SQM[input.municipality]
        : URBAN_LAND_RATE_ETB_PER_SQM.ADDIS_ABABA_GRADE_3;
      landUseFee = (input.landAreaSqm ?? 0) * ratePerSqm;
      annualTaxDue = landUseFee;
      taxRate = ratePerSqm;
      notes.push(`Land use fee: ${input.landAreaSqm ?? 0} m² × ETB ${ratePerSqm}/m²`);
      break;
    }
    case 'BUILDING': {
      buildingTax = input.assessedValue * BUILDING_TAX_RATE;
      annualTaxDue = buildingTax;
      taxRate = BUILDING_TAX_RATE;
      notes.push(`Building tax: 1% of assessed value (ETB ${input.assessedValue.toLocaleString()})`);
      break;
    }
    case 'RENTAL_INCOME': {
      const netRentalIncome = Math.max(0, (input.annualRentalIncome ?? 0) - (input.allowableExpenses ?? 0));
      rentalTax = netRentalIncome * RENTAL_INCOME_TAX_RATE;
      annualTaxDue = rentalTax;
      taxRate = RENTAL_INCOME_TAX_RATE;
      notes.push(`Rental income tax: 15% of net income (gross ETB ${(input.annualRentalIncome ?? 0).toLocaleString()} less expenses ETB ${(input.allowableExpenses ?? 0).toLocaleString()})`);
      break;
    }
    case 'AGRICULTURAL_LAND': {
      annualTaxDue = input.assessedValue * 0.005; // 0.5% for agricultural land
      taxRate = 0.005;
      notes.push('Agricultural land: 0.5% of assessed value');
      break;
    }
  }

  // Penalty: 5% of tax due per year overdue (quarterly: ~1.25%)
  const penaltyAmount = input.daysOverdue && input.daysOverdue > 0
    ? annualTaxDue * 0.05 * (input.daysOverdue / 365)
    : 0;
  if (penaltyAmount > 0) {
    notes.push(`Late payment penalty: 5% per year on overdue amount`);
  }

  return {
    annualTaxDue,
    taxRate,
    rentalTax,
    landUseFee,
    buildingTax,
    penaltyAmount,
    totalPayable: annualTaxDue + penaltyAmount,
    notes,
  };
}
