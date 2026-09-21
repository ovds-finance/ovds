import { advancedAccessApi, sodRulesApi, auditEventCatalogApi, permissionsApi, type RolePermissionOverrideDTO } from '@ovds/features/settings';
import { permissionCatalog } from '@ovds/shared';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle, AlertTriangle, ArrowRight, BarChart3, BookOpen,
  Check, CheckCircle2, ChevronDown,
  ChevronRight, FileText, Info, Kanban,
  Lock, Route, Search, Shield,
  ShieldCheck, Star, TrendingUp,
  User, Users, X, Zap, BarChart2, Grid3x3,
  GitCompare, Activity, Layers, AlertOctagon, Fingerprint,
  Scale, Gauge, Play, Clock,
  CheckSquare, XSquare, HelpCircle, Crosshair, FlaskConical,
  Download, Copy, CheckCheck, Keyboard, History, Bell,
  Lightbulb, Package, RefreshCw,
  Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save,
  Building2, SortAsc, SortDesc, Trash,
} from "lucide-react";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { usePageTitle } from "../hooks/usePageTitle";
import { useRbac } from "../hooks/useRbac";
import { orpc } from "../lib/orpc";
import {
  rbac, ROLE_METADATA, ROLE_HIERARCHY, ROLE_GROUPS,
  ROUTE_PERMISSIONS, RESOURCE_DOMAINS_FLAT, PERMISSION_GROUPS, SENSITIVE_ROUTES,
  type AppRole, type Permission,
} from "../rbac";
import { useAuth } from "../rbac/AuthContext";
import api from "../services/api";
import { fmtDateTime } from "../utils/fmt";


// -- Derived constants used throughout the page --------------------------------
// ROUTE_PERMISSIONS is the alias for ROUTE_POLICY in this codebase
const ROUTE_POLICY = ROUTE_PERMISSIONS;

// Build ROLE_PERMISSIONS from rbac.permissionsFor for each role
const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = Object.fromEntries(
  (Object.keys(ROLE_HIERARCHY) as AppRole[]).map(role => [role, rbac.permissionsFor(role)])
) as Record<AppRole, Permission[]>;

// -----------------------------------------------------------------------------
// Types & Constants
// -----------------------------------------------------------------------------

type ViewMode =
  | 'by-role' | 'matrix' | 'diff' | 'groups' | 'coverage'
  | 'routes' | 'ifrs' | 'OVDS' | 'risk' | 'sod' | 'simulate' | 'audit' | 'policy' | 'smart-rules' | 'app-access'
  | 'overrides'
  | 'custom-roles' | 'permissions' | 'security-policy';

const ALL_ROLES = Object.keys(ROLE_HIERARCHY) as AppRole[];

const ROLE_TEMPLATES: { label: string; role: AppRole; icon: string }[] = [
  { label: 'Accounting / Accountant', role: 'ACCOUNTING', icon: 'ACCOUNTING' },
  { label: 'Manager', role: 'ADMIN', icon: 'ADMIN' },
  { label: 'Employee', role: 'EMPLOYEE', icon: 'EMPLOYEE' },
  { label: 'Customer / Client', role: 'CLIENT', icon: 'CLIENT' },
];

const allPerms: { name: string; id: string }[] = Object.values(PERMISSION_GROUPS).flatMap(g => g.permissions.map(p => ({ name: p, id: p })));

function applyTemplate(templateRole: AppRole): Set<string> {
  const permNames = ROLE_PERMISSIONS[templateRole] ?? [];
  const nameToId = new Map<string, string>();
  for (const p of allPerms) nameToId.set(p.name, p.id);
  return new Set(permNames.map(p => p).filter(n => nameToId.has(n)).map(n => nameToId.get(n)!));
}

const CRITICAL_PERMISSIONS_FALLBACK: Permission[] = [
  'vat:file', 'companies:delete', 'role_permissions:write',
  'system:deploy', 'banking:kyc:approve', 'banking:aml:flag',
  'payroll:admin', 'ovds:delete', 'audit_logs:write',
  'banking:loan_application:submit', 'external_audit:certify',
  'period_close:write', 'ifrs10:consolidation:approve',
];

function calcRiskScore(role: AppRole): number {
  if (role === 'SPURADMIN' || role === 'SUPERADMIN') return 100;
  const perms = new Set(rbac.permissionsFor(role));
  const criticalHits = CRITICAL_PERMISSIONS_FALLBACK.filter(p => perms.has(p)).length;
  const adminPerms = rbac.permissionsFor(role).filter(p =>
    p.includes(':delete') || p.includes(':approve') || p.includes(':admin') ||
    p.includes(':deploy') || p.includes(':certify')
  ).length;
  const writePerms = rbac.permissionsFor(role).filter(p =>
    p.includes(':write') || p.includes(':generate') || p.includes(':file') || p.includes(':calculate')
  ).length;
  const score = Math.min(100, Math.round((criticalHits * 8 + adminPerms * 3 + writePerms * 1.5) / 1.2));
  return score;
}

function riskColor(score: number): string {
  if (score >= 61) return 'text-rose-400';
  if (score >= 31) return 'text-amber-400';
  return 'text-[var(--pro-azure-light)]';
}

function riskBg(score: number): string {
  if (score >= 61) return 'bg-rose-500/10 border-rose-500/30';
  if (score >= 31) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-[var(--pro-azure-50)]0/10 border-slate-200';
}

function riskLabel(score: number): string {
  if (score >= 61) return 'High Risk';
  if (score >= 31) return 'Medium Risk';
  return 'Low Risk';
}

function permRiskColor(perm: Permission): string {
  if (perm.includes(':delete') || perm.includes(':approve') || perm.includes(':admin') ||
      perm.includes(':deploy') || perm.includes(':certify') || perm.includes(':flag')) {
    return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
  }
  if (perm.includes(':write') || perm.includes(':generate') || perm.includes(':file') ||
      perm.includes(':calculate') || perm.includes(':submit')) {
    return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
  }
  return 'bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)] dark:text-green-300 border border-[var(--pro-azure)]/20';
}

function isSensitivePerm(perm: Permission): boolean {
  return CRITICAL_PERMISSIONS_FALLBACK.includes(perm);
}

interface SodRule {
  id: string;
  name: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  perm1: Permission;
  perm2: Permission;
  description: string;
}

const SOD_RULES_FALLBACK: SodRule[] = [
  { id: 'SOD-001', name: 'Payroll Preparer vs Approver', risk: 'critical',
    perm1: 'payroll:generate', perm2: 'payroll:approve',
    description: 'Same role should not generate AND approve payroll' },
  { id: 'SOD-002', name: 'Invoice Creator vs Approver', risk: 'high',
    perm1: 'invoices:write', perm2: 'ovds:approve',
    description: 'Same role should not create invoices AND approve payments' },
  { id: 'SOD-003', name: 'VAT Filer vs VAT Auditor', risk: 'high',
    perm1: 'vat:file', perm2: 'audit_logs:write',
    description: 'Tax filing and audit annotation should be separate' },
  { id: 'SOD-004', name: 'User Admin vs Audit Log', risk: 'critical',
    perm1: 'users:delete', perm2: 'audit_logs:write',
    description: 'User deletion and audit log write creates cover-up risk' },
  { id: 'SOD-005', name: 'Fund Transfer vs Approval', risk: 'critical',
    perm1: 'fund_transfers:write', perm2: 'fund_transfers:approve',
    description: 'Initiating and approving fund transfers must be separate' },
  { id: 'SOD-006', name: 'KYC Entry vs KYC Approval', risk: 'high',
    perm1: 'banking:kyc:write', perm2: 'banking:kyc:approve',
    description: 'KYC data entry and approval must be separate (AML compliance)' },
  { id: 'SOD-007', name: 'Loan Application vs Disbursement', risk: 'critical',
    perm1: 'banking:loan_application:write', perm2: 'business_loans:approve',
    description: 'Loan application and disbursement approval must be separate' },
  { id: 'SOD-008', name: 'Period Close vs Financial Reporting', risk: 'medium',
    perm1: 'period_close:write', perm2: 'reports:financial:full',
    description: 'Period close authority with full report access needs oversight' },
];

function _sodRiskColor(risk: SodRule['risk']): string {
  if (risk === 'critical') return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  if (risk === 'high') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
}

function sodRiskBadge(risk: SodRule['risk']): string {
  if (risk === 'critical') return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
  if (risk === 'high') return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
  return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
}

// -----------------------------------------------------------------------------
// CSV Export utility
// -----------------------------------------------------------------------------

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// SoD Remediation suggestions
// -----------------------------------------------------------------------------

const SOD_REMEDIATION_FALLBACK: Record<string, string[]> = {
  'SOD-001': [
    'Split payroll generation (HR role) from payroll approval (ovds role)',
    'Require a second approver from a different role group for payroll runs',
    'Implement a 4-eyes principle: HR generates, ovds approves, AUDITOR reviews',
  ],
  'SOD-002': [
    'Restrict invoice creation to ACCOUNTING; approval to ovds only',
    'Add a workflow step requiring ovds sign-off before payment release',
    'Use purchase order matching to auto-validate invoices below threshold',
  ],
  'SOD-003': [
    'Assign VAT filing exclusively to ovds; audit annotation to AUDITOR',
    'Implement read-only VAT access for AUDITOR with separate annotation rights',
    'Require AUDITOR review of all VAT filings before submission',
  ],
  'SOD-004': [
    'Restrict user deletion to SPURADMIN/SUPERADMIN only',
    'Require dual approval for user deletion: ADMIN initiates, SPURADMIN confirms',
    'Implement soft-delete with mandatory audit log entry before hard delete',
  ],
  'SOD-005': [
    'Separate fund transfer initiation (ACCOUNTING) from approval (ovds)',
    'Implement dual-control: two ovds users must approve transfers above threshold',
    'Add a cooling-off period for large transfers with automated AUDITOR notification',
  ],
  'SOD-006': [
    'Assign KYC data entry to BANK_LIAISON; approval authority to ovds only',
    'Require independent KYC review by a compliance officer before approval',
    'Implement automated AML screening before KYC approval is permitted',
  ],
  'SOD-007': [
    'Restrict loan application submission to BANK_LIAISON; disbursement approval to ovds',
    'Require credit committee approval (multi-role) for loans above threshold',
    'Implement a mandatory waiting period between application and disbursement',
  ],
  'SOD-008': [
    'Restrict period close to ovds; full report access to AUDITOR for review',
    'Require AUDITOR sign-off on financial reports before period can be closed',
    'Implement a pre-close checklist requiring AUDITOR confirmation',
  ],
};

// -----------------------------------------------------------------------------
// Audit Intelligence data
// -----------------------------------------------------------------------------

interface AuditEvent {
  permission: Permission;
  event: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  regulation: string;
  retentionYears: number;
}

const AUDIT_EVENTS_FALLBACK: AuditEvent[] = [
  { permission: 'users:delete',              event: 'User account permanently deleted',         severity: 'critical', regulation: 'ISO 27001 A.9.2.6',    retentionYears: 7 },
  { permission: 'users:write',               event: 'User account created or modified',         severity: 'high',     regulation: 'ISO 27001 A.9.2.2',    retentionYears: 5 },
  { permission: 'role_permissions:write',    event: 'Role permission set modified',             severity: 'critical', regulation: 'ISO 27001 A.9.2.3',    retentionYears: 7 },
  { permission: 'payroll:approve',           event: 'Payroll run approved for disbursement',    severity: 'critical', regulation: 'IAS 19 / ETH Labour',   retentionYears: 10 },
  { permission: 'payroll:generate',          event: 'Payroll run generated',                    severity: 'high',     regulation: 'IAS 19',                retentionYears: 10 },
  { permission: 'fund_transfers:approve',    event: 'Fund transfer approved',                   severity: 'critical', regulation: 'NBE AML Directive',     retentionYears: 10 },
  { permission: 'fund_transfers:write',      event: 'Fund transfer initiated',                  severity: 'high',     regulation: 'NBE AML Directive',     retentionYears: 10 },
  { permission: 'vat:file',                  event: 'VAT return filed with ERCA',               severity: 'critical', regulation: 'VAT Proc. 1341/2024',   retentionYears: 10 },
  { permission: 'vat:delete',               event: 'VAT record deleted',                       severity: 'high',     regulation: 'VAT Proc. 1341/2024',   retentionYears: 10 },
  { permission: 'bit:file',                 event: 'Business income tax return filed',          severity: 'critical', regulation: 'Income Tax 979/2016',   retentionYears: 10 },
  { permission: 'companies:delete',          event: 'Company entity deleted',                   severity: 'critical', regulation: 'Commercial Code 2021',  retentionYears: 10 },
  { permission: 'audit_logs:write',          event: 'Audit log entry annotated',                severity: 'high',     regulation: 'ISO 27001 A.12.4.1',   retentionYears: 7 },
  { permission: 'period_close:write',        event: 'Accounting period closed/locked',          severity: 'critical', regulation: 'IAS 1 / IFRS 18',       retentionYears: 10 },
  { permission: 'banking:kyc:approve',       event: 'KYC verification approved',                severity: 'critical', regulation: 'NBE KYC Directive',     retentionYears: 10 },
  { permission: 'banking:aml:flag',          event: 'AML suspicious activity flagged',          severity: 'critical', regulation: 'FATF / NBE AML',        retentionYears: 10 },
  { permission: 'banking:loan_application:submit', event: 'Loan application submitted to bank', severity: 'high',   regulation: 'NBE Credit Directive',  retentionYears: 7 },
  { permission: 'external_audit:certify',    event: 'Financial statements certified',           severity: 'critical', regulation: 'IFRS / Commercial Code', retentionYears: 10 },
  { permission: 'ifrs10:consolidation:approve', event: 'Consolidated statements approved',     severity: 'critical', regulation: 'IFRS 10',               retentionYears: 10 },
  { permission: 'ovds:delete',            event: 'Financial record permanently deleted',     severity: 'critical', regulation: 'IAS 1 / Commercial Code',retentionYears: 10 },
  { permission: 'ovds:approve',           event: 'Financial transaction approved',           severity: 'high',     regulation: 'IAS 1',                 retentionYears: 7 },
  { permission: 'invoices:delete',           event: 'Invoice permanently deleted',              severity: 'high',     regulation: 'VAT Proc. 1341/2024',   retentionYears: 7 },
  { permission: 'system:deploy',             event: 'System deployment executed',               severity: 'critical', regulation: 'ISO 27001 A.12.5.1',   retentionYears: 5 },
  { permission: 'system:config',             event: 'System configuration changed',             severity: 'high',     regulation: 'ISO 27001 A.12.5.1',   retentionYears: 5 },
  { permission: 'settings:write',            event: 'Application settings modified',            severity: 'medium',   regulation: 'ISO 27001 A.12.1.2',   retentionYears: 3 },
  { permission: 'payroll:admin',             event: 'Payroll administration action performed',  severity: 'critical', regulation: 'IAS 19 / ETH Labour',   retentionYears: 10 },
];

// -----------------------------------------------------------------------------
// Shared dynamic RBAC data hook
// Fetches SoD rules, audit event catalog, and critical permissions from the API.
// Falls back to static constants when the API is unavailable.
// -----------------------------------------------------------------------------

function useRbacStaticData(companyId?: string | null) {
  const { data: sodRulesRaw } = useQuery({
    queryKey: ['rbac', 'sod-rules', companyId ?? ''],
    queryFn: () => sodRulesApi.list(companyId),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const { data: auditEventsRaw } = useQuery({
    queryKey: ['rbac', 'audit-events', companyId ?? ''],
    queryFn: () => auditEventCatalogApi.list(companyId),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const { data: permissionsRaw } = useQuery({
    queryKey: ['rbac', 'permissions', companyId ?? ''],
    queryFn: () => permissionsApi.list({ companyId }),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Map API SodRuleDTO → local SodRule shape
  const sodRules: SodRule[] = useMemo(() => {
    if (sodRulesRaw && sodRulesRaw.length > 0) {
      return sodRulesRaw.map(r => ({
        id: r.id,
        name: r.name,
        risk: r.risk as SodRule['risk'],
        perm1: r.perm1 as Permission,
        perm2: r.perm2 as Permission,
        description: r.description,
      }));
    }
    return SOD_RULES_FALLBACK;
  }, [sodRulesRaw]);

  // Build remediation map from API (DTO carries remediation[]) or fall back
  const sodRemediation: Record<string, string[]> = useMemo(() => {
    if (sodRulesRaw && sodRulesRaw.length > 0) {
      return Object.fromEntries(
        sodRulesRaw
          .filter(r => r.remediation && r.remediation.length > 0)
          .map(r => [r.id, r.remediation!])
      );
    }
    return SOD_REMEDIATION_FALLBACK;
  }, [sodRulesRaw]);

  // Map API AuditEventCatalogDTO → local AuditEvent shape
  const auditEvents: AuditEvent[] = useMemo(() => {
    if (auditEventsRaw && auditEventsRaw.length > 0) {
      return auditEventsRaw.map(e => ({
        permission: e.permission as Permission,
        event: e.event,
        severity: e.severity as AuditEvent['severity'],
        regulation: e.regulation,
        retentionYears: e.retentionYears,
      }));
    }
    return AUDIT_EVENTS_FALLBACK;
  }, [auditEventsRaw]);

  // Build critical permissions list from API (isCritical flag) or fall back
  const criticalPermissions: Permission[] = useMemo(() => {
    if (permissionsRaw && permissionsRaw.length > 0) {
      const crit = permissionsRaw
        .filter(p => p.isCritical)
        .map(p => p.key as Permission);
      return crit.length > 0 ? crit : CRITICAL_PERMISSIONS_FALLBACK;
    }
    return CRITICAL_PERMISSIONS_FALLBACK;
  }, [permissionsRaw]);

  return { sodRules, sodRemediation, auditEvents, criticalPermissions };
}

// -----------------------------------------------------------------------------
// Shared UI helpers
// -----------------------------------------------------------------------------

function RoleBadge({ role }: { role: AppRole }) {
  const meta = ROLE_METADATA[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color.badge}`}>
      {meta.label}
    </span>
  );
}

function RiskBadge({ score }: { score: number }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${riskBg(score)} ${riskColor(score)}`}>
      <Gauge className="w-3 h-3" />
      {score}
    </span>
  );
}

function MfaBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--pro-azure-50)]0/15 text-[var(--pro-azure)] dark:text-green-300 border border-slate-200">
      <Fingerprint className="w-3 h-3" />
      MFA
    </span>
  );
}

function PermChip({ perm, showMfa }: { perm: Permission; showMfa?: boolean }) {
  const sensitive = isSensitivePerm(perm);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${permRiskColor(perm)}`}>
      {sensitive && <Star className="w-2.5 h-2.5 text-yellow-400" />}
      {perm}
      {showMfa && <MfaBadge />}
    </span>
  );
}


// -----------------------------------------------------------------------------
// By-Role View
// -----------------------------------------------------------------------------

function ByRoleView() {
  const [selectedRole, setSelectedRole] = useState<AppRole>('ADMIN');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const perms = useMemo(() => rbac.permissionsFor(selectedRole), [selectedRole]);
  const riskScore = useMemo(() => calcRiskScore(selectedRole), [selectedRole]);

  const filteredPerms = useMemo(() => {
    return perms.filter(p => p.toLowerCase().includes(search.toLowerCase()));
  }, [perms, search]);

  const grouped = useMemo(() => {
    const result: Record<string, Permission[]> = {};
    const assigned = new Set<Permission>();
    for (const [gKey, gVal] of Object.entries(PERMISSION_GROUPS)) {
      const matched = filteredPerms.filter(p => gVal.permissions.includes(p));
      if (matched.length > 0) {
        result[gKey] = matched;
        matched.forEach(p => assigned.add(p));
      }
    }
    const ungrouped = filteredPerms.filter(p => !assigned.has(p));
    if (ungrouped.length > 0) result['_other'] = ungrouped;
    return result;
  }, [filteredPerms]);

  // Init expand all groups on first load
  useEffect(() => {
    setExpandedGroups(new Set(Object.keys(grouped)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole]);

  const meta = ROLE_METADATA[selectedRole];

  const handleCopy = () => {
    const lines = [`Role: ${selectedRole}`, `Permissions (${perms.length}):`, ...perms];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = () => {
    const rows = [['Role', 'Label', 'Domain', 'Permission', 'Risk Level', 'Critical']];
    Object.entries(grouped).forEach(([gKey, gPerms]) => {
      const label = gKey === '_other' ? 'Other' : (PERMISSION_GROUPS[gKey]?.label ?? gKey);
      gPerms.forEach(p => rows.push([
        selectedRole, meta.label, label, p,
        p.includes(':delete') || p.includes(':approve') || p.includes(':admin') ? 'admin' :
        p.includes(':write') || p.includes(':generate') || p.includes(':file') ? 'write' : 'read',
        isSensitivePerm(p) ? 'yes' : 'no',
      ]));
    });
    exportCSV(`role-${selectedRole.toLowerCase()}-permissions.csv`, rows);
  };

  const toggleGroup = (gKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(gKey)) next.delete(gKey);
      else next.add(gKey);
      return next;
    });
  };

  // Domain coverage bars for selected role
  const domainCoverage = useMemo(() => {
    return Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
      const granted = group.permissions.filter(p => rbac.can(selectedRole, p));
      const pct = group.permissions.length > 0 ? Math.round((granted.length / group.permissions.length) * 100) : 0;
      const hasAdmin = granted.some(p => p.includes(':delete') || p.includes(':approve') || p.includes(':admin'));
      const hasWrite = granted.some(p => p.includes(':write') || p.includes(':generate') || p.includes(':file'));
      return { key, label: group.label, total: group.permissions.length, granted: granted.length, pct, hasAdmin, hasWrite };
    }).filter(d => d.granted > 0).sort((a, b) => b.pct - a.pct);
  }, [selectedRole]);

  return (
    <div className="flex gap-5 h-full">
      {/* Role list */}
      <div className="w-56 shrink-0 space-y-1">
        <div className="mb-3">
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="w-full text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--pro-azure)]"
          >
            <option value="all">All Groups</option>
            {Object.entries(ROLE_GROUPS).map(([k, g]) => (
              <option key={k} value={k}>{g.label}</option>
            ))}
          </select>
        </div>
        {ALL_ROLES
          .filter(r => groupFilter === 'all' || ROLE_GROUPS[groupFilter]?.roles.includes(r))
          .sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a])
          .map(role => {
            const score = calcRiskScore(role);
            const m = ROLE_METADATA[role];
            return (
              <button
                key={role}
                onClick={() => { setSelectedRole(role); setSearch(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                  selectedRole === role
                    ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/30 text-[var(--pro-azure-dark)] dark:text-green-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${m.color.dot}`} />
                  <span className="text-xs font-medium truncate">{m.label}</span>
                </div>
                <RiskBadge score={score} />
              </button>
            );
          })}
      </div>

      {/* Permission detail */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Role header card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{meta.label}</h2>
                <RiskBadge score={riskScore} />
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskBg(riskScore)} ${riskColor(riskScore)}`}>
                  {riskLabel(riskScore)}
                </span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">{selectedRole}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{meta.description}</p>

              {/* Domain coverage bars */}
              {domainCoverage.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {domainCoverage.slice(0, 6).map(d => (
                    <div key={d.key} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">{d.label}</span>
                          <span className={`text-[9px] font-bold ml-1 shrink-0 ${d.hasAdmin ? 'text-rose-500' : d.hasWrite ? 'text-amber-500' : 'text-[var(--pro-azure)]'}`}>{d.pct}%</span>
                        </div>
                        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${d.hasAdmin ? 'bg-rose-500' : d.hasWrite ? 'bg-amber-500' : 'bg-[var(--pro-azure-50)]0'}`}
                            style={{ width: `${d.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{perms.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">permissions</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">H-weight: {ROLE_HIERARCHY[selectedRole]}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleCopy} title="Copy permissions list"
                  className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">
                  {copied ? <CheckCheck className="w-3 h-3 text-[var(--pro-azure)]" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={handleExport} title="Export as CSV"
                  className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">
                  <Download className="w-3 h-3" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter permissions…"
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-[var(--pro-azure)] dark:focus:border-[var(--pro-azure)]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Permission groups */}
        <div className="space-y-2">
          {Object.entries(grouped).map(([gKey, gPerms]) => {
            const label = gKey === '_other' ? 'Other' : (PERMISSION_GROUPS[gKey]?.label ?? gKey);
            const isOpen = expandedGroups.has(gKey);
            const totalInGroup = gKey === '_other' ? gPerms.length : (PERMISSION_GROUPS[gKey]?.permissions.length ?? gPerms.length);
            const coveragePct = totalInGroup > 0 ? Math.round((gPerms.length / totalInGroup) * 100) : 100;
            return (
              <div key={gKey} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => toggleGroup(gKey)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{label}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* coverage mini bar */}
                    <div className="flex items-center gap-1.5 hidden sm:flex">
                      <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-1 rounded-full bg-[var(--pro-azure-50)]0" style={{ width: `${coveragePct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{coveragePct}%</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{gPerms.length} perms</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {gPerms.map(p => (
                        <PermChip key={`${gKey}-${p}`} perm={p} showMfa={isSensitivePerm(p)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
              No permissions match your filter.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/30 inline-block" /> Admin/Delete/Approve</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30 inline-block" /> Write/Generate/File</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 inline-block" /> Read</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> Critical</span>
          <MfaBadge /> Requires MFA
        </div>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Matrix View
// -----------------------------------------------------------------------------

function MatrixView() {
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const domains = useMemo(() => Object.keys(PERMISSION_GROUPS), []);
  const roles = useMemo(() => ALL_ROLES.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]), []);

  const displayPerms = useMemo(() => {
    let perms: Permission[] = [];
    if (domainFilter === 'all') {
      perms = Object.values(PERMISSION_GROUPS).flatMap(g => g.permissions);
    } else {
      perms = PERMISSION_GROUPS[domainFilter]?.permissions ?? [];
    }
    if (sensitiveOnly) perms = perms.filter(p => isSensitivePerm(p));
    return perms;
  }, [domainFilter, sensitiveOnly]);

  function cellClass(role: AppRole, perm: Permission): string {
    if (!rbac.can(role, perm)) return 'bg-slate-100/30 dark:bg-slate-800/30 text-slate-700';
    if (perm.includes(':delete') || perm.includes(':approve') || perm.includes(':admin') ||
        perm.includes(':deploy') || perm.includes(':certify') || perm.includes(':flag')) {
      return 'bg-rose-500/20 text-rose-300';
    }
    if (perm.includes(':write') || perm.includes(':generate') || perm.includes(':file') ||
        perm.includes(':calculate') || perm.includes(':submit')) {
      return 'bg-amber-500/15 text-amber-300';
    }
    return 'bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)] dark:text-green-300';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={domainFilter}
          onChange={e => setDomainFilter(e.target.value)}
          className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300"
        >
          <option value="all">All Domains</option>
          {domains.map(d => (
            <option key={d} value={d}>{PERMISSION_GROUPS[d].label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={sensitiveOnly}
            onChange={e => setSensitiveOnly(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-[var(--pro-azure)]"
          />
          <Star className="w-3 h-3 text-yellow-400" />
          Sensitive permissions only
        </label>
        <div className="flex items-center gap-3 ml-auto text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500/20 inline-block" /> Admin</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/15 inline-block" /> Write</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--pro-azure-50)]0/10 inline-block" /> Read</span>
          <button
            onClick={() => {
              const header = ['Permission', 'Critical', ...roles.map(r => ROLE_METADATA[r].label)];
              const dataRows = displayPerms.map(p => [
                p, isSensitivePerm(p) ? 'yes' : 'no',
                ...roles.map(r => rbac.can(r, p) ? 'yes' : 'no'),
              ]);
              exportCSV('permission-matrix.csv', [header, ...dataRows]);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
          >
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>
      <div className="overflow-auto rounded-xl border border-slate-200/80 dark:border-slate-700/50">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80">
              <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium border-b border-r border-slate-200 dark:border-slate-700 min-w-[180px]">
                Permission
              </th>
              {roles.map(role => (
                <th key={role} className="px-2 py-2 text-center border-b border-slate-200 dark:border-slate-700 min-w-[80px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${ROLE_METADATA[role].color.dot}`} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px' }}>
                      {ROLE_METADATA[role].label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayPerms.map((perm, i) => (
              <tr key={perm} className={i % 2 === 0 ? 'bg-slate-50/60 dark:bg-slate-900/30' : 'bg-slate-50/80 dark:bg-slate-800/20'}>
                <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 border-r border-slate-200/80 dark:border-slate-700/50 font-mono text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1">
                    {isSensitivePerm(perm) && <Star className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
                    {perm}
                  </div>
                </td>
                {roles.map(role => (
                  <td key={role} className={`text-center py-1.5 px-1 ${cellClass(role, perm)}`}>
                    {rbac.can(role, perm) ? (
                      <Check className="w-3 h-3 mx-auto" />
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {displayPerms.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">No permissions to display.</div>
      )}
    </div>
  );
}


// -----------------------------------------------------------------------------
// Diff View
// -----------------------------------------------------------------------------

function DiffView() {
  const [baseRole, setBaseRole] = useState<AppRole>('ACCOUNTING');
  const [targetRole, setTargetRole] = useState<AppRole>('OVDS');

  // permissions in targetRole but not in baseRole
  const added = useMemo(() => {
    const base = new Set(rbac.permissionsFor(baseRole));
    return rbac.permissionsFor(targetRole).filter(p => !base.has(p));
  }, [baseRole, targetRole]);
  // permissions in baseRole but not in targetRole
  const removed = useMemo(() => {
    const target = new Set(rbac.permissionsFor(targetRole));
    return rbac.permissionsFor(baseRole).filter(p => !target.has(p));
  }, [baseRole, targetRole]);
  // permissions in both
  const shared = useMemo(() => {
    const target = new Set(rbac.permissionsFor(targetRole));
    return rbac.permissionsFor(baseRole).filter(p => target.has(p));
  }, [baseRole, targetRole]);

  const handleExport = () => {
    const rows = [['Type', 'Permission', 'Critical']];
    added.forEach(p => rows.push(['added', p, isSensitivePerm(p) ? 'yes' : 'no']));
    removed.forEach(p => rows.push(['removed', p, isSensitivePerm(p) ? 'yes' : 'no']));
    shared.forEach(p => rows.push(['shared', p, isSensitivePerm(p) ? 'yes' : 'no']));
    exportCSV(`diff-${baseRole}-vs-${targetRole}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Base Role</label>
          <select value={baseRole} onChange={e => setBaseRole(e.target.value as AppRole)}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300">
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_METADATA[r].label}</option>)}
          </select>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Compare With</label>
          <select value={targetRole} onChange={e => setTargetRole(e.target.value as AppRole)}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300">
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_METADATA[r].label}</option>)}
          </select>
        </div>
        <button onClick={handleExport}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Stats summary */}
      <div className="ovds-grid-layout cols-3 gap-sm">
        {[
          { label: `Added in ${ROLE_METADATA[targetRole].label}`, count: added.length, color: 'text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)]0/5 border-[var(--pro-azure)]/20' },
          { label: 'Shared', count: shared.length, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/50' },
          { label: `Removed from ${ROLE_METADATA[targetRole].label}`, count: removed.length, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="ovds-grid-layout cols-3">
        <div className="bg-[var(--pro-azure-50)]0/5 border border-[var(--pro-azure)]/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-[var(--pro-azure-light)]" />
            <h3 className="text-sm font-semibold text-[var(--pro-azure-light)]">Added in {ROLE_METADATA[targetRole].label}</h3>
            <span className="ml-auto text-xs text-[var(--pro-azure)]">{added.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {added.map(p => <PermChip key={p} perm={p} />)}
            {added.length === 0 && <span className="ovds-caption">No additional permissions</span>}
          </div>
        </div>

        <div className="bg-slate-100/30 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitCompare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Shared</h3>
            <span className="ml-auto text-xs text-slate-500">{shared.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {shared.map(p => <PermChip key={p} perm={p} />)}
            {shared.length === 0 && <span className="ovds-caption">No shared permissions</span>}
          </div>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <X className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-rose-400">Removed from {ROLE_METADATA[targetRole].label}</h3>
            <span className="ml-auto text-xs text-rose-500">{removed.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {removed.map(p => <PermChip key={p} perm={p} />)}
            {removed.length === 0 && <span className="ovds-caption">No removed permissions</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Groups View
// -----------------------------------------------------------------------------

function GroupView() {
  const [expandedRole, setExpandedRole] = React.useState<AppRole | null>(null);

  const ladder = React.useMemo(() =>
    [...ALL_ROLES].sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a])
  , []);
  const maxWeight = ROLE_HIERARCHY['SPURADMIN'];

  return (
    <div className="space-y-5">

      {/* Hierarchy Ladder */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[var(--pro-azure-light)]" />
          Role Hierarchy Ladder — click any row to inspect
        </h3>
        <div className="space-y-1.5">
          {ladder.map(role => {
            const meta = ROLE_METADATA[role];
            const weight = ROLE_HIERARCHY[role];
            const pct = Math.round((weight / maxWeight) * 100);
            const score = calcRiskScore(role);
            const barColor = weight >= 150 ? 'bg-rose-500' : weight >= 80 ? 'bg-teal-500' : weight >= 50 ? 'bg-[var(--pro-azure-50)]0' : weight >= 25 ? 'bg-amber-500' : 'bg-slate-500';
            const isOpen = expandedRole === role;
            return (
              <React.Fragment key={role}>
                <button
                  onClick={() => setExpandedRole(isOpen ? null : role)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${
                    isOpen ? 'bg-[var(--pro-azure-100)] border border-slate-200' : 'hover:bg-slate-100 dark:hover:bg-slate-700/40 border border-transparent'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.color.dot}`} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-36 text-left truncate">{meta.label}</span>
                  <div className="flex-1 h-2 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 w-8 text-right shrink-0">{weight}</span>
                  <RiskBadge score={score} />
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90 text-[var(--pro-azure-light)]' : 'group-hover:text-slate-500'}`} />
                </button>

                {isOpen && (() => {
                  const domainMap = rbac.domainAccessMap(role);
                  const adminD = Object.entries(domainMap).filter(([,l]) => l === 'admin').map(([d]) => d);
                  const writeD = Object.entries(domainMap).filter(([,l]) => l === 'write').map(([d]) => d);
                  const readD  = Object.entries(domainMap).filter(([,l]) => l === 'read').map(([d]) => d);
                  return (
                    <div className={`mx-3 mb-1 rounded-xl border p-4 bg-slate-100/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/50`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{meta.label}</span>
                        <span className="text-xs text-slate-500 font-mono">{role}</span>
                        <span className="text-xs text-slate-600 ml-auto">{rbac.permissionsFor(role).length} perms · {rbac.groupOf(role)} group</span>
                        <button onClick={() => setExpandedRole(null)} className="text-slate-600 hover:text-slate-500 dark:text-slate-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{meta.description}</p>
                      <div className="ovds-grid-layout cols-3 gap-sm text-xs">
                        <div>
                          <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1.5">Admin ({adminD.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {adminD.map(d => <span key={d} className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20 text-[10px] capitalize">{d.replace(/_/g,' ')}</span>)}
                            {adminD.length === 0 && <span className="text-slate-600 text-[10px]">none</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">Write ({writeD.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {writeD.map(d => <span key={d} className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[10px] capitalize">{d.replace(/_/g,' ')}</span>)}
                            {writeD.length === 0 && <span className="text-slate-600 text-[10px]">none</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[var(--pro-azure-light)] uppercase tracking-wider mb-1.5">Read ({readD.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {readD.slice(0,8).map(d => <span key={d} className="px-1.5 py-0.5 rounded bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)] dark:text-green-300 border border-[var(--pro-azure)]/15 text-[10px] capitalize">{d.replace(/_/g,' ')}</span>)}
                            {readD.length > 8 && <span className="text-slate-500 text-[10px]">+{readD.length - 8} more</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/40 text-[10px] text-slate-500">
                        <span>Default route: <span className="font-mono text-slate-500 dark:text-slate-400">{rbac.defaultRoute(role)}</span></span>
                        <span>Aliases: {role}</span>
                      </div>
                    </div>
                  );
                })()}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Group cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(ROLE_GROUPS).map(([key, group]) => (
          <div key={key} className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${group.color}`}>{group.label}</span>
              <span className="text-xs text-slate-600 ml-auto font-mono text-[10px]">{group.redirect}</span>
            </div>
            <div className="space-y-1.5">
              {(group.roles as AppRole[]).map(role => {
                const meta = ROLE_METADATA[role];
                const score = calcRiskScore(role);
                return (
                  <button
                    key={role}
                    onClick={() => setExpandedRole(expandedRole === role ? null : role)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                      expandedRole === role
                        ? 'bg-[var(--pro-azure-100)] border border-slate-200'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700/40 border border-transparent'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${meta.color.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{meta.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{rbac.permissionsFor(role).length} perms · H:{ROLE_HIERARCHY[role]}</div>
                    </div>
                    <RiskBadge score={score} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Coverage View
// -----------------------------------------------------------------------------

function CoverageView() {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'coverage-asc' | 'coverage-desc' | 'alpha' | 'critical'>('coverage-asc');
  const coverage = useMemo(() => {
    // Build coverage data from ROLE_PERMISSIONS
    const allPerms = Array.from(
      Object.values(ROLE_PERMISSIONS).reduce((acc, perms) => {
        perms.forEach(p => acc.add(p));
        return acc;
      }, new Set<Permission>())
    ).sort();
    return allPerms.map(permission => {
      const grantedTo = ALL_ROLES.filter(r => rbac.can(r, permission));
      const deniedTo = ALL_ROLES.filter(r => !rbac.can(r, permission));
      const coveragePct = Math.round((grantedTo.length / ALL_ROLES.length) * 100);
      return { permission, grantedTo, deniedTo, coveragePct };
    });
  }, []);

  const filtered = useMemo(() =>
    coverage.filter(c => c.permission.toLowerCase().includes(search.toLowerCase()))
  , [coverage, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortMode === 'coverage-asc')  return arr.sort((a, b) => a.coveragePct - b.coveragePct);
    if (sortMode === 'coverage-desc') return arr.sort((a, b) => b.coveragePct - a.coveragePct);
    if (sortMode === 'alpha')         return arr.sort((a, b) => a.permission.localeCompare(b.permission));
    if (sortMode === 'critical')      return arr.sort((a, b) => (isSensitivePerm(b.permission) ? 1 : 0) - (isSensitivePerm(a.permission) ? 1 : 0));
    return arr;
  }, [filtered, sortMode]);

  return (
    <div className="space-y-4">
      <div className="ovds-grid-layout cols-3">
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{coverage.length}</div>
          <div className="ovds-caption">Total Permissions</div>
        </div>
        <div className="bg-rose-500/5 rounded-xl border border-rose-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-rose-400">
            {coverage.filter(c => c.coveragePct <= 20).length}
          </div>
          <div className="ovds-caption">Highly Restricted (&le;20%)</div>
        </div>
        <div className="bg-[var(--pro-azure-50)]0/5 rounded-xl border border-[var(--pro-azure)]/20 p-4 text-center">
          <div className="text-2xl font-bold text-[var(--pro-azure-light)]">
            {coverage.filter(c => c.coveragePct >= 80).length}
          </div>
          <div className="ovds-caption">Widely Granted (&ge;80%)</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search permissions..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-400" />
        </div>
        <button
          onClick={() => {
            const rows = [['Permission', 'Coverage %', 'Critical', 'Granted To', 'Denied To']];
            sorted.forEach(c => rows.push([c.permission, String(c.coveragePct), isSensitivePerm(c.permission) ? 'yes' : 'no', c.grantedTo.map(r => ROLE_METADATA[r].label).join('; '), c.deniedTo.map(r => ROLE_METADATA[r].label).join('; ')]));
            exportCSV('permission-coverage.csv', rows);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
        <div className="flex gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
          {([
            { key: 'coverage-asc',  label: '↑ %' },
            { key: 'coverage-desc', label: '↓ %' },
            { key: 'alpha',         label: 'A–Z' },
            { key: 'critical',      label: '★ First' },
          ] as const).map(s => (
            <button key={s.key} onClick={() => setSortMode(s.key)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${sortMode === s.key ? 'bg-[var(--pro-azure)] text-white' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-auto rounded-xl border border-slate-200/80 dark:border-slate-700/50">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Permission</th>
              <th className="text-center px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Coverage</th>
              <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Granted To</th>
              <th className="text-center px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Critical</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.permission} className={`border-b border-slate-200/60 dark:border-slate-700/30 ${i % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''}`}>
                <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1">
                    {isSensitivePerm(c.permission) && <Star className="w-3 h-3 text-yellow-400" />}
                    {c.permission}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 min-w-[60px]">
                      <div
                        className={`h-1.5 rounded-full ${c.coveragePct >= 80 ? 'bg-[var(--pro-azure-50)]0' : c.coveragePct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${c.coveragePct}%` }}
                      />
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 w-8 text-right">{c.coveragePct}%</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {c.grantedTo.slice(0, 5).map(r => (
                      <span key={r} className={`px-1.5 py-0.5 rounded text-xs ${ROLE_METADATA[r].color.badge}`}>
                        {ROLE_METADATA[r].label}
                      </span>
                    ))}
                    {c.grantedTo.length > 5 && (
                      <span className="text-slate-500 text-xs">+{c.grantedTo.length - 5}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  {isSensitivePerm(c.permission) ? (
                    <Star className="w-3.5 h-3.5 text-yellow-400 mx-auto" />
                  ) : (
                    <span className="text-slate-700">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Routes View
// -----------------------------------------------------------------------------

function RoutesView() {
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [search, setSearch] = useState('');
  const [mfaOnly, setMfaOnly] = useState(false);

  const routes = useMemo(() => Object.entries(ROUTE_POLICY), []);

  const filtered = useMemo(() => {
    return routes.filter(([path, perm]) => {
      const matchSearch = path.toLowerCase().includes(search.toLowerCase()) ||
        perm.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || rbac.can(roleFilter, perm);
      const matchMfa = !mfaOnly || SENSITIVE_ROUTES.has(path);
      return matchSearch && matchRole && matchMfa;
    });
  }, [routes, search, roleFilter, mfaOnly]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search routes or permissions..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-400" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as AppRole | 'all')}
          className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300">
          <option value="all">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_METADATA[r].label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
          <input type="checkbox" checked={mfaOnly} onChange={e => setMfaOnly(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-violet-500 focus:ring-0" />
          <Fingerprint className="w-3.5 h-3.5 text-violet-400" />
          MFA routes only
        </label>
        <span className="ovds-caption">{filtered.length} routes</span>
        <button
          onClick={() => {
            const rows = [['Route', 'Required Permission', 'MFA Required', 'Accessible By', 'Role Count']];
            filtered.forEach(([path, perm]) => {
              const mfa = SENSITIVE_ROUTES.has(path);
              const roles = ALL_ROLES.filter(r => rbac.can(r, perm));
              rows.push([path, perm, mfa ? 'yes' : 'no', roles.map(r => ROLE_METADATA[r].label).join('; '), String(roles.length)]);
            });
            exportCSV('route-access.csv', rows);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200/80 dark:border-slate-700/50">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Route</th>
              <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Required Permission</th>
              <th className="text-center px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">MFA</th>
              <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Accessible By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(([path, perm], i) => {
              const mfa = SENSITIVE_ROUTES.has(path);
              const accessibleRoles = ALL_ROLES.filter(r => rbac.can(r, perm));
              return (
                <tr key={path} className={`border-b border-slate-200/60 dark:border-slate-700/30 ${i % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''}`}>
                  <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-300">{path}</td>
                  <td className="px-4 py-2">
                    <PermChip perm={perm as Permission} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    {mfa ? <MfaBadge /> : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {accessibleRoles.slice(0, 4).map(r => (
                        <span key={r} className={`px-1.5 py-0.5 rounded text-xs ${ROLE_METADATA[r].color.badge}`}>
                          {ROLE_METADATA[r].label}
                        </span>
                      ))}
                      {accessibleRoles.length > 4 && (
                        <span className="text-slate-500 text-xs">+{accessibleRoles.length - 4}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// IFRS View
// -----------------------------------------------------------------------------

function IFRSView() {
  const ifrsPerms = useMemo(() => PERMISSION_GROUPS['ifrs']?.permissions ?? [], []);
  const bankingPerms = useMemo(() => PERMISSION_GROUPS['banking']?.permissions ?? [], []);
  const extAuditPerms = useMemo(() => PERMISSION_GROUPS['external_audit']?.permissions ?? [], []);

  const ifrsRoles: AppRole[] = ['IFRS_OFFICER', 'OVDS', 'ACCOUNTING', 'AUDITOR', 'EXTERNAL_AUDITOR', 'BANK_LIAISON', 'SPURADMIN', 'SUPERADMIN'];

  function PermMatrix({ perms, title }: { perms: Permission[]; title: string }) {
    return (
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        <div className="overflow-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-700/50">
                <th className="text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium min-w-[200px]">Permission</th>
                {ifrsRoles.map(r => (
                  <th key={r} className="px-2 py-2 text-center min-w-[70px]">
                    <span className="text-slate-500 dark:text-slate-400" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px' }}>
                      {ROLE_METADATA[r].label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map((perm, i) => (
                <tr key={perm} className={`border-b border-slate-200/40 dark:border-slate-700/20 ${i % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''}`}>
                  <td className="px-3 py-1.5 font-mono text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      {isSensitivePerm(perm) && <Star className="w-2.5 h-2.5 text-yellow-400" />}
                      {perm}
                    </div>
                  </td>
                  {ifrsRoles.map(role => (
                    <td key={role} className={`text-center py-1.5 ${rbac.can(role, perm) ? 'text-[var(--pro-azure-light)]' : 'text-slate-700'}`}>
                      {rbac.can(role, perm) ? <Check className="w-3 h-3 mx-auto" /> : <span>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold text-cyan-300">IFRS & Banking Compliance Matrix</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          AFIS-aligned permission matrix for IFRS 9 (ECL), IFRS 10 (Consolidation), IFRS 12 (Disclosures), IFRS 16 (Leases), Banking Operations, and External Audit.
        </p>
      </div>
      <PermMatrix perms={ifrsPerms} title="IFRS Compliance Permissions (AFIS)" />
      <PermMatrix perms={bankingPerms} title="Banking Operations Permissions" />
      <PermMatrix perms={extAuditPerms} title="External Audit Permissions" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// ovds / Role Guide View
// -----------------------------------------------------------------------------

function OvdsView() {
  const [expandedRole, setExpandedRole] = useState<AppRole | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-[var(--pro-azure-50)]0/5 rounded-xl border border-[var(--pro-azure)]/20 p-5 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-[var(--pro-azure-light)]" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Role & Access Guide</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          The enterprise authorization framework follows a strict <span className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold">deny-by-default</span> principle. 
          Use this guide to understand the functional scope and privilege level of each system role.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ALL_ROLES.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]).map(role => {
          const meta = ROLE_METADATA[role];
          const score = calcRiskScore(role);
          const domainSummary = rbac.summary(role);
          const isExpanded = expandedRole === role;

          return (
            <div key={role} className={`group rounded-xl border transition-all duration-200 ${
              isExpanded 
                ? 'bg-white dark:bg-slate-900 border-[var(--pro-azure)]/40 shadow-lg shadow-green-500/10' 
                : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-200 hover:bg-slate-100/40 dark:bg-slate-800/40'
            }`}>
              <button
                onClick={() => setExpandedRole(isExpanded ? null : role)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isExpanded ? 'bg-[var(--pro-azure-50)]0/20 border-slate-200' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:border-slate-200'
                }`}>
                  <User className={`w-5 h-5 ${isExpanded ? 'text-[var(--pro-azure-light)]' : 'text-slate-500 dark:text-slate-400'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{meta.label}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">{role}</span>
                    <RiskBadge score={score} />
                  </div>
                  <p className="text-xs text-slate-500 truncate">{meta.description}</p>
                </div>

                <div className="flex items-center gap-6 shrink-0 ml-4">
                  <div className="hidden md:block text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Permissions</div>
                    <div className="text-xs font-mono text-[var(--pro-azure-light)]">{rbac.permissionsFor(role).length}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Hierarchy</div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300">{ROLE_HIERARCHY[role]}</div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-[var(--pro-azure-light)]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-[var(--pro-azure-light)]/50" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-6 animate-fade-in">
                  <div className="h-px bg-gradient-to-r from-[var(--pro-azure)]/30 to-transparent mb-4" />
                  
                  <div className="ovds-grid-layout cols-4">
                    {domainSummary.filter(d => d.level !== 'none').map(d => (
                      <div key={d.domain} className="bg-slate-100/40 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{d.domain}</span>
                          <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            d.level === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                            d.level === 'write' ? 'bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure-light)] border border-[var(--pro-azure)]/20' : 
                            'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {d.level.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                            <div className="bg-[var(--pro-azure-50)]0 h-full rounded-full" style={{ width: `${d.pct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{d.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-[var(--pro-azure)]" />
                        Explicitly Granted Capabilities
                      </h4>
                      <span className="text-[10px] text-slate-600 font-mono">Total: {rbac.permissionsFor(role).length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rbac.permissionsFor(role).map(p => (
                        <span key={p} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                          isSensitivePerm(p) 
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' 
                            : 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-200'
                        }`}>
                          {isSensitivePerm(p) && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SmartRulesView: Context-aware RBAC visualization.
 * Shows how permissions change based on metadata (amounts, status, ownership).
 */
function SmartRulesView() {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--pro-azure-50)]0/5 rounded-xl border border-[var(--pro-azure)]/20 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-[var(--pro-azure-light)] animate-pulse" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Smart Contextual Rules</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
          Contextual RBAC adds a layer of "intelligence" to standard permissions. 
          Rules can evaluate transaction amounts, document status, and entity relationships in real-time.
        </p>
      </div>

      <div className="ovds-grid-layout cols-2">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Kanban className="w-4 h-4 text-[var(--pro-azure-light)]" />
            Active Smart Constraints
          </h3>
          <div className="space-y-4">
            {Object.entries(rbac.rules ?? {}).map(([perm]) => (
              <div key={perm} className="group bg-slate-100/30 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-4 hover:border-slate-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[var(--pro-azure)] dark:text-green-300">{perm}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure-light)] text-[10px] font-bold border border-[var(--pro-azure)]/20 uppercase">Active</span>
                </div>
                <div className="ovds-body mb-3">
                  {perm === 'payroll:approve' && "ovds can approve any amount; ACCOUNTING is capped at 500,000 ETB per run."}
                  {perm === 'fund_transfers:approve' && "BANK_LIAISON restricted to transfers ≤ 100,000 ETB. Higher amounts require ovds."}
                  {perm === 'invoices:write' && "Modifications restricted to documents in 'DRAFT' status across all roles."}
                  {perm === 'reports:financial:full' && "EXTERNAL_AUDITOR access restricted to assigned company boundaries only."}
                  {perm === 'users:delete' && "Strict administrative lock: only root-level admins can execute deletions."}
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-200/60 dark:border-slate-700/30">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Affected:</div>
                  <div className="flex gap-1">
                    {rbac.rolesWithPermission(perm as Permission).slice(0, 4).map(r => (
                      <span key={r} className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--pro-azure-light)]" />
              Runtime Evaluation
            </h3>
            <div className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed">
              <div className="text-slate-500 mb-2">// Example Smart Check</div>
              <div className="flex gap-2">
                <span className="text-[var(--pro-azure-light)]">const</span>
                <span className="text-slate-700 dark:text-slate-200">canApprove</span>
                <span className="text-[var(--pro-azure-light)]">=</span>
                <span className="text-slate-700 dark:text-slate-200">rbac.can(</span>
              </div>
              <div className="pl-4">
                <span className="text-amber-300">'ACCOUNTING'</span>,
                <br />
                <span className="text-amber-300">'payroll:approve'</span>,
                <br />
                {"{"} <span className="text-[var(--pro-azure)] dark:text-green-300">amount:</span> <span className="text-orange-300">750000</span> {"}"}
              </div>
              <div className="text-slate-700 dark:text-slate-200">);</div>
              <div className="mt-2 text-slate-500 flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                <span>Result: <span className="text-rose-400">false</span> (Exceeds limit)</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--pro-azure-50)]0/5 border border-[var(--pro-azure)]/20 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--pro-azure-light)] mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Compliance Impact
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-50)]0 shrink-0 mt-1.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">Fraud Prevention:</span> Limits risk of unauthorized large disbursements by junior staff.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-50)]0 shrink-0 mt-1.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">Audit Accuracy:</span> Ensures historical data cannot be modified after finalization.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-50)]0 shrink-0 mt-1.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">Data Privacy:</span> Automates tenant isolation for external consultants and auditors.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Risk Scoring View
// -----------------------------------------------------------------------------

function RiskView({ complianceScore, criticalPermissions, sodRules }: { complianceScore: number; criticalPermissions: Permission[]; sodRules: SodRule[] }) {
  const roleScores = useMemo(() =>
    ALL_ROLES.map(role => ({ role, score: calcRiskScore(role) }))
      .sort((a, b) => b.score - a.score)
  , []);

  const maxScore = useMemo(() => Math.max(...roleScores.map(r => r.score)), [roleScores]);

  const criticalPermsData = useMemo(() =>
    criticalPermissions.map(perm => ({
      perm,
      roles: rbac.rolesWithPermission(perm),
    })).sort((a, b) => a.roles.length - b.roles.length)
  , [criticalPermissions]);

  const privilegeCreep = useMemo(() => {
    return ALL_ROLES.filter(role => {
      const permCount = rbac.permissionsFor(role).length;
      const hierarchyWeight = ROLE_HIERARCHY[role];
      const expectedMax = hierarchyWeight * 2.5;
      return permCount > expectedMax && role !== 'SPURADMIN' && role !== 'SUPERADMIN';
    });
  }, []);

  const sodConflicts = useMemo(() =>
    sodRules.filter(rule =>
      ALL_ROLES.some(role => rbac.can(role, rule.perm1) && rbac.can(role, rule.perm2))
    ).length
  , [sodRules]);

  return (
    <div className="space-y-6">
      {/* Compliance score banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 ${
        complianceScore >= 80 ? 'bg-[var(--pro-azure-50)]0/5 border-[var(--pro-azure)]/20' :
        complianceScore >= 50 ? 'bg-amber-500/5 border-amber-500/20' :
        'bg-rose-500/5 border-rose-500/20'
      }`}>
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-700" />
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="2.5"
              strokeDasharray={`${complianceScore} ${100 - complianceScore}`}
              strokeLinecap="round"
              className={complianceScore >= 80 ? 'text-[var(--pro-azure-light)]' : complianceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}
              stroke="currentColor"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${complianceScore >= 80 ? 'text-[var(--pro-azure-light)]' : complianceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {complianceScore}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Overall Compliance Score</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
              complianceScore >= 80 ? 'bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure)] dark:text-green-300 border-slate-200' :
              complianceScore >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
              'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              {complianceScore >= 80 ? 'COMPLIANT' : complianceScore >= 50 ? 'NEEDS REVIEW' : 'AT RISK'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Score is penalised by SoD conflicts (−8 each) and high-risk roles (−4 each).
            {complianceScore < 80 && ' Resolve SoD conflicts and review high-risk role assignments to improve.'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span>SoD penalty: <span className="text-rose-400 font-mono">−{sodConflicts * 8}</span></span>
            <span>High-risk penalty: <span className="text-amber-400 font-mono">−{ALL_ROLES.filter(r => calcRiskScore(r) >= 61).length * 4}</span></span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="ovds-grid-layout cols-3">
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-rose-400">
            {roleScores.filter(r => r.score >= 61).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">High Risk Roles</div>
          <div className="ovds-caption">Score 61-100</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {roleScores.filter(r => r.score >= 31 && r.score < 61).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Medium Risk Roles</div>
          <div className="ovds-caption">Score 31-60</div>
        </div>
        <div className="bg-[var(--pro-azure-50)]0/5 border border-[var(--pro-azure)]/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[var(--pro-azure-light)]">
            {roleScores.filter(r => r.score < 31).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Low Risk Roles</div>
          <div className="ovds-caption">Score 0-30</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[var(--pro-azure-light)]" />
            Risk Score Distribution
          </h3>
          <button
            onClick={() => {
              const rows = [['Role','Label','Risk Score','Risk Level','Permissions','Hierarchy Weight']];
              roleScores.forEach(({ role, score }) => {
                rows.push([role, ROLE_METADATA[role].label, String(score), riskLabel(score), String(rbac.permissionsFor(role).length), String(ROLE_HIERARCHY[role])]);
              });
              exportCSV('risk-scores.csv', rows);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
        <div className="space-y-2">
          {roleScores.map(({ role, score }) => {
            const meta = ROLE_METADATA[role];
            const barWidth = maxScore > 0 ? (score / maxScore) * 100 : 0;
            return (
              <div key={role} className="flex items-center gap-3">
                <div className="w-32 shrink-0 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.color.dot}`} />
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{meta.label}</span>
                </div>
                <div className="flex-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-4 relative overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all ${score >= 61 ? 'bg-rose-500/70' : score >= 31 ? 'bg-amber-500/70' : 'bg-[var(--pro-azure-50)]0/70'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="w-16 shrink-0 flex items-center gap-1">
                  <span className={`text-xs font-bold ${riskColor(score)}`}>{score}</span>
                  <span className="ovds-caption">/100</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ovds-grid-layout cols-2">
        {/* Critical Permissions Panel */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            Critical Permissions
            <span className="text-xs text-slate-500 ml-auto">sorted by rarity</span>
          </h3>
          <div className="space-y-2">
            {criticalPermsData.map(({ perm, roles }) => (
              <div key={perm} className="flex items-center gap-3 py-1.5 border-b border-slate-200/60 dark:border-slate-700/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-rose-300">{perm}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {roles.length === 0 ? (
                    <span className="ovds-caption">No roles</span>
                  ) : (
                    <>
                      {roles.slice(0, 3).map(r => (
                        <span key={r} className={`px-1.5 py-0.5 rounded text-xs ${ROLE_METADATA[r].color.badge}`}>
                          {ROLE_METADATA[r].label}
                        </span>
                      ))}
                      {roles.length > 3 && <span className="ovds-caption">+{roles.length - 3}</span>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privilege Creep */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Privilege Creep Detector
          </h3>
          {privilegeCreep.length === 0 ? (
            <div className="flex items-center gap-2 text-[var(--pro-azure-light)] text-sm py-4">
              <CheckCircle2 className="w-4 h-4" />
              No privilege creep detected
            </div>
          ) : (
            <div className="space-y-2">
              {privilegeCreep.map(role => {
                const permCount = rbac.permissionsFor(role).length;
                const expectedMax = Math.round(ROLE_HIERARCHY[role] * 2.5);
                return (
                  <div key={role} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <RoleBadge role={role} />
                      <span className="text-xs text-amber-400 font-bold">{permCount} perms</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Expected max ~{expectedMax} based on hierarchy weight {ROLE_HIERARCHY[role]}
                    </div>
                    <div className="text-xs text-amber-300 mt-1">
                      +{permCount - expectedMax} excess permissions
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Domain Permission Heatmap */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--pro-azure-light)]" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Domain Access Heatmap</h3>
          <span className="text-xs text-slate-500 ml-auto">admin = red · write = amber · read = green · none = dark</span>
        </div>
        <div className="overflow-auto p-4">
          <div className="min-w-max">
            {/* Column headers — roles */}
            <div className="flex gap-px mb-px">
              <div className="w-36 shrink-0" />
              {ALL_ROLES.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]).map(role => (
                <div key={role} className="w-10 flex items-end justify-center pb-1" style={{ height: 80 }}>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-none"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {ROLE_METADATA[role].label}
                  </span>
                </div>
              ))}
            </div>
            {/* Rows — domains */}
            {Object.keys(PERMISSION_GROUPS).map((domain, di) => (
              <div key={domain} className="flex gap-px mb-px">
                <div className={`w-36 shrink-0 flex items-center px-2 text-[10px] text-slate-500 dark:text-slate-400 capitalize ${di % 2 === 0 ? 'bg-slate-50/60 dark:bg-slate-900/30' : ''}`}>
                  {domain.replace(/_/g, ' ')}
                </div>
                {ALL_ROLES.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]).map(role => {
                  const domainPerms = PERMISSION_GROUPS[domain]?.permissions ?? [];
                  const granted = domainPerms.filter(p => rbac.can(role, p));
                  const hasAdmin = granted.some(p => p.includes(':delete') || p.includes(':approve') || p.includes(':admin') || p.includes(':certify') || p.includes(':deploy'));
                  const hasWrite = granted.some(p => p.includes(':write') || p.includes(':generate') || p.includes(':file') || p.includes(':calculate'));
                  const hasRead  = granted.some(p => p.includes(':read'));
                  const cellColor = granted.length === 0 ? 'bg-slate-100/60 dark:bg-slate-800/60'
                    : hasAdmin ? 'bg-rose-500/40 hover:bg-rose-500/60'
                    : hasWrite ? 'bg-amber-500/35 hover:bg-amber-500/55'
                    : hasRead  ? 'bg-[var(--pro-azure-50)]0/30 hover:bg-[var(--pro-azure-dark)]/50'
                    : 'bg-slate-600/40';
                  return (
                    <div
                      key={role}
                      title={`${ROLE_METADATA[role].label} / ${domain}: ${granted.length} perms`}
                      className={`w-10 h-6 transition-colors cursor-default ${cellColor}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Segregation of Duties (SoD) View
// -----------------------------------------------------------------------------

function SodView({ sodRules, sodRemediation }: { sodRules: SodRule[]; sodRemediation: Record<string, string[]> }) {
  const results = useMemo(() => {
    return sodRules.map(rule => {
      const conflictingRoles = ALL_ROLES.filter(role =>
        rbac.can(role, rule.perm1) && rbac.can(role, rule.perm2)
      );
      return { ...rule, conflictingRoles, pass: conflictingRoles.length === 0 };
    });
  }, []);

  const totalConflicts = results.filter(r => !r.pass).length;
  const affectedRoles = new Set(results.flatMap(r => r.conflictingRoles));
  const compliantRoles = ALL_ROLES.filter(role => !affectedRoles.has(role));

  const criticalFails = results.filter(r => !r.pass && r.risk === 'critical').length;
  const highFails = results.filter(r => !r.pass && r.risk === 'high').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="ovds-grid-layout cols-4">
        <div className={`rounded-xl border p-4 text-center ${totalConflicts > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-[var(--pro-azure-50)]0/5 border-[var(--pro-azure)]/20'}`}>
          <div className={`text-2xl font-bold ${totalConflicts > 0 ? 'text-rose-400' : 'text-[var(--pro-azure-light)]'}`}>
            {totalConflicts}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">SoD Conflicts</div>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-rose-400">{criticalFails}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Critical Violations</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{highFails}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">High Risk Violations</div>
        </div>
        <div className="bg-[var(--pro-azure-50)]0/5 border border-[var(--pro-azure)]/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[var(--pro-azure-light)]">{affectedRoles.size}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Affected Roles</div>
        </div>
      </div>

      {/* SoD Rules Table */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80 flex items-center gap-2">
          <Scale className="w-4 h-4 text-[var(--pro-azure-light)]" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Segregation of Duties Rules</h3>
          <button
            onClick={() => {
              const rows = [['Rule ID','Name','Risk','Status','Perm 1','Perm 2','Conflicting Roles']];
              results.forEach(r => rows.push([r.id, r.name, r.risk, r.pass ? 'PASS' : 'FAIL', r.perm1, r.perm2, r.conflictingRoles.map(role => ROLE_METADATA[role].label).join('; ')]));
              exportCSV('sod-report.csv', rows);
            }}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
        <div className="divide-y divide-slate-700/30">
          {results.map(rule => {
            const remediation = sodRemediation[rule.id] ?? [];
            return (
              <div key={rule.id} className={`p-4 ${!rule.pass ? 'bg-rose-950/10' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-0.5">
                    {rule.pass ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--pro-azure-light)]" />
                    ) : (
                      <AlertOctagon className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{rule.id}</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{rule.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${sodRiskBadge(rule.risk)}`}>
                        {rule.risk.toUpperCase()}
                      </span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${rule.pass ? 'bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure)] dark:text-green-300 border border-slate-200' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                        {rule.pass ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{rule.description}</p>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <PermChip perm={rule.perm1} />
                      <span className="text-slate-600 text-xs font-bold">AND</span>
                      <PermChip perm={rule.perm2} />
                    </div>
                    {!rule.pass && (
                      <>
                        {rule.conflictingRoles.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            <span className="text-xs text-rose-400 font-semibold shrink-0">Conflicting roles:</span>
                            {rule.conflictingRoles.map(r => (
                              <span key={r} className={`px-2 py-0.5 rounded-full text-xs border ${ROLE_METADATA[r].color.badge}`}>
                                {ROLE_METADATA[r].label}
                              </span>
                            ))}
                          </div>
                        )}
                        {remediation.length > 0 && (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-xs font-semibold text-amber-300">Remediation suggestions</span>
                            </div>
                            <ul className="space-y-1.5">
                              {remediation.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <ArrowRight className="w-3 h-3 text-amber-500/60 shrink-0 mt-0.5" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliant Roles */}
      <div className="bg-[var(--pro-azure-50)]0/5 border border-[var(--pro-azure)]/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--pro-azure)] dark:text-green-300 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Compliant Roles (Zero SoD Conflicts)
        </h3>
        <div className="flex flex-wrap gap-2">
          {compliantRoles.map(role => (
            <span key={role} className={`px-2 py-1 rounded-full text-xs border ${ROLE_METADATA[role].color.badge}`}>
              {ROLE_METADATA[role].label}
            </span>
          ))}
          {compliantRoles.length === 0 && (
            <span className="ovds-caption">All roles have at least one SoD conflict.</span>
          )}
        </div>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Simulate View
// -----------------------------------------------------------------------------

const DOMAIN_ACTIONS = ['read', 'write', 'approve', 'delete', 'export', 'admin'] as const;
type DomainAction = typeof DOMAIN_ACTIONS[number];

function SimulateView() {
  const [selectedRole, setSelectedRole] = useState<AppRole>('OVDS');
  const [search, setSearch] = useState('');
  const [permQuery, setPermQuery] = useState('');
  const [scenarioRole, setScenarioRole] = useState<AppRole>('OVDS');
  const [scenarioAction, setScenarioAction] = useState('');
  const [scenarioResource, setScenarioResource] = useState('');
  const [scenarioResult, setScenarioResult] = useState<null | { allowed: boolean; reason: string }>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['OVDS', 'payroll']));

  const perms = useMemo(() => new Set(rbac.permissionsFor(selectedRole)), [selectedRole]);
  const domainSummary = useMemo(() => rbac.summary(selectedRole), [selectedRole]);

  const filteredDomains = useMemo(() => {
    if (!search) return domainSummary;
    return domainSummary.filter(d =>
      d.domain.toLowerCase().includes(search.toLowerCase()) ||
      d.granted.some(p => p.toLowerCase().includes(search.toLowerCase()))
    );
  }, [domainSummary, search]);

  const permQueryResults = useMemo(() => {
    if (!permQuery.trim()) return [];
    const q = permQuery.trim().toLowerCase();
    return ALL_ROLES.filter(role => {
      const rolePerms = rbac.permissionsFor(role);
      return rolePerms.some(p => p.toLowerCase().includes(q));
    });
  }, [permQuery]);

  function toggleDomain(domain: string) {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  function runScenario() {
    if (!scenarioAction || !scenarioResource) {
      setScenarioResult({ allowed: false, reason: 'Please specify both action and resource.' });
      return;
    }
    const permStr = `${scenarioResource}:${scenarioAction}` as Permission;
    const allowed = rbac.can(scenarioRole, permStr);
    const isCritical = isSensitivePerm(permStr);
    const mfaRequired = Array.from(SENSITIVE_ROUTES).some(r => r.includes(scenarioResource));

    if (allowed) {
      setScenarioResult({
        allowed: true,
        reason: `${ROLE_METADATA[scenarioRole].label} has the permission "${permStr}".${isCritical ? ' ⚠️ This is a critical permission.' : ''}${mfaRequired ? ' 🔐 MFA step-up may be required.' : ''}`,
      });
    } else {
      setScenarioResult({
        allowed: false,
        reason: `${ROLE_METADATA[scenarioRole].label} does NOT have "${permStr}". This permission is not in their grant list.`,
      });
    }
  }

  function canDomainAction(domain: string, action: DomainAction): boolean {
    const domainPerms = RESOURCE_DOMAINS_FLAT[domain] ?? [];
    return domainPerms.some(p => {
      if (!perms.has(p)) return false;
      if (action === 'read') return p.includes(':read');
      if (action === 'write') return p.includes(':write') || p.includes(':generate') || p.includes(':calculate');
      if (action === 'approve') return p.includes(':approve') || p.includes(':verify') || p.includes(':finalize');
      if (action === 'delete') return p.includes(':delete');
      if (action === 'export') return p.includes(':export');
      if (action === 'admin') return p.includes(':admin') || p.includes(':config') || p.includes(':deploy');
      return false;
    });
  }

  const riskScore = useMemo(() => calcRiskScore(selectedRole), [selectedRole]);

  return (
    <div className="space-y-6">
      {/* Role selector */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--pro-azure-light)]" />
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Simulate Role:</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as AppRole)}
              className="bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-400"
            >
              {ALL_ROLES.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]).map(r => (
                <option key={r} value={r}>{ROLE_METADATA[r].label} ({r})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={selectedRole} />
            <RiskBadge score={riskScore} />
            <span className="ovds-caption">{perms.size} permissions</span>
          </div>
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter domains..."
              className="pl-8 pr-3 py-1.5 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-400 w-48"
            />
          </div>
        </div>
      </div>

      {/* Domain capability matrix */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Domain Capabilities</h3>
        </div>
        <div className="overflow-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-800/60">
                <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium min-w-[160px]">Domain</th>
                <th className="text-center px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Level</th>
                {DOMAIN_ACTIONS.map(a => (
                  <th key={a} className="text-center px-3 py-2 text-slate-500 dark:text-slate-400 font-medium capitalize">{a}</th>
                ))}
                <th className="text-center px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">MFA</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((d, i) => {
                const mfaRoutes = Array.from(SENSITIVE_ROUTES).filter(r => r.includes(d.domain.replace('_', '-')));
                const hasMfa = mfaRoutes.length > 0;
                const isExpanded = expandedDomains.has(d.domain);

                return (
                  <React.Fragment key={d.domain}>
                    <tr
                      className={`border-b border-slate-200/40 dark:border-slate-700/20 cursor-pointer hover:bg-slate-100/80 dark:bg-slate-700/20 ${i % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''} ${d.level === 'none' ? 'opacity-40' : ''}`}
                      onClick={() => d.level !== 'none' && toggleDomain(d.domain)}
                    >
                      <td className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          {d.level !== 'none' && (
                            isExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />
                          )}
                          {d.domain}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          d.level === 'admin' ? 'bg-rose-500/20 text-rose-300' :
                          d.level === 'write' ? 'bg-amber-500/20 text-amber-300' :
                          d.level === 'read' ? 'bg-[var(--pro-azure-50)]0/15 text-[var(--pro-azure)] dark:text-green-300' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}>
                          {d.level.toUpperCase()}
                        </span>
                      </td>
                      {DOMAIN_ACTIONS.map(action => {
                        const can = canDomainAction(d.domain, action);
                        return (
                          <td key={action} className="px-3 py-2 text-center">
                            {can ? (
                              <CheckSquare className="w-3.5 h-3.5 text-[var(--pro-azure-light)] mx-auto" />
                            ) : (
                              <XSquare className="w-3.5 h-3.5 text-slate-700 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        {hasMfa ? <MfaBadge /> : <span className="text-slate-700">—</span>}
                      </td>
                    </tr>
                    {isExpanded && d.granted.length > 0 && (
                      <tr className="border-b border-slate-200/40 dark:border-slate-700/20 bg-slate-50/80 dark:bg-slate-900/40">
                        <td colSpan={9} className="px-8 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {d.granted.map(p => <PermChip key={p} perm={p} showMfa={isSensitivePerm(p)} />)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ovds-grid-layout cols-2">
        {/* Try a Permission */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[var(--pro-azure-light)]" />
            Try a Permission
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Type a permission string to see which roles have it.</p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={permQuery}
              onChange={e => setPermQuery(e.target.value)}
              placeholder="e.g. payroll:approve"
              className="w-full pl-8 pr-3 py-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono"
            />
          </div>
          {permQuery && (
            <div>
              {permQueryResults.length > 0 ? (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{permQueryResults.length} roles match:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {permQueryResults.map(r => (
                      <span key={r} className={`px-2 py-0.5 rounded-full text-xs border ${ROLE_METADATA[r].color.badge}`}>
                        {ROLE_METADATA[r].label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  No roles have a permission matching "{permQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scenario Tester */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-violet-400" />
            Scenario Tester
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Pick a role, action, and resource to test access.</p>
          {/* Quick-fill examples */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { role: 'OVDS' as AppRole,       resource: 'payroll',        action: 'approve' },
              { role: 'ACCOUNTING' as AppRole,    resource: 'vat',            action: 'file' },
              { role: 'BANK_LIAISON' as AppRole,  resource: 'banking',        action: 'kyc:approve' },
              { role: 'EMPLOYEE' as AppRole,      resource: 'fund_transfers', action: 'approve' },
              { role: 'AUDITOR' as AppRole,       resource: 'audit_logs',     action: 'write' },
              { role: 'HR' as AppRole,            resource: 'payroll',        action: 'generate' },
            ].map(ex => (
              <button
                key={`${ex.role}-${ex.resource}-${ex.action}`}
                onClick={() => { setScenarioRole(ex.role); setScenarioResource(ex.resource); setScenarioAction(ex.action); setScenarioResult(null); }}
                className="px-2 py-1 bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-200 dark:bg-slate-700 border border-slate-300/80 dark:border-slate-600/50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 text-[10px] font-mono rounded transition-colors"
              >
                {ex.role.split('_')[0]}:{ex.resource}:{ex.action}
              </button>
            ))}
          </div>
          <div className="space-y-2 mb-3">
            <select
              value={scenarioRole}
              onChange={e => setScenarioRole(e.target.value as AppRole)}
              className="w-full text-xs bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300"
            >
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_METADATA[r].label}</option>)}
            </select>
            <div className="flex gap-2">
              <input
                value={scenarioResource}
                onChange={e => setScenarioResource(e.target.value)}
                placeholder="resource (e.g. payroll)"
                className="flex-1 text-xs bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300 placeholder-slate-500 font-mono focus:outline-none focus:border-teal-400"
              />
              <span className="text-slate-500 self-center">:</span>
              <input
                value={scenarioAction}
                onChange={e => setScenarioAction(e.target.value)}
                placeholder="action (e.g. approve)"
                className="flex-1 text-xs bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300 placeholder-slate-500 font-mono focus:outline-none focus:border-teal-400"
              />
            </div>
            <button
              onClick={runScenario}
              className="w-full py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              Test Scenario
            </button>
          </div>
          {scenarioResult && (
            <div className={`rounded-lg p-3 text-xs ${scenarioResult.allowed ? 'bg-[var(--pro-azure-50)]0/10 border border-slate-200 text-[var(--pro-azure)] dark:text-green-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
              <div className="flex items-start gap-2">
                {scenarioResult.allowed ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{scenarioResult.reason}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Audit Intelligence View
// -----------------------------------------------------------------------------

function AuditView({ auditEvents }: { auditEvents: AuditEvent[] }) {
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [liveTab, setLiveTab] = useState<'live' | 'intelligence'>('live');

  // ── Live ACCESS_DENIED feed ───────────────────────────────────────────────
  const { data: denialData, isLoading: denialLoading, refetch: refetchDenials } = useQuery({
    queryKey: ['access-denials', companyId],
    queryFn: async () => {
      const res = await api.get('/security/access-denials', {
        params: { ...(companyId ? { companyId } : {}), take: 50 },
      });
      return res.data?.data as {
        data: Array<{
          id: string;
          userId: string | null;
          username: string | null;
          email: string | null;
          role: string | null;
          companyId: string | null;
          reason: string | null;
          permissions: string[];
          createdAt: string;
        }>;
        pagination: { total: number; pages: number };
        summary: { total: number; last24h: number };
      };
    },
    refetchInterval: 30_000, // poll every 30 s
    staleTime: 20_000,
  });

  const filtered = useMemo(() => {
    let events = auditEvents;
    if (search) events = events.filter(e => e.permission.toLowerCase().includes(search.toLowerCase()) || e.event.toLowerCase().includes(search.toLowerCase()));
    if (severityFilter !== 'all') events = events.filter(e => e.severity === severityFilter);
    return events.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [search, severityFilter]);

  const stats = useMemo(() => ({
    critical: auditEvents.filter(e => e.severity === 'critical').length,
    high: auditEvents.filter(e => e.severity === 'high').length,
    medium: auditEvents.filter(e => e.severity === 'medium').length,
    low: auditEvents.filter(e => e.severity === 'low').length,
  }), [auditEvents]);

  function severityBadge(severity: AuditEvent['severity']): string {
    if (severity === 'critical') return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
    if (severity === 'high') return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    if (severity === 'medium') return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
    return 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border border-slate-500/40';
  }

  const handleExport = () => {
    const rows = [['Permission', 'Audit Event', 'Severity', 'Regulation', 'Retention (Years)', 'Roles with Access']];
    filtered.forEach(e => {
      const roles = rbac.rolesWithPermission(e.permission).map(r => ROLE_METADATA[r].label).join(', ');
      rows.push([e.permission, e.event, e.severity, e.regulation, String(e.retentionYears), roles]);
    });
    exportCSV('audit-intelligence.csv', rows);
  };

  return (
    <div className="space-y-6">

      {/* ── Tab switcher: Live Feed vs Intelligence ── */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {(['live', 'intelligence'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setLiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              liveTab === tab
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'live' ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Live Denials
                {denialData?.summary?.last24h != null && denialData.summary.last24h > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-500 text-[9px] font-extrabold">
                    {denialData.summary.last24h}
                  </span>
                )}
              </span>
            ) : 'Event Intelligence'}
          </button>
        ))}
      </div>

      {liveTab === 'live' ? (
        <div className="space-y-4">
          {/* Live summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <p className="text-xl font-bold text-rose-400 tabular-nums">
                {denialData?.summary?.total ?? '—'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Total Denials</p>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <p className="text-xl font-bold text-amber-400 tabular-nums">
                {denialData?.summary?.last24h ?? '—'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Last 24 h</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xl font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                {denialData?.pagination?.total ?? '—'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">In View</p>
            </div>
          </div>

          {/* Denial feed */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Access Denied Events</span>
                <span className="text-[10px] text-slate-400 font-mono">action = ACCESS_DENIED</span>
              </div>
              <button
                onClick={() => refetchDenials()}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[var(--pro-azure)] transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {denialLoading ? (
              <div className="p-6 space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
              </div>
            ) : !denialData?.data?.length ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-[var(--pro-azure)] mx-auto mb-2" />
                <p className="text-sm text-slate-500">No access denials recorded. Your ABAC policies are clean.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {denialData.data.map(denial => (
                  <div key={denial.id} className="px-4 py-3 hover:bg-rose-500/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {denial.username ?? denial.email ?? denial.userId ?? 'unknown'}
                          </span>
                          {denial.role && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                              {denial.role}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(denial.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 leading-relaxed">
                          {denial.reason ?? 'No reason recorded'}
                        </p>
                        {denial.permissions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {denial.permissions.map(p => (
                              <code key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono">
                                {p}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
      <div className="space-y-6">
      {/* Summary cards */}
      <div className="ovds-grid-layout cols-4">
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-rose-400">{stats.critical}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Critical Events</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.high}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">High Severity</div>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.medium}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Medium Severity</div>
        </div>
        <div className="bg-slate-500/5 border border-slate-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-slate-500 dark:text-slate-400">{stats.low}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Low Severity</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search permissions or events..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-400" />
        </div>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as typeof severityFilter)}
          className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300">
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-xs font-medium rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
        <span className="ovds-caption">{filtered.length} events</span>
      </div>

      {/* Audit events table */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80 flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--pro-azure-light)]" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Audit Intelligence Matrix</h3>
          <span className="text-xs text-slate-500 ml-auto">Regulatory compliance & retention requirements</span>
        </div>
        <div className="overflow-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Permission</th>
                <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Audit Event</th>
                <th className="text-center px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Severity</th>
                <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Regulation</th>
                <th className="text-center px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Retention</th>
                <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Roles with Access</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event, i) => {
                const roles = rbac.rolesWithPermission(event.permission);
                return (
                  <tr key={event.permission} className={`border-b border-slate-200/60 dark:border-slate-700/30 ${i % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''}`}>
                    <td className="px-4 py-2">
                      <PermChip perm={event.permission} showMfa={isSensitivePerm(event.permission)} />
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{event.event}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${severityBadge(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">{event.regulation}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-slate-600 dark:text-slate-300 font-bold">{event.retentionYears}</span>
                      <span className="text-slate-500 ml-1">yrs</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {roles.slice(0, 4).map(r => (
                          <span key={r} className={`px-1.5 py-0.5 rounded text-xs ${ROLE_METADATA[r].color.badge}`}>
                            {ROLE_METADATA[r].label}
                          </span>
                        ))}
                        {roles.length > 4 && <span className="text-slate-500 text-xs">+{roles.length - 4}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance note */}
      <div className="bg-[var(--pro-azure-50)]0/5 border border-[var(--pro-azure)]/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--pro-azure-light)] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[var(--pro-azure)] dark:text-green-300 mb-1">Audit Log Retention Policy</h4>
            <p className="ovds-body">
              All audit events are automatically logged with immutable timestamps. Retention periods are based on Ethiopian regulatory requirements (Commercial Code 2021, VAT Proclamation 1341/2024, Income Tax 979/2016, NBE Directives) and international standards (ISO 27001, IFRS, FATF). Critical events (payroll approval, fund transfers, VAT filing, KYC approval, AML flags) are retained for 10 years minimum.
            </p>
          </div>
        </div>
      </div>
    </div>
      )} {/* end intelligence tab */}
    </div>
  );
}


// -----------------------------------------------------------------------------
// Permission Lookup Modal
// -----------------------------------------------------------------------------

function PermissionLookupModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const allPerms = useMemo(() => {
    const set = new Set<Permission>();
    Object.values(RESOURCE_DOMAINS_FLAT).forEach(ps => ps.forEach(p => set.add(p)));
    return Array.from(set).sort();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allPerms.filter(p => p.includes(q)).slice(0, 20).map(p => ({
      permission: p,
      roles: rbac.rolesWithPermission(p),
      denied: ALL_ROLES.filter(r => !rbac.can(r, p)),
    }));
  }, [query, allPerms]);

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search permissions… e.g. payroll:approve, vat:file"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
          <div className="flex items-center gap-1">
            <kbd className="text-xs font-mono text-slate-400 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 rounded">Esc</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="px-6 py-10 text-center">
              <Lock className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Permission lookup</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Type to find which roles have a permission.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
                {['payroll:approve', 'vat:file', 'users:delete', 'fund_transfers:approve'].map(ex => (
                  <button key={ex} onClick={() => setQuery(ex)}
                    className="text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] dark:hover:text-[var(--pro-azure-light)] px-2 py-1 rounded transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No permissions match <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">"{query}"</span></p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map(({ permission, roles, denied }) => (
                <div key={permission} className="px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{permission}</span>
                    {isSensitivePerm(permission) && <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                    <span className="ml-auto text-xs font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 px-2 py-0.5 rounded-full border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/20 shrink-0">
                      {roles.length} / {ALL_ROLES.length} roles
                    </span>
                  </div>
                  {roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {roles.map(r => <RoleBadge key={r} role={r} />)}
                    </div>
                  )}
                  {denied.length > 0 && roles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {denied.map(r => (
                        <span key={r} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 line-through">
                          {ROLE_METADATA[r].label}
                        </span>
                      ))}
                    </div>
                  )}
                  {roles.length === 0 && (
                    <p className="text-xs text-rose-500 dark:text-rose-400">No role has this permission.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Strikethrough roles = permission denied. <span className="text-yellow-500">★</span> = critical permission requiring MFA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Policy Export View
// -----------------------------------------------------------------------------

function PolicyView() {
  const [compareA, setCompareA] = useState<AppRole>('OVDS');
  const [compareB, setCompareB] = useState<AppRole>('ACCOUNTING');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'all' | AppRole>('all');
  const [justExported, setJustExported] = useState(false);

  // -- Deep role comparison --------------------------------------------------
  const domainSummaryA = useMemo(() => rbac.summary(compareA), [compareA]);
  const domainSummaryB = useMemo(() => rbac.summary(compareB), [compareB]);
  const metaA = ROLE_METADATA[compareA];
  const metaB = ROLE_METADATA[compareB];
  const scoreA = useMemo(() => calcRiskScore(compareA), [compareA]);
  const scoreB = useMemo(() => calcRiskScore(compareB), [compareB]);

  const domainKeys = useMemo(() =>
    Array.from(new Set([...domainSummaryA.map(d => d.domain), ...domainSummaryB.map(d => d.domain)])).sort()
  , [domainSummaryA, domainSummaryB]);

  const domainMapA = useMemo(() => Object.fromEntries(domainSummaryA.map(d => [d.domain, d])), [domainSummaryA]);
  const domainMapB = useMemo(() => Object.fromEntries(domainSummaryB.map(d => [d.domain, d])), [domainSummaryB]);

  const levelOrder = { admin: 3, write: 2, read: 1, none: 0 } as const;
  type Level = keyof typeof levelOrder;

  function levelBadge(level: string) {
    if (level === 'admin') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (level === 'write') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (level === 'read')  return 'bg-[var(--pro-azure-50)]0/15 text-[var(--pro-azure)] dark:text-green-300 border-[var(--pro-azure)]/20';
    return 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 border-slate-600/30';
  }

  function levelIcon(level: string) {
    if (level === 'admin') return '●●●';
    if (level === 'write') return '●●○';
    if (level === 'read')  return '●○○';
    return '○○○';
  }

  function getRoleGroup(role: AppRole): string {
    for (const [groupKey, group] of Object.entries(ROLE_GROUPS)) {
      if (group.roles.includes(role)) return groupKey;
    }
    return 'external';
  }

  // -- Policy export ---------------------------------------------------------
  const handleExport = () => {
    const rolesToExport = exportScope === 'all' ? ALL_ROLES : [exportScope];

    if (exportFormat === 'json') {
      const policy: Record<string, { permissions: Permission[]; hierarchy: number; group: string; riskScore: number }> = {};
      rolesToExport.forEach(role => {
        policy[role] = {
          permissions: rbac.permissionsFor(role),
          hierarchy: ROLE_HIERARCHY[role],
          group: getRoleGroup(role),
          riskScore: calcRiskScore(role),
        };
      });
      const blob = new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportScope === 'all' ? 'rbac-policy.json' : `rbac-policy-${exportScope.toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows = [['Role', 'Label', 'Group', 'Hierarchy', 'Risk Score', 'Permission', 'Domain', 'Level', 'Critical']];
      rolesToExport.forEach(role => {
        const summary = rbac.summary(role);
        summary.forEach(d => {
          d.granted.forEach(p => {
            rows.push([
              role,
              ROLE_METADATA[role].label,
              getRoleGroup(role),
              String(ROLE_HIERARCHY[role]),
              String(calcRiskScore(role)),
              p,
              d.domain,
              d.level,
              isSensitivePerm(p) ? 'yes' : 'no',
            ]);
          });
        });
      });
      exportCSV(exportScope === 'all' ? 'rbac-policy-full.csv' : `rbac-policy-${exportScope.toLowerCase()}.csv`, rows);
    }

    setJustExported(true);
    setTimeout(() => setJustExported(false), 2000);
  };

  // -- Sensitive route guard analysis ----------------------------------------
  const sensitiveRouteAnalysis = useMemo(() => {
    return Array.from(SENSITIVE_ROUTES).sort().map(route => {
      const requiredPerm = ROUTE_POLICY[route];
      const accessibleRoles = requiredPerm
        ? ALL_ROLES.filter(r => rbac.can(r, requiredPerm as Permission))
        : ALL_ROLES;
      return { route, requiredPerm, accessibleRoles };
    });
  }, []);

  return (
    <div className="space-y-6">

      {/* -- Policy Export ----------------------------------------------- */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--pro-azure-light)]" />
            Policy Export
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Export the full RBAC policy as JSON or CSV for documentation, audits, or CI/CD pipelines.</p>
        </div>
        <div className="p-5 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Format</label>
            <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
              {(['csv', 'json'] as const).map(f => (
                <button key={f} onClick={() => setExportFormat(f)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${exportFormat === f ? 'bg-[var(--pro-azure)] text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Scope</label>
            <select value={exportScope} onChange={e => setExportScope(e.target.value as 'all' | AppRole)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300 focus:outline-none focus:border-teal-400">
              <option value="all">All Roles</option>
              {ALL_ROLES.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]).map(r => (
                <option key={r} value={r}>{ROLE_METADATA[r].label}</option>
              ))}
            </select>
          </div>
          <button onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              justExported
                ? 'bg-[var(--pro-azure)] text-white'
                : 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white'
            }`}>
            {justExported ? <CheckCheck className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {justExported ? 'Exported!' : `Export ${exportFormat.toUpperCase()}`}
          </button>
          <div className="text-xs text-slate-500 ml-auto">
            {exportScope === 'all'
              ? `${ALL_ROLES.length} roles · ${Object.values(ROLE_PERMISSIONS).reduce((s, p) => s + p.length, 0)} total grants`
              : `${rbac.permissionsFor(exportScope as AppRole).length} permissions`}
          </div>
        </div>
      </div>

      {/* -- Deep Role Comparison ---------------------------------------- */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80 flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-violet-400" />
            Deep Role Comparison
          </h3>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <select value={compareA} onChange={e => setCompareA(e.target.value as AppRole)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300">
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_METADATA[r].label}</option>)}
            </select>
            <span className="text-slate-600 text-xs font-bold">vs</span>
            <select value={compareB} onChange={e => setCompareB(e.target.value as AppRole)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-600 dark:text-slate-300">
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_METADATA[r].label}</option>)}
            </select>
            <button
              onClick={() => {
                const rows = [['Domain', `${compareA} Level`, `${compareB} Level`, `${compareA} Perms`, `${compareB} Perms`]];
                domainKeys.forEach(d => {
                  const a = domainMapA[d]; const b = domainMapB[d];
                  rows.push([d, a?.level ?? 'none', b?.level ?? 'none', (a?.granted ?? []).join('; '), (b?.granted ?? []).join('; ')]);
                });
                exportCSV(`compare-${compareA}-vs-${compareB}.csv`, rows);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors"
            >
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>

        {/* Role header cards */}
        <div className="grid grid-cols-2 gap-px bg-slate-200/30 dark:bg-slate-700/30">
          {([{ role: compareA, meta: metaA, score: scoreA }, { role: compareB, meta: metaB, score: scoreB }] as const).map(({ role, meta, score }) => (
            <div key={role} className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.color.dot}`} />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{meta.label}</span>
                <RiskBadge score={score} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{meta.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>{rbac.permissionsFor(role).length} perms</span>
                <span>H:{ROLE_HIERARCHY[role]}</span>
                <span className="font-mono">{role}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Domain-by-domain comparison table */}
        <div className="overflow-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium min-w-[160px]">Domain</th>
                <th className="text-center px-4 py-2.5 font-semibold min-w-[120px]">
                  <span className={`px-2 py-0.5 rounded text-xs ${metaA.color.badge}`}>{metaA.label}</span>
                </th>
                <th className="text-center px-4 py-2.5 font-semibold min-w-[120px]">
                  <span className={`px-2 py-0.5 rounded text-xs ${metaB.color.badge}`}>{metaB.label}</span>
                </th>
                <th className="text-center px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {domainKeys.map((domain, i) => {
                const a = domainMapA[domain];
                const b = domainMapB[domain];
                const lvlA = (a?.level ?? 'none') as Level;
                const lvlB = (b?.level ?? 'none') as Level;
                const diff = levelOrder[lvlB] - levelOrder[lvlA];
                return (
                  <tr key={domain} className={`border-b border-slate-200/60 dark:border-slate-700/30 ${i % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''}`}>
                    <td className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 capitalize">{domain.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono ${levelBadge(lvlA)}`}>
                        {levelIcon(lvlA)} {lvlA}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono ${levelBadge(lvlB)}`}>
                        {levelIcon(lvlB)} {lvlB}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {diff > 0 && <span className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold text-xs">▲ {compareB.split('_')[0]}</span>}
                      {diff < 0 && <span className="text-rose-400 font-bold text-xs">▼ {compareA.split('_')[0]}</span>}
                      {diff === 0 && <span className="text-slate-600 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- Sensitive Route Guard Analysis ------------------------------ */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-violet-400" />
            Sensitive Route Guard Analysis
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Routes in <code className="text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)]0/10 px-1 rounded">SENSITIVE_ROUTES</code> require MFA step-up. Shows which roles can access each and the required permission.
          </p>
        </div>
        <div className="overflow-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium min-w-[200px]">Route</th>
                <th className="text-left px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Required Permission</th>
                <th className="text-center px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">MFA</th>
                <th className="text-left px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Accessible By</th>
                <th className="text-center px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Role Count</th>
              </tr>
            </thead>
            <tbody>
              {sensitiveRouteAnalysis.map(({ route, requiredPerm, accessibleRoles }, i) => (
                <tr key={route} className={`border-b border-slate-200/60 dark:border-slate-700/30 ${i % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">{route}</td>
                  <td className="px-4 py-2.5">
                    {requiredPerm
                      ? <PermChip perm={requiredPerm as Permission} />
                      : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <MfaBadge />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {accessibleRoles.slice(0, 5).map(r => (
                        <span key={r} className={`px-1.5 py-0.5 rounded text-xs ${ROLE_METADATA[r].color.badge}`}>
                          {ROLE_METADATA[r].label}
                        </span>
                      ))}
                      {accessibleRoles.length > 5 && (
                        <span className="text-slate-500 text-xs self-center">+{accessibleRoles.length - 5}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs font-bold ${accessibleRoles.length <= 3 ? 'text-[var(--pro-azure-light)]' : accessibleRoles.length <= 7 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {accessibleRoles.length}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Keyboard Shortcuts Modal
// -----------------------------------------------------------------------------

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: '1–9', desc: 'Jump to tab by number' },
    { key: '/', desc: 'Open permission lookup' },
    { key: '?', desc: 'Toggle this shortcuts panel' },
    { key: 'Esc', desc: 'Close modals / panels' },
  ];
  const tabShortcuts = [
    { key: '1', desc: 'By Role' },
    { key: '2', desc: 'Matrix' },
    { key: '3', desc: 'Diff' },
    { key: '4', desc: 'Groups' },
    { key: '5', desc: 'Coverage' },
    { key: '6', desc: 'Routes' },
    { key: '7', desc: 'IFRS' },
    { key: '8', desc: 'Role Guide' },
    { key: '9', desc: 'Risk' },
  ];
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[var(--pro-azure)]" />
            Keyboard Shortcuts
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {/* Global shortcuts */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Global</p>
            <div className="space-y-1.5">
              {shortcuts.map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-300">{s.desc}</span>
                  <kbd className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
          {/* Tab shortcuts */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Tab Navigation</p>
            <div className="grid grid-cols-2 gap-1.5">
              {tabShortcuts.map(s => (
                <div key={s.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs text-slate-600 dark:text-slate-300">{s.desc}</span>
                  <kbd className="text-[10px] font-mono font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/20 px-1.5 py-0.5 rounded">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">Shortcuts are disabled when an input is focused</p>
        </div>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------------------
// Tab configuration
// -----------------------------------------------------------------------------

interface TabConfig {
  id: ViewMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const TABS: TabConfig[] = [
  { id: 'by-role',   label: 'By Role',   icon: <User className="w-3.5 h-3.5" />,         description: 'Permissions per role with risk scoring' },
  { id: 'matrix',    label: 'Matrix',    icon: <Grid3x3 className="w-3.5 h-3.5" />,       description: 'Full permission matrix with heatmap' },
  { id: 'diff',      label: 'Diff',      icon: <GitCompare className="w-3.5 h-3.5" />,    description: 'Compare permissions between roles' },
  { id: 'groups',    label: 'Groups',    icon: <Layers className="w-3.5 h-3.5" />,        description: 'Role groups and hierarchy' },
  { id: 'coverage',  label: 'Coverage',  icon: <Activity className="w-3.5 h-3.5" />,      description: 'Permission coverage across all roles' },
  { id: 'routes',    label: 'Routes',    icon: <Route className="w-3.5 h-3.5" />,         description: 'Route policy and access control' },
  { id: 'ifrs',      label: 'IFRS',      icon: <Scale className="w-3.5 h-3.5" />,         description: 'IFRS & Banking compliance matrix' },
   { id: 'OVDS', label: 'Role Guide', icon: <BookOpen className="w-3.5 h-3.5" />,     description: 'Comprehensive role reference guide' },
  { id: 'risk',      label: 'Risk',      icon: <Gauge className="w-3.5 h-3.5" />,         description: 'Enterprise risk scoring dashboard', badge: 'NEW', badgeColor: 'bg-rose-500/20 text-rose-300' },
  { id: 'sod',       label: 'SoD',       icon: <Scale className="w-3.5 h-3.5" />,         description: 'Segregation of Duties conflict detector', badge: 'NEW', badgeColor: 'bg-amber-500/20 text-amber-300' },
  { id: 'simulate',  label: 'Simulate',  icon: <FlaskConical className="w-3.5 h-3.5" />,  description: 'Role simulation explorer', badge: 'NEW', badgeColor: 'bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure)] dark:text-green-300' },
  { id: 'audit',     label: 'Audit',     icon: <History className="w-3.5 h-3.5" />,       description: 'Audit intelligence — events, regulations, retention', badge: 'NEW', badgeColor: 'bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure)] dark:text-green-300' },
  { id: 'policy',    label: 'Policy',    icon: <FileText className="w-3.5 h-3.5" />,      description: 'Policy export, deep role comparison, sensitive route analysis', badge: 'NEW', badgeColor: 'bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure)] dark:text-green-300' },
  { id: 'smart-rules', label: 'Smart Rules', icon: <Zap className="w-3.5 h-3.5" />,      description: 'Context-aware RBAC: amount limits, status checks, and multi-tenant isolation', badge: 'SMART', badgeColor: 'bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure)] dark:text-green-300' },
  { id: 'app-access', label: 'App Access', icon: <Package className="w-3.5 h-3.5" />,   description: 'App access control per role', badge: 'NEW', badgeColor: 'bg-violet-500/20 text-violet-300' },
  { id: 'overrides',  label: 'Overrides',  icon: <Shield className="w-3.5 h-3.5" />,    description: 'Per-company role permission overrides (GRANT / DENY)', badge: 'LIVE', badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-300' },
  { id: 'custom-roles', label: 'Custom Roles', icon: <Users className="w-3.5 h-3.5" />,   description: 'CRUD for company-specific database-backed roles', badge: 'CRUD', badgeColor: 'bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure)] dark:text-green-300' },
  { id: 'permissions',  label: 'Permissions',  icon: <Lock className="w-3.5 h-3.5" />,     description: 'CRUD for granular permissions and categories', badge: 'CRUD', badgeColor: 'bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure)] dark:text-green-300' },
  { id: 'security-policy', label: 'Security Policy', icon: <ShieldCheck className="w-3.5 h-3.5" />, description: 'Per-tenant ABAC policy: IP whitelist, time-window, MFA enforcement', badge: 'ABAC', badgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-300' },
];

// -----------------------------------------------------------------------------
// App Access View
// -----------------------------------------------------------------------------

function AppAccessView() {
  const [apps, setApps] = useState<Array<{ id: string; name: string; slug: string; category: string }>>([]);
  const [roleAccess, setRoleAccess] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/app-access/roles')
      .then((res: any) => {
        const data = res.data ?? [];
        const mapped = data.reduce((acc: Record<string, Record<string, string>>, item: any) => {
          if (!acc[item.role]) acc[item.role] = {};
          acc[item.role][item.appId] = item.accessLevel;
          return acc;
        }, {});
        setRoleAccess(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/app-access/apps')
      .then((res: any) => setApps(res.data ?? []))
      .catch(() => {});
  }, []);

  const ACCESS_LEVELS = [
    { value: 'NONE', label: 'None', color: 'bg-slate-100 text-slate-500' },
    { value: 'READ', label: 'Read', color: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' },
    { value: 'WRITE', label: 'Write', color: 'bg-amber-50 text-amber-700' },
    { value: 'ADMIN', label: 'Admin', color: 'bg-rose-50 text-rose-700' },
  ];

  const handleRoleAppChange = async (role: string, appId: string, accessLevel: string) => {
    try {
      await api.post('/app-access/roles', { role, appId, accessLevel });
      setRoleAccess(prev => ({
        ...prev,
        [role]: { ...prev[role], [appId]: accessLevel },
      }));
      toast.success('Updated');
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/5 rounded-xl border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/20 p-4">
        <h3 className="text-sm font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] mb-1 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Role → App Access Matrix
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure which apps each role can access. Super-admins bypass all checks.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading app access data…
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
          <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No apps configured yet.</p>
          <p className="text-xs text-slate-400 mt-1">Apps installed via the App Store will appear here.</p>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-slate-200/80 dark:border-slate-700/50">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80">
                <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium border-b border-r border-slate-200 dark:border-slate-700 min-w-[140px]">
                  Role
                </th>
                {apps.map(app => (
                  <th key={app.id} className="px-2 py-2 text-center border-b border-slate-200 dark:border-slate-700 min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium text-[10px]">{app.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_ROLES.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]).map((role, ri) => (
                <tr key={role} className={`${ri % 2 === 0 ? 'bg-slate-50/60 dark:bg-slate-900/30' : 'bg-slate-50/80 dark:bg-slate-800/20'}`}>
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 border-r border-slate-200/80 dark:border-slate-700/50 font-medium text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${ROLE_METADATA[role].color.dot}`} />
                      {ROLE_METADATA[role].label}
                    </div>
                  </td>
                  {apps.map(app => {
                    const currentLevel = roleAccess[role]?.[app.id] ?? 'NONE';
                    const levelInfo = ACCESS_LEVELS.find(l => l.value === currentLevel);
                    return (
                      <td key={app.id} className={`text-center py-1.5 px-1 ${levelInfo?.color ?? 'bg-slate-100/30'}`}>
                        <select
                          value={currentLevel}
                          onChange={e => handleRoleAppChange(role, app.id, e.target.value)}
                          className="text-[10px] bg-transparent border-0 rounded px-1 py-0.5 text-center w-full cursor-pointer"
                        >
                          {ACCESS_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Overrides View — per-company role permission override matrix
// (migrated from the former /settings/advanced-access-controls page)
// -----------------------------------------------------------------------------

const OVERRIDE_ACCESS_OPTIONS: { value: 'GRANT' | 'DENY'; label: string }[] = [
  { value: 'GRANT', label: 'Grant' },
  { value: 'DENY',  label: 'Deny'  },
];

function OverridesView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const companyId = useCompanyId();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const catalog = useMemo(() => permissionCatalog(), []);

  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return catalog;
    const term = searchTerm.toLowerCase();
    return catalog.filter((domain) => {
      if (domain.key.toLowerCase().includes(term)) return true;
      return [
        ...domain.permissions.view,
        ...domain.permissions.create,
        ...domain.permissions.edit,
        ...domain.permissions.delete,
        ...domain.permissions.approve,
      ].some((p) => p.toLowerCase().includes(term));
    });
  }, [catalog, searchTerm]);

  useEffect(() => {
    if (expandedDomain === null && filteredCatalog.length > 0) {
      setExpandedDomain(filteredCatalog[0].key);
    }
  }, [expandedDomain, filteredCatalog]);

  const {
    data: overrides,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['app-access', 'overrides', companyId],
    queryFn: () => advancedAccessApi.getOverrides(companyId || undefined),
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const resetMutation = useMutation({
    mutationFn: () => advancedAccessApi.saveOverrides([], companyId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-access', 'overrides', companyId] });
      toast.success(t('advancedAccess.resetComplete', 'All overrides cleared'));
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t('advancedAccess.errors.resetFailed', 'Reset failed'));
    },
  });

  const safeOverrides: RolePermissionOverrideDTO[] = (Array.isArray(overrides) ? overrides : []).filter(
    (o): o is RolePermissionOverrideDTO =>
      o !== null &&
      typeof o === 'object' &&
      typeof o.role === 'string' &&
      typeof o.permission === 'string' &&
      (o.access === 'GRANT' || o.access === 'DENY'),
  );

  const overrideMap = useMemo(() => {
    const map = new Map<string, 'GRANT' | 'DENY'>();
    for (const o of safeOverrides) map.set(`${o.role}:${o.permission}`, o.access);
    return map;
  }, [safeOverrides]);

  const getOverride = (role: string, permission: string) =>
    overrideMap.get(`${role}:${permission}`) ?? null;

  const setOverride = async (role: string, permission: string, access: 'GRANT' | 'DENY') => {
    const newAccess = getOverride(role, permission) === access ? null : access;
    const current = [...safeOverrides];
    const idx = current.findIndex((o) => o.role === role && o.permission === permission);
    if (newAccess === null) {
      if (idx >= 0) current.splice(idx, 1);
    } else {
      if (idx >= 0) current[idx].access = newAccess;
      else current.push({ role, permission, access: newAccess });
    }
    try {
      await advancedAccessApi.saveOverrides(current, companyId || undefined);
      queryClient.setQueryData(['app-access', 'overrides', companyId], current);
      toast.success(t('advancedAccess.overrideSaved', 'Override saved'));
    } catch (err: any) {
      toast.error(err?.message ?? t('advancedAccess.errors.saveFailed', 'Save failed'));
    }
  };

  const handleReset = () => {
    if (!confirm(t('advancedAccess.resetConfirm', 'Clear all overrides? This cannot be undone.'))) return;
    resetMutation.mutate();
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-slate-500 gap-2">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        No company selected. Select a company to manage overrides.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-sm text-slate-500">
        <RefreshCw className="h-4 w-4 animate-spin" /> Loading overrides…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-sm text-rose-500">
        <AlertCircle className="h-5 w-5" /> Failed to load overrides.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            Role Permission Overrides
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            GRANT or DENY specific permissions per role for this company. Overrides layer on top of base role permissions.
            SPURADMIN / SUPERADMIN are never restricted by DENY overrides.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleReset}
            disabled={safeOverrides.length === 0 || resetMutation.isPending}
            className="px-3 py-1.5 text-xs border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-1.5 disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" />
            Reset All
          </button>
        </div>
      </div>

      {/* Active override count */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {safeOverrides.length} active override{safeOverrides.length !== 1 ? 's' : ''}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search domains or permissions…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/30"
        />
      </div>

      {/* Domain accordion */}
      <div className="space-y-2">
        {filteredCatalog.map((domain) => (
          <div key={domain.key} className="border border-slate-200/80 dark:border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedDomain(expandedDomain === domain.key ? null : domain.key)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              <span>{domain.key}</span>
              {expandedDomain === domain.key
                ? <ChevronDown className="h-4 w-4 text-slate-400" />
                : <ChevronRight className="h-4 w-4 text-slate-400" />}
            </button>

            {expandedDomain === domain.key && (
              <div className="border-t border-slate-200/80 dark:border-slate-700/50 overflow-x-auto">
                <table className="text-xs w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                      <th className="text-left px-4 py-2 text-slate-500 dark:text-slate-400 font-medium min-w-[200px]">Permission</th>
                      {ALL_ROLES.map((role) => (
                        <th key={role} className="text-center px-2 py-2 text-slate-500 dark:text-slate-400 font-medium min-w-[80px]">
                          {ROLE_METADATA[role]?.label ?? role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set([
                      ...domain.permissions.view,
                      ...domain.permissions.create,
                      ...domain.permissions.edit,
                      ...domain.permissions.delete,
                      ...domain.permissions.approve,
                    ])).map((perm, pi) => (
                      <tr key={perm} className={pi % 2 === 0 ? 'bg-white dark:bg-slate-900/20' : 'bg-slate-50/60 dark:bg-slate-800/20'}>
                        <td className="px-4 py-1.5 font-mono text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/50">{perm}</td>
                        {ALL_ROLES.map((role) => {
                          const current = getOverride(role, perm);
                          return (
                            <td key={role} className="text-center py-1.5 px-1">
                              {current ? (
                                <button
                                  onClick={() => setOverride(role, perm, current)}
                                  title={`Clear ${current} override`}
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                                    current === 'GRANT'
                                      ? 'bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)]/20'
                                      : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                                  }`}
                                >
                                  {current === 'GRANT' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                </button>
                              ) : (
                                <div className="inline-flex gap-0.5">
                                  {OVERRIDE_ACCESS_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={() => setOverride(role, perm, opt.value)}
                                      title={`${opt.label} ${perm} for ${role}`}
                                      className={`inline-flex items-center justify-center w-5 h-5 rounded opacity-30 hover:opacity-100 transition-opacity ${
                                        opt.value === 'GRANT'
                                          ? 'text-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)]/10'
                                          : 'text-rose-500 hover:bg-rose-500/10'
                                      }`}
                                    >
                                      {opt.value === 'GRANT' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {filteredCatalog.length === 0 && (
          <div className="text-center py-10 text-sm text-slate-400">
            No domains match "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Database-backed RBAC CRUD Views
// -----------------------------------------------------------------------------

type DbPermission = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
  companyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type DbRole = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  isSystem: boolean;
  apiAccess: boolean;
  companyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  permissions: DbPermission[];
  customUsersCount?: number;
};

function useCompanyId(): string | undefined {
  try {
    const cid = localStorage.getItem('selectedCompanyId');
    return cid ?? undefined;
  } catch { return undefined; }
}

const PERMISSION_CATEGORIES = [
  'system', 'hr', 'payroll', 'ovds', 'tax', 'banking', 'audit',
  'ifrs', 'inventory', 'crm', 'invoice', 'compliance', 'other',
];

// ---------------------------------------------------------------------------
// SecurityPolicyPanel — per-tenant ABAC configuration
// ---------------------------------------------------------------------------

const COMMON_TIMEZONES = [
  'Africa/Addis_Ababa', 'Africa/Nairobi', 'Africa/Cairo',
  'Europe/London', 'Europe/Paris', 'Asia/Dubai',
  'America/New_York', 'America/Los_Angeles', 'UTC',
];

/** The default sensitive permissions mirrored from access-policy.service.ts */
const DEFAULT_SENSITIVE_PERMS = [
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
];

/** Validate an IPv4, IPv4 CIDR, or simple IPv6 address string. Returns an error message or null. */
function validateIpOrCidr(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Enter an IP or CIDR block.';
  // CIDR
  if (v.includes('/')) {
    const [ip, bits] = v.split('/');
    const prefixLen = parseInt(bits ?? '', 10);
    if (isNaN(prefixLen) || prefixLen < 0 || prefixLen > 32) return 'CIDR prefix must be 0–32.';
    const octets = (ip ?? '').split('.');
    if (octets.length !== 4 || octets.some(o => isNaN(+o) || +o < 0 || +o > 255))
      return 'Invalid IPv4 address in CIDR.';
    return null;
  }
  // IPv4
  const octets = v.split('.');
  if (octets.length === 4 && octets.every(o => !isNaN(+o) && +o >= 0 && +o <= 255)) return null;
  // Allow basic IPv6 (contains colon)
  if (v.includes(':')) return null;
  return 'Not a valid IP address or CIDR block.';
}

/** Pill toggle switch */
function Toggle({ checked, onChange, disabled, colorClass = 'bg-[var(--pro-azure-50)]0' }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; colorClass?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]
        disabled:opacity-40 disabled:cursor-not-allowed
        ${checked ? colorClass : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
          transform transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
}

/** Compute a 0–100 policy strength score based on active controls */
function calcPolicyScore(ipList: string[], hoursOn: boolean, mfaOn: boolean, extraPerms: string[]): number {
  let score = 0;
  if (ipList.length > 0)   score += 35; // IP restriction: biggest impact
  if (hoursOn)             score += 25; // time-window
  if (mfaOn)               score += 30; // MFA
  if (extraPerms.length > 0) score += 10; // extended sensitive perms coverage
  return Math.min(100, score);
}

function SecurityPolicyPanel() {
  const companyId  = useCompanyId();
  const qc         = useQueryClient();
  const { can }    = useRbac();
  const canWrite   = can('role_permissions:write') || can('settings:write');

  const { data: loaded, isLoading } = useQuery({
    queryKey: ['security-policy', companyId],
    queryFn: async () => {
      const res = await api.get('/settings/security-policy', {
        params: { ...(companyId ? { companyId } : {}) },
      });
      return (res.data?.data ?? null) as {
        companyId: string; companyName: string;
        policy: {
          ipWhitelist?: string[];
          allowedHours?: { start: string; end: string; timezone: string } | null;
          mfaRequired?: boolean;
          sensitivePerms?: string[];
        } | null;
      } | null;
    },
  });

  const policy = loaded?.policy ?? {};

  // ── form state ────────────────────────────────────────────────────────────
  const [ipInput,     setIpInput]     = useState('');
  const [ipError,     setIpError]     = useState<string | null>(null);
  const [ipList,      setIpList]      = useState<string[]>([]);
  const [hoursOn,     setHoursOn]     = useState(false);
  const [start,       setStart]       = useState('09:00');
  const [end,         setEnd]         = useState('17:00');
  const [tz,          setTz]          = useState('Africa/Addis_Ababa');
  const [mfaOn,       setMfaOn]       = useState(false);
  const [extraPerms,  setExtraPerms]  = useState<string[]>([]);
  const [permInput,   setPermInput]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [previewCopied, setPreviewCopied] = useState(false);

  // ── load from server ─────────────────────────────────────────────────────
  const loadState = useCallback(() => {
    if (!loaded) return;
    const p = loaded.policy ?? {};
    setIpList(p.ipWhitelist ?? []);
    setHoursOn(!!p.allowedHours);
    setStart(p.allowedHours?.start ?? '09:00');
    setEnd(p.allowedHours?.end ?? '17:00');
    setTz(p.allowedHours?.timezone ?? 'Africa/Addis_Ababa');
    setMfaOn(p.mfaRequired ?? false);
    setExtraPerms(p.sensitivePerms ?? []);
  }, [loaded]);  

  useEffect(() => { loadState(); }, [loadState]);

  // ── dirty check ──────────────────────────────────────────────────────────
  const savedIpList     = policy.ipWhitelist     ?? [];
  const savedHoursOn    = !!policy.allowedHours;
  const savedStart      = policy.allowedHours?.start    ?? '09:00';
  const savedEnd        = policy.allowedHours?.end      ?? '17:00';
  const savedTz         = policy.allowedHours?.timezone ?? 'Africa/Addis_Ababa';
  const savedMfaOn      = policy.mfaRequired ?? false;
  const savedExtraPerms = policy.sensitivePerms ?? [];

  const isDirty = useMemo(() => {
    if (!loaded) return false;
    const ipChanged   = JSON.stringify([...ipList].sort()) !== JSON.stringify([...savedIpList].sort());
    const hoursChanged = hoursOn !== savedHoursOn || start !== savedStart || end !== savedEnd || tz !== savedTz;
    const mfaChanged   = mfaOn !== savedMfaOn;
    const permsChanged = JSON.stringify([...extraPerms].sort()) !== JSON.stringify([...savedExtraPerms].sort());
    return ipChanged || hoursChanged || mfaChanged || permsChanged;
  }, [ipList, hoursOn, start, end, tz, mfaOn, extraPerms, loaded,
      savedIpList, savedHoursOn, savedStart, savedEnd, savedTz, savedMfaOn, savedExtraPerms]);

  // ── score ─────────────────────────────────────────────────────────────────
  const score = useMemo(() => calcPolicyScore(ipList, hoursOn, mfaOn, extraPerms), [ipList, hoursOn, mfaOn, extraPerms]);
  const scoreColor = score >= 70 ? 'text-[var(--pro-azure)]' : score >= 40 ? 'text-amber-500' : 'text-rose-500';
  const scoreBarColor = score >= 70 ? 'bg-[var(--pro-azure-50)]0' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  const scoreLabel = score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : 'Weak';

  // ── IP helpers ────────────────────────────────────────────────────────────
  const addIp = () => {
    const t = ipInput.trim();
    const err = validateIpOrCidr(t);
    if (err) { setIpError(err); return; }
    if (ipList.includes(t)) { setIpError('Already in the list.'); return; }
    setIpList(l => [...l, t]);
    setIpInput('');
    setIpError(null);
  };
  const removeIp = (ip: string) => setIpList(l => l.filter(x => x !== ip));

  // ── extra perm helpers ────────────────────────────────────────────────────
  const addPerm = () => {
    const t = permInput.trim();
    if (!t) return;
    if (DEFAULT_SENSITIVE_PERMS.includes(t)) { toast.error('Already in the default set.'); return; }
    if (extraPerms.includes(t)) { toast.error('Already added.'); return; }
    setExtraPerms(p => [...p, t]);
    setPermInput('');
  };
  const removePerm = (p: string) => setExtraPerms(list => list.filter(x => x !== p));

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/security-policy', {
        ...(companyId ? { companyId } : {}),
        ipWhitelist:   ipList,
        allowedHours:  hoursOn ? { start, end, timezone: tz } : null,
        mfaRequired:   mfaOn,
        sensitivePerms: extraPerms.length > 0 ? extraPerms : undefined,
      });
      qc.invalidateQueries({ queryKey: ['security-policy', companyId] });
      qc.invalidateQueries({ queryKey: ['security-policy-history', companyId] });
      toast.success('Security policy saved');
    } catch (e: any) {
      // Surface DTO validation errors from the backend (class-validator returns
      // an array under response.data.message when ValidationPipe fires)
      const msg = e?.response?.data?.message;
      if (Array.isArray(msg)) {
        toast.error(msg[0] ?? 'Validation error');
      } else {
        toast.error(msg ?? e?.message ?? 'Failed to save policy');
      }
    }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!confirm('Reset the entire security policy? This clears all restrictions and cannot be undone.')) return;
    setSaving(true);
    try {
      await api.delete('/settings/security-policy', {
        params: { ...(companyId ? { companyId } : {}) },
      });
      qc.invalidateQueries({ queryKey: ['security-policy', companyId] });
      qc.invalidateQueries({ queryKey: ['security-policy-history', companyId] });
      toast.success('Security policy reset');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Reset failed');
    } finally { setSaving(false); }
  };

  // ── preview JSON ──────────────────────────────────────────────────────────
  const previewObj = {
    ipWhitelist:    ipList.length > 0 ? ipList : '(unrestricted)',
    allowedHours:   hoursOn ? { start, end, timezone: tz } : '(unrestricted)',
    mfaRequired:    mfaOn,
    sensitivePerms: extraPerms.length > 0
      ? { defaults: DEFAULT_SENSITIVE_PERMS, extras: extraPerms }
      : '(defaults only)',
  };
  const previewJson = JSON.stringify(previewObj, null, 2);

  const copyPreview = () => {
    navigator.clipboard.writeText(previewJson).then(() => {
      setPreviewCopied(true);
      setTimeout(() => setPreviewCopied(false), 2000);
    });
  };

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tenant Security Policy</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ABAC rules enforced on every sensitive write for{' '}
            <span className="font-semibold">{loaded?.companyName ?? 'this company'}</span>.{' '}
            Stored in <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">company.securityPolicy</code>.
          </p>
        </div>
        <button onClick={handleSave} disabled={!canWrite || saving}
          className="ovds-btn-primary flex items-center gap-1.5 text-xs shrink-0 disabled:opacity-50">
          {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saving ? 'Saving…' : 'Save Policy'}
        </button>
        {canWrite && (
          <button onClick={handleReset} disabled={saving}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/30 transition-colors disabled:opacity-40"
            title="Reset entire policy to defaults">
            <Trash className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* ── Policy Strength Score ─────────────────────────────────────── */}
      <div className="ovds-widget-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Policy Strength</span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>
            {score}/100 — {scoreLabel}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${scoreBarColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { label: 'IP Restriction',   active: ipList.length > 0, points: 35 },
            { label: 'Time Window',       active: hoursOn,           points: 25 },
            { label: 'MFA Required',      active: mfaOn,             points: 30 },
            { label: 'Extra Perms',       active: extraPerms.length > 0, points: 10 },
          ].map(({ label, active, points }) => (
            <span key={label}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors
                ${active
                  ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
              {active
                ? <Check className="w-2.5 h-2.5" />
                : <span className="w-2.5 h-2.5 inline-block rounded-full border border-current opacity-40" />}
              {label} <span className="opacity-60">+{points}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Unsaved changes banner ────────────────────────────────────── */}
      {isDirty && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">You have unsaved changes.</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadState}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline">
              Reset
            </button>
            <button onClick={handleSave} disabled={!canWrite || saving}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors">
              {saving ? 'Saving…' : 'Save now'}
            </button>
          </div>
        </div>
      )}

      {/* ── IP Whitelist ──────────────────────────────────────────────── */}
      <div className="ovds-widget-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--pro-azure)]" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">IP Whitelist</span>
            {ipList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] text-[10px] font-bold">
                {ipList.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Restrict sensitive operations (fund transfers, payroll approvals, role changes) to specific IPs or CIDR blocks.
            Empty = all IPs allowed.
          </p>
        </div>
        <div className="p-4 space-y-3">
          {ipList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {ipList.map(ip => (
                <span key={ip}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
                  {ip}
                  {canWrite && (
                    <button onClick={() => removeIp(ip)} aria-label={`Remove ${ip}`}
                      className="text-slate-400 hover:text-rose-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No IP restrictions — all addresses permitted.</p>
          )}
          {canWrite && (
            <div className="space-y-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ipInput}
                  onChange={e => { setIpInput(e.target.value); setIpError(null); }}
                  onKeyDown={e => e.key === 'Enter' && addIp()}
                  placeholder="196.188.0.0/16 or 10.0.0.1"
                  className={`flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border rounded-lg
                    focus:outline-none font-mono text-slate-700 dark:text-slate-300 transition-colors
                    ${ipError
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[var(--pro-azure)]'}`}
                />
                <button onClick={addIp} disabled={!ipInput.trim()}
                  className="px-3 py-1.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors">
                  Add
                </button>
              </div>
              {ipError && (
                <p className="flex items-center gap-1 text-[10px] text-rose-500">
                  <AlertTriangle className="w-3 h-3 shrink-0" />{ipError}
                </p>
              )}
            </div>
          )}
          <p className="text-[10px] text-slate-400">
            Supports exact IPs and CIDR notation.
            IPv6-mapped IPv4 (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">::ffff:</code>) normalised automatically.
          </p>
        </div>
      </div>

      {/* ── Allowed Hours ─────────────────────────────────────────────── */}
      <div className="ovds-widget-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Allowed Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${hoursOn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                {hoursOn ? 'Enabled' : 'Disabled'}
              </span>
              <Toggle checked={hoursOn} onChange={setHoursOn} disabled={!canWrite} colorClass="bg-amber-500" />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Restrict sensitive ops to a business-hours window in the tenant's timezone.
          </p>
        </div>
        <div className={`p-4 space-y-3 transition-opacity duration-200 ${hoursOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="grid grid-cols-3 gap-3">
            {([['Start', start, setStart], ['End', end, setEnd]] as const).map(([label, val, setter]) => (
              <div key={label as string}>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {label as string}
                </label>
                <input type="time" value={val as string}
                  onChange={e => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[var(--pro-azure)] text-slate-700 dark:text-slate-300" />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timezone</label>
              <select value={tz} onChange={e => setTz(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[var(--pro-azure)] text-slate-700 dark:text-slate-300">
                {COMMON_TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {hoursOn && start >= end && (
            <p className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Start time is not before end time — the window may not match your intent.
            </p>
          )}
          <p className="text-[10px] text-slate-400">Requests outside the window receive a 403 for sensitive permissions.</p>
        </div>
      </div>

      {/* ── Require MFA ──────────────────────────────────────────────── */}
      <div className="ovds-widget-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-violet-500" />
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Require MFA</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sensitive write/approve operations require a verified MFA session (<code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">mfaVerified</code> JWT claim).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium ${mfaOn ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`}>
              {mfaOn ? 'Enabled' : 'Disabled'}
            </span>
            <Toggle checked={mfaOn} onChange={setMfaOn} disabled={!canWrite} colorClass="bg-violet-500" />
          </div>
        </div>
      </div>

      {/* ── Sensitive Permissions ─────────────────────────────────────── */}
      <div className="ovds-widget-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Sensitive Permissions</span>
            {extraPerms.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-bold">
                +{extraPerms.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Permissions that trigger IP whitelist and time-window enforcement.
            The defaults below always apply; add extras to extend coverage.
          </p>
        </div>
        <div className="p-4 space-y-4">
          {/* Default set — read-only chips */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Default set (always active)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SENSITIVE_PERMS.map(p => (
                <span key={p}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[10px] font-mono text-rose-700 dark:text-rose-400">
                  <Lock className="w-2.5 h-2.5 opacity-60" />{p}
                </span>
              ))}
            </div>
          </div>

          {/* Extra perms */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Extra permissions (this tenant)
            </p>
            {extraPerms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {extraPerms.map(p => (
                  <span key={p}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] font-mono text-amber-700 dark:text-amber-400">
                    {p}
                    {canWrite && (
                      <button onClick={() => removePerm(p)} aria-label={`Remove ${p}`}
                        className="text-amber-400 hover:text-rose-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic mb-3">No extras — only the defaults apply.</p>
            )}
            {canWrite && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={permInput}
                  onChange={e => setPermInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPerm()}
                  placeholder="e.g. custom_module:approve"
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-rose-400 font-mono text-slate-700 dark:text-slate-300"
                />
                <button onClick={addPerm} disabled={!permInput.trim()}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors">
                  Add
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              Extras <strong>extend</strong> the default set — they do not replace it.
              Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">module:action</code> format.
            </p>
          </div>
        </div>
      </div>

      {/* ── Effective Policy Preview ──────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Effective Policy Preview
          </p>
          <button onClick={copyPreview}
            className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            {previewCopied ? <CheckCheck className="w-3 h-3 text-[var(--pro-azure)]" /> : <Copy className="w-3 h-3" />}
            {previewCopied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
        <pre className="p-4 text-[10px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {previewJson}
        </pre>
      </div>

      {/* ── Bottom panels: Simulate + History + All Companies ─────── */}
      <PolicySimulatePanel companyId={companyId} />
      <PolicyHistoryPanel  companyId={companyId} />
      <AllCompaniesPanel />
      <RoleHierarchyPanel  companyId={companyId} />
      <PolicyRoleCheckPanel companyId={companyId} />

    </div>
  );
}

// ---------------------------------------------------------------------------
// PolicySimulatePanel — test an IP / time / MFA combo against the saved policy
// ---------------------------------------------------------------------------
const SIMULATE_PRESETS = [
  { label: 'Fund Transfer',  perms: 'fund_transfers:approve' },
  { label: 'Payroll',        perms: 'payroll:approve' },
  { label: 'Role Change',    perms: 'role_permissions:write' },
  { label: 'Deploy',         perms: 'system:deploy' },
  { label: 'VAT Filing',     perms: 'vat:file' },
];

function PolicySimulatePanel({ companyId }: { companyId?: string }) {
  const [ip,       setIp]       = useState('');
  const [timeStr,  setTimeStr]  = useState('');
  const [mfa,      setMfa]      = useState(false);
  const [permsRaw, setPermsRaw] = useState('fund_transfers:approve');
  const [result,   setResult]   = useState<null | {
    allowed: boolean;
    checks: Array<{ check: string; result: 'pass' | 'fail' | 'skipped'; reason: string }>;
    policy: Record<string, unknown>;
  }>(null);
  const [running, setRunning] = useState(false);
  const [open,    setOpen]    = useState(false);

  // Pre-fill "now" when panel first opens
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      // datetime-local format: yyyy-MM-ddTHH:mm
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setTimeStr(
        `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
      );
    }
    prevOpen.current = open;
  }, [open]);

  const runTest = async () => {
    setRunning(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        ...(companyId ? { companyId } : {}),
        permissions: permsRaw.split(',').map(s => s.trim()).filter(Boolean),
        mfaVerified: mfa,
      };
      if (ip.trim())      body.ipAddress   = ip.trim();
      if (timeStr.trim()) body.requestTime = new Date(timeStr).toISOString();
      const res = await api.post('/settings/security-policy/test', body);
      setResult(res.data?.data ?? null);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? e?.message ?? 'Simulation failed'));
    } finally { setRunning(false); }
  };

  const checkIcon = (r: 'pass' | 'fail' | 'skipped') => {
    if (r === 'pass') return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--pro-azure)] shrink-0" />;
    if (r === 'fail') return <XSquare      className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    return <span className="w-3.5 h-3.5 shrink-0 inline-block rounded-full border border-slate-400 opacity-40" />;
  };

  return (
    <div className="ovds-widget-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Policy Simulator</span>
          <span className="px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[10px] font-bold">TEST</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Test how the <em>saved</em> policy responds to a given IP, time, and MFA state — without making a real write.
          </p>

          {/* Quick presets */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Quick presets</p>
            <div className="flex flex-wrap gap-1.5">
              {SIMULATE_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setPermsRaw(p.perms)}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors
                    ${permsRaw === p.perms
                      ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-violet-300'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source IP</label>
              <input
                type="text" value={ip} onChange={e => setIp(e.target.value)}
                placeholder="blank = 127.0.0.1"
                className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-violet-500 font-mono text-slate-700 dark:text-slate-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Request Time</label>
              <input
                type="datetime-local" value={timeStr} onChange={e => setTimeStr(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Permissions (comma-separated)</label>
            <input
              type="text" value={permsRaw} onChange={e => setPermsRaw(e.target.value)}
              placeholder="fund_transfers:approve, payroll:approve"
              className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-violet-500 font-mono text-slate-700 dark:text-slate-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Toggle checked={mfa} onChange={setMfa} colorClass="bg-violet-500" />
              <span className={`text-xs font-medium ${mfa ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`}>MFA verified</span>
            </div>
            <button
              onClick={runTest} disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {running ? <><RefreshCw className="w-3 h-3 animate-spin" />Running…</> : <><Play className="w-3 h-3" />Run</>}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-4 space-y-3 ${
              result.allowed
                ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/30'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {result.allowed
                  ? <CheckCircle2 className="w-4 h-4 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                  : <XSquare      className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                <span className={`text-sm font-bold ${result.allowed ? 'text-[var(--pro-azure-dark)] dark:text-green-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {result.allowed ? 'Request ALLOWED' : 'Request DENIED'}
                </span>
              </div>
              <div className="space-y-1.5">
                {result.checks.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {checkIcon(c.result)}
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{c.check}</span>
                      <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold
                        ${c.result === 'pass'    ? 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                        : c.result === 'fail'    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        :                          'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        {c.result.toUpperCase()}
                      </span>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400 break-words">{c.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PolicyHistoryPanel — timeline with filter tabs + "by you" highlight
// ---------------------------------------------------------------------------
type HistoryFilter = 'all' | 'updates' | 'denials';

function PolicyHistoryPanel({ companyId }: { companyId?: string }) {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? null;

  const [open,   setOpen]   = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['security-policy-history', companyId],
    queryFn: async () => {
      const res = await api.get('/settings/security-policy/history', {
        params: { limit: 50, ...(companyId ? { companyId } : {}) },
      });
      return (res.data?.data ?? []) as Array<{
        id: string;
        action: 'SECURITY_POLICY_UPDATED' | 'ACCESS_DENIED';
        userId: string | null;
        userName: string | null;
        companyId: string | null;
        details: Record<string, unknown>;
        createdAt: string;
      }>;
    },
    enabled: open,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (filter === 'updates') return data.filter(e => e.action === 'SECURITY_POLICY_UPDATED');
    if (filter === 'denials') return data.filter(e => e.action === 'ACCESS_DENIED');
    return data;
  }, [data, filter]);

  const updateCount = data.filter(e => e.action === 'SECURITY_POLICY_UPDATED').length;
  const denialCount = data.filter(e => e.action === 'ACCESS_DENIED').length;

  const actionMeta = (action: string) => {
    if (action === 'SECURITY_POLICY_UPDATED')
      return { label: 'Policy updated', color: 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]', dot: 'bg-[var(--pro-azure-50)]0' };
    if (action === 'ACCESS_DENIED')
      return { label: 'Access denied', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' };
    return { label: action, color: 'bg-slate-100 dark:bg-slate-700 text-slate-500', dot: 'bg-slate-400' };
  };

  const FILTER_TABS: Array<{ id: HistoryFilter; label: string; count: number }> = [
    { id: 'all',     label: 'All',     count: data.length    },
    { id: 'updates', label: 'Updates', count: updateCount    },
    { id: 'denials', label: 'Denials', count: denialCount    },
  ];

  return (
    <div className="ovds-widget-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Policy History</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold">AUDIT</span>
          {denialCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
              {denialCount} denied
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <button
              onClick={e => { e.stopPropagation(); refetch(); }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          )}
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {/* Filter tabs */}
          <div className="flex gap-1 p-3 border-b border-slate-100 dark:border-slate-800">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                  ${filter === tab.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1 rounded-full font-bold
                    ${filter === tab.id ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {filter === 'all' ? 'No policy events recorded yet.' : `No ${filter} events yet.`}
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700" />
              {filtered.map((ev, idx) => {
                const meta         = actionMeta(ev.action);
                const isOwnChange  = !!currentUserId && ev.userId === currentUserId;
                const diff         = ev.action === 'SECURITY_POLICY_UPDATED'
                  ? (ev.details as any)?.diff as Record<string, { from: unknown; to: unknown }> | undefined
                  : undefined;
                const denialReason = ev.action === 'ACCESS_DENIED'
                  ? (ev.details as any)?.reason as string | undefined
                  : undefined;
                const denialPerms  = ev.action === 'ACCESS_DENIED'
                  ? ((ev.details as any)?.permissions as string[] | undefined)
                  : undefined;

                return (
                  <div
                    key={ev.id}
                    className={`flex gap-3 px-4 py-3 transition-colors
                      ${idx < filtered.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/60' : ''}
                      ${isOwnChange ? 'bg-[var(--pro-azure-50)]/40 dark:bg-[var(--pro-azure-50)]0/5' : ''}`}
                  >
                    {/* dot */}
                    <div className="relative z-10 mt-0.5 shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${meta.dot}`} />
                    </div>
                    {/* content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                        {ev.userName && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            by{' '}
                            <span className={`font-semibold ${isOwnChange ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-slate-700 dark:text-slate-300'}`}>
                              {ev.userName}{isOwnChange ? ' (you)' : ''}
                            </span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                          {fmtDateTime(new Date(ev.createdAt))}
                        </span>
                      </div>

                      {/* policy diff */}
                      {diff && Object.keys(diff).length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {Object.entries(diff).map(([field, { from, to }]) => (
                            <div key={field} className="text-[10px] text-slate-600 dark:text-slate-400">
                              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{field}</span>
                              {': '}
                              <span className="line-through text-rose-400">{JSON.stringify(from)}</span>
                              {' → '}
                              <span className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{JSON.stringify(to)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* denial detail */}
                      {denialReason && (
                        <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 break-words">{denialReason}</p>
                      )}
                      {denialPerms && denialPerms.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {denialPerms.map(p => (
                            <span key={p} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AllCompaniesPanel — super-admin: policy health across all tenants
// ---------------------------------------------------------------------------
type AllSortKey = 'name' | 'score' | 'denials';

function AllCompaniesPanel() {
  const { role } = useRbac();
  const isSuperAdmin = role === 'SPURADMIN' || role === 'SUPERADMIN';
  const [open,    setOpen]    = useState(false);
  const [sortKey, setSortKey] = useState<AllSortKey>('score');
  const [sortAsc, setSortAsc] = useState(true);

  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['security-policy-all'],
    queryFn: async () => {
      const res = await api.get('/settings/security-policy/all');
      return (res.data?.data ?? []) as Array<{
        companyId: string;
        companyName: string;
        score: number;
        scoreLabel: 'Strong' | 'Moderate' | 'Weak';
        denialCount: number;
        policy: Record<string, unknown> | null;
        createdAt: string;
      }>;
    },
    enabled: open && isSuperAdmin,
    staleTime: 60_000,
  });

  if (!isSuperAdmin) return null;

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'name')    diff = a.companyName.localeCompare(b.companyName);
      if (sortKey === 'score')   diff = a.score - b.score;
      if (sortKey === 'denials') diff = a.denialCount - b.denialCount;
      return sortAsc ? diff : -diff;
    });
  }, [data, sortKey, sortAsc]);

  const toggleSort = (key: AllSortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }: { k: AllSortKey }) =>
    sortKey === k
      ? (sortAsc ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)
      : <SortAsc className="w-3 h-3 opacity-30" />;

  const scoreColor = (s: number) =>
    s >= 70 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : s >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
  const scoreBar = (s: number) =>
    s >= 70 ? 'bg-[var(--pro-azure-50)]0' : s >= 40 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="ovds-widget-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">All Companies</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold">SUPER-ADMIN</span>
          {data.length > 0 && (
            <span className="text-[10px] text-slate-400">{data.length} tenants</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <button onClick={e => { e.stopPropagation(); refetch(); }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded" aria-label="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          )}
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No companies found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-4 py-2 font-semibold text-slate-500 dark:text-slate-400">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                        Company <SortIcon k="name" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-500 dark:text-slate-400">
                      <button onClick={() => toggleSort('score')} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                        Strength <SortIcon k="score" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">Controls</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-500 dark:text-slate-400">
                      <button onClick={() => toggleSort('denials')} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                        Denials <SortIcon k="denials" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(c => (
                    <tr key={c.companyId} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate block max-w-[160px]" title={c.companyName}>
                          {c.companyName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${scoreBar(c.score)}`} style={{ width: `${c.score}%` }} />
                          </div>
                          <span className={`font-bold tabular-nums ${scoreColor(c.score)}`}>{c.score}</span>
                          <span className={`text-[10px] font-medium ${scoreColor(c.score)}`}>{c.scoreLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <div className="flex gap-1">
                          {[
                            { flag: Array.isArray(c.policy?.['ipWhitelist']) && (c.policy!['ipWhitelist'] as string[]).length > 0, title: 'IP Whitelist', short: 'IP' },
                            { flag: !!c.policy?.['allowedHours'],  title: 'Time Window',  short: 'TW' },
                            { flag: !!c.policy?.['mfaRequired'],   title: 'MFA',          short: 'MFA' },
                          ].map(({ flag, title, short }) => (
                            <span key={short} title={title}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded
                                ${flag
                                  ? 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 line-through opacity-50'}`}>
                              {short}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {c.denialCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3 h-3" />{c.denialCount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RoleHierarchyPanel — live role tree with ABAC enforcement status per role
// ---------------------------------------------------------------------------

type HierarchyRole = {
  role: string;
  label: string;
  description: string;
  weight: number;
  group: string;
  permissionCount: number;
  sensitiveCount: number;
  parentRole: string | null;
  childRoles: string[];
  isSuperBypass: boolean;
  isDevBypass: boolean;
  abac: { exempt: boolean; ipCheck: boolean; timeCheck: boolean; mfaCheck: boolean; crossTenantExempt: boolean };
  permissions?: string[];
};

type HierarchyData = {
  roles: HierarchyRole[];
  groups: Record<string, { label: string; roles: string[]; avgScore: number }>;
  policy: { ipActive: boolean; timeActive: boolean; mfaActive: boolean; extraPerms: string[] };
};

const GROUP_CONFIG: Record<string, { label: string; color: string }> = {
  system:      { label: 'System & Security',  color: 'text-rose-500'   },
  operations:  { label: 'Operations & HR',    color: 'text-slate-500'  },
  finance:     { label: 'Finance & Treasury', color: 'text-[var(--pro-azure)]' },
  sales:       { label: 'Sales',              color: 'text-sky-500'    },
  purchases:   { label: 'Purchases',          color: 'text-amber-500'  },
  audit:       { label: 'Audit & Compliance', color: 'text-amber-600'  },
  crm:         { label: 'CRM & External',     color: 'text-rose-400'   },
  operational: { label: 'Operational',        color: 'text-lime-600'   },
  other:       { label: 'Other',              color: 'text-slate-400'  },
};

const WEIGHT_COLOR = (w: number) =>
  w >= 150 ? 'text-rose-500'   :
  w >= 80  ? 'text-amber-500'  :
  w >= 40  ? 'text-[var(--pro-azure)]':
             'text-slate-400';

const WEIGHT_BAR = (w: number) =>
  w >= 150 ? 'bg-rose-500'    :
  w >= 80  ? 'bg-amber-500'   :
  w >= 40  ? 'bg-[var(--pro-azure-50)]0' :
             'bg-slate-400';

function AbacBadge({ active, label, color }: { active: boolean; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-colors
      ${active
        ? `${color} border-current bg-current/10`
        : 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 bg-transparent'}`}>
      {active ? <Check className="w-2 h-2" /> : <span className="w-2 h-2 inline-block rounded-full border border-current opacity-40" />}
      {label}
    </span>
  );
}

function RoleHierarchyPanel({ companyId }: { companyId?: string }) {
  const [open,        setOpen]        = useState(false);
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set());
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [showPerms,   setShowPerms]   = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['rbac-hierarchy', companyId],
    queryFn: async () => {
      const res = await api.get('/settings/rbac/hierarchy', {
        params: { ...(companyId ? { companyId } : {}) },
      });
      return res.data?.data as HierarchyData | null;
    },
    enabled: open,
    staleTime: 60_000,
  });

  const toggleExpand = (role: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });

  const allGroups = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.roles.map(r => r.group)));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return filterGroup === 'all' ? data.roles : data.roles.filter(r => r.group === filterGroup);
  }, [data, filterGroup]);

  const maxWeight = 200;

  return (
    <div className="ovds-widget-card overflow-hidden">
      {/* header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--pro-azure)]" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Role Hierarchy</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure-dark)] dark:text-green-300 text-[10px] font-bold">
            {data ? `${data.roles.length} roles` : 'LOADER'}
          </span>
          {data && (data.policy.ipActive || data.policy.timeActive || data.policy.mfaActive) && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
              ABAC active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <button onClick={e => { e.stopPropagation(); refetch(); }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded" aria-label="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          )}
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {/* policy status bar */}
          {data && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active ABAC:</span>
              <AbacBadge active={data.policy.ipActive}   label="IP Whitelist" color="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
              <AbacBadge active={data.policy.timeActive} label="Time Window"  color="text-amber-600 dark:text-amber-400"   />
              <AbacBadge active={data.policy.mfaActive}  label="MFA Required" color="text-violet-600 dark:text-violet-400" />
              {!data.policy.ipActive && !data.policy.timeActive && !data.policy.mfaActive && (
                <span className="text-[10px] text-slate-400 italic">No ABAC restrictions configured — all roles unrestricted.</span>
              )}
            </div>
          )}

          {/* group filter tabs */}
          {data && (
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <button onClick={() => setFilterGroup('all')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors
                  ${filterGroup === 'all' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                All {data.roles.length}
              </button>
              {allGroups.map(g => (
                <button key={g} onClick={() => setFilterGroup(g)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors
                    ${filterGroup === g ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  {GROUP_CONFIG[g]?.label ?? g}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
            </div>
          ) : !data ? (
            <div className="p-8 text-center text-xs text-slate-400">Failed to load hierarchy.</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No roles in this group.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map(node => {
                const isExpandedNode = expanded.has(node.role);
                const groupCfg       = GROUP_CONFIG[node.group] ?? GROUP_CONFIG.other;
                const meta           = ROLE_METADATA[node.role as AppRole];
                const dotCls         = meta?.color?.dot ?? 'bg-slate-400';
                const anyAbac        = node.abac.ipCheck || node.abac.timeCheck || node.abac.mfaCheck;
                const barPct         = Math.round((node.weight / maxWeight) * 100);

                return (
                  <div key={node.role}>
                    {/* row */}
                    <div
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(node.role)}
                    >
                      {/* expand chevron */}
                      <span className="shrink-0 w-4 text-slate-400">
                        {node.childRoles.length > 0
                          ? (isExpandedNode ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)
                          : <span className="w-3.5 h-3.5 inline-block" />}
                      </span>

                      {/* role dot */}
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />

                      {/* name + description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{node.label}</span>
                          <span className={`text-[9px] font-mono font-bold ${groupCfg.color} opacity-70`}>{node.role}</span>
                          {node.isSuperBypass && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">BYPASS</span>
                          )}
                          {node.isDevBypass && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">DEV</span>
                          )}
                          {anyAbac && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">ABAC</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{node.description}</p>
                      </div>

                      {/* weight bar */}
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-1.5 rounded-full ${WEIGHT_BAR(node.weight)}`} style={{ width: `${barPct}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold tabular-nums w-8 text-right ${WEIGHT_COLOR(node.weight)}`}>{node.weight}</span>
                      </div>

                      {/* perm count */}
                      <span className="text-[10px] text-slate-400 shrink-0 w-12 text-right tabular-nums">
                        {node.permissionCount}p
                      </span>
                    </div>

                    {/* expanded detail */}
                    {isExpandedNode && (
                      <div className="px-10 py-3 bg-slate-50/60 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        {/* ABAC enforcement per layer */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Security policy enforcement</p>
                          <div className="flex flex-wrap gap-2">
                            {node.isSuperBypass ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold">
                                ⚡ Bypasses ALL ABAC checks (super-admin)
                              </span>
                            ) : (
                              <>
                                <AbacBadge active={node.abac.ipCheck}   label="IP check"   color="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                                <AbacBadge active={node.abac.timeCheck} label="Time check" color="text-amber-600 dark:text-amber-400"   />
                                <AbacBadge active={node.abac.mfaCheck}  label="MFA check"  color="text-violet-600 dark:text-violet-400" />
                                {node.abac.crossTenantExempt && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold">
                                    cross-tenant exempt
                                  </span>
                                )}
                                {!node.abac.ipCheck && !node.abac.timeCheck && !node.abac.mfaCheck && (
                                  <span className="text-[10px] text-slate-400 italic">
                                    {node.sensitiveCount === 0
                                      ? 'No sensitive permissions — ABAC checks never triggered.'
                                      : 'Has sensitive perms but no active policy restrictions.'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* parent / children */}
                        <div className="flex flex-wrap gap-4">
                          {node.parentRole && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Reports to</p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                {ROLE_METADATA[node.parentRole as AppRole]?.label ?? node.parentRole}
                              </span>
                            </div>
                          )}
                          {node.childRoles.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Direct subordinates</p>
                              <div className="flex flex-wrap gap-1">
                                {node.childRoles.map(cr => (
                                  <span key={cr} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                    {ROLE_METADATA[cr as AppRole]?.label ?? cr}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* sensitive perm count + toggle */}
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{node.sensitiveCount}</span> sensitive /{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{node.permissionCount}</span> total permissions
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); setShowPerms(showPerms === node.role ? null : node.role); }}
                            className="text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline font-medium"
                          >
                            {showPerms === node.role ? 'Hide permissions ▲' : 'Show permissions ▼'}
                          </button>
                        </div>

                        {/* permission list */}
                        {showPerms === node.role && (
                          <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
                            {node.isSuperBypass ? (
                              <span className="text-[10px] text-slate-400 italic">All permissions (super-admin bypass).</span>
                            ) : (
                              (data?.roles.find(r => r.role === node.role)?.permissions ?? []).map((p: string) => (
                                <span key={p}
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border
                                    ${DEFAULT_SENSITIVE_PERMS.includes(p)
                                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
                                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                  {p}
                                </span>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PolicyRoleCheckPanel — full ABAC decision chain for any (role, permissions) pair
// ---------------------------------------------------------------------------

const ALL_ROLE_OPTIONS: Array<{ value: string; label: string }> = Object.entries(ROLE_METADATA)
  .map(([role, meta]) => ({ value: role, label: `${meta.label} (${role})` }))
  .sort((a, b) => {
    const wa = (ROLE_HIERARCHY as Record<string, number>)[a.value] ?? 0;
    const wb = (ROLE_HIERARCHY as Record<string, number>)[b.value] ?? 0;
    return wb - wa;
  });

const CHECK_PRESETS = [
  { label: 'Fund transfer (OVDS)',       role: 'OVDS',         perms: 'fund_transfers:approve' },
  { label: 'Payroll approve (HR)',       role: 'HR',           perms: 'payroll:approve'        },
  { label: 'Role write (ADMIN)',         role: 'ADMIN',        perms: 'role_permissions:write' },
  { label: 'System deploy (DEVELOPER)', role: 'DEVELOPER',    perms: 'system:deploy'          },
  { label: 'VAT file (FINANCE)',         role: 'FINANCE',      perms: 'vat:file'               },
  { label: 'Invoice read (EMPLOYEE)',    role: 'EMPLOYEE',     perms: 'invoices:read'          },
  { label: 'Audit certify (EXTERNAL)',   role: 'EXTERNAL_AUDITOR', perms: 'external_audit:certify' },
];

type LayerResult = { layer: string; result: 'pass' | 'fail' | 'bypass' | 'skipped'; reason: string };
type CheckData = { role: string; allowed: boolean; layers: LayerResult[]; policy: object | null };

const LAYER_META: Record<string, { icon: React.ReactNode; label: string }> = {
  'super-bypass':        { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Super-user bypass' },
  'cross-tenant':        { icon: <Building2   className="w-3.5 h-3.5" />, label: 'Cross-tenant isolation' },
  'sensitive-perm-gate': { icon: <Lock        className="w-3.5 h-3.5" />, label: 'Sensitive permission gate' },
  'ip-whitelist':        { icon: <Shield      className="w-3.5 h-3.5" />, label: 'IP whitelist' },
  'time-window':         { icon: <Clock       className="w-3.5 h-3.5" />, label: 'Time window' },
  'mfa':                 { icon: <Fingerprint className="w-3.5 h-3.5" />, label: 'MFA requirement' },
  'ownership':           { icon: <User        className="w-3.5 h-3.5" />, label: 'Data ownership' },
};

function PolicyRoleCheckPanel({ companyId }: { companyId?: string }) {
  const [open,       setOpen]       = useState(false);
  const [role,       setRole]       = useState('ADMIN');
  const [permsRaw,   setPermsRaw]   = useState('role_permissions:write');
  const [ip,         setIp]         = useState('');
  const [timeStr,    setTimeStr]    = useState('');
  const [mfaOn,      setMfaOn]      = useState(false);
  const [ownerId,    setOwnerId]    = useState('');
  const [requestorId,setRequestorId]= useState('');
  const [result,     setResult]     = useState<CheckData | null>(null);
  const [running,    setRunning]    = useState(false);

  // Auto-fill "now" when panel opens
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setTimeStr(`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
    }
    prevOpen.current = open;
  }, [open]);

  const applyPreset = (p: typeof CHECK_PRESETS[0]) => {
    setRole(p.role);
    setPermsRaw(p.perms);
    setResult(null);
  };

  const runCheck = async () => {
    setRunning(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        role,
        permissions: permsRaw.split(',').map(s => s.trim()).filter(Boolean),
        mfaVerified: mfaOn,
        mfaEnrolled: mfaOn,
        ...(companyId  ? { companyId }     : {}),
        ...(ip.trim()  ? { ipAddress: ip.trim() } : {}),
        ...(timeStr    ? { requestTime: new Date(timeStr).toISOString() } : {}),
        ...(ownerId    ? { resourceOwnerId: ownerId.trim() }    : {}),
        ...(requestorId? { requestorUserId: requestorId.trim() }: {}),
      };
      const res = await api.post('/settings/security-policy/check-role', body);
      setResult(res.data?.data ?? null);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? e?.message ?? 'Check failed'));
    } finally { setRunning(false); }
  };

  const resultIcon = (r: LayerResult['result']) => {
    if (r === 'pass')   return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--pro-azure)] shrink-0" />;
    if (r === 'fail')   return <XSquare      className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    if (r === 'bypass') return <ShieldCheck  className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    return <span className="w-3.5 h-3.5 shrink-0 inline-block rounded-full border border-slate-400 opacity-30" />;
  };

  const resultBadge = (r: LayerResult['result']) => {
    const base = 'text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1.5';
    if (r === 'pass')   return `${base} bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]`;
    if (r === 'fail')   return `${base} bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400`;
    if (r === 'bypass') return `${base} bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400`;
    return `${base} bg-slate-100 dark:bg-slate-700 text-slate-500`;
  };

  return (
    <div className="ovds-widget-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Role Access Check</span>
          <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold">LIVE</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Run a complete ABAC enforcement decision chain for any role and permission — see exactly which layers pass, fail, are bypassed, or are skipped.
          </p>

          {/* Quick presets */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Quick presets</p>
            <div className="flex flex-wrap gap-1.5">
              {CHECK_PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors
                    ${role === p.role && permsRaw === p.perms
                      ? 'bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-rose-300'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role + permissions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</label>
              <select value={role} onChange={e => { setRole(e.target.value); setResult(null); }}
                className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-rose-500 text-slate-700 dark:text-slate-300">
                {ALL_ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Permissions (comma-separated)</label>
              <input type="text" value={permsRaw} onChange={e => { setPermsRaw(e.target.value); setResult(null); }}
                placeholder="fund_transfers:approve"
                className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-rose-500 font-mono text-slate-700 dark:text-slate-300" />
            </div>
          </div>

          {/* Context: IP, time, MFA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source IP</label>
              <input type="text" value={ip} onChange={e => setIp(e.target.value)}
                placeholder="blank = 127.0.0.1"
                className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-rose-500 font-mono text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Request Time</label>
              <input type="datetime-local" value={timeStr} onChange={e => setTimeStr(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-rose-500 text-slate-700 dark:text-slate-300" />
            </div>
          </div>

          {/* Ownership context (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resource owner ID <span className="font-normal opacity-60">(optional)</span></label>
              <input type="text" value={ownerId} onChange={e => setOwnerId(e.target.value)}
                placeholder="user UUID of resource owner"
                className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-rose-500 font-mono text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requestor user ID <span className="font-normal opacity-60">(optional)</span></label>
              <input type="text" value={requestorId} onChange={e => setRequestorId(e.target.value)}
                placeholder="user UUID making the request"
                className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-rose-500 font-mono text-slate-700 dark:text-slate-300" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Toggle checked={mfaOn} onChange={setMfaOn} colorClass="bg-violet-500" />
              <span className={`text-xs font-medium ${mfaOn ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`}>MFA verified</span>
            </div>
            <button onClick={runCheck} disabled={running || !role || !permsRaw.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors">
              {running ? <><RefreshCw className="w-3 h-3 animate-spin" />Checking…</> : <><Play className="w-3 h-3" />Check Access</>}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-4 space-y-3 ${
              result.allowed
                ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/30'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
            }`}>
              {/* verdict */}
              <div className="flex items-center gap-2">
                {result.allowed
                  ? <CheckCircle2 className="w-4 h-4 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                  : <XSquare      className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                <span className={`text-sm font-bold ${result.allowed ? 'text-[var(--pro-azure-dark)] dark:text-green-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {result.allowed ? `${result.role} — Access GRANTED` : `${result.role} — Access DENIED`}
                </span>
              </div>

              {/* layer breakdown */}
              <div className="space-y-2">
                {result.layers.map((layer, i) => {
                  const meta = LAYER_META[layer.layer] ?? { icon: <Info className="w-3.5 h-3.5" />, label: layer.layer };
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className={`mt-0.5 shrink-0
                        ${layer.result === 'pass'   ? 'text-[var(--pro-azure)]'
                        : layer.result === 'fail'   ? 'text-rose-500'
                        : layer.result === 'bypass' ? 'text-blue-500'
                        :                             'text-slate-400'}`}>
                        {resultIcon(layer.result)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-1">
                          <span className="text-slate-500 dark:text-slate-400 shrink-0">{meta.icon}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{meta.label}</span>
                          <span className={resultBadge(layer.result)}>{layer.result.toUpperCase()}</span>
                        </div>
                        <p className="mt-0.5 text-slate-500 dark:text-slate-400 break-words">{layer.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function PermissionsCrudView() {
  const companyId = useCompanyId();
  const qc        = useQueryClient();
  const { can }   = useRbac();
  const canWrite  = can('role_permissions:write') || can('settings:write');

  const { data: perms, isLoading, isError } = useQuery({
    queryKey: ['permissions', companyId],
    queryFn: async () => {
      const res = await api.get('/settings/rbac/permissions', {
        params: { ...(companyId ? { companyId } : {}) },
      });
      return (res.data?.data ?? res.data ?? []) as DbPermission[];
    },
    placeholderData: [],
  });

  const mutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: string; id?: string; data?: any }) => {
      if (action === 'create')
        return api.post('/settings/rbac/permissions', data).then(r => r.data?.data ?? r.data);
      if (action === 'update')
        return api.patch(`/settings/rbac/permissions/${id}`, data).then(r => r.data?.data ?? r.data);
      if (action === 'toggle')
        return api.patch(`/settings/rbac/permissions/${data.permissionId}/toggle`, { isActive: data.isActive }).then(r => r.data?.data ?? r.data);
      if (action === 'delete')
        return api.delete(`/settings/rbac/permissions/${id}`).then(r => r.data?.data ?? r.data);
      if (action === 'seed')
        return api.post('/settings/rbac/permissions/seed', { companyId: data?.companyId }).then(r => r.data?.data ?? r.data);
      return Promise.resolve();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions', companyId] }); },
  });

  const [editing, setEditing] = useState<DbPermission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'other', isActive: true });

  const handleCreate = async () => {
    try {
      await mutation.mutateAsync({ action: 'create', data: form });
      toast.success('Permission created');
      setIsModalOpen(false);
      setForm({ name: '', description: '', category: 'other', isActive: true });
    } catch (e: any) { toast.error(e?.message ?? 'Failed to create permission'); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await mutation.mutateAsync({ action: 'update', id: editing.id, data: form });
      toast.success('Permission updated');
      setIsModalOpen(false);
      setEditing(null);
    } catch (e: any) { toast.error(e?.message ?? 'Failed to update permission'); }
  };

  const handleToggle = async (perm: DbPermission) => {
    try {
      await mutation.mutateAsync({ action: 'toggle', data: { permissionId: perm.id, isActive: !perm.isActive } });
      toast.success(`Permission ${!perm.isActive ? 'enabled' : 'disabled'}`);
    } catch (e: any) { toast.error(e?.message ?? 'Failed to toggle permission'); }
  };

  const handleDelete = async (perm: DbPermission) => {
    if (!confirm(`Delete permission "${perm.name}"? This cannot be undone.`)) return;
    try {
      await mutation.mutateAsync({ action: 'delete', id: perm.id });
      toast.success('Permission deleted');
    } catch (e: any) { toast.error(e?.message ?? 'Failed to delete permission'); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: 'system', isActive: true });
    setIsModalOpen(true);
  };

  const openEdit = (perm: DbPermission) => {
    setEditing({ ...perm });
    setForm({ name: perm.name, description: perm.description ?? '', category: perm.category ?? 'other', isActive: perm.isActive });
    setIsModalOpen(true);
  };

  const grouped = useMemo(() => {
    if (!perms) return {};
    const groups: Record<string, DbPermission[]> = {};
    for (const p of perms) {
      const cat = p.category ?? 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [perms]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search permissions…"
              className="pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--pro-azure)]"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{perms?.length ?? 0} permissions</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutation.mutateAsync({ action: 'seed', data: { companyId } })
              .then(() => qc.invalidateQueries({ queryKey: ['permissions', companyId] }))
              .then(() => toast.success('Seeded default permissions'))
              .catch((e: any) => toast.error(e?.message ?? 'Seed failed'))}
            disabled={!canWrite || mutation.isPending}
            className="ovds-btn-secondary flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className="w-3 h-3" /> Seed Defaults
          </button>
          <button
            onClick={openCreate}
            disabled={!canWrite}
            className="ovds-btn-primary flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3 h-3" /> Add Permission
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-slate-500">Failed to load permissions.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, categoryPerms]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {categoryPerms.map(perm => (
                  <div
                    key={perm.id}
                    className={`p-4 rounded-xl border transition-all group ${perm.isActive
                      ? 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{perm.name}</code>
                          {perm.category && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">{perm.category}</span>
                          )}
                        </div>
                        {perm.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{perm.description}</p>
                        )}
                      </div>

                      <div className={`p-1 rounded ${perm.isActive ? 'bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)]' : 'bg-slate-300 text-slate-500'}`}>
                        {perm.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <button
                        onClick={() => handleToggle(perm)}
                        disabled={!canWrite}
                        className={`text-xs px-2 py-1 rounded transition-colors ${perm.isActive
                          ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:bg-amber-500/10'
                          : 'text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] hover:bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10'}`}
                      >
                        {perm.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(perm)}
                          disabled={!canWrite}
                          className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(perm)}
                          disabled={!canWrite}
                          className="p-1 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-12">
              <Lock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No permissions defined yet.</p>
              <button
                onClick={() => mutation.mutateAsync({ action: 'seed', data: { companyId } })
                  .then(() => qc.invalidateQueries({ queryKey: ['permissions', companyId] }))
                  .then(() => toast.success('Seeded default permissions'))
                  .catch((e: any) => toast.error(e?.message ?? 'Seed failed'))}
                className="mt-2 text-xs text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] font-medium"
              >
                Seed default permissions →
              </button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{editing ? 'Edit' : 'Create'} Permission</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. invoices:approve"
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--pro-azure)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this permission allow?"
                  rows={3}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--pro-azure)] resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--pro-azure)]"
                >
                  {PERMISSION_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { setIsModalOpen(false); setEditing(null); }}
                className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editing ? handleUpdate : handleCreate}
                disabled={mutation.isPending || !form.name}
                className="flex-1 px-3 py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                {mutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomRolesCrudView() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  const { can } = useRbac();
  const canWrite = can('role_permissions:write') || can('settings:write');

  const { data: roles, isLoading, isError } = useQuery({
    queryKey: ['custom-roles', companyId],
    queryFn: async () => {
      const res = await api.get('/settings/rbac/roles', {
        params: { ...(companyId ? { companyId } : {}) },
      });
      return (res.data?.data ?? res.data ?? []) as DbRole[];
    },
    placeholderData: [],
  });

  const { data: allPerms } = useQuery({
    queryKey: ['permissions', companyId, 'all'],
    queryFn: async () => {
      const res = await api.get('/settings/rbac/permissions', {
        params: { ...(companyId ? { companyId } : {}) },
      });
      return (res.data?.data ?? res.data ?? []) as DbPermission[];
    },
    placeholderData: [],
  });

  const mutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: string; id?: string; data?: any }) => {
      if (action === 'create')
        return api.post('/settings/rbac/roles', data).then(r => r.data?.data ?? r.data);
      if (action === 'update')
        return api.patch(`/settings/rbac/roles/${id}`, data).then(r => r.data?.data ?? r.data);
      if (action === 'toggle')
        return api.patch(`/settings/rbac/roles/${data.roleId}/toggle`, { isActive: data.isActive }).then(r => r.data?.data ?? r.data);
      if (action === 'delete')
        return api.delete(`/settings/rbac/roles/${id}`).then(r => r.data?.data ?? r.data);
      if (action === 'assign')
        return api.put(`/settings/rbac/roles/${id}/permissions`, { permissionIds: data }).then(r => r.data?.data ?? r.data);
      if (action === 'seed')
        return api.post('/settings/rbac/roles/seed', { companyId: data?.companyId }).then(r => r.data?.data ?? r.data);
      return Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-roles', companyId] });
      qc.invalidateQueries({ queryKey: ['permissions', companyId, 'all'] });
    },
  });

  const [editing, setEditing] = useState<DbRole | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isActive: true, apiAccess: false });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [permSearch, setPermSearch] = useState('');

  const activeRoles = useMemo(() => (roles ?? []).filter(r => r.isActive), [roles]);
  const inactiveRoles = useMemo(() => (roles ?? []).filter(r => !r.isActive), [roles]);

  const handleCreate = async () => {
    try {
      await mutation.mutateAsync({ action: 'create', data: form });
      toast.success('Role created');
      setIsModalOpen(false);
      setForm({ name: '', description: '', isActive: true, apiAccess: false });
      if (selectedPerms.size > 0) {
        const roleId = (roles ?? []).find(r => r.name === form.name)?.id;
        if (roleId) await mutation.mutateAsync({ action: 'assign', id: roleId, data: Array.from(selectedPerms) });
      }
      setSelectedPerms(new Set());
    } catch (e: any) { toast.error(e?.message ?? 'Failed to create role'); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await mutation.mutateAsync({ action: 'update', id: editing.id, data: form });
      if (selectedPerms.size > 0) {
        await mutation.mutateAsync({ action: 'assign', id: editing.id, data: Array.from(selectedPerms) });
      }
      toast.success('Role updated');
      setIsModalOpen(false);
      setEditing(null);
      setSelectedPerms(new Set());
    } catch (e: any) { toast.error(e?.message ?? 'Failed to update role'); }
  };

  const handleToggle = async (role: DbRole) => {
    try {
      await mutation.mutateAsync({ action: 'toggle', data: { roleId: role.id, isActive: !role.isActive } });
      toast.success(`Role ${!role.isActive ? 'enabled' : 'disabled'}`);
    } catch (e: any) { toast.error(e?.message ?? 'Failed to toggle role'); }
  };

  const handleDelete = async (role: DbRole) => {
    if (role.isSystem) { toast.error('System roles cannot be deleted'); return; }
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await mutation.mutateAsync({ action: 'delete', id: role.id });
      toast.success('Role deleted');
    } catch (e: any) { toast.error(e?.message ?? 'Failed to delete role'); }
  };

  const handleClone = async (role: DbRole) => {
    try {
      const cloned = await mutation.mutateAsync({
        action: 'create',
        data: {
          name: `${role.name} (Copy)`,
          description: role.description ?? '',
          isActive: true,
          apiAccess: role.apiAccess,
          companyId: role.companyId ?? undefined,
        },
      });
      const newRoleId = cloned?.id ?? (roles ?? []).find(r => r.name === `${role.name} (Copy)`)?.id;
      if (newRoleId && role.permissions?.length) {
        await mutation.mutateAsync({
          action: 'assign',
          id: newRoleId,
          data: role.permissions.map(p => p.id),
        });
      }
      toast.success('Role cloned');
    } catch (e: any) { toast.error(e?.message ?? 'Failed to clone role'); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', isActive: true, apiAccess: false });
    setSelectedPerms(new Set());
    setPermSearch('');
    setIsModalOpen(true);
  };

  const openEdit = (role: DbRole) => {
    setEditing({ ...role });
    setForm({ name: role.name, description: role.description ?? '', isActive: role.isActive, apiAccess: role.apiAccess });
    setSelectedPerms(new Set(role.permissions?.map(p => p.id) ?? []));
    setPermSearch('');
    setIsModalOpen(true);
  };

  const togglePermSelection = (permId: string) => {
    const next = new Set(selectedPerms);
    if (next.has(permId)) next.delete(permId);
    else next.add(permId);
    setSelectedPerms(next);
  };

  const renderRoleCard = (role: DbRole) => {
    const permNames = role.permissions?.map(p => p.name) ?? [];
    return (
      <div
        key={role.id}
        className={`p-4 rounded-xl border transition-all group ${role.isActive
          ? 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
          : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'}`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{role.name}</span>
              {role.isSystem && (
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] rounded uppercase">
                  SYSTEM
                </span>
              )}
              {!role.isActive && (
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded">
                  DISABLED
                </span>
              )}
              {role.apiAccess && (
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded">
                  API
                </span>
              )}
            </div>
            {role.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{role.description}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">{role.customUsersCount ?? 0} users assigned</p>
          </div>

          <div className={`p-1 rounded ${role.isActive ? 'bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)]' : 'bg-slate-300 text-slate-500'}`}>
            {role.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </div>
        </div>

        {permNames.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {permNames.slice(0, 6).map(name => (
                <span key={name} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded">
                  {name}
                </span>
              ))}
              {permNames.length > 6 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded">
                  +{permNames.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
        {permNames.length === 0 && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">No permissions assigned</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {permNames.length} of {allPerms?.length ?? 0} permissions
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleToggle(role)}
              disabled={!canWrite || role.isSystem}
              className={`text-xs px-2 py-1 rounded transition-colors ${role.isActive
                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:bg-amber-500/10'
                : 'text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] hover:bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10'}`}
              title={role.isSystem ? 'Cannot toggle system role' : ''}
            >
              {role.isActive ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={() => openEdit(role)}
              disabled={!canWrite}
              className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleClone(role)}
              disabled={!canWrite}
              className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded"
              title="Clone role"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(role)}
              disabled={!canWrite || role.isSystem}
              className={`p-1 rounded ${role.isSystem ? 'opacity-30 cursor-not-allowed' : 'text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400'}`}
              title={role.isSystem ? 'Cannot delete system role' : 'Delete'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Custom Database Roles</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create and manage company-specific roles with granular permission assignments.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutation.mutateAsync({ action: 'seed', data: { companyId } })
              .then(() => qc.invalidateQueries({ queryKey: ['custom-roles', companyId] }))
              .then(() => toast.success('Seeded default roles'))
              .catch((e: any) => toast.error(e?.message ?? 'Seed failed'))}
            disabled={!canWrite || mutation.isPending}
            className="ovds-btn-secondary flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className="w-3 h-3" /> Seed Defaults
          </button>
          <button
            onClick={openCreate}
            disabled={!canWrite}
            className="ovds-btn-primary flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3 h-3" /> Add Role
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-slate-500">Failed to load roles.</div>
      ) : (
        <>
          {activeRoles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Active Roles ({activeRoles.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeRoles.map(renderRoleCard)}
              </div>
            </div>
          )}
          {inactiveRoles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-slate-400">Disabled Roles ({inactiveRoles.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {inactiveRoles.map(renderRoleCard)}
              </div>
            </div>
          )}
          {roles?.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No custom roles defined yet.</p>
              <button
                onClick={() => mutation.mutateAsync({ action: 'seed', data: { companyId } })
                  .then(() => qc.invalidateQueries({ queryKey: ['custom-roles', companyId] }))
                  .then(() => toast.success('Seeded default roles'))
                  .catch((e: any) => toast.error(e?.message ?? 'Seed failed'))}
                className="mt-2 text-xs text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] font-medium"
              >
                Seed default roles →
              </button>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && (setIsModalOpen(false), setEditing(null))}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl mx-4 p-6" onClick={e => e.stopPropagation()}>
             <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{editing ? 'Edit' : 'Create'} Role</h3>
             <div className="space-y-3">
               <div>
                 <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role Template</label>
                 <div className="mt-1 flex flex-wrap gap-2">
                   {ROLE_TEMPLATES.map(t => (
                     <button
                       key={t.role}
                       type="button"
                       onClick={() => {
                         const tpl = applyTemplate(t.role);
                         setSelectedPerms(tpl);
                         if (!editing) {
                           setForm(f => ({
                             ...f,
                             name: t.label,
                             description: ROLE_METADATA[t.role]?.description ?? f.description,
                           }));
                         }
                         toast.success(`Applied ${t.label} template`);
                       }}
                       className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] transition-all"
                     >
                       {t.label}
                     </button>
                   ))}
                 </div>
               </div>
               <div>
                 <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Finance Manager"
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--pro-azure)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What can this role do?"
                  rows={2}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--pro-azure)] resize-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.apiAccess}
                    onChange={e => setForm({ ...form, apiAccess: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--pro-azure)]/20 dark:peer-focus:ring-[var(--pro-azure-light)]/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--pro-azure)]"></div>
                </label>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">API Access</span>
                <span className="text-[10px] text-slate-400">Allow programmatic token / basic auth</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Permissions ({selectedPerms.size} selected)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPerms(new Set(allPerms?.map(p => p.id) ?? []))}
                    className="text-[10px] text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] font-medium"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPerms(new Set())}
                    className="text-[10px] text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
                <div className="mt-1 relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={permSearch}
                    onChange={e => setPermSearch(e.target.value)}
                    placeholder="Filter permissions…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--pro-azure)]"
                  />
                </div>
                {allPerms && allPerms.length > 0 ? (
                  <div className="mt-1.5 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1">
                    {allPerms.filter(p => p.name.toLowerCase().includes(permSearch.toLowerCase()) || (p.category ?? '').toLowerCase().includes(permSearch.toLowerCase())).map(perm => {
                      const isSelected = selectedPerms.has(perm.id);
                      const isDisabled = selectedPerms.size >= 0 ? false : !isSelected;
                      return (
                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled || !perm.isActive}
                            onChange={() => togglePermSelection(perm.id)}
                            className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-[var(--pro-azure)]"
                          />
                          <code className="text-xs font-mono text-slate-600 dark:text-slate-300">{perm.name}</code>
                          {perm.category && (
                            <span className="text-[9px] px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">{perm.category}</span>
                          )}
                          {!perm.isActive && <span className="text-[8px] text-rose-500 font-bold">INACTIVE PERM</span>}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">No permissions available. Seed permissions first.</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { setIsModalOpen(false); setEditing(null); setSelectedPerms(new Set()); }}
                className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editing ? handleUpdate : handleCreate}
                disabled={mutation.isPending || !form.name}
                className="flex-1 px-3 py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                {mutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

export default function RolePermissions() {
  usePageTitle('Role Permissions');
  const { t: t } = useTranslation();
  const { role: currentUserRole } = useRbac();
  const companyId = useCompanyId();
  const [activeTab, setActiveTab] = useState<ViewMode>('by-role');
  const [showLookup, setShowLookup] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copied, setCopied] = useState(false);

  // -- Dynamic RBAC data (SoD rules, audit events, critical permissions) ---
  const { sodRules, sodRemediation, auditEvents, criticalPermissions } = useRbacStaticData(companyId);

  const activeTabConfig = TABS.find(t => t.id === activeTab)!;

  // -- Keyboard shortcuts --------------------------------------------------
  useEffect(() => {
    const TAB_KEYS: ViewMode[] = [
      'by-role','matrix','diff','groups','coverage',
      'routes','ifrs','OVDS','risk','sod','simulate','audit','policy','smart-rules','app-access','overrides','custom-roles','permissions','security-policy',
    ];
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') { setShowLookup(false); setShowShortcuts(false); return; }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShowLookup(true); return; }
      if (e.key === '?') { setShowShortcuts(v => !v); return; }
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < TAB_KEYS.length) setActiveTab(TAB_KEYS[idx]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // -- Quick stats ---------------------------------------------------------
  const totalRoles = ALL_ROLES.length;
  const totalPerms = useMemo(() => Object.values(ROLE_PERMISSIONS).reduce((acc, perms) => {
    perms.forEach(p => acc.add(p));
    return acc;
  }, new Set<Permission>()).size, []);

  const sodConflicts = useMemo(() => sodRules.filter(rule =>
    ALL_ROLES.some(role => rbac.can(role, rule.perm1) && rbac.can(role, rule.perm2))
  ).length, [sodRules]);

  const highRiskRoles = useMemo(() =>
    ALL_ROLES.filter(r => calcRiskScore(r) >= 61).length, []);

  // -- Overall compliance score (0-100, higher = better) ------------------
  const complianceScore = useMemo(() => {
    const sodPenalty = sodConflicts * 8;
    const highRiskPenalty = highRiskRoles * 4;
    const score = Math.max(0, 100 - sodPenalty - highRiskPenalty);
    return score;
  }, [sodConflicts, highRiskRoles]);

  const complianceColor = complianceScore >= 80 ? 'text-[var(--pro-azure-light)]' : complianceScore >= 50 ? 'text-amber-400' : 'text-rose-400';
  const _complianceBorder = complianceScore >= 80 ? 'bg-[var(--pro-azure-50)]0/5 border-[var(--pro-azure)]/20' : complianceScore >= 50 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20';

  const handleCopyStats = useCallback(() => {
    const lines = [
      `RBAC System Summary — ${new Date().toLocaleDateString()}`,
      `Roles: ${totalRoles}`,
      `Unique Permissions: ${totalPerms}`,
      `SoD Conflicts: ${sodConflicts}`,
      `High-Risk Roles: ${highRiskRoles}`,
      `Compliance Score: ${complianceScore}/100`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [totalRoles, totalPerms, sodConflicts, highRiskRoles, complianceScore]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* -- Page Header ----------------------------------------------- */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-5 shadow-sm">
          {/* Subtle left accent stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--pro-azure-50)]0 rounded-l-2xl" />

          <div className="relative pl-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2.5 bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 rounded-xl border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/20 shrink-0">
                <Shield className="w-6 h-6 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">Role & Permissions</h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure-dark)] dark:text-green-300 border border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/30 uppercase tracking-wider shrink-0">RBAC v2</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Deny-by-default · explicit grant model · {totalRoles} roles · {totalPerms} unique permissions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Current user role */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">You:</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${ROLE_METADATA[currentUserRole]?.color?.badge ?? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}>
                  {ROLE_METADATA[currentUserRole]?.label ?? currentUserRole}
                </span>
              </div>

              {/* Search lookup */}
              <button
                onClick={() => setShowLookup(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                Permission Lookup
                <kbd className="ml-0.5 text-[9px] font-mono bg-white/20 px-1 py-0.5 rounded">/</kbd>
              </button>

              {/* Keyboard shortcuts */}
              <button
                onClick={() => setShowShortcuts(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <kbd className="text-[9px] font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">?</kbd>
              </button>

              {/* Copy stats */}
              <button
                onClick={handleCopyStats}
                title="Copy system summary"
                className="p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-[var(--pro-azure)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* -- Stats bar ------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Roles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm hover:border-[var(--pro-azure-light)] dark:hover:border-[var(--pro-azure)]/40 transition-colors group">
            <div className="p-2 bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 rounded-lg group-hover:bg-[var(--pro-azure-100)] dark:group-hover:bg-[var(--pro-azure-dark)]/20 transition-colors">
              <Users className="w-4 h-4 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none tabular-nums">{totalRoles}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Roles defined</div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm hover:border-[var(--pro-azure-light)] dark:hover:border-[var(--pro-azure)]/40 transition-colors group">
            <div className="p-2 bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 rounded-lg group-hover:bg-[var(--pro-azure-100)] dark:group-hover:bg-[var(--pro-azure-dark)]/20 transition-colors">
              <Lock className="w-4 h-4 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none tabular-nums">{totalPerms}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Unique permissions</div>
            </div>
          </div>

          {/* SoD Conflicts */}
          <button
            onClick={() => setActiveTab('sod')}
            className={`rounded-xl px-4 py-3.5 flex items-center gap-3 border shadow-sm transition-all text-left hover:scale-[1.01] active:scale-100 ${
              sodConflicts > 0
                ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-500/50'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[var(--pro-azure-light)] dark:hover:border-[var(--pro-azure)]/40'
            }`}
          >
            <div className={`p-2 rounded-lg ${sodConflicts > 0 ? 'bg-rose-100 dark:bg-rose-500/10' : 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10'}`}>
              <Scale className={`w-4 h-4 ${sodConflicts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}`} />
            </div>
            <div>
              <div className={`text-xl font-bold leading-none tabular-nums ${sodConflicts > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-slate-100'}`}>{sodConflicts}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">SoD conflicts</div>
            </div>
          </button>

          {/* High-Risk Roles */}
          <button
            onClick={() => setActiveTab('risk')}
            className={`rounded-xl px-4 py-3.5 flex items-center gap-3 border shadow-sm transition-all text-left hover:scale-[1.01] active:scale-100 ${
              highRiskRoles > 0
                ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[var(--pro-azure-light)] dark:hover:border-[var(--pro-azure)]/40'
            }`}
          >
            <div className={`p-2 rounded-lg ${highRiskRoles > 0 ? 'bg-amber-100 dark:bg-amber-500/10' : 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10'}`}>
              <Gauge className={`w-4 h-4 ${highRiskRoles > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}`} />
            </div>
            <div>
              <div className={`text-xl font-bold leading-none tabular-nums ${highRiskRoles > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'}`}>{highRiskRoles}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">High-risk roles</div>
            </div>
          </button>

          {/* Compliance Score */}
          <div className={`rounded-xl px-4 py-3.5 flex items-center gap-3 border shadow-sm transition-colors ${
            complianceScore >= 80
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              : complianceScore >= 50
              ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30'
              : 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/30'
          }`}>
            {/* Mini circular progress */}
            <div className="relative w-10 h-10 shrink-0">
              <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700" />
                <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3"
                  strokeDasharray={`${(complianceScore / 100) * 88} 88`}
                  strokeLinecap="round"
                  className={complianceScore >= 80 ? 'text-[var(--pro-azure)]' : complianceScore >= 50 ? 'text-amber-500' : 'text-rose-500'}
                  stroke="currentColor"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[9px] font-bold ${complianceColor}`}>{complianceScore}</span>
              </div>
            </div>
            <div>
              <div className={`text-xl font-bold leading-none tabular-nums ${complianceColor}`}>
                {complianceScore}<span className="text-xs font-normal text-slate-400 dark:text-slate-500">/100</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {complianceScore >= 80 ? 'Compliant' : complianceScore >= 50 ? 'Needs review' : 'At risk'}
              </div>
            </div>
          </div>
        </div>

        {/* -- Tab container ---------------------------------------------- */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80" style={{ scrollbarWidth: 'none' }}>
            {TABS.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-[var(--pro-azure)] text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={`transition-colors ${activeTab === tab.id ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300'}`}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
                {/* Keyboard shortcut hint */}
                <span className={`absolute -top-0 right-1 text-[9px] font-mono transition-opacity opacity-0 group-hover:opacity-100 ${activeTab === tab.id ? 'text-[var(--pro-azure-light)]/60 opacity-100' : 'text-slate-400 dark:text-slate-600'}`}>
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Description strip */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{activeTabConfig.description}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono hidden sm:flex items-center gap-1">
              <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-slate-500 dark:text-slate-400">/</kbd> lookup
              <span className="mx-1">·</span>
              <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-slate-500 dark:text-slate-400">?</kbd> shortcuts
            </span>
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === 'by-role'   && <ByRoleView />}
            {activeTab === 'matrix'    && <MatrixView />}
            {activeTab === 'diff'      && <DiffView />}
            {activeTab === 'groups'    && <GroupView />}
            {activeTab === 'coverage'  && <CoverageView />}
            {activeTab === 'routes'    && <RoutesView />}
            {activeTab === 'ifrs'      && <IFRSView />}
            {activeTab === 'OVDS' && <OvdsView />}
            {activeTab === 'risk'      && <RiskView complianceScore={complianceScore} criticalPermissions={criticalPermissions} sodRules={sodRules} />}
            {activeTab === 'sod'       && <SodView sodRules={sodRules} sodRemediation={sodRemediation} />}
            {activeTab === 'simulate'  && <SimulateView />}
            {activeTab === 'audit'     && <AuditView auditEvents={auditEvents} />}
            {activeTab === 'policy'    && <PolicyView />}
            {activeTab === 'smart-rules' && <SmartRulesView />}
            {activeTab === 'app-access' && <AppAccessView />}
            {activeTab === 'overrides' && <OverridesView />}
            {activeTab === 'custom-roles' && <CustomRolesCrudView />}
            {activeTab === 'permissions'  && <PermissionsCrudView />}
            {activeTab === 'security-policy' && <SecurityPolicyPanel />}
          </div>
        </div>{/* end tab container */}

        {/* -- Footer ---------------------------------------------------- */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-600 pt-1 pb-2 border-t border-slate-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[var(--pro-azure)]/70" />
            RBAC Engine v2 — deny-by-default · explicit grant model
          </span>
          <span className="hidden sm:block">SPURADMIN &amp; SUPERADMIN bypass all permission checks</span>
        </div>
      </div>

      {/* -- Modals -------------------------------------------------------- */}
      {showLookup && <PermissionLookupModal onClose={() => setShowLookup(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
