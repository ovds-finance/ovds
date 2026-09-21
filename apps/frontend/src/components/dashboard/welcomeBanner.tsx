import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import { useLocalStorage } from '../../hooks';
import { useAuth } from '../../rbac/AuthContext';
import { Icon } from '../ui';

// -----------------------------------------------------------------------------
// The 4 ovds cloud setup steps
// -----------------------------------------------------------------------------
const STEPS = [
  {
    id: 'signup',
    num: 1,
    icon: <Icon name="SPARKLES" size={16} />,
    title: 'Sign up to Ovds',
    desc: 'Create your secure account',
    to: '/start',
    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    ring: 'ring-[var(--pro-azure)]/20',
    bg: 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]/30',
  },
  {
    id: 'company',
    num: 2,
    icon: <Icon name="COMPANY" size={16} />,
    title: 'Create your company',
    desc: 'Add core business details',
    to: '/companies/new',
    color: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-200',
    bg: 'bg-violet-50 dark:bg-violet-500-dark/30',
  },
  {
    id: 'apps',
    num: 3,
    icon: <Icon name="ITEM" size={16} />,
    title: 'Configure apps',
    desc: 'Activate essential modules',
    to: '/settings/app-store',
    color: 'text-amber-600 dark:text-amber-600',
    ring: 'ring-amber-200',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
  },
  {
    id: 'invoice',
    num: 4,
    icon: <Icon name="SEND" size={16} />,
    title: 'Send first invoice',
    desc: 'Generate ERCA-ready document',
    to: '/sales/invoices',
    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    ring: 'ring-[var(--pro-azure)]/20',
    bg: 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]/30',
  },
];

const WelcomeBanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companies } = useBusiness();
  const [dismissed, setDismissed] = useLocalStorage<boolean>('welcome_banner_dismissed_v2', false);
  const [completedSteps, setCompletedSteps] = useLocalStorage<string[]>('welcome_steps_done_v2', []);

  const autoCompleted: string[] = ['signup'];
  if (companies.length > 0) autoCompleted.push('company');

  const effectiveDone = new Set([...completedSteps, ...autoCompleted]);
  const doneCount = STEPS.filter(s => effectiveDone.has(s.id)).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);
  const allDone = doneCount === STEPS.length;

  if (dismissed) return null;
  if (!['ADMIN', 'SPURADMIN'].includes(user?.role ?? '')) return null;

  const _markDone = (_id: string) =>
    setCompletedSteps(prev => prev.includes(_id) ? prev : [...prev, _id]);

  const firstName = user?.username?.split('@')[0] ?? 'there';

  return (
    <div className="relative ovds-widget-card overflow-hidden mb-4 group/banner">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #00E784 1px, transparent 0)', backgroundSize: '20px 20px' }} />
      <div className="absolute -top-24 -right-24 w-56 h-56 bg-[var(--pro-azure-50)] rounded-full blur-[80px] pointer-events-none" />

      <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--pro-azure-light)] hover:text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] transition-all z-10" aria-label="Dismiss">
        <Icon name="CLOSE" size={13} />
      </button>

      <div className="relative p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Header & Progress */}
          <div className="lg:w-1/3 space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--pro-azure-50)] border border-slate-100 rounded-full">
                <Icon name="SPARKLES" size={10} className="text-[var(--pro-azure)]" />
                <span className="text-[9px] font-bold text-[var(--pro-azure)] uppercase tracking-widest">Getting Started</span>
              </div>
              <h2 className="text-[15px] font-bold text-ovds-text-main tracking-tight">Setup your Cloud</h2>
              <p className="text-[11px] text-ovds-text-muted leading-relaxed">
                Welcome, {firstName}! Follow these steps to get fully operational.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-ovds-text-subtle uppercase tracking-widest">Progress</span>
                <span className="text-[9px] font-bold text-[var(--pro-azure)] uppercase tracking-widest">{pct}%</span>
              </div>
              <div className="h-1.5 bg-[var(--pro-azure-50)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--pro-azure)] to-[var(--pro-azure-light)] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/getting-started" className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] hover:text-slate-800 transition-colors">
                <Icon name="BOOK_OPEN" size={11} /> Full Guide
              </Link>
              <Link to="/plans" className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] hover:text-slate-800 transition-colors">
                <Icon name="CREDIT_CARD" size={11} /> View Plans
              </Link>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="flex-1 ovds-grid-layout cols-2 gap-sm">
            {STEPS.map((step) => {
              const done = effectiveDone.has(step.id);
              return (
                <div key={step.id}
                  className={`group/step relative p-3.5 rounded-xl border transition-all duration-200 ${
                    done
                      ? 'bg-[var(--pro-azure-50)] border-slate-100 opacity-60'
                      : 'bg-[var(--pro-azure-50)] border-slate-100 hover:border-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] cursor-pointer'
                  }`}
                  onClick={() => !done && navigate(step.to)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      done ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' : `${step.bg} ${step.color} group-hover/step:scale-105`
                    }`}>
                      {done ? <Icon name="CHECK_CIRCLE" size={16} /> : step.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-3">
                      <p className={`text-[11px] font-bold leading-tight ${done ? 'text-[var(--pro-azure-light)] line-through' : 'text-ovds-text-main group-hover/step:text-[var(--pro-azure)]'} transition-colors`}>
                        {step.title}
                      </p>
                      <p className="text-[9px] text-ovds-text-subtle mt-0.5">{step.desc}</p>
                    </div>
                    {!done && (
                      <div className="absolute top-3.5 right-3.5 text-[var(--pro-azure-light)] group-hover/step:text-[var(--pro-azure)] transition-colors">
                        <Icon name="ARROW_RIGHT" size={13} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {allDone && (
          <div className="mt-4 p-3 bg-[var(--pro-azure-50)] border border-slate-200 rounded-xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--pro-azure-100)] flex items-center justify-center text-[var(--pro-azure)]">
                <Icon name="CHECK_CIRCLE" size={16} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[var(--pro-azure)]">All setup steps complete!</p>
                <p className="ovds-caption">Your company is ready for production.</p>
              </div>
            </div>
            <button onClick={() => setDismissed(true)} className="px-4 py-1.5 bg-[var(--pro-azure)] text-white rounded-lg text-[10px] font-bold hover:bg-[var(--pro-azure-dark)] transition-all">
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeBanner;

