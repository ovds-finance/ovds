// apps/shared-domains/infra/src/replica-router.ts
import { PrismaClient } from '@ovds/database';

export const createFederatedTenantClient = (tenantId: string, tenantRegion: 'us-east' | 'eu-west' | 'ap-south'): PrismaClient => {
  const primary = new PrismaClient();
  const replicas = {
    'us-east': new PrismaClient(),
    'eu-west': new PrismaClient(),
    'ap-south': new PrismaClient(),
  };

  return primary.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: { model: string; operation: string; args: Record<string, unknown>; query: (args: Record<string, unknown>) => Promise<unknown> }) {
          const writeOps = ['create', 'update', 'upsert', 'createMany', 'updateMany', 'delete'];
          const readOps = ['findFirst', 'findUnique', 'findMany', 'count'];

          if (writeOps.includes(operation)) {
            args.data = { ...((args.data as Record<string, unknown>) || {}), tenantId };
            args.where = { ...((args.where as Record<string, unknown>) || {}), tenantId };
            return query(args);
          }
          if (readOps.includes(operation)) {
            args.where = { ...((args.where as Record<string, unknown>) || {}), tenantId };
            const replica = replicas[tenantRegion] || primary;
            return (replica as any)[model][operation](args);
          }
          return query(args);
        }
      }
    }
  }) as any;
};