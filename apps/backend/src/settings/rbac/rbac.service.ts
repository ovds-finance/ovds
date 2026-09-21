/**
 * RbacService — Prisma-backed CRUD for the Permission and RoleDefinition tables.
 *
 * Permissions are the atomic grants stored in the `permission` table.
 * RoleDefinitions are custom/extended roles stored in `role_definition`
 * with their permissions linked via `role_permission`.
 *
 * Seed: inserts the canonical permission list from @ovds/shared so that
 * existing static RBAC permissions are persisted and can be toggled per-company.
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import {
  getPermissions,
  Role,
  ROLE_HIERARCHY,
} from '@ovds/shared';

import { PrismaService } from '../../common/prisma.service';

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

/** Derive a human-readable category from a permission string like "vat:read" → "vat" */
function categoryOf(name: string): string {
  return name.split(':')[0] ?? 'system';
}

/** Canonical list of all unique permissions across all roles in @ovds/shared */
function allSharedPermissions(): string[] {
  const roles = Object.values(Role) as Role[];
  const set = new Set<string>();
  for (const role of roles) {
    for (const p of getPermissions(role)) set.add(p);
  }
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPermissions();
    await this.seedRoles();
  }

  // ── Permissions ───────────────────────────────────────────────────────────

  async listPermissions(opts: {
    companyId?: string;
    category?: string;
    isActive?: boolean;
  }) {
    return this.prisma.permission.findMany({
      where: {
        ...(opts.companyId !== undefined
          ? { OR: [{ companyId: opts.companyId }, { companyId: null }] }
          : {}),
        ...(opts.category ? { category: opts.category } : {}),
        ...(opts.isActive !== undefined ? { isActive: opts.isActive } : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getPermission(id: string) {
    const p = await this.prisma.permission.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Permission ${id} not found`);
    return p;
  }

  async createPermission(data: {
    name: string;
    description?: string;
    category?: string;
    isActive?: boolean;
    companyId?: string;
  }) {
    const existing = await this.prisma.permission.findFirst({
      where: { name: data.name },
    });
    if (existing) throw new ConflictException(`Permission "${data.name}" already exists`);
    return this.prisma.permission.create({
      data: {
        name:        data.name,
        description: data.description ?? null,
        category:    data.category ?? categoryOf(data.name),
        isActive:    data.isActive ?? true,
        companyId:   data.companyId ?? null,
      },
    });
  }

  async updatePermission(
    id: string,
    data: { description?: string; category?: string; isActive?: boolean },
  ) {
    await this.getPermission(id);
    return this.prisma.permission.update({
      where: { id },
      data: {
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.category    !== undefined ? { category: data.category }       : {}),
        ...(data.isActive    !== undefined ? { isActive: data.isActive }       : {}),
      },
    });
  }

  async togglePermission(permissionId: string, isActive: boolean) {
    const p = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!p) throw new NotFoundException(`Permission ${permissionId} not found`);
    return this.prisma.permission.update({
      where: { id: permissionId },
      data:  { isActive },
    });
  }

  async deletePermission(id: string) {
    const p = await this.prisma.permission.findUnique({
      where: { id },
      include: { rolePermissions: { take: 1 } },
    });
    if (!p) throw new NotFoundException(`Permission ${id} not found`);
    if (p.rolePermissions.length > 0) {
      throw new BadRequestException(
        'Cannot delete a permission that is assigned to roles. Remove it from all roles first.',
      );
    }
    await this.prisma.permission.delete({ where: { id } });
    return { success: true };
  }

  async seedPermissions(companyId?: string) {
    const canonical = allSharedPermissions();
    const existing = await this.prisma.permission.findMany({
      where: { name: { in: canonical } },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((p) => p.name));
    const missing = canonical.filter((name) => !existingNames.has(name));

    if (missing.length > 0) {
      await this.prisma.permission.createMany({
        data: missing.map((name) => ({
          name,
          category:  categoryOf(name),
          isActive:  true,
          companyId: companyId ?? null,
        })),
        skipDuplicates: true,
      });
    }

    return { created: missing.length, skipped: canonical.length - missing.length };
  }

  // ── Roles ─────────────────────────────────────────────────────────────────

  async listRoles(opts: { companyId?: string; isActive?: boolean; isSystem?: boolean }) {
    const roles = await this.prisma.roleDefinition.findMany({
      where: {
        ...(opts.companyId !== undefined
          ? { OR: [{ companyId: opts.companyId }, { companyId: null }] }
          : {}),
        ...(opts.isActive  !== undefined ? { isActive: opts.isActive }   : {}),
        ...(opts.isSystem  !== undefined ? { isSystem: opts.isSystem }   : {}),
      },
      include: {
        rolePermissions: { include: { permission: true } },
        customUsers: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    });
    return roles.map(r => ({ ...r, customUsersCount: r.customUsers?.length ?? 0 }));
  }

  async getRole(id: string) {
    const r = await this.prisma.roleDefinition.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!r) throw new NotFoundException(`Role ${id} not found`);
    return r;
  }

  async createRole(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    apiAccess?: boolean;
    companyId?: string;
  }) {
    const existing = await this.prisma.roleDefinition.findFirst({
      where: { name: data.name, companyId: data.companyId ?? null },
    });
    if (existing) throw new ConflictException(`Role "${data.name}" already exists`);
    return this.prisma.roleDefinition.create({
      data: {
        name:        data.name,
        description: data.description ?? null,
        isActive:    data.isActive ?? true,
        isSystem:    false,
        apiAccess:   data.apiAccess ?? false,
        companyId:   data.companyId ?? null,
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async updateRole(
    id: string,
    data: { name?: string; description?: string; isActive?: boolean; apiAccess?: boolean },
  ) {
    await this.getRole(id);
    return this.prisma.roleDefinition.update({
      where: { id },
      data: {
        ...(data.name        !== undefined ? { name: data.name }               : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive    !== undefined ? { isActive: data.isActive }       : {}),
        ...(data.apiAccess   !== undefined ? { apiAccess: data.apiAccess }     : {}),
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async toggleRole(roleId: string, isActive: boolean) {
    const r = await this.prisma.roleDefinition.findUnique({ where: { id: roleId } });
    if (!r) throw new NotFoundException(`Role ${roleId} not found`);
    return this.prisma.roleDefinition.update({
      where: { id: roleId },
      data:  { isActive },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async deleteRole(id: string) {
    const r = await this.prisma.roleDefinition.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`Role ${id} not found`);
    if (r.isSystem) {
      throw new BadRequestException('System roles cannot be deleted.');
    }
    await this.prisma.roleDefinition.delete({ where: { id } });
    return { success: true };
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.getRole(roleId);
    // Wrap in a transaction so the role is never left with zero permissions
    // if the createMany fails after the deleteMany succeeds.
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...(permissionIds.length > 0
        ? [this.prisma.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({ roleId, permissionId })),
            skipDuplicates: true,
          })]
        : []),
    ]);
    return this.getRole(roleId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
    return { success: true };
  }

  async seedRoles(companyId?: string) {
    const roleNames = Object.values(Role) as string[];
    const existing = await this.prisma.roleDefinition.findMany({
      where: { name: { in: roleNames }, companyId: companyId ?? null },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((r) => r.name));
    const missing = roleNames.filter((name) => !existingNames.has(name));

    if (missing.length > 0) {
      await this.prisma.roleDefinition.createMany({
        data: missing.map((name) => ({
          name,
          description: `System role: ${name}`,
          isActive:    true,
          isSystem:    true,
          companyId:   companyId ?? null,
        })),
        skipDuplicates: true,
      });
    }

    return { created: missing.length, skipped: roleNames.length - missing.length };
  }

  // ── Role Hierarchy ─────────────────────────────────────────────────────────

  /**
   * Build a full role hierarchy snapshot:
   * - every canonical Role with its weight, permission count, group and
   *   which ABAC layers (IP / time / MFA) apply to it based on the current
   *   tenant security policy.
   * - "parent" = the nearest role with a higher weight.
   * - "children" = roles whose nearest-higher-weight is this role.
   */
  async getHierarchy(companyId?: string) {
    // ── 1. Static role data from @ovds/shared ─────────────────────────────
    const DEFAULT_SENSITIVE = new Set([
      'fund_transfers:approve', 'payroll:approve', 'payroll:admin',
      'users:delete', 'vat:file', 'companies:delete', 'role_permissions:write',
      'system:deploy', 'banking:kyc:approve', 'banking:aml:flag',
      'period_close:write', 'audit_logs:write', 'external_audit:certify',
      'ifrs10:consolidation:approve',
    ]);

    // ── 2. Load tenant security policy (if any) ────────────────────────────
    let policy: {
      ipWhitelist?: string[];
      allowedHours?: { start: string; end: string; timezone: string } | null;
      mfaRequired?: boolean;
      sensitivePerms?: string[];
    } | null = null;

    if (companyId) {
      try {
        const rows = await (this.prisma as any).$queryRaw<
          { securityPolicy: string | null }[]
        >`SELECT securityPolicy FROM company WHERE id = ${companyId} LIMIT 1`;
        const raw = rows?.[0]?.securityPolicy ?? null;
        policy = raw ? JSON.parse(raw) : null;
      } catch { policy = null; }
    } else {
      // Fall back to the first company
      try {
        const rows = await (this.prisma as any).$queryRaw<
          { securityPolicy: string | null }[]
        >`SELECT securityPolicy FROM company ORDER BY createdAt DESC LIMIT 1`;
        const raw = rows?.[0]?.securityPolicy ?? null;
        policy = raw ? JSON.parse(raw) : null;
      } catch { policy = null; }
    }

    const tenantSensitive: Set<string> =
      policy?.sensitivePerms && policy.sensitivePerms.length > 0
        ? new Set([...DEFAULT_SENSITIVE, ...policy.sensitivePerms])
        : DEFAULT_SENSITIVE;

    const ipActive   = !!(policy?.ipWhitelist  && policy.ipWhitelist.length > 0);
    const timeActive = !!policy?.allowedHours;
    const mfaActive  = !!policy?.mfaRequired;

    // ── 3. Build flat role nodes ───────────────────────────────────────────
    const allRoles = Object.values(Role) as Role[];

    // Sort descending by weight (highest first)
    const sorted = [...allRoles].sort(
      (a, b) => (ROLE_HIERARCHY[b] ?? 0) - (ROLE_HIERARCHY[a] ?? 0),
    );

    // Pre-build set of weights for fast nearest-parent lookup
    const weights = sorted.map(r => ROLE_HIERARCHY[r] ?? 0);

    const nodes = sorted.map((role, idx) => {
      const weight      = ROLE_HIERARCHY[role] ?? 0;
      const perms       = role === 'SPURADMIN' || role === 'SUPERADMIN'
        ? allRoles.flatMap(r => getPermissions(r))
          .filter((v, i, a) => a.indexOf(v) === i)
        : getPermissions(role);

      const isSuperBypass = role === 'SPURADMIN' || role === 'SUPERADMIN';
      const isDevBypass   = role === 'DEVELOPER';

      // Sensitive perms this role holds (determines whether ABAC layers fire)
      const sensitiveHeld = perms.filter(p => tenantSensitive.has(p));
      const hasSensitive  = sensitiveHeld.length > 0;

      // Parent = role with smallest weight that is still higher than this one
      let parentRole: Role | null = null;
      for (let i = idx - 1; i >= 0; i--) {
        if (weights[i] > weight) { parentRole = sorted[i]; break; }
      }

      // ABAC enforcement for this role
      const abac = {
        exempt:  isSuperBypass,
        // DEVELOPER bypasses role/permission checks but faces IP/time/MFA
        ipCheck:   !isSuperBypass && ipActive   && hasSensitive,
        timeCheck: !isSuperBypass && timeActive  && hasSensitive,
        mfaCheck:  !isSuperBypass && mfaActive   && hasSensitive,
        // cross-tenant check: developer CAN cross tenants, others cannot
        crossTenantExempt: isSuperBypass || isDevBypass,
      };

      // Group (mirrors ROLE_GROUPS in the frontend)
      const GROUP_MAP: Record<string, string> = {
        SPURADMIN: 'system', SUPERADMIN: 'system', DEVELOPER: 'system',
        ADMIN: 'operations', PROJECT_MANAGER: 'operations', HR: 'operations', EMPLOYEE: 'operations',
        OVDS: 'finance', ACCOUNTING: 'finance', IFRS_OFFICER: 'finance', BANK_LIAISON: 'finance',
        FINANCE: 'finance', SALES: 'sales', PURCHASES: 'purchases',
        AUDITOR: 'audit', EXTERNAL_AUDITOR: 'audit', SECURITY: 'audit', COMPLIANCE: 'audit',
        CRM: 'crm', CLIENT: 'crm', PARTNER: 'crm',
        DATA_CLERK: 'operational',
      };

      return {
        role,
        weight,
        label:            ROLE_LABEL[role] ?? role,
        description:      ROLE_DESC[role]  ?? '',
        group:            GROUP_MAP[role]   ?? 'other',
        permissionCount:  perms.length,
        sensitiveCount:   sensitiveHeld.length,
        permissions:      perms,
        sensitivePerms:   sensitiveHeld,
        parentRole,
        abac,
        isSuperBypass,
        isDevBypass,
      };
    });

    // ── 4. Attach children ─────────────────────────────────────────────────
    const roleMap = new Map(nodes.map(n => [n.role, n]));
    const withChildren = nodes.map(n => ({
      ...n,
      childRoles: nodes
        .filter(c => c.parentRole === n.role)
        .map(c => c.role),
    }));

    // ── 5. Group summary ───────────────────────────────────────────────────
    const groups: Record<string, { label: string; roles: string[]; avgScore: number }> = {};
    for (const n of withChildren) {
      const g = n.group;
      if (!groups[g]) groups[g] = { label: g, roles: [], avgScore: 0 };
      groups[g].roles.push(n.role);
    }
    for (const g of Object.values(groups)) {
      const scores = g.roles.map(r => roleMap.get(r as Role)?.weight ?? 0);
      g.avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    }

    return {
      success: true,
      data: {
        roles: withChildren,
        groups,
        policy: {
          ipActive,
          timeActive,
          mfaActive,
          ipWhitelist:  policy?.ipWhitelist  ?? [],
          allowedHours: policy?.allowedHours ?? null,
          mfaRequired:  policy?.mfaRequired  ?? false,
          extraPerms:   policy?.sensitivePerms ?? [],
        },
      },
    };
  }
}

// ── Static label / description tables ─────────────────────────────────────────
// Mirrors ROLE_METADATA from apps/frontend/src/rbac/rbac.ts
const ROLE_LABEL: Record<string, string> = {
  SPURADMIN: 'Root Admin', SUPERADMIN: 'Super Admin', DEVELOPER: 'Developer',
  ADMIN: 'Administrator', PROJECT_MANAGER: 'Project Manager', HR: 'HR Manager',
  EMPLOYEE: 'Employee', OVDS: 'OVDS Controller', ACCOUNTING: 'Accountant',
  AUDITOR: 'Internal Auditor', IFRS_OFFICER: 'IFRS Officer', BANK_LIAISON: 'Bank Liaison',
  EXTERNAL_AUDITOR: 'External Auditor', CRM: 'CRM Agent', CLIENT: 'Client',
  PARTNER: 'Partner', DATA_CLERK: 'Data Clerk', FINANCE: 'Finance',
  SALES: 'Sales', PURCHASES: 'Purchases', SECURITY: 'Security', COMPLIANCE: 'Compliance',
};

const ROLE_DESC: Record<string, string> = {
  SPURADMIN: 'System-wide configuration and security bypass.',
  SUPERADMIN: 'Full administrative control over this company.',
  DEVELOPER: 'System monitoring and API integration access.',
  ADMIN: 'Operations and workspace management.',
  PROJECT_MANAGER: 'Delivery and resource allocation control.',
  HR: 'Personnel, payroll, and recruitment management.',
  EMPLOYEE: 'Self-service workspace and personal records.',
  OVDS: 'Financial oversight and treasury management.',
  ACCOUNTING: 'Daily bookkeeping and invoice processing.',
  AUDITOR: 'Compliance verification and audit logging.',
  IFRS_OFFICER: 'AFIS standards and reporting enforcement.',
  BANK_LIAISON: 'Banking operations and loan management.',
  EXTERNAL_AUDITOR: 'Statutory audit and certification scope.',
  CRM: 'Sales pipeline and customer support.',
  CLIENT: 'External customer portal access.',
  PARTNER: 'Vendor and channel partner collaboration.',
  DATA_CLERK: 'Data entry: raw items, inventory, and draft sales entries only.',
  FINANCE: 'Financial planning, budgeting, and treasury oversight.',
  SALES: 'Sales operations, customer management, and revenue tracking.',
  PURCHASES: 'Procurement, vendor management, and purchase order processing.',
  SECURITY: 'Physical and digital security operations.',
  COMPLIANCE: 'Regulatory compliance, audit coordination, and ethics enforcement.',
};
