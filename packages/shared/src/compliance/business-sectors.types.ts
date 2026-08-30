/**
 * @ovds/shared — Ethiopian Business Sectors & Regulatory Types
 * 
 * Covers the 4-sectors classification (Primary, Secondary, Tertiary, Quaternary),
 * business entity types, capital requirements, and sector-specific competency certificates.
 */

// -- Business Entity Types ---------------------------------------------------

export type BusinessEntityType = 'SOLE_PROPRIETORSHIP' | 'PLC' | 'ONE_MEMBER_PLC' | 'SHARE_COMPANY';

export interface EntityCharacteristics {
  entityType: BusinessEntityType;
  shareholderCount?: number;
  hasLimitedLiability: boolean;
  requiresAuditor: boolean;
  minimumCapitalUSD?: number;
}

export const ENTITY_CHARACTERISTICS: Record<BusinessEntityType, EntityCharacteristics> = {
  SOLE_PROPRIETORSHIP: {
    entityType: 'SOLE_PROPRIETORSHIP',
    hasLimitedLiability: false,
    requiresAuditor: false,
  },
  PLC: {
    entityType: 'PLC',
    shareholderCount: 50,
    hasLimitedLiability: true,
    requiresAuditor: false,
  },
  ONE_MEMBER_PLC: {
    entityType: 'ONE_MEMBER_PLC',
    shareholderCount: 1,
    hasLimitedLiability: true,
    requiresAuditor: false,
  },
  SHARE_COMPANY: {
    entityType: 'SHARE_COMPANY',
    shareholderCount: 5,
    hasLimitedLiability: true,
    requiresAuditor: true,
  },
};

// -- Capital Requirements for Foreign Investors -------------------------------

export interface CapitalRequirement {
  entityType: BusinessEntityType;
  projectStructure: 'WHOLLY_FOREIGN_OWNED' | 'JOINT_VENTURE' | 'TECHNICAL_CONSULTANCY';
  minimumCapitalUSD: number;
}

export const CAPITAL_REQUIREMENTS: CapitalRequirement[] = [
  { entityType: 'SHARE_COMPANY', projectStructure: 'WHOLLY_FOREIGN_OWNED', minimumCapitalUSD: 200000 },
  { entityType: 'SHARE_COMPANY', projectStructure: 'JOINT_VENTURE', minimumCapitalUSD: 150000 },
  { entityType: 'SHARE_COMPANY', projectStructure: 'TECHNICAL_CONSULTANCY', minimumCapitalUSD: 100000 },
];

// -- Business Sector Classification -------------------------------------------

export type SectorClassification = 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'QUATERNARY';

export type PrimarySubSector = 
  | 'AGRICULTURE_AGRIBUSINESS'
  | 'LIVESTOCK_PASTORALISM'
  | 'MINING_QUARRYING'
  | 'FORESTRY_FISHING';

export type SecondarySubSector =
  | 'CONSTRUCTION_REAL_ESTATE'
  | 'TEXTILE_APPAREL_LEATHER'
  | 'FOOD_PROCESSING_BEVERAGES'
  | 'CHEMICALS_CONSTRUCTION_MATERIALS';

export type TertiarySubSector =
  | 'TRANSPORT_LOGISTICS_AVIATION'
  | 'FINANCIAL_SERVICES_BANKING'
  | 'WHOLESALE_RETAIL_TRADE'
  | 'TOURISM_HOSPITALITY'
  | 'HEALTHCARE_EDUCATION';

export type QuaternarySubSector =
  | 'TELECOMMUNICATIONS'
  | 'INFORMATION_COMMUNICATIONS_TECHNOLOGY'
  | 'MEDIA_ENTERTAINMENT';

export type BusinessSubSector = PrimarySubSector | SecondarySubSector | TertiarySubSector | QuaternarySubSector;

export interface EthiopianEconomicSector {
  classification: SectorClassification;
  subSector: BusinessSubSector;
  name: string;
  description: string;
  gdpContribution?: number;
  employmentPercentage?: number;
}

export const ETHIOPIAN_ECONOMIC_SECTORS: EthiopianEconomicSector[] = [
  // Primary Sector
  { classification: 'PRIMARY', subSector: 'AGRICULTURE_AGRIBUSINESS', name: 'Agriculture & Agribusiness', description: 'Smallholder and commercial farming of cash crops like coffee, teff, oilseeds, pulses, khat, and sugarcane', gdpContribution: 36, employmentPercentage: 70 },
  { classification: 'PRIMARY', subSector: 'LIVESTOCK_PASTORALISM', name: 'Livestock & Pastoralism', description: 'Cattle, sheep, goat, and camel herding fueling domestic meat and dairy markets', employmentPercentage: 30 },
  { classification: 'PRIMARY', subSector: 'MINING_QUARRYING', name: 'Mining & Quarrying', description: 'Extraction of gold, tantalum, gemstones, marble, potash, and industrial minerals', gdpContribution: 5 },
  { classification: 'PRIMARY', subSector: 'FORESTRY_FISHING', name: 'Forestry & Fishing', description: 'Inland lake fishing (artisanal) and regional timber/firewood harvesting', gdpContribution: 1 },
  
  // Secondary Sector
  { classification: 'SECONDARY', subSector: 'CONSTRUCTION_REAL_ESTATE', name: 'Construction & Real Estate', description: 'Large-scale infrastructure projects (roads, dams, railways) and urban housing developments', gdpContribution: 12 },
  { classification: 'SECONDARY', subSector: 'TEXTILE_APPAREL_LEATHER', name: 'Textile, Apparel & Leather Goods', description: 'Factory production utilizing local cotton and livestock hides for clothes and footwear', gdpContribution: 4 },
  { classification: 'SECONDARY', subSector: 'FOOD_PROCESSING_BEVERAGES', name: 'Food Processing & Beverages', description: 'Agro-processing, milling, sugar refining, breweries, and soft drink manufacturing', gdpContribution: 6 },
  { classification: 'SECONDARY', subSector: 'CHEMICALS_CONSTRUCTION_MATERIALS', name: 'Chemicals & Construction Materials', description: 'Production of cement, glass, fertilizers, steel fabrication, and plastics', gdpContribution: 6 },
  
  // Tertiary Sector
  { classification: 'TERTIARY', subSector: 'TRANSPORT_LOGISTICS_AVIATION', name: 'Transport, Logistics & Aviation', description: 'Ethiopian Airlines Group operations alongside land transport and freight logistics', gdpContribution: 5 },
  { classification: 'TERTIARY', subSector: 'FINANCIAL_SERVICES_BANKING', name: 'Financial Services & Banking', description: 'Commercial Bank of Ethiopia, private banks, insurance, and MFIs', gdpContribution: 4 },
  { classification: 'TERTIARY', subSector: 'WHOLESALE_RETAIL_TRADE', name: 'Wholesale & Retail Trade', description: 'Traditional markets, supermarkets, kiosks, and e-commerce startups', gdpContribution: 8 },
  { classification: 'TERTIARY', subSector: 'TOURISM_HOSPITALITY', name: 'Tourism & Hospitality', description: 'Hotels, eco-lodges, tour guiding, and restaurants tied to cultural destinations', gdpContribution: 2 },
  { classification: 'TERTIARY', subSector: 'HEALTHCARE_EDUCATION', name: 'Healthcare & Education', description: 'Private and public hospitals, diagnostic centers, universities, and training schools', gdpContribution: 6 },
  
  // Quaternary Sector
  { classification: 'QUATERNARY', subSector: 'TELECOMMUNICATIONS', name: 'Telecommunications', description: 'Ethio Telecom and Safaricom Ethiopia providing mobile, data, and mobile-money', gdpContribution: 3 },
  { classification: 'QUATERNARY', subSector: 'INFORMATION_COMMUNICATIONS_TECHNOLOGY', name: 'Information & Communications Technology', description: 'Software startups, tech hubs, cyber-security, and fintech providers like Telebirr', gdpContribution: 5 },
  { classification: 'QUATERNARY', subSector: 'MEDIA_ENTERTAINMENT', name: 'Media & Entertainment', description: 'Broadcast television, radio, publishing, and music/film industries', gdpContribution: 2 },
];

// -- Sector-Specific Competency Certificates ---------------------------------

export type CompetencyCertificateType =
  | 'AGRICULTURE_AUTHORIZATION'
  | 'COFFEE_EXPORT_CLEARANCE'
  | 'MINING_EIA_CLEARANCE'
  | 'MANUFACTURING_INSPECTION'
  | 'CONSTRUCTION_GRADE_LICENSE'
  | 'BANKING_LICENSE'
  | 'TOURISM_SAFETY_CLEARANCE'
  | 'ICT_OPERATOR_LICENSE'
  | 'ICT_DATA_PRIVACY_COMPLIANCE'
  | 'ICT_SYSTEM_SAFETY_AUDIT';

export interface CompetencyCertificate {
  id: string;
  companyId: string;
  certificateType: CompetencyCertificateType;
  issuingAuthority: string;
  certificateNumber: string;
  issuedAt?: Date | string;
  expiresAt?: Date | string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING_RENEWAL';
  requirements: string[];
  documentUrl?: string;
}

export interface AgricultureCertRequirements {
  ministryOfAgricultureAuthorization: boolean;
  exportLicense?: boolean;
}

export interface CoffeeExportRequirements extends AgricultureCertRequirements {
  ethiopianCoffeeTeaAuthorityClearance: boolean;
  exportTrackingSystemRegistration: boolean;
  qualityTestingClearance: boolean;
}

export interface MiningRequirements {
  technicalFeasibilityAssessment: boolean;
  mineralProspectingCapabilityProof: boolean;
  environmentalImpactAssessment: boolean;
}

export interface ManufacturingRequirements {
  factoryFloorInspection: boolean;
  healthSafetyCertification: boolean;
  industrialWasteDisposalPlan: boolean;
  structuralStabilityCertification: boolean;
}

export interface ConstructionGradeRequirements {
  auditFinancialCapital: number;
  machineryOwnershipProof: boolean;
  staffEngineeringCertifications: boolean;
  gradeLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
}

export interface BankingRequirements {
  capitalAdequacyVerification: boolean;
  backgroundClearance: boolean;
  creditRatingLimits: boolean;
}

export interface TourismRequirements {
  buildingSafetyClearance: boolean;
  sanitaryInspection: boolean;
  commercialInsuranceProtection: boolean;
}

export interface IctRequirements {
  dataPrivacyCompliance: boolean;
  systemSafetyAudit: boolean;
  localizationCertification: boolean;
}

// -- Foreign Exchange Regulations -------------------------------------------

export interface FxRemittanceRequest {
  companyId: string;
  purpose: 'PROFIT' | 'DIVIDEND' | 'CAPITAL_REPATRIATION';
  amountUSD: number;
  auditedFinancialStatements: string;
  taxClearanceCertificate: string;
  originalCapitalImportationCertificate: string;
  bankReference: string;
}

export interface FxRetentionRights {
  exporterType: 'SERVICE_SECTOR';
  fxRetentionPercentage: 100;
  indefiniteRetentionAllowed: boolean;
}

export interface FxForwardContract {
  contractId: string;
  companyId: string;
  notionalAmount: number;
  exchangeRate: number;
  maturityDate: Date | string;
  status: 'ACTIVE' | 'SETTLED' | 'CANCELLED';
}

// -- Work Permit & Residency Types -----------------------------------------

export type WorkPermitCategory = 'TOP_MANAGEMENT' | 'SPECIALIZED_KNOWLEDGE' | 'SHORT_TERM_TECHNICAL';

export interface WorkPermitApplication {
  employeeId: string;
  category: WorkPermitCategory;
  position: string;
  qualifications: string[];
  attestedCredentials: string[];
  employmentContract: string;
  salaryETB: number;
  validityMonths?: number;
  skillsTransferProgram?: {
    timeline: string;
    understudyEmployeeId: string;
  };
}

export type WorkPermitStatus = 'APPLIED' | 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'REJECTED';

export interface WorkPermit {
  id: string;
  employeeId: string;
  companyId: string;
  category: WorkPermitCategory;
  applicationDate: Date | string;
  approvalDate?: Date | string;
  expiryDate?: Date | string;
  status: WorkPermitStatus;
  documentUrls: string[];
}

export type ResidenceIdStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING_RENEWAL';

export interface ResidenceIdCard {
  cardNumber: string;
  employeeId: string;
  companyId: string;
  issuedDate: Date | string;
  expiryDate: Date | string;
  status: ResidenceIdStatus;
  renewalRequired: boolean;
}

// -- Investment Negative List ------------------------------------------------

export type InvestmentRestrictionLevel = 'STATE_RESERVED' | 'DOMESTIC_ONLY' | 'JOINT_VENTURE_ACCESSIBLE';

export interface RestrictedSector {
  sector: BusinessSubSector | string;
  restrictionLevel: InvestmentRestrictionLevel;
  foreignEquityCapPercent?: number;
  notes?: string;
}

export const INVESTMENT_NEGATIVE_LIST: RestrictedSector[] = [];

// -- Company Lifecycle: Labor Contract Framework -----------------------------

export interface LaborContract {
  id: string;
  employeeId: string;
  companyId: string;
  position: string;
  department?: string;
  workplaceLocation: string;
  startDate: Date | string;
  endDate?: Date | string;
  isFixedTerm: boolean;
  probationDays: 45;
  workingHoursPerDay: 8;
  workingDaysPerWeek: number;
  grossSalaryETB: number;
  paymentDay: number;
  governingLaw: 'Labour Proclamation No. 1156/2019';
  terms: Record<string, unknown>;
}

export interface LeaveEntitlement {
  annualDays: number;
  maternityDays: 120;
  sickDays: 180;
  sickDaysPaid: {
    month1: 100;
    months2_3: 50;
    months4_6: 0;
  };
}

export function calculateSeverancePay(
  averageMonthlySalary: number,
  yearsOfService: number,
  completedProbation: boolean,
): number {
  if (!completedProbation || yearsOfService <= 0) return 0;
  const firstYear = averageMonthlySalary;
  const additionalYears = yearsOfService > 1 ? (averageMonthlySalary / 3) * (yearsOfService - 1) : 0;
  return Math.min(firstYear + additionalYears, averageMonthlySalary * 3);
}

// -- Company Dissolution & Closure -----------------------------------------

export type DissolutionStepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface DissolutionProcess {
  id: string;
  companyId: string;
  resolutionDocumentUrl: string;
  liquidatorId: string;
  publicNoticePublished: boolean;
  noticePublishDate?: Date | string;
  taxAuditCompleted: boolean;
  taxClearanceCertificateUrl?: string;
  deregistrationCompleted: boolean;
  status: DissolutionStepStatus;
  creditorsNotified: boolean;
  creditorClaimDeadline?: Date | string;
  liquidationReportUrl?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TaxClearanceCertificate {
  certificateNumber: string;
  companyId: string;
  auditPeriodYears: 5;
  corporateIncomeTaxPaid: boolean;
  withholdingTaxPaid: boolean;
  vatPaid: boolean;
  issuedAt: Date | string;
  issuedBy: string;
}