import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { getTenantContext } from './tenant-context.middleware';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.PRISMA_DATABASE_URL;
    if (!connectionString) {
      throw new Error('PRISMA_DATABASE_URL environment variable is required');
    }

    super({
      adapter: new PrismaMariaDb(connectionString),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
    });

    const extended = (this as unknown as { $extends: (ext: any) => PrismaClient }).$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: any) {
            const context = getTenantContext();
            const companyId = context?.companyId || null;
            const isSuperUser = context?.role === 'ADMIN' || context?.role === 'SUPER_ADMIN';

            if (!companyId || isSuperUser) {
              return query(args);
            }

            if (operation === 'findMany' || operation === 'findFirst' || operation === 'findUnique') {
              const hasCompanyId =
                model === 'company' || model === 'employee' || model === 'user' ||
                model === 'invoice' || model === 'bill' || model === 'customer' || model === 'vendor' ||
                model === 'bankAccount' || model === 'transaction' || model === 'payroll' ||
                model === 'leave' || model === 'attendance' || model === 'item' || model === 'project' ||
                model === 'deal' || model === 'activity' || model === 'auditLog' || model === 'taxReport' ||
                model === 'vatDeclaration' || model === 'purchaseOrder' || model === 'expense' ||
                model === 'transfer' || model === 'reconciliation' || model === 'budget';

              if (hasCompanyId) {
                const where = args?.where ?? {};
                if (operation === 'findUnique' && where.companyId && where.companyId !== companyId) {
                  return null;
                }
                args = { ...args, where: { ...where, companyId } };
              }
            }

            return query(args);
          },
        },
      },
    });

    (extended as unknown as { onModuleInit: () => Promise<void> }).onModuleInit = async () => {
      await extended.$connect();
    };
    (extended as unknown as { onModuleDestroy: () => Promise<void> }).onModuleDestroy = async () => {
      await extended.$disconnect();
    };

    return extended as unknown as PrismaService;
  }
}
