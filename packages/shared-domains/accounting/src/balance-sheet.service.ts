import { Injectable } from '@nestjs/common';
import { PrismaClient, AccountType } from '@ovds/database';

@Injectable()
export class BalanceSheetService {
  async generateStatement(tenantId: string, targetDate: Date): Promise<any> {
    const prisma = new PrismaClient();
    const accountBalances = await prisma.account.findMany({
      where: { type: { in: [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY] } },
      include: {
        journalLine: {
          where: { journalEntry: { postedAt: { lte: targetDate } } },
        },
      },
    });

    const categories: Record<AccountType, { items: any[]; total: number }> = {
      ASSET: { items: [], total: 0 },
      LIABILITY: { items: [], total: 0 },
      EQUITY: { items: [], total: 0 },
      INCOME: { items: [], total: 0 },
      REVENUE: { items: [], total: 0 },
      EXPENSE: { items: [], total: 0 },
    };

    for (const account of accountBalances) {
      let netValue = 0;
      for (const line of account.journalLine) {
        const debit = Number(line.debit);
        const credit = Number(line.credit);
        if (account.type === AccountType.ASSET) { netValue += (debit - credit); }
        else { netValue += (credit - debit); }
      }
      categories[account.type].items.push({ code: account.code, name: account.name, balance: Number(netValue.toFixed(2)) });
      categories[account.type].total += netValue;
    }

    const totalAssets = categories.ASSET.total;
    const totalLiabilitiesAndEquity = categories.LIABILITY.total + categories.EQUITY.total;
    const discrepancy = Math.abs(totalAssets - totalLiabilitiesAndEquity);
    const EPSILON = 0.001;

    return {
      asOfDate: targetDate.toISOString().split('T')[0],
      assets: { items: categories.ASSET.items, total: Number(totalAssets.toFixed(2)) },
      liabilities: { items: categories.LIABILITY.items, total: Number(categories.LIABILITY.total.toFixed(2)) },
      equity: { items: categories.EQUITY.items, total: Number(categories.EQUITY.total.toFixed(2)) },
      isBalanced: discrepancy < EPSILON,
      accountingDiscrepancy: Number(discrepancy.toFixed(2)),
    };
  }
}
