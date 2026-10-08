import { Injectable, Logger } from '@nestjs/common';
import { createTenantClient } from '../createTenantClient';

export interface SeedAccountStructure {
  code: string;
  name: string;
  classification: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}

@Injectable()
export class BulkChartSeederService {
  private readonly logger = new Logger(BulkChartSeederService.name);

  /**
   * Seeds an extensive baseline chart of accounts layout for an active tenant workspace
   */
  async seedStandardChartOfAccounts(tenantId: string): Promise<{ seededCount: number }> {
    this.logger.log(`🌱 Injecting extensive accounting baseline matrix for Tenant Context [${tenantId}]`);
    const prisma = createTenantClient(tenantId);

    const accountsMatrix: SeedAccountStructure[] = [
      // 10000 - Asset Classifications (Debit Normal)
      { code: '10100', name: 'Primary Operational Checking Cash', classification: 'ASSET' },
      { code: '10200', name: 'Secure Liquidity Market Savings', classification: 'ASSET' },
      { code: '11100', name: 'Accounts Receivable Clearing Account', classification: 'ASSET' },
      { code: '12100', name: 'Prepaid Corporate Service Expenses', classification: 'ASSET' },
      { code: '15100', name: 'Long-Term Machinery and Equipment Assets', classification: 'ASSET' },

      // 20000 - Liability Classifications (Credit Normal)
      { code: '20100', name: 'Accounts Payable Clearing Ledger', classification: 'LIABILITY' },
      { code: '21200', name: 'Accrued Corporate Salaries and Wages', classification: 'LIABILITY' },
      { code: '22100', name: 'Deferred Unearned Services Revenue', classification: 'LIABILITY' },

      // 30000 - Equity Classifications (Credit Normal)
      { code: '30100', name: 'Common Stock Paid-In Capital', classification: 'EQUITY' },
      { code: '30200', name: 'Accumulated Retained Earnings Index', classification: 'EQUITY' },

      // 40000 - Revenue Classifications (Credit Normal)
      { code: '40100', name: 'SaaS Platform Subscription Fees Revenue', classification: 'REVENUE' },
      { code: '40200', name: 'Professional Services Consulting Revenue', classification: 'REVENUE' },

      // 50000 - Expense Classifications (Debit Normal)
      { code: '50100', name: 'Cloud Infrastructure Computer Rent Costs', classification: 'EXPENSE' },
      { code: '50200', name: 'Marketing and Customer Acquisition Fees', classification: 'EXPENSE' },
      { code: '50300', name: 'General Administrative Operational Overhead', classification: 'EXPENSE' }
    ];

    let itemsSeeded = 0;

    await (prisma as any).$transaction(async (tx: any) => {
      for (const account of accountsMatrix) {
        // Upsert enforces dynamic idempotency across parallel execution scopes [Sec. 42]
        await tx.accountType.upsert({
          where: {
            tenantId_code: {
              tenantId,
              code: account.code
            }
          },
          update: { name: account.name, classification: account.classification },
          create: {
            tenantId,
            code: account.code,
            name: account.name,
            classification: account.classification,
            isActive: true
          }
        });
        itemsSeeded++;
      }
    });

    this.logger.log(`✅ Bulk Chart Seeder finalized. Seeded ${itemsSeeded} baseline account nodes.`);
    return { seededCount: itemsSeeded };
  }
}
