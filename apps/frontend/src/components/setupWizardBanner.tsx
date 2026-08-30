/**
 * SetupWizardBanner — shown in the layout when the System Administration setup wizard is incomplete
 *
 * Displays a banner with setup progress and a link to continue the wizard.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, X, ArrowRight } from 'lucide-react';
import { setupApi } from '../services/setupApi';
import { useAuth } from '../rbac/AuthContext';
import toast from 'react-hot-toast';

const SetupWizardBanner: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('ovds_setup_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companyId = user?.companyId;
    if (!companyId || !isAuthenticated) return;
    setLoading(true);
    setupApi.getProgress(companyId)
      .then((data) => {
        setProgress(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user?.companyId, isAuthenticated]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('ovds_setup_banner_dismissed', 'true');
    } catch { /* storage full — ignore */ }
  };

  if (loading || dismissed || !progress || progress.overallProgress === 100) return null;

  const remainingRequired = progress.steps.filter(s => s.status !== 'completed' && s.isRequired).length;
  const remainingOptional = progress.steps.filter(s => s.status !== 'completed' && !s.isRequired).length;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Settings size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 truncate">
                  System Administration Setup: {progress.overallProgress}% complete
                </p>
                {remainingRequired > 0 && (
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                    {remainingRequired} required
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-amber-200 dark:bg-amber-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress.overallProgress}%`,
                      background: progress.overallProgress === 100 ? '#22c55e' : progress.overallProgress >= 60 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {progress.overallProgress}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/settings/setup-wizard"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-black hover:bg-amber-600 transition-all"
            >
              Continue <ArrowRight size={10} />
            </Link>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            aria-label="Dismiss setup banner"
          >
            <X size={14} />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizardBanner;
