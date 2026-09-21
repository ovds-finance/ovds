import { CompanyType as BusinessType, AppEnvironment } from '../types';
import { Item, Invoice, InvoiceItem } from '../types';
import { InventoryMethod, CostedItem, InventoryResult } from './inventory.types';
import { VatSummary } from './vat.types';

export type { InventoryMethod, CostedItem, InventoryResult, VatSummary };

export interface InvoiceQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentSource?: string;
  companyId?: string;
  /** Filter by customer TIN — for B2B VAT invoice lookup */
  customerTin?: string;
  /** Return only overdue invoices (status OVERDUE/PENDING with dueDate < now) */
  overdueOnly?: boolean;
}

export interface PaginatedInvoices {
  invoices: (Invoice & {
    items: (InvoiceItem & { paymentBatchItem?: Item })[];
    payments: Record<string, unknown>[];
    activityLog: Record<string, unknown>[];
  })[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface InvoiceStats {
  thisTotal: number;
  lastTotal: number;
  trend: number;
  paidThis: number;
  /** Alias for paidThis — returned by service as paidCount */
  paidCount: number;
  overdueCount: number;
  overdueAmount: number;
  pendingCount: number;
  pendingAmount: number;
  draftCount: number;
  scheduledCount: number;
  totalCount: number;
  annualRevenue: number;
  avgDaysToPay: number | null;
  // Ethiopian compliance fields (Regulation No. 570/2025 + Proclamation No. 1395/2025)
  vatThreshold: number;
  vatThresholdPct: number;
  vatThresholdStatus: 'BELOW' | 'APPROACHING' | 'EXCEEDED';
  /** 'LARGE' = annual revenue ≥ 1,000,000 ETB; 'SMALL' = below */
  taxpayerCategory: 'LARGE' | 'SMALL';
  vatRegistrationRequired: boolean;
  // MAT (Minimum Alternative Tax) — 2.5% of gross turnover
  matRate: number;
  matPayable: number;
  matApplies: boolean;
}

export interface ovdsSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingAR: number;
  outstandingAP: number;
  cashBalance: number;
  vatPayable: number;
  vatCollected: number;
  vatPaid: number;
  invoiceDraft: number;
  invoiceSent: number;
  invoicePaid: number;
  invoiceOverdue: number;
  collectionRate: number;
  grossMargin: number;
  whtDeducted: number;
  pensionEmployee: number;
  drrfLevy: number;
  // Health/Root aliases
  ar?: number;
  ap?: number;
  cash?: number;
  netPosition?: number;
  revenue?: number;
  expenses?: number;
  overdueInvoices?: number;
  pendingBills?: number;
}

export interface TaxpayerStatus {
  taxpayerCategory: 'A' | 'B';
  annualRevenue: number;
  vatThreshold: number;
  vatThresholdPct: number;
  vatRegistrationRequired: boolean;
  vatThresholdStatus: 'BELOW' | 'APPROACHING' | 'EXCEEDED';
  fiscalYear: string;
  fyStart: string;
  fyEnd: string;
  obligations: string[];
  note: string;
}

export interface BulkSendResult {
  sent: number;
  failed: number;
}

export interface TelecomReceiptResponse {
  status: number;
  raw: string;
  parsed: {
    amount: number | null;
    paidAt: string | null;
    payer: string | null;
    receiver: string | null;
    txnId: string | null;
    service: string | null;
  } | null;
  fromCache: boolean;
  cachedAt?: Date;
}

export interface CompanyUpdateData {
  name?: string;
  subdomain?: string;
  type?: BusinessType;
  environment?: AppEnvironment;
  autoUpdate?: boolean;
  settings?: Record<string, any>;
}

export interface PaymentData {
  amount: number;
  method?: string;
  reference?: string;
  notes?: string;
  paidAt?: string;
}

export type InvoiceWithItems = Invoice & {
  items: (InvoiceItem & { paymentBatchItem?: Item })[];
};

export interface AccountBalancesResponse {
  accounts: import('../types').Account[];
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    income: number;
    expenses: number;
  };
}
