/**
 * @ovds/domains-general-ledger-compliance
 * AABE/IFRS compliance control tower — aggregates accounting, tax, and reporting
 * into a unified dashboard, statutory reports, audit-readiness score, and dual-ledger status.
 */
export { GeneralLedgerComplianceService } from './lib/general-ledger-compliance.service';
export type {
  IGlComplianceDeps,
  IGlAccountingDeps,
  IGlTaxDeps,
  IGlReportDeps,
} from './lib/general-ledger-compliance.service';
