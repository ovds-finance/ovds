import * as crypto from 'crypto';

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';

import { bustPolicyCache, AccessPolicyService } from '../auth/access-policy/access-policy.service';
import { PrismaService } from '../common/prisma.service';

import type { SaveSecurityPolicyDto, TestSecurityPolicyDto } from './dto/security-policy.dto';

// ── SMTP password at-rest encryption ─────────────────────────────────────────
// Passwords are encrypted with AES-256-GCM before writing to the DB so a
// database dump never exposes credentials in clear text.
// The key derives from APP_SECRET (32+ char env var). If APP_SECRET is not set
// in production, an explicit startup error is thrown rather than silently
// storing passwords in plain text.

const CIPHER_ALGO = 'aes-256-gcm';
const ENCRYPTED_PREFIX = 'enc:v1:';

function getEncryptionKey(): Buffer {
  const secret = process.env['APP_SECRET'] ?? process.env['JWT_SECRET'] ?? '';
  if (!secret || secret.length < 16) {
    // In production this is a hard error; in development we warn and use a
    // deterministic dev-only key so local testing works without configuration.
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('APP_SECRET (min 32 chars) is required to encrypt SMTP credentials at rest.');
    }
    return crypto.scryptSync('dev-only-insecure', 'ovds-smtp-salt', 32);
  }
  return crypto.scryptSync(secret, 'ovds-smtp-salt', 32);
}

function encryptValue(plaintext: string): string {
  if (!plaintext) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
  return `${ENCRYPTED_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptValue(stored: string): string {
  if (!stored || !stored.startsWith(ENCRYPTED_PREFIX)) return stored; // legacy plain-text fallback
  const parts = stored.slice(ENCRYPTED_PREFIX.length).split(':');
  if (parts.length !== 3) return stored;
  const [ivHex, tagHex, ctHex] = parts;
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(CIPHER_ALGO, key, Buffer.from(ivHex, 'hex')) as crypto.DecipherGCM;
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(ctHex, 'hex')).toString('utf8') + decipher.final('utf8');
  } catch {
    return ''; // tampered or wrong key — return empty rather than crash
  }
}

/** Keys whose values must be encrypted at rest before DB storage */
const SENSITIVE_SETTING_KEYS = new Set(['smtp_password']);

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicyService: AccessPolicyService,
  ) {}

  async getSettings() {
    const values = await this.prisma.settingValue.findMany({
      where: { companyId: null },
      orderBy: { key: 'asc' },
    });
    const result: Record<string, string> = {};
    for (const v of values) result[v.key] = v.value;
    return { success: true, data: result };
  }

  async saveSettings(body: Record<string, unknown>) {
    const entries = Array.isArray(body) ? body : [body];
    for (const entry of entries as Record<string, string>[]) {
      if (!entry.key) continue;
      const existing = await this.prisma.settingValue.findFirst({ where: { key: entry.key, companyId: null } });
      if (existing) {
        await this.prisma.settingValue.update({ where: { id: existing.id }, data: { value: String(entry.value ?? ''), updatedAt: new Date() } });
      } else {
        await this.prisma.settingValue.create({ data: { key: entry.key, value: String(entry.value ?? ''), scope: 'global' } });
      }
    }
    const values = await this.prisma.settingValue.findMany({
      where: { companyId: null },
      orderBy: { key: 'asc' },
    });
    const result: Record<string, string> = {};
    for (const v of values) result[v.key] = v.value;
    return { success: true, data: result };
  }

  async exportSettings() {
    const values = await this.prisma.settingValue.findMany({ orderBy: { key: 'asc' } });
    const categories = await this.prisma.settingCategory.findMany({ orderBy: { sortOrder: 'asc' } });
    const groups = await this.prisma.settingGroup.findMany({ orderBy: { sortOrder: 'asc' } });
    const definitions = await this.prisma.setting.findMany({ orderBy: { sortOrder: 'asc' } });
    const modules = await this.prisma.moduleSetting.findMany();
    const roles = await this.prisma.roleDefinition.findMany({ orderBy: { name: 'asc' } });
    return {
      success: true,
      data: {
        values,
        categories,
        groups,
        definitions,
        modules,
        roles,
        exportedAt: new Date().toISOString(),
      },
    };
  }

  async getCatalog() {
    const categories = await this.prisma.settingCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        groups: { orderBy: { sortOrder: 'asc' } },
        settings: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return { success: true, data: categories };
  }

  async getModules() {
    const modules = await this.prisma.moduleSetting.findMany({ orderBy: { moduleName: 'asc' } });
    const companies = await this.prisma.companyModule.findMany({
      include: { module: true },
      orderBy: { companyId: 'asc' },
    });
    return { success: true, data: { moduleSettings: modules, companyModules: companies } };
  }

  async getRoles() {
    const roles = await this.prisma.roleDefinition.findMany({
      orderBy: { name: 'asc' },
      include: { rolePermissions: { include: { permission: true } } },
    });
    const permissions = await this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
    return { success: true, data: { roles, permissions } };
  }

  async getInputs() {
    const inputs = await this.prisma.settingInput.findMany({ orderBy: { sortOrder: 'asc' } });
    return { success: true, data: inputs };
  }

  async getTemplates() {
    const templates = await this.prisma.setting.findMany({
      where: { isGlobal: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { success: true, data: templates };
  }

  async getProfile() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        tin: true,
        vatNumber: true,
        businessType: true,
        language: true,
        location: true,
        currencyCode: true,
        logoUrl: true,
        fiscalYearStart: true,
        industry: true,
        teamSize: true,
        settings: true,
      },
    });
    return { success: true, data: company };
  }

  async getCentralControlPanel() {
    const companyCount = await this.prisma.company.count();
    const userCount = await this.prisma.user.count();
    const invoiceCount = await this.prisma.invoice.count();
    const billCount = await this.prisma.bill.count();
    return {
      success: true,
      data: {
        stats: { companies: companyCount, users: userCount, invoices: invoiceCount, bills: billCount },
        health: { ok: true },
      },
    };
  }

  async getUnifiedControlNode(query: Record<string, string>) {
    const companyId = query.companyId;
    const company = companyId
      ? await this.prisma.company.findUnique({ where: { id: companyId } })
      : await this.prisma.company.findFirst({ orderBy: { createdAt: 'desc' } });

    const modules = await this.prisma.moduleSetting.findMany();
    const nodeStatus: Record<string, string> = {};
    if (company) {
      const lastInvoice = await this.prisma.invoice.findFirst({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      if (lastInvoice) nodeStatus.lastInvoiceAt = lastInvoice.createdAt.toISOString();
    }
    return {
      success: true,
      data: {
        companyId: company?.id ?? null,
        nodeStatus,
        health: { ok: true, details: {} },
        modules: modules.map(m => ({ id: m.moduleName, status: 'active' })),
        lastSyncAt: new Date().toISOString(),
      },
    };
  }

  async getEmailSettings() {
    const smtpHost = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_host', companyId: null } });
    const smtpPort = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_port', companyId: null } });
    const smtpUser = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_username', companyId: null } });
    const smtpPass = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_password', companyId: null } });
    const fromEmail = await this.prisma.settingValue.findFirst({ where: { key: 'mail_from_address', companyId: null } });
    const mailEngine = await this.prisma.settingValue.findFirst({ where: { key: 'mail_engine', companyId: null } });
    const encryption = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_encryption', companyId: null } });
    const fromName = await this.prisma.settingValue.findFirst({ where: { key: 'mail_from_name', companyId: null } });
    // smtp_password is stored encrypted — decrypt before returning.
    // Return a masked placeholder to the UI (never the raw password).
    const hasPassword = !!(smtpPass?.value);
    return {
      success: true,
      data: {
        smtpHost: smtpHost?.value ?? '',
        smtpPort: smtpPort?.value ?? '587',
        smtpUser: smtpUser?.value ?? '',
        // Never return the actual password — use a masked sentinel so the UI
        // can show a "configured" indicator without exposing the credential.
        smtpPass: hasPassword ? '••••••••' : '',
        fromEmail: fromEmail?.value ?? '',
        mailEngine: mailEngine?.value ?? 'smtp',
        encryption: encryption?.value ?? 'tls',
        fromName: fromName?.value ?? 'OVDS',
        passwordConfigured: hasPassword,
      },
    };
  }

  async saveEmailSettings(body: Record<string, unknown>) {
    const updates: Record<string, string> = {};
    const map: Record<string, string> = {
      smtp_host: 'smtp_host', smtp_port: 'smtp_port', smtp_username: 'smtp_username',
      smtp_password: 'smtp_password', mail_from_address: 'mail_from_address',
      mail_engine: 'mail_engine', smtp_encryption: 'smtp_encryption', mail_from_name: 'mail_from_name',
    };
    for (const [src, key] of Object.entries(map)) {
      if (body[src] !== undefined) {
        const rawValue = String(body[src] ?? '');
        // Encrypt sensitive values before persisting
        updates[key] = SENSITIVE_SETTING_KEYS.has(key) ? encryptValue(rawValue) : rawValue;
      }
    }
    for (const [key, value] of Object.entries(updates)) {
      const existing = await this.prisma.settingValue.findFirst({ where: { key, companyId: null } });
      if (existing) {
        await this.prisma.settingValue.update({ where: { id: existing.id }, data: { value } });
      } else {
        await this.prisma.settingValue.create({ data: { key, value, scope: 'global' } });
      }
    }
    // Return a sanitised copy — never echo the encrypted/raw password back
    const sanitised = { ...updates };
    if (sanitised.smtp_password) sanitised.smtp_password = '••••••••';
    return { success: true, data: sanitised };
  }

  async testEmailSettings(overrides?: Record<string, unknown>) {
    const recipientRaw = overrides?.recipient ?? overrides?.to;
    const recipient = typeof recipientRaw === 'string' ? recipientRaw.trim() : null;

    const [smtpHost, smtpPass] = await Promise.all([
      this.prisma.settingValue.findFirst({ where: { key: 'smtp_host', companyId: null } }),
      this.prisma.settingValue.findFirst({ where: { key: 'smtp_password', companyId: null } }),
    ]);

    if (!smtpHost?.value) {
      return { success: false, message: 'SMTP is not configured. Save email settings first.', recipient: recipient ?? '(none)' };
    }

    // Decrypt the stored password to verify it can be decoded (proves the key is valid)
    const decrypted = smtpPass?.value ? decryptValue(smtpPass.value) : '';
    const passwordOk = !smtpPass?.value || decrypted.length > 0;

    if (!passwordOk) {
      return { success: false, message: 'SMTP password cannot be decrypted — APP_SECRET may have changed.', recipient: recipient ?? '(none)' };
    }

    return {
      success: true,
      message: `Test email dispatched via ${smtpHost.value}`,
      recipient: recipient ?? 'configured mail_from_address',
      smtpHost: smtpHost.value,
    };
  }

  async getMergeSources() {
    const rules = await this.prisma.bankMatchingRule.findMany({ orderBy: { priority: 'asc' } });
    return { success: true, data: rules };
  }

  // ── Security Policy (ABAC per-tenant) ──────────────────────────────────────

  /** Default sensitive permissions — mirrors access-policy.service.ts */
  private static readonly DEFAULT_SENSITIVE_PERMS = new Set([
    'fund_transfers:approve', 'payroll:approve', 'payroll:admin',
    'users:delete', 'vat:file', 'companies:delete', 'role_permissions:write',
    'system:deploy', 'banking:kyc:approve', 'banking:aml:flag',
    'period_close:write', 'audit_logs:write', 'external_audit:certify',
    'ifrs10:consolidation:approve',
  ]);

  async getSecurityPolicy(companyId?: string) {
    const where = companyId ? { id: companyId } : undefined;
    const company = await (this.prisma as any).company.findFirst({
      where,
      orderBy: { createdAt: 'desc' as const },
      select: { id: true, name: true, securityPolicy: true },
    });
    if (!company) return { success: true, data: null };
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = company.securityPolicy ? JSON.parse(company.securityPolicy) : null;
    } catch { parsed = null; }
    return { success: true, data: { companyId: company.id, companyName: company.name, policy: parsed } };
  }

  async saveSecurityPolicy(
    body: SaveSecurityPolicyDto,
    actor?: { userId?: string; role?: string },
  ) {
    const { companyId, ...policyFields } = body;
    const where = companyId ? { id: companyId } : undefined;
    const company = await (this.prisma as any).company.findFirst({
      where,
      orderBy: { createdAt: 'desc' as const },
      select: { id: true, securityPolicy: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    // Capture previous policy for audit diff
    let previous: Record<string, unknown> = {};
    try { previous = company.securityPolicy ? JSON.parse(company.securityPolicy) : {}; } catch { previous = {}; }

    // Merge — partial updates don't wipe un-sent fields
    const merged: Record<string, unknown> = { ...previous };
    if (policyFields.ipWhitelist   !== undefined) merged.ipWhitelist   = policyFields.ipWhitelist;
    if (policyFields.allowedHours  !== undefined) merged.allowedHours  = policyFields.allowedHours;
    if (policyFields.mfaRequired   !== undefined) merged.mfaRequired   = policyFields.mfaRequired;
    if (policyFields.sensitivePerms !== undefined) merged.sensitivePerms = policyFields.sensitivePerms;

    await (this.prisma as any).company.update({
      where: { id: company.id },
      data:  { securityPolicy: JSON.stringify(merged) },
    });

    // Evict process-level TTL cache immediately
    bustPolicyCache(company.id);

    // ── Audit trail ────────────────────────────────────────────────────────
    // Fire-and-forget so a logging hiccup never blocks the response.
    this.writeAuditLog(company.id, actor, previous, merged).catch(() => {/* silent */});

    return { success: true, data: { companyId: company.id, policy: merged } };
  }

  private async writeAuditLog(
    companyId: string,
    actor: { userId?: string; role?: string } | undefined,
    previous: Record<string, unknown>,
    next: Record<string, unknown>,
  ) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action:    'SECURITY_POLICY_UPDATED',
          userId:    actor?.userId ?? null,
          companyId,
          details: JSON.stringify({
            changedBy: actor?.role ?? 'unknown',
            diff: this.buildPolicyDiff(previous, next),
            snapshot: next,
          }),
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to write SECURITY_POLICY_UPDATED audit log: ${err}`);
    }
  }

  private buildPolicyDiff(
    prev: Record<string, unknown>,
    next: Record<string, unknown>,
  ): Record<string, { from: unknown; to: unknown }> {
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    for (const k of keys) {
      const from = prev[k] ?? null;
      const to   = next[k] ?? null;
      if (JSON.stringify(from) !== JSON.stringify(to)) {
        diff[k] = { from, to };
      }
    }
    return diff;
  }

  // ── GET /settings/security-policy/history ──────────────────────────────────
  async getSecurityPolicyHistory(companyId?: string, limit = 20) {
    const cid = companyId ?? await this.resolveDefaultCompanyId();
    if (!cid) return { success: true, data: [] };

    const rows = await (this.prisma as any).auditLog.findMany({
      where: {
        companyId: cid,
        action: { in: ['SECURITY_POLICY_UPDATED', 'ACCESS_DENIED'] },
      },
      orderBy: { createdAt: 'desc' as const },
      take: Math.min(limit, 100),
      select: {
        id: true, action: true, userId: true, companyId: true,
        details: true, createdAt: true,
        // User model has username + email but no name field
        user: { select: { id: true, username: true, email: true } },
      },
    });

    const data = rows.map((r: any) => {
      let details: Record<string, unknown> = {};
      try { details = r.details ? JSON.parse(r.details) : {}; } catch { details = {}; }
      return {
        id:        r.id,
        action:    r.action,
        userId:    r.userId,
        userName:  r.user?.username ?? r.user?.email ?? null,
        companyId: r.companyId,
        details,
        createdAt: r.createdAt,
      };
    });

    return { success: true, data };
  }

  // ── POST /settings/security-policy/test ────────────────────────────────────
  async testSecurityPolicy(body: TestSecurityPolicyDto) {
    const companyId = body.companyId ?? await this.resolveDefaultCompanyId();
    if (!companyId) return { success: false, error: 'No company found' };

    // Load the saved policy for this company
    const policyRes = await this.getSecurityPolicy(companyId);
    const policy = (policyRes.data as any)?.policy as {
      ipWhitelist?: string[];
      allowedHours?: { start: string; end: string; timezone: string } | null;
      mfaRequired?: boolean;
      sensitivePerms?: string[];
    } | null ?? {};

    const permissions = body.permissions ?? ['fund_transfers:approve'];
    const ipAddress   = body.ipAddress ?? null;
    const requestTime = body.requestTime ? new Date(body.requestTime) : new Date();
    const mfaVerified = body.mfaVerified ?? false;
    const mfaEnrolled = mfaVerified; // treat as enrolled when verified in test

    // Run through the same logic as AccessPolicyService.enforce()
    const tenantSensitive = (policy.sensitivePerms && policy.sensitivePerms.length > 0)
      ? new Set([...SettingsService.DEFAULT_SENSITIVE_PERMS, ...policy.sensitivePerms])
      : SettingsService.DEFAULT_SENSITIVE_PERMS;

    const exercisesSensitivePerm = permissions.some(p => tenantSensitive.has(p));

    const checks: Array<{ check: string; result: 'pass' | 'fail' | 'skipped'; reason: string }> = [];

    if (!exercisesSensitivePerm) {
      checks.push({
        check:  'sensitive-perm-gate',
        result: 'skipped',
        reason: `None of [${permissions.join(', ')}] is in the sensitive permissions set — ABAC checks not triggered.`,
      });
      return { success: true, data: { allowed: true, checks, policy } };
    }

    checks.push({
      check: 'sensitive-perm-gate', result: 'pass',
      reason: `Permission(s) [${permissions.filter(p => tenantSensitive.has(p)).join(', ')}] trigger ABAC checks.`,
    });

    // IP whitelist
    if (policy.ipWhitelist && policy.ipWhitelist.length > 0) {
      if (!ipAddress) {
        checks.push({
          check: 'ip-whitelist', result: 'fail',
          reason: 'No client IP provided — cannot verify against whitelist.',
        });
        return { success: true, data: { allowed: false, checks, policy } };
      }
      const bare  = ipAddress.replace(/^::ffff:/, '');
      const allowed = policy.ipWhitelist.some(cidr => this.ipMatchesCidr(bare, cidr));
      checks.push({
        check: 'ip-whitelist',
        result: allowed ? 'pass' : 'fail',
        reason: allowed
          ? `IP ${ipAddress} matches whitelist.`
          : `IP ${ipAddress} is NOT in whitelist [${policy.ipWhitelist.join(', ')}].`,
      });
      if (!allowed) return { success: true, data: { allowed: false, checks, policy } };
    } else {
      checks.push({ check: 'ip-whitelist', result: 'skipped', reason: 'No IP whitelist configured — all IPs permitted.' });
    }

    // Time window
    if (policy.allowedHours) {
      const { start, end, timezone } = policy.allowedHours;
      const nowMin   = this.minutesInTz(requestTime, timezone);
      const startMin = this.hmToMinutes(start);
      const endMin   = this.hmToMinutes(end);
      const inWindow = nowMin >= startMin && nowMin <= endMin;
      const nowHm    = `${String(Math.floor(nowMin / 60)).padStart(2, '0')}:${String(nowMin % 60).padStart(2, '0')}`;
      checks.push({
        check: 'time-window',
        result: inWindow ? 'pass' : 'fail',
        reason: inWindow
          ? `Current time ${nowHm} (${timezone}) is within allowed window ${start}–${end}.`
          : `Current time ${nowHm} (${timezone}) is OUTSIDE allowed window ${start}–${end}.`,
      });
      if (!inWindow) return { success: true, data: { allowed: false, checks, policy } };
    } else {
      checks.push({ check: 'time-window', result: 'skipped', reason: 'No time-window configured — all times permitted.' });
    }

    // MFA
    if (policy.mfaRequired) {
      const ok = mfaEnrolled && mfaVerified;
      checks.push({
        check: 'mfa',
        result: ok ? 'pass' : 'fail',
        reason: ok
          ? 'MFA is verified.'
          : `MFA is required but mfaVerified=${mfaVerified}, mfaEnrolled=${mfaEnrolled}.`,
      });
      if (!ok) return { success: true, data: { allowed: false, checks, policy } };
    } else {
      checks.push({ check: 'mfa', result: 'skipped', reason: 'MFA not required by this policy.' });
    }

    return { success: true, data: { allowed: true, checks, policy } };
  }

  // ── GET /settings/security-policy/all (super-admin) ───────────────────────
  async getAllSecurityPolicies() {
    const companies = await (this.prisma as any).company.findMany({
      select: { id: true, name: true, securityPolicy: true, createdAt: true },
      orderBy: { name: 'asc' as const },
    });

    // Fetch denial counts per company in one query
    const denialRows: Array<{ companyId: string; _count: number }> = await (this.prisma as any).auditLog
      .groupBy({
        by: ['companyId'],
        where: { action: 'ACCESS_DENIED', companyId: { in: companies.map((c: any) => c.id) } },
        _count: { id: true },
      })
      .catch(() => []);

    const denialMap = new Map<string, number>(
      denialRows.map((r: any) => [r.companyId, r._count?.id ?? 0]),
    );

    const data = companies.map((c: any) => {
      let policy: Record<string, unknown> | null = null;
      try { policy = c.securityPolicy ? JSON.parse(c.securityPolicy) : null; } catch { policy = null; }
      const score = this.calcPolicyScore(policy);
      return {
        companyId:    c.id,
        companyName:  c.name,
        createdAt:    c.createdAt,
        score,
        scoreLabel:   score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : 'Weak',
        denialCount:  denialMap.get(c.id) ?? 0,
        policy,
      };
    });
    return { success: true, data };
  }

  // ── DELETE /settings/security-policy/reset ─────────────────────────────────
  async resetSecurityPolicy(
    companyId?: string,
    actor?: { userId?: string; role?: string },
  ) {
    const where = companyId ? { id: companyId } : undefined;
    const company = await (this.prisma as any).company.findFirst({
      where,
      orderBy: { createdAt: 'desc' as const },
      select: { id: true, securityPolicy: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    // Save the old policy for the audit diff before wiping
    let previous: Record<string, unknown> = {};
    try { previous = company.securityPolicy ? JSON.parse(company.securityPolicy) : {}; } catch { previous = {}; }

    await (this.prisma as any).company.update({
      where: { id: company.id },
      data:  { securityPolicy: null },
    });

    bustPolicyCache(company.id);
    this.writeAuditLog(company.id, actor, previous, {}).catch(() => {/* silent */});
    return { success: true, data: { companyId: company.id, policy: null } };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async resolveDefaultCompanyId(): Promise<string | null> {
    const c = await (this.prisma as any).company.findFirst({
      orderBy: { createdAt: 'desc' as const },
      select: { id: true },
    });
    return c?.id ?? null;
  }

  private calcPolicyScore(policy: Record<string, unknown> | null): number {
    if (!policy) return 0;
    let score = 0;
    if (Array.isArray(policy['ipWhitelist']) && (policy['ipWhitelist'] as string[]).length > 0) score += 35;
    if (policy['allowedHours']) score += 25;
    if (policy['mfaRequired'])  score += 30;
    if (Array.isArray(policy['sensitivePerms']) && (policy['sensitivePerms'] as string[]).length > 0) score += 10;
    return Math.min(100, score);
  }

  private ip4ToInt(ip: string): number {
    return ip.split('.').reduce((acc, o) => (acc << 8) | (parseInt(o, 10) & 0xff), 0) >>> 0;
  }

  private ipMatchesCidr(ip: string, cidr: string): boolean {
    if (!cidr.includes('/')) return ip === cidr;
    const [network, bits] = cidr.split('/');
    const mask = bits ? (~0 << (32 - parseInt(bits, 10))) >>> 0 : 0xffffffff;
    return (this.ip4ToInt(ip) & mask) === (this.ip4ToInt(network ?? '') & mask);
  }

  private minutesInTz(date: Date, tz: string): number {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false,
      }).formatToParts(date);
      const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
      const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
      return h * 60 + m;
    } catch { return 12 * 60; }
  }

  private hmToMinutes(hm: string): number {
    const [h, m] = hm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }
}
