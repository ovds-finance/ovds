// accounting library exports
export { TaxRateService } from "./tax-rate.service";
export type {
  CreateTaxRateDto,
  BulkToggleDto,
  BulkDeleteDto,
  TaxRatePrisma,
  TaxRateAuditLogger,
} from "./tax-rate.service";

// Ledger Observer — Ovds SaaS domain event → GL posting bridge
export { LedgerObserver } from "./ledger-observer";
export type {
  LedgerPersistence,
  JournalEntryInput,
  JournalLineInput,
} from "./ledger-observer";
