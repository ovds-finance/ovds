/**
 * Auth0Callback — handles the redirect back from Auth0 Universal Login.
 *
 * Flow:
 *  1. Guards against Auth0 being disabled (redirects to /login)
 *  2. Shows a loading spinner while the SDK processes the callback
 *  3. Exchanges the Auth0 token for a local session via useAuth0Session
 *  4. Redirects to the user's default route once authenticated
 *  5. Shows a clear error state if authentication fails
 */
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../rbac/AuthContext';
import { rbac } from '../rbac';
import { Navigate, Link } from 'react-router-dom';
import { useAuth0Session } from '../hooks/useAuth0Session';
import { Loader2, ShieldAlert, ArrowLeft, Shield } from 'lucide-react';

const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';

// -- Inner — only mounted when Auth0Provider is present -----------------------
const Auth0CallbackInner: React.FC = () => {
  const { isLoading, error } = useAuth0();
  const { isAuthenticated, user } = useAuth();

  useAuth0Session();

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#ef4444,#f87171)' }}/>
            <div className="p-8 text-center space-y-5">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert size={24} className="text-red-400"/>
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <h1 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
                  Authentication failed
                </h1>
                <p className="text-[13px] text-gray-500 leading-relaxed break-words">
                  {error.message}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                <Link to="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  style={{ background: '#55bc7e' }}>
                  <ArrowLeft size={14}/> Back to Login
                </Link>
                <button onClick={() => window.location.reload()}
                  className="w-full py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-all">
                  Try again
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-gray-400 mt-4">
            OVDS AI ERP · Ethiopia 🇪🇹
          </p>
        </div>
      </div>
    );
  }

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={rbac.defaultRoute(user.role)} replace />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px]" style={{ background: '#55bc7e' }}/>
          <div className="p-10 flex flex-col items-center gap-5">
            {/* Spinner */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-100 bg-white shadow-sm">
                <Loader2 size={28} className="animate-spin" style={{ color: '#55bc7e' }}/>
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 border-2" style={{ borderColor: '#55bc7e' }}/>
            </div>

            {/* OVDS logo mark */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#55bc7e' }}>
                <Shield size={13} className="text-white"/>
              </div>
              <span className="text-[13px] font-extrabold text-gray-800 tracking-tight">OVDS</span>
            </div>

            <div className="text-center">
              <p className="text-[14px] font-semibold text-gray-800">Completing sign-in…</p>
              <p className="text-[12px] text-gray-400 mt-1">Verifying your credentials</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: '#55bc7e',
                    animation: `auth-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}/>
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

// -- Public export — redirects to /login when Auth0 is not enabled ------------
const Auth0Callback: React.FC = () => {
  if (!AUTH0_ENABLED) return <Navigate to="/login" replace />;
  return <Auth0CallbackInner />;
};

export default Auth0Callback;
