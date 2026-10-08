import { Injectable } from '@nestjs/common';
import { PrismaClient, AccountType, AccountCategory } from '@ovds/database';

@Injectable()
export class TenantProvisioningService {
  private prisma = new PrismaClient();

  async provisionNewTenant(subdomain: string, name: string): Promise<string> {
    return await this.prisma.$transaction(async (tx) => {
      const existingTenant = await tx.tenant.findUnique({ where: { subdomain } });
      if (existingTenant) {
        throw new Error(`The subdomain ${subdomain} is already registered.`);
      }

      const newTenant = await tx.tenant.create({ data: { subdomain, name } });
      const tenantId = newTenant.id;

      const starterAccounts = [
        { code: '10100', name: 'Operating Cash', type: AccountType.ASSET, category: AccountCategory.CASH },
        { code: '12000', name: 'Accounts Receivable', type: AccountType.ASSET, category: AccountCategory.ACCOUNTS_RECEIVABLE },
        { code: '20000', name: 'Accounts Payable', type: AccountType.LIABILITY, category: AccountCategory.ACCOUNTS_PAYABLE },
        { code: '30000', name: 'Retained Earnings', type: AccountType.EQUITY, category: AccountCategory.EQUITY },
        { code: '40000', name: 'Operating Revenue', type: AccountType.REVENUE, category: AccountCategory.REVENUE },
        { code: '50000', name: 'Operational Expense', type: AccountType.EXPENSE, category: AccountCategory.OPERATING_EXPENSE },
      ];

      await tx.account.createMany({
        data: starterAccounts.map((account) => ({
          tenantId,
          code: account.code,
          name: account.name,
          type: account.type,
          category: account.category,
          isActive: true,
        })),
      });

      return tenantId;
    });
  }
}
