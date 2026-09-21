/**
 * @file packages/core/src/vat/index.ts
 *
 * Public barrel for the @ovds/core/vat subpath.
 *
 * Usage (after package.json exports map is updated):
 *   import type { VatContext, VatResult } from '@ovds/core/vat';
 *   import { VatModule }                  from '@ovds/core/vat';
 *   import { VatModuleRegistry }          from '@ovds/core/vat';
 *
 * Report-engine sub-barrel:
 *   import { VatReportEngine }            from '@ovds/core/vat/report';
 */
export type { VatRateType, VatRate, VatContext, VatLineResult, VatResult, FilingFrequency, VatFilingPeriod, ComplianceSeverity, VatComplianceIssue, VatComplianceResult, VatReturnLine, VatReturnDraft, ReportFormat, VatReportTemplate, VatJurisdictionInfo, } from './vat-types';
export type { IVatRuleEngine } from './vat-rule-engine';
export { AbstractVatRuleEngine } from './vat-rule-engine';
export type { AuthorityAuthMethod, FilingChannel, VatAuthoritySpec, VatFilingFormSpec, VatLocale, VatModuleOptions, } from './vat-module';
export { VatModule } from './vat-module';
export type { VatModuleEntry, TenantActivation, VatModuleSummary, } from './vat-module-registry';
export { VatModuleRegistry, getVatModuleRegistry, resetVatModuleRegistry, } from './vat-module-registry';
export type { VatRenderContext, VatRenderResult, IVatReportRenderer, } from './report/vat-report-engine';
//# sourceMappingURL=index.d.ts.map