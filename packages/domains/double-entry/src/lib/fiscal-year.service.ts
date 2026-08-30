export interface FiscalYear {
  id: string;
  companyId: string;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
  closedAt?: string;
}

export interface CloseYearInput {
  companyId: string;
  year: number;
}

export interface OpeningBalance {
  accountId: string;
  companyId: string;
  year: number;
  balance: number;
}

export class FiscalYearService {
  constructor(private readonly repo: unknown) {}

  async getFiscalYears(companyId?: string): Promise<FiscalYear[]> { return []; }
  async closeYear(input: CloseYearInput): Promise<FiscalYear> {
    return {} as FiscalYear;
  }
  async getOpeningBalances(companyId?: string): Promise<OpeningBalance[]> { return []; }
}