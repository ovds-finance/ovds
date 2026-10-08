import { PrismaClient } from '../../../../../database/prisma/generated/client';

export const extendClientForMigration = (prisma: PrismaClient) => {
  return prisma.$extends({
    query: {
      generalLedger: {
        async create({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          if (process.env.MIGRATION_PHASE === 'EXPAND') {
            const data = args.data as any;
            if (data.jurisdiction && !data.legacyJurisdictionZone) {
              data.legacyJurisdictionZone = data.jurisdiction.toLowerCase();
            }
          }
          return query(args);
        },
      },
    },
  });
};