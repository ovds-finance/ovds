/**
 * @file vat-types.ts
 * @package @ovds/core/vat
 *
 * Canonical type contracts for the OVDS modular VAT engine.
 *
 * Design principles
 * ─────────────────
 * 1. EVERY jurisdiction rule lives in its own VatModule package.
 * 2. This file only defines the SHAPES — no logic, no Prisma, no NestJS.
 * 3. Country modules depend on this file; this file depends on nothing.
 */
export type VatRateType = 'STANDARD' | 'REDUCED' | 'ZERO_RATED' | 'EXEMPT' | 'SPECIAL';
export interface VatRate {
    /** ISO-3166-1 alpha-2 country code, e.g. "ET", "AE", "GB" */
    countryCode: string;
    /** Human label, e.g. "Standard Rate" */
    label: string;
    rateType: VatRateType;
    /** Percentage as decimal — 15 means 15%, not 0.15 */
    rate: number;
    /** Optional HSN/HS-code or tax-category code this rate applies to */
    applicableCodes?: string[];
    /** Effective from this ISO date string */
    effectiveFrom: string;
    /** Null = still active */
    effectiveTo?: string | null;
}
export interface VatContext {
    /** Tenant / company identifier */
    companyId: string;
    /** ISO-3166-1 alpha-2 — the jurisdiction whose rules should apply */
    countryCode: string;
    /** Transaction date in YYYY-MM-DD */
    transactionDate: string;
    /** Gross amount before VAT */
    subtotal: number;
    /** Currency code, e.g. "ETB", "AED", "USD" */
    currency: string;
    /** Optional HS tariff or product-category code for rate look-up */
    hsCode?: string;
    /** Whether this is an import (changes some jurisdiction rules) */
    isImport?: boolean;
    /** Whether the counterparty is a registered VAT vendor/supplier */
    isRegisteredCounterparty?: boolean;
    /** Whether the supply is for export */
    isExport?: boolean;
    /** Reverse-charge flag (applicable in UAE, EU, etc.) */
    reverseCharge?: boolean;
    /** Arbitrary extra metadata a jurisdiction rule may need */
    meta?: Record<string, unknown>;
}
export interface VatLineResult {
    /** Description, e.g. "Standard VAT @ 15%" */
    description: string;
    rateType: VatRateType;
    /** Applied rate as percentage */
    rate: number;
    /** Tax base (may differ from subtotal after exemptions) */
    taxableAmount: number;
    /** Calculated VAT amount */
    vatAmount: number;
}
export interface VatResult {
    countryCode: string;
    subtotal: number;
    totalVat: number;
    grandTotal: number;
    currency: string;
    lines: VatLineResult[];
    /** Effective combined rate (totalVat / subtotal * 100) */
    effectiveRate: number;
    /** Whether reverse-charge was applied */
    reverseChargeApplied: boolean;
    /** The rate-type bucket for the dominant line */
    dominantRateType: VatRateType;
    /** ISO timestamp when the calculation was performed */
    calculatedAt: string;
    /** Any warnings (e.g. "HS code not recognised — standard rate applied") */
    warnings?: string[];
}
export type FilingFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
export interface VatFilingPeriod {
    /** Unique period key, e.g. "2025-Q1", "2025-07" */
    periodKey: string;
    label: string;
    frequency: FilingFrequency;
    /** YYYY-MM-DD — first day of the period */
    startDate: string;
    /** YYYY-MM-DD — last day of the period */
    endDate: string;
    /** YYYY-MM-DD — statutory submission deadline */
    dueDate: string;
    /** Whether this period is currently open for filing */
    isOpen: boolean;
}
export type ComplianceSeverity = 'ERROR' | 'WARNING' | 'INFO';
export interface VatComplianceIssue {
    code: string;
    severity: ComplianceSeverity;
    message: string;
    field?: string;
    /** Optional link to the specific regulation article */
    regulationRef?: string;
}
export interface VatComplianceResult {
    passed: boolean;
    issues: VatComplianceIssue[];
    /** The rule-set version checked against */
    ruleSetVersion: string;
    checkedAt: string;
}
export interface VatReturnLine {
    boxCode: string;
    label: string;
    amount: number;
    taxAmount?: number;
    notes?: string;
}
export interface VatReturnDraft {
    countryCode: string;
    periodKey: string;
    companyId: string;
    /** Lines matching the official authority form boxes */
    lines: VatReturnLine[];
    /** Net VAT payable (positive = owe, negative = refund) */
    netVatPayable: number;
    currency: string;
    preparedAt: string;
    /** Serialised representation of the authority filing format */
    formData?: Record<string, unknown>;
}
export type ReportFormat = 'PDF' | 'XLSX' | 'XML' | 'JSON' | 'CSV';
export interface VatReportTemplate {
    /** Stable unique id, e.g. "et-vat-return-form", "ae-vat-return-201" */
    id: string;
    label: string;
    description: string;
    /** Formats this template can produce */
    formats: ReportFormat[];
    /** ISO-3166-1 alpha-2 — the country this template targets */
    countryCode: string;
    /** Version tag for the official authority form, e.g. "VAT201-v3" */
    formVersion: string;
}
export interface VatJurisdictionInfo {
    /** ISO-3166-1 alpha-2 */
    countryCode: string;
    countryName: string;
    /** Official authority name, e.g. "Ethiopian Revenue and Customs Authority" */
    authorityName: string;
    /** Short authority abbreviation, e.g. "ERCA", "FTA" */
    authorityAbbrev: string;
    /** Link to official authority portal */
    authorityUrl?: string;
    /** Primary currency for this jurisdiction */
    currency: string;
    /** Currently active rates at the module level */
    rates: VatRate[];
    /** Filing frequencies available */
    filingFrequencies: FilingFrequency[];
    /** Whether e-filing is mandatory */
    eFilingMandatory: boolean;
    /** Minimum annual turnover for VAT registration (in jurisdiction currency) */
    registrationThreshold: number;
}
//# sourceMappingURL=vat-types.d.ts.map