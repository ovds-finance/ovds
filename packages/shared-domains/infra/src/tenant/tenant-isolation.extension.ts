import { PrismaClient } from '@ovds/database';

export interface TenantContext {
  tenantId: string;
  subdomain: string;
}

declare global {
  namespace Prisma {
    interface Client {
      $tenant: TenantContext | null;
    }
  }
}

export function createTenantClient(
  prisma: PrismaClient,
  context: TenantContext
): PrismaClient {
  return prisma.$extends({
    name: 'tenantIsolation',
    query: {
      $allModels: {
        async $allOperations({ args, query }: any) {
          if (args?.where && typeof args.where === 'object') {
            args.where = {
              ...args.where,
              tenantId: context.tenantId,
            };
          } else if (!args?.where) {
            args = {
              ...args,
              where: { tenantId: context.tenantId },
            };
          }
          return query(args);
        },
      },
    },
  }).$extends({
    name: 'tenantBypass',
    query: {
      tenant: {
        findUnique: ({ args, query }: any) => query(args),
        findMany: ({ args, query }: any) => query(args),
      },
      globalSetting: {
        findUnique: ({ args, query }: any) => query(args),
        findMany: ({ args, query }: any) => query(args),
      },
      tenantRegistry: {
        findUnique: ({ args, query }: any) => query(args),
        findMany: ({ args, query }: any) => query(args),
      },
    },
  }) as any;
}

export function getTenantContext(prisma: PrismaClient): TenantContext | null {
  return (prisma as any).$tenant ?? null;
}