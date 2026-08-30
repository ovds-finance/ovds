import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient, type BankStatementLine } from '@ovds/database';

export interface MatchStatementLineInput {
  statementLineId: string;
  ledgerEntryId: string;
  userId?: string;
}

export interface UnmatchedStatementLinesQuery {
  bankAccountId: string;
  companyId: string;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private prisma: PrismaClient) {}

  async matchStatementLine(input: MatchStatementLineInput) {
    const { statementLineId, ledgerEntryId, userId } = input;

    return this.prisma.$transaction(async (tx) => {
      const statementLine = await tx.bankStatementLine.findUnique({
        where: { id: statementLineId },
      });

      if (!statementLine) {
        throw new NotFoundException('Bank statement line not found');
      }

      if (statementLine.matched) {
        throw new BadRequestException('Statement line is already matched');
      }

      const ledgerEntry = await tx.journalEntry.findUnique({
        where: { id: ledgerEntryId },
      });

      if (!ledgerEntry) {
        throw new NotFoundException('Ledger entry not found');
      }

      await tx.bankStatementLine.update({
        where: { id: statementLineId },
        data: {
          matched: true,
          matchedEntryId: ledgerEntryId,
        },
      });

      await tx.journalEntry.update({
        where: { id: ledgerEntryId },
        data: {
          reference: 'RECONCILED',
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: statementLine.companyId,
          action: 'RECONCILE',
          userId: userId ?? statementLine.companyId,
          details: JSON.stringify({
            entityType: 'BankStatementLine',
            entityId: statementLineId,
            ledgerEntryId,
            amount: statementLine.amount.toString(),
          }),
        },
      });

      return { matched: true, statementLineId, ledgerEntryId };
    });
  }

  async getUnmatchedStatementLines(query: UnmatchedStatementLinesQuery): Promise<BankStatementLine[]> {
    const { bankAccountId, companyId } = query;

    return this.prisma.bankStatementLine.findMany({
      where: {
        bankAccountId,
        companyId,
        matched: false,
      },
      orderBy: { date: 'asc' },
    });
  }

  async getReconciliationSummary(bankAccountId: string, companyId: string) {
    const [total, matched, unmatched] = await Promise.all([
      this.prisma.bankStatementLine.count({
        where: { bankAccountId, companyId },
      }),
      this.prisma.bankStatementLine.count({
        where: { bankAccountId, companyId, matched: true },
      }),
      this.prisma.bankStatementLine.count({
        where: { bankAccountId, companyId, matched: false },
      }),
    ]);

    const totalAmount = await this.prisma.bankStatementLine.aggregate({
      where: { bankAccountId, companyId },
      _sum: { amount: true },
    });

    const matchedAmount = await this.prisma.bankStatementLine.aggregate({
      where: { bankAccountId, companyId, matched: true },
      _sum: { amount: true },
    });

    return {
      total,
      matched,
      unmatched,
      totalAmount: Number(totalAmount._sum.amount || 0),
      matchedAmount: Number(matchedAmount._sum.amount || 0),
      completionPercentage: total > 0 ? Math.round((matched / total) * 100) : 0,
    };
  }
}
