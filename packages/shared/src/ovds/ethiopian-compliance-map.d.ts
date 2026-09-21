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
export interface IFRSModuleMapping {
    standard: string;
    title: string;
    modules: string[];
    models: string[];
    keyCompliance: string[];
    hasSmeSimplification: boolean;
    ethiopianNote?: string;
}
export declare const IFRS_MODULE_MAPPINGS: IFRSModuleMapping[];
export interface CommercialCodeMapping {
    /** Article or part of Commercial Code */
    provision: string;
    title: string;
    /** How OVDS implements the requirement */
    implementation: string;
    /** OVDS modules/models involved */
    modules: string[];
}
export declare const COMMERCIAL_CODE_MAPPINGS: CommercialCodeMapping[];
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
export declare const MOR_MANDATE_MAPPINGS: MoRMandateMapping[];
export type AABEFramework = 'FULL_IFRS' | 'IFRS_FOR_SMES' | 'EFRS_SMALL' | 'EFRS_MICRO';
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
export declare const AABE_FRAMEWORK_THRESHOLDS: Record<AABEFramework, AABEClassification>;
/**
 * Determine the applicable AABE financial reporting framework for an entity.
 *
 * @param annualTurnoverEtb  Annual gross turnover in ETB
 * @param isPublicInterestEntity  True for banks, insurers, listed companies, NBE-licensed entities
 */
export declare function selectAABEFramework(annualTurnoverEtb: number, isPublicInterestEntity: boolean): AABEFramework;
export type PenaltyType = 'LATE_FILING' | 'LATE_PAYMENT' | 'NON_FILING' | 'FALSE_RETURN' | 'FAILURE_TO_REGISTER' | 'SRM_UNREGISTERED';
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
 * Calculate MoR penalties and interest for late or non-filing.
 * Proclamation No. 983/2016 (Tax Administration Procedure Proclamation).
 */
export declare function calculateMoRPenalty(input: PenaltyCalcInput): PenaltyCalcResult;
export type IFRSFrameworkLevel = 'ALL' | 'EFRS_SMALL' | 'IFRS_SMES' | 'FULL_IFRS';
export interface IFRSFeatureGate {
    feature: string;
    description: string;
    minimumFramework: IFRSFrameworkLevel;
    ovdsModule: string;
    proclamationOrStandard: string;
}
export declare const IFRS_FEATURE_GATES: IFRSFeatureGate[];
/**
 * Get all features required (or available) for a given AABE framework level.
 * Returns features whose minimumFramework is AT or BELOW the given level.
 *
 * Framework hierarchy: EFRS_MICRO < EFRS_SMALL < IFRS_SMES < FULL_IFRS
 */
export declare function getFeaturesForFramework(framework: AABEFramework): IFRSFeatureGate[];
export interface ComplianceCheckItem {
    id: string;
    category: 'TAX' | 'IFRS' | 'COMMERCIAL_CODE' | 'LABOUR' | 'CUSTOMS';
    title: string;
    status: 'COMPLIANT' | 'PENDING' | 'OVERDUE' | 'NOT_APPLICABLE' | 'NEEDS_REVIEW';
    dueDate?: string;
    daysUntilDue?: number;
    proclamationRef: string;
    ovdsLink?: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
export interface ComplianceProfile {
    companyId: string;
    annualTurnoverEtb: number;
    isVatRegistered: boolean;
    isPublicInterestEntity: boolean;
    currentPeriod: string;
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
export declare function generateComplianceChecklist(profile: ComplianceProfile, now?: Date): ComplianceCheckItem[];
//# sourceMappingURL=ethiopian-compliance-map.d.ts.map