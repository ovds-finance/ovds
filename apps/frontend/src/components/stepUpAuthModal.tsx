/**
 * StepUpAuthModal — re-authentication gate for sensitive operations.
 *
 * Shows when an Auth0 SSO user tries to access a sensitive route/action
 * without having completed MFA (stepUp !== 'full').
 *
 * Usage:
 *   const { StepUpGate } = useStepUp();
 *   <StepUpGate>
 *     <DangerousAction />
 *   </StepUpGate>
 *
 *   // Or imperatively:
 *   const { requireStepUp } = useStepUp();
 *   const ok = await requireStepUp();
 *   if (ok) doSensitiveAction();
 */
import { ShieldCheck, Lock, X, Loader2, AlertTriangle } from 'lucide-react';
import React, { createContext, useCallback, useContext, useState } from 'react';

import { getAuth0Client } from '../rbac/auth0Client';
import { useAuth } from '../rbac/AuthContext';

const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';

// -- Context -------------------------------------------------------------------

interface StepUpContextValue {
  /** Returns true if step-up is satisfied (or not required). Prompts if needed. */
  requireStepUp(): Promise<boolean>;
  /** Wrap children — renders a step-up gate if MFA is required */
  StepUpGate: React.FC<{ children: React.ReactNode; reason?: string }>;
}

const StepUpContext = createContext<StepUpContextValue | null>(null);

// -- Modal ---------------------------------------------------------------------

interface ModalProps {
  reason?: string;
  onConfirm(): void;
  onCancel(): void;
  loading: boolean;
  failed: boolean;
}

const Modal: React.FC<ModalProps> = ({ reason, onConfirm, onCancel, loading, failed }) => (
  <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-aki-fade-in">
    <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-aki-scale-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--pro-azure)] to-violet-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Identity Verification</p>
              <p className="text-white/70 text-xs">Step-up authentication required</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <Lock size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
            {reason ?? 'This action requires additional identity verification. Please complete MFA to continue.'}
          </p>
        </div>

        {failed && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl">
            <AlertTriangle size={13} className="text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
              Verification failed. Please try again or contact your administrator.
            </p>
          </div>
        )}

        <p className="ovds-body">
          You will be redirected to your identity provider to complete multi-factor authentication.
          Your current session will be preserved.
        </p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-medium hover:bg-[var(--pro-azure-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          {loading ? 'Verifying…' : 'Verify Identity'}
        </button>
      </div>
    </div>
  </div>
);

// -- Provider ------------------------------------------------------------------

export const StepUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuth0User, hasMfa } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const resolveRef = React.useRef<((ok: boolean) => void) | null>(null);

  const requireStepUp = useCallback(async (msg?: string): Promise<boolean> => {
    // Not Auth0 or already has MFA — no step-up needed
    if (!AUTH0_ENABLED || !isAuth0User || hasMfa) return true;

    setReason(msg);
    setFailed(false);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, [isAuth0User, hasMfa]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const client = await getAuth0Client();
      // Trigger step-up by requesting a new token with acr_values=http://schemas.openid.net/pape/policies/2007/06/multi-factor
      await client.loginWithRedirect({
        authorizationParams: {
          acr_values: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
          prompt: 'login',
        },
        appState: { returnTo: window.location.pathname },
      });
      // Redirect happens — resolve won't be called here
    } catch {
      setFailed(true);
      setLoading(false);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setLoading(false);
    setFailed(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const StepUpGate = useCallback<React.FC<{ children: React.ReactNode; reason?: string }>>(
    ({ children: gateChildren, reason: gateReason }) => {
      // If MFA already satisfied or not Auth0, render directly
      if (!AUTH0_ENABLED || !isAuth0User || hasMfa) {
        return <>{gateChildren}</>;
      }
      // Otherwise render a locked placeholder
      return (
        <div className="relative">
          <div className="pointer-events-none opacity-30 select-none">{gateChildren}</div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl">
            <button
              onClick={() => requireStepUp(gateReason)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-lg text-xs font-medium hover:bg-[var(--pro-azure-dark)] transition-colors shadow-lg"
            >
              <Lock size={13} /> Verify Identity to Access
            </button>
          </div>
        </div>
      );
    },
    [isAuth0User, hasMfa, requireStepUp],
  );

  return (
    <StepUpContext.Provider value={{ requireStepUp, StepUpGate }}>
      {children}
      {open && (
        <Modal
          reason={reason}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={loading}
          failed={failed}
        />
      )}
    </StepUpContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useStepUp(): StepUpContextValue {
  const ctx = useContext(StepUpContext);
  if (!ctx) throw new Error('useStepUp must be used inside <StepUpProvider>');
  return ctx;
}




