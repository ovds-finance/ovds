export interface ISalesDeps {}

export interface Sale {
  id: string;
  companyId: string;
  customerId: string;
  total: number;
  status: string;
  date: string;
}

export interface SalesSummary {
  totalSales: number;
  totalReturns: number;
  netSales: number;
  invoiceCount: number;
}

export class SalesService {
  constructor(private readonly deps: unknown) {}

  async getSales(params: { companyId?: string; from?: string; to?: string }): Promise<Sale[]> { return []; }
  async getSalesSummary(companyId?: string): Promise<SalesSummary> {
    return { totalSales: 0, totalReturns: 0, netSales: 0, invoiceCount: 0 };
  }
}