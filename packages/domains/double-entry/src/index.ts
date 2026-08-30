/**
 * @ovds/domains/double-entry
 * Double-entry general ledger domain library.
 * Chart of Accounts, Journal Entries, Trial Balance, Income Statement, Balance Sheet.
 * Also includes: Automated Ledger Mapping, Fiscal Year Management.
 */
export { DoubleEntryService } from './lib/double-entry.service';
export { LedgerMappingService } from './lib/ledger-mapping.service';
export { FiscalYearService } from './lib/fiscal-year.service';
export type { CreateJournalEntryInput, UpdateJournalEntryInput } from './lib/double-entry.service';
export type {
  LedgerMappingRule,
  MappingResult,
  AutoMapInvoiceInput,
  AutoMapBillInput,
  AutoMapBankTransferInput,
} from './lib/ledger-mapping.service';
export type { FiscalYear, CloseYearInput, OpeningBalance } from './lib/fiscal-year.service';
