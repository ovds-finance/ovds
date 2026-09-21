/**
 * RBACMatrix — Visual RBAC permission matrix showing all roles vs domains.
 * Used in RolePermissions page and Dashboard for compliance visibility.
 */
import { Role } from '@ovds/ui';
import { ChevronDown, ChevronUp, Shield, Eye, Edit, XCircle } from 'lucide-react';
import React, { useState } from 'react';

import { useBusiness } from '../context/businessContext';
import { rbac, ROLE_METADATA, type AppRole } from '../rbac/rbac';


const ROLES: AppRole[] = [
  Role.SPURADMIN, Role.DEVELOPER, Role.ADMIN, Role.PROJECT_MANAGER,
  Role.OVDS, Role.ACCOUNTING, Role.HR, Role.AUDITOR,
  Role.CRM, Role.PARTNER, Role.EMPLOYEE, Role.CLIENT,
];

const DOMAINS = [
  { key: 'employees', label: 'HR / Employees' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'OVDS', label: 'OVDS' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'vat', label: 'VAT / ERCA' },
  { key: 'disaster_fund', label: 'DRRF' },
  { key: 'reports', label: 'Reports' },
  { key: 'audit_logs', label: 'Audit Logs' },
  { key: 'users', label: 'Users' },
  { key: 'settings', label: 'Settings' },
  { key: 'crm', label: 'CRM' },
  { key: 'companies', label: 'Companies' },
];

const LEVEL_CONFIG = {
  admin: { label: 'Admin', color: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300', icon: <Shield size={10} /> },
  write: { label: 'Write', color: 'bg-[var(--pro-azure-100)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] dark:text-green-300', icon: <Edit size={10} /> },
  read:  { label: 'Read',  color: 'bg-[var(--pro-azure-100)] dark:bg-green-950/40 text-[var(--pro-azure-dark)] dark:text-green-300', icon: <Eye size={10} /> },
  none:  { label: '—',     color: 'bg-white dark:bg-slate-800/50 text-slate-300 dark:text-slate-600', icon: <XCircle size={10} /> },
};

interface RBACMatrixProps {
  compact?: boolean;
  filterRole?: AppRole;
}

const RBACMatrix: React.FC<RBACMatrixProps> = ({ compact = false, filterRole }) => {
  const { selectedBusinessType } = useBusiness();
  const businessType = selectedBusinessType || undefined;

  const [expanded, setExpanded] = useState(!compact);
  const [hoveredRole, setHoveredRole] = useState<AppRole | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  const displayRoles = filterRole ? [filterRole] : ROLES;

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-600 dark:text-slate-300"
      >
        <span className="flex items-center gap-2">
          <Shield size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          RBAC Permission Matrix ({ROLES.length} roles × {DOMAINS.length} domains)
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
    );
  }

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-xl flex items-center justify-center">
            <Shield size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">RBAC Permission Matrix</p>
            <p className="ovds-caption">{ROLES.length} roles · {DOMAINS.length} domains · deny-by-default</p>
          </div>
        </div>
        {compact && (
          <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronUp size={14} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-2 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-3 flex-wrap">
        {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => (
          <div key={level} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </div>
        ))}
        <span className="text-[9px] text-slate-400 ml-auto">Hover to highlight</span>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-400 uppercase tracking-wider w-32 sticky left-0 bg-white dark:bg-slate-900 z-10">
                Domain
              </th>
              {displayRoles.map(role => {
                const meta = ROLE_METADATA[role];
                return (
                  <th
                    key={role}
                    className={`px-2 py-2.5 font-semibold text-center cursor-pointer transition-colors ${
                      hoveredRole === role ? 'bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10' : ''
                    }`}
                    onMouseEnter={() => setHoveredRole(role)}
                    onMouseLeave={() => setHoveredRole(null)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-semibold ${meta?.color?.badge ?? 'bg-slate-100 text-slate-600'}`}>
                        {role.replace('_', ' ')}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {DOMAINS.map(domain => (
              <tr
                key={domain.key}
                className={`border-b border-slate-50 dark:border-slate-800/50 transition-colors ${
                  hoveredDomain === domain.key ? 'bg-white dark:bg-slate-800/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                }`}
                onMouseEnter={() => setHoveredDomain(domain.key)}
                onMouseLeave={() => setHoveredDomain(null)}
              >
                <td className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 whitespace-nowrap">
                  {domain.label}
                </td>
                {displayRoles.map(role => {
                  const level = rbac.accessLevel(role, domain.key, businessType);
                  const cfg = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG.none;
                  const isHighlighted = hoveredRole === role || hoveredDomain === domain.key;
                  return (
                    <td
                      key={role}
                      className={`px-2 py-2 text-center transition-all ${isHighlighted ? 'scale-105' : ''}`}
                    >
                      <span className={`inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold ${cfg.color} ${isHighlighted ? 'ring-1 ring-current/30' : ''}`}>
                        {cfg.icon}
                        <span className="hidden sm:inline">{cfg.label}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <p className="ovds-caption">
          SPURADMIN bypasses all policies · Deny-by-default · ABAC extensions available
        </p>
        <a
          href="/settings/roles"
          className="text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline flex items-center gap-1"
        >
          Full Role Permissions <ChevronDown size={9} className="rotate-[-90deg]" />
        </a>
      </div>
    </div>
  );
};

export default RBACMatrix;






