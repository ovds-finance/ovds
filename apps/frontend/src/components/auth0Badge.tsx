/**
 * Auth0Badge — small indicator shown when the current session was
 * established via Auth0 SSO.
 *
 * Variants:
 *  - Default: "SSO" badge (indigo)
 *  - With MFA: shows step-up level (Full MFA = emerald, Password only = amber)
 *
 * Used in profile dropdowns, settings, and the header user menu.
 */
import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { useAuth } from '../rbac/AuthContext';

interface Auth0BadgeProps {
  className?: string;
  /** Show MFA step-up level alongside the SSO badge */
  showMfa?: boolean;
}

export const Auth0Badge: React.FC<Auth0BadgeProps> = ({
  className = '',
  showMfa = false,
}) => {
  const { isAuth0User, stepUp, mfaEnrolled } = useAuth();
  if (!isAuth0User) return null;

  const mfaLabel =
    stepUp === 'full'
      ? {
          icon: <ShieldCheck size={10} />,
          text: 'MFA',
          color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
          title: 'Multi-factor authentication completed',
        }
      : mfaEnrolled
        ? {
            icon: <ShieldAlert size={10} />,
            text: 'MFA enrolled',
            color: 'bg-amber-50 border-amber-100 text-amber-700',
            title: 'MFA enrolled but not used this session',
          }
        : null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-medium uppercase tracking-wider"
        title="Signed in via Auth0 SSO"
      >
        <Shield size={10} />
        SSO
      </span>
      {showMfa && mfaLabel && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider ${mfaLabel.color}`}
          title={mfaLabel.title}
        >
          {mfaLabel.icon}
          {mfaLabel.text}
        </span>
      )}
    </span>
  );
};



