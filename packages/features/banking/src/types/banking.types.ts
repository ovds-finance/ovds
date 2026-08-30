/**
 * @ovds/features/banking types
 *
 * Shared TypeScript interfaces for the banking domain.
 */

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: string;
  reference?: string | null;
  bankName?: string | null;
  counterparty?: string | null;
  matchedInvoiceId?: string | null;
  matchedBillId?: string | null;
  matchMethod?: string | null;
  matchScore?: number;
  notes?: string | null;
  createdAt?: string;
}

export interface TransactionListParams {
  companyId?: string | null;
  bankAccountId?: string;
  status?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
