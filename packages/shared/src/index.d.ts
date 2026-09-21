/**
 * @ovds/shared — single export point
 * Consumed by: frontend (React via Vite), backend (NestJS CommonJS), and build tools
 *
 * This package re-exports from @ovds/core (central Core System) plus
 * additional shared utilities that are not part of the core kernel.
 *
 * No extensions — tsc (moduleResolution: node) resolves bare specifiers.
 * Vite resolves via alias + resolve.extensions config in vite.config.ts.
 */
export * from '@ovds/core';
export * from './api-client';
export * from './audit-trail';
export * from './business-roles';
export * from './compliance';
export * from './config';
export * from './constants';
export * from './device-control';
export * from './efy';
export * from './eims';
export * from './fmt';
export * from './health';
export * from './icons';
export * from './integration';
export * from './license-crypto.types';
export * from './license-crypto.web';
export * from './master-compliance-checklist';
export * from './accreditation-checklist';
export * from './monetization';
export * from './notifications';
export * from './offline';
export * from './onboarding';
export * from './ovds/inventory.types';
export * from './ovds/budget.types';
export * from './ovds/tax.types';
export * from './ovds/tax-categories';
export * from './ovds/ovds.types';
export * from './ovds/vat.types';
export * from './ovds/ifrs.types';
export { TaxCalculationType, TAX_CALCULATION_TYPE_LABELS, TaxCalculationInput, TaxCalculationResult, computeTaxFromType, TaxCalculationTypeSchema, calcVAT, calcWHT, getWhtLabel, calculateCorporateBIT, calculateBIT, calcDRRF, fmtETB, isVatRegistered, classifyIfrs18, getEthFiscalYear, getEthFiscalYearDates, getBITFilingDeadline, getNextVatDeadline, getNextDrrfDeadline, getVatPeriod, } from './ovds/tax-calc';
export * from './ovds/money';
export * from './ovds/vat-declaration';
export * from './ovds/property-tax.types';
export * from './ovds/excise-tax.types';
export * from './ovds/stamp-duty.types';
export * from './ovds/wht-certificate.types';
export * from './ovds/stock-valuation.types';
export * from './ovds/schedule-d.types';
export * from './ovds/ledger.types';
export * from './ovds/business-workflow.types';
export * from './ovds/etax-payload.types';
export * from './ovds/financial-statements.types';
export * from './ovds/workflow-task-catalog';
export * from './ovds/report.types';
export * from './ovds/report.builder';
export * from './ovds/ethiopian-compliance-map';
export { TaxTypeCode, IAS12Treatment, IFRS18Category, MoRPortal, AutomationLevel, TaxRule, UNIVERSAL_TAX_RULES, EthiopianSector, SectorTaxOverride, TAX_RULE_OVERRIDES, CompanyTaxProfile, buildDefaultTaxProfile, TaxEngineInput, TaxEngineLineItem, TaxEngineResult, resolveTaxes, GlAccountEntry, TAX_GL_ACCOUNTS, TAX_GL_BY_CODE, TaxAction, TAX_RBAC_MATRIX, canPerformTaxAction, TAX_PERMISSION_MAP, FilingDeadline, getUpcomingDeadlines, DeferredTaxItem, calcDeferredTaxPPE, calcDeferredTaxECL, IAS12Reconciliation, buildIAS12Reconciliation, TAX_SYSTEM_SETTINGS_SCHEMA, getEffectiveTaxRate, validateTaxProfile, } from './ovds/universal-tax-config';
export * from './payment-gateway';
export * from './pipeline';
export * from './rbac';
export * from './release';
export * from './settings';
export * from './settings-types';
export * from './subscription-update';
export * from './tax-invoice-qr';
export * from './types';
export * from './utils';
export * from './version';
export * from './auth';
export * from './appstore';
export * from './audit';
export * from './dashboard';
export * from './hr';
export * from './ingestion';
export * from './fiscal/hardware-types';
export * from './fiscal/sector-kernel';
export * from './security';
export * from './exchange-transformer';
export * from './invoice-events';
//# sourceMappingURL=index.d.ts.map