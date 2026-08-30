/**
 * ClientDownload
 * ─────────────────────────────────────────────────────────────────────────────
 * Guides Enterprise plan users through downloading and configuring the local
 * OVDS Client, linking it to their cloud account, and enabling the
 * offline invoice queue with automatic cloud sync.
 *
 * Route: /getting-started/client
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  ArrowLeft, ArrowRight, Download, Cloud, Server, Key,
  CheckCircle2, RefreshCw, Shield, Wifi, WifiOff, Copy,
  Check, Crown, AlertTriangle, Globe, Lock, Zap, Info,
  ChevronDown, ChevronUp, ExternalLink, Plus, Trash2,
  Monitor, Loader2, Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getClientManifest,
  listNodes,
  registerNode,
  revokeNode,
  getDownloadUrl,
  type ClientManifest,
  type EnterpriseNode,
  type NewNodeResult,
} from '../services/clientApi';

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
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
          {copied ? <><Check size={10} className="text-emerald-400" /> Copied!</> : <><Copy size={10} /> Copy</>}
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
    info:    { bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800/40', text: 'text-emerald-800 dark:text-emerald-200', icon: <Info size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" /> },
    warning: { bar: 'bg-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/20',    border: 'border-amber-200 dark:border-amber-800/40',    text: 'text-amber-800 dark:text-amber-200',    icon: <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" /> },
    success: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800/40', text: 'text-emerald-800 dark:text-emerald-200', icon: <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> },
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
  n: number;
  title: string;
  badge?: string;
  last?: boolean;
  children: React.ReactNode;
}> = ({ n, title, badge, last, children }) => (
  <li className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold shrink-0 z-10">
        {n}
      </div>
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

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</span>
        {open
          ? <ChevronUp size={14} className="text-slate-400 shrink-0" />
          : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
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
// DownloadCard — one row per platform with collapsible SHA-256 verify panel
// ─────────────────────────────────────────────────────────────────────────────

const DownloadCard: React.FC<{
  icon: string;
  label: string;
  filename: string;
  size: string;
  sha256: string;
  isPending: boolean;
  downloadHref: string;
}> = ({ icon, label, filename, size, sha256, isPending, downloadHref }) => {
  const [showHash, setShowHash] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(sha256);
    setHashCopied(true);
    setTimeout(() => setHashCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      {/* Main row */}
      <div className="flex items-center gap-3 p-3 text-xs">
        <span className="text-xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-700 dark:text-slate-300">{label}</p>
          <p className="font-mono text-slate-400 text-[10px] truncate">{filename}</p>
          <p className="text-slate-400 text-[10px]">{size}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Verify integrity toggle */}
          <button
            onClick={() => setShowHash(v => !v)}
            title="Verify integrity"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
              showHash
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Shield size={9} />
            {showHash ? 'Hide' : 'Verify'}
          </button>
          {/* Download button */}
          <a
            href={downloadHref}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-colors"
          >
            <Download size={10} /> Download
          </a>
        </div>
      </div>

      {/* SHA-256 panel — slides open on toggle */}
      {showHash && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 bg-white dark:bg-slate-800/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Shield size={9} className="text-emerald-500" /> SHA-256 Checksum
          </p>
          {isPending ? (
            <p className="text-[10px] text-slate-400 italic">
              Checksum will be published when the installer build pipeline runs.
              Until then, only download from your authenticated cloud dashboard.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all leading-relaxed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-2 rounded-lg">
                {sha256}
              </code>
              <button
                onClick={copyHash}
                className="flex items-center gap-1 px-2.5 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors shrink-0"
              >
                {hashCopied ? <><Check size={9} /> Copied!</> : <><Copy size={9} /> Copy</>}
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
            Verify on Windows: <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700">Get-FileHash {filename} -Algorithm SHA256</code>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Verify on Linux / macOS: <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700">sha256sum {filename}</code>
          </p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const ClientDownload: React.FC = () => {
  usePageTitle('OVDS Enterprise Client — Hybrid Deployment');

  // ── Live data state ──────────────────────────────────────────────────────
  const [manifest, setManifest] = useState<ClientManifest | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);

  const [nodes, setNodes] = useState<EnterpriseNode[]>([]);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [nodesError, setNodesError] = useState<string | null>(null);

  const [registerLoading, setRegisterLoading] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeRole, setNewNodeRole] = useState<'REMOTE_TERMINAL' | 'PRIVATE_NODE'>('REMOTE_TERMINAL');
  const [newNodeResult, setNewNodeResult] = useState<NewNodeResult | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────
  const loadManifest = useCallback(async () => {
    setManifestLoading(true);
    setManifestError(null);
    try {
      const m = await getClientManifest();
      setManifest(m);
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? 'Could not load manifest';
      setManifestError(msg);
    } finally {
      setManifestLoading(false);
    }
  }, []);

  const loadNodes = useCallback(async () => {
    setNodesLoading(true);
    setNodesError(null);
    try {
      const list = await listNodes();
      setNodes(list);
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? 'Could not load nodes';
      setNodesError(msg);
    } finally {
      setNodesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManifest();
    loadNodes();
  }, [loadManifest, loadNodes]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!newNodeName.trim()) { toast.error('Enter a workstation name first'); return; }
    setRegisterLoading(true);
    try {
      const result = await registerNode(newNodeName.trim(), newNodeRole);
      setNewNodeResult(result);
      setNewNodeName('');
      setNodes(prev => [result, ...prev]);
      toast.success("Workstation registered. Copy the node token — it won't be shown again.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRevoke = async (nodeId: string, name: string) => {
    if (!window.confirm(`Revoke "${name}"? The local client will lose access on its next sync.`)) return;
    setRevokeLoadingId(nodeId);
    try {
      await revokeNode(nodeId);
      setNodes(prev => prev.filter(n => n.nodeId !== nodeId));
      toast.success(`Node "${name}" revoked`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Revocation failed');
    } finally {
      setRevokeLoadingId(null);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2500);
  };

  const fmtBytes = (b: number) => {
    if (b >= 1_000_000_000) return `${(b / 1_000_000_000).toFixed(1)} GB`;
    return `${(b / 1_000_000).toFixed(0)} MB`;
  };

  const OS_META: Record<string, { icon: string; label: string }> = {
    windows:        { icon: '🪟', label: 'Windows' },
    'linux-deb':    { icon: '🐧', label: 'Linux (Debian / Ubuntu)' },
    'linux-appimage': { icon: '🐧', label: 'Linux (AppImage)' },
    docker:         { icon: '🐳', label: 'Docker' },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Link to="/start" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5">
          <ArrowLeft size={12} /> Get Started
        </Link>
        <span className="text-slate-300">/</span>
        <Link to="/getting-started/on-premise" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          On-Premise
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 dark:text-slate-300">Enterprise Client</span>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-10 text-white shadow-2xl shadow-emerald-900/20">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-center gap-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-xl shadow-amber-400/20">
            <Download size={38} className="text-white" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full">
              <Crown size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Enterprise Plan · Hybrid Cloud + On-Premise</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              OVDS Enterprise Client
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Any Enterprise plan user can download the local OVDS Enterprise Client installer and configure a hybrid cloud-to-on-premises deployment.
              The client processes invoices and accounting data offline, then syncs automatically to your cloud account whenever internet is available —
              keeping templates, tax rules, and compliance features always up to date.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
              {[
                { icon: <WifiOff size={12} />, label: 'Works offline' },
                { icon: <RefreshCw size={12} />, label: 'Auto cloud sync' },
                { icon: <Shield size={12} />, label: 'Subscription linked' },
                { icon: <Lock size={12} />, label: 'Air-gapped ready' },
              ].map(f => (
                <span key={f.label} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deployment mode toggle */}
      <div className="ovds-widget-card p-2 shadow-sm max-w-3xl mx-auto overflow-hidden">
        <div className="grid grid-cols-3 gap-2">
          <Link to="/getting-started/cloud" className="flex items-center justify-center gap-2 p-5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
            <Cloud size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Cloud</p>
              <p className="text-[10px] text-slate-300 font-bold group-hover:text-emerald-500 transition-colors">SaaS</p>
            </div>
          </Link>
          <Link to="/getting-started/on-premise" className="flex items-center justify-center gap-2 p-5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
            <Server size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">On-Premise</p>
              <p className="text-[10px] text-slate-300 font-bold group-hover:text-emerald-500 transition-colors">Self-Hosted</p>
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 p-5 bg-amber-500 text-white rounded-xl shadow-xl shadow-amber-500/20">
            <Download size={20} className="shrink-0" />
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest">Enterprise</p>
              <p className="text-[10px] text-amber-100 font-bold opacity-80">Hybrid Client</p>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture overview */}
      <div className="ovds-widget-card p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">How hybrid deployment works</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The Enterprise Client connects your local workstation to your active OVDS cloud subscription as a connected private node.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            {
              icon: <Cloud size={22} className="text-emerald-500" />,
              title: 'Cloud Account',
              desc: 'Your active Enterprise subscription — holds templates, tax rules, compliance data and MoR credentials.',
              color: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40',
            },
            {
              icon: <RefreshCw size={22} className="text-amber-500" />,
              title: '↔ Sync',
              desc: 'Automatic bidirectional sync over HTTPS whenever the workstation is connected. Offline queue when disconnected.',
              color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40',
            },
            {
              icon: <Server size={22} className="text-slate-500 dark:text-slate-300" />,
              title: 'Enterprise Client',
              desc: 'Local installer on your workstation. Processes invoices and stores documents offline — full functionality without internet.',
              color: 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
            },
          ].map(c => (
            <div key={c.title} className={`p-5 rounded-2xl border ${c.color} space-y-3`}>
              <div className="flex justify-center">{c.icon}</div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <Callout type="info" title="Enterprise plan required">
          The hybrid Enterprise Client is exclusive to the <strong>Enterprise plan</strong>. On-premise, hybrid, and the offline invoice queue are not available on Starter or Business.{' '}
          <Link to="/plans" className="font-bold underline hover:no-underline">View plans →</Link>
        </Callout>
      </div>

      {/* Step-by-step setup */}
      <div className="ovds-widget-card p-8 shadow-sm">
        <div className="flex items-start gap-3 pb-6 border-b border-slate-200 dark:border-slate-700 mb-8">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
            <Zap size={16} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Setting Up Your Hybrid invoice</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Four steps from your cloud dashboard to a locally running Enterprise Client.</p>
          </div>
        </div>

        <ol className="space-y-0">
          <StepItem n={1} title="Enable the On-Premise Client" badge="Required">
            <p>
              Log in to your primary OVDS cloud accounting dashboard at{' '}
              <a href="https://ovds.com.et" target="_blank" rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5">
                ovds.com.et <ExternalLink size={10} />
              </a>.
              Navigate to <strong>Settings → Downloads &amp; Apps</strong> (or the <strong>Integrations &amp; API</strong> section in the sidebar).
            </p>
            <p>
              Under <strong>Enterprise Client</strong>, click <strong>Download Installer</strong>. Select the installer
              designated for your operating system — Windows (.exe), Linux (.deb / .AppImage), or Docker image.
            </p>
            {/* Live manifest download cards */}
            {manifestLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 size={13} className="animate-spin" /> Loading latest installer versions…
              </div>
            )}
            {manifestError && (
              <Callout type="warning" title="Could not load live manifest">
                {manifestError} — Upgrade to Enterprise plan to access downloads, or contact{' '}
                <a href="mailto:support@ovds.com.et" className="underline font-bold">support@ovds.com.et</a>.
              </Callout>
            )}
            {manifest && Array.isArray(manifest.platforms) && (
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Latest version: <span className="text-emerald-600 dark:text-emerald-400">v{manifest.version}</span>
                    <span className="ml-2 text-slate-400">({manifest.releaseDate})</span>
                  </span>
                </div>
                {manifest.platforms.map(p => {
                  const meta = OS_META[p.os] ?? { icon: '💾', label: p.os };
                  const isPending = p.sha256.startsWith('pending');
                  return (
                    <DownloadCard
                      key={p.os}
                      icon={meta.icon}
                      label={meta.label}
                      filename={p.filename}
                      size={fmtBytes(p.sizeBytes)}
                      sha256={p.sha256}
                      isPending={isPending}
                      downloadHref={getDownloadUrl(p.os)}
                    />
                  );
                })}
              </div>
            )}
            {!manifest && !manifestLoading && !manifestError && (
              <div className="space-y-3 mt-1">
                {/* Unauthenticated / non-Enterprise static preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {([
                    { os: 'Windows',       file: 'ovds-enterprise-client-setup.exe',         icon: '🪟', size: '84 MB' },
                    { os: 'Linux (Debian)', file: 'ovds-enterprise-client_amd64.deb',         icon: '🐧', size: '69 MB' },
                    { os: 'Docker',         file: 'ovds/enterprise-client:latest',            icon: '🐳', size: '297 MB' },
                  ] as const).map(d => (
                    <div key={d.os} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs opacity-60 select-none">
                      <span className="text-xl shrink-0">{d.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{d.os}</p>
                        <p className="font-mono text-slate-400 text-[10px] break-all leading-relaxed">{d.file}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{d.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <Crown size={16} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Enterprise plan required to download</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Upgrade to unlock all four platform installers with live SHA-256 checksums.</p>
                    </div>
                  </div>
                  <Link
                    to="/plans"
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold hover:bg-amber-600 transition-colors shrink-0 shadow-lg shadow-amber-500/20"
                  >
                    Upgrade <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            )}
            <Callout type="warning">
              Always download the installer directly from your authenticated cloud dashboard — never from a third-party source.
              Verify the SHA-256 checksum shown on the download page before running the installer.
            </Callout>
          </StepItem>

          <StepItem n={2} title="Assign Cloud Privileges" badge="Cloud dashboard">
            <p>
              In your OVDS cloud dashboard, go to <strong>Settings → Enterprise Client → Node Management</strong>.
              Click <strong>Add Workstation</strong> and enter a friendly name for this machine (e.g., <em>Office Workstation 1</em>).
            </p>
            <p>
              Grant the downloaded local module permission to operate as a <strong>Remote Terminal</strong> or
              <strong> Connected Private Node</strong>. This registers the workstation in your company's node list
              and generates a unique device token.
            </p>
            <div className="space-y-2 mt-1">
              {[
                { label: 'Node role', value: 'Remote Terminal — can create invoices, process payments, access offline queue' },
                { label: 'Scope', value: 'Company-scoped — all data is tied to your cloud company ID' },
                { label: 'Revocation', value: 'Remove the node from cloud settings at any time to instantly cut access' },
              ].map(r => (
                <div key={r.label} className="flex items-start gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-700 dark:text-slate-300">{r.label}</strong> — {r.value}</span>
                </div>
              ))}
            </div>
          </StepItem>

          <StepItem n={3} title="Configure Subscription Licensing" badge="Required">
            <p>
              Run the installer on your local workstation. When the setup wizard prompts for your cloud credentials,
              link the client to your active cloud subscription using <strong>one of the two methods</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Option A — API Key</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Copy your API key from <strong>ovds.com.et → Account Dashboard</strong> and paste it into the
                  <em> Cloud API Key</em> field during installation. Recommended for unattended or server deployments.
                </p>
                <CodeBlock code={`# In the installer wizard:\nCloud API Key: ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx\nNode Token:   ent_node_xxxxxxxxxxxxxxxxxxxxxxxx`} lang="env" />
              </div>
              <div className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Option B — User Login</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sign in with your OVDS account email and password. The client fetches the subscription status
                  and activates premium invoice features automatically. Use this for interactive workstations.
                </p>
              </div>
            </div>
            <Callout type="success" title="Subscription unlocks premium features">
              Paying your Enterprise plan online automatically unlocks all premium invoice features on your local machine — ERCA QR codes,
              multi-currency, MoR tax rules, WHT certificates, and the full offline invoice queue.
            </Callout>
          </StepItem>

          <StepItem n={4} title="Offline and Online Sync" last>
            <p>
              Once installed and linked, the Enterprise Client runs fully offline. Invoices, receipts, and accounting
              entries are processed and stored locally. Sync happens automatically in the background whenever your
              workstation has internet access.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <WifiOff size={14} className="text-rose-500 shrink-0" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Offline mode</p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {[
                    'Create and send invoices locally',
                    'Process payments into the offline queue',
                    'Apply cached tax rules (VAT 15%, TOT, WHT)',
                    'Generate ERCA QR codes using local key',
                    'Store all documents in local SQLite / MySQL',
                  ].map(i => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={10} className="text-emerald-500 shrink-0 mt-0.5" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Online sync (auto)</p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {[
                    'Upload queued invoices & transactions to cloud',
                    'Pull updated invoice templates from cloud',
                    'Refresh MoR compliance and tax rule updates',
                    'Sync VAT/TOT rates and proclamation changes',
                    'Push audit trail entries to cloud ledger',
                  ].map(i => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={10} className="text-emerald-500 shrink-0 mt-0.5" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Callout type="info" title="Sync interval">
              By default the client syncs every <strong>5 minutes</strong> when online. You can configure the interval in
              <strong> Enterprise Client → Settings → Sync &amp; Connectivity</strong> on your local installation.
              Forced sync is also available via the toolbar.
            </Callout>
          </StepItem>
        </ol>
      </div>

      {/* Environment variables reference */}
      <div className="ovds-widget-card p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Local configuration reference</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The Enterprise Client reads these variables from its local <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">.env</code> file.
            The installer pre-populates them from the wizard; edit manually only if needed.
          </p>
        </div>
        <CodeBlock lang="env" code={[
          '# ── Cloud connection ──────────────────────────────────────',
          'OVDS_CLOUD_URL=https://ovds.com.et',
          'OVDS_API_KEY=ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx',
          'OVDS_NODE_TOKEN=ent_node_xxxxxxxxxxxxxxxxxxxxxxxx',
          '',
          '# ── Offline queue ─────────────────────────────────────────',
          'OFFLINE_QUEUE_ENABLED=true',
          'OFFLINE_QUEUE_MAX_ITEMS=10000',
          'SYNC_INTERVAL_SECONDS=300',
          '',
          '# ── Local database (SQLite for standalone, MySQL for LAN) ─',
          'LOCAL_DB_TYPE=sqlite                # sqlite | mysql',
          'LOCAL_DB_PATH=./data/enterprise.db  # SQLite path',
          '# LOCAL_DB_URL=mysql://user:pass@127.0.0.1:3306/ovds_local',
          '',
          '# ── Tax rules cache ───────────────────────────────────────',
          'TAX_RULES_CACHE_TTL_HOURS=24',
          'MOR_ETAX_MODE=stub                  # stub | sandbox | live',
        ].join('\n')} />
      </div>

      {/* FAQ */}
      <div className="ovds-widget-card p-8 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
        <div className="space-y-3">
          <Accordion title="Does every Enterprise Client workstation need its own licence?" defaultOpen>
            No. The Enterprise plan covers unlimited workstations under a single company subscription.
            Each workstation registers as a separate node in your cloud dashboard, but they all share one plan.
            You can revoke individual nodes at any time.
          </Accordion>
          <Accordion title="What happens to offline invoices if I cancel my Enterprise plan?">
            The local client enters a read-only mode — you can view and export existing documents but cannot create new invoices.
            All locally stored data remains on your machine. Reconnecting with an active plan restores full functionality.
          </Accordion>
          <Accordion title="Can the Enterprise Client work in a completely air-gapped environment?">
            Yes. Set <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">SYNC_INTERVAL_SECONDS=0</code> to disable
            automatic sync. You can manually trigger a sync by plugging into a network and clicking <strong>Sync Now</strong> in the toolbar.
            Licensing validation is cached for 30 days, so short-term air-gapped use is supported out of the box.
          </Accordion>
          <Accordion title="Which tax rules are cached locally?">
            On every successful sync the client downloads: VAT 15% (Proc. 1341/2024), TOT 2%/10% (Proc. 1395/2025),
            WHT rates, PAYE progressive table, DRRF 1% (Reg. 570/2025), and the current ERCA invoice signing key.
            The cache TTL is configurable (default 24 h).
          </Accordion>
          <Accordion title="Can multiple Enterprise Client nodes sync to the same cloud company?">
            Yes — this is the intended use case. Each node uploads its offline queue independently; the cloud deduplicates
            entries by invoice number and transaction ID. Conflict resolution uses server-side timestamps.
          </Accordion>
        </div>
      </div>

      {/* Node Management Panel */}
      <div className="ovds-widget-card p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Node Management</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register and manage workstations connected to your cloud account.
            </p>
          </div>
          <button
            onClick={loadNodes}
            disabled={nodesLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all disabled:opacity-50"
          >
            <RefreshCw size={11} className={nodesLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Register new node form */}
        <div className="p-5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Add Workstation</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newNodeName}
              onChange={e => setNewNodeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              placeholder="e.g. Office Workstation 1"
              className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-slate-800 dark:text-white placeholder:text-slate-400"
            />
            <select
              value={newNodeRole}
              onChange={e => setNewNodeRole(e.target.value as any)}
              className="px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300"
            >
              <option value="REMOTE_TERMINAL">Remote Terminal</option>
              <option value="PRIVATE_NODE">Private Node</option>
            </select>
            <button
              onClick={handleRegister}
              disabled={registerLoading || !newNodeName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-emerald-500/20"
            >
              {registerLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Register
            </button>
          </div>
        </div>

        {/* New node token reveal */}
        {newNodeResult && (
          <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Node token for <strong>{newNodeResult.friendlyName}</strong> — copy it now, it won't be shown again.
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/40">
              <code className="text-xs font-mono text-slate-600 dark:text-slate-300 flex-1 break-all select-all">
                {newNodeResult.nodeToken}
              </code>
              <button
                onClick={() => copyToken(newNodeResult.nodeToken)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-colors shrink-0"
              >
                {tokenCopied ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              Node ID: <code className="font-mono">{newNodeResult.nodeId}</code> · Paste both into the Enterprise Client installer wizard.
            </p>
          </div>
        )}

        {/* Node list */}
        {nodesError && (
          <Callout type="warning">{nodesError}</Callout>
        )}
        {nodesLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
            <Loader2 size={13} className="animate-spin" /> Loading nodes…
          </div>
        )}
        {!nodesLoading && !nodesError && nodes.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Monitor size={28} className="text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-400">No workstations registered yet.</p>
            <p className="text-xs text-slate-400">Add one above to get your node token.</p>
          </div>
        )}
        {!nodesLoading && nodes.length > 0 && (
          <div className="space-y-2">
            {nodes.map(node => (
              <div
                key={node.nodeId}
                className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Monitor size={15} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{node.friendlyName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {node.role === 'REMOTE_TERMINAL' ? 'Remote Terminal' : 'Private Node'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">{node.nodeId}</span>
                    </div>
                    {node.lastSeenAt && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={9} className="text-emerald-500 shrink-0" />
                        <span className="text-[10px] text-slate-400">
                          Last sync: {new Date(node.lastSeenAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(node.nodeId, node.friendlyName)}
                  disabled={revokeLoadingId === node.nodeId}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                >
                  {revokeLoadingId === node.nodeId
                    ? <Loader2 size={10} className="animate-spin" />
                    : <Trash2 size={10} />}
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link to="/getting-started/on-premise" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} /> On-Premise Guide
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/getting-started/cloud" className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
            Cloud Setup
          </Link>
          <Link to="/plans" className="flex items-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-2xl text-sm font-bold hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20">
            View Enterprise Plan <ArrowRight size={18} />
          </Link>
        </div>
      </div>

    </div>
  );
};

export default ClientDownload;
