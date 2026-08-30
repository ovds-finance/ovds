import { Role } from '../types';
import { Permission, ContextualRule } from './permissions';

/**
 * CONTEXTUAL_RULES defines "smart" constraints for specific permissions.
 */
export const CONTEXTUAL_RULES: Partial<Record<Permission, ContextualRule>> = {
  'payroll:approve': (role, ctx) => {
    if (role === Role.OVDS) return true;
    if (role === Role.ACCOUNTING) return (ctx.amount ?? 0) <= 500_000;
    return false;
  },
  'fund_transfers:approve': (role, ctx) => {
    if (role === Role.OVDS) return true;
    if (role === Role.BANK_LIAISON) return (ctx.amount ?? 0) <= 100_000;
    return false;
  },
  'invoices:write': (role, ctx) => {
    if (role === Role.SPURADMIN || role === Role.SUPERADMIN) return true;
    // DATA_CLERK may only create/update DRAFT invoices — cannot post or send
    if (role === Role.DATA_CLERK) return ctx.status === 'draft' || !ctx.status;
    return ctx.status === 'draft' || !ctx.status;
  },
  'reports:financial:full': (role, ctx) => {
    if (role === Role.EXTERNAL_AUDITOR) return !!ctx.companyId;
    return true;
  },
  'users:delete': (role) => {
    return ([Role.SPURADMIN, Role.SUPERADMIN] as string[]).includes(role);
  },
};
