/**
 * @file vat-rule-engine.ts
 * @package @ovds/core/vat
 *
 * VatRuleEngine — the abstract interface and base class every country
 * VAT rule-set must implement.
 *
 * Inspired by Akaunting's "thick library, thin app" principle:
 *  - The ENGINE defines the contract.
 *  - Country MODULES provide the implementation.
 *  - The ORCHESTRATOR selects the right module at runtime.
 *
 * No NestJS, no Prisma, no HTTP — pure domain logic.
 */
import type { VatContext, VatResult, VatLineResult, VatRate, VatFilingPeriod, VatComplianceResult, VatComplianceIssue, VatReturnDraft, VatJurisdictionInfo, VatRateType, FilingFrequency } from './vat-types';
/**
 * Every pluggable country VAT rule-set implements this interface.
 *
 * Method contract:
 *  calculate()   — pure arithmetic; must be deterministic and side-effect-free
 *  validate()    — rules-based compliance check; may be async for DB look-ups
 *  periods()     — generate filing periods for a given calendar year
 *  buildReturn() — assemble the official authority return from ledger data
 *  jurisdiction()— static metadata about the jurisdiction
 */
export interface IVatRuleEngine {
    readonly countryCode: string;
    readonly ruleSetVersion: string;
    /** Calculate VAT for a single transaction context */
    calculate(ctx: VatContext): VatResult;
    /** Validate a transaction or draft return for compliance */
    validate(ctx: VatContext): Promise<VatComplianceResult>;
    /** Generate all filing periods for the given calendar year */
    periods(year: number, frequency?: FilingFrequency): VatFilingPeriod[];
    /** Build a draft VAT return from raw ledger totals */
    buildReturn(companyId: string, periodKey: string, inputVat: number, outputVat: number, currency: string): VatReturnDraft;
    /** Retrieve current active rates */
    activeRates(asOfDate?: string): VatRate[];
    /** Jurisdiction metadata */
    jurisdiction(): VatJurisdictionInfo;
}
/**
 * AbstractVatRuleEngine
 *
 * Provides:
 *  • Rate resolution helpers (resolveRate, resolveRateForCode)
 *  • Shared calculation skeleton (applyRates)
 *  • Default compliance rules (override validateCustomRules for jurisdiction-specific rules)
 *  • Period-generation utility (generatePeriods)
 *  • Logging stub (override with real logger)
 */
export declare abstract class AbstractVatRuleEngine implements IVatRuleEngine {
    abstract readonly countryCode: string;
    abstract readonly ruleSetVersion: string;
    abstract jurisdiction(): VatJurisdictionInfo;
    /** Return ALL rate definitions for this jurisdiction (active + historical) */
    protected abstract allRates(): VatRate[];
    /** Jurisdiction-specific compliance rules — supplement the base rules */
    protected abstract validateCustomRules(ctx: VatContext): Promise<VatComplianceIssue[]>;
    activeRates(asOfDate?: string): VatRate[];
    protected resolveRate(rateType: VatRateType, asOfDate?: string): VatRate | undefined;
    protected resolveRateForCode(hsCode: string, asOfDate?: string): VatRate | undefined;
    /**
     * Default implementation: resolve the applicable rate via HS code (if
     * present), then apply it straightforwardly.  Subclasses can override
     * for more complex multi-line logic (e.g. UAE mixed-rate invoices).
     */
    calculate(ctx: VatContext): VatResult;
    /** Build the line items from a resolved set of rates */
    protected applyRates(ctx: VatContext, rates: VatRate[], warnings: string[]): VatLineResult[];
    protected assembleResult(ctx: VatContext, lines: VatLineResult[], warnings: string[]): VatResult;
    protected buildZeroResult(ctx: VatContext, warnings: string[]): VatResult;
    validate(ctx: VatContext): Promise<VatComplianceResult>;
    private validateBaseRules;
    /**
     * Utility for subclasses: generates monthly, quarterly, semi-annual or
     * annual VatFilingPeriod objects for the given year.
     *
     * `deadlineOffsetDays` — number of days after period end that the return is due.
     */
    protected generatePeriods(year: number, frequency: FilingFrequency, deadlineOffsetDays: number): VatFilingPeriod[];
    periods(year: number, frequency?: FilingFrequency): VatFilingPeriod[];
    buildReturn(companyId: string, periodKey: string, inputVat: number, outputVat: number, currency: string): VatReturnDraft;
}
//# sourceMappingURL=vat-rule-engine.d.ts.map