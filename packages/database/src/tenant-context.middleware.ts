import { AsyncLocalStorage } from 'async_hooks';

/**
 * RequestContext — HTTP-request-scoped context carried via AsyncLocalStorage.
 *
 * This is the shared definition used by both:
 *   - packages/database/src/tenant-extension-builder.ts (tenant scoping)
 *   - apps/backend/src/common/tenant-context.middleware.ts (request interceptor)
 */
export interface RequestContext {
  companyId: string | null;
  userId: string | null;
  role: string | null;
}

/**
 * AsyncLocalStorage instance holding the current request's tenant context.
 *
 * Usage:
 *   const ctx = TENANT_CONTEXT.getStore();
 *   const companyId = ctx?.companyId;
 */
export const TENANT_CONTEXT = new AsyncLocalStorage<RequestContext>();

export function getTenantContext(): RequestContext | undefined {
  return TENANT_CONTEXT.getStore();
}
