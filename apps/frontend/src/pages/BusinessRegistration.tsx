/**
 * BusinessRegistration — Ethiopian Commercial Registration & ID Harmonization
 *
 * Two-panel page:
 *   Panel A — Business Structure Selector (2021 Commercial Code)
 *             Choose legal form: PLC · Share Company · One-Person Company ·
 *             LLP · General Partnership · Limited Partnership · Sole Proprietor
 *   Panel B — Government ID Harmonization Wizard (5 steps)
 *             NID → TIN → Business License → VAT → Cross-Reference
 *
 * Legal basis: Ethiopian Commercial Code (Proclamation No. 1243/2021),
 * Tax Administration Proc. 983/2016, VAT Proc. 1341/2024, NID Proc. 1024/2017.
 *
 * Design: OVDS Grid UI — AppPage, WizardStepper, ovds-widget-card
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Eye,
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
import { Users } from 'lucide-react';
import {
  WizardStepper,
  ContextStrip,
  ContextPill,
  GridStatBar,
  AppPage,
  fmtTin,
  usePageTitle,
} from '@ovds/ui';
import {
  EcrStatus,
  HarmonizationStatus,
  VatRegistrationStatus,
  fmtFaydaId,
} from '@ovds/shared';
import {
  useBusinessRegistration,
  type WizardStepId,
} from '../hooks/useBusinessRegistration';

// -- Business structure definitions (2021 Commercial Code) --------------------

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

const STRUCTURE_IDS = ['plc', 'share_company', 'one_person', 'llp', 'general_partnership', 'limited_partnership', 'sole_proprietor'] as const;

// -- Business structure selector panel --------------------------------------

const StructureBadge: React.FC<{ label: string; variant: 'new' | 'public' }> = ({ label, variant }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${
    variant === 'new'
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
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
    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
      selected
        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-500/10'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
    }`}
  >
    <div className="flex items-start gap-3">
      {/* Radio indicator */}
      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'
      }`}>
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      {/* Icon + header */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`transition-colors ${selected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {s.icon}
          </span>
          <span className={`text-sm font-bold leading-tight transition-colors ${selected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
            {s.label}
          </span>
          {s.badgeVariant !== 'none' && <StructureBadge label={s.badge} variant={s.badgeVariant} />}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
          <span><span className="font-semibold text-slate-600 dark:text-slate-300">{t('structure.field_labels.founders')}</span> {s.minFounders}</span>
          <span><span className="font-semibold text-slate-600 dark:text-slate-300">{t('structure.field_labels.capital')}</span> {s.minCapital}</span>
          <span><span className="font-semibold text-slate-600 dark:text-slate-300">{t('structure.field_labels.liability')}</span> {s.liability}</span>
          <span><span className="font-semibold text-slate-600 dark:text-slate-300">{t('structure.field_labels.tax')}</span> {s.taxRegime}</span>
        </div>
        {selected && (
          <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {s.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={11} className="shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.proclamation}</p>
          </div>
        )}
      </div>
    </div>
  </button>
);

// -- Local types ---------------------------------------------------------------

interface WizardStep {
  id: WizardStepId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// -- Wizard metadata -----------------------------------------------------------

const STEP_ICONS: Record<WizardStepId, React.ReactNode> = {
  nid: <Fingerprint size={18} />,
  tin: <Hash size={18} />,
  license: <Building2 size={18} />,
  vat: <Banknote size={18} />,
  crossref: <Link2 size={18} />,
};

// -- Shared input style --------------------------------------------------------

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
      {hint && <span className="ovds-caption text-slate-400">{hint}</span>}
    </div>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-[11px] text-rose-500 font-bold animate-in fade-in slide-in-from-top-1">
        <AlertTriangle size={11} /> {error}
      </p>
    )}
  </div>
);

const InfoBox: React.FC<{ children: React.ReactNode; variant?: 'info' | 'warn' }> = ({
  children,
  variant = 'info',
}) => (
  <div
    className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-xs leading-relaxed ${
      variant === 'warn'
        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
        : 'bg-sky-50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-800/40 text-sky-800 dark:text-sky-300'
    }`}
  >
    {variant === 'warn' ? <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" /> : <Info size={14} className="shrink-0 mt-0.5 text-sky-500" />}
    <span>{children}</span>
  </div>
);

const PortalLink: React.FC<{ name: string; url: string; legalBasis: string; t: (key: string) => string }> = ({
  name,
  url,
  legalBasis,
  t,
}) => (
  <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
    <div className="space-y-0.5 min-w-0">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('portal.official_portal')}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:underline"
      >
        <Globe size={12} /> {name} <ExternalLink size={10} />
      </a>
      <p className="ovds-caption text-slate-400">{legalBasis}</p>
    </div>
  </div>
);

// -- Status badge --------------------------------------------------------------

const StatusChip: React.FC<{ status: HarmonizationStatus; pct: number; t: (key: string) => string }> = ({ status, pct, t }) => {
  const map: Record<HarmonizationStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    INCOMPLETE:       { label: t('status.incomplete'),      cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500',             icon: <Clock size={11} /> },
    IN_PROGRESS:      { label: t('status.in_progress'),     cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',  icon: <RefreshCw size={11} /> },
    ACTION_REQUIRED:  { label: t('status.action_required'), cls: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',     icon: <AlertTriangle size={11} /> },
    HARMONIZED:       { label: t('status.harmonized'),      cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400', icon: <BadgeCheck size={11} /> },
  };
  const { label, cls, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cls}`}>
      {icon} {label} — {pct}%
    </span>
  );
};

// -- Step panels ---------------------------------------------------------------

// Step 1: Fayda NID
const NidStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, errors, updateNid } = reg;
  const f = draft.nid;
  return (
    <div className="space-y-5">
      <InfoBox>
        {t('nid_step.info_body')}
      </InfoBox>
      <div className="space-y-4">
        <Field label={t('nid_step.fayda_id_label')} required hint={t('nid_step.fayda_id_hint')} error={errors.faydaId}>
          <input
            type="text"
            inputMode="numeric"
            className={`${inputCls(errors.faydaId)} ovds-mono tracking-widest`}
            placeholder={t('nid_step.fayda_id_placeholder')}
            value={fmtFaydaId(f.faydaId)}
            maxLength={14}
            onChange={(e) => updateNid({ faydaId: e.target.value.replace(/\D/g, '') })}
          />
        </Field>
        <Field label={t('nid_step.full_name_label')} required error={errors.fullName}>
          <input
            type="text"
            className={inputCls(errors.fullName)}
            placeholder={t('nid_step.full_name_placeholder')}
            value={f.fullName}
            onChange={(e) => updateNid({ fullName: e.target.value })}
          />
        </Field>
        <Field label={t('nid_step.dob_label')} hint={t('nid_step.dob_hint')}>
          <input
            type="date"
            className={inputCls()}
            value={f.dateOfBirth}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => updateNid({ dateOfBirth: e.target.value })}
          />
        </Field>
      </div>
      <PortalLink
        name={t('nid_step.portal_name')}
        url={t('nid_step.portal_url')}
        legalBasis={t('nid_step.legal_basis')}
        t={t}
      />
    </div>
  );
};

// Step 2: TIN
const TinStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, errors, updateTin } = reg;
  const f = draft.tin;
  return (
    <div className="space-y-5">
      <InfoBox>
        {t('tin_step.info_body')}
      </InfoBox>
      <div className="space-y-4">
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
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-teal-400"
            checked={f.biometricComplete}
            onChange={(e) => updateTin({ biometricComplete: e.target.checked })}
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-relaxed">
            {t('tin_step.biometric_checkbox')}
          </span>
        </label>
      </div>
      <PortalLink
        name={t('tin_step.portal_name')}
        url={t('tin_step.portal_url')}
        legalBasis={t('tin_step.legal_basis')}
        t={t}
      />
    </div>
  );
};

// Step 3: Business License
const LicenseStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, errors, updateLicense } = reg;
  const f = draft.license;
  const turnover = parseFloat(f.annualTurnover || '0');
  const categoryKey = turnover >= 2_000_000 ? 'a' : turnover >= 500_000 ? 'b' : 'c';
  const showVatWarning = turnover > 0 && turnover >= 2_000_000;

  return (
    <div className="space-y-5">
      <InfoBox>
        {t('license_step.info_body')}
      </InfoBox>
      <div className="space-y-4">
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
          <InfoBox variant="warn">
            {t('license_step.vat_warning')}
          </InfoBox>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('license_step.issue_date_label')} hint={t('license_step.issue_date_hint')}>
            <input
              type="date"
              className={inputCls()}
              value={f.issuedAt}
              onChange={(e) => updateLicense({ issuedAt: e.target.value })}
            />
          </Field>
          <Field label={t('license_step.expiry_date_label')} hint={t('license_step.expiry_date_hint')}>
            <input
              type="date"
              className={inputCls()}
              value={f.expiresAt}
              onChange={(e) => updateLicense({ expiresAt: e.target.value })}
            />
          </Field>
        </div>
      </div>
      <PortalLink
        name={t('license_step.portal_name')}
        url={t('license_step.portal_url')}
        legalBasis={t('license_step.legal_basis')}
        t={t}
      />
    </div>
  );
};

// Step 4: VAT Registration
const VAT_STATUS_OPTIONS: VatRegistrationStatus[] = [
  'NOT_REGISTERED',
  'PENDING_APPLICATION',
  'REGISTERED',
  'SUSPENDED',
  'DEREGISTERED',
];

const ECR_STATUS_OPTIONS: EcrStatus[] = [
  'NOT_REQUIRED',
  'REQUIRED_PENDING',
  'REGISTERED',
];

const VatStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, errors, updateVat } = reg;
  const f = draft.vat;
  const isRegistered = f.registrationStatus === 'REGISTERED';

  return (
    <div className="space-y-5">
      <InfoBox>
        {t('vat_step.info_body')}
      </InfoBox>
      <div className="space-y-4">
        <Field label={t('vat_step.registration_status_label')} required>
          <div className="grid grid-cols-1 gap-2">
            {VAT_STATUS_OPTIONS.map((value) => {
              const labelKey = `vat_step.vat_status_options.${value.toLowerCase()}`;
              const descKey = `vat_step.vat_status_options.${value.toLowerCase()}_desc`;
              return (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    f.registrationStatus === value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={f.registrationStatus === value}
                    onChange={() => updateVat({ registrationStatus: value })}
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      f.registrationStatus === value
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {f.registrationStatus === value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{t(labelKey)}</p>
                    <p className="ovds-caption text-slate-400">{t(descKey)}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Field>

        {isRegistered && (
          <Field label={t('vat_step.vat_number_label')} required error={errors.vatNumber} hint={t('vat_step.vat_number_hint')}>
            <input
              type="text"
              className={`${inputCls(errors.vatNumber)} ovds-mono`}
              placeholder={t('vat_step.vat_number_placeholder')}
              value={f.vatNumber}
              onChange={(e) => updateVat({ vatNumber: e.target.value })}
            />
          </Field>
        )}

        {isRegistered && (
          <>
            <Field label={t('vat_step.ecr_label')} required>
              <select
                className={inputCls()}
                value={f.ecrStatus}
                onChange={(e) => updateVat({ ecrStatus: e.target.value as EcrStatus })}
              >
                {ECR_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`vat_step.ecr_status_options.${value.toLowerCase()}`)}
                  </option>
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
            <InfoBox variant="warn">
              {t('vat_step.penalty_warning')}
            </InfoBox>
          </>
        )}
      </div>
      <PortalLink
        name={t('vat_step.portal_name')}
        url={t('vat_step.portal_url')}
        legalBasis={t('vat_step.legal_basis')}
        t={t}
      />
    </div>
  );
};

// Step 5: Cross-Reference
const CrossRefStep: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  const { draft, updateCrossRef, harmonization } = reg;
  const f = draft.crossref;

  const allChecked = f.nidTinLinked && f.tinLicenseLinked && f.licenseVatLinked && f.morSystemActive;

  const verifyAll = () => {
    updateCrossRef({
      nidTinLinked: true,
      tinLicenseLinked: true,
      licenseVatLinked: true,
      morSystemActive: true,
    });
  };

  const checks = [
    {
      key: 'nidTinLinked' as const,
      label: t('harmonization.nid_tin_linked'),
      desc: t('harmonization.nid_tin_desc'),
    },
    {
      key: 'tinLicenseLinked' as const,
      label: t('harmonization.tin_license_verified'),
      desc: t('harmonization.tin_license_desc'),
    },
    {
      key: 'licenseVatLinked' as const,
      label: t('harmonization.license_vat_linked'),
      desc: t('harmonization.license_vat_desc'),
    },
    {
      key: 'morSystemActive' as const,
      label: t('harmonization.mor_activated'),
      desc: t('harmonization.mor_desc'),
    },
  ];

  return (
    <div className="space-y-5">
      <InfoBox>
        {t('crossref_step.info_body')}
      </InfoBox>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('harmonization.verification_checklist')}</p>
        <button
          type="button"
          onClick={verifyAll}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            allChecked
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 size={11} />
          {allChecked ? t('buttons.all_verified') : t('buttons.verify_all')}
        </button>
      </div>

      <div className="space-y-3">
        {checks.map((c) => (
          <label
            key={c.key}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all group ${
              f[c.key]
                ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              f[c.key]
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'
            }`}>
              {f[c.key] && <CheckCircle2 size={13} className="text-white" strokeWidth={3} />}
              <input
                type="checkbox"
                className="sr-only"
                checked={f[c.key]}
                onChange={(e) => updateCrossRef({ [c.key]: e.target.checked })}
              />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold transition-colors ${f[c.key] ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {c.label}
              </p>
              <p className="ovds-caption text-slate-400 mt-0.5 leading-relaxed">{c.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <Field label={t('harmonization.conflict_notes')} hint={t('harmonization.conflict_notes_hint')}>
        <textarea
          className={`${inputCls()} resize-none`}
          rows={3}
          placeholder={t('crossref_step.conflict_notes_placeholder')}
          value={f.conflictNotes}
          onChange={(e) => updateCrossRef({ conflictNotes: e.target.value })}
        />
      </Field>

      {/* Live harmonization summary */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-slate-600 dark:text-slate-400">{t('harmonization.progress')}</p>
          <StatusChip status={harmonization.overallStatus ?? 'INCOMPLETE'} pct={harmonization.completionPct ?? 0} t={t} />
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${harmonization.completionPct ?? 0}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {(['nid', 'tin', 'businessLicense', 'vat'] as const).map((k) => {
            const labels: Record<string, string> = {
              nid: t('summary.national_id'), tin: t('summary.taxpayer_id'), businessLicense: t('summary.business_license'), vat: t('summary.vat_registration'),
            };
            const exists = !!harmonization[k];
            return (
              <div key={k} className={`flex items-center gap-1.5 p-2 rounded-lg text-[11px] font-bold ${
                exists ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
              }`}>
                {exists ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {labels[k]}
              </div>
            );
          })}
        </div>
      </div>

      <PortalLink
        name={t('crossref_step.portal_name')}
        url={t('crossref_step.portal_url')}
        legalBasis={t('crossref_step.legal_basis')}
        t={t}
      />
    </div>
  );
};

// -- Step router ---------------------------------------------------------------

const StepPanel: React.FC<{ reg: ReturnType<typeof useBusinessRegistration>; t: (key: string) => string }> = ({ reg, t }) => {
  switch (reg.currentStep) {
    case 'nid':      return <NidStep reg={reg} t={t} />;
    case 'tin':      return <TinStep reg={reg} t={t} />;
    case 'license':  return <LicenseStep reg={reg} t={t} />;
    case 'vat':      return <VatStep reg={reg} t={t} />;
    case 'crossref': return <CrossRefStep reg={reg} t={t} />;
  }
};

// -- Success screen ------------------------------------------------------------

const SuccessScreen: React.FC<{ onReset: () => void; pct: number; t: (key: string, opts?: Record<string, unknown>) => string }> = ({ onReset, pct, t }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center px-4 animate-in fade-in slide-in-from-bottom-4">
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-800/40 rounded-full animate-ping opacity-25" style={{ animationDuration: '2.5s' }} />
      <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
        <BadgeCheck size={40} className="text-white" />
      </div>
    </div>
    <div className="space-y-2 max-w-md">
      <h2 className="ovds-hero-title text-slate-900 dark:text-white">
        {t('success.title')}
      </h2>
      <p className="ovds-body text-slate-500 leading-relaxed">
        {t('success.description')}
      </p>
      <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
        <Star size={12} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
          {t('success.score', { pct })}
        </span>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-3">
      <a
        href="/compliance/auditor"
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
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

// -- Main Page -----------------------------------------------------------------

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
    refetchRecord, invalidateCache,
  } = reg;

  const [selectedStructureId, setSelectedStructureId] = useState<string>('plc');
  const [showStructurePanel, setShowStructurePanel] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  const structures = useMemo<BusinessStructure[]>(() => STRUCTURE_IDS.map((id) => ({
    id,
    label: t(`structures.${id}.label`),
    shortLabel: t(`structures.${id}.shortLabel`),
    icon: {
      plc: <Building2 size={20} />,
      share_company: <CreditCard size={20} />,
      one_person: <Fingerprint size={20} />,
      llp: <Link2 size={20} />,
      general_partnership: <Users size={20} />,
      limited_partnership: <ShieldCheck size={20} />,
      sole_proprietor: <Hash size={20} />,
    }[id],
    minFounders: t(`structures.${id}.minFounders`),
    minCapital: t(`structures.${id}.minCapital`),
    liability: t(`structures.${id}.liability`),
    taxRegime: t(`structures.${id}.taxRegime`),
    proclamation: t(`structures.${id}.proclamation`),
    highlights: (i18nT(`structures.${id}.highlights`, { returnObjects: true }) as string[]) || [],
    badge: t(`structures.${id}.badge`) || '',
    badgeVariant: ({
      plc: 'none',
      share_company: 'public',
      one_person: 'new',
      llp: 'new',
      general_partnership: 'none',
      limited_partnership: 'none',
      sole_proprietor: 'none',
    } as Record<string, BusinessStructure['badgeVariant']>)[id] ?? 'none',
  })), [t]);

  const wizardSteps = useMemo(() => ([
    'nid', 'tin', 'license', 'vat', 'crossref',
  ] as WizardStepId[]).map((id) => ({
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

  const kpiCells = [
    { label: t('kpi.steps_completed'), value: `${stepIndex}/${totalSteps}`, accentCls: 'bg-emerald-500' },
    { label: t('kpi.completion'), value: `${completionPct}%`, accentCls: completionPct === 100 ? 'bg-emerald-500' : 'bg-amber-500' },
    { label: t('kpi.structure'), value: selectedStructure.shortLabel, accentCls: 'bg-sky-500' },
    { label: t('kpi.status'), value: overallStatus.replace('_', ' '), accentCls: overallStatus === 'HARMONIZED' ? 'bg-emerald-500' : 'bg-slate-400' },
  ];

  // Show loading skeleton while fetching existing record on mount
  if (loadingRecord && !hasExistingRecord) {
    return (
      <AppPage
        title={t('page.title')}
        subtitle={t('page.subtitle')}
        icon={<Building2 size={16} />}
        iconBg="bg-emerald-500"
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

  if (submitted) {
    return (
      <AppPage
        title={t('page.title')}
         subtitle={t('page.subtitle')}
        icon={<Building2 size={16} />}
        iconBg="bg-emerald-500"
        actions={
          <button
            onClick={() => navigate('/compliance/auditor')}
            className="flex items-center gap-2 ovds-btn-primary"
          >
            <ShieldCheck size={14} /> {t('page.actions.compliance_status')}
          </button>
        }
      >
        <SuccessScreen onReset={resetWizard} pct={completionPct} t={t} />
      </AppPage>
    );
  }

  return (
      <AppPage
        title={t('page.title')}
         subtitle={t('page.subtitle_detail')}
        icon={<Building2 size={16} />}
        iconBg="bg-emerald-500"
        crumbs={[{ label: t('page.breadcrumb_system') }, { label: t('page.breadcrumb_business') }]}
      actions={
        <a
          href="https://etrade.gov.et"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 ovds-btn-secondary text-xs"
        >
          <Globe size={13} /> {t('page.actions.etrade_portal')} <ExternalLink size={11} />
        </a>
      }
    >
      {/* Context strip */}
      <ContextStrip>
        <ContextPill
          leading={<Building2 size={11} />}
          label={t('context.commercial_code')}
        />
        <ContextPill
          leading={<ShieldCheck size={11} />}
          label={t('context.identifiers')}
        />
        <ContextPill
          variant={overallStatus === 'HARMONIZED' ? 'success' : overallStatus === 'ACTION_REQUIRED' ? 'alert' : 'info'}
          live={overallStatus === 'IN_PROGRESS'}
          label={t('context.complete_pct', { pct: completionPct })}
          className="ml-auto"
        />
      </ContextStrip>

      {/* KPI bar */}
      <GridStatBar cells={kpiCells} />

      {/* Record status + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {hasExistingRecord && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <BadgeCheck size={10} /> {t('record.saved_detected')}
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
              <Loader2 size={10} className="animate-spin" /> {t('record.saving')}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 size={10} /> {t('record.saved')}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
              <XCircle size={10} /> {t('record.save_failed')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSummary(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Eye size={11} />
            {showSummary ? t('buttons.hide') : t('buttons.show')} {t('buttons.summary')}
          </button>
          {hasExistingRecord && (
            <button
              type="button"
              onClick={refetchRecord}
              disabled={loadingRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <RefreshCw size={11} className={loadingRecord ? 'animate-spin' : ''} />
              {t('buttons.refresh')}
            </button>
          )}
        </div>
      </div>

      {/* Live Summary Panel */}
      {showSummary && (
        <div className="ovds-widget-card animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="ovds-widget-header">
             <span className="ovds-card-title">{t('summary.title')}</span>
          </div>
          <div className="ovds-widget-body pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* NID */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{t('summary.national_id')}</p>
                {reg.draft.nid.faydaId ? (
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-white ovds-mono">{fmtFaydaId(reg.draft.nid.faydaId)}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{reg.draft.nid.fullName}</p>
                  </div>
                ) : (
                   <p className="text-[11px] text-slate-400">{t('summary.not_entered')}</p>
                )}
              </div>
              {/* TIN */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{t('summary.taxpayer_id')}</p>
                {reg.draft.tin.tin ? (
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-white ovds-mono">{fmtTin(reg.draft.tin.tin)}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{reg.draft.tin.businessName}</p>
                  </div>
                ) : (
                   <p className="text-[11px] text-slate-400">{t('summary.not_entered')}</p>
                )}
              </div>
              {/* License */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{t('summary.business_license')}</p>
                {reg.draft.license.licenseNumber ? (
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-white ovds-mono">{reg.draft.license.licenseNumber}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{reg.draft.license.tradeName}</p>
                    <p className="text-[10px] text-slate-400">{reg.draft.license.activity}</p>
                  </div>
                ) : (
                   <p className="text-[11px] text-slate-400">{t('summary.not_entered')}</p>
                )}
              </div>
              {/* VAT */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{t('summary.vat_registration')}</p>
                {reg.draft.vat.registrationStatus !== 'NOT_REGISTERED' ? (
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{reg.draft.vat.registrationStatus.replace(/_/g, ' ')}</p>
                    {reg.draft.vat.vatNumber && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 ovds-mono">{reg.draft.vat.vatNumber}</p>
                    )}
                  </div>
                ) : (
                   <p className="text-[11px] text-slate-400">{t('summary.not_registered')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2021 Commercial Code intro banner */}
      <div className="ovds-widget-card border-l-4 border-l-emerald-500">
        <div className="ovds-widget-body">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {t('structure.intro_title')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                {t('structure.intro_desc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowStructurePanel((v) => !v)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <Building2 size={12} />
              {showStructurePanel ? t('buttons.hide') : t('buttons.choose')} {t('structure.title')}
            </button>
          </div>
        </div>
      </div>

      {/* Panel A — Business Structure Selector */}
      {showStructurePanel && (
        <div className="ovds-widget-card animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="ovds-widget-header">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                 <span className="ovds-card-title">{t('structure.title')}</span>
                 <p className="ovds-caption text-slate-400 mt-0.5">
                   {t('structure.select_prompt')}
                 </p>
              </div>
              {selectedStructure && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                  <span className="text-emerald-600 dark:text-emerald-400">{selectedStructure.icon}</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{selectedStructure.label}</span>
                  {selectedStructure.badgeVariant !== 'none' && <StructureBadge label={selectedStructure.badge} variant={selectedStructure.badgeVariant} />}
                </div>
              )}
            </div>
          </div>
          <div className="ovds-widget-body pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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

            {/* Legal essentials footer */}
            <div className="mt-5 p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-2.5">
                <Info size={14} className="shrink-0 mt-0.5 text-sky-500" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                   {t('structure.legal_essentials_title')}{' '}
                   {t('structure.legal_essentials_body')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel B — ID Harmonization Wizard */}
      <div className="ovds-grid-layout cols-auto gap-lg mt-2">
        {/* Left: Stepper (sidebar) */}
        <div
          className="hidden lg:block ovds-widget-card"
          style={{ minWidth: 220, maxWidth: 260 }}
        >
          <div className="ovds-widget-header">
             <span className="ovds-card-title">{t('wizard.registration_steps')}</span>
          </div>
          <div className="ovds-widget-body pt-4">
            <WizardStepper
              steps={wizardSteps}
              currentIndex={stepIndex}
              variant="vertical"
              onStepClick={(i) => i < stepIndex && goToStep(i)}
            />
          </div>
        </div>

        {/* Right: Step content */}
        <div className="flex-1 min-w-0 space-y-4">
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
            <div className="ovds-widget-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
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
            <div className="ovds-widget-body pt-5">
              <StepPanel reg={reg} t={t} />
            </div>
            <div className="ovds-widget-footer">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={isFirstStep ? () => navigate(-1) : goBack}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <ArrowLeft size={14} />
                  {isFirstStep ? t('buttons.cancel') : t('buttons.back')}
                </button>

                <div className="flex items-center gap-2">
                  {/* Progress dots */}
                  <div className="hidden sm:flex items-center gap-1.5 mr-2">
                    {wizardSteps.map((_, i: number) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          i < stepIndex
                            ? 'w-2 h-2 bg-emerald-500'
                            : i === stepIndex
                            ? 'w-3 h-2 bg-emerald-500'
                            : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {isLastStep ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {submitting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <BadgeCheck size={14} />
                      )}
                      {submitting ? t('buttons.submitting') : t('buttons.complete_harmonization')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>{t('buttons.next')} <ArrowRight size={14} /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchy reminder */}
          <div className="ovds-widget-card">
            <div className="ovds-widget-header">
               <span className="ovds-card-title">{t('wizard.registration_hierarchy')}</span>
            </div>
            <div className="ovds-widget-body pt-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(['nid', 'tin', 'license', 'vat', 'crossref'] as WizardStepId[]).map((s: WizardStepId, i: number) => (
                  <React.Fragment key={s}>
                    <button
                      onClick={() => i <= stepIndex && goToStep(i)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                        s === currentStep
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-400'
                          : i < stepIndex
                          ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer'
                          : 'bg-white dark:bg-slate-900 text-slate-400 cursor-default'
                      }`}
                    >
                      {STEP_ICONS[s]}
                      <span className="hidden sm:inline">{t(`wizard.steps.${s}`)}</span>
                      <span className="sm:hidden">{i + 1}</span>
                    </button>
                    {i < 4 && (
                      <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
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

