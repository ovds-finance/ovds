/**
 * GoogleCallback — handles the redirect from the backend Google OAuth flow.
 *
 * Flow:
 *  1. Backend validates Google token, creates/finds user, issues a local JWT
 *  2. Backend redirects to /auth/google/callback#token=<jwt>  (URL *fragment*)
 *  3. This page reads the token from window.location.hash (never sent to any
 *     server — fragments are browser-only), fetches /api/auth/me for the user
 *     profile, then calls AuthContext.login()
 *  4. Immediately replaces the URL to remove the fragment from browser history
 *  5. Redirects to the user's default dashboard
 *
 * Security note:
 *  The token is in the URL *fragment* (#), not the query string (?).
 *  Fragments are never sent to servers (no server logs) and are not included
 *  in the Referer header. They are visible in browser history — so we clear
 *  the fragment from the URL immediately after extraction using replaceState().
 */
import { Loader2, ShieldAlert, ArrowLeft, Shield } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../rbac/AuthContext';
import { rbac } from '../rbac/rbac';
import { BEARER_PREFIX } from '../utils/constants';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_URL as string | undefined) ||
  '/api';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Already authenticated — go to dashboard
    if (isAuthenticated && user) {
      navigate(rbac.defaultRoute(user.role), { replace: true });
      return;
    }

    // Read token from URL *fragment* (#token=...) — not from query params.
    // The backend uses a fragment so the token is never sent to any server
    // and never appears in server access logs.
    const hash = window.location.hash; // e.g. "#token=eyJ..."
    const tokenMatch = /[#&]token=([^&]+)/.exec(hash);
    const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

    if (!token) {
      setError('No authentication token received. Please try signing in again.');
      return;
    }

    // Clear the fragment from the URL immediately so the token doesn't linger
    // in browser history. replaceState doesn't trigger a navigation event.
    window.history.replaceState(null, '', window.location.pathname);

    if (processed.current) return;
    processed.current = true;

    let cancelled = false;

    (async () => {
      try {
        // Fetch the full user profile using the issued token
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `${BEARER_PREFIX}${token}` },
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(
            body?.message ?? `Failed to get user profile (${res.status})`,
          );
        }

        const data = await res.json();
        const userData = data?.data ?? data;

        if (!cancelled) {
          login(token, {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            employeeId: userData.employeeId,
            companyId: userData.companyId,
            isAuth0User: false,
          });
          // navigate is handled by useEffect above on next render once isAuthenticated is true
        }
      } catch (err: unknown) {
        if (!cancelled) {
          processed.current = false;
          setError(
            err instanceof Error
              ? err.message
              : 'Google sign-in failed. Please try again.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Redirect after login --------------------------------------------------
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(rbac.defaultRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // -- Error state -----------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div
              className="h-[3px]"
              style={{ background: 'linear-gradient(90deg,#ef4444,#f87171)' }}
            />
            <div className="p-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert size={24} className="text-red-400" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
                  Google sign-in failed
                </h1>
                <p className="text-[13px] text-gray-500 leading-relaxed break-words">
                  {error}
                </p>
              </div>
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  style={{ background: '#55bc7e' }}
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-all"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-gray-400 mt-4">
            OVDS AI ERP · Ethiopia 🇪🇹
          </p>
        </div>
      </div>
    );
  }

  // -- Loading state ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px]" style={{ background: '#55bc7e' }} />
          <div className="p-10 flex flex-col items-center gap-5">
            {/* Spinner */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-100 bg-white shadow-sm">
                <Loader2
                  size={28}
                  className="animate-spin"
                  style={{ color: '#55bc7e' }}
                />
              </div>
              <div
                className="absolute inset-0 rounded-2xl animate-ping opacity-20 border-2"
                style={{ borderColor: '#55bc7e' }}
              />
            </div>

            {/* Brand */}
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: '#55bc7e' }}
              >
                <Shield size={13} className="text-white" />
              </div>
              <span className="text-[13px] font-extrabold text-gray-800 tracking-tight">
                OVDS
              </span>
            </div>

            <div className="text-center">
              <p className="text-[14px] font-semibold text-gray-800">
                Completing Google sign-in…
              </p>
              <p className="text-[12px] text-gray-400 mt-1">
                Setting up your session
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: '#55bc7e',
                    animation: `auth-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          OVDS AI ERP · Ethiopia 🇪🇹
        </p>
      </div>

      <style>{`
        @keyframes auth-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GoogleCallback;
