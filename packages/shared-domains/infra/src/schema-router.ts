// apps/shared-domains/infra/src/schema-router.ts
import { PrismaClient } from '@ovds/database';

export const createSchemaIsolatedClient = (tenantSchemaName: string): PrismaClient => {
  const base = new PrismaClient();
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: { model: string; operation: string; args: Record<string, unknown>; query: (args: Record<string, unknown>) => Promise<unknown> }) {
          return base.$transaction(async (tx: any) => {
            await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${tenantSchemaName}", public;`);
            return (tx as any)[model][operation](args);
          });
        }
      }
    }
  }) as any;
};