/**
 * SecuritySandbox — v5.0 Granular Security Sandbox Configuration Panel
 *
 * A security interface designed for granular, data-isolated token permissions
 * within the Ovds environment.
 *
 * Exports:
 *   SecuritySandbox        — full configuration panel
 *   SecurityPermissionRow  — individual permission row
 */

import React from 'react';

export interface SecurityPermission {
  id: string;
  label: string;
  description: string;
  scope: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface SecuritySandboxProps {
  title?: string;
  description?: string;
  permissions: SecurityPermission[];
  onCommit?: () => void;
  onCancel?: () => void;
  committing?: boolean;
  className?: string;
}

export const SecurityPermissionRow: React.FC<SecurityPermission> = ({
  id,
  label,
  description,
  scope,
  checked = false,
  disabled = false,
  onChange,
}) => (
  <div className="flex items-start justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-750/70">
    <div className="flex items-start gap-3">
      <div className="flex h-5 items-center">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 dark:bg-slate-800 focus:ring-offset-slate-900"
        />
      </div>
      <div className="text-sm">
        <label htmlFor={id} className="font-semibold text-slate-900 dark:text-white cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
    <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-mono text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-700/10 shrink-0 ml-4">
      {scope}
    </span>
  </div>
);

export const SecuritySandbox: React.FC<SecuritySandboxProps> = ({
  title = 'Module Security Sandbox Profiles',
  description = 'Enforce continuous validation rules and limit operational access to system-level data scopes.',
  permissions,
  onCommit,
  onCancel,
  committing = false,
  className = '',
}) => (
  <div
    className={[
      'max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm my-8',
      className,
    ].filter(Boolean).join(' ')}
  >
    <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>

    <div className="mt-6 space-y-4">
      {permissions.map((perm) => (
        <SecurityPermissionRow key={perm.id} {...perm} />
      ))}
    </div>

    <div className="mt-8 flex items-center justify-end gap-x-4 border-t border-slate-200 dark:border-slate-800 pt-5">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 cursor-pointer"
        >
          Cancel Reset
        </button>
      )}
      {onCommit && (
        <button
          type="submit"
          disabled={committing}
          className="rounded-lg bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-semibold text-white dark:text-slate-950 shadow-sm hover:bg-blue-500 dark:hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {committing ? 'Committing…' : 'Commit Security Rules'}
        </button>
      )}
    </div>
  </div>
);

export default SecuritySandbox;
