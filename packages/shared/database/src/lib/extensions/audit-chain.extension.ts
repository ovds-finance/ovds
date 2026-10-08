import { PrismaClient } from '../../../../../database/prisma/generated/client';
import * as crypto from 'crypto';

export const extendPrismaForAuditChaining = (prismaClient: PrismaClient) => {
  return prismaClient.$extends({
    query: {
      auditTrail: {
        async create({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          const data = args.data;
          const tenantId = data.tenantId;
          const previousBlock = await prismaClient.auditTrail.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: { hash: true }
          });
          const prevHash = previousBlock ? previousBlock.hash : 'GENESIS_BLOCK';
          const payloadString = JSON.stringify(data.payload);
          const hmac = crypto.createHmac('sha256', process.env.LEDGER_CHAIN_SECRET || 'SOVEREIGN_SYSTEM_KEY');
          hmac.update(prevHash + data.action + payloadString);
          data.hash = hmac.digest('hex');
          return query(args);
        }
      }
    }
  });
};