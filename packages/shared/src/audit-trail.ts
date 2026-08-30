/**
 * Audit trail types — shared between frontend and backend.
 *
 * Covers system-level audit logs (user actions, data changes, login events).
 * Distinct from audit-outsourcing.ts which covers MoR / external auditor workflows.
 * (MoR = Ministry of Revenues, formerly ERCA, restructured under Proc. No. 1097/2018)
 */

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  | 'LOGIN'  | 'LOGOUT' | 'LOGIN_FAILED' | 'MFA_CHALLENGE'
  | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT'
  | 'SUBMIT' | 'FILE'   | 'VOID'    | 'REVERSE'
  | 'LOCK'   | 'UNLOCK' | 'ARCHIVE'
  | 'SETTINGS_CHANGE' | 'PERMISSION_CHANGE' | 'PASSWORD_CHANGE'
  | 'API_CALL' | 'SYSTEM';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLogEntry {
  id:          string;
  companyId?:  string;
  userId?:     string;
  userName?:   string;
  userRole?:   string;
  action:      AuditAction;
  resource:    string;    // e.g. 'Invoice', 'Employee', 'VatFiling'
  resourceId?: string;
  description: string;
  severity:    AuditSeverity;
  ipAddress?:  string;
  userAgent?:  string;
  /** JSON snapshot of data before change */
  before?:     Record<string, unknown> | null;
  /** JSON snapshot of data after change */
  after?:      Record<string, unknown> | null;
  /** Changed field names */
  changedFields?: string[];
  metadata?:   Record<string, unknown>;
  createdAt:   string;
}

export interface AuditLogQuery {
  page?:       number;
  limit?:      number;
  userId?:     string;
  action?:     AuditAction;
  resource?:   string;
  resourceId?: string;
  severity?:   AuditSeverity;
  dateFrom?:   string;
  dateTo?:     string;
  search?:     string;
  sortBy?:     string;
  sortOrder?:  'asc' | 'desc';
}

export interface AuditLogSummary {
  total:       number;
  byAction:    Record<string, number>;
  bySeverity:  Record<AuditSeverity, number>;
  byResource:  Record<string, number>;
  recentHigh:  AuditLogEntry[];
}

/**
 * Compute a human-readable diff between two plain objects.
 * Returns an array of { field, before, after } entries.
 * Used by audit log services to describe what changed.
 */
export function diffObjects(
  before: Record<string, unknown>,
  after:  Record<string, unknown>,
): Array<{ field: string; before: unknown; after: unknown }> {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: Array<{ field: string; before: unknown; after: unknown }> = [];

  for (const key of allKeys) {
    const bv = before[key];
    const av = after[key];
    if (JSON.stringify(bv) !== JSON.stringify(av)) {
      changes.push({ field: key, before: bv, after: av });
    }
  }

  return changes;
}

/**
 * Returns a severity level for a given audit action.
 * Defaults to LOW for read/view operations; HIGH/CRITICAL for destructive ones.
 */
export function auditSeverityForAction(action: AuditAction): AuditSeverity {
  const critical: AuditAction[] = ['DELETE', 'VOID', 'REVERSE', 'PERMISSION_CHANGE', 'PASSWORD_CHANGE'];
  const high:     AuditAction[] = ['FILE', 'SUBMIT', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK', 'SETTINGS_CHANGE'];
  const medium:   AuditAction[] = ['CREATE', 'UPDATE', 'IMPORT', 'EXPORT', 'ARCHIVE'];
  if (critical.includes(action)) return 'CRITICAL';
  if (high.includes(action))     return 'HIGH';
  if (medium.includes(action))   return 'MEDIUM';
  return 'LOW';
}
