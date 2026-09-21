// Centralized domain types & rules for the "Banking, Transactions & Reconciliation" module.
// Re-exports the canonical source of truth while the codebase migrates.
export * from '@ovds/domains-banking';

// ModuleApp implementation — Ovds SaaS Banking & Feeds
export { BankingModule, createBankingModule, BANKING_EVENTS } from './banking-module';
