/**
 * @ovds/domains-invoice
 *
 * Backend domain library for the invoice domain.
 * Exports services and types needed by the thin NestJS app module/controllers.
 *
 * Scope: backend (scope:backend, type:domain)
 *
 * What belongs here:
 *  - invoiceService (all business logic for invoices, bills, estimates, payments)
 *  - Dependency interfaces (IinvoiceAccountingDeps, etc.)
 *  - Domain events
 *
 * What does NOT belong here:
 *  - NestJS modules (@Module decorators) — those stay in apps/backend
 *  - Controllers — those stay in apps/backend
 *  - Prisma schema — lives in packages/database/prisma/schema.prisma
 */
export { InvoiceService } from './lib';
export type { CreateInvoiceInput, PaginationQuery, Invoice } from './lib';
export type {
  IinvoiceDeps,
  IinvoiceAccountingDeps,
  IinvoiceEmailDeps,
  IinvoiceIfrs15Deps,
  IinvoiceOfflineDeps,
  IinvoiceQueueDeps,
} from './lib';

// Domain events — strongly-typed payloads + factory helpers
export * from './events';
