import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react';
import { CompanyRelease } from '../services/releaseApi';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

const MandatoryReleaseBarrier: React.FC = () => {
  const [pendingRelease, setPendingRelease] = useState<CompanyRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const checkMandatory = async () => {
    if (!isAuthenticated || !user || user.role === 'SPURADMIN') {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/releases/pending-mandatory', {
        headers: { 'x-background': '1' },
      } as any);
      const raw = res.data?.data ?? res.data ?? null;
      // Only set if the nested release relation is present; otherwise treat as no pending release
      if (raw && raw.release) {
        setPendingRelease(raw);
      } else {
        setPendingRelease(null);
      }
    } catch {
      // Non-critical — silently ignore (403 for non-admin roles, network errors, etc.)
      setPendingRelease(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't show barrier on the releases page itself
    if (location.pathname === '/settings/releases') {
      setPendingRelease(null);
      return;
    }

    checkMandatory();
  }, [location.pathname, isAuthenticated, user]);

  // Guard: only show barrier when the nested release object is present
  if (loading || !pendingRelease || !pendingRelease.release) return null;

  const rel = pendingRelease.release;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6 animate-aki-fade-in">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 flex items-center justify-center">
          <ShieldAlert size={40} className="text-amber-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            Mandatory Update Required
          </h2>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            A critical system update (v{rel.version}) must be applied to your account before you can continue using the platform.
          </p>
        </div>

        {rel.changelog && (
          <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl text-left border border-slate-100 dark:border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Important Changes</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 italic">
              "{rel.changelog}"
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => navigate('/settings/releases')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 group"
          >
            Go to Update Center <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-3 text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <RefreshCw size={16} /> Check status again
          </button>
        </div>
      </div>
    </div>
  );
};

export default MandatoryReleaseBarrier;


