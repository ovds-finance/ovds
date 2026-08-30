import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Monitor,
  Terminal,
  Package,
  Building2,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { releaseApi, CompanyRelease, UpdateSettings } from '../services/releaseApi';
import toast from 'react-hot-toast';
import { AlertBox } from '@ovds/ui';

interface SoftwareUpdateBannerProps {
  onNavigate?: (path: string) => void;
  compact?: boolean;
}

const CopyCommandBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Command copied');
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fail silently */ }
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="shrink-0 w-6 h-6 rounded flex items-center justify-center bg-slate-100 hover:bg-emerald-100 dark:bg-slate-700 dark:hover:bg-emerald-900/40 text-slate-500 hover:text-emerald-600 transition-all"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
};

const SoftwareUpdateBanner: React.FC<SoftwareUpdateBannerProps> = ({
  onNavigate,
  compact = false,
}) => {
  const [available, setAvailable] = useState<CompanyRelease[]>([]);
  const [settings, setSettings] = useState<UpdateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [avail, sett] = await Promise.all([
        releaseApi.getAvailableReleases(),
        releaseApi.getUpdateSettings(),
      ]);
      setAvailable(avail);
      setSettings(sett);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pendingCount = available.length;
  const latestVersion = available[0]?.release?.version ?? null;

  if (loading || dismissed || pendingCount === 0) return null;

  const handleApply = async (releaseId: string, version: string) => {
    const ok = window.confirm(`Install update v${version}?\n\nThe system will update and briefly restart.`);
    if (!ok) return;
    try {
      await releaseApi.applyRelease(releaseId);
      toast.success(`v${version} installed successfully`);
      fetchData();
    } catch {
      toast.error('Failed to install update');
    }
  };

  const UPDATE_STEPS = [
    {
      icon: <Monitor size={12} />,
      title: 'One-Click Update',
      desc: 'Click "Install" next to any update below.',
      color: 'text-emerald-600',
    },
    {
      icon: <Terminal size={12} />,
      title: 'Manual Update (SSH)',
      desc: 'Run this command from your OVDS root folder:',
      cmd: 'npm run deploy',
      color: 'text-amber-600',
    },
    {
      icon: <Package size={12} />,
      title: 'Specific App Update',
      desc: 'Rebuild a specific workspace package:',
      cmd: 'npm run build -w @ovds/backend',
      color: 'text-violet-600',
    },
    {
      icon: <Building2 size={12} />,
      title: 'Hosting Assistance',
      desc: 'No SSH access? Share the update version with your hosting provider and ask them to run the deploy command.',
      color: 'text-slate-600',
    },
  ];

  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0">
          <Download size={15} className="text-sky-600 dark:text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-bold text-sky-800 dark:text-sky-200">
              Software Update Available
            </p>
            <span className="px-1.5 py-0.5 rounded-full bg-sky-200 dark:bg-sky-800 text-sky-700 dark:text-sky-300 text-[9px] font-black uppercase tracking-wider">
              {pendingCount} pending
            </span>
            {latestVersion && (
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                Latest: v{latestVersion}
              </span>
            )}
          </div>
          <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">
            Keep your software up to date with the latest features and security patches
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors flex items-center gap-1"
          >
            {expanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> How to Update</>}
          </button>
          {onNavigate && (
            <Link
              to="/settings/releases"
              onClick={() => onNavigate?.('/settings/releases')}
              className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
            >
              View All <ArrowRight size={10} />
            </Link>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="w-6 h-6 rounded flex items-center justify-center text-sky-400 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
            aria-label="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Expanded Ovds-style guide */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-sky-200 dark:border-sky-800/60 pt-3">
          {UPDATE_STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/60">
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${step.color} bg-white dark:bg-slate-800`}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{step.title}</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                {step.cmd && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <code className="flex-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                      {step.cmd}
                    </code>
                    <CopyCommandBtn text={step.cmd} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Quick actions for pending releases */}
          {available.slice(0, 3).map((cr) => (
            <div key={cr.id} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-sky-100/50 dark:bg-sky-900/20 border border-sky-200/50">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck size={11} className="text-sky-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  v{cr.release.version}
                </span>
                {cr.release.isMandatory && (
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">Mandatory</span>
                )}
              </div>
              <button
                onClick={() => handleApply(cr.releaseId, cr.release.version)}
                className="shrink-0 px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
              >
                <Download size={10} /> Install
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SoftwareUpdateBanner;
