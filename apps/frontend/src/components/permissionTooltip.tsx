/**
 * PermissionTooltip — wraps any element and shows a "why denied" tooltip
 * when the user lacks the required permission.
 *
 * Usage:
 *   <PermissionTooltip permission="payroll:approve">
 *     <button disabled>Approve</button>
 *   </PermissionTooltip>
 *
 *   <PermissionTooltip anyOf={['vat:file', 'vat:write']} atLeast="ovds">
 *     <FileVatButton />
 *   </PermissionTooltip>
 *
 *   // Render prop — receive allowed + reason
 *   <PermissionTooltip permission="invoices:delete">
 *     {({ allowed, reason }) => (
 *       <button disabled={!allowed} title={reason ?? undefined}>Delete</button>
 *     )}
 *   </PermissionTooltip>
 */
import React, { useState, useRef } from 'react';
import { ShieldOff, Lock } from 'lucide-react';
import { usePermissionGuard, type PermissionGuardOptions } from '../hooks/usePermissionGuard';
import type { Permission } from '../rbac/rbac';

interface PermissionTooltipProps extends Omit<PermissionGuardOptions, 'anyPermission' | 'allPermissions'> {
  anyOf?: Permission[];
  allOf?: Permission[];
  /** Render prop — receives { allowed, reason } */
  children:
    | React.ReactNode
    | ((state: { allowed: boolean; reason: string | null }) => React.ReactNode);
  /** Where to anchor the tooltip */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Don't show tooltip when allowed — default true */
  onlyWhenDenied?: boolean;
  /** Custom denied message override */
  deniedMessage?: string;
  className?: string;
}

export const PermissionTooltip: React.FC<PermissionTooltipProps> = ({
  permission,
  anyOf,
  allOf,
  role,
  atLeast,
  requireCompany,
  requireMfa,
  requireSubsidiary,
  requireBusinessType,
  skip,
  children,
  placement = 'top',
  onlyWhenDenied = true,
  deniedMessage,
  className = '',
}) => {
  const { allowed, reason } = usePermissionGuard({
    permission,
    anyPermission: anyOf,
    allPermissions: allOf,
    role,
    atLeast,
    requireCompany,
    requireMfa,
    requireSubsidiary,
    requireBusinessType,
    skip,
  });

  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const showTooltip = !allowed || !onlyWhenDenied;
  const message = deniedMessage ?? reason;

  const placementCls = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[placement];

  // Render prop pattern
  if (typeof children === 'function') {
    return <>{(children as (s: { allowed: boolean; reason: string | null }) => React.ReactNode)({ allowed, reason })}</>;
  }

  return (
    <div
      ref={ref}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => showTooltip && setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => showTooltip && setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      {visible && message && (
        <div
          role="tooltip"
          className={`absolute z-[200] ${placementCls} w-max max-w-[220px] pointer-events-none`}
        >
          <div className="flex items-start gap-2 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl shadow-xl border border-slate-700 leading-snug">
            {allowed
              ? <Lock size={11} className="text-slate-400 shrink-0 mt-0.5" />
              : <ShieldOff size={11} className="text-rose-400 shrink-0 mt-0.5" />
            }
            <span>{message}</span>
          </div>
          {/* Arrow */}
          <div className={`absolute ${
            placement === 'top'    ? 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent border-[5px]' :
            placement === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-800 border-l-transparent border-r-transparent border-t-transparent border-[5px]' :
            placement === 'left'   ? 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800 border-t-transparent border-b-transparent border-r-transparent border-[5px]' :
                                     'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800 border-t-transparent border-b-transparent border-l-transparent border-[5px]'
          }`} />
        </div>
      )}
    </div>
  );
};

export default PermissionTooltip;

