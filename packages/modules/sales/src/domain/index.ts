// Centralized domain types & rules for the "Sales, Invoicing, Customers & CRM" module.
// Re-exports the canonical source of truth while the codebase migrates.
export * from '@ovds/domains-sales';
export * as invoices from '@ovds/domains-invoice';

// ModuleApp implementation — registered by ModuleBootstrapService at startup
export { InvoicesModule, createInvoicesModule } from './invoices-module';
