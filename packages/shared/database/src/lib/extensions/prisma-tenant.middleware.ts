import { Prisma } from '../../../../../database/prisma/generated/client';

export function TenantIsolationMiddleware(): (params: any, next: (params: any) => Promise<any>) => Promise<any> {
  return async (params: any, next: (params: any) => Promise<any>) => {
    if (params.model === 'GeneralLedger' || params.model === 'AuditTrail') {
      if (params.action === 'update' || params.action === 'updateMany' ||
          params.action === 'delete' || params.action === 'deleteMany') {
        throw new Error('Regulatory Compliance Rule: Modifications to ledger histories are strictly forbidden.');
      }
    }
    return next(params);
  };
}