// Named exports for all tax API functions and objects — explicit for bundler static analysis
export {
  calculateTot,
  triggerAutoComputeTot,
  recordTaxFiling,
  recordBITFiling,
  recordDRRFRemittance,
  recordWHTRemittance,
  generateETaxPayload,
  exportETaxJson,
  submitToETax,
  syncBankTransactions,
  calculateERCAPenalty,
  updateCompanyTaxProfile,
  resolveTaxesForTransaction,
  vatApi,
  totApi,
  bitApi,
  scheduleD,
  whtApi,
  drrfApi,
  payeApi,
  pensionApi,
  exciseTaxApi,
  stampDutyApi,
  propertyTaxApi,
  universalTaxConfigApi,
  taxDashboardApi,
  etaxApi,
  taxVaultApi,
  taxFilingsApi,
  taxPaymentRefApi,
} from './services/taxApi';

export type { VatFilingParams } from './services/taxApi';
export * from './types/index';

// ── Frontend module plugin ─────────────────────────────────────────────────────
export { VatPluginConfig } from './plugin';
