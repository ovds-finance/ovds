export interface CreateInvoiceDto {
  customerId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
  taxRate?: number;
  notes?: string;
  dueDate?: string;
  companyId: string;
}

export interface CreateBillDto {
  vendorId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
  taxRate?: number;
  notes?: string;
  dueDate?: string;
  companyId: string;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}
