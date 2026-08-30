import { PrismaClient, Prisma } from '@prisma/client';

export type TenantMode = 'TENANT' | 'BYPASS';

export interface TenantContext {
  companyId?: string;
  mode: TenantMode;
}

/**
 * Hard guard for application code: in TENANT mode, companyId must be present.
 */
export function assertCompanyId(ctx: TenantContext): string {
  if (ctx.mode === 'BYPASS') return ctx.companyId ?? '';
  if (!ctx.companyId) {
    throw new Error(
      'Tenant scoping violation: companyId is required for TENANT mode operations.',
    );
  }
  return ctx.companyId;
}

/**
 * Ensure Prisma `where` clauses include `companyId` for tenant-scoped queries.
 *
 * Usage:
 *  const where = withCompanyWhere(ctx, { id });
 *  await prisma.invoice.findFirst({ where });
 */
export function withCompanyWhere<T extends Record<string, any>>(
  ctx: TenantContext,
  where: T,
): T {
  const companyId = assertCompanyId(ctx);

  // If caller already specified companyId, keep it (but in TENANT mode it must match).
  if ('companyId' in where) {
    const requested = where.companyId;
    if (requested !== companyId) {
      throw new Error(
        `Tenant scoping violation: requested companyId (${requested}) does not match tenant context (${companyId}).`,
      );
    }
    return where;
  }

  return {
    ...where,
    companyId,
  } as T;
}

/**
 * Ensure Prisma create/update payloads include `companyId`.
 */
export function withCompanyData<T extends Record<string, any>>(
  ctx: TenantContext,
  data: T,
): T {
  const companyId = assertCompanyId(ctx);

  if ('companyId' in data) {
    const requested = data.companyId;
    if (requested !== companyId) {
      throw new Error(
        `Tenant scoping violation: requested companyId (${requested}) does not match tenant context (${companyId}).`,
      );
    }
    return data;
  }

  return {
    ...data,
    companyId,
  } as T;
}

/**
 * A narrow interface for tenant-safe model operations.
 *
 * NOTE: This wrapper only covers the most common CRUD entry points.
 * Extend as needed once the pattern is rolled out across all modules.
 */
export type TenantSafeModel<TModel> = {
  findMany: (args: Prisma.Subset<Prisma.Args<TModel, 'findMany'>, any>) => any;
  findFirst: (args: Prisma.Subset<Prisma.Args<TModel, 'findFirst'>, any>) => any;
  findUnique: (args: Prisma.Subset<Prisma.Args<TModel, 'findUnique'>, any>) => any;
  create: (args: Prisma.Subset<Prisma.Args<TModel, 'create'>, any>) => any;
  update: (args: Prisma.Subset<Prisma.Args<TModel, 'update'>, any>) => any;
  updateMany: (args: Prisma.Subset<Prisma.Args<TModel, 'updateMany'>, any>) => any;
  delete: (args: Prisma.Subset<Prisma.Args<TModel, 'delete'>, any>) => any;
  deleteMany: (args: Prisma.Subset<Prisma.Args<TModel, 'deleteMany'>, any>) => any;
};

/**
 * Create tenant-safe proxies around Prisma model delegates.
 */
export function createTenantSafeClient(
  prisma: PrismaClient,
  ctx: TenantContext,
  modelNames: Array<keyof PrismaClient>,
) {
  const safe: Record<string, any> = {};

  for (const modelName of modelNames) {
    const delegate = (prisma as any)[modelName];
    if (!delegate) continue;

    safe[modelName as string] = {
      findMany: async (args: any) => {
        if (ctx.mode === 'TENANT') {
          args = { ...args };
          args.where = withCompanyWhere(ctx, args.where ?? {});
        }
        return delegate.findMany(args);
      },
      findFirst: async (args: any) => {
        if (ctx.mode === 'TENANT') {
          args = { ...args };
          args.where = withCompanyWhere(ctx, args.where ?? {});
        }
        return delegate.findFirst(args);
      },
      findUnique: async (args: any) => {
        if (ctx.mode === 'TENANT') {
          // Prisma findUnique only accepts the exact unique constraint fields in `where`.
          // Adding companyId to an { id } where clause breaks the unique key lookup.
          // Use findFirst instead, which accepts arbitrary where clauses.
          return delegate.findFirst({
            ...args,
            where: withCompanyWhere(ctx, args.where ?? {}),
          });
        }
        return delegate.findUnique(args);
      },
      create: async (args: any) => {
        if (ctx.mode === 'TENANT') {
          args = { ...args };
          args.data = withCompanyData(ctx, args.data ?? {});
        }
        return delegate.create(args);
      },
      update: async (args: any) => {
        if (ctx.mode === 'TENANT') {
          args = { ...args };
          args.where = withCompanyWhere(ctx, args.where ?? {});
          if (args.data?.companyId) {
            args.data = withCompanyData(ctx, args.data);
          }
        }
        return delegate.update(args);
      },
      updateMany: async (args: any) => {
        if (ctx.mode === 'TENANT') {
          args = { ...args };
          args.where = withCompanyWhere(ctx, args.where ?? {});
          if (args.data?.companyId) {
            args.data = withCompanyData(ctx, args.data);
          }
        }
        return delegate.updateMany(args);
      },
      delete: async (args: any) => {
        if (ctx.mode === 'TENANT') {
          args = { ...args };
          args.where = withCompanyWhere(ctx, args.where ?? {});
        }
        return delegate.delete(args);
      },
      deleteMany: async (args: any) => {
        if (ctx.mode === 'TENANT') {
          args = { ...args };
          args.where = withCompanyWhere(ctx, args.where ?? {});
        }
        return delegate.deleteMany(args);
      },
    };
  }

  return safe;
}

