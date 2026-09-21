/**
 * BusinessRegistration — Ethiopian Commercial Registration & ID Harmonization
 *
 * Redesigned: minimal, icon-driven, progressive disclosure.
 * - Circular progress ring replaces 4-cell KPI bar
 * - Legal/info text collapsed behind ⓘ toggles
 * - Icon-grid structure cards (icon + title only; details on selection)
 * - Slim vertical step rail with icon-only nodes
 * - Save-state chip stays inline in footer, not in a separate row
 */
import {
  EcrStatus,
  HarmonizationStatus,
  VatRegistrationStatus,
  fmtFaydaId,
} from '@ovds/shared';
import {
  Building2,
  ShieldCheck,
  Link2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Info,
  ChevronRight,
  RefreshCw,
  Loader2,
  BadgeCheck,
  XCircle,
  Clock,
  Banknote,
  CreditCard,
  Globe,
  Star,
  Hash,
  Fingerprint,
} from '@ovds/ui';
import {
  WizardStepper,
  AppPage,
  fmtTin,
  usePageTitle,
} from '@ovds/ui';
import { Users, ChevronDown } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  useBusinessRegistration,
  type WizardStepId,
} from '../hooks/useBusinessRegistration';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BusinessStructure {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  minFounders: string;
  minCapital: string;
  liability: string;
  taxRegime: string;
  proclamation: string;
  highlights: string[];
  badge: string;
  badgeVariant: 'new' | 'public' | 'none';
}

const STRUCTURE_IDS = [
  'plc', 'share_company', 'one_person', 'llp',
  'general_partnership', 'limited_partnership', 'sole_proprietor',
] as const;

// ---------------------------------------------------------------------------
// Step icon map
// ---------------------------------------------------------------------------

const STEP_ICONS: Record<WizardStepId, React.ReactNode> = {
  nid:      <Fingerprint size={16} />,
  tin:      <Hash size={16} />,
  license:  <Building2 size={16} />,
  vat:      <Banknote size={16} />,
  crossref: <Link2 size={16} />,
};

// ---------------------------------------------------------------------------
// Circular progress ring
// ---------------------------------------------------------------------------

const ProgressRing: React.FC<{
  pct: number;
  status: HarmonizationStatus;
  structureLabel: string;
}> = ({ pct, status, structureLabel }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const color =
    status === 'HARMONIZED'      ? '#10b981' :
    status === 'IN_PROGRESS'     ? '#f59e0b' :
    status === 'ACTION_REQUIRED' ? '#ef4444' :
    '#94a3b8';

  const statusLabel =
    status === 'HARMONIZED'      ? 'Harmonized' :
    status === 'IN_PROGRESS'     ? 'In Progress' :
    status === 'ACTION_REQUIRED' ? 'Action Needed' :
    'Incomplete';

  return (
    <div className="flex items-center gap-5">
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
          <circle
            cx="36" cy="36" r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="36" cy="36" r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.7s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[15px] font-extrabold leading-none" style={{ color }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
          Harmonization
        </p>
        <p className="text-sm font-bold leading-tight" style={{ color }}>
          {statusLabel}
        </p>
        <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {structureLabel}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Collapsible info banner (replaces always-visible InfoBox + legal block)
// ---------------------------------------------------------------------------

const CollapsibleInfo: React.FC<{
  children: React.ReactNode;
  variant?: 'info' | 'warn';
  label?: string;
}> = ({ children, variant = 'info', label }) => {
  const [open, setOpen] = useState(false);
  const isWarn = variant === 'warn';

  return (
    <div className={`rounded-xl border text-xs ${
      isWarn
        ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
        : 'bg-sky-50/60 dark:bg-sky-900/10 border-sky-200/80 dark:border-sky-800/30'
    }`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left ${
          isWarn ? 'text-amber-700 dark:text-amber-400' : 'text-sky-700 dark:text-sky-400'
        }`}
      >
        {isWarn
          ? <AlertTriangle size={13} className="shrink-0 text-amber-500" />
          : <Info size={13} className="shrink-0 text-sky-500" />
        }
        <span className="flex-1 text-[11px] font-semibold">
          {label ?? (isWarn ? 'Important notice' : 'What you\'ll need')}
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className={`px-3.5 pb-3 leading-relaxed border-t ${
          isWarn
            ? 'text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
            : 'text-sky-800 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/30'
        }`}>
          <div className="pt-2.5">{children}</div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Compact portal link (icon + name only)
// ---------------------------------------------------------------------------

const PortalLink: React.FC<{
  name: string;
  url: string;
  legalBasis: string;
  t: (key: string) => string;
}> = ({ name, url, legalBasis }) => (
  <div className="flex items-center gap-2">
    <Globe size={11} className="shrink-0 text-slate-400" />
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] text-[11px] font-semibold hover:underline"
    >
      {name}
      <ExternalLink size={9} />
    </a>
    <span className="text-[10px] text-slate-400 truncate">{legalBasis}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Shared input helpers
// ---------------------------------------------------------------------------

const inputCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none focus:ring-2 ${
    err
      ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-900/10 focus:ring-rose-400/20 focus:border-rose-400'
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-teal-400/20 focus:border-teal-400'
  } placeholder:text-slate-400 placeholder:font-normal`;

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, error, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        {label}
        {required && <span className="text-rose-500 ml-0.5 normal-case">*</span>}
      </label>
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </div>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-[11px] text-rose-500 font-bold animate-in fade-in slide-in-from-top-1">
        <AlertTriangle size={11} /> {error}
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Structure card — icon-first, details on selection
// ---------------------------------------------------------------------------

const StructureBadge: React.FC<{ label: string; variant: 'new' | 'public' }> = ({ label, variant }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide ${
    variant === 'new'
      ? 'bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
      : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
  }`}>
    {label}
  </span>
);

const StructureCard: React.FC<{
  s: BusinessStructure;
  selected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}> = ({ s, selected, onSelect, t }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={`group relative w-full flex flex-col items-center gap-2.5 pt-5 pb-4 px-3 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] ${
      selected
        ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-900/20 shadow-md shadow-green-500/10'
        : 'border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
    }`}
  >
    {/* Selected indicator dot */}
    {selected && (
      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--pro-azure-50)]0" />
    )}

    {/* Icon */}
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
      selected
        ? 'bg-[var(--pro-azure-50)]0 text-white'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
    }`}>
      {s.icon}
    </div>

    {/* Label */}
    <div className="text-center min-w-0">
      <p className={`text-xs font-bold leading-tight transition-colors ${
        selected ? 'text-[var(--pro-azure-dark)] dark:text-green-300' : 'text-slate-700 dark:text-slate-200'
      }`}>
        {s.shortLabel}
      </p>
      {s.badgeVariant !== 'none' && (
        <div className="mt-1 flex justify-center">
          <StructureBadge label={s.badge} variant={s.badgeVariant} />
        </div>
      )}
    </div>

    {/* Progressive detail: visible only when selected */}
    {selected && (
      <div className="w-full space-y-1.5 pt-2 border-t border-[var(--pro-azure-100)] dark:border-green-700/40 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-left">
          <span className="text-slate-400">{t('structure.field_labels.founders')}</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300 text-right">{s.minFounders}</span>
          <span className="text-slate-400">{t('structure.field_labels.capital')}</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300 text-right">{s.minCapital}</span>
          <span className="text-slate-400">{t('structure.field_labels.liability')}</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300 text-right">{s.liability}</span>
        </div>
        {s.highlights.slice(0, 2).map((h, i) => (
          <div key={i} className="flex items-start gap-1 text-[10px] text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
            <CheckCircle2 size={9} className="shrink-0 mt-0.5" />
            <span>{h}</span>
          </div>
        ))}
        <p className="text-[9px] text-slate-400 font-medium pt-0.5">{s.proclamation}</p>
      </div>
    )}
  </button>
);

// ---------------------------------------------------------------------------
// Step panels
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fayda ID format validator — live feedback as digits are typed
// ---------------------------------------------------------------------------
const FaydaStatus: React.FC<{ rawId: string }> = ({ rawId }) => {
  const digits = rawId.replace(/\D/g, '');
  if (!digits) return null;

  const pct   = Math.min(100, Math.round((digits.length / 12) * 100));
  const valid = digits.length === 12;
  const color = valid ? '#10b981' : digits.length > 0 ? '#f59e0b' : '#94a3b8';
  const r     = 9;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
      {valid ? (
        <CheckCircle2 size={15} className="text-[var(--pro-azure)] animate-in zoom-in duration-200" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" className="-rotate-90">
          <circle cx="10" cy="10" r={r} fill="none" stroke="#e2e8f0" strokeWidth="2" />
          <circle
            cx="10" cy="10" r={r} fill="none"
            stroke={color} strokeWidth="2" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.25s ease, stroke 0.25s ease' }}
          />
        </svg>
      )}
      <span
        className="text-[10px] font-bold tabular-nums"
        style={{ color }}
      >
        {digits.length}/12
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// NID Step — Fayda ID with bypass option
// ---------------------------------------------------------------------------
const NidStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, errors, updateNid } = reg;
  const f = draft.nid;
  const bypassed = f.faydaBypass;

  return (
    <div className="space-y-4">

      {/* ── Mode selector: two visual tiles ── */}
      <div className="grid grid-cols-2 gap-2">
        {/* Have Fayda ID */}
        <button
          type="button"
          onClick={() => updateNid({ faydaBypass: false })}
          className={`relative group flex flex-col items-center gap-2 py-3.5 px-3 rounded-xl border-2 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] ${
            !bypassed
              ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-900/20 shadow-sm shadow-green-500/10'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            !bypassed ? 'bg-[var(--pro-azure-50)]0 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <Fingerprint size={16} />
          </div>
          <div>
            <p className={`text-[11px] font-bold leading-tight ${!bypassed ? 'text-[var(--pro-azure-dark)] dark:text-green-300' : 'text-slate-600 dark:text-slate-300'}`}>
              I have a Fayda ID
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Enter 12-digit number</p>
          </div>
          {!bypassed && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-50)]0" />}
        </button>

        {/* No Fayda ID — bypass */}
        <button
          type="button"
          onClick={() => updateNid({ faydaBypass: true, faydaId: '' })}
          className={`relative group flex flex-col items-center gap-2 py-3.5 px-3 rounded-xl border-2 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            bypassed
              ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-sm shadow-amber-500/10'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            bypassed ? 'bg-amber-400 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <AlertTriangle size={15} />
          </div>
          <div>
            <p className={`text-[11px] font-bold leading-tight ${bypassed ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>
              No Fayda ID yet
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Continue without it</p>
          </div>
          {bypassed && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />}
        </button>
      </div>

      {/* ── Bypass notice banner ── */}
      {bypassed && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/10 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-500" />
          <div className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold">Proceeding without Fayda ID</p>
            <p>
              You can complete registration now and link your Fayda ID later.
              Some features may be limited until your National ID is verified.{' '}
              <a
                href="https://fayda.et"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline decoration-dotted hover:decoration-solid"
              >
                Enrol at fayda.et →
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ── Fayda ID field (hidden when bypassed) ── */}
      {!bypassed && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <Field
            label={t('nid_step.fayda_id_label')}
            required
            hint={t('nid_step.fayda_id_hint')}
            error={errors.faydaId}
          >
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                className={`${inputCls(errors.faydaId)} ovds-mono tracking-[0.12em] pr-20`}
                placeholder="XXXX – XXXX – XXXX"
                value={fmtFaydaId(f.faydaId)}
                maxLength={14}
                onChange={(e) => updateNid({ faydaId: e.target.value.replace(/\D/g, '') })}
              />
              <FaydaStatus rawId={f.faydaId} />
            </div>
          </Field>

          {/* Format hint strips */}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {['Official Fayda portal', 'NID Proc. 1024/2017', '12 digits'].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-semibold text-slate-500 dark:text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Full name ── */}
      <Field label={t('nid_step.full_name_label')} required error={errors.fullName}>
        <input
          type="text"
          className={inputCls(errors.fullName)}
          placeholder={t('nid_step.full_name_placeholder')}
          value={f.fullName}
          onChange={(e) => updateNid({ fullName: e.target.value })}
        />
      </Field>

      {/* ── Date of birth ── */}
      <Field label={t('nid_step.dob_label')} hint={t('nid_step.dob_hint')}>
        <input
          type="date"
          className={inputCls()}
          value={f.dateOfBirth}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => updateNid({ dateOfBirth: e.target.value })}
        />
      </Field>

      {/* ── Step summary pill ── */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors ${
        bypassed
          ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-900/10'
          : (f.faydaId.replace(/\D/g,'').length === 12 && f.fullName.trim())
            ? 'border-[var(--pro-azure-100)] dark:border-green-800/40 bg-[var(--pro-azure-50)]/40 dark:bg-green-900/10'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
            bypassed ? 'bg-amber-100 dark:bg-amber-900/30' :
            (f.faydaId.replace(/\D/g,'').length === 12 && f.fullName.trim()) ? 'bg-[var(--pro-azure-100)] dark:bg-green-900/30' :
            'bg-slate-100 dark:bg-slate-800'
          }`}>
            <Fingerprint size={11} className={
              bypassed ? 'text-amber-500' :
              (f.faydaId.replace(/\D/g,'').length === 12 && f.fullName.trim()) ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' :
              'text-slate-400'
            } />
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {bypassed
              ? 'National ID — pending enrolment'
              : f.faydaId.replace(/\D/g,'').length === 12
                ? `Fayda ${fmtFaydaId(f.faydaId)}`
                : 'National ID — not entered'}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          bypassed
            ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
            : (f.faydaId.replace(/\D/g,'').length === 12 && f.fullName.trim())
              ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-100)] dark:bg-green-900/30'
              : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
        }`}>
          {bypassed ? 'Bypassed' : (f.faydaId.replace(/\D/g,'').length === 12 && f.fullName.trim()) ? 'Ready' : 'Incomplete'}
        </span>
      </div>

      <PortalLink name={t('nid_step.portal_name')} url={t('nid_step.portal_url')} legalBasis={t('nid_step.legal_basis')} t={t} />
    </div>
  );
};

const TinStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, errors, updateTin } = reg;
  const f = draft.tin;
  return (
    <div className="space-y-4">
      <CollapsibleInfo label={t('tin_step.info_body').slice(0, 42) + '…'}>
        {t('tin_step.info_body')}
      </CollapsibleInfo>
      <Field label={t('tin_step.tin_label')} required hint={t('tin_step.tin_hint')} error={errors.tin}>
        <input
          type="text"
          inputMode="numeric"
          className={`${inputCls(errors.tin)} ovds-mono tracking-widest`}
          placeholder={t('tin_step.tin_placeholder')}
          value={fmtTin(f.tin) ?? ''}
          maxLength={12}
          onChange={(e) => updateTin({ tin: e.target.value.replace(/\D/g, '') })}
        />
      </Field>
      <Field label={t('tin_step.business_name_label')} required error={errors.businessName}>
        <input
          type="text"
          className={inputCls(errors.businessName)}
          placeholder={t('tin_step.business_name_placeholder')}
          value={f.businessName}
          onChange={(e) => updateTin({ businessName: e.target.value })}
        />
      </Field>
      <Field label={t('tin_step.tax_office_label')} hint={t('tin_step.tax_office_hint')}>
        <input
          type="text"
          className={inputCls()}
          placeholder={t('tin_step.tax_office_placeholder')}
          value={f.taxOffice}
          onChange={(e) => updateTin({ taxOffice: e.target.value })}
        />
      </Field>
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-[var(--pro-azure)] focus:ring-teal-400"
          checked={f.biometricComplete}
          onChange={(e) => updateTin({ biometricComplete: e.target.checked })}
        />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[var(--pro-azure)] dark:group-hover:text-[var(--pro-azure-light)] transition-colors leading-relaxed">
          {t('tin_step.biometric_checkbox')}
        </span>
      </label>
      <PortalLink name={t('tin_step.portal_name')} url={t('tin_step.portal_url')} legalBasis={t('tin_step.legal_basis')} t={t} />
    </div>
  );
};

const LicenseStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, errors, updateLicense } = reg;
  const f = draft.license;
  const turnover = parseFloat(f.annualTurnover || '0');
  const categoryKey = turnover >= 2_000_000 ? 'a' : turnover >= 500_000 ? 'b' : 'c';
  const showVatWarning = turnover > 0 && turnover >= 2_000_000;

  return (
    <div className="space-y-4">
      <CollapsibleInfo label={t('license_step.info_body').slice(0, 42) + '…'}>
        {t('license_step.info_body')}
      </CollapsibleInfo>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('license_step.license_number_label')} required error={errors.licenseNumber}>
          <input
            type="text"
            className={`${inputCls(errors.licenseNumber)} ovds-mono`}
            placeholder={t('license_step.license_number_placeholder')}
            value={f.licenseNumber}
            onChange={(e) => updateLicense({ licenseNumber: e.target.value })}
          />
        </Field>
        <Field label={t('license_step.trade_name_label')} required error={errors.tradeName}>
          <input
            type="text"
            className={inputCls(errors.tradeName)}
            placeholder={t('license_step.trade_name_placeholder')}
            value={f.tradeName}
            onChange={(e) => updateLicense({ tradeName: e.target.value })}
          />
        </Field>
      </div>
      <Field label={t('license_step.activity_label')} required error={errors.activity}>
        <input
          type="text"
          className={inputCls(errors.activity)}
          placeholder={t('license_step.activity_placeholder')}
          value={f.activity}
          onChange={(e) => updateLicense({ activity: e.target.value })}
        />
      </Field>
      <Field label={t('license_step.address_label')} required error={errors.registeredAddress}>
        <input
          type="text"
          className={inputCls(errors.registeredAddress)}
          placeholder={t('license_step.address_placeholder')}
          value={f.registeredAddress}
          onChange={(e) => updateLicense({ registeredAddress: e.target.value })}
        />
      </Field>
      <Field
        label={t('license_step.turnover_label')}
        hint={turnover > 0 ? t(`license_step.turnover_category_${categoryKey}`) : undefined}
      >
        <input
          type="number"
          inputMode="numeric"
          className={inputCls()}
          placeholder={t('license_step.turnover_placeholder')}
          value={f.annualTurnover}
          min={0}
          onChange={(e) => updateLicense({ annualTurnover: e.target.value })}
        />
      </Field>
      {showVatWarning && (
        <CollapsibleInfo variant="warn" label={t('license_step.vat_warning').slice(0, 40) + '…'}>
          {t('license_step.vat_warning')}
        </CollapsibleInfo>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('license_step.issue_date_label')} hint={t('license_step.issue_date_hint')}>
          <input type="date" className={inputCls()} value={f.issuedAt} onChange={(e) => updateLicense({ issuedAt: e.target.value })} />
        </Field>
        <Field label={t('license_step.expiry_date_label')} hint={t('license_step.expiry_date_hint')}>
          <input type="date" className={inputCls()} value={f.expiresAt} onChange={(e) => updateLicense({ expiresAt: e.target.value })} />
        </Field>
      </div>
      <PortalLink name={t('license_step.portal_name')} url={t('license_step.portal_url')} legalBasis={t('license_step.legal_basis')} t={t} />
    </div>
  );
};

const VAT_STATUS_OPTIONS: VatRegistrationStatus[] = [
  'NOT_REGISTERED', 'PENDING_APPLICATION', 'REGISTERED', 'SUSPENDED', 'DEREGISTERED',
];

const ECR_STATUS_OPTIONS: EcrStatus[] = ['NOT_REQUIRED', 'REQUIRED_PENDING', 'REGISTERED'];

const VatStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, errors, updateVat } = reg;
  const f = draft.vat;
  const isRegistered = f.registrationStatus === 'REGISTERED';

  return (
    <div className="space-y-4">
      <CollapsibleInfo label={t('vat_step.info_body').slice(0, 42) + '…'}>
        {t('vat_step.info_body')}
      </CollapsibleInfo>
      <Field label={t('vat_step.registration_status_label')} required>
        <div className="grid grid-cols-1 gap-1.5">
          {VAT_STATUS_OPTIONS.map((value) => (
            <label
              key={value}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                f.registrationStatus === value
                  ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input type="radio" className="sr-only" checked={f.registrationStatus === value} onChange={() => updateVat({ registrationStatus: value })} />
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                f.registrationStatus === value ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]0' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {f.registrationStatus === value && <div className="w-1 h-1 rounded-full bg-white" />}
              </div>
              <div className="min-w-0 flex items-baseline gap-2">
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  {t(`vat_step.vat_status_options.${value.toLowerCase()}`)}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {t(`vat_step.vat_status_options.${value.toLowerCase()}_desc`)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </Field>

      {isRegistered && (
        <>
          <Field label={t('vat_step.vat_number_label')} required error={errors.vatNumber} hint={t('vat_step.vat_number_hint')}>
            <input
              type="text"
              className={`${inputCls(errors.vatNumber)} ovds-mono`}
              placeholder={t('vat_step.vat_number_placeholder')}
              value={f.vatNumber}
              onChange={(e) => updateVat({ vatNumber: e.target.value })}
            />
          </Field>
          <Field label={t('vat_step.ecr_label')} required>
            <select className={inputCls()} value={f.ecrStatus} onChange={(e) => updateVat({ ecrStatus: e.target.value as EcrStatus })}>
              {ECR_STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>{t(`vat_step.ecr_status_options.${value.toLowerCase()}`)}</option>
              ))}
            </select>
          </Field>
          {f.ecrStatus === 'REGISTERED' && (
            <Field label={t('vat_step.ecr_serial_label')} hint={t('vat_step.ecr_serial_hint')} error={errors.ecrSerial}>
              <input
                type="text"
                className={`${inputCls(errors.ecrSerial)} ovds-mono`}
                placeholder={t('vat_step.ecr_serial_placeholder')}
                value={f.ecrSerial}
                onChange={(e) => updateVat({ ecrSerial: e.target.value })}
              />
            </Field>
          )}
          <CollapsibleInfo variant="warn" label={t('vat_step.penalty_warning').slice(0, 42) + '…'}>
            {t('vat_step.penalty_warning')}
          </CollapsibleInfo>
        </>
      )}
      <PortalLink name={t('vat_step.portal_name')} url={t('vat_step.portal_url')} legalBasis={t('vat_step.legal_basis')} t={t} />
    </div>
  );
};

const CrossRefStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, updateCrossRef, harmonization } = reg;
  const f = draft.crossref;

  const allChecked = f.nidTinLinked && f.tinLicenseLinked && f.licenseVatLinked && f.morSystemActive;

  const verifyAll = () => updateCrossRef({ nidTinLinked: true, tinLicenseLinked: true, licenseVatLinked: true, morSystemActive: true });

  const checks: { key: keyof typeof f; label: string; desc: string }[] = [
    { key: 'nidTinLinked',     label: t('harmonization.nid_tin_linked'),      desc: t('harmonization.nid_tin_desc') },
    { key: 'tinLicenseLinked', label: t('harmonization.tin_license_verified'), desc: t('harmonization.tin_license_desc') },
    { key: 'licenseVatLinked', label: t('harmonization.license_vat_linked'),   desc: t('harmonization.license_vat_desc') },
    { key: 'morSystemActive',  label: t('harmonization.mor_activated'),        desc: t('harmonization.mor_desc') },
  ];

  const pct = harmonization.completionPct ?? 0;
  const docLabels: Record<string, string> = {
    nid: t('summary.national_id'), tin: t('summary.taxpayer_id'),
    businessLicense: t('summary.business_license'), vat: t('summary.vat_registration'),
  };

  return (
    <div className="space-y-4">
      <CollapsibleInfo label={t('crossref_step.info_body').slice(0, 42) + '…'}>
        {t('crossref_step.info_body')}
      </CollapsibleInfo>

      {/* Checklist header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {t('harmonization.verification_checklist')}
        </p>
        <button
          type="button"
          onClick={verifyAll}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            allChecked
              ? 'bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] border border-[var(--pro-azure-100)] dark:border-green-800/40'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 size={11} />
          {allChecked ? t('buttons.all_verified') : t('buttons.verify_all')}
        </button>
      </div>

      <div className="space-y-2">
        {checks.map((c) => (
          <label
            key={c.key}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all group ${
              f[c.key as keyof typeof f]
                ? 'border-[var(--pro-azure)] dark:border-[var(--pro-azure-light)] bg-[var(--pro-azure-50)]/50 dark:bg-green-900/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              f[c.key as keyof typeof f]
                ? 'bg-[var(--pro-azure-50)]0 border-[var(--pro-azure)]'
                : 'border-slate-300 dark:border-slate-600 group-hover:border-[var(--pro-azure)]'
            }`}>
              {f[c.key as keyof typeof f] && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
              <input
                type="checkbox"
                className="sr-only"
                checked={!!f[c.key as keyof typeof f]}
                onChange={(e) => updateCrossRef({ [c.key]: e.target.checked })}
              />
            </div>
            <div className="min-w-0 flex items-baseline gap-2">
              <p className={`text-xs font-bold transition-colors ${f[c.key as keyof typeof f] ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-slate-700 dark:text-slate-300'}`}>
                {c.label}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{c.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <Field label={t('harmonization.conflict_notes')} hint={t('harmonization.conflict_notes_hint')}>
        <textarea
          className={`${inputCls()} resize-none`}
          rows={2}
          placeholder={t('crossref_step.conflict_notes_placeholder')}
          value={f.conflictNotes}
          onChange={(e) => updateCrossRef({ conflictNotes: e.target.value })}
        />
      </Field>

      {/* Slim progress summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('harmonization.progress')}</span>
          <span className="font-bold text-slate-600 dark:text-slate-300">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          {(['nid', 'tin', 'businessLicense', 'vat'] as const).map((k) => {
            const exists = !!harmonization[k];
            return (
              <div key={k} className={`flex flex-col items-center gap-1 py-1.5 rounded-lg text-[9px] font-bold ${
                exists ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-900/20' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
              }`}>
                {exists ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                <span className="leading-none text-center">{docLabels[k]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <PortalLink name={t('crossref_step.portal_name')} url={t('crossref_step.portal_url')} legalBasis={t('crossref_step.legal_basis')} t={t} />
    </div>
  );
};

const StepPanel: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  switch (reg.currentStep) {
    case 'nid':      return <NidStep reg={reg} t={t} />;
    case 'tin':      return <TinStep reg={reg} t={t} />;
    case 'license':  return <LicenseStep reg={reg} t={t} />;
    case 'vat':      return <VatStep reg={reg} t={t} />;
    case 'crossref': return <CrossRefStep reg={reg} t={t} />;
  }
};

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

const SuccessScreen: React.FC<{
  onReset: () => void;
  pct: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}> = ({ onReset, pct, t }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center px-4 animate-in fade-in slide-in-from-bottom-4">
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 bg-[var(--pro-azure-200)] dark:bg-green-800/40 rounded-full animate-ping opacity-25" style={{ animationDuration: '2.5s' }} />
      <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
        <BadgeCheck size={40} className="text-white" />
      </div>
    </div>
    <div className="space-y-2 max-w-md">
      <h2 className="ovds-hero-title text-slate-900 dark:text-white">{t('success.title')}</h2>
      <p className="ovds-body text-slate-500 leading-relaxed">{t('success.description')}</p>
      <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-[var(--pro-azure-50)] dark:bg-green-900/20 rounded-full">
        <Star size={12} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
        <span className="text-xs font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
          {t('success.score', { pct })}
        </span>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-3">
      <a
        href="/compliance/auditor"
        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20"
      >
        <ShieldCheck size={15} /> {t('success.view_compliance')}
      </a>
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
      >
        <RefreshCw size={14} /> {t('buttons.register_another')}
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Save status pill — inline, tiny
// ---------------------------------------------------------------------------

const SavePill: React.FC<{ status: 'idle' | 'saving' | 'saved' | 'error' }> = ({ status }) => {
  if (status === 'idle') return null;
  const map = {
    saving: { icon: <Loader2 size={9} className="animate-spin" />, label: 'Saving…', cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
    saved:  { icon: <CheckCircle2 size={9} />,                     label: 'Saved',   cls: 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-900/20' },
    error:  { icon: <XCircle size={9} />,                          label: 'Failed',  cls: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20' },
  } as const;
  const { icon, label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      {icon} {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Slim vertical step rail (replaces WizardStepper for the sidebar)
// ---------------------------------------------------------------------------

const StepRail: React.FC<{
  steps: { id: WizardStepId; label: string }[];
  currentIndex: number;
  onStepClick: (i: number) => void;
}> = ({ steps, currentIndex, onStepClick }) => (
  <div className="flex flex-col gap-1 py-1">
    {steps.map((s, i) => {
      const done    = i < currentIndex;
      const active  = i === currentIndex;
      const locked  = i > currentIndex;
      return (
        <button
          key={s.id}
          type="button"
          disabled={locked}
          onClick={() => !locked && onStepClick(i)}
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
            active  ? 'bg-[var(--pro-azure-50)] dark:bg-green-900/20'   :
            done    ? 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer' :
                      'opacity-40 cursor-default'
          }`}
        >
          {/* Node */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            active  ? 'bg-[var(--pro-azure-50)]0 text-white shadow-sm shadow-green-500/30' :
            done    ? 'bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            {done
              ? <CheckCircle2 size={13} />
              : STEP_ICONS[s.id]
            }
          </div>

          {/* Label */}
          <div className="min-w-0">
            <p className={`text-xs font-bold leading-tight ${
              active  ? 'text-[var(--pro-azure-dark)] dark:text-green-300' :
              done    ? 'text-slate-600 dark:text-slate-300' :
                        'text-slate-400'
            }`}>
              {s.label}
            </p>
            {active && (
              <p className="text-[10px] text-slate-400 mt-0.5">{i + 1} of {steps.length}</p>
            )}
          </div>
        </button>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const BusinessRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const i18nT = i18n.t.bind(i18n);
  const reg = useBusinessRegistration();
  usePageTitle(t('page.title'));

  const {
    stepIndex, currentStep, totalSteps, saving, submitting, submitted,
    goBack, goNext, handleSubmit, resetWizard, goToStep,
    completionPct, overallStatus, harmonization,
    isFirstStep, isLastStep,
    loadingRecord, hasExistingRecord, saveStatus,
    refetchRecord,
  } = reg;

  const [selectedStructureId, setSelectedStructureId] = useState<string>('plc');
  const [showStructurePanel, setShowStructurePanel] = useState(true);

  const structures = useMemo<BusinessStructure[]>(() =>
    STRUCTURE_IDS.map((id) => ({
      id,
      label: t(`structures.${id}.label`),
      shortLabel: t(`structures.${id}.shortLabel`),
      icon: ({
        plc:                  <Building2 size={18} />,
        share_company:        <CreditCard size={18} />,
        one_person:           <Fingerprint size={18} />,
        llp:                  <Link2 size={18} />,
        general_partnership:  <Users size={18} />,
        limited_partnership:  <ShieldCheck size={18} />,
        sole_proprietor:      <Hash size={18} />,
      } as Record<string, React.ReactNode>)[id],
      minFounders:   t(`structures.${id}.minFounders`),
      minCapital:    t(`structures.${id}.minCapital`),
      liability:     t(`structures.${id}.liability`),
      taxRegime:     t(`structures.${id}.taxRegime`),
      proclamation:  t(`structures.${id}.proclamation`),
      highlights:    (i18nT(`structures.${id}.highlights`, { returnObjects: true }) as string[]) || [],
      badge:         t(`structures.${id}.badge`) || '',
      badgeVariant: ({
        plc:                  'none',
        share_company:        'public',
        one_person:           'new',
        llp:                  'new',
        general_partnership:  'none',
        limited_partnership:  'none',
        sole_proprietor:      'none',
      } as Record<string, BusinessStructure['badgeVariant']>)[id] ?? 'none',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    })), [t]);

  const wizardSteps = useMemo(() =>
    (['nid', 'tin', 'license', 'vat', 'crossref'] as WizardStepId[]).map((id) => ({
      id,
      label: t(`wizard.steps.${id}`),
      description: t(`wizard.step_descriptions.${id}`),
      icon: STEP_ICONS[id],
    })), [t]);

  const selectedStructure = structures.find((s) => s.id === selectedStructureId) ?? structures[0];
  const meta = {
    icon: STEP_ICONS[currentStep],
    label: t(`wizard.steps.${currentStep}`),
    description: t(`wizard.step_descriptions.${currentStep}`),
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loadingRecord && !hasExistingRecord) {
    return (
      <AppPage
        title={t('page.title')}
        subtitle={t('page.subtitle')}
        icon={<Building2 size={16} />}
        iconBg="bg-[var(--pro-azure-50)]0"
        crumbs={[{ label: t('page.breadcrumb_system') }, { label: t('page.breadcrumb_business') }]}
      >
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="ovds-widget-card">
              <div className="ovds-widget-body">
                <div className="space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AppPage>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <AppPage
        title={t('page.title')}
        subtitle={t('page.subtitle')}
        icon={<Building2 size={16} />}
        iconBg="bg-[var(--pro-azure-50)]0"
        actions={
          <button onClick={() => navigate('/compliance/auditor')} className="flex items-center gap-2 ovds-btn-primary">
            <ShieldCheck size={14} /> {t('page.actions.compliance_status')}
          </button>
        }
      >
        <SuccessScreen onReset={resetWizard} pct={completionPct} t={t} />
      </AppPage>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <AppPage
      title={t('page.title')}
      subtitle={t('page.subtitle_detail')}
      icon={<Building2 size={16} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: t('page.breadcrumb_system') }, { label: t('page.breadcrumb_business') }]}
      actions={
        <a
          href="https://etrade.gov.et"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 ovds-btn-secondary text-xs"
        >
          <Globe size={13} /> eTrade <ExternalLink size={11} />
        </a>
      }
    >
      {/* ── Hero status row ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <ProgressRing
          pct={completionPct}
          status={overallStatus}
          structureLabel={selectedStructure.shortLabel}
        />

        {/* Record actions — right-aligned, compact */}
        <div className="flex items-center gap-2 shrink-0">
          {hasExistingRecord && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] border border-[var(--pro-azure-100)] dark:border-green-800/40">
              <BadgeCheck size={9} /> {t('record.saved_detected')}
            </span>
          )}
          {hasExistingRecord && (
            <button
              type="button"
              onClick={refetchRecord}
              disabled={loadingRecord}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <RefreshCw size={11} className={loadingRecord ? 'animate-spin' : ''} />
              {t('buttons.refresh')}
            </button>
          )}
        </div>
      </div>

      {/* ── Panel A: Business Structure ──────────────────────────────────── */}
      <div className="ovds-widget-card mb-4">
        {/* Collapsed header — always visible */}
        <button
          type="button"
          onClick={() => setShowStructurePanel(v => !v)}
          className="w-full ovds-widget-header flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-t-[inherit]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[var(--pro-azure-50)] dark:bg-green-900/20 flex items-center justify-center shrink-0">
              <Building2 size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            </div>
            <div className="min-w-0 text-left">
              <span className="ovds-card-title block">{t('structure.title')}</span>
              {!showStructurePanel && (
                <span className="text-[11px] text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-semibold">
                  {selectedStructure.label}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Legal info badge — collapsed by default */}
            <CollapsibleInfo label={t('structure.intro_title')}>
              <p className="text-[11px] leading-relaxed">{t('structure.intro_desc')}</p>
              <p className="mt-1 text-[10px] font-semibold">
                {t('structure.legal_essentials_title')} {t('structure.legal_essentials_body')}
              </p>
            </CollapsibleInfo>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${showStructurePanel ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Icon grid — visible when panel is open */}
        {showStructurePanel && (
          <div className="ovds-widget-body pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {structures.map((s) => (
                <StructureCard
                  key={s.id}
                  s={s}
                  selected={selectedStructureId === s.id}
                  onSelect={() => setSelectedStructureId(s.id)}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Panel B: ID Harmonization Wizard ─────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* ── Left: slim step rail (desktop only) ── */}
        <aside className="hidden lg:block w-52 shrink-0 ovds-widget-card">
          <div className="ovds-widget-header pb-2">
            <span className="ovds-card-title">{t('wizard.registration_steps')}</span>
          </div>
          <div className="ovds-widget-body pt-1 pb-2">
            <StepRail
              steps={wizardSteps}
              currentIndex={stepIndex}
              onStepClick={(i) => i < stepIndex && goToStep(i)}
            />
          </div>
          {/* Inline ring summary in sidebar */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">{completionPct}% {t('harmonization.progress').toLowerCase()}</p>
            </div>
          </div>
        </aside>

        {/* ── Right: step content ── */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Mobile horizontal stepper */}
          <div className="lg:hidden ovds-widget-card">
            <div className="ovds-widget-body">
              <WizardStepper
                steps={wizardSteps}
                currentIndex={stepIndex}
                variant="horizontal"
                onStepClick={(i) => i < stepIndex && goToStep(i)}
              />
            </div>
          </div>

          {/* Step card */}
          <div className="ovds-widget-card">
            {/* Step header */}
            <div className="ovds-widget-header">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-900/20 flex items-center justify-center text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0">
                  {meta.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="ovds-card-title">
                      {t('wizard.step_of', { n: stepIndex + 1, total: totalSteps, label: meta.label })}
                    </h2>
                  </div>
                  <p className="ovds-caption text-slate-400 mt-0.5 leading-relaxed max-w-xl">
                    {meta.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Step body */}
            <div className="ovds-widget-body pt-5">
              <StepPanel reg={reg} t={t} />
            </div>

            {/* Footer — back / next / submit */}
            <div className="ovds-widget-footer">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Back */}
                <button
                  type="button"
                  onClick={isFirstStep ? () => navigate(-1) : goBack}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <ArrowLeft size={14} />
                  {isFirstStep ? t('buttons.cancel') : t('buttons.back')}
                </button>

                {/* Right side: save pill + progress dots + primary action */}
                <div className="flex items-center gap-3">
                  <SavePill status={saveStatus} />

                  {/* Progress dots */}
                  <div className="hidden sm:flex items-center gap-1">
                    {wizardSteps.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          i < stepIndex  ? 'w-1.5 h-1.5 bg-[var(--pro-azure-50)]0' :
                          i === stepIndex ? 'w-2.5 h-1.5 bg-[var(--pro-azure-50)]0' :
                                            'w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Primary CTA */}
                  {isLastStep ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                      {submitting ? t('buttons.submitting') : t('buttons.complete_harmonization')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <>{t('buttons.next')} <ArrowRight size={14} /></>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step breadcrumb trail — icon + chevron only */}
          <div className="ovds-widget-card">
            <div className="ovds-widget-body py-3">
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {(['nid', 'tin', 'license', 'vat', 'crossref'] as WizardStepId[]).map((s, i) => (
                  <React.Fragment key={s}>
                    <button
                      onClick={() => i <= stepIndex && goToStep(i)}
                      title={t(`wizard.steps.${s}`)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                        s === currentStep
                          ? 'bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] ring-1 ring-[var(--pro-azure)]'
                          : i < stepIndex
                          ? 'bg-slate-100 dark:bg-slate-800 text-[var(--pro-azure)] dark:text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20 cursor-pointer'
                          : 'bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600 cursor-default'
                      }`}
                    >
                      {STEP_ICONS[s]}
                      <span className="hidden sm:inline">{t(`wizard.steps.${s}`)}</span>
                    </button>
                    {i < 4 && <ChevronRight size={11} className="text-slate-300 dark:text-slate-600 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppPage>
  );
};

export default BusinessRegistration;
