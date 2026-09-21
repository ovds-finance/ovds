/**
 * Role constants — single authoritative source shared by:
 *   • Prisma schema enum (must stay in sync)
 *   • NestJS backend guards (RolesGuard, PermissionsGuard, JwtStrategy)
 *   • React frontend (AuthContext, RBAC route policy)
 *
 * When adding a role here you MUST also:
 *   1. Add it to the `Role` enum in packages/database/prisma/schema.prisma
 *   2. Add an entry to ROLE_HIERARCHY in rbac/role-permissions.ts
 *   3. Add a ROLE_PERMISSIONS entry in rbac/role-permissions.ts
 *   4. Run `npm run db:generate` to regenerate Prisma types
 */
export const Role = {
  /** Platform super-admin — full unrestricted access, bypasses all guards */
  SPURADMIN: 'SPURADMIN',
  /** Deployment-level superadmin — full access to all tenants */
  SUPERADMIN: 'SUPERADMIN',
  /** Tenant administrator — full access within one company */
  ADMIN: 'ADMIN',
  /** Human Resources manager */
  HR: 'HR',
  /** Core OVDS accounting/finance operator (Ovds SaaS accounting/finance operator) */
  OVDS: 'OVDS',
  /** Dedicated accounting & GL posting role */
  ACCOUNTING: 'ACCOUNTING',
  /** Internal auditor — read-only access to all financial records */
  AUDITOR: 'AUDITOR',
  /** Standard employee — limited self-service access */
  EMPLOYEE: 'EMPLOYEE',
  /** CRM / customer relationship management operator */
  CRM: 'CRM',
  /** IFRS compliance officer */
  IFRS_OFFICER: 'IFRS_OFFICER',
  /** Bank liaison — manages banking integrations and reconciliation */
  BANK_LIAISON: 'BANK_LIAISON',
  /** External statutory auditor */
  EXTERNAL_AUDITOR: 'EXTERNAL_AUDITOR',
  /** Platform developer / API integrator */
  DEVELOPER: 'DEVELOPER',
  /** Client portal user */
  CLIENT: 'CLIENT',
  /** Project manager */
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  /** Business partner */
  PARTNER: 'PARTNER',
  /** Finance team — AP/AR, tax filing, EIMS submission */
  FINANCE: 'FINANCE',
  /** Sales team — invoices and customer management */
  SALES: 'SALES',
  /** Procurement / purchasing team — bills and purchase orders */
  PURCHASES: 'PURCHASES',
  /** IT Security / INSA compliance officer */
  SECURITY: 'SECURITY',
  /** Regulatory compliance operator */
  COMPLIANCE: 'COMPLIANCE',
  /**
   * Data Clerk / Secretary — Intra-tenant operational role.
   * Permitted to: input raw item/inventory data and draft sales entries.
   * Cannot: approve transactions, access ledgers, or generate tax returns.
   */
  DATA_CLERK: 'DATA_CLERK',
} as const;

export type Role = typeof Role[keyof typeof Role];

/** Roles that bypass all permission checks (super-users). */
export const SUPER_USER_ROLES: Role[] = [Role.SPURADMIN, Role.SUPERADMIN];
