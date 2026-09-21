/**
 * @file vat-module.ts
 * @package @ovds/core/vat
 *
 * VatModule — abstract base class for every country-specific VAT module.
 *
 * Hierarchy:
 *   ModuleApp                 ← generic plugin kernel (register/boot/menus/settings)
 *     └── VatModule           ← THIS FILE — adds VAT-specific contracts
 *           └── EtVatModule   ← Ethiopian implementation
 *           └── AeVatModule   ← UAE implementation
 *           └── GbVatModule   ← (future) UK implementation
 *
 * A VatModule:
 *  1. Carries a concrete IVatRuleEngine for its jurisdiction.
 *  2. Declares which report templates it provides.
 *  3. Declares which filing forms (XML/JSON schemas) it supports.
 *  4. Exposes the authority integration spec (base URL, auth method, etc.)
 *  5. Still participates in the standard ModuleApp lifecycle
 *     (register → boot → health) so the kernel can manage it like any other module.
 */
import { ModuleApp, type ModuleAppOptions } from '../module-app';
import type { IVatRuleEngine } from './vat-rule-engine';
import type { VatReportTemplate, VatJurisdictionInfo, FilingFrequency } from './vat-types';
export type AuthorityAuthMethod = 'API_KEY' | 'OAUTH2' | 'BASIC' | 'NONE';
export type FilingChannel = 'PORTAL_UPLOAD' | 'API_DIRECT' | 'EMAIL' | 'MANUAL';
export interface VatAuthoritySpec {
    /** Short stable identifier, e.g. "ERCA", "FTA", "HMRC" */
    id: string;
    name: string;
    /** Base URL of the authority's e-filing API (null if not yet available) */
    apiBaseUrl: string | null;
    authMethod: AuthorityAuthMethod;
    /** Channels through which a return may be submitted */
    filingChannels: FilingChannel[];
    /** Whether sandbox / test environment is supported */
    sandboxSupported: boolean;
    /** Link to the authority's developer / API docs */
    developerDocsUrl?: string;
    /** Any environment variable names needed to connect (never store values here) */
    requiredEnvVars?: string[];
}
export interface VatFilingFormSpec {
    /** Stable form ID, e.g. "VAT201", "FORM-ERCA-02", "VAT100" */
    formId: string;
    label: string;
    /** XML schema path or JSON schema URL/key */
    schemaRef?: string;
    /** Formats in which the completed form can be exported */
    exportFormats: Array<'XML' | 'PDF' | 'JSON' | 'XLSX'>;
    /** Authority version string, e.g. "v3.1" */
    version: string;
    /** Date this form version became effective */
    effectiveFrom: string;
}
export interface VatLocale {
    /** BCP-47 language tag, e.g. "am-ET", "ar-AE", "en-GB" */
    languageTag: string;
    /** Human-readable locale label */
    label: string;
    /** Locale-specific number formatting */
    numberFormat: {
        decimalSeparator: '.' | ',';
        thousandSeparator: ',' | '.' | ' ';
        decimalPlaces: number;
    };
    /** Currency symbol and placement */
    currency: {
        code: string;
        symbol: string;
        symbolPosition: 'BEFORE' | 'AFTER';
    };
    /** Fiscal calendar (Gregorian is the default; Ethiopia uses Ethiopian calendar) */
    calendarSystem: 'GREGORIAN' | 'ETHIOPIAN' | 'HIJRI' | 'OTHER';
    /** Date format string, e.g. "DD/MM/YYYY" */
    dateFormat: string;
}
export interface VatModuleOptions extends ModuleAppOptions {
    /** ISO-3166-1 alpha-2 */
    countryCode: string;
    countryName: string;
    /** Filing frequencies this module supports */
    filingFrequencies: FilingFrequency[];
    /** Authority integration spec */
    authority: VatAuthoritySpec;
    /** Supported locales (first = default) */
    locales: VatLocale[];
    /** Whether this module can be combined with others for multi-jurisdiction */
    supportsMultiJurisdiction?: boolean;
}
export declare abstract class VatModule extends ModuleApp {
    /** ISO-3166-1 alpha-2, e.g. "ET", "AE" */
    readonly countryCode: string;
    readonly countryName: string;
    readonly filingFrequencies: FilingFrequency[];
    readonly authority: VatAuthoritySpec;
    readonly locales: VatLocale[];
    readonly supportsMultiJurisdiction: boolean;
    constructor(options: VatModuleOptions);
    /**
     * Returns the concrete rule engine for this jurisdiction.
     * Called by the VatModuleRegistry after boot().
     */
    abstract ruleEngine(): IVatRuleEngine;
    /**
     * Returns report templates bundled with this module.
     * The VatReportEngine uses these to render VAT return documents.
     */
    abstract reportTemplates(): VatReportTemplate[];
    /**
     * Returns the filing form specifications supported by this module.
     */
    abstract filingForms(): VatFilingFormSpec[];
    /**
     * Returns jurisdiction metadata.
     * Convenience proxy that delegates to the ruleEngine().jurisdiction().
     */
    jurisdictionInfo(): VatJurisdictionInfo;
    /**
     * Returns the default locale for this jurisdiction.
     */
    defaultLocale(): VatLocale;
    /**
     * Validates that all required environment variables for the authority
     * integration are present.  Returns missing var names.
     */
    validateEnvVars(): string[];
}
//# sourceMappingURL=vat-module.d.ts.map