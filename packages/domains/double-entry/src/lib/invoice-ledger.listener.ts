/**
 * InvoiceLedgerListener — Domain Package Note
 *
 * The actual NestJS event listener lives in:
 *   apps/backend/src/ledger/invoice-ledger.listener.ts
 *
 * It is colocated with PrismaService and @nestjs/event-emitter in the
 * backend app, where NestJS DI can resolve both dependencies.
 *
 * This domain package re-exports the event payload types from
 * @ovds/shared (INVOICE_EVENTS, InvoiceSnapshot) so that domain-level
 * observers can subscribe without importing backend source files.
 *
 * Import the event contract from:
 *   import { INVOICE_EVENTS, InvoiceSnapshot } from '@ovds/shared';
 */
