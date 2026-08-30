/**
 * @ovds/features/invoice — local frontend types.
 *
 * Frontend-only view models and UI state shapes.
 * Shared API shapes belong in @ovds/contracts/schemas.
 */

/** Compact invoice row shown in tables and dropdowns */
export interface InvoiceRow {
  id:            string;
  invoiceNumber: string;
  customerName?: string | null;
  date?:         string | null;
  dueDate?:      string | null;
  totalAmount?:  number | null;
  status:        string;
  currencyCode?: string | null;
}

/** Compact bill row */
export interface BillRow {
  id:         string;
  billNumber: string;
  vendorName?: string | null;
  date?:      string | null;
  dueDate?:   string | null;
  totalAmount?: number | null;
  status:     string;
}

/** Compact customer for dropdowns / search */
export interface CustomerOption {
  id:    string;
  name:  string;
  email?: string | null;
  tin?:  string | null;
}

/** Line item used in invoice / bill forms */
export interface InvoiceLineItem {
  id?:          string;
  description:  string;
  quantity:     number;
  unitPrice:    number;
  vatRate:      number;   // 0–100
  vatAmount?:   number;
  lineTotal?:   number;
  itemId?:      string | null;
}

/** VAT / WHT calculation result shape from invoiceTaxApi */
export interface TaxCalculationResult {
  subtotal:   number;
  vatRate?:   number;
  vatAmount?: number;
  drrfAmount?: number;
  whtAmount?: number;
  total:      number;
  currency:   string;
}

/** Delivery mode for universal invoices */
export type InvoiceDeliveryMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';
