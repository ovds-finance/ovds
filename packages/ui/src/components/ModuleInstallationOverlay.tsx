/**
 * ModuleInstallationOverlay — v5.0 State Machine Visualizer
 *
 * Renders the current state of an async module deployment with ARIA-compliant
 * announcements and progress indication.
 *
 * Exports:
 *   ModuleInstallationOverlay  — full overlay component
 *   ModuleInstallationBadge    — compact inline badge
 */

import React from 'react';
import { useModuleInstallation, INSTALLATION_STATE_META, ModuleInstallationState } from '../hooks/useModuleInstallation';

export interface ModuleInstallationOverlayProps {
  /** Module name being installed */
  moduleName: string;
  /** Optional override for the state machine */
  stateMachine?: ReturnType<typeof useModuleInstallation>;
  /** Called when the user dismisses the overlay (if dismissable) */
  onDismiss?: () => void;
  /** Whether the overlay can be dismissed */
  dismissable?: boolean;
  className?: string;
}

const StateIcon: React.FC<{ state: ModuleInstallationState }> = ({ state }) => {
  switch (state) {
    case 'IDLE':
      return null;
    case 'PRE_FLIGHT':
      return (
        <svg className="h-5 w-5 animate-aki-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      );
    case 'FETCHING':
      return (
        <svg className="h-5 w-5 animate-aki-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      );
    case 'EXTRACTION':
      return (
        <svg className="h-5 w-5 animate-aki-spin text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4v5h5M20 20v-5h-5" />
          <path d="M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 013.51 15" />
        </svg>
      );
    case 'LIVE':
      return (
        <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'CRITICAL_ERROR':
      return (
        <svg className="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case 'ROLLBACK':
      return (
        <svg className="h-5 w-5 animate-aki-spin text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </svg>
      );
    default:
      return null;
  }
};

const STATE_STYLES: Record<ModuleInstallationState, string> = {
  IDLE:             'text-slate-600 dark:text-slate-400',
  PRE_FLIGHT:       'text-blue-600 dark:text-blue-400',
  FETCHING:         'text-blue-600 dark:text-blue-400',
  EXTRACTION:       'text-amber-600 dark:text-amber-400',
  LIVE:             'text-emerald-600 dark:text-emerald-400',
  CRITICAL_ERROR:   'text-rose-600 dark:text-rose-400',
  ROLLBACK:         'text-amber-600 dark:text-amber-400',
};

export const ModuleInstallationBadge: React.FC<{ state: ModuleInstallationState; label?: string }> = ({
  state,
  label,
}) => {
  const meta = INSTALLATION_STATE_META[state];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        STATE_STYLES[state],
        state === 'LIVE' ? 'bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-inset ring-emerald-600/20' :
        state === 'CRITICAL_ERROR' ? 'bg-rose-50 dark:bg-rose-950/50 ring-1 ring-inset ring-rose-600/20' :
        state === 'PRE_FLIGHT' || state === 'FETCHING' ? 'bg-blue-50 dark:bg-blue-950/50 ring-1 ring-inset ring-blue-600/20' :
        state === 'EXTRACTION' || state === 'ROLLBACK' ? 'bg-amber-50 dark:bg-amber-950/50 ring-1 ring-inset ring-amber-600/20' :
        'bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-600/10',
      ].join(' ')}
      role={meta.role}
      aria-live={meta.ariaLive}
      aria-busy={meta.ariaBusy}
    >
      <StateIcon state={state} />
      {label ?? meta.label}
    </span>
  );
};

export const ModuleInstallationOverlay: React.FC<ModuleInstallationOverlayProps> = ({
  moduleName,
  stateMachine,
  onDismiss,
  dismissable = false,
  className = '',
}) => {
  const sm = stateMachine ?? useModuleInstallation();
  const { state, progress, error } = sm;
  const meta = INSTALLATION_STATE_META[state];

  if (state === 'IDLE') return null;

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center',
        className,
      ].filter(Boolean).join(' ')}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      role={meta.role}
      aria-live={meta.ariaLive}
      aria-busy={meta.ariaBusy}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <StateIcon state={state} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {moduleName}
              </h3>
              <p className={`text-xs mt-1 font-medium ${STATE_STYLES[state]}`}>
                {meta.label}
              </p>
            </div>
            {dismissable && onDismiss && (
              <button
                onClick={onDismiss}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {state !== 'LIVE' && state !== 'CRITICAL_ERROR' && state !== 'ROLLBACK' && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                <span>Progress</span>
                <span className="font-mono tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-300',
                    state === 'FETCHING' ? 'bg-blue-500' :
                    state === 'EXTRACTION' ? 'bg-amber-500' :
                    'bg-blue-500',
                  ].join(' ')}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{error}</p>
            </div>
          )}
        </div>

        {(state === 'LIVE' || state === 'CRITICAL_ERROR' || state === 'ROLLBACK') && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            {dismissable && onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleInstallationOverlay;
