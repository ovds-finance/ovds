/**
 * EntitlementGate
 *
 * Conditionally renders children based on backend-authoritative entitlement.
 * The backend is the SOLE authority — this component only reads the cached
 * status from EntitlementContext.
 *
 * Usage:
 *   <EntitlementGate featureKey="feature:gl">
 *     <GeneralLedgerPage />
 *   </EntitlementGate>
 *
 *   // Custom fallback:
 *   <EntitlementGate featureKey="feature:audit-outsourcing" fallback={<UpgradeCard />}>
 *     <AuditOutsourcingPage />
 *   </EntitlementGate>
 *
 *   // Silent mode (render nothing if not entitled):
 *   <EntitlementGate featureKey="feature:biometrics" silent>
 *     <BiometricButton />
 *   </EntitlementGate>
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { useEntitlement } from '../context/entitlementContext';

// -- Feature key → human-readable label map ------------------------------------
const FEATURE_LABELS: Record<string, { name: string; plan: string }> = {
  'feature:gl': { name: 'General Ledger', plan: 'Business' },
  'feature:bank-recon': { name: 'Bank Reconciliation', plan: 'Business' },
  'feature:ocr': { name: 'Bank Statement OCR', plan: 'Business' },
  'feature:ifrs-reports': { name: 'IFRS Financial Reports', plan: 'Business' },
  'feature:period-close': { name: 'Period Close & Audit Trail', plan: 'Business' },
  'feature:payroll-unlimited': { name: 'Unlimited Payroll', plan: 'Business' },
  'feature:biometrics': { name: 'Biometric Attendance', plan: 'Business' },
  'feature:shifts': { name: 'Shift Scheduling', plan: 'Business' },
  'feature:drrf': { name: 'DRRF Levy Compliance', plan: 'Business' },
  'feature:bit': { name: 'Business Income Tax', plan: 'Business' },
  'feature:erca-dashboard': { name: 'ERCA Compliance Dashboard', plan: 'Business' },
  'feature:audit-outsourcing': { name: 'Audit Outsourcing', plan: 'Enterprise' },
  'feature:multi-company': { name: 'Multi-Company Admin', plan: 'Enterprise' },
  'feature:white-label': { name: 'White Labeling', plan: 'Enterprise' },
  'feature:on-premise': { name: 'On-Premise Deployment', plan: 'Enterprise' },
  'plan:business': { name: 'Business Plan', plan: 'Business' },
  'plan:enterprise': { name: 'Enterprise Plan', plan: 'Enterprise' },
};

// -- Props ---------------------------------------------------------------------

interface EntitlementGateProps {
  /** The feature key to check (e.g. "feature:gl") */
  featureKey: string;
  /** Content to render when entitled */
  children: React.ReactNode;
  /** Custom fallback when not entitled. Defaults to UpgradeWall. */
  fallback?: React.ReactNode;
  /** If true, renders nothing when not entitled (no upgrade wall) */
  silent?: boolean;
  /** If true, shows a loading skeleton while entitlement is being fetched */
  showLoadingSkeleton?: boolean;
}

// -- Default upgrade wall ------------------------------------------------------

interface UpgradeWallProps {
  featureKey: string;
  isOnTrial: boolean;
  trialDaysRemaining: number | null;
}

const UpgradeWall: React.FC<UpgradeWallProps> = ({
  featureKey,
  isOnTrial,
  trialDaysRemaining,
}) => {
  const navigate = useNavigate();
  const meta = FEATURE_LABELS[featureKey] ?? { name: featureKey, plan: 'a higher plan' };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full ovds-panel p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-slate-400" />
        </div>

        {/* Trial expired banner */}
        {isOnTrial && trialDaysRemaining !== null && trialDaysRemaining <= 0 && (
          <div className="mb-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Clock size={12} />
            Your free trial has expired
          </div>
        )}

        {/* Heading */}
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {meta.name}
        </h2>
        <p className="text-sm text-slate-500 font-medium mb-2">
          requires the{' '}
          <span className="font-black text-emerald-500">{meta.plan} plan</span>
        </p>
        <p className="text-xs text-slate-400 mb-8 leading-relaxed">
          Upgrade your plan to unlock this feature and get access to the full
          OVDS accounting platform.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/plans', { state: { requiredFeature: featureKey } })}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Sparkles size={14} />
          View Plans & Upgrade
          <ArrowRight size={14} />
        </button>

        {/* Trial CTA */}
        {!isOnTrial && (
          <p className="mt-4 text-xs text-slate-400">
            Not ready?{' '}
            <button
              onClick={() => navigate('/plans', { state: { startTrial: true } })}
              className="text-emerald-500 font-bold hover:underline"
            >
              Start a 14-day free trial
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

// -- Loading skeleton ----------------------------------------------------------

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4 p-8">
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
  </div>
);

// -- EntitlementGate -----------------------------------------------------------

const EntitlementGate: React.FC<EntitlementGateProps> = ({
  featureKey,
  children,
  fallback,
  silent = false,
  showLoadingSkeleton = false,
}) => {
  const { isEntitled, loading, isOnTrial, trialDaysRemaining } = useEntitlement();

  if (loading && showLoadingSkeleton) {
    return <LoadingSkeleton />;
  }

  if (isEntitled(featureKey)) {
    return <>{children}</>;
  }

  if (silent) return null;

  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <UpgradeWall
      featureKey={featureKey}
      isOnTrial={isOnTrial}
      trialDaysRemaining={trialDaysRemaining}
    />
  );
};

export default EntitlementGate;
export { UpgradeWall };

