/**
 * InvoiceModuleDownload
 * ─────────────────────────────────────────────────────────────────────────────
 * Any invoice user can achieve a hybrid cloud-to-on-premises deployment by
 * downloading the standalone OVDS Invoice Module client. It connects to the
 * cloud account, processes invoices offline, and syncs automatically.
 *
 * Route: /getting-started/invoice-module  (public — no auth required)
 */
import {
  ArrowLeft, ArrowRight, Download, Cloud, Server, Key,
  CheckCircle2, RefreshCw, Shield, Wifi, WifiOff, Copy,
  Check, AlertTriangle, Globe, Lock, Zap, Info,
  ChevronDown, ChevronUp, ExternalLink, FileText,
  Loader2,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { usePageTitle } from '../hooks/usePageTitle';
import {
  getInvoiceModuleManifest,
  getInvoiceModuleDownloadUrl,
  type ClientManifest,
} from '../services/clientApi';

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives (self-contained — no external deps)
// ─────────────────────────────────────────────────────────────────────────────

const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang = 'bash' }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#0d1117] text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-700">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
        >
          {copied ? <><Check size={10} className="text-[var(--pro-azure-light)]" /> Copied!</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
};

const Callout: React.FC<{
  type?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children: React.ReactNode;
}> = ({ type = 'info', title, children }) => {
  const cfg = {
    info:    { bar: 'bg-[var(--pro-azure-50)]0', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/20', border: 'border-[var(--pro-azure-100)] dark:border-green-800/40', text: 'text-[var(--pro-azure-dark)] dark:text-green-200', icon: <Info size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0 mt-0.5" /> },
    warning: { bar: 'bg-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/20',    border: 'border-amber-200 dark:border-amber-800/40',    text: 'text-amber-800 dark:text-amber-200',    icon: <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" /> },
    success: { bar: 'bg-[var(--pro-azure-50)]0', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/20', border: 'border-[var(--pro-azure-100)] dark:border-green-800/40', text: 'text-[var(--pro-azure-dark)] dark:text-green-200', icon: <CheckCircle2 size={14} className="text-[var(--pro-azure)] shrink-0 mt-0.5" /> },
    danger:  { bar: 'bg-rose-500',   bg: 'bg-rose-50 dark:bg-rose-950/20',      border: 'border-rose-200 dark:border-rose-900/40',      text: 'text-rose-800 dark:text-rose-200',      icon: <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" /> },
  }[type];
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <div className={`w-1 rounded-full shrink-0 self-stretch ${cfg.bar}`} />
      {cfg.icon}
      <div className={`text-xs leading-relaxed ${cfg.text}`}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        {children}
      </div>
    </div>
  );
};

const StepItem: React.FC<{
  n: number; title: string; badge?: string; last?: boolean; children: React.ReactNode;
}> = ({ n, title, badge, last, children }) => (
  <li className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-[var(--pro-azure)] text-white flex items-center justify-center text-xs font-semibold shrink-0 z-10">{n}</div>
      {!last && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />}
    </div>
    <div className={`flex-1 min-w-0 ${last ? 'pb-0' : 'pb-8'}`}>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-current/10">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">{children}</div>
    </div>
  </li>
);

const Accordion: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({
  title, defaultOpen = false, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</span>
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-sm text-slate-600 dark:text-slate-400">
          {children}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Download card with SHA-256 verify panel
// ─────────────────────────────────────────────────────────────────────────────

const OS_META: Record<string, { icon: string; label: string }> = {
  windows:          { icon: '🪟', label: 'Windows (.exe)' },
  'linux-deb':      { icon: '🐧', label: 'Linux — Debian / Ubuntu (.deb)' },
  'linux-appimage': { icon: '🐧', label: 'Linux — AppImage' },
  docker:           { icon: '🐳', label: 'Docker image' },
};

const fmtBytes = (b: number) => b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`;

const DownloadCard: React.FC<{
  icon: string; label: string; filename: string;
  size: string; sha256: string; downloadHref: string;
}> = ({ icon, label, filename, size, sha256, downloadHref }) => {
  const [showHash, setShowHash]   = useState(false);
  const [hashCopied, setHashCopied] = useState(false);
  const isPending = sha256.startsWith('pending');

  const copyHash = () => {
    navigator.clipboard.writeText(sha256);
    setHashCopied(true);
    setTimeout(() => setHashCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 p-3 text-xs">
        <span className="text-xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-700 dark:text-slate-300">{label}</p>
          <p className="font-mono text-[10px] text-slate-400 truncate mt-0.5">{filename}</p>
          <p className="text-[10px] text-slate-400">{size}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHash(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
              showHash
                ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-light)] dark:border-green-700 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Shield size={9} /> {showHash ? 'Hide' : 'Verify'}
          </button>
          <a
            href={downloadHref}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[10px] font-bold hover:bg-[var(--pro-azure-dark)] transition-colors"
          >
            <Download size={10} /> Download
          </a>
        </div>
      </div>
      {showHash && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 bg-white dark:bg-slate-800/50 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Shield size={9} className="text-[var(--pro-azure)]" /> SHA-256 Checksum
          </p>
          {isPending ? (
            <p className="text-[10px] text-slate-400 italic">Checksum published when the build pipeline runs. Download only from your authenticated dashboard.</p>
          ) : (
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-2 rounded-lg leading-relaxed">{sha256}</code>
              <button onClick={copyHash} className="flex items-center gap-1 px-2.5 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[10px] font-bold hover:bg-[var(--pro-azure-dark)] transition-colors shrink-0">
                {hashCopied ? <><Check size={9} /> Copied!</> : <><Copy size={9} /> Copy</>}
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-400">Windows: <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700">Get-FileHash {filename} -Algorithm SHA256</code></p>
          <p className="text-[10px] text-slate-400">Linux / macOS: <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700">sha256sum {filename}</code></p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const InvoiceModuleDownload: React.FC = () => {
  usePageTitle('OVDS Invoice Module — Hybrid Deployment');

  const [manifest, setManifest]       = useState<ClientManifest | null>(null);
  const [manifestLoading, setMLoading] = useState(false);
  const [manifestError, setMError]    = useState<string | null>(null);

  const loadManifest = useCallback(async () => {
    setMLoading(true); setMError(null);
    try { setManifest(await getInvoiceModuleManifest()); }
    catch (e: any) { setMError(e?.response?.data?.message ?? e?.message ?? 'Could not load manifest'); }
    finally { setMLoading(false); }
  }, []);

  useEffect(() => { loadManifest(); }, [loadManifest]);

  const dlUrl = (os: string) => getInvoiceModuleDownloadUrl(
    os as 'windows' | 'linux-deb' | 'linux-appimage' | 'docker',
  );
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Link to="/sales/invoices" className="hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors flex items-center gap-1.5">
          <ArrowLeft size={12} /> Invoices
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 dark:text-slate-300">Invoice Module Download</span>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-10 text-white shadow-2xl shadow-green-900/20">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--pro-azure-light)]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[var(--pro-azure-light)]/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-center gap-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--pro-azure)] to-slate-700 flex items-center justify-center shrink-0 shadow-xl shadow-green-500/20">
            <FileText size={38} className="text-white" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 rounded-full">
              <Zap size={12} className="text-[var(--pro-azure-light)]" />
              <span className="text-[10px] font-bold text-[var(--pro-azure-light)] uppercase tracking-widest">Hybrid Cloud + On-Premise · Invoice Module</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">OVDS Invoice Module</h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Any invoice user can achieve a hybrid cloud-to-on-premises deployment by downloading the standalone OVDS Invoice Module client.
              It connects to your cloud account, processes invoices offline, and syncs templates, tax rules, and compliance features automatically — just like QuickBooks Desktop or NetSuite's local client.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
              {[
                { icon: <WifiOff size={12} />, label: 'Process invoices offline' },
                { icon: <RefreshCw size={12} />, label: 'Auto cloud sync' },
                { icon: <Shield size={12} />,   label: 'Subscription linked' },
                { icon: <Lock size={12} />,     label: 'Air-gapped ready' },
              ].map(f => (
                <span key={f.label} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="ovds-widget-card p-8 space-y-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">How hybrid invoice works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: <Cloud size={22} className="text-[var(--pro-azure)]" />, title: 'Cloud Account', desc: 'Active subscription — holds templates, VAT/TOT rules, ERCA keys, and MoR credentials.', color: 'bg-[var(--pro-azure-50)] dark:bg-green-950/20 border-[var(--pro-azure-100)] dark:border-green-800/40' },
            { icon: <RefreshCw size={22} className="text-amber-500" />, title: '↔ Auto Sync', desc: 'Invoice data, templates, and compliance updates flow bidirectionally over HTTPS when online.', color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40' },
            { icon: <Server size={22} className="text-slate-500 dark:text-slate-300" />, title: 'Invoice Module', desc: 'Local installer on your workstation. Full invoice with ERCA QR codes — no internet needed.', color: 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' },
          ].map(c => (
            <div key={c.title} className={`p-5 rounded-2xl border ${c.color} space-y-3`}>
              <div className="flex justify-center">{c.icon}</div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
        <Callout type="info">
          The Invoice Module is available on <strong>all plans</strong> — Starter, Business, and Enterprise.
          Your active subscription unlocks plan-specific features locally (recurring invoices on Business+, IFRS on Enterprise).{' '}
          <Link to="/plans" className="font-bold underline hover:no-underline">View plans →</Link>
        </Callout>
      </div>

      {/* Step-by-step hybrid invoice setup */}
      <div className="ovds-widget-card p-8 shadow-sm">
        <div className="flex items-start gap-3 pb-6 border-b border-slate-200 dark:border-slate-700 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 flex items-center justify-center shrink-0 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
            <Zap size={16} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Setting Up Your Hybrid invoice</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Four steps from your cloud dashboard to a locally running Invoice Module.</p>
          </div>
        </div>

        <ol className="space-y-0">
          {/* Step 1 */}
          <StepItem n={1} title="Enable the On-Premise Client" badge="Required">
            <p>
              Log in to your primary OVDS cloud accounting dashboard at{' '}
              <a href="https://ovds.com.et" target="_blank" rel="noopener noreferrer"
                className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold hover:underline inline-flex items-center gap-0.5">
                ovds.com.et <ExternalLink size={10} />
              </a>.
              Navigate to <strong>Settings → Downloads &amp; Apps</strong> or the <strong>Integrations &amp; API</strong> sidebar section.
            </p>
            <p>
              Download the specific <strong>standalone Invoice Module installer</strong> designated for your workstation.
              Select the build for your operating system — Windows, Linux, or Docker.
            </p>

            {/* Live manifest */}
            {manifestLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 size={13} className="animate-spin" /> Loading latest installer versions…
              </div>
            )}
            {manifestError && (
              <Callout type="warning" title="Could not load live manifest">
                {manifestError} — contact <a href="mailto:support@ovds.com.et" className="underline font-bold">support@ovds.com.et</a>
              </Callout>
            )}
            {manifest && Array.isArray(manifest.platforms) && (
              <div className="space-y-2 mt-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Invoice Module v{manifest.version} · {manifest.releaseDate}
                </p>
                {manifest.platforms.map(p => {
                  const meta = OS_META[p.os] ?? { icon: '💾', label: p.os };
                  return (
                    <DownloadCard
                      key={p.os}
                      icon={meta.icon}
                      label={meta.label}
                      filename={p.filename}
                      size={fmtBytes(p.sizeBytes)}
                      sha256={p.sha256}
                      downloadHref={dlUrl(p.os)}
                    />
                  );
                })}
              </div>
            )}
            {!manifest && !manifestLoading && !manifestError && (
              <div className="space-y-2 mt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { os: 'Windows', file: 'ovds-invoice-module-setup.exe',   icon: '🪟', size: '84 MB' },
                    { os: 'Linux (Debian)', file: 'ovds-invoice-module.deb',  icon: '🐧', size: '69 MB' },
                    { os: 'Docker', file: 'docker pull ovds/invoice-module',   icon: '🐳', size: '297 MB' },
                  ].map(d => (
                    <div key={d.os} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs opacity-60 select-none">
                      <span className="text-xl shrink-0">{d.icon}</span>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{d.os}</p>
                        <p className="font-mono text-[10px] text-slate-400 break-all">{d.file}</p>
                        <p className="text-[10px] text-slate-400">{d.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4 p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800/40 rounded-2xl">
                  <p className="text-xs text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-semibold">
                    Log in to your dashboard to access live download links with SHA-256 checksums.
                  </p>
                  <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-[10px] font-bold hover:bg-[var(--pro-azure-dark)] transition-colors shrink-0 shadow-lg shadow-green-500/20">
                    Sign in <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            )}
            <Callout type="warning">
              Always download from your authenticated cloud dashboard — never a third-party source.
              Verify the SHA-256 checksum before running.
            </Callout>
          </StepItem>

          {/* Step 2 */}
          <StepItem n={2} title="Assign Cloud Privileges" badge="Cloud dashboard">
            <p>
              In your OVDS cloud dashboard, go to <strong>Settings → Downloads &amp; Apps → Node Management</strong>.
              Click <strong>Add Workstation</strong> and enter a friendly name for this machine
              (e.g. <em>Office invoice Station</em>).
            </p>
            <p>
              Grant the downloaded local Invoice Module permission to operate as a
              <strong> Remote Terminal</strong> or <strong>Connected Private Node</strong>.
              This registers the workstation in your company's node list and generates a unique device token.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Node role',   value: 'Remote Terminal — create invoices, record payments, access offline queue' },
                { label: 'Scope',       value: 'Company-scoped — all invoice data is tied to your cloud company ID' },
                { label: 'Revocation',  value: 'Remove the node from cloud settings at any time to cut access instantly' },
              ].map(r => (
                <div key={r.label} className="flex items-start gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <CheckCircle2 size={11} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0 mt-0.5" />
                  <span><strong className="text-slate-700 dark:text-slate-300">{r.label}</strong> — {r.value}</span>
                </div>
              ))}
            </div>
          </StepItem>

          {/* Step 3 */}
          <StepItem n={3} title="Configure Subscription Licensing" badge="Required">
            <p>
              Run the installer on your local workstation. When the setup wizard prompts for cloud credentials,
              link the Invoice Module to your active subscription using <strong>one of the two methods</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Option A — API Key</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Copy your API key from <strong>ovds.com.et → Account Dashboard</strong> and paste it into
                  the <em>Cloud API Key</em> field during installation. Recommended for unattended workstations.
                </p>
                <CodeBlock lang="env" code={`# Installer wizard fields:\nCloud API Key: ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx\nNode Token:   ent_node_xxxxxxxxxxxxxxxxxxxxxxxx`} />
              </div>
              <div className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Option B — User Login</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sign in with your OVDS account email and password. The module fetches your subscription
                  status and activates the correct plan features automatically.
                  Use this for interactive workstations where users log in directly.
                </p>
              </div>
            </div>
            <Callout type="success" title="Paying your plan online unlocks features locally">
              Your active cloud subscription automatically unlocks premium invoice features on the local machine —
              ERCA QR codes, multi-currency, VAT/TOT/WHT calculations, recurring invoices (Business+),
              and the full offline invoice queue. No separate licence purchase required.
            </Callout>
          </StepItem>

          {/* Step 4 */}
          <StepItem n={4} title="Offline and Online Sync" last>
            <p>
              Once installed and linked, the Invoice Module processes and stores all documents locally.
              Whenever your system is connected to the internet, it communicates with the cloud to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <WifiOff size={14} className="text-rose-500 shrink-0" />
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
              <div className="p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0" />
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
              The module syncs every <strong>5 minutes</strong> when online. Configure the interval in
              <strong> Invoice Module → Settings → Sync &amp; Connectivity</strong>.
              Force a sync anytime via the toolbar <strong>Sync Now</strong> button.
              Air-gapped use: set <code className="font-mono text-[11px] bg-[var(--pro-azure-100)] dark:bg-green-950/40 px-1 rounded">SYNC_INTERVAL_SECONDS=0</code> — licensing is cached for 30 days.
            </Callout>
          </StepItem>
        </ol>
      </div>

      {/* Local .env reference */}
      <div className="ovds-widget-card p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Local configuration reference</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The Invoice Module reads these variables from its local{' '}
            <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">.env</code> file.
            The installer wizard pre-populates them; edit only if needed.
          </p>
        </div>
        <CodeBlock lang="env" code={[
          '# ── Cloud connection ──────────────────────────────────────────',
          'OVDS_CLOUD_URL=https://ovds.com.et',
          'OVDS_API_KEY=ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx',
          'OVDS_NODE_TOKEN=ent_node_xxxxxxxxxxxxxxxxxxxxxxxx',
          '',
          '# ── Offline invoice queue ─────────────────────────────────────',
          'OFFLINE_QUEUE_ENABLED=true',
          'OFFLINE_QUEUE_MAX_ITEMS=10000',
          'SYNC_INTERVAL_SECONDS=300       # 0 = air-gapped / manual only',
          '',
          '# ── Local database ────────────────────────────────────────────',
          'LOCAL_DB_TYPE=sqlite            # sqlite | mysql',
          'LOCAL_DB_PATH=./data/invoices.db',
          '# LOCAL_DB_URL=mysql://user:pass@127.0.0.1:3306/ovds_invoices',
          '',
          '# ── Tax rules cache ───────────────────────────────────────────',
          'TAX_RULES_CACHE_TTL_HOURS=24',
          'MOR_ETAX_MODE=stub              # stub | sandbox | live',
          'COMPANY_TIN=000000000000000     # 15-digit TIN from MoR',
        ].join('\n')} />
      </div>

      {/* What plan do I need? */}
      <div className="ovds-widget-card p-8 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">What plan do I need?</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs min-w-[540px]">
            <thead>
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {['Feature', 'Starter', 'Business', 'Enterprise'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Invoice Module download',           '✅', '✅', '✅'],
                ['Offline invoice queue',             '✅', '✅', '✅'],
                ['ERCA QR codes offline',             '✅', '✅', '✅'],
                ['VAT 15% & DRRF 1% auto-calculated', '✅', '✅', '✅'],
                ['Recurring invoices (local)',         '—',  '✅', '✅'],
                ['Multi-currency offline',             '—',  '✅', '✅'],
                ['Full GL & journal sync',             '—',  '✅', '✅'],
                ['All 15 MoR tax types offline',       '—',  '✅', '✅'],
                ['Unlimited workstation nodes',        '—',  '—',  '✅'],
                ['Air-gapped / LAN deployment',        '—',  '—',  '✅'],
                ['White-label invoice template',       '—',  '—',  '✅'],
              ].map(([feat, ...vals]) => (
                <tr key={feat} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{feat}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={`px-4 py-2.5 text-center ${v === '✅' ? 'text-[var(--pro-azure)] font-black' : 'text-slate-300 dark:text-slate-700'}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="ovds-widget-card p-8 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
        <div className="space-y-3">
          <Accordion title="Is the Invoice Module the same as the Enterprise Client?" defaultOpen>
            The Invoice Module is a focused, lightweight installer for invoice workflows only — available on all plans.
            The full <strong>Enterprise Client</strong> includes the complete OVDS suite (GL, HR, payroll, tax filings) and requires the Enterprise plan.
            Both share the same offline queue and cloud sync infrastructure.
          </Accordion>
          <Accordion title="How are invoice templates updated offline?">
            On every successful sync the module pulls the latest invoice templates from your cloud account.
            Templates include your logo, colour scheme, footer text, and any white-label customisations you have configured in <strong>Settings → White Label</strong>.
            Cached templates are used when offline; they update automatically on the next sync.
          </Accordion>
          <Accordion title="Can I use multiple Invoice Module workstations?">
            Yes — each workstation registers as a separate node. On Starter and Business plans,
            the number of simultaneous nodes is limited to your plan's user count.
            Enterprise has unlimited nodes and supports LAN-only or air-gapped deployments.
          </Accordion>
          <Accordion title="What happens to unsent invoices if I go offline?">
            Invoices created offline are stored in the local database and queued for sync.
            When connectivity returns, the queue drains automatically — invoices appear in your cloud
            account within seconds. You can monitor the queue in{' '}
            <strong>Invoice Module → Sync Status</strong> or the cloud dashboard's <strong>Offline Queue</strong> panel.
          </Accordion>
          <Accordion title="How do I update the Invoice Module when a new version ships?">
            The module checks for updates on every sync. When a new version is available,
            a banner appears in the toolbar. Click <strong>Update Now</strong> — the installer
            downloads, applies, and restarts the module automatically.
            For air-gapped environments, download the new installer from <strong>Settings → Downloads &amp; Apps</strong>
            and run it manually on each workstation.
          </Accordion>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link to="/sales/invoices" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/getting-started/client" className="text-sm font-bold text-slate-500 hover:text-[var(--pro-azure)] transition-colors">
            Full Enterprise Client Guide
          </Link>
          <Link
            to="/plans"
            className="flex items-center gap-2 px-8 py-4 bg-[var(--pro-azure)] text-white rounded-2xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-all shadow-xl shadow-green-500/20"
          >
            View Plans <ArrowRight size={18} />
          </Link>
        </div>
      </div>

    </div>
  );
};

export default InvoiceModuleDownload;
