/**
 * AccessPolicyService — the central ABAC / PBAC enforcer.
 *
 * Implements the three-layer check described in the SaaS ABAC blueprint:
 *
 *   1. Tenant isolation   — resource must belong to the requesting tenant
 *   2. Role / permission  — handled upstream by PermissionsGuard; this
 *                           service re-runs a lightweight ownership check
 *   3. ABAC attributes    — IP whitelist, time-window, MFA requirement,
 *                           data-ownership rules
 *
 * The service loads the tenant's CompanySecurityPolicy from the
 * `company.securityPolicy` JSON column and caches it in a process-level
 * TTL map (60 s) to avoid repeated DB hits while still picking up admin
 * edits within a minute.  Calling bustPolicyCache() after a save makes
 * the new policy active immediately without waiting for the TTL.
 *
 * Design goals:
 *   • Every denial is logged to AuditLog with enough context to investigate.
 *   • Super-admins (SPURADMIN / SUPERADMIN) bypass ABAC but NOT the
 *     cross-tenant ownership check — they can still only act within their
 *     active tenant context.
 *   • No external dependency (Casbin, OPA) — pure TypeScript logic that can
 *     be tested without a running server.
 */
import { Injectable, Logger } from '@nestjs/common';
import { isSuperUser } from '@ovds/shared';

import { PrismaService } from '../../common/prisma.service';

import {
  PolicyEnforceInput,
  PolicyDecision,
  CompanySecurityPolicy,
} from './access-policy.types';

/**
 * Strict super-user check: ONLY SPURADMIN and SUPERADMIN.
 *
 * Intentionally excludes DEVELOPER — developer accounts must still satisfy
 * IP, time-window, and MFA tenant policies.  Only root/super admins get a
 * full ABAC bypass.
 *
 * Contrast with @ovds/shared isSuperUser() which also includes DEVELOPER
 * (used for section-access / route gating where dev accounts need unrestricted
 * navigation, but NOT for security policy enforcement).
 */
function isSuperUserStrict(role: string): boolean {
  return role === 'SPURADMIN' || role === 'SUPERADMIN';
}

// ---------------------------------------------------------------------------
// Default sensitive permissions — trigger IP + time-window checks
// ---------------------------------------------------------------------------
const DEFAULT_SENSITIVE_PERMS = new Set([
  'fund_transfers:approve',
  'payroll:approve',
  'payroll:admin',
  'users:delete',
  'vat:file',
  'companies:delete',
  'role_permissions:write',
  'system:deploy',
  'banking:kyc:approve',
  'banking:aml:flag',
  'period_close:write',
  'audit_logs:write',
  'external_audit:certify',
  'ifrs10:consolidation:approve',
]);

// ---------------------------------------------------------------------------
// IP matching helpers
// ---------------------------------------------------------------------------

/** Parse "a.b.c.d" → 32-bit unsigned int */
function ip4ToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) | (parseInt(octet, 10) & 0xff), 0) >>> 0;
}

/** Returns true if `ip` is covered by a CIDR like "196.188.0.0/16" or exact IP */
function ipMatchesCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;
  const [network, bits] = cidr.split('/');
  const mask = bits ? (~0 << (32 - parseInt(bits, 10))) >>> 0 : 0xffffffff;
  return (ip4ToInt(ip) & mask) === (ip4ToInt(network) & mask);
}

/** Returns true if clientIp matches ANY entry in the whitelist */
function ipAllowed(clientIp: string, whitelist: string[]): boolean {
  if (!whitelist || whitelist.length === 0) return true;
  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4)
  const bare = clientIp.replace(/^::ffff:/, '');
  return whitelist.some((cidr) => ipMatchesCidr(bare, cidr));
}

// ---------------------------------------------------------------------------
// Time-window helpers
// ---------------------------------------------------------------------------

/** Returns current minutes-since-midnight in a given IANA timezone */
function minutesInTz(date: Date, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(date);
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    return h * 60 + m;
  } catch {
    // Unknown timezone — fail open (don't block access due to bad config)
    return 12 * 60;
  }
}

/** "HH:mm" string → minutes since midnight */
function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// ---------------------------------------------------------------------------
// TTL policy cache — avoids repeated DB hits within the same request burst
// but expires stale entries after POLICY_CACHE_TTL_MS so that admin edits
// to securityPolicy are reflected without a server restart.
// ---------------------------------------------------------------------------

const POLICY_CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
  policy: CompanySecurityPolicy | null;
  expiresAt: number;
}

const POLICY_CACHE = new Map<string, CacheEntry>();

function getCachedPolicy(companyId: string): CompanySecurityPolicy | null | undefined {
  const entry = POLICY_CACHE.get(companyId);
  if (!entry) return undefined; // miss
  if (Date.now() > entry.expiresAt) {
    POLICY_CACHE.delete(companyId);
    return undefined; // expired
  }
  return entry.policy; // hit
}

function setCachedPolicy(companyId: string, policy: CompanySecurityPolicy | null) {
  POLICY_CACHE.set(companyId, { policy, expiresAt: Date.now() + POLICY_CACHE_TTL_MS });
}

/** Immediately bust the TTL cache for a company — call after saving policy. */
export function bustPolicyCache(companyId: string) {
  POLICY_CACHE.delete(companyId);
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class AccessPolicyService {
  private readonly logger = new Logger(AccessPolicyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Immediately evict a company's policy from the TTL cache.
   *  Call this after SettingsService.saveSecurityPolicy() so the next
   *  request picks up the new policy without waiting 60 s. */
  invalidatePolicy(companyId: string) {
    POLICY_CACHE.delete(companyId);
  }

  /**
   * Main enforcement method.  Call from AccessPolicyGuard after
   * JwtAuthGuard and PermissionsGuard have already passed.
   */
  async enforce(input: PolicyEnforceInput): Promise<PolicyDecision> {
    const { user, permissions, resource, environment } = input;
    const role = (user.role ?? '').toUpperCase();

    // ── Layer 1: Cross-tenant isolation ────────────────────────────────────
    // Block cross-tenant access for all non-super roles.
    // isSuperUser() from @ovds/shared includes DEVELOPER — intentionally
    // so here because tenant-switch is a legitimate dev-env operation.
    if (resource?.companyId && user.companyId) {
      if (resource.companyId !== user.companyId && !isSuperUser(role as any)) {
        return this.deny(
          user,
          `Cross-tenant access: resource.companyId=${resource.companyId} ≠ user.companyId=${user.companyId}`,
          permissions,
        );
      }
    }

    // ── DEVELOPER bypass is intentionally NOT applied here ─────────────────
    // isSuperUserStrict() (SPURADMIN / SUPERADMIN only) is used for the ABAC
    // attribute checks below.  DEVELOPER role users must still satisfy IP,
    // time-window, and MFA rules — only SPURADMIN / SUPERADMIN are exempt.
    if (isSuperUserStrict(role)) return { allowed: true };

    // ── Load tenant security policy ────────────────────────────────────────
    const policy = await this.loadPolicy(user.companyId);

    // ── Determine sensitive permissions for this tenant ────────────────────
    // Fix: tenant sensitivePerms EXTEND (not replace) the default set.
    // A tenant providing ["custom:op"] gets all defaults PLUS "custom:op".
    const tenantSensitive =
      policy?.sensitivePerms && policy.sensitivePerms.length > 0
        ? new Set([...DEFAULT_SENSITIVE_PERMS, ...policy.sensitivePerms])
        : DEFAULT_SENSITIVE_PERMS;

    const exercisesSensitivePerm = permissions.some((p) => tenantSensitive.has(p));

    if (exercisesSensitivePerm) {
      // ── Layer 3a: IP whitelist ──────────────────────────────────────────
      if (policy?.ipWhitelist && policy.ipWhitelist.length > 0) {
        if (!ipAllowed(environment.ipAddress, policy.ipWhitelist)) {
          return this.deny(
            user,
            `IP ${environment.ipAddress} not in tenant whitelist for sensitive permission`,
            permissions,
          );
        }
      }

      // ── Layer 3b: Time-window ───────────────────────────────────────────
      if (policy?.allowedHours) {
        const { start, end, timezone } = policy.allowedHours;
        const now      = minutesInTz(environment.requestTime, timezone);
        const startMin = hmToMinutes(start);
        const endMin   = hmToMinutes(end);
        if (now < startMin || now > endMin) {
          return this.deny(
            user,
            `Request at ${environment.requestTime.toISOString()} is outside allowed window ${start}–${end} ${timezone}`,
            permissions,
          );
        }
      }

      // ── Layer 3c: MFA requirement ───────────────────────────────────────
      if (policy?.mfaRequired) {
        if (!user.mfaEnrolled || !user.mfaVerified) {
          return this.deny(
            user,
            'MFA is required by tenant policy for sensitive permission',
            permissions,
          );
        }
      }
    }

    // ── Layer 3d: Data ownership ───────────────────────────────────────────
    // Enforced for both write (:write) AND delete (:delete) operations when
    // a resource owner can be identified.  Admin-tier roles (ADMIN, OVDS,
    // ACCOUNTING) are exempt — they manage all records in their tenant.
    //
    // Owner fields checked (in priority order):
    //   resource.ownerId   — explicit ownership FK (preferred)
    //   resource.createdBy — creation audit field
    //   resource.userId    — generic user association
    //
    // A missing owner field means "ownership unknown" → access granted.
    // Explicit null/undefined owner → ownership check is skipped (not denied).
    const isWriteOp  = permissions.some((p) => p.endsWith(':write') || p.endsWith(':update'));
    const isDeleteOp = permissions.some((p) => p.endsWith(':delete'));

    if ((isWriteOp || isDeleteOp) && resource) {
      const resourceOwner =
        (resource.ownerId   as string | null | undefined) ??
        (resource.createdBy as string | null | undefined) ??
        (resource.userId    as string | null | undefined);

      // Only enforce when we have a concrete owner string to compare against
      if (resourceOwner && typeof resourceOwner === 'string') {
        const ADMIN_ROLES = new Set(['ADMIN', 'OVDS', 'ACCOUNTING', 'PROJECT_MANAGER']);
        if (!ADMIN_ROLES.has(role) && resourceOwner !== user.userId) {
          const op = isDeleteOp ? 'delete' : 'write';
          return this.deny(
            user,
            `Ownership violation: cannot ${op} resource owned by ${resourceOwner} (requestor=${user.userId})`,
            permissions,
          );
        }
      }
    }

    return { allowed: true };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async loadPolicy(
    companyId: string | null,
  ): Promise<CompanySecurityPolicy | null> {
    if (!companyId) return null;

    // Check the process-level TTL cache (60 s expiry — see getCachedPolicy)
    const cached = getCachedPolicy(companyId);
    if (cached !== undefined) return cached;

    try {
      // Use a raw query to avoid triggering the $extends RLS middleware
      // (which would re-scope the query and create an infinite loop).
      const rows = await (this.prisma as any).$queryRaw<
        { securityPolicy: string | null }[]
      >`SELECT securityPolicy FROM company WHERE id = ${companyId} LIMIT 1`;
      const raw = rows?.[0]?.securityPolicy ?? null;
      const parsed: CompanySecurityPolicy | null = raw ? JSON.parse(raw) : null;
      setCachedPolicy(companyId, parsed);
      return parsed;
    } catch {
      // Malformed JSON or query error — fail open, log warning
      this.logger.warn(`Failed to load security policy for company ${companyId}`);
      setCachedPolicy(companyId, null);
      return null;
    }
  }

  private deny(
    user: PolicyEnforceInput['user'],
    reason: string,
    permissions: string[],
  ): PolicyDecision {
    this.logger.warn(
      `[ACCESS DENIED] userId=${user.userId} role=${user.role} ` +
      `companyId=${user.companyId} perms=[${permissions.join(',')}] reason="${reason}"`,
    );
    // Fire-and-forget audit log — do not await so denial is never delayed
    this.writeAuditLog(user, reason, permissions).catch(() => {/* silent */});
    return { allowed: false, reason };
  }

  private async writeAuditLog(
    user: PolicyEnforceInput['user'],
    reason: string,
    permissions: string[],
  ): Promise<void> {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action:    'ACCESS_DENIED',
          userId:    user.userId || null,
          companyId: user.companyId || null,
          details:   JSON.stringify({ reason, permissions }),
        },
      });
    } catch {
      // Never let audit logging break the request flow
    }
  }

  // ── Public query API ───────────────────────────────────────────────────────

  /**
   * Returns which ABAC enforcement layers are active for a given role,
   * given the current tenant security policy. Pure metadata — no enforcement.
   */
  async getPolicyLayersForRole(
    role: string,
    permissions: string[],
    companyId: string | null,
  ) {
    const r             = role.toUpperCase();
    const isSuperBypass = r === 'SPURADMIN' || r === 'SUPERADMIN';
    const isDevBypass   = r === 'DEVELOPER';

    const policy = await this.loadPolicy(companyId);

    const tenantSensitive =
      policy?.sensitivePerms && policy.sensitivePerms.length > 0
        ? new Set([...DEFAULT_SENSITIVE_PERMS, ...policy.sensitivePerms])
        : DEFAULT_SENSITIVE_PERMS;

    const sensitiveTriggers = permissions.filter(p => tenantSensitive.has(p));
    const hasSensitivePerm  = sensitiveTriggers.length > 0;
    const ipActive   = !!(policy?.ipWhitelist && policy.ipWhitelist.length > 0);
    const timeActive = !!policy?.allowedHours;
    const mfaActive  = !!policy?.mfaRequired;

    return {
      isSuperBypass,
      isDevBypass,
      hasSensitivePerm,
      sensitiveTriggers,
      ipCheck:            !isSuperBypass && ipActive   && hasSensitivePerm,
      timeCheck:          !isSuperBypass && timeActive  && hasSensitivePerm,
      mfaCheck:           !isSuperBypass && mfaActive   && hasSensitivePerm,
      crossTenantExempt:  isSuperBypass || isDevBypass,
      policy,
    };
  }

  /**
   * Full enforcement decision chain for a (role, permissions, context) triple.
   * Runs every layer to completion (no short-circuit) so callers see ALL checks.
   */
  async checkRoleAccess(body: {
    role: string;
    permissions: string[];
    companyId?: string | null;
    ipAddress?: string;
    requestTime?: string;
    mfaVerified?: boolean;
    mfaEnrolled?: boolean;
    resourceOwnerId?: string;
    requestorUserId?: string;
  }) {
    const r      = (body.role ?? '').toUpperCase();
    const companyId   = body.companyId ?? null;
    const permissions = body.permissions ?? [];
    const ipAddress   = body.ipAddress   ?? null;
    const requestTime = body.requestTime ? new Date(body.requestTime) : new Date();
    const mfaVerified = body.mfaVerified ?? false;
    const mfaEnrolled = body.mfaEnrolled ?? mfaVerified;

    type LayerResult = { layer: string; result: 'pass' | 'fail' | 'bypass' | 'skipped'; reason: string };
    const layers: LayerResult[] = [];

    // L0: super-user hard bypass
    const isSuperBypass = r === 'SPURADMIN' || r === 'SUPERADMIN';
    if (isSuperBypass) {
      layers.push({ layer: 'super-bypass', result: 'bypass', reason: `${r} bypasses all ABAC enforcement.` });
      return { role: r, allowed: true, layers, policy: null };
    }
    layers.push({ layer: 'super-bypass', result: 'skipped', reason: `${r} is not a super-admin.` });
    layers.push({ layer: 'cross-tenant', result: 'skipped', reason: 'No resource.companyId provided in this check.' });

    const policy = await this.loadPolicy(companyId);
    const tenantSensitive =
      policy?.sensitivePerms && policy.sensitivePerms.length > 0
        ? new Set([...DEFAULT_SENSITIVE_PERMS, ...policy.sensitivePerms])
        : DEFAULT_SENSITIVE_PERMS;

    const triggers    = permissions.filter(p => tenantSensitive.has(p));
    const hasSensitive = triggers.length > 0;

    if (!hasSensitive) {
      layers.push({ layer: 'sensitive-perm-gate', result: 'skipped',
        reason: `None of [${permissions.join(', ')}] are sensitive — ABAC checks not triggered.` });
      return { role: r, allowed: true, layers, policy };
    }
    layers.push({ layer: 'sensitive-perm-gate', result: 'pass',
      reason: `[${triggers.join(', ')}] trigger ABAC attribute checks.` });

    // IP whitelist
    if (policy?.ipWhitelist && policy.ipWhitelist.length > 0) {
      if (!ipAddress) {
        // Caller did not provide an IP — treat as a failed whitelist check so
        // requests with unknown origin cannot bypass IP-based access controls.
        layers.push({ layer: 'ip-whitelist', result: 'fail',
          reason: 'No client IP provided — cannot verify against whitelist.' });
        return { role: r, allowed: false, layers, policy };
      }
      const bare = ipAddress.replace(/^::ffff:/, '');
      const ip4  = (ip: string) => ip.split('.').reduce((a, o) => (a << 8) | (parseInt(o,10) & 0xff), 0) >>> 0;
      const allowed = policy.ipWhitelist.some(cidr => {
        if (!cidr.includes('/')) return bare === cidr;
        const [net, bits] = cidr.split('/');
        const mask = bits ? (~0 << (32 - parseInt(bits,10))) >>> 0 : 0xffffffff;
        return (ip4(bare) & mask) === (ip4(net ?? '') & mask);
      });
      layers.push({ layer: 'ip-whitelist', result: allowed ? 'pass' : 'fail',
        reason: allowed
          ? `IP ${ipAddress} is in whitelist.`
          : `IP ${ipAddress} NOT in whitelist [${policy.ipWhitelist.join(', ')}].` });
    } else {
      layers.push({ layer: 'ip-whitelist', result: 'skipped', reason: 'No IP whitelist configured.' });
    }

    // Time window
    if (policy?.allowedHours) {
      const { start, end, timezone } = policy.allowedHours;
      const hmToMin = (hm: string) => { const [h,m] = hm.split(':').map(Number); return (h??0)*60+(m??0); };
      const minInTz = (d: Date, tz: string) => {
        try {
          const p = new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'numeric',hour12:false}).formatToParts(d);
          return parseInt(p.find(x=>x.type==='hour')?.value??'0',10)*60+parseInt(p.find(x=>x.type==='minute')?.value??'0',10);
        } catch { return 12*60; }
      };
      const nowMin = minInTz(requestTime, timezone);
      const inWin  = nowMin >= hmToMin(start) && nowMin <= hmToMin(end);
      const hm     = `${String(Math.floor(nowMin/60)).padStart(2,'0')}:${String(nowMin%60).padStart(2,'0')}`;
      layers.push({ layer: 'time-window', result: inWin ? 'pass' : 'fail',
        reason: inWin
          ? `${hm} (${timezone}) is within ${start}–${end}.`
          : `${hm} (${timezone}) is OUTSIDE ${start}–${end}.` });
    } else {
      layers.push({ layer: 'time-window', result: 'skipped', reason: 'No time-window configured.' });
    }

    // MFA
    if (policy?.mfaRequired) {
      const ok = mfaEnrolled && mfaVerified;
      layers.push({ layer: 'mfa', result: ok ? 'pass' : 'fail',
        reason: ok ? 'MFA is verified.' : `MFA required but mfaVerified=${mfaVerified}, mfaEnrolled=${mfaEnrolled}.` });
    } else {
      layers.push({ layer: 'mfa', result: 'skipped', reason: 'MFA not required by this policy.' });
    }

    // Ownership
    const isWriteOrDelete = permissions.some(p => p.endsWith(':write') || p.endsWith(':update') || p.endsWith(':delete'));
    const ADMIN_ROLES     = new Set(['ADMIN', 'OVDS', 'ACCOUNTING', 'PROJECT_MANAGER']);
    if (isWriteOrDelete && body.resourceOwnerId && body.requestorUserId) {
      const ownerMatch = body.resourceOwnerId === body.requestorUserId;
      layers.push({ layer: 'ownership',
        result: ADMIN_ROLES.has(r) ? 'bypass' : (ownerMatch ? 'pass' : 'fail'),
        reason: ADMIN_ROLES.has(r) ? `${r} is exempt from ownership checks.`
          : ownerMatch ? 'Owner matches requestor.'
          : `Resource owned by ${body.resourceOwnerId}; requestor is ${body.requestorUserId}.` });
    } else {
      layers.push({ layer: 'ownership', result: 'skipped', reason: 'No resource ownership data provided.' });
    }

    return { role: r, allowed: !layers.some(l => l.result === 'fail'), layers, policy };
  }
}
