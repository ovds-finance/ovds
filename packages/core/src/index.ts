export * from './kernel/module.interface';
export * from './kernel/module.registry';
export * from './kernel/module-discovery';
export * from './kernel/data-mapping-registry';
export * from './kernel/test-utils';
export * from './kernel/event-helpers';
export * from './kernel/module-bootstrap';
export * from './kernel/module-auto-discovery';
export * from './kernel/app-modules';
export * from './kernel/pipeline-interceptor';
export * from './events/event.interface';
export * from './events/event.bus';
export * from './events/event.dispatcher';
export * from './providers/module.provider';
export * from './providers/core.provider';
export * from './providers/service.provider';
export * from './settings/settings.interface';
export * from './settings/settings.service';
export * from './settings/module.config';
export * from './menu/menu.interface';
export * from './menu/menu.builder';
export * from './constants';
export { ModuleApp } from './module-app';
export type { ModuleAppOptions, ModuleAppInterface, ModuleAppInfo, ModuleAppContainer, ModuleAppEventBus, ModuleAppLogger, ModuleAppRoute, ModuleAppMenuItem, ModuleAppSetting, ModuleAppPermission, ModuleAppHealth, ModuleInstallType } from './module-app';

// ── VAT Declaration engine — re-exported for consumers that import from @ovds/core directly
// Full subpath: @ovds/core/vat  and  @ovds/core/vat/report
export type {
  VatRateType, VatRate, VatContext, VatLineResult, VatResult,
  FilingFrequency, VatFilingPeriod, ComplianceSeverity,
  VatComplianceIssue, VatComplianceResult, VatReturnLine, VatReturnDraft,
  ReportFormat, VatReportTemplate, VatJurisdictionInfo,
  IVatRuleEngine,
  AuthorityAuthMethod, FilingChannel, VatAuthoritySpec,
  VatFilingFormSpec, VatLocale, VatModuleOptions,
  VatModuleEntry, TenantActivation, VatModuleSummary,
  VatRenderContext, VatRenderResult, IVatReportRenderer,
} from './vat/index';
export { AbstractVatRuleEngine }                                   from './vat/vat-rule-engine';
export { VatModule }                                               from './vat/vat-module';
export { VatModuleRegistry, getVatModuleRegistry, resetVatModuleRegistry } from './vat/vat-module-registry';
export { VatReportEngine, getVatReportEngine, resetVatReportEngine }        from './vat/report/vat-report-engine';
