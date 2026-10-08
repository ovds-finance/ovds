import { Injectable } from '@nestjs/common';
import { PrismaClient, AccountType, AccountCategory } from '@ovds/database';

export interface CashFlowReport {
  operatingActivities: { items: any[]; subtotal: number };
  investingActivities: { items: any[]; subtotal: number };
  financingActivities: { items: any[]; subtotal: number };
  netCashIncrease: number;
}

@Injectable()
export class CashFlowService {
  async computeStatement(tenantId: string, startDate: Date, endDate: Date): Promise<CashFlowReport> {
    const prisma = new PrismaClient();
    const lines = await prisma.journalLine.findMany({
      where: { journalEntry: { postedAt: { gte: startDate, lte: endDate } } },
      include: { account: true }
    });
    const categories = { OPERATING: { items: [] as any[], total: 0 }, INVESTING: { items: [] as any[], total: 0 }, FINANCING: { items: [] as any[], total: 0 } };
    for (const line of lines) {
      const isCash = line.account.code === '10100';
      if (!isCash) continue;
      const delta = Number(line.debit) - Number(line.credit);
      const accountType = line.account.type;
      let target: 'OPERATING' | 'INVESTING' | 'FINANCING' = 'OPERATING';
      if (accountType === AccountType.ASSET && line.account.code.startsWith('15')) target = 'INVESTING';
      else if (accountType === AccountType.LIABILITY || accountType === AccountType.EQUITY) target = 'FINANCING';
      categories[target].items.push({ memo: line.description || 'Liquidity entry', amount: Number(delta.toFixed(2)) });
      categories[target].total += delta;
    }
    return {
      operatingActivities: { items: categories.OPERATING.items, subtotal: Number(categories.OPERATING.total.toFixed(2)) },
      investingActivities: { items: categories.INVESTING.items, subtotal: Number(categories.INVESTING.total.toFixed(2)) },
      financingActivities: { items: categories.FINANCING.items, subtotal: Number(categories.FINANCING.total.toFixed(2)) },
      netCashIncrease: Number((categories.OPERATING.total + categories.INVESTING.total + categories.FINANCING.total).toFixed(2))
    };
  }
}
