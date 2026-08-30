export class AccountingService {
  constructor(private readonly repo: unknown) {}

  async getAccounts(companyId?: string): Promise<unknown[]> { return []; }
  async getAccountBalances(companyId?: string): Promise<unknown[]> { return []; }
  async getTrialBalance(params: { companyId?: string; from?: string; to?: string }): Promise<unknown> { return null; }
  async getBalanceSheet(companyId: string, endDate: string): Promise<unknown> { return null; }
  async getProfitAndLoss(companyId: string, startDate: string, endDate: string): Promise<unknown> { return null; }
  async getCashFlow(companyId: string, startDate: string, endDate: string): Promise<unknown> { return null; }
}