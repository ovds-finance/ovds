/**
 * TrialBanner
 *
 * Displays a persistent banner when the company is on a free trial.
 * Shows restriction-aware messaging per §4.2 trial matrices:
 *   TIME_BOUND  — days remaining until lockout
 *   VOLUME_CAP  — documents used vs limit
 *   STRUCTURAL  — cap limits reminder
 *
 * Automatically hides when:
 *  - Not on trial
 *  - Has an active paid subscription
 *  - User dismisses it (stored in sessionStorage)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X, ArrowRight, Sparkles, FileText, Layers } from 'lucide-react';
import { useEntitlement } from '../context/entitlementContext';

const DISMISS_KEY = 'ovds_trial_banner_dismissed';

const TrialBanner: React.FC = () => {
  const {
    isOnTrial,
    trialDaysRemaining,
    hasActiveSubscription,
    trialRestriction,
  } = useEntitlement();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === 'true',
  );

  // Don't show if not on trial, already subscribed, or dismissed
  if (!isOnTrial || hasActiveSubscription || dismissed) return null;

  const days = trialDaysRemaining ?? 0;
  const isExpiringSoon = days <= 3;
  const isExpired = days <= 0;
  const mode = trialRestriction?.mode ?? 'TIME_BOUND';

  // Build message based on restriction mode
  let icon = <Clock size={13} className="shrink-0" />;
  let message: string;

  if (isExpired && mode === 'TIME_BOUND') {
    message = 'Your free trial has expired. Upgrade now to keep access.';
  } else if (mode === 'VOLUME_CAP' && trialRestriction?.maxDocuments) {
    icon = <FileText size={13} className="shrink-0" />;
    message = `Trial: up to ${trialRestriction.maxDocuments} invoices/receipts. Live banking and MoR API locked.`;
  } else if (mode === 'STRUCTURAL') {
    icon = <Layers size={13} className="shrink-0" />;
    const caps: string[] = [];
    if (trialRestriction?.maxSkus)      caps.push(`${trialRestriction.maxSkus} SKUs`);
    if (trialRestriction?.maxUsers)     caps.push(`${trialRestriction.maxUsers} user`);
    if (trialRestriction?.maxBranches)  caps.push(`${trialRestriction.maxBranches} branch`);
    message = `Trial limits: ${caps.join(' · ')}. Banking webhooks and MoR API locked.`;
  } else {
    message = isExpired
      ? 'Your free trial has expired. Upgrade now to keep access.'
      : `Free trial: ${days} day${days !== 1 ? 's' : ''} remaining.`;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div
      className={`relative flex items-center justify-between gap-4 px-4 py-2.5 text-xs font-bold ${
        isExpired
          ? 'bg-rose-500 text-white'
          : isExpiringSoon
          ? 'bg-amber-500 text-white'
          : 'bg-emerald-500 text-white'
      }`}
    >
      {/* Left: message */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon}
        <span className="truncate">{message}</span>
      </div>

      {/* Center: CTA */}
      <button
        onClick={() => navigate('/plans')}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors uppercase tracking-widest text-[10px]"
      >
        <Sparkles size={10} />
        Upgrade
        <ArrowRight size={10} />
      </button>

      {/* Right: dismiss */}
      {!isExpired && (
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Dismiss trial banner"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

export default TrialBanner;

