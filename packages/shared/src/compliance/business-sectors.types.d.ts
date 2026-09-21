/**
 * @ovds/shared — Ethiopian Business Sectors & Regulatory Types
 *
 * Covers the 4-sectors classification (Primary, Secondary, Tertiary, Quaternary),
 * business entity types, capital requirements, and sector-specific competency certificates.
 */
export type BusinessEntityType = 'SOLE_PROPRIETORSHIP' | 'PLC' | 'ONE_MEMBER_PLC' | 'SHARE_COMPANY';
export interface EntityCharacteristics {
    entityType: BusinessEntityType;
    shareholderCount?: number;
    hasLimitedLiability: boolean;
    requiresAuditor: boolean;
    minimumCapitalUSD?: number;
}
export declare const ENTITY_CHARACTERISTICS: Record<BusinessEntityType, EntityCharacteristics>;
export interface CapitalRequirement {
    entityType: BusinessEntityType;
    projectStructure: 'WHOLLY_FOREIGN_OWNED' | 'JOINT_VENTURE' | 'TECHNICAL_CONSULTANCY';
    minimumCapitalUSD: number;
}
export declare const CAPITAL_REQUIREMENTS: CapitalRequirement[];
export type SectorClassification = 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'QUATERNARY';
export type PrimarySubSector = 'AGRICULTURE_AGRIBUSINESS' | 'LIVESTOCK_PASTORALISM' | 'MINING_QUARRYING' | 'FORESTRY_FISHING';
export type SecondarySubSector = 'CONSTRUCTION_REAL_ESTATE' | 'TEXTILE_APPAREL_LEATHER' | 'FOOD_PROCESSING_BEVERAGES' | 'CHEMICALS_CONSTRUCTION_MATERIALS';
export type TertiarySubSector = 'TRANSPORT_LOGISTICS_AVIATION' | 'FINANCIAL_SERVICES_BANKING' | 'WHOLESALE_RETAIL_TRADE' | 'TOURISM_HOSPITALITY' | 'HEALTHCARE_EDUCATION';
export type QuaternarySubSector = 'TELECOMMUNICATIONS' | 'INFORMATION_COMMUNICATIONS_TECHNOLOGY' | 'MEDIA_ENTERTAINMENT';
export type BusinessSubSector = PrimarySubSector | SecondarySubSector | TertiarySubSector | QuaternarySubSector;
export interface EthiopianEconomicSector {
    classification: SectorClassification;
    subSector: BusinessSubSector;
    name: string;
    description: string;
    gdpContribution?: number;
    employmentPercentage?: number;
}
export declare const ETHIOPIAN_ECONOMIC_SECTORS: EthiopianEconomicSector[];
export type CompetencyCertificateType = 'AGRICULTURE_AUTHORIZATION' | 'COFFEE_EXPORT_CLEARANCE' | 'MINING_EIA_CLEARANCE' | 'MANUFACTURING_INSPECTION' | 'CONSTRUCTION_GRADE_LICENSE' | 'BANKING_LICENSE' | 'TOURISM_SAFETY_CLEARANCE' | 'ICT_OPERATOR_LICENSE' | 'ICT_DATA_PRIVACY_COMPLIANCE' | 'ICT_SYSTEM_SAFETY_AUDIT';
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
export type InvestmentRestrictionLevel = 'STATE_RESERVED' | 'DOMESTIC_ONLY' | 'JOINT_VENTURE_ACCESSIBLE';
export interface RestrictedSector {
    sector: BusinessSubSector | string;
    restrictionLevel: InvestmentRestrictionLevel;
    foreignEquityCapPercent?: number;
    notes?: string;
}
export declare const INVESTMENT_NEGATIVE_LIST: RestrictedSector[];
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
export declare function calculateSeverancePay(averageMonthlySalary: number, yearsOfService: number, completedProbation: boolean): number;
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
//# sourceMappingURL=business-sectors.types.d.ts.map