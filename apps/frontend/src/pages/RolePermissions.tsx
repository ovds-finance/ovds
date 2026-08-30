import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "../hooks/usePageTitle";
import { useRbac } from "../hooks/useRbac";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, AlertTriangle, ArrowRight, BarChart3, BookOpen,
  Check, CheckCircle2, ChevronDown,
  ChevronRight, FileText, Info, Kanban,
  Lock, Route, Search, Shield,
  ShieldCheck, Star, TrendingUp,
  User, Users, X, Zap, BarChart2, Grid3x3,
  GitCompare, Activity, Layers, AlertOctagon, Fingerprint,
  Scale, Gauge, Play,
  CheckSquare, XSquare, HelpCircle, Crosshair, FlaskConical,
  Download, Copy, CheckCheck, Keyboard, History, Bell,
  Lightbulb, Package, RefreshCw,
  Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save,
} from "lucide-react";
import {
  rbac, ROLE_METADATA, ROLE_HIERARCHY, ROLE_GROUPS,
  ROUTE_PERMISSIONS, RESOURCE_DOMAINS_FLAT, PERMISSION_GROUPS, SENSITIVE_ROUTES,
  type AppRole, type Permission,
} from "../rbac";
import { orpc } from "../lib/orpc";
import api from "../services/api";
import toast from "react-hot-toast";

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
  | 'custom-roles' | 'permissions';

const ALL_ROLES = Object.keys(ROLE_HIERARCHY) as AppRole[];

const CRITICAL_PERMISSIONS: Permission[] = [
  'fund_transfers:approve', 'payroll:approve', 'users:delete',
  'vat:file', 'companies:delete', 'role_permissions:write',
  'system:deploy', 'banking:kyc:approve', 'banking:aml:flag',
  'payroll:admin', 'ovds:delete', 'audit_logs:write',
  'banking:loan_application:submit', 'external_audit:certify',
  'period_close:write', 'ifrs10:consolidation:approve',
];

function calcRiskScore(role: AppRole): number {
  if (role === 'SPURADMIN' || role === 'SUPERADMIN') return 100;
  const perms = new Set(rbac.permissionsFor(role));
  const criticalHits = CRITICAL_PERMISSIONS.filter(p => perms.has(p)).length;
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
  return 'text-emerald-400';
}

function riskBg(score: number): string {
  if (score >= 61) return 'bg-rose-500/10 border-rose-500/30';
  if (score >= 31) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-emerald-500/10 border-slate-200';
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
  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20';
}

function isSensitivePerm(perm: Permission): boolean {
  return CRITICAL_PERMISSIONS.includes(perm);
}

interface SodRule {
  id: string;
  name: string;
  risk: 'critical' | 'high' | 'medium';
  perm1: Permission;
  perm2: Permission;
  description: string;
}

const SOD_RULES: SodRule[] = [
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

const SOD_REMEDIATION: Record<string, string[]> = {
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

const AUDIT_EVENTS: AuditEvent[] = [
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
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-slate-200">
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
            className="w-full text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-400"
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
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
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
                          <span className={`text-[9px] font-bold ml-1 shrink-0 ${d.hasAdmin ? 'text-rose-500' : d.hasWrite ? 'text-amber-500' : 'text-emerald-500'}`}>{d.pct}%</span>
                        </div>
                        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${d.hasAdmin ? 'bg-rose-500' : d.hasWrite ? 'bg-amber-500' : 'bg-emerald-500'}`}
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
                  {copied ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
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
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500"
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
                        <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${coveragePct}%` }} />
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
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block" /> Read</span>
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
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300';
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
            className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-emerald-500"
          />
          <Star className="w-3 h-3 text-yellow-400" />
          Sensitive permissions only
        </label>
        <div className="flex items-center gap-3 ml-auto text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500/20 inline-block" /> Admin</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/15 inline-block" /> Write</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/10 inline-block" /> Read</span>
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
          { label: `Added in ${ROLE_METADATA[targetRole].label}`, count: added.length, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
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
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-400">Added in {ROLE_METADATA[targetRole].label}</h3>
            <span className="ml-auto text-xs text-emerald-500">{added.length}</span>
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
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          Role Hierarchy Ladder — click any row to inspect
        </h3>
        <div className="space-y-1.5">
          {ladder.map(role => {
            const meta = ROLE_METADATA[role];
            const weight = ROLE_HIERARCHY[role];
            const pct = Math.round((weight / maxWeight) * 100);
            const score = calcRiskScore(role);
            const barColor = weight >= 150 ? 'bg-rose-500' : weight >= 80 ? 'bg-teal-500' : weight >= 50 ? 'bg-emerald-500' : weight >= 25 ? 'bg-amber-500' : 'bg-slate-500';
            const isOpen = expandedRole === role;
            return (
              <React.Fragment key={role}>
                <button
                  onClick={() => setExpandedRole(isOpen ? null : role)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${
                    isOpen ? 'bg-emerald-100 border border-slate-200' : 'hover:bg-slate-100 dark:hover:bg-slate-700/40 border border-transparent'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.color.dot}`} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-36 text-left truncate">{meta.label}</span>
                  <div className="flex-1 h-2 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 w-8 text-right shrink-0">{weight}</span>
                  <RiskBadge score={score} />
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90 text-emerald-400' : 'group-hover:text-slate-500'}`} />
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
                          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Read ({readD.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {readD.slice(0,8).map(d => <span key={d} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/15 text-[10px] capitalize">{d.replace(/_/g,' ')}</span>)}
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
                        ? 'bg-emerald-100 border border-slate-200'
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
        <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
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
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${sortMode === s.key ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}>
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
                        className={`h-1.5 rounded-full ${c.coveragePct >= 80 ? 'bg-emerald-500' : c.coveragePct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
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
                    <td key={role} className={`text-center py-1.5 ${rbac.can(role, perm) ? 'text-emerald-400' : 'text-slate-700'}`}>
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
      <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-5 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Role & Access Guide</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          The enterprise authorization framework follows a strict <span className="text-emerald-600 dark:text-emerald-400 font-semibold">deny-by-default</span> principle. 
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
                ? 'bg-white dark:bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
                : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-200 hover:bg-slate-100/40 dark:bg-slate-800/40'
            }`}>
              <button
                onClick={() => setExpandedRole(isExpanded ? null : role)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isExpanded ? 'bg-emerald-500/20 border-slate-200' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:border-slate-200'
                }`}>
                  <User className={`w-5 h-5 ${isExpanded ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
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
                    <div className="text-xs font-mono text-emerald-400">{rbac.permissionsFor(role).length}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">Hierarchy</div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300">{ROLE_HIERARCHY[role]}</div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400/50" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-6 animate-fade-in">
                  <div className="h-px bg-gradient-to-r from-emerald-500/30 to-transparent mb-4" />
                  
                  <div className="ovds-grid-layout cols-4">
                    {domainSummary.filter(d => d.level !== 'none').map(d => (
                      <div key={d.domain} className="bg-slate-100/40 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{d.domain}</span>
                          <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            d.level === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                            d.level === 'write' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {d.level.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${d.pct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{d.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
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
      <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
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
            <Kanban className="w-4 h-4 text-emerald-400" />
            Active Smart Constraints
          </h3>
          <div className="space-y-4">
            {Object.entries(rbac.rules ?? {}).map(([perm]) => (
              <div key={perm} className="group bg-slate-100/30 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-4 hover:border-slate-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-300">{perm}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase">Active</span>
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
              <Activity className="w-4 h-4 text-emerald-400" />
              Runtime Evaluation
            </h3>
            <div className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed">
              <div className="text-slate-500 mb-2">// Example Smart Check</div>
              <div className="flex gap-2">
                <span className="text-emerald-400">const</span>
                <span className="text-slate-700 dark:text-slate-200">canApprove</span>
                <span className="text-emerald-400">=</span>
                <span className="text-slate-700 dark:text-slate-200">rbac.can(</span>
              </div>
              <div className="pl-4">
                <span className="text-amber-300">'ACCOUNTING'</span>,
                <br />
                <span className="text-amber-300">'payroll:approve'</span>,
                <br />
                {"{"} <span className="text-emerald-600 dark:text-emerald-300">amount:</span> <span className="text-orange-300">750000</span> {"}"}
              </div>
              <div className="text-slate-700 dark:text-slate-200">);</div>
              <div className="mt-2 text-slate-500 flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                <span>Result: <span className="text-rose-400">false</span> (Exceeds limit)</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Compliance Impact
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">Fraud Prevention:</span> Limits risk of unauthorized large disbursements by junior staff.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">Audit Accuracy:</span> Ensures historical data cannot be modified after finalization.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
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

function RiskView({ complianceScore }: { complianceScore: number }) {
  const roleScores = useMemo(() =>
    ALL_ROLES.map(role => ({ role, score: calcRiskScore(role) }))
      .sort((a, b) => b.score - a.score)
  , []);

  const maxScore = useMemo(() => Math.max(...roleScores.map(r => r.score)), [roleScores]);

  const criticalPermsData = useMemo(() =>
    CRITICAL_PERMISSIONS.map(perm => ({
      perm,
      roles: rbac.rolesWithPermission(perm),
    })).sort((a, b) => a.roles.length - b.roles.length)
  , []);

  const privilegeCreep = useMemo(() => {
    return ALL_ROLES.filter(role => {
      const permCount = rbac.permissionsFor(role).length;
      const hierarchyWeight = ROLE_HIERARCHY[role];
      const expectedMax = hierarchyWeight * 2.5;
      return permCount > expectedMax && role !== 'SPURADMIN' && role !== 'SUPERADMIN';
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Compliance score banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 ${
        complianceScore >= 80 ? 'bg-emerald-500/5 border-emerald-500/20' :
        complianceScore >= 50 ? 'bg-amber-500/5 border-amber-500/20' :
        'bg-rose-500/5 border-rose-500/20'
      }`}>
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-700" />
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="2.5"
              strokeDasharray={`${complianceScore} ${100 - complianceScore}`}
              strokeLinecap="round"
              className={complianceScore >= 80 ? 'text-emerald-400' : complianceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}
              stroke="currentColor"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${complianceScore >= 80 ? 'text-emerald-400' : complianceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {complianceScore}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Overall Compliance Score</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
              complianceScore >= 80 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-slate-200' :
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
            <span>SoD penalty: <span className="text-rose-400 font-mono">−{SOD_RULES.filter(r => ALL_ROLES.some(role => rbac.can(role, r.perm1) && rbac.can(role, r.perm2))).length * 8}</span></span>
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
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
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
            <BarChart2 className="w-4 h-4 text-emerald-400" />
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
                    className={`h-4 rounded-full transition-all ${score >= 61 ? 'bg-rose-500/70' : score >= 31 ? 'bg-amber-500/70' : 'bg-emerald-500/70'}`}
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
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-4">
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
          <BarChart3 className="w-4 h-4 text-emerald-400" />
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
                    : hasRead  ? 'bg-emerald-500/30 hover:bg-emerald-600/50'
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

function SodView() {
  const results = useMemo(() => {
    return SOD_RULES.map(rule => {
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
        <div className={`rounded-xl border p-4 text-center ${totalConflicts > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
          <div className={`text-2xl font-bold ${totalConflicts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
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
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{affectedRoles.size}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Affected Roles</div>
        </div>
      </div>

      {/* SoD Rules Table */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80 flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" />
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
            const remediation = SOD_REMEDIATION[rule.id] ?? [];
            return (
              <div key={rule.id} className={`p-4 ${!rule.pass ? 'bg-rose-950/10' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-0.5">
                    {rule.pass ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
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
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${rule.pass ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-slate-200' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
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
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 mb-3 flex items-center gap-2">
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
            <User className="w-4 h-4 text-emerald-400" />
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
                          d.level === 'read' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' :
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
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
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
            <Crosshair className="w-4 h-4 text-emerald-400" />
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
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              Test Scenario
            </button>
          </div>
          {scenarioResult && (
            <div className={`rounded-lg p-3 text-xs ${scenarioResult.allowed ? 'bg-emerald-500/10 border border-slate-200 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
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

function AuditView() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const filtered = useMemo(() => {
    let events = AUDIT_EVENTS;
    if (search) events = events.filter(e => e.permission.toLowerCase().includes(search.toLowerCase()) || e.event.toLowerCase().includes(search.toLowerCase()));
    if (severityFilter !== 'all') events = events.filter(e => e.severity === severityFilter);
    return events.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [search, severityFilter]);

  const stats = useMemo(() => ({
    critical: AUDIT_EVENTS.filter(e => e.severity === 'critical').length,
    high: AUDIT_EVENTS.filter(e => e.severity === 'high').length,
    medium: AUDIT_EVENTS.filter(e => e.severity === 'medium').length,
    low: AUDIT_EVENTS.filter(e => e.severity === 'low').length,
  }), []);

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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
        <span className="ovds-caption">{filtered.length} events</span>
      </div>

      {/* Audit events table */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/80 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
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
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 mb-1">Audit Log Retention Policy</h4>
            <p className="ovds-body">
              All audit events are automatically logged with immutable timestamps. Retention periods are based on Ethiopian regulatory requirements (Commercial Code 2021, VAT Proclamation 1341/2024, Income Tax 979/2016, NBE Directives) and international standards (ISO 27001, IFRS, FATF). Critical events (payroll approval, fund transfers, VAT filing, KYC approval, AML flags) are retained for 10 years minimum.
            </p>
          </div>
        </div>
      </div>
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
                    className="text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 px-2 py-1 rounded transition-colors">
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
                    <span className="ml-auto text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
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
    if (level === 'read')  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20';
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
            <Download className="w-4 h-4 text-emerald-400" />
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
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${exportFormat === f ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}>
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
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
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
                      {diff > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">▲ {compareB.split('_')[0]}</span>}
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
            Routes in <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">SENSITIVE_ROUTES</code> require MFA step-up. Shows which roles can access each and the required permission.
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
                    <span className={`text-xs font-bold ${accessibleRoles.length <= 3 ? 'text-emerald-400' : accessibleRoles.length <= 7 ? 'text-amber-400' : 'text-rose-400'}`}>
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
            <Keyboard className="w-4 h-4 text-emerald-500" />
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
                  <kbd className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.5 rounded">{s.key}</kbd>
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
  { id: 'simulate',  label: 'Simulate',  icon: <FlaskConical className="w-3.5 h-3.5" />,  description: 'Role simulation explorer', badge: 'NEW', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  { id: 'audit',     label: 'Audit',     icon: <History className="w-3.5 h-3.5" />,       description: 'Audit intelligence — events, regulations, retention', badge: 'NEW', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  { id: 'policy',    label: 'Policy',    icon: <FileText className="w-3.5 h-3.5" />,      description: 'Policy export, deep role comparison, sensitive route analysis', badge: 'NEW', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  { id: 'smart-rules', label: 'Smart Rules', icon: <Zap className="w-3.5 h-3.5" />,      description: 'Context-aware RBAC: amount limits, status checks, and multi-tenant isolation', badge: 'SMART', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  { id: 'app-access', label: 'App Access', icon: <Package className="w-3.5 h-3.5" />,   description: 'App access control per role', badge: 'NEW', badgeColor: 'bg-violet-500/20 text-violet-300' },
  { id: 'custom-roles', label: 'Custom Roles', icon: <Users className="w-3.5 h-3.5" />,   description: 'CRUD for company-specific database-backed roles', badge: 'CRUD', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  { id: 'permissions',  label: 'Permissions',  icon: <Lock className="w-3.5 h-3.5" />,     description: 'CRUD for granular permissions and categories', badge: 'CRUD', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
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
    { value: 'READ', label: 'Read', color: 'bg-emerald-50 text-emerald-700' },
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
      <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 p-4">
        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2">
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
  companyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  permissions: DbPermission[];
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

function PermissionsCrudView() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  const { can } = useRbac();
  const canWrite = can('role_permissions:write') || can('settings:write');

  const { data: perms, isLoading, isError, refetch } = useQuery({
    queryKey: ['permissions', companyId],
    queryFn: () => orpc.settings.roles.permissions.list({ companyId, isActive: undefined }),
    placeholderData: [],
  });

  const mutation = useMutation({
    mutationFn: ({ action, id, data }: { action: string; id?: string; data?: any }) => {
      if (action === 'create') return orpc.settings.roles.permissions.create(data);
      if (action === 'update') return orpc.settings.roles.permissions.update({ id: id!, data });
      if (action === 'toggle') return orpc.settings.roles.permissions.toggle(data);
      if (action === 'delete') return orpc.settings.roles.permissions.remove({ id: id! });
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
              className="pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{perms?.length ?? 0} permissions</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutation.mutateAsync({ action: 'seed', data: { companyId } }).then(() => qc.invalidateQueries({ queryKey: ['permissions', companyId] })).then(() => toast.success('Seeded default permissions'))}
            disabled={!canWrite}
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

                      <div className={`p-1 rounded ${perm.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-300 text-slate-500'}`}>
                        {perm.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <button
                        onClick={() => handleToggle(perm)}
                        disabled={!canWrite}
                        className={`text-xs px-2 py-1 rounded transition-colors ${perm.isActive
                          ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:bg-amber-500/10'
                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10'}`}
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
                onClick={() => mutation.mutateAsync({ action: 'seed', data: { companyId } }).then(() => qc.invalidateQueries({ queryKey: ['permissions', companyId] })).then(() => toast.success('Seeded default permissions'))}
                className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this permission allow?"
                  rows={3}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
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
                className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
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
    queryFn: () => orpc.settings.roles.roles.list({ companyId }),
    placeholderData: [],
  });

  const { data: allPerms } = useQuery({
    queryKey: ['permissions', companyId, 'all'],
    queryFn: () => orpc.settings.roles.permissions.list({ companyId }),
    placeholderData: [],
  });

  const mutation = useMutation({
    mutationFn: ({ action, id, data }: { action: string; id?: string; data?: any }) => {
      if (action === 'create') return orpc.settings.roles.roles.create(data);
      if (action === 'update') return orpc.settings.roles.roles.update({ id: id!, data });
      if (action === 'toggle') return orpc.settings.roles.roles.toggle(data);
      if (action === 'delete') return orpc.settings.roles.roles.remove({ id: id! });
      if (action === 'assign') return orpc.settings.roles.roles.assignPermissions({ id: id!, permissionIds: data });
      return Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-roles', companyId] });
      qc.invalidateQueries({ queryKey: ['permissions', companyId, 'all'] });
    },
  });

  const [editing, setEditing] = useState<DbRole | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  const activeRoles = useMemo(() => (roles ?? []).filter(r => r.isActive), [roles]);
  const inactiveRoles = useMemo(() => (roles ?? []).filter(r => !r.isActive), [roles]);

  const handleCreate = async () => {
    try {
      await mutation.mutateAsync({ action: 'create', data: form });
      toast.success('Role created');
      setIsModalOpen(false);
      setForm({ name: '', description: '', isActive: true });
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

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', isActive: true });
    setSelectedPerms(new Set());
    setIsModalOpen(true);
  };

  const openEdit = (role: DbRole) => {
    setEditing({ ...role });
    setForm({ name: role.name, description: role.description ?? '', isActive: role.isActive });
    setSelectedPerms(new Set(role.permissions?.map(p => p.id) ?? []));
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
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded uppercase">
                  SYSTEM
                </span>
              )}
              {!role.isActive && (
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded">
                  DISABLED
                </span>
              )}
            </div>
            {role.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{role.description}</p>
            )}
          </div>

          <div className={`p-1 rounded ${role.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-300 text-slate-500'}`}>
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
                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10'}`}
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
            onClick={() => mutation.mutateAsync({ action: 'seed', data: { companyId } }).then(() => qc.invalidateQueries({ queryKey: ['custom-roles', companyId] })).then(() => toast.success('Seeded default roles'))}
            disabled={!canWrite}
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
                onClick={() => mutation.mutateAsync({ action: 'seed', data: { companyId } }).then(() => qc.invalidateQueries({ queryKey: ['custom-roles', companyId] })).then(() => toast.success('Seeded default roles'))}
                className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Finance Manager"
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What can this role do?"
                  rows={2}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Permissions ({selectedPerms.size} selected)
                </label>
                {allPerms && allPerms.length > 0 ? (
                  <div className="mt-1 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1">
                    {allPerms.map(perm => {
                      const isSelected = selectedPerms.has(perm.id);
                      const isDisabled = selectedPerms.size >= 0 ? false : !isSelected;
                      return (
                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled || !perm.isActive}
                            onChange={() => togglePermSelection(perm.id)}
                            className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-emerald-500"
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
                className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
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
  const { t: _t } = useTranslation();
  const { role: currentUserRole } = useRbac();
  const [activeTab, setActiveTab] = useState<ViewMode>('by-role');
  const [showLookup, setShowLookup] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeTabConfig = TABS.find(t => t.id === activeTab)!;

  // -- Keyboard shortcuts --------------------------------------------------
  useEffect(() => {
    const TAB_KEYS: ViewMode[] = [
      'by-role','matrix','diff','groups','coverage',
      'routes','ifrs','OVDS','risk','sod','simulate','audit','policy','smart-rules','app-access','custom-roles','permissions',
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

  const sodConflicts = useMemo(() => SOD_RULES.filter(rule =>
    ALL_ROLES.some(role => rbac.can(role, rule.perm1) && rbac.can(role, rule.perm2))
  ).length, []);

  const highRiskRoles = useMemo(() =>
    ALL_ROLES.filter(r => calcRiskScore(r) >= 61).length, []);

  // -- Overall compliance score (0-100, higher = better) ------------------
  const complianceScore = useMemo(() => {
    const sodPenalty = sodConflicts * 8;
    const highRiskPenalty = highRiskRoles * 4;
    const score = Math.max(0, 100 - sodPenalty - highRiskPenalty);
    return score;
  }, [sodConflicts, highRiskRoles]);

  const complianceColor = complianceScore >= 80 ? 'text-emerald-400' : complianceScore >= 50 ? 'text-amber-400' : 'text-rose-400';
  const _complianceBorder = complianceScore >= 80 ? 'bg-emerald-500/5 border-emerald-500/20' : complianceScore >= 50 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20';

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
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl" />

          <div className="relative pl-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">Role & Permissions</h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider shrink-0">RBAC v2</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
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
                className="p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* -- Stats bar ------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Roles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors group">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none tabular-nums">{totalRoles}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Roles defined</div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors group">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/40'
            }`}
          >
            <div className={`p-2 rounded-lg ${sodConflicts > 0 ? 'bg-rose-100 dark:bg-rose-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
              <Scale className={`w-4 h-4 ${sodConflicts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
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
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/40'
            }`}
          >
            <div className={`p-2 rounded-lg ${highRiskRoles > 0 ? 'bg-amber-100 dark:bg-amber-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
              <Gauge className={`w-4 h-4 ${highRiskRoles > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
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
                  className={complianceScore >= 80 ? 'text-emerald-500' : complianceScore >= 50 ? 'text-amber-500' : 'text-rose-500'}
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
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={`transition-colors ${activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300'}`}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
                {/* Keyboard shortcut hint */}
                <span className={`absolute -top-0 right-1 text-[9px] font-mono transition-opacity opacity-0 group-hover:opacity-100 ${activeTab === tab.id ? 'text-emerald-400/60 opacity-100' : 'text-slate-400 dark:text-slate-600'}`}>
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
            {activeTab === 'risk'      && <RiskView complianceScore={complianceScore} />}
            {activeTab === 'sod'       && <SodView />}
            {activeTab === 'simulate'  && <SimulateView />}
            {activeTab === 'audit'     && <AuditView />}
            {activeTab === 'policy'    && <PolicyView />}
            {activeTab === 'smart-rules' && <SmartRulesView />}
            {activeTab === 'app-access' && <AppAccessView />}
            {activeTab === 'custom-roles' && <CustomRolesCrudView />}
            {activeTab === 'permissions'  && <PermissionsCrudView />}
          </div>
        </div>{/* end tab container */}

        {/* -- Footer ---------------------------------------------------- */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-600 pt-1 pb-2 border-t border-slate-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-500/70" />
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
