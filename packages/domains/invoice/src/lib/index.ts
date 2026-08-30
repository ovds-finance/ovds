// @ovds/domains/invoice lib exports
export { InvoiceService } from './invoice.service';
export type { CreateInvoiceInput, PaginationQuery, Invoice } from './invoice.service';
export type {
  IinvoiceDeps,
  IinvoiceAccountingDeps,
  IinvoiceEmailDeps,
  IinvoiceIfrs15Deps,
  IinvoiceOfflineDeps,
  IinvoiceQueueDeps,
} from './invoice.deps';
