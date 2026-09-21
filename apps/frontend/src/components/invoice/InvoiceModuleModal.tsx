/**
 * InvoiceModuleModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Inline modal for the hybrid cloud-to-on-premises Invoice Module setup.
 * Opens directly from the Invoices page toolbar — no page navigation needed.
 *
 * Shows: download links (live manifest), 4-step hybrid setup guide,
 * offline/online sync overview, and plan comparison table.
 */
import {
  X, Download, Cloud, Server, RefreshCw, Shield, Wifi, WifiOff,
  Copy, Check, AlertTriangle, Lock, Zap, Info, Key, Globe,
  CheckCircle2, ExternalLink, Loader2, ArrowRight,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import {
  getInvoiceModuleManifest,
  getInvoiceModuleDownloadUrl,
  type ClientManifest,
} from '../../services/clientApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtBytes = (b: number) =>
  b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`;

const OS_META: Record<string, { icon: string; label: string }> = {
  windows:          { icon: '🪟', label: 'Windows (.exe)' },
  'linux-deb':      { icon: '🐧', label: 'Linux — Debian / Ubuntu (.deb)' },
  'linux-appimage': { icon: '🐧', label: 'Linux — AppImage' },
  docker:           { icon: '🐳', label: 'Docker image' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const HashBlock: React.FC<{ filename: string; sha256: string }> = ({ filename, sha256 }) => {
  const [copied, setCopied] = useState(false);
  const isPending = sha256.startsWith('pending');
  const copy = () => {
    navigator.clipboard.writeText(sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (isPending) return (
    <p className="text-[10px] text-slate-400 italic mt-1">
      Checksum published when the build pipeline runs. Download only from your authenticated dashboard.
    </p>
  );
  return (
    <div className="flex items-center gap-2 mt-1">
      <code className="flex-1 font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all
        bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-lg">
        {sha256}
      </code>
      <button onClick={copy} aria-label="Copy SHA-256"
        className="flex items-center gap-1 px-2 py-1.5 bg-slate-900 dark:bg-slate-700 text-white
          rounded-lg text-[10px] font-bold hover:bg-[var(--pro-azure-dark)] transition-colors shrink-0">
        {copied ? <><Check size={9} /> Copied!</> : <><Copy size={9} /> Copy</>}
      </button>
    </div>
  );
};

const DownloadRow: React.FC<{
  platform: ClientManifest['platforms'][0];
  dlUrl: string;
}> = ({ platform, dlUrl }) => {
  const [showHash, setShowHash]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone]               = useState(false);
  const meta = OS_META[platform.os] ?? { icon: '💾', label: platform.os };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(dlUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const cd   = res.headers.get('content-disposition') ?? '';
      const match = cd.match(/filename="?([^";]+)"?/);
      const name  = match ? match[1] : platform.filename;
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e: any) {
      alert(`Download failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 p-3 text-xs">
        <span className="text-xl shrink-0">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-700 dark:text-slate-300">{meta.label}</p>
          <p className="font-mono text-[10px] text-slate-400 truncate mt-0.5">{platform.filename}</p>
          <p className="text-[10px] text-slate-400">{fmtBytes(platform.sizeBytes)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowHash(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
              showHash
                ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-light)] dark:border-green-700 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}>
            <Shield size={9} /> {showHash ? 'Hide' : 'Verify'}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-60 ${
              done
                ? 'bg-[var(--pro-azure)] text-white'
                : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-[var(--pro-azure-dark)]'
            }`}
          >
            {downloading
              ? <><Loader2 size={10} className="animate-spin" /> Downloading…</>
              : done
                ? <><Check size={10} /> Downloaded</>
                : <><Download size={10} /> Download</>
            }
          </button>
        </div>
      </div>
      {showHash && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 bg-white dark:bg-slate-800/50 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Shield size={9} className="text-[var(--pro-azure)]" /> SHA-256 Checksum
          </p>
          <HashBlock filename={platform.filename} sha256={platform.sha256} />
          <p className="text-[10px] text-slate-400">
            Windows: <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700">
              Get-FileHash {platform.filename} -Algorithm SHA256
            </code>
          </p>
          <p className="text-[10px] text-slate-400">
            Linux: <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700">
              sha256sum {platform.filename}
            </code>
          </p>
        </div>
      )}
    </div>
  );
};

const StepItem: React.FC<{
  n: number; title: string; badge?: string; last?: boolean; children: React.ReactNode;
}> = ({ n, title, badge, last, children }) => (
  <li className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="w-7 h-7 rounded-full bg-[var(--pro-azure)] text-white flex items-center justify-center
        text-xs font-semibold shrink-0 z-10">{n}</div>
      {!last && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />}
    </div>
    <div className={`flex-1 min-w-0 ${last ? 'pb-0' : 'pb-6'}`}>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
            uppercase tracking-wider bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">{children}</div>
    </div>
  </li>
);

const Callout: React.FC<{
  type?: 'info' | 'warning' | 'success';
  title?: string;
  children: React.ReactNode;
}> = ({ type = 'info', title, children }) => {
  const cfg = {
    info:    { bar: 'bg-[var(--pro-azure-50)]0', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/20',
                border: 'border-[var(--pro-azure-100)] dark:border-green-800/40',
                text: 'text-[var(--pro-azure-dark)] dark:text-green-200',
                icon: <Info size={13} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0 mt-0.5" /> },
    warning: { bar: 'bg-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/20',
                border: 'border-amber-200 dark:border-amber-800/40',
                text: 'text-amber-800 dark:text-amber-200',
                icon: <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" /> },
    success: { bar: 'bg-[var(--pro-azure-50)]0', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/20',
                border: 'border-[var(--pro-azure-100)] dark:border-green-800/40',
                text: 'text-[var(--pro-azure-dark)] dark:text-green-200',
                icon: <CheckCircle2 size={13} className="text-[var(--pro-azure)] shrink-0 mt-0.5" /> },
  }[type];
  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <div className={`w-1 rounded-full shrink-0 self-stretch ${cfg.bar}`} />
      {cfg.icon}
      <div className={`text-xs leading-relaxed ${cfg.text}`}>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children}
      </div>
    </div>
  );
};

// ── Tab type ─────────────────────────────────────────────────────────────────

type ModalTab = 'download' | 'setup' | 'sync' | 'plans';

// ── Main modal ────────────────────────────────────────────────────────────────

interface InvoiceModuleModalProps {
  show: boolean;
  onClose: () => void;
}

const InvoiceModuleModal: React.FC<InvoiceModuleModalProps> = ({ show, onClose }) => {
  const [tab, setTab] = useState<ModalTab>('download');
  const [manifest, setManifest] = useState<ClientManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const _token =
    localStorage.getItem('ovds_token') ??
    localStorage.getItem('auth0_token') ??
    localStorage.getItem('token') ?? '';

  const dlUrl = (os: string) => getInvoiceModuleDownloadUrl(
    os as 'windows' | 'linux-deb' | 'linux-appimage' | 'docker',
  );

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setManifest(await getInvoiceModuleManifest()); }
    catch (e: any) { setError(e?.response?.data?.message ?? e?.message ?? 'Could not load manifest'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (show) load(); }, [show, load]);

  // Close on Escape
  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, onClose]);

  if (!show) return null;

  const TABS: { id: ModalTab; label: string }[] = [
    { id: 'download', label: '⬇ Download' },
    { id: 'setup',    label: '⚙ Setup Guide' },
    { id: 'sync',     label: '🔄 Sync' },
    { id: 'plans',    label: '📋 Plans' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Invoice Module — Hybrid Deployment"
    >
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl
        max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800
          bg-slate-900 text-white rounded-t-2xl shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--pro-azure)] to-slate-600 flex items-center
            justify-center shrink-0 shadow-lg shadow-green-500/20">
            <Download size={17} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm text-white leading-tight">OVDS Invoice Module</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Hybrid cloud + on-premise · process invoices offline, sync automatically
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--pro-azure-50)]0/10 border
              border-[var(--pro-azure)]/20 rounded-full text-[10px] font-bold text-[var(--pro-azure-light)] uppercase tracking-wider">
              <Zap size={9} /> All plans
            </span>
            <button onClick={onClose} aria-label="Close"
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-slate-100 dark:border-slate-800
          bg-white dark:bg-slate-800/50 shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-700 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shadow-sm border border-slate-200 dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── DOWNLOAD TAB ─────────────────────────────────────────── */}
          {tab === 'download' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: <Cloud size={18} className="text-[var(--pro-azure)]" />, title: 'Cloud Account',
                    desc: 'Holds templates, VAT rules & ERCA keys' },
                  { icon: <RefreshCw size={18} className="text-amber-500" />, title: '↔ Auto Sync',
                    desc: 'Bidirectional sync over HTTPS when online' },
                  { icon: <Server size={18} className="text-slate-500 dark:text-slate-300" />, title: 'Invoice Module',
                    desc: 'Full invoice locally — no internet needed' },
                ].map(c => (
                  <div key={c.title} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-800/50 space-y-2">
                    <div className="flex justify-center">{c.icon}</div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>

              <Callout type="info">
                The Invoice Module is available on <strong>all plans</strong> — Starter, Business, and Enterprise.
                Your active subscription automatically unlocks plan-specific features locally.{' '}
                <Link to="/plans" onClick={onClose} className="font-bold underline hover:no-underline">View plans →</Link>
              </Callout>

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 size={13} className="animate-spin" /> Loading latest installer versions…
                </div>
              )}
              {error && (
                <Callout type="warning" title="Could not load live manifest">
                  {error} —{' '}
                  <button onClick={load} className="font-bold underline">retry</button> or{' '}
                  <a href="mailto:support@ovds.com.et" className="font-bold underline">contact support</a>.
                </Callout>
              )}

              {manifest && Array.isArray(manifest.platforms) && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Invoice Module v{manifest.version} · {manifest.releaseDate}
                  </p>
                  {manifest.platforms.map(p => (
                    <DownloadRow key={p.os} platform={p} dlUrl={dlUrl(p.os)} />
                  ))}
                </div>
              )}

              {!manifest && !loading && !error && (
                <div className="space-y-2">
                  {[
                    { os: 'Windows', file: 'ovds-invoice-module-setup.exe', icon: '🪟', size: '84 MB' },
                    { os: 'Linux (Debian)', file: 'ovds-invoice-module.deb', icon: '🐧', size: '69 MB' },
                    { os: 'Docker', file: 'docker pull ovds/invoice-module', icon: '🐳', size: '297 MB' },
                  ].map(d => (
                    <div key={d.os} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800
                      rounded-xl border border-slate-200 dark:border-slate-700 text-xs opacity-60 select-none">
                      <span className="text-xl shrink-0">{d.icon}</span>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{d.os}</p>
                        <p className="font-mono text-[10px] text-slate-400">{d.file}</p>
                        <p className="text-[10px] text-slate-400">{d.size}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4 p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20
                    border border-[var(--pro-azure-100)] dark:border-green-800/40 rounded-xl">
                    <p className="text-xs text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-semibold">
                      Sign in to access live download links with SHA-256 checksums.
                    </p>
                    <Link to="/login" onClick={onClose}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure)] text-white
                        rounded-xl text-[10px] font-bold hover:bg-[var(--pro-azure-dark)] transition-colors shrink-0">
                      Sign in <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              )}

              <Callout type="warning">
                Always download from your authenticated dashboard — never a third-party source.
                Verify the SHA-256 checksum before running.
              </Callout>

              <div className="flex items-center justify-end pt-2">
                <Link to="/getting-started/invoice-module" onClick={onClose}
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
                  Full setup guide <ExternalLink size={11} />
                </Link>
              </div>
            </div>
          )}

          {/* ── SETUP GUIDE TAB ──────────────────────────────────────── */}
          {tab === 'setup' && (
            <ol className="space-y-0">
              <StepItem n={1} title="Enable the On-Premise Client" badge="Required">
                <p>
                  Log in to your cloud dashboard at{' '}
                  <a href="https://ovds.com.et" target="_blank" rel="noopener noreferrer"
                    className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold hover:underline inline-flex items-center gap-0.5">
                    ovds.com.et <ExternalLink size={10} />
                  </a>.
                  Navigate to <strong>Settings → Downloads &amp; Apps</strong>.
                  Download the standalone <strong>Invoice Module installer</strong> for your OS.
                </p>
                <button onClick={() => setTab('download')}
                  className="flex items-center gap-1.5 text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold hover:underline">
                  <Download size={11} /> Go to downloads →
                </button>
              </StepItem>

              <StepItem n={2} title="Assign Cloud Privileges" badge="Cloud dashboard">
                <p>
                  In your cloud dashboard go to <strong>Settings → Downloads &amp; Apps → Node Management</strong>.
                  Click <strong>Add Workstation</strong>, enter a name (e.g. <em>Office invoice Station</em>),
                  and grant the module permission to operate as a <strong>Remote Terminal</strong> or
                  <strong> Connected Private Node</strong>.
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Node role', value: 'Remote Terminal — create invoices, record payments, access offline queue' },
                    { label: 'Scope',     value: 'Company-scoped — all data tied to your cloud company ID' },
                    { label: 'Revoke',    value: 'Remove the node from cloud settings at any time to cut access instantly' },
                  ].map(r => (
                    <div key={r.label} className="flex items-start gap-2 p-2 bg-white dark:bg-slate-800
                      rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <CheckCircle2 size={10} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
                      <span><strong className="text-slate-700 dark:text-slate-300">{r.label}</strong> — {r.value}</span>
                    </div>
                  ))}
                </div>
              </StepItem>

              <StepItem n={3} title="Configure Subscription Licensing" badge="Required">
                <p>
                  Run the installer. When prompted, link to your subscription using <strong>one of two methods</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)]
                    dark:border-green-800/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Key size={13} className="text-[var(--pro-azure)] shrink-0" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Option A — API Key</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Copy your API key from <strong>Account Dashboard</strong> and paste into the
                      <em> Cloud API Key</em> field during installation.
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/50 border border-slate-200
                    dark:border-slate-700 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-slate-500 shrink-0" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Option B — User Login</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sign in with your OVDS email and password. The module fetches your subscription
                      status and activates the correct plan features automatically.
                    </p>
                  </div>
                </div>
                <Callout type="success" title="Paying your plan online unlocks features locally">
                  Your active cloud subscription automatically unlocks premium invoice features on the local
                  machine — ERCA QR codes, multi-currency, VAT/TOT/WHT, and recurring invoices. No separate licence needed.
                </Callout>
              </StepItem>

              <StepItem n={4} title="Offline and Online Sync" last>
                <p>
                  Once installed, the module processes and stores documents locally.
                  When connected, it syncs automatically.
                </p>
                <button onClick={() => setTab('sync')}
                  className="flex items-center gap-1.5 text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold hover:underline">
                  <RefreshCw size={11} /> View sync details →
                </button>
              </StepItem>
            </ol>
          )}

          {/* ── SYNC TAB ─────────────────────────────────────────────── */}
          {tab === 'sync' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200
                  dark:border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <WifiOff size={13} className="text-rose-500 shrink-0" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Offline — stored locally</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {[
                      'Create, edit, and send invoices locally',
                      'Record payments into the offline queue',
                      'Apply cached VAT 15%, TOT, WHT rules',
                      'Generate ERCA QR codes using local key',
                      'Store all documents in local SQLite / MySQL',
                    ].map(i => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={10} className="text-[var(--pro-azure)] shrink-0 mt-0.5" /> {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)]
                  dark:border-green-800/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi size={13} className="text-[var(--pro-azure)] shrink-0" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Online — syncs automatically</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {[
                      'Upload queued invoices and payments to cloud',
                      'Update invoice templates from cloud',
                      'Refresh compliance features and tax rules',
                      'Sync VAT/TOT rates and proclamation changes',
                      'Push audit trail entries to cloud ledger',
                    ].map(i => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={10} className="text-[var(--pro-azure)] shrink-0 mt-0.5" /> {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Callout type="info" title="Sync interval">
                The module syncs every <strong>5 minutes</strong> when online. Configure in
                <strong> Invoice Module → Settings → Sync &amp; Connectivity</strong>.
                Force a sync anytime via the toolbar <strong>Sync Now</strong> button.
                Air-gapped use: set{' '}
                <code className="font-mono text-[11px] bg-[var(--pro-azure-100)] dark:bg-green-950/40 px-1 rounded">
                  SYNC_INTERVAL_SECONDS=0
                </code>{' '}
                — licensing is cached for 30 days.
              </Callout>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Local .env reference (key sync settings)
                  </p>
                </div>
                <pre className="p-4 text-[11px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto
                  bg-white dark:bg-slate-900 leading-relaxed whitespace-pre">{[
                  '# Cloud connection',
                  'OVDS_CLOUD_URL=https://ovds.com.et',
                  'OVDS_API_KEY=ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx',
                  'OVDS_NODE_TOKEN=ent_node_xxxxxxxxxxxxxxxxxxxxxxxx',
                  '',
                  '# Sync',
                  'OFFLINE_QUEUE_ENABLED=true',
                  'SYNC_INTERVAL_SECONDS=300   # 0 = air-gapped / manual only',
                  '',
                  '# Local database',
                  'LOCAL_DB_TYPE=sqlite         # sqlite | mysql',
                  'LOCAL_DB_PATH=./data/invoices.db',
                ].join('\n')}</pre>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border
                border-amber-200 dark:border-amber-800/40 rounded-xl">
                <Lock size={13} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Unsent invoices created offline are stored locally and queued for sync.
                  When connectivity returns, the queue drains automatically — invoices appear
                  in your cloud account within seconds.
                </p>
              </div>
            </div>
          )}

          {/* ── PLANS TAB ────────────────────────────────────────────── */}
          {tab === 'plans' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs min-w-[480px]">
                  <thead>
                    <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      {['Feature', 'Starter', 'Business', 'Enterprise'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-bold text-slate-500
                          uppercase tracking-wider text-[9px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Invoice Module download',            '✅', '✅', '✅'],
                      ['Offline invoice queue',              '✅', '✅', '✅'],
                      ['ERCA QR codes offline',              '✅', '✅', '✅'],
                      ['VAT 15% & DRRF auto-calculated',     '✅', '✅', '✅'],
                      ['Recurring invoices (local)',          '—',  '✅', '✅'],
                      ['Multi-currency offline',             '—',  '✅', '✅'],
                      ['Full GL & journal sync',             '—',  '✅', '✅'],
                      ['All 15 MoR tax types offline',       '—',  '✅', '✅'],
                      ['Unlimited workstation nodes',         '—',  '—',  '✅'],
                      ['Air-gapped / LAN deployment',        '—',  '—',  '✅'],
                      ['White-label invoice template',       '—',  '—',  '✅'],
                    ].map(([feat, ...vals]) => (
                      <tr key={feat} className="border-b border-slate-100 dark:border-slate-800
                        last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{feat}</td>
                        {vals.map((v, i) => (
                          <td key={i} className={`px-3 py-2 text-center text-sm ${
                            v === '✅' ? 'text-[var(--pro-azure)] font-black' : 'text-slate-300 dark:text-slate-700'
                          }`}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link to="/plans" onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--pro-azure)] text-white
                  rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all shadow-lg shadow-green-500/20">
                View all plans & upgrade <ArrowRight size={16} />
              </Link>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-100
          dark:border-slate-800 bg-white dark:bg-slate-800/50 shrink-0 rounded-b-2xl">
          <Link to="/getting-started/invoice-module" onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[var(--pro-azure)]
              dark:hover:text-[var(--pro-azure-light)] transition-colors">
            <ExternalLink size={12} /> Full documentation
          </Link>
          <button onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700
              dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600
              transition-colors">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModuleModal;
