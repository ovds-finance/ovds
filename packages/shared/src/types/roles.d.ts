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
export declare const Role: {
    /** Platform super-admin — full unrestricted access, bypasses all guards */
    readonly SPURADMIN: "SPURADMIN";
    /** Deployment-level superadmin — full access to all tenants */
    readonly SUPERADMIN: "SUPERADMIN";
    /** Tenant administrator — full access within one company */
    readonly ADMIN: "ADMIN";
    /** Human Resources manager */
    readonly HR: "HR";
    /** Core OVDS accounting/finance operator (Ovds SaaS accounting/finance operator) */
    readonly OVDS: "OVDS";
    /** Dedicated accounting & GL posting role */
    readonly ACCOUNTING: "ACCOUNTING";
    /** Internal auditor — read-only access to all financial records */
    readonly AUDITOR: "AUDITOR";
    /** Standard employee — limited self-service access */
    readonly EMPLOYEE: "EMPLOYEE";
    /** CRM / customer relationship management operator */
    readonly CRM: "CRM";
    /** IFRS compliance officer */
    readonly IFRS_OFFICER: "IFRS_OFFICER";
    /** Bank liaison — manages banking integrations and reconciliation */
    readonly BANK_LIAISON: "BANK_LIAISON";
    /** External statutory auditor */
    readonly EXTERNAL_AUDITOR: "EXTERNAL_AUDITOR";
    /** Platform developer / API integrator */
    readonly DEVELOPER: "DEVELOPER";
    /** Client portal user */
    readonly CLIENT: "CLIENT";
    /** Project manager */
    readonly PROJECT_MANAGER: "PROJECT_MANAGER";
    /** Business partner */
    readonly PARTNER: "PARTNER";
    /** Finance team — AP/AR, tax filing, EIMS submission */
    readonly FINANCE: "FINANCE";
    /** Sales team — invoices and customer management */
    readonly SALES: "SALES";
    /** Procurement / purchasing team — bills and purchase orders */
    readonly PURCHASES: "PURCHASES";
    /** IT Security / INSA compliance officer */
    readonly SECURITY: "SECURITY";
    /** Regulatory compliance operator */
    readonly COMPLIANCE: "COMPLIANCE";
    /**
     * Data Clerk / Secretary — Intra-tenant operational role.
     * Permitted to: input raw item/inventory data and draft sales entries.
     * Cannot: approve transactions, access ledgers, or generate tax returns.
     */
    readonly DATA_CLERK: "DATA_CLERK";
};
export type Role = typeof Role[keyof typeof Role];
/** Roles that bypass all permission checks (super-users). */
export declare const SUPER_USER_ROLES: Role[];
//# sourceMappingURL=roles.d.ts.map