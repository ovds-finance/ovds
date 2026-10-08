// apps/shared-domains/accounting/src/income-statement.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient, AccountType } from '@ovds/database';

export interface IncomeStatementReport { reportingPeriod: string; revenue: { items: any[]; total: number }; expenses: { items: any[]; total: number }; grossProfit: number; netIncome: number; currency: string; }

@Injectable()
export class IncomeStatementService {
  async generateStatement(tenantId: string, startDate: Date, endDate: Date): Promise<IncomeStatementReport> {
    const prisma = new PrismaClient();
    const ledgers = await prisma.account.findMany({
      where: { tenantId, type: { in: [AccountType.REVENUE, AccountType.EXPENSE] } },
      include: { journalLine: { where: { journalEntry: { postedAt: { gte: startDate, lte: endDate } } } } }
    });
    const categories: Record<string, { items: any[]; total: number }> = { 
      [AccountType.REVENUE]: { items: [], total: 0 }, 
      [AccountType.EXPENSE]: { items: [], total: 0 } 
    };
    for (const account of ledgers) {
      let net = 0;
      account.journalLine.forEach((line: any) => {
        const d = Number(line.debit); const c = Number(line.credit);
        net += account.type === AccountType.REVENUE ? (c - d) : (d - c);
      });
      categories[account.type].items.push({ code: account.code, name: account.name, balance: Number(net.toFixed(2)) });
      categories[account.type].total += net;
    }
    const revenue = categories[AccountType.REVENUE].total; const expenses = categories[AccountType.EXPENSE].total;
    return { reportingPeriod: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`, revenue: { items: categories[AccountType.REVENUE].items, total: Number(revenue.toFixed(2)) }, expenses: { items: categories[AccountType.EXPENSE].items, total: Number(expenses.toFixed(2)) }, grossProfit: Number(revenue.toFixed(2)), netIncome: Number((revenue - expenses).toFixed(2)), currency: 'USD' };
  }
}
