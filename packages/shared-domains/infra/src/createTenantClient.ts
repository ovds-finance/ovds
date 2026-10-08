import { PrismaClient } from '@ovds/database';

export const createTenantClient = (prisma: PrismaClient, tenantContext: { tenantId: string; subdomain: string }): any => {
  const { tenantId } = tenantContext;

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: { model: string; operation: string; args: Record<string, unknown>; query: (args: Record<string, unknown>) => Promise<unknown> }) {
          const globalModels = ['GlobalSetting', 'TenantRegistry'];
          
          if (globalModels.includes(model)) {
            return query(args);
          }

          const writeOperations = ['create', 'update', 'upsert', 'createMany', 'updateMany'];
          const readOperations = ['findFirst', 'findUnique', 'findMany', 'update', 'delete', 'count'];

          if (writeOperations.includes(operation)) {
            args.data = { ...(args.data as Record<string, unknown>), tenantId };
          }

          if (readOperations.includes(operation)) {
            args.where = { ...(args.where as Record<string, unknown>), tenantId };
          }

          return query(args);
        },
      },
    },
  });
};