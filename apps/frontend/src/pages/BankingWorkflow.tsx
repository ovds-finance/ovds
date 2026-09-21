/**
 * BankingWorkflow — The OVDS banking & treasury flow
 *
 * A single, Ovds-style overview of the complete banking lifecycle:
 *
 *   Setup Accounts → Import Feeds → Categorize → Reconcile → Lock Period
 *
 * Every stage is wired to the real banking module it represents, plus the
 * troubleshooting tree, role/permission matrix, year-end close, and the
 * developer/API integration flow.
 */
import type { StageStatus } from '@ovds/ui';
import type { IconType } from '@ovds/ui';
import {
  ArrowRight,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Code2,
  Lock,
  CheckCircle2,
  CircleDot,
  BookOpen,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  AppPage,
  Btn,
  GridSection,
  GridStatBar,
  PipelineFlow,
  Icon,
} from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlowStep {
  title: string;
  desc: string;
  icon: IconType;
  to: string;
}

interface FlowGroup {
  key: string;
  label: string;
  icon: IconType;
  steps: FlowStep[];
}

// ---------------------------------------------------------------------------
// Lifecycle pipeline (the 5-step core loop)
// ---------------------------------------------------------------------------

const LIFECYCLE: { key: string; label: string; sublabel: string; icon: IconType; to: string }[] = [
  { key: 'setup',    label: 'Setup Accounts', sublabel: 'Foundation', icon: 'BANK',          to: '/banking/accounts' },
  { key: 'import',   label: 'Import Feeds',   sublabel: 'Manual / API', icon: 'UPLOAD',       to: '/banking/feeds' },
  { key: 'categorize', label: 'Categorize',   sublabel: 'Match',        icon: 'CLIPBOARD_LIST', to: '/banking' },
  { key: 'reconcile', label: 'Reconcile',     sublabel: 'Zero diff',    icon: 'REFRESH_CW',   to: '/banking/reconciliation' },
  { key: 'lock',     label: 'Lock Period',    sublabel: 'Audit & close', icon: 'LOCK',        to: '/banking/year-end' },
];

// ---------------------------------------------------------------------------
// Detailed flow groups (stages 1–6 from the spec)
// ---------------------------------------------------------------------------

const GROUPS: FlowGroup[] = [
  {
    key: 'accounts',
    label: '1 · Setting up Accounts',
    icon: 'BANK',
    steps: [
      {
        title: 'New Account',
        desc: 'Go to Banking → Accounts and click New Account. Add name, number, currency, opening balance and type (Bank or Credit Card).',
        icon: 'BANK',
        to: '/banking/accounts',
      },
    ],
  },
  {
    key: 'import',
    label: '2 · Importing Transactions',
    icon: 'UPLOAD',
    steps: [
      {
        title: 'Bank Feeds (Automated)',
        desc: 'Connect your bank via Plaid / GoCardless under Banking → Bank Feeds, log in, and auto-sync transactions.',
        icon: 'REFRESH',
        to: '/banking/feeds',
      },
      {
        title: 'MT940 / OFX Import (Manual)',
        desc: 'Upload .OFX, .QBO or .XML statement files exported from your bank under Banking → Statement Import.',
        icon: 'UPLOAD',
        to: '/banking/statement-import',
      },
    ],
  },
  {
    key: 'manage',
    label: '3 · Managing Transactions & Transfers',
    icon: 'RECEIPT',
    steps: [
      {
        title: 'Revenues & Expenses',
        desc: 'Under Banking → Transactions, click New Income / New Expense, assign categories or customers, and attach receipts.',
        icon: 'RECEIPT',
        to: '/banking',
      },
      {
        title: 'Transfers',
        desc: 'Move money between your own accounts via Banking → Transfers: specify source, destination, date and amount.',
        icon: 'ARROW_LEFT_RIGHT',
        to: '/banking/transfers',
      },
      {
        title: 'Link to Invoices & Bills',
        desc: 'Match transactions directly to outstanding customer invoices or vendor bills to keep AR/AP cleared.',
        icon: 'INVOICE',
        to: '/banking/reconciliation',
      },
    ],
  },
  {
    key: 'reconcile',
    label: '4 · Reconciliation',
    icon: 'REFRESH_CW',
    steps: [
      {
        title: 'New Reconciliation',
        desc: 'Banking → Reconciliations → New. Enter statement start/end dates and closing balance, then check off imports until the discrepancy hits zero.',
        icon: 'REFRESH_CW',
        to: '/banking/reconciliation',
      },
    ],
  },
  {
    key: 'automations',
    label: '5 · Advanced Automations',
    icon: 'CLIPBOARD_LIST',
    steps: [
      {
        title: 'Automated Matching Rules',
        desc: 'Scan imports and auto-categorize recurring items like utilities, subscriptions or vendor payouts.',
        icon: 'CLIPBOARD_LIST',
        to: '/banking/rules',
      },
      {
        title: 'Batch Actions',
        desc: 'Select multiple unassigned rows in Transactions to bulk-assign categories, mark paid, or delete duplicates.',
        icon: 'LIST',
        to: '/banking',
      },
      {
        title: 'Multi-Currency Handling',
        desc: 'Live FX rates apply automatically; realized gains/losses calc when foreign-currency invoices settle.',
        icon: 'GLOBE',
        to: '/banking/fx-rates',
      },
    ],
  },
  {
    key: 'reports',
    label: '6 · Reports & Financial Insights',
    icon: 'BAR_CHART_2',
    steps: [
      {
        title: 'Cash Flow Report',
        desc: 'Reports → Cash Flow shows monthly inflows vs outflows for liquidity trends.',
        icon: 'TREND_UP',
        to: '/banking/cash-flow',
      },
      {
        title: 'Income vs Expenses',
        desc: 'Dashboard visual breakdown of top expense categories and primary revenue streams.',
        icon: 'BAR_CHART_2',
        to: '/dashboard',
      },
      {
        title: 'Account Balance Sheet',
        desc: 'Dynamically updates current assets from settled, cleared and reconciled transactions.',
        icon: 'BOOK_OPEN',
        to: '/banking/accounts',
      },
    ],
  },
];

const ROLES = [
  {
    role: 'Admin',
    desc: 'Full privileges across all bank accounts, setups and integrations.',
    perms: ['View balances', 'Manage transactions', 'Transfers', 'Run audits', 'Link / unlink banks', 'Billing settings'],
    tone: 'indigo' as const,
  },
  {
    role: 'Accountant',
    desc: 'Standard access to day-to-day banking and financial audits.',
    perms: ['View balances', 'Manage transactions', 'Transfers', 'Run audits'],
    tone: 'sky' as const,
  },
  {
    role: 'Custom',
    desc: 'Restrict to store locations or hide opening balances via team access modules.',
    perms: ['Scoped by location', 'Optional balance hiding', 'Granular module access'],
    tone: 'violet' as const,
  },
];

const API_ENDPOINTS = [
  { method: 'GET / POST', path: '/api/banking/accounts', note: 'Create & list payment accounts' },
  { method: 'GET / POST', path: '/api/banking/transactions', note: 'Push external transactions (account_id, amount, type, paid_at)' },
  { method: 'GET / POST', path: '/api/banking/transfers', note: 'Inter-account movements' },
  { method: 'WEBHOOK', path: 'transaction.reconciled / payment.cleared', note: 'Fire alerts to external systems' },
];

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

const StageIcon: React.FC<{ name: IconType }> = ({ name }) => <Icon name={name} size={16} />;

const FlowCard: React.FC<{ step: FlowStep; onOpen: (to: string) => void }> = ({ step, onOpen }) => (
  <div className="ovds-widget-card p-4 flex flex-col gap-3">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-[var(--pro-azure-50)] text-[var(--pro-azure)] flex items-center justify-center shrink-0">
        <StageIcon name={step.icon} />
      </div>
      <div className="min-w-0">
        <h4 className="ovds-card-title">{step.title}</h4>
        <p className="ovds-caption mt-0.5">{step.desc}</p>
      </div>
    </div>
    <Btn
      variant="secondary"
      size="sm"
      className="mt-auto self-start"
      icon={<ArrowRight size={11} />}
      onClick={() => onOpen(step.to)}
    >
      Open module
    </Btn>
  </div>
);

const TreeBranch: React.FC<{ label: string; detail: string }> = ({ label, detail }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <span className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />
      <CircleDot size={10} className="text-[var(--pro-azure)] my-1" />
      <span className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />
    </div>
    <div className="pb-3">
      <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{label}</p>
      <p className="ovds-caption mt-0.5">{detail}</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BankingWorkflow() {
  usePageTitle('Banking Workflow');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'flow' | 'troubleshoot' | 'access'>('flow');
  const [activeLifecycle, setActiveLifecycle] = useState<string>(LIFECYCLE[0].key);

  const openModule = (to: string) => navigate(to);

  const pipelineStages = useMemo(
    () =>
      LIFECYCLE.map(s => ({
        key: s.key,
        label: s.label,
        sublabel: s.sublabel,
        icon: s.icon,
        status: (s.key === activeLifecycle ? 'active' : 'completed') as StageStatus,
        onClick: () => {
          setActiveLifecycle(s.key);
          navigate(s.to);
        },
      })),
    [activeLifecycle, navigate],
  );

  const statCells = useMemo(
    () => [
      { label: 'Accounts', value: 'Multi', sub: 'Bank · Card · Cash', accentCls: 'bg-[var(--pro-azure-50)]0', onClick: () => navigate('/banking/accounts') },
      { label: 'Import', value: '2 ways', sub: 'Feeds · OFX', accentCls: 'bg-sky-500', onClick: () => navigate('/banking/feeds') },
      { label: 'Reconcile', value: 'Zero', sub: 'Discrepancy target', accentCls: 'bg-violet-500', onClick: () => navigate('/banking/reconciliation') },
      { label: 'Reports', value: 'Real-time', sub: 'Cash flow · BS', accentCls: 'bg-amber-500', onClick: () => navigate('/banking/cash-flow') },
      { label: 'Year-End', value: 'Lock', sub: 'Audit · archive', accentCls: 'bg-rose-500', onClick: () => navigate('/banking/year-end') },
      { label: 'API', value: 'REST', sub: 'Accounts · Tx · Transfers', accentCls: 'bg-teal-500', onClick: () => navigate('/settings/api-docs') },
    ],
    [navigate],
  );

  const tabs = [
    { id: 'flow', label: 'Lifecycle' },
    { id: 'troubleshoot', label: 'Troubleshoot & Close' },
    { id: 'access', label: 'Roles & API' },
  ];

  return (
    <AppPage
      title="Banking Workflow"
      subtitle="The complete cash & banking lifecycle — from account setup and feeds through reconciliation, reporting and year-end lock."
      icon={<BookOpen size={16} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      actions={
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={() => navigate('/ovds/workflow')}>
            <BookOpen size={12} /> Financial Cycle
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => navigate('/banking/feeds')}>
            Bank Feeds
          </Btn>
          <Btn size="sm" onClick={() => navigate('/banking/reconciliation')}>
            Reconcile
          </Btn>
        </div>
      }
      tabs={
        <div className="flex gap-1 ovds-tab-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`ovds-tab ${activeTab === t.id ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {/* Pipeline overview */}
      <div className="ovds-widget-card p-4 overflow-x-auto">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
          Banking lifecycle
        </p>
        <PipelineFlow stages={pipelineStages} />
      </div>

      {/* At-a-glance KPI strip */}
      <div className="mt-4">
        <GridStatBar cells={statCells} cols={6} />
      </div>

      {/* ── TAB: LIFECYCLE ─────────────────────────────────────────────── */}
      {activeTab === 'flow' && (
        <div className="mt-6 space-y-6">
          {GROUPS.map(group => (
            <GridSection
              key={group.key}
              title={group.label}
              icon={<Layers size={14} />}
            >
              <div className="ovds-grid-layout cols-3 gap-sm">
                {group.steps.map(step => (
                  <FlowCard key={step.title} step={step} onOpen={openModule} />
                ))}
              </div>
            </GridSection>
          ))}
        </div>
      )}

      {/* ── TAB: TROUBLESHOOT & CLOSE ──────────────────────────────────── */}
      {activeTab === 'troubleshoot' && (
        <div className="mt-6 space-y-6">
          {/* Discrepancy tree */}
          <GridSection
            title="Auditing & Fixing Discrepancies"
            subtitle="If reconciliation fails to match the bank statement, locate the error with this tree."
            icon={<AlertTriangle size={14} />}
          >
            <div className="ovds-widget-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle size={15} />
                </span>
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Unreconciled Discrepancy</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TreeBranch label="Check Date Ranges" detail="Ensure statement start/end dates match exactly." />
                <TreeBranch label="Locate Duplicates" detail="Scan for manual entries that double-count automated feeds." />
                <TreeBranch label="Inspect Transfers" detail="Verify inter-account moves aren't logged as expense/income." />
              </div>
              <ol className="mt-4 space-y-2 list-decimal list-inside text-[12px] text-slate-600 dark:text-slate-300">
                <li><strong>Date Window:</strong> Open Reconciliations and confirm the statement range covers every flagged transaction.</li>
                <li><strong>Duplicates:</strong> If a manual entry and an automated feed pulled the same row, select the duplicate and click Delete.</li>
                <li><strong>Broken Transfers:</strong> Label internal moves explicitly as Transfers, not standalone expense + revenue entries.</li>
              </ol>
            </div>
          </GridSection>

          {/* Sync failures */}
          <GridSection
            title="Troubleshooting Sync Failures"
            subtitle="Automated bank feed tokens expire (~90 days) due to open-banking security (MFA/OAuth)."
            icon={<AlertTriangle size={14} />}
          >
            <div className="ovds-widget-card p-4 flex items-center gap-2 flex-wrap text-[12px]">
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold">Sync Token Expired</span>
              <ArrowRight size={12} className="text-slate-400" />
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold">Bank Feeds → Re-authenticate</span>
              <ArrowRight size={12} className="text-slate-400" />
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold">Input MFA OTP</span>
              <ArrowRight size={12} className="text-slate-400" />
              <span className="px-2.5 py-1 rounded-lg bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)] font-semibold">Sync Resumed</span>
            </div>
            <p className="ovds-caption mt-2">
              Missed a multi-week window? Use the manual MT940/OFX Import to backfill history without creating duplicate ledger entries.
            </p>
          </GridSection>

          {/* Year-end */}
          <GridSection
            title="Year-End Closing Flow"
            subtitle="At fiscal year end the banking flow locks records to prevent retrospective edits."
            icon={<Lock size={14} />}
          >
            <div className="ovds-grid-layout cols-3 gap-sm">
              {[
                { t: 'Finalize Clearing', d: 'Every transaction up to the closing date has status “Reconciled”.' },
                { t: 'Lock the Period', d: 'Use accounting settings to lock past periods and block manual edits.' },
                { t: 'Export Ledgers', d: 'Archive general ledger + banking summaries for tax filing and audits.' },
              ].map(item => (
                <div key={item.t} className="ovds-widget-card p-4 flex gap-3">
                  <CheckCircle2 size={16} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="ovds-card-title">{item.t}</h4>
                    <p className="ovds-caption mt-0.5">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </GridSection>
        </div>
      )}

      {/* ── TAB: ROLES & API ───────────────────────────────────────────── */}
      {activeTab === 'access' && (
        <div className="mt-6 space-y-6">
          {/* Roles */}
          <GridSection
            title="User Roles & Security Permissions"
            subtitle="Restrict or grant access to sensitive banking data when collaborating."
            icon={<ShieldCheck size={14} />}
          >
            <div className="ovds-widget-card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    {['Role', 'Description', 'Access'].map(h => (
                      <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-3 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map(r => (
                    <tr key={r.role} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{r.role}</td>
                      <td className="px-3 py-2.5 ovds-caption">{r.desc}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {r.perms.map(p => (
                            <span key={p} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GridSection>

          {/* API */}
          <GridSection
            title="Developer & API Integration"
            subtitle="Manipulate banking flows programmatically via the REST API."
            icon={<Code2 size={14} />}
            action={
              <Btn size="sm" variant="secondary" onClick={() => navigate('/settings/api-docs')}>
                API Docs
              </Btn>
            }
          >
            <div className="ovds-widget-card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {API_ENDPOINTS.map(e => (
                <div key={e.path} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)] shrink-0 w-28 text-center">
                    {e.method}
                  </span>
                  <code className="text-[11px] font-mono text-slate-700 dark:text-slate-200">{e.path}</code>
                  <span className="ovds-caption ml-auto text-right hidden sm:block">{e.note}</span>
                </div>
              ))}
            </div>
            <p className="ovds-caption mt-2">
              Payload example: <code className="font-mono">{'{ "account_id", "amount", "type": "income|expense", "paid_at" }'}</code>.
              Webhook listeners fire on <strong>transaction.reconciled</strong> and <strong>payment.cleared</strong>.
            </p>
          </GridSection>
        </div>
      )}

      <p className="ovds-caption text-center mt-6">
        IAS 7 / IFRS 9 — reconciled banking activity feeds cash flow, the balance sheet and the general ledger in real time.
      </p>
      <div className="flex justify-center mt-3">
        <Btn size="sm" variant="ghost" onClick={() => navigate('/ovds/workflow')}>
          View the full Financial Cycle <ArrowRight size={12} />
        </Btn>
      </div>
    </AppPage>
  );
}
