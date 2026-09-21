import { SetMetadata } from '@nestjs/common';

/**
 * @CheckPolicy(...permissions)
 *
 * Marks a route for full ABAC enforcement by AccessPolicyGuard.
 * The guard calls AccessPolicyService.enforce() with the listed permissions
 * as the "actions being exercised", so all three ABAC layers fire:
 *
 *   1. Cross-tenant isolation
 *   2. IP whitelist (if the permission is sensitive)
 *   3. Time-window  (if the permission is sensitive)
 *   4. MFA requirement (if tenant policy demands it)
 *   5. Data-ownership check (for :delete operations)
 *
 * Use alongside @Permissions() — @Permissions handles the static role→perm
 * matrix, @CheckPolicy handles the dynamic ABAC attributes:
 *
 *   @Permissions('fund_transfers:approve')   // static RBAC
 *   @CheckPolicy('fund_transfers:approve')   // dynamic ABAC
 *   async approveTransfer(...) {}
 *
 * If only @CheckPolicy is present (no @Permissions), the guard still runs
 * the cross-tenant and ownership checks but skips MFA / IP checks unless
 * the permissions are in the sensitive list.
 */
export const CHECK_POLICY_KEY = 'check_policy_permissions';
export const CheckPolicy = (...permissions: string[]) =>
  SetMetadata(CHECK_POLICY_KEY, permissions);
