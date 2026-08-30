/**
 * useIFRSAccess
 * Centralises IFRS/accounting permission checks per role.
 * Used by all IFRS components to gate content and actions.
 */
import { useAuth } from '../rbac/AuthContext';
import { Role } from '@ovds/ui';

export interface IFRSAccess {
  /** Can view any IFRS content */
  canView: boolean;
  /** Can compute VAT / DRRF (ACCOUNTING + ovds) */
  canCompute: boolean;
  /** Can submit filings (ovds only) */
  canFile: boolean;
  /** Can close periods (ovds only) */
  canClosePeriod: boolean;
  /** Can view full financial reports */
  canViewFullReports: boolean;
  /** Can annotate audit logs (AUDITOR) */
  canAudit: boolean;
  /** Is a OVDS-group role (OVDS | ACCOUNTING | AUDITOR) */
  isOVDSGroup: boolean;
  /** Role label for display */
  roleLabel: string;
  /** Hint shown when action is blocked */
  blockedHint: (action: string) => string;
}

export function useIFRSAccess(): IFRSAccess {
  const { can, is, user } = useAuth();

  const canView            = can('ovds:read');
  const canCompute         = can('vat:calculate');
  const canFile            = can('vat:file');
  const canClosePeriod     = can('period_close:write');
  const canViewFullReports = can('reports:financial:full');
  const canAudit           = can('audit_logs:write');
  const isOVDSGroup     = is(Role.OVDS, Role.ACCOUNTING, Role.AUDITOR);

  const roleLabel = user?.role ?? 'UNKNOWN';

  const blockedHint = (action: string) =>
    `Your role (${roleLabel}) does not have permission to ${action}. Contact your OVDS Manager or SPURADMIN.`;

  return {
    canView,
    canCompute,
    canFile,
    canClosePeriod,
    canViewFullReports,
    canAudit,
    isOVDSGroup,
    roleLabel,
    blockedHint,
  };
}

