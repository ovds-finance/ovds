/**
 * SetupGuide — ovds-style documentation hub for Cloud and On-Premise setup.
 * Sidebar nav + anchored sections + collapsible accordions + copy-able code blocks.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, Copy, CheckCircle2, Terminal, Cloud, Server,
  Key, Globe, AlertTriangle, Info, ChevronDown, ChevronUp,
  ExternalLink, Package, Settings, Database, RefreshCw,
  Bug, ArrowRight, BookOpen, Zap, Shield, Users, Download,
} from 'lucide-react';
import { FRONTEND_URL, API_URL } from '../utils/constants';

interface SetupGuideProps {
  defaultMode?: 'cloud' | 'on-premise';
}

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------

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

const Callout: React.FC<{ type?: 'info' | 'warning' | 'success' | 'danger'; title?: string; children: React.ReactNode }> = ({
  type = 'info', title, children,
}) => {
  const cfg = {
    info:    { bar: 'bg-emerald-500',   bg: 'bg-emerald-50 dark:bg-emerald-950/20',   border: 'border-emerald-200 dark:border-emerald-800/40',   text: 'text-emerald-800 dark:text-emerald-200',   icon: <Info size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" /> },
    warning: { bar: 'bg-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-800 dark:text-amber-200', icon: <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" /> },
    success: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800/40', text: 'text-emerald-800 dark:text-emerald-200', icon: <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> },
    danger:  { bar: 'bg-rose-500',     bg: 'bg-rose-50 dark:bg-rose-950/20',     border: 'border-rose-200 dark:border-rose-800/40',     text: 'text-rose-800 dark:text-rose-200',     icon: <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" /> },
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

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-current/10 ${color}`}>
    {children}
  </span>
);

const SectionHeading: React.FC<{ id: string; icon: React.ReactNode; title: string; subtitle?: string }> = ({ id, icon, title, subtitle }) => (
  <div id={id} className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-700 mb-6 scroll-mt-6">
    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
      {icon}
    </div>
    <div>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
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

const RequirementRow: React.FC<{ label: string; value: string; note?: string; met?: boolean }> = ({ label, value, note, met }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <div className="flex items-center gap-2">
      {met !== undefined && (
        met
          ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
          : <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
      )}
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
    </div>
    <div className="text-right">
      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{value}</span>
      {note && <p className="ovds-caption mt-0.5">{note}</p>}
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Cloud Setup Sections
// -----------------------------------------------------------------------------

const CloudSetup: React.FC = () => (
  <div className="space-y-10">
    {/* Overview */}
    <section>
      <SectionHeading id="cloud-overview" icon={<Cloud size={16} />} title="OVDS Cloud" subtitle="Hosted at ovds.com.et — no installation, no server, no maintenance." />
      <div className="ovds-grid-layout cols-3 mb-5">
        {[
          { icon: <Zap size={15} />, label: 'Instant setup', desc: 'Sign up and go — no server needed' },
          { icon: <RefreshCw size={15} />, label: 'Auto updates', desc: 'Always on the latest version' },
          { icon: <Shield size={15} />, label: 'Managed backups', desc: 'Daily backups, 99.9% uptime SLA' },
        ].map(f => (
          <div key={f.label} className="flex items-start gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl">
            <div className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">{f.icon}</div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{f.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <Callout type="info">
        No credit card required to start. All plans include a <strong>14-day free trial</strong>. Visit{' '}
        <a href="https://ovds.com.et" target="_blank" rel="noopener noreferrer" className="font-bold underline inline-flex items-center gap-0.5">
          ovds.com.et <ExternalLink size={10} />
        </a>
      </Callout>
    </section>

    {/* Steps */}
    <section>
      <SectionHeading id="cloud-steps" icon={<BookOpen size={16} />} title="Getting Started" subtitle="From sign-up to your first invoice in under 10 minutes." />
      <ol className="space-y-0">
        {[
          {
            n: 1, title: 'Create your account',
            content: (
              <>
                <p>Visit <a href="https://ovds.com.et" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1">ovds.com.et <ExternalLink size={11} /></a> and click <strong>Get Started</strong> in the top-right corner.</p>
                <ul className="space-y-1.5 text-xs mt-2">
                  {[
                    'Select Start on the next screen.',
                    'Enter your Name, Email, and Password.',
                    'Check the Terms and Conditions box.',
                    'Click Create New Account.',
                    'Check your inbox and click Confirm email address to activate your account.',
                  ].map(i => (
                    <li key={i} className="flex items-start gap-2"><ArrowRight size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />{i}</li>
                  ))}
                </ul>
              </>
            ),
          },
          {
            n: 2, title: 'Log in and get your API Key',
            content: (
              <>
                <p>Go to <a href="https://ovds.com.et/login" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1">ovds.com.et/login <ExternalLink size={11} /></a> and enter your account details.</p>
                <p className="mt-2">Your <strong>API Key</strong> is displayed at the top of the Account Dashboard. Click it to copy.</p>
                <div className="mt-3 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">API Key on Account Dashboard</p>
                  <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                      <Key size={12} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <code className="text-xs font-mono text-slate-500 blur-[3px] select-none flex-1">ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx</code>
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Copy size={9} /> Copy
                    </div>
                  </div>
                </div>
                <Callout type="info">Keep your API key private — it is tied to your plan and billing. Never share it publicly.</Callout>
              </>
            ),
          },
          {
            n: 3, title: 'Set up your first company', badge: 'Required',
            content: (
              <>
                <p>Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">W</kbd> or go to <strong>System Administration → Setup Wizard</strong>. Paste your API key when prompted in the Company Setup Wizard.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {[
                    { k: 'Company name', v: 'Your legal or trading name' },
                    { k: 'TIN', v: '15-digit Tax Identification Number' },
                    { k: 'Business type', v: 'Determines IFRS tier' },
                    { k: 'Fiscal year start', v: 'Month 7 (July) for Ethiopian FY' },
                  ].map(r => (
                    <div key={r.k} className="flex items-start gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div><span className="font-bold text-slate-700 dark:text-slate-300">{r.k}</span> — <span className="text-slate-500">{r.v}</span></div>
                    </div>
                  ))}
                </div>
                <Callout type="warning">TIN must be exactly 15 digits — it appears on all ERCA-compliant invoices and VAT filings.</Callout>
              </>
            ),
          },
          {
            n: 4, title: 'Seed chart of accounts',
            content: <p>Go to <strong>Accounting → Chart of Accounts</strong> and click <strong>Seed Ethiopian Defaults</strong>. This creates ~40 standard accounts aligned with Ethiopian accounting practice and IFRS classification.</p>,
          },
          {
            n: 5, title: 'Add employees and configure payroll',
            content: (
              <p>Go to <strong>HR → Employees → Add Employee</strong> or use the bulk CSV import. For each employee set: basic salary, pension rate (7% employee / 11% employer), bank details, department and shift.</p>
            ),
          },
          {
            n: 6, title: 'Send your first invoice',
            content: (
              <>
                <p>Navigate to <strong>ovds → Invoices → New Invoice</strong>. Add a customer, line items, and click <strong>Send</strong>. OVDS automatically generates an ERCA QR code, posts a double-entry journal, and decrements inventory.</p>
                <Callout type="success">You're live! Your first invoice is ready to send.</Callout>
              </>
            ),
          },
        ].map(({ n, title, badge, content }) => (
          <li key={n} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold shrink-0 z-10">{n}</div>
              <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
            </div>
            <div className="flex-1 pb-8 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
                {badge && <Badge color="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">{badge}</Badge>}
              </div>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">{content}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  </div>
);

// -----------------------------------------------------------------------------
// On-Premise Setup Sections
// -----------------------------------------------------------------------------

const OnPremiseSetup: React.FC = () => (
  <div className="space-y-10">

    {/* Overview */}
    <section>
      <SectionHeading id="op-overview" icon={<Server size={16} />} title="On-Premise Self-Hosting" subtitle="Keep your accounting data entirely under your control." />
      <div className="ovds-grid-layout cols-3 mb-5">
        {[
          { icon: <Database size={15} />, label: '100% data ownership', desc: 'All data stays on your server' },
          { icon: <Globe size={15} />, label: 'LAN deployable', desc: 'No internet required after setup' },
          { icon: <Shield size={15} />, label: 'MoR data residency', desc: 'Meets Ethiopian data residency rules' },
        ].map(f => (
          <div key={f.label} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">{f.icon}</div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{f.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cloud vs On-Premise table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[9px] w-1/3">Feature</th>
              <th className="px-4 py-3 text-left font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[9px]">
                <span className="flex items-center gap-1.5"><Cloud size={11} /> Cloud (SaaS)</span>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[9px]">
                <span className="flex items-center gap-1.5"><Server size={11} /> On-Premise</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Hosting',           'Managed at ovds.com.et',         'Your own server or XAMPP/Docker'],
              ['Data ownership',    'Hosted by OVDS',                 '100% yours — stays on your server'],
              ['Updates',           'Automatic',                      'Manual (git pull + migrate)'],
              ['Setup effort',      'Sign up and go',                 'Requires server setup'],
              ['Internet required', 'Yes',                            'No — LAN deployable'],
              ['Customization',     'Limited to settings',            'Full code-level customization'],
              ['Data residency',    'Cloud-hosted',                   'Fully local — meets Ethiopian MoR'],
              ['Backup',            'Managed by OVDS',                'Your IT team'],
              ['Ideal for',         'SMEs wanting quick start',       'Enterprises, banks, government'],
            ].map(([feature, cloud, onprem], i) => (
              <tr key={feature} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 ? 'bg-slate-50/40 dark:bg-slate-800/20' : ''}`}>
                <td className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400">{feature}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{cloud}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{onprem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    {/* Requirements */}
    <section>
      <SectionHeading id="op-requirements" icon={<Terminal size={16} />} title="Requirements" subtitle="What you need before installing OVDS on your server." />
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Software</p>
          </div>
          <div className="px-4 divide-y divide-slate-100 dark:divide-slate-800">
            <RequirementRow label="Node.js" value="18+" note="Use nvm or fnm for version management" />
            <RequirementRow label="MySQL / MariaDB" value="8.0+ / 10.6+" note="Via XAMPP, Docker, or native install" />
            <RequirementRow label="npm" value="9+" note="Bundled with Node.js" />
            <RequirementRow label="Git" value="Any" note="For cloning the repository" />
            <RequirementRow label="Docker" value="Optional" note="For containerized production deployment" />
          </div>
        </div>
        <div className="ovds-grid-layout cols-4">
          {[
            { label: 'CPU', value: '2 cores min' },
            { label: 'RAM', value: '2 GB min (4 GB recommended)' },
            { label: 'Disk', value: '10 GB free space' },
            { label: 'OS', value: 'Windows, Ubuntu 20.04+, any Linux' },
          ].map(h => (
            <div key={h.label} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{h.label}</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{h.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ports used</p>
          </div>
          <div className="px-4 divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { port: '3000', service: 'NestJS API', fix: 'npx kill-port 3000' },
              { port: '5173–5176', service: 'Vite dev server', fix: 'Kill stale node processes' },
              { port: '3306', service: 'MySQL / MariaDB', fix: 'Start XAMPP MySQL service' },
              { port: '5555', service: 'Prisma Studio (optional)', fix: 'npx kill-port 5555' },
            ].map(r => (
              <div key={r.port} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs w-20">{r.port}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{r.service}</span>
                </div>
                <code className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{r.fix}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Download */}
    <section>
      <SectionHeading id="op-download" icon={<Package size={16} />} title="Download OVDS" subtitle="Get the source code on your server." />
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Option 1 — Git clone (recommended)</p>
          <CodeBlock code={`git clone https://github.com/ovds-platform/ovds.git\ncd ovds`} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Option 2 — Docker (production-ready)</p>
          <CodeBlock code={`docker-compose up -d`} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { name: 'db', desc: 'MySQL 8 on port 3306' },
              { name: 'api', desc: 'Nginx on port 80 → backend :3001' },
            ].map(s => (
              <div key={s.name} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{s.name}</span>
                <span className="text-slate-500">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Installation */}
    <section>
      <SectionHeading id="op-installation" icon={<Settings size={16} />} title="Installation" subtitle="Step-by-step from zero to running OVDS." />
      <ol className="space-y-0">
        {[
          {
            n: 1, title: 'Start MySQL',
            content: (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Windows / XAMPP</p>
                <CodeBlock code={`C:\\xampp\\mysql_start.bat`} lang="cmd" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Linux</p>
                <CodeBlock code={`sudo service mysql start`} lang="bash" />
                <p className="mt-3">Then create the database:</p>
                <CodeBlock code={`mysql -u root -e "CREATE DATABASE ovds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`} lang="sql" />
              </>
            ),
          },
          {
            n: 2, title: 'Install dependencies',
            content: <CodeBlock code={`npm install\nnpm install --prefix frontend`} />,
          },
          {
            n: 3, title: 'Configure environment variables', badge: 'Required',
            content: (
              <>
                <CodeBlock code={`cp .env.example .env`} />
                <p className="mt-3">Minimum required in <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">.env</code>:</p>
                <CodeBlock lang="env" code={`PRISMA_DATABASE_URL="mysql://root:@127.0.0.1:3306/ovds"\nJWT_SECRET="your-strong-secret-key-min-32-chars"\nAUTH0_NAMESPACE="https://your-domain.com"\nAUTH0_ENFORCED=false`} />
                <Callout type="warning" title="Security">Change <strong>JWT_SECRET</strong> to a strong random value (min 32 chars) before going to production. Never use the default.</Callout>
              </>
            ),
          },
          {
            n: 4, title: 'Push schema and seed data',
            content: (
              <>
                <CodeBlock code={`# Apply Prisma schema to database\nnpm run db:push\n\n# Seed demo data and default users\nnpm run seed`} />
                <Callout type="info">The seed creates 8 default users (one per role). See the <strong>Default Login Credentials</strong> section below.</Callout>
              </>
            ),
          },
          {
            n: 5, title: 'Start the application',
            content: (
              <>
                <CodeBlock code={`npm run dev:all`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {[
                    { label: 'Frontend', url: FRONTEND_URL },
                    { label: 'Backend API', url: `${API_URL}` },
                    { label: 'Swagger Docs', url: `${API_URL}/docs` },
                    { label: 'Prisma Studio', url: 'npm run db:studio → :5555' },
                  ].map(u => (
                    <div key={u.label} className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <Globe size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-700 dark:text-slate-300">{u.label}</div>
                        <div className="font-mono text-slate-400 text-[10px]">{u.url}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Callout type="success">OVDS is running! Log in with <strong>superadmin@ovds.com</strong> / <strong>SuperAdmin@2026!</strong></Callout>
              </>
            ),
          },
        ].map(({ n, title, badge, content }) => (
          <li key={n} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold shrink-0 z-10">{n}</div>
              <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
            </div>
            <div className="flex-1 pb-8 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
                {badge && <Badge color="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">{badge}</Badge>}
              </div>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">{content}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>

    {/* Getting the API Key */}
    <section>
      <SectionHeading id="op-api-key" icon={<Key size={16} />} title="Getting the API Key" subtitle="The API Key holds details of your OVDS plan and grants access to integrations and apps." />
      <div className="space-y-6">

        {/* Intro */}
        <p className="text-sm text-slate-600 dark:text-slate-400">
          To get your API key, you need to sign up for OVDS via the website. Follow the steps below to register, locate your key, and use it inside the app.
        </p>

        {/* Step group 1 — Sign up */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Step 1 — Create your account</p>
          </div>
          <ol className="space-y-2">
            {[
              { n: 1, text: <>Go to <a href="https://ovds.com.et" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1">ovds.com.et <ExternalLink size={11} /></a></> },
              { n: 2, text: <>Click <strong className="text-slate-700 dark:text-slate-200">Get Started</strong> in the top-right corner of the website.</> },
              { n: 3, text: <>Select <strong className="text-slate-700 dark:text-slate-200">Start</strong> on the next screen.</> },
              { n: 4, text: <>Enter the required fields — <strong className="text-slate-700 dark:text-slate-200">Name</strong>, <strong className="text-slate-700 dark:text-slate-200">Email</strong>, and <strong className="text-slate-700 dark:text-slate-200">Password</strong>.</> },
              { n: 5, text: <>Check the <strong className="text-slate-700 dark:text-slate-200">Terms and Conditions</strong> box.</> },
              { n: 6, text: <>Click <strong className="text-slate-700 dark:text-slate-200">Create New Account</strong>.</> },
              { n: 7, text: <>Check your email for a confirmation message and click <strong className="text-slate-700 dark:text-slate-200">Confirm email address</strong> to complete your registration and log in.</> },
            ].map(s => (
              <li key={s.n} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{s.n}</span>
                <span className="text-slate-600 dark:text-slate-400 leading-relaxed">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Step group 2 — Find the key */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Step 2 — Locate your API Key</p>
          </div>
          <ol className="space-y-2">
            {[
              { n: 1, text: <>Go to <a href="https://ovds.com.et/login" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1">ovds.com.et/login <ExternalLink size={11} /></a></> },
              { n: 2, text: <>Enter your account details to access the <strong className="text-slate-700 dark:text-slate-200">Account Dashboard</strong>.</> },
              { n: 3, text: <>On your Account Dashboard, the <strong className="text-slate-700 dark:text-slate-200">API Key</strong> is displayed at the top of the page.</> },
            ].map(s => (
              <li key={s.n} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{s.n}</span>
                <span className="text-slate-600 dark:text-slate-400 leading-relaxed">{s.text}</span>
              </li>
            ))}
          </ol>

          {/* API key visual mock */}
          <div className="mt-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">API Key on Account Dashboard</p>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                <Key size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Your API Key</p>
                <code className="text-xs font-mono text-slate-700 dark:text-slate-300 blur-[3px] select-none">ovds_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                <Copy size={10} /> Click to copy
              </div>
            </div>
          </div>
        </div>

        {/* Step group 3 — Use the key */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Step 3 — Enter your API Key</p>
          </div>
          <ol className="space-y-2">
            {[
              { n: 1, text: <>Click the API key to <strong className="text-slate-700 dark:text-slate-200">copy</strong> it to your clipboard.</> },
              { n: 2, text: <>Paste it in the <strong className="text-slate-700 dark:text-slate-200">API Key field</strong> when setting up your company in the Company Setup Wizard.</> },
              { n: 3, text: <>You also need the API key to access <strong className="text-slate-700 dark:text-slate-200">Apps</strong> on OVDS — paste it in the API Key field when prompted.</> },
            ].map(s => (
              <li key={s.n} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{s.n}</span>
                <span className="text-slate-600 dark:text-slate-400 leading-relaxed">{s.text}</span>
              </li>
            ))}
          </ol>

          {/* Company wizard mock */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Company Setup Wizard</p>
              <div className="space-y-2">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
                <div className="flex items-center gap-2 mt-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700">
                  <Key size={11} className="text-emerald-500 shrink-0" />
                  <code className="text-[10px] font-mono text-slate-400 truncate">Paste API key here…</code>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Enter API Key to access Apps</p>
              <div className="space-y-2">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
                <div className="flex items-center gap-2 mt-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700">
                  <Key size={11} className="text-emerald-500 shrink-0" />
                  <code className="text-[10px] font-mono text-slate-400 truncate">Paste API key here…</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Callout type="info" title="Keep your API key safe">
          Your API key is tied to your OVDS plan and billing. Never share it publicly or commit it to source control. If compromised, regenerate it from your Account Dashboard immediately.
        </Callout>

      </div>
    </section>

    {/* Setting Up Your Company */}
    <section>
      <SectionHeading id="op-company" icon={<Users size={16} />} title="Setting Up Your Company" subtitle="Post-installation company configuration checklist." />
      <div className="space-y-3">
        {[
          { n: 1,  icon: '🔑', title: 'Log in',                   text: 'Log in as ADMIN or SPURADMIN using the credentials from the seed step.' },
          { n: 2,  icon: '🏢', title: 'Open Company Setup Wizard', text: <>Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">W</kbd> on any page, or go to <strong>System Administration → Setup Wizard</strong>.</> },
          { n: 3,  icon: '📋', title: 'Fill in company details',   text: 'Enter company name, legal name, TIN (exactly 15 digits), business type, and fiscal year start (Month 7 = July for Ethiopian FY).' },
          { n: 4,  icon: '🔑', title: 'Enter your API Key',        text: <>Paste your API key from <a href="https://ovds.com.et/login" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5">ovds.com.et <ExternalLink size={10} /></a> when prompted in the wizard.</> },
          { n: 5,  icon: '🧾', title: 'Seed Ethiopian tax rates',  text: <>Go to <strong>Settings → Taxes</strong> and click <strong>Seed Ethiopian Defaults</strong>, or call <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">POST /api/ovds/tax-rates/seed-et</code> (requires ADMIN role).</> },
          { n: 6,  icon: '📒', title: 'Seed chart of accounts',    text: <>Go to <strong>Accounting → Chart of Accounts → Seed Ethiopian Defaults</strong>, or call <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">POST /api/ovds/accounts/seed</code> (requires ovds role).</> },
          { n: 7,  icon: '🏗️', title: 'Add departments',           text: <>Go to <strong>HR → Departments → Add Department</strong>. Departments are required before adding employees.</> },
          { n: 8,  icon: '🕐', title: 'Add shifts',                text: <>Go to <strong>HR → Shifts → Add Shift</strong>. Example: Morning — 08:00–17:00, Mon–Fri.</> },
          { n: 9,  icon: '👥', title: 'Add employees',             text: <>Go to <strong>HR → Employees → Add Employee</strong> or bulk import via CSV. Assign each employee a department, shift, and basic salary.</> },
          { n: 10, icon: '💰', title: 'Configure payroll',         text: 'Set baseSalary > 0 for each employee to activate payroll. Configure pension rates (7% employee / 11% employer) and payment heads.' },
          { n: 11, icon: '📧', title: 'Configure notifications',   text: <>Optional: go to <strong>System Administration → Notification Settings</strong> and set SMTP credentials to enable email delivery.</> },
        ].map(s => (
          <div key={s.n} className="flex items-start gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
            <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{s.n}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs mb-0.5">{s.icon} {s.title}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{s.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Callout type="warning" title="TIN required">Your TIN must be exactly 15 digits. It appears on all ERCA-compliant invoices and VAT filings. Without it, invoice creation will be blocked for B2B customers.</Callout>
      </div>
    </section>

    {/* Update */}
    <section>
      <SectionHeading id="op-update" icon={<RefreshCw size={16} />} title="Update" subtitle="Keep your OVDS instance up to date with the latest features and fixes." />
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {[
            { icon: '🔒', title: 'Safe migrations', desc: 'Schema changes use non-destructive migrations — no data loss.' },
            { icon: '⚡', title: 'Zero downtime', desc: 'PM2 reloads gracefully without dropping active connections.' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3 p-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
              <span className="text-base shrink-0">{f.icon}</span>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{f.title}</p>
                <p className="text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <CodeBlock code={`# 1. Pull latest code\ngit pull origin main\n\n# 2. Install any new dependencies\nnpm install\nnpm install --prefix frontend\n\n# 3. Apply schema changes\nnpm run db:push                    # development\n# npx prisma migrate deploy        # production (safe, no data loss)\n\n# 4. Regenerate Prisma client\nnpx prisma generate\n\n# 5. Rebuild frontend\nnpm run build --prefix frontend\n\n# 6. Restart the server\npm2 restart ovds-api               # PM2\n# docker-compose down && docker-compose up -d --build  # Docker`} />
        <Callout type="danger" title="Never in production">Never run <code className="font-mono bg-rose-100 dark:bg-rose-900/30 px-1 rounded">npm run db:reset</code> in production — it drops all data.</Callout>
      </div>
    </section>

    {/* Production Deployment */}
    <section>
      <SectionHeading id="op-production" icon={<Zap size={16} />} title="Production Deployment" subtitle="Harden and expose OVDS for real-world use." />
      <div className="space-y-4">
        <div className="ovds-grid-layout cols-3">
          {[
            { icon: '🖥️', title: 'PM2',    desc: 'Process manager — auto-restart on crash, zero-downtime reload' },
            { icon: '🐳', title: 'Docker', desc: 'Containerized — consistent across environments' },
            { icon: '🔀', title: 'nginx',  desc: 'Reverse proxy — HTTPS termination, static file serving' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3 p-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
              <span className="text-base shrink-0">{f.icon}</span>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{f.title}</p>
                <p className="text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">PM2 (recommended)</p>
          <CodeBlock code={`# Build frontend (output → ./public, served by NestJS)\nnpm run build --prefix frontend\n\n# Build backend\nnpm run build\n\n# Start with PM2\nnpm install -g pm2\npm2 start dist/main.js --name ovds-api --env production\npm2 startup && pm2 save`} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Docker</p>
          <CodeBlock code={`docker-compose up -d --build`} />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Production checklist</p>
          </div>
          <div className="px-4 divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { item: 'JWT_SECRET set to strong random value (min 32 chars)',    env: 'JWT_SECRET' },
              { item: 'NODE_ENV=production (disables ms field in API responses)', env: 'NODE_ENV' },
              { item: 'SMTP configured for email delivery',                       env: 'MAIL_USER / MAIL_PASS' },
              { item: 'AUTH0_ENFORCED=true if using Auth0 SSO',                   env: 'AUTH0_ENFORCED' },
              { item: 'HTTPS via nginx or Caddy in front of port 3001',           env: 'Reverse proxy' },
              { item: 'PRISMA_DATABASE_URL points to production database',        env: 'PRISMA_DATABASE_URL' },
              { item: 'SIEM_WEBHOOK_URL set if integrating with a SIEM',          env: 'SIEM_WEBHOOK_URL' },
              { item: 'Daily MySQL backups configured (mysqldump or equivalent)', env: 'cron / backup tool' },
            ].map(r => (
              <div key={r.item} className="flex items-center justify-between py-2.5 gap-4">
                <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  {r.item}
                </div>
                <code className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">{r.env}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Debugging Errors */}
    <section>
      <SectionHeading id="op-debugging" icon={<Bug size={16} />} title="Debugging Errors" subtitle="Common issues and how to fix them." />

      {/* Quick error lookup */}
      <div className="ovds-grid-layout cols-3 mb-5">
        {[
          { icon: '🗄️', label: 'Database',   desc: 'MySQL / Prisma errors' },
          { icon: '🔐', label: 'Auth',        desc: 'JWT, Auth0, 401 errors' },
          { icon: '🌐', label: 'Network',     desc: 'Port, CORS, blank page' },
        ].map(c => (
          <div key={c.label} className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <span className="text-base shrink-0">{c.icon}</span>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{c.label}</p>
              <p className="text-slate-400 mt-0.5">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {[
          {
            title: '🗄️ ECONNREFUSED 3306 — MySQL not running',
            content: (
              <div className="space-y-3">
                <p>Start MySQL before running OVDS. Choose the method for your environment:</p>
                <CodeBlock code={`# Windows / XAMPP\nC:\\xampp\\mysql_start.bat\n\n# Linux / Ubuntu\nsudo service mysql start\n# or\nsudo systemctl start mysql\n\n# Docker\ndocker-compose up -d db`} />
                <p>Then verify the connection string in <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">.env</code> matches your MySQL host, port, user, and database name.</p>
              </div>
            ),
          },
          {
            title: '🌐 EADDRINUSE 3000 — Port already in use',
            content: (
              <div className="space-y-2">
                <p>Another process is using port 3000. Kill it and restart:</p>
                <CodeBlock code={`npx kill-port 3000\n\n# Or find and kill manually\n# Windows\nnetstat -ano | findstr :3000\ntaskkill /PID <PID> /F\n\n# Linux / macOS\nlsof -ti:3000 | xargs kill -9`} />
              </div>
            ),
          },
          {
            title: '🌐 Blank page at / — Frontend not built or JS error',
            content: (
              <div className="space-y-3">
                <p>Check the browser console (F12) for errors. Most common causes:</p>
                <div className="space-y-2">
                  {[
                    { cause: 'Frontend not built', fix: 'npm run build --prefix frontend' },
                    { cause: 'Backend not running', fix: 'npm run dev (check terminal for errors)' },
                    { cause: 'MySQL not running', fix: 'Start MySQL — see ECONNREFUSED fix above' },
                  ].map(r => (
                    <div key={r.cause} className="flex items-start gap-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0 w-36">{r.cause}</span>
                      <code className="font-mono text-slate-500">{r.fix}</code>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            title: '🗄️ "Invalid model ID" or Prisma client errors',
            content: (
              <div className="space-y-2">
                <p>The Prisma client is out of sync with the schema. Regenerate it:</p>
                <CodeBlock code={`npx prisma generate\n\n# If schema has changed, push it first\nnpm run db:push\nnpx prisma generate`} />
              </div>
            ),
          },
          {
            title: '🗄️ Seed fails with foreign key error',
            content: (
              <div className="space-y-2">
                <p>The schema must be applied before seeding. Run in order:</p>
                <CodeBlock code={`npm run db:push\nnpm run seed`} />
              </div>
            ),
          },
          {
            title: '🔐 Route shows /forbidden',
            content: (
              <div className="space-y-2">
                <p>The logged-in user's role doesn't have the required permission. Check in order:</p>
                <div className="space-y-1.5 text-xs">
                  {[
                    <>Check <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">ROUTE_POLICY</code> in <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">frontend/src/rbac/rbac.ts</code> — is the route listed?</>,
                    <>Check <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">ROLE_PERMISSIONS</code> — does the user's role have the required permission?</>,
                    <>Test with <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">superadmin@ovds.com</code> — SPURADMIN bypasses all RBAC policies.</>,
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-slate-600 dark:text-slate-400">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            title: '🔐 JWT expired / 401 on all requests',
            content: (
              <div className="space-y-2">
                <p>Log out and log back in. If the issue persists, check that <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">JWT_SECRET</code> in <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">.env</code> is set and hasn't changed since tokens were issued.</p>
                <Callout type="warning">Changing <code className="font-mono">JWT_SECRET</code> invalidates all existing sessions — all users will be logged out.</Callout>
              </div>
            ),
          },
          {
            title: '🔐 Auth0 login loop',
            content: (
              <div className="space-y-2">
                <p>Disable Auth0 for local or on-premise use by setting both flags to false:</p>
                <CodeBlock lang="env" code={`AUTH0_ENFORCED=false\nVITE_AUTH0_ENABLED=false`} />
              </div>
            ),
          },
          {
            title: '📧 Email not sending',
            content: (
              <div className="space-y-2">
                <p>Check <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">MAIL_USER</code> is set in <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">.env</code>. If not set, emails are silently skipped with no error. Test the connection via:</p>
                <CodeBlock lang="http" code={`POST /api/notifications/test\n{ "channel": "email" }`} />
                <Callout type="info">Also check your SMTP provider's firewall — port 587 (STARTTLS) or 465 (SSL) must be open outbound.</Callout>
              </div>
            ),
          },
          {
            title: '🐳 Docker container not starting',
            content: (
              <div className="space-y-2">
                <p>Inside Docker, use the service name <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">db</code> — not <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">127.0.0.1</code> — in your database URL:</p>
                <CodeBlock lang="env" code={`# ✅ Correct for Docker\nPRISMA_DATABASE_URL="mysql://root:@db:3306/ovds"\n\n# ❌ Wrong inside Docker\nPRISMA_DATABASE_URL="mysql://root:@127.0.0.1:3306/ovds"`} />
              </div>
            ),
          },
          {
            title: '🗄️ Prisma migration conflict in production',
            content: (
              <div className="space-y-2">
                <p>Check migration status first, then resolve the conflict:</p>
                <CodeBlock code={`npx prisma migrate status\nnpx prisma migrate resolve --rolled-back <migration-name>`} />
              </div>
            ),
          },
          {
            title: '🌐 PWA showing stale content after update',
            content: (
              <div className="space-y-2">
                <p>The service worker is serving a cached version. To force a refresh:</p>
                <div className="space-y-1.5 text-xs">
                  {[
                    'Open DevTools (F12) → Application → Service Workers → click Unregister.',
                    'Reload the page — the new version will be fetched.',
                    <>To force a cache bust for all users, increment the cache name in <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">public/sw.js</code> (currently <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">ovds-v3</code>).</>,
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-slate-600 dark:text-slate-400">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
        ].map((item, i) => (
          <Accordion key={i} title={item.title}>
            {item.content}
          </Accordion>
        ))}
      </div>

      {/* Default credentials */}
      <div className="mt-6">
        <CredentialsTable />
      </div>
    </section>

  </div>
);

// -----------------------------------------------------------------------------
// Shared extras: credentials table + sidebar nav
// -----------------------------------------------------------------------------

const CredentialsTable: React.FC = () => {
  const [show, setShow] = useState(false);
  const creds = [
    { role: 'SPURADMIN',  user: 'superadmin@ovds.com', pass: 'SuperAdmin@2026!' },
    { role: 'ADMIN',      user: 'admin@ovds.com',       pass: 'changeme123' },
    { role: 'HR',         user: 'hr@ovds.com',           pass: 'hr_pass_2026' },
    { role: 'ovds',    user: 'ovds@ovds.com',      pass: 'fin_pass_2026' },
    { role: 'ACCOUNTING', user: 'selam@ovds.com',        pass: 'acct_pass_2026' },
    { role: 'AUDITOR',    user: 'bereket@ovds.com',      pass: 'audit_pass_2026' },
    { role: 'EMPLOYEE',   user: 'employee@ovds.com',     pass: 'emp_pass_2026' },
    { role: 'CRM',        user: 'crm@ovds.com',          pass: 'crm_pass_2026' },
  ];
  return (
    <>
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setShow(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Key size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Login Credentials (after npm run seed)</span>
        </div>
        {show ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {show && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  {['Role', 'Username', 'Password'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creds.map(c => (
                  <tr key={c.role} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-2.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">{c.role}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{c.user}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-500">{c.pass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800/40 flex items-start gap-2">
            <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              Change all passwords before going to production. Run <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">npm run seed</code> to create these users.
            </p>
          </div>
        </>
      )}
    </div>

    {/* ── Enterprise Client — Hybrid Deployment ───────────────────────────── */}
    <section id="op-enterprise-client">
      <SectionHeading
        id="op-enterprise-client"
        icon={<Download size={16} />}
        title="Enterprise Client (Hybrid)"
        subtitle="Download a local client that processes invoices offline and syncs to your cloud account."
      />
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Enterprise plan users can run a local <strong>OVDS Enterprise Client</strong> alongside
          the self-hosted server, or as a standalone workstation connected to the OVDS cloud.
          The client stores documents locally and syncs bidirectionally whenever internet is available.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { icon: <Database size={14} />, label: 'Local storage',    desc: 'SQLite or MySQL — data never leaves your machine' },
            { icon: <RefreshCw size={14} />, label: 'Auto sync',       desc: 'Cloud ↔ Client sync every 5 min when online' },
            { icon: <Shield size={14} />,   label: 'Entitlement gate', desc: 'Enterprise plan required — validated server-side' },
          ] as const).map(f => (
            <div key={f.label} className="flex items-start gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
              <div className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{f.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Callout type="info" title="Download from your dashboard">
          The installer is gated behind your active Enterprise subscription. Log in at{' '}
          <a href="https://ovds.com.et" target="_blank" rel="noopener noreferrer"
            className="font-semibold underline inline-flex items-center gap-0.5">
            ovds.com.et <ExternalLink size={10} />
          </a>,
          go to <strong>Settings → Downloads &amp; Apps</strong>, or follow the full guide:
        </Callout>

        <div className="flex items-center gap-3">
          <a
            href="/getting-started/client"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
          >
            <ArrowRight size={13} /> Enterprise Client Setup Guide
          </a>
          <a
            href="/settings?tab=downloads"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <Package size={13} /> Downloads &amp; Apps in Settings
          </a>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Local .env quick-reference</p>
          <CodeBlock lang="env" code={[
            'OVDS_CLOUD_URL=https://ovds.com.et',
            'OVDS_API_KEY=ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx',
            'OVDS_NODE_TOKEN=ent_node_xxxxxxxxxxxxxxxxxxxxxxxx',
            'OFFLINE_QUEUE_ENABLED=true',
            'SYNC_INTERVAL_SECONDS=300',
            'LOCAL_DB_TYPE=sqlite',
          ].join('\n')} />
        </div>
      </div>
    </section>
    </>
  );
};

// Sidebar nav items per mode
const NAV_CLOUD = [
  { id: 'cloud-overview', label: 'Overview',           icon: <Cloud size={13} /> },
  { id: 'cloud-steps',    label: 'Getting Started',    icon: <BookOpen size={13} /> },
];

const NAV_ONPREMISE = [
  { id: 'op-overview',    label: 'Overview',            icon: <Server size={13} /> },
  { id: 'op-requirements',label: 'Requirements',        icon: <Terminal size={13} /> },
  { id: 'op-download',    label: 'Download OVDS',       icon: <Package size={13} /> },
  { id: 'op-installation',label: 'Installation',        icon: <Settings size={13} /> },
  { id: 'op-api-key',     label: 'Getting the API Key', icon: <Key size={13} /> },
  { id: 'op-company',     label: 'Setting Up Company',  icon: <Users size={13} /> },
  { id: 'op-update',      label: 'Update',              icon: <RefreshCw size={13} /> },
  { id: 'op-production',  label: 'Production Deploy',   icon: <Zap size={13} /> },
  { id: 'op-debugging',   label: 'Debugging Errors',    icon: <Bug size={13} /> },
  { id: 'op-enterprise-client', label: 'Enterprise Client', icon: <Download size={13} /> },
];

// -----------------------------------------------------------------------------
// Main export — ovds-style docs layout: sidebar + content
// -----------------------------------------------------------------------------

const SetupGuide: React.FC<SetupGuideProps> = ({ defaultMode = 'cloud' }) => {
  const [mode, setMode] = useState<'cloud' | 'on-premise'>(defaultMode);
  const [activeSection, setActiveSection] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const navItems = mode === 'cloud' ? NAV_CLOUD : NAV_ONPREMISE;

  // Highlight active nav item on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-10% 0px -75% 0px' },
    );
    navItems.forEach(n => {
      const el = document.getElementById(n.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [mode, navItems]);

  // Close mobile nav on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const scrollTo = (id: string) => {
    setMobileNavOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const activeLabel = navItems.find(n => n.id === activeSection)?.label ?? navItems[0]?.label ?? '';

  return (
    <div className="space-y-4">

      {/* Mode toggle — ovds-style pill tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(['cloud', 'on-premise'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === m
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {m === 'cloud' ? <Cloud size={13} /> : <Server size={13} />}
              {m === 'cloud' ? 'Cloud (SaaS)' : 'On-Premise'}
            </button>
          ))}
        </div>

        {/* Mobile "On this page" button */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-emerald-500/40 dark:border-emerald-700 transition-all"
        >
          <ChevronDown size={13} />
          On this page
          {activeLabel && <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">· {activeLabel}</span>}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex flex-col overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {mode === 'cloud' ? 'Cloud Setup' : 'On-Premise Setup'}
              </p>
              <button onClick={() => setMobileNavOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <ChevronUp size={14} />
              </button>
            </div>
            <div className="p-3 space-y-0.5 flex-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all w-full ${
                    activeSection === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {item.label}
                  {activeSection === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-3 pb-1">Resources</p>
              {[
                { label: 'API Docs', to: '/settings/api-docs' },
                { label: 'Getting Started', to: '/getting-started' },
                { label: 'View Plans', to: '/plans' },
              ].map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:text-emerald-400 transition-all"
                >
                  <ExternalLink size={12} className="shrink-0" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Docs layout: sidebar + content */}
      <div className="flex gap-8 items-start">

        {/* Sidebar nav — sticky, ovds-style, desktop only */}
        <nav className="hidden lg:flex flex-col w-52 shrink-0 sticky top-6 space-y-0.5">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-3 pb-2">
            {mode === 'cloud' ? 'Cloud Setup' : 'On-Premise Setup'}
          </p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all w-full group ${
                activeSection === item.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-600 pl-[10px]'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 border-l-2 border-transparent'
              }`}
            >
              <span className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {/* Divider + resources */}
          <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700 space-y-0.5">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-3 pb-1">Resources</p>
            {[
              { label: 'API Docs',        to: '/settings/api-docs' },
              { label: 'Getting Started', to: '/getting-started' },
              { label: 'View Plans',      to: '/plans' },
            ].map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:text-emerald-400 transition-all"
              >
                <ExternalLink size={11} className="shrink-0 opacity-60" />
                {l.label}
              </Link>
            ))}
          </div>

          {/* Progress indicator */}
          {navItems.length > 2 && (
            <div className="pt-3 mt-1 px-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Progress</p>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {Math.max(1, navItems.findIndex(n => n.id === activeSection) + 1)}/{navItems.length}
                </span>
              </div>
              <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(Math.max(1, navItems.findIndex(n => n.id === activeSection) + 1) / navItems.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </nav>

        {/* Main content */}
        <div ref={contentRef} className="flex-1 min-w-0 space-y-4">
          {mode === 'cloud' ? <CloudSetup /> : <OnPremiseSetup />}

          {/* Credentials always shown at bottom */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <CredentialsTable />
          </div>

          {/* Next steps footer — ovds-style card row */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Next steps</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'View Plans',      to: '/plans',           icon: <Zap size={13} /> },
                { label: 'Add a Company',   to: '/companies/new',   icon: <Users size={13} /> },
                { label: 'Getting Started', to: '/getting-started', icon: <BookOpen size={13} /> },
                { label: 'API Docs',        to: '/settings/api-docs',        icon: <Key size={13} /> },
              ].map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/40 dark:border-emerald-700 transition-all"
                >
                  <span className="text-emerald-600 dark:text-emerald-400">{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;









