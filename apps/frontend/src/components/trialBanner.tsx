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
import { Clock, X, ArrowRight, Sparkles, FileText, Layers } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  let icon = <Clock size={13} className="shrink-0" style={{ opacity: 0.85 }} />;
  let message: string;

  if (isExpired && mode === 'TIME_BOUND') {
    message = 'Your free trial has expired. Upgrade now to keep access.';
  } else if (mode === 'VOLUME_CAP' && trialRestriction?.maxDocuments) {
    icon = <FileText size={13} className="shrink-0" style={{ opacity: 0.85 }} />;
    message = `Trial: up to ${trialRestriction.maxDocuments} invoices/receipts. Live banking and MoR API locked.`;
  } else if (mode === 'STRUCTURAL') {
    icon = <Layers size={13} className="shrink-0" style={{ opacity: 0.85 }} />;
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

  /* ── Colour scheme per urgency ─────────────────────────────────── */
  const scheme = isExpired
    ? { bg: 'var(--pro-rose)',    text: '#fff', btnBg: 'rgba(255,255,255,0.18)', btnHover: 'rgba(255,255,255,0.28)' }
    : isExpiringSoon
    ? { bg: 'var(--pro-amber)',   text: '#fff', btnBg: 'rgba(255,255,255,0.18)', btnHover: 'rgba(255,255,255,0.28)' }
    : { bg: 'var(--pro-indigo)', text: '#fff', btnBg: 'rgba(255,255,255,0.18)', btnHover: 'rgba(255,255,255,0.28)' };

  return (
    <div
      className="relative flex items-center justify-between gap-4 px-4 py-2"
      style={{ background: scheme.bg, color: scheme.text }}
    >
      {/* Left: message */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon}
        <span
          className="truncate text-[11px] font-semibold"
          style={{ letterSpacing: '-0.005em' }}
        >
          {message}
        </span>
      </div>

      {/* Centre: upgrade CTA */}
      <button
        onClick={() => navigate('/plans')}
        className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-lg px-3 py-1"
        style={{ background: scheme.btnBg }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = scheme.btnHover)}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = scheme.btnBg)}
      >
        <Sparkles size={10} />
        Upgrade
        <ArrowRight size={10} />
      </button>

      {/* Right: dismiss */}
      {!isExpired && (
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-lg transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
          aria-label="Dismiss trial banner"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

export default TrialBanner;

