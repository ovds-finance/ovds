/**
 * PaymentRequired (HTTP 402)
 * Shown when the backend returns a 402 response or a gated route is navigated to.
 */
import {
  CreditCard, ArrowLeft, Zap, CheckCircle2, Clock,
  Sparkles, ArrowRight, Crown, Rocket, Lock,
} from 'lucide-react';
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useEntitlement } from '../context/entitlementContext';
import { usePageTitle } from '../hooks/usePageTitle';

const PLAN_FEATURES = [
  { icon: Zap,          text: 'Full double-entry accounting (GL)' },
  { icon: CheckCircle2, text: 'Unlimited payroll with Ethiopian PIT' },
  { icon: CheckCircle2, text: 'Bank reconciliation & OCR import' },
  { icon: CheckCircle2, text: 'DRRF levy & Business Income Tax' },
  { icon: CheckCircle2, text: 'ERCA compliance dashboard' },
  { icon: CheckCircle2, text: 'Full IFRS financial reports' },
];

const PaymentRequired: React.FC = () => {
  usePageTitle('Upgrade Required');
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnTrial, trialDaysRemaining } = useEntitlement();

  const requiredFeature =
    (location.state as any)?.requiredFeature as string | undefined
    ?? new URLSearchParams(location.search).get('feature') ?? undefined;
  const startTrial = (location.state as any)?.startTrial as boolean | undefined;

  const isExpiredTrial = isOnTrial && (trialDaysRemaining ?? 0) <= 0;
  const isActiveTrial  = isOnTrial && (trialDaysRemaining ?? 0) > 0;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Soft blobs */}
      <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(85,188,126,0.12) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}/>
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.10) 0%, transparent 70%)', transform: 'translate(-30%,30%)' }}/>

      <div className="relative z-10 w-full max-w-[480px] space-y-4">

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Ovds green top stripe */}
          <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#3db77a,#55bc7e,#7dd8a0)' }}/>

          <div className="p-8 sm:p-10 space-y-6">

            {/* Trial status banners */}
            {isExpiredTrial && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-[12px] font-semibold">
                <Clock size={13} className="text-amber-500 shrink-0"/>
                Your free trial has expired
              </div>
            )}
            {isActiveTrial && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-xl text-[var(--pro-azure-dark)] text-[12px] font-semibold">
                <Clock size={13} className="text-[var(--pro-azure)] shrink-0"/>
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in your free trial
              </div>
            )}

            {/* Icon + heading */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto shadow-sm">
                <Lock size={24} className="text-gray-400"/>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-full mb-2">
                  <CreditCard size={9}/> 402 — Upgrade Required
                </span>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mt-2">
                  This feature requires a paid plan
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed mt-1.5 max-w-xs mx-auto">
                  {requiredFeature
                    ? `"${requiredFeature}" is not included in your current plan.`
                    : 'Upgrade to unlock the full OVDS accounting platform.'}
                </p>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Business */}
              <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-2.5 hover:border-[var(--pro-azure-light)] hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Rocket size={14} className="text-gray-500"/>
                  </div>
                  <span className="text-[12px] font-extrabold text-gray-700">Business</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Full GL, payroll, bank feeds, DRRF & BIT compliance
                </p>
                <p className="text-[15px] font-extrabold text-gray-900">
                  ETB 7,500<span className="text-[11px] font-medium text-gray-400">/mo</span>
                </p>
              </div>

              {/* Enterprise */}
              <div className="p-4 bg-[var(--pro-azure-50)] border-2 border-[var(--pro-azure-100)] rounded-2xl space-y-2.5 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background:'#55bc7e' }}>Popular</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:'#55bc7e' }}>
                    <Crown size={14} className="text-white"/>
                  </div>
                  <span className="text-[12px] font-extrabold text-[var(--pro-azure-dark)]">Enterprise</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Multi-company, audit, white-label, on-premise
                </p>
                <p className="text-[15px] font-extrabold text-gray-900">Custom</p>
              </div>
            </div>

            {/* Feature list */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">What you unlock</p>
              <div className="space-y-2">
                {PLAN_FEATURES.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background:'#55bc7e' }}>
                      <Icon size={9} className="text-white"/>
                    </div>
                    <span className="text-[12px] font-medium text-gray-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button onClick={() => navigate('/plans', { state: { requiredFeature, startTrial } })}
                className="w-full py-3 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                style={{ background: '#55bc7e' }}>
                <Sparkles size={14}/> View Plans & Upgrade <ArrowRight size={14}/>
              </button>

              {!isOnTrial && (
                <button onClick={() => navigate('/plans', { state: { startTrial: true } })}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all">
                  Start 14-Day Free Trial
                </button>
              )}

              <button onClick={() => navigate(-1)}
                className="w-full py-2 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors">
                <ArrowLeft size={13}/> Go Back
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400">
          Questions?{' '}
          <Link to="/helpdesk" className="text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] font-semibold hover:underline transition-colors">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PaymentRequired;
