export interface IinvoiceDeps {}
export interface IinvoiceAccountingDeps {}
export interface IinvoiceEmailDeps {}
export interface IinvoiceIfrs15Deps {}
export interface IinvoiceOfflineDeps {}
export interface IinvoiceQueueDeps {}

export interface CreateInvoiceInput {
  customerId: string;
  companyId: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  dueDate: string;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  companyId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  companyId: string;
  total: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export class InvoiceService {
  constructor(private readonly deps: unknown) {}

  async createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
    return data as unknown as Invoice;
  }
  async getInvoices(params: PaginationQuery): Promise<Invoice[]> { return []; }
  async getInvoice(id: string): Promise<Invoice | null> { return null; }
  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    return data as Invoice;
  }
  async removeInvoice(id: string): Promise<void> {}
}