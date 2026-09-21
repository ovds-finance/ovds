/**
 * Auth0LoginButton — triggers Auth0 Universal Login.
 *
 * Guards:
 *  - Only renders when VITE_AUTH0_ENABLED=true (env var)
 *  - Only renders when the backend confirms Auth0 is configured (server check)
 *  - Safe to render outside Auth0Provider when disabled
 *
 * Enhancements over v1:
 *  - Shows the Auth0 tenant domain for transparency
 *  - Supports `connection` prop to pre-select an enterprise connection
 *  - Supports `prompt="login"` to force re-authentication
 *  - Accessible: disabled state + aria-label
 */
import { useAuth0 } from '@auth0/auth0-react';
import { Shield, Loader2, Building2 } from 'lucide-react';
import React from 'react';

import { useAuth0Status } from '../hooks/useAuth0Status';

const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';
const AUTH0_CONNECTION = import.meta.env.VITE_AUTH0_CONNECTION ?? '';

interface Auth0LoginButtonProps {
  /** Force re-authentication even if the user has an active Auth0 session */
  forceLogin?: boolean;
  /** Override the connection (e.g. 'google-apps', 'samlp-ovds') */
  connection?: string;
  className?: string;
}

// -- Inner — only mounted when Auth0Provider is present ------------------------
const Auth0LoginButtonInner: React.FC<Auth0LoginButtonProps> = ({
  forceLogin = false,
  connection,
  className = '',
}) => {
  const { loginWithRedirect, isLoading } = useAuth0();
  const { domain } = useAuth0Status();

  const handleLogin = () => {
    const conn = connection || AUTH0_CONNECTION || undefined;
    loginWithRedirect({
      authorizationParams: {
        ...(conn ? { connection: conn } : {}),
        ...(forceLogin ? { prompt: 'login' } : {}),
      },
    });
  };

  const isEnterprise = !!(connection || AUTH0_CONNECTION);
  const label = isEnterprise
    ? 'Continue with Enterprise SSO'
    : 'Continue with Auth0';

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleLogin}
      aria-label={label}
      className={`w-full py-3.5 bg-ovds-surface dark:bg-ovds-surface-dark border-2 border-ovds-border dark:border-ovds-muted-dark text-ovds-text-main dark:text-ovds-surface rounded-xl text-sm font-semibold hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${className}`}
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin text-[var(--pro-azure)]" />
      ) : isEnterprise ? (
        <Building2 size={18} />
      ) : (
        <Shield size={18} />
      )}
      {label}
      {domain && !isLoading && (
        <span className="text-[9px] font-normal text-ovds-text-subtle normal-case tracking-normal ml-1">
          ({domain})
        </span>
      )}
    </button>
  );
};

export const Auth0LoginButton: React.FC<Auth0LoginButtonProps> = (props) => {
  const { enabled, loading } = useAuth0Status();

  if (!AUTH0_ENABLED) return null;

  if (loading) {
    return (
      <div className="w-full py-4 flex items-center justify-center">
        <Loader2 size={16} className="animate-spin text-slate-300" />
      </div>
    );
  }

  if (!enabled) return null;

  return <Auth0LoginButtonInner {...props} />;
};


