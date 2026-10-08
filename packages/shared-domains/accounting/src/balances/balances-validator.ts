import { PrismaClient, Prisma, AccountType, JournalEntryStatus } from '@ovds/database';

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  currency: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  isDebitBalance: boolean;
}

export interface TrialBalanceEntry extends AccountBalance {
  level: number;
  parentId: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  accountId?: string;
  journalEntryId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  accountId?: string;
}

export class BalancesValidator {
  constructor(private prisma: PrismaClient) {}

  async validateDoubleEntry(tenantId: string, journalEntryId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const lines = await this.prisma.journalLine.findMany({
      where: { journalEntryId, tenantId },
      select: { debit: true, credit: true, accountId: true },
    });

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      totalDebit += debit;
      totalCredit += credit;

      if (debit > 0 && credit > 0) {
        warnings.push({
          code: 'BOTH_DEBIT_CREDIT',
          message: `Line for account ${line.accountId} has both debit and credit amounts`,
          accountId: line.accountId,
        });
      }
    }

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      errors.push({
        code: 'UNBALANCED_ENTRY',
        message: `Journal entry ${journalEntryId} is unbalanced: Debits (${totalDebit}) ≠ Credits (${totalCredit})`,
        journalEntryId,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async validateAccountBalances(tenantId: string, asOfDate: Date): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const balances = await this.getAccountBalances(tenantId, asOfDate);

    for (const balance of balances) {
      const expectedBalance = this.getExpectedBalance(balance.accountType, balance.balance);

      if (balance.accountType === AccountType.ASSET || balance.accountType === AccountType.EXPENSE) {
        if (balance.balance < 0) {
          warnings.push({
            code: 'NEGATIVE_DEBIT_BALANCE',
            message: `Account ${balance.accountCode} (${balance.accountName}) has negative balance: ${balance.balance}`,
            accountId: balance.accountId,
          });
        }
      } else {
        if (balance.balance > 0) {
          warnings.push({
            code: 'POSITIVE_CREDIT_BALANCE',
            message: `Account ${balance.accountCode} (${balance.accountName}) has positive balance: ${balance.balance}`,
            accountId: balance.accountId,
          });
        }
      }
    }

    const totalDebits = balances
      .filter(b => b.isDebitBalance)
      .reduce((sum, b) => sum + Math.abs(b.balance), 0);

    const totalCredits = balances
      .filter(b => !b.isDebitBalance)
      .reduce((sum, b) => sum + Math.abs(b.balance), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push({
        code: 'TRIAL_BALANCE_UNBALANCED',
        message: `Trial balance unbalanced: Total Debits (${totalDebits}) ≠ Total Credits (${totalCredits})`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async getAccountBalances(tenantId: string, asOfDate: Date): Promise<AccountBalance[]> {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        tenantId,
        journalEntry: {
          status: JournalEntryStatus.POSTED,
          postedAt: { lte: asOfDate },
        },
      },
      include: {
        account: {
          select: { id: true, code: true, name: true, type: true, currency: true },
        },
      },
    });

    const balanceMap = new Map<string, AccountBalance>();

    for (const line of lines) {
      const account = line.account;
      const existing = balanceMap.get(account.id) || {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        currency: account.currency,
        debitTotal: 0,
        creditTotal: 0,
        balance: 0,
        isDebitBalance: false,
      };

      existing.debitTotal += Number(line.debit);
      existing.creditTotal += Number(line.credit);
      existing.balance = existing.debitTotal - existing.creditTotal;
      existing.isDebitBalance = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;

      balanceMap.set(account.id, existing);
    }

    return Array.from(balanceMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  async getTrialBalance(tenantId: string, asOfDate: Date): Promise<TrialBalanceEntry[]> {
    const balances = await this.getAccountBalances(tenantId, asOfDate);

    const accounts = await this.prisma.account.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, parentId: true },
    });

    const parentMap = new Map(accounts.map(a => [a.id, a.parentId]));

    return balances.map(b => ({
      ...b,
      level: this.calculateLevel(b.accountId, parentMap),
      parentId: parentMap.get(b.accountId) || null,
    }));
  }

  private calculateLevel(accountId: string, parentMap: Map<string, string | null>): number {
    let level = 0;
    let current = parentMap.get(accountId);
    while (current) {
      level++;
      current = parentMap.get(current);
    }
    return level;
  }

  private getExpectedBalance(accountType: AccountType, balance: number): number {
    const isDebitNature = accountType === AccountType.ASSET || accountType === AccountType.EXPENSE;
    return isDebitNature ? Math.abs(balance) : -Math.abs(balance);
  }
}
