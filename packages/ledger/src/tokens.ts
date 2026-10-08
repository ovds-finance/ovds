import { InjectionToken } from '@nestjs/common';

/**
 * Injection token for the Prisma client.
 *
 * The @ovds/ledger package is a shared library and cannot depend on
 * apps/backend's PrismaService.  Consuming applications (e.g. apps/backend)
 * should provide their PrismaService instance under this token:
 *
 *   @Module({
 *     imports: [LedgerModule],
 *     providers: [{ provide: PRISMA_CLIENT, useExisting: PrismaService }],
 *   })
 *   export class AppModule {}
 */
export const PRISMA_CLIENT: InjectionToken = Symbol('PRISMA_CLIENT');

/**
 * Structural type of a Prisma client (or PrismaService) that the ledger
 * module requires.
 */
export interface PrismaServiceLike {
  taxpayerTenant: { findUnique: Function; findFirst: Function };
  chartOfAccount: { findMany: Function };
  assetInventory: { findMany: Function };
  ledgerEntry: { findMany: Function; createManyAndReturn: Function };
  journalTransaction: { create: Function; findUnique: Function; findMany: Function };
  tenantVatDeclaration: { findFirst: Function; findUnique: Function; update: Function; updateMany: Function };
  offlineSyncLog: { findMany: Function; findFirst: Function; create: Function; update: Function };
  $transaction: Function;
}
