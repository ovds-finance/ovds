/**
 * RoleBadge — reusable role chip driven entirely by ROLE_METADATA.
 *
 * Usage:
 *   <RoleBadge role="OVDS" />
 *   <RoleBadge role="AUDITOR" size="lg" showIcon showCount />
 *   <RoleBadge role="HR" variant="dot" />
 */
import {
  ShieldAlert, Code2, Settings2, Kanban, Users, User,
  TrendingUp, BookOpen, ClipboardCheck, ShieldCheck,
  Building2, Truck, Scale, Landmark, Search,
} from 'lucide-react';
import React from 'react';

import { ROLE_METADATA, type AppRole } from '../rbac/rbac';

// -- Icon map ------------------------------------------------------------------

const ICONS: Partial<Record<AppRole, React.ReactNode>> = {
  SPURADMIN:       <ShieldAlert size={11} />,
  SUPERADMIN:      <ShieldAlert size={11} />,
  DEVELOPER:       <Code2 size={11} />,
  ADMIN:           <Settings2 size={11} />,
  PROJECT_MANAGER: <Kanban size={11} />,
  HR:              <Users size={11} />,
  EMPLOYEE:        <User size={11} />,
  OVDS:         <TrendingUp size={11} />,
  ACCOUNTING:      <BookOpen size={11} />,
  AUDITOR:         <ClipboardCheck size={11} />,
  IFRS_OFFICER:    <Scale size={11} />,
  BANK_LIAISON:    <Landmark size={11} />,
  EXTERNAL_AUDITOR:<Search size={11} />,
  CRM:             <ShieldCheck size={11} />,
  CLIENT:          <Building2 size={11} />,
  PARTNER:         <Truck size={11} />,
  DATA_CLERK:      <ClipboardCheck size={11} />,
};

// -- Props ---------------------------------------------------------------------

interface RoleBadgeProps {
  role: AppRole;
  /** 'badge' = full pill (default) | 'dot' = colored dot + label | 'minimal' = label only */
  variant?: 'badge' | 'dot' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  /** Show permission count next to label */
  showCount?: boolean;
  /** Show role description tooltip on hover */
  showTooltip?: boolean;
  className?: string;
}

const SIZE_CLS = {
  sm:  'text-[9px] px-1.5 py-0.5 gap-1',
  md:  'text-[10px] px-2.5 py-1 gap-1.5',
  lg:  'text-xs px-3 py-1.5 gap-2',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  variant = 'badge',
  size = 'md',
  showIcon = true,
  showCount = false,
  showTooltip = false,
  className = '',
}) => {
  const meta = ROLE_METADATA[role];
  if (!meta) return null;

  if (variant === 'dot') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${SIZE_CLS[size]} ${className}`}
        title={showTooltip ? meta.description : undefined}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${meta.color.dot}`} />
        <span className="font-bold text-slate-700 dark:text-slate-300">{meta.label}</span>
      </span>
    );
  }

  if (variant === 'minimal') {
    return (
      <span
        className={`font-bold text-slate-700 dark:text-slate-300 ${SIZE_CLS[size]} ${className}`}
        title={showTooltip ? meta.description : undefined}
      >
        {meta.label}
      </span>
    );
  }

  // Default: badge pill
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider border rounded-full ${SIZE_CLS[size]} ${meta.color.badge} ${className}`}
      title={showTooltip ? meta.description : undefined}
    >
      {showIcon && ICONS[role]}
      {meta.label}
      {showCount && (
        <span className="opacity-60 font-mono">
          {/* count injected by parent if needed */}
        </span>
      )}
    </span>
  );
};

export default RoleBadge;

