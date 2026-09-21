/**
 * @file EtVatFiling.tsx
 * Ethiopia VAT — monthly return builder with full filing persistence.
 * Route: /tax/vat/et/filing
 *
 * Three-step wizard flow:
 *   Step 1 — select-period   Build VAT-01 draft from ledger
 *   Step 2 — review          Review lines, save as DRAFT to DB
 *   Step 3 — submit          Choose channel, submit, show ack
 *
 * Data flow:
 *   POST /vat/returns/build?save=true  →  VatReturnDraft + FilingRecord(DRAFT)
 *   POST /vat/filings/save             →  FilingRecord   (explicit save / re-save)
 *   POST /vat/filings/:id/submit       →  FilingRecord(SUBMITTED)
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import { useVatModules }  from '../../../context/VatModuleContext';
import type {
  VatReturnDraft,
  VatFilingPeriod,
  FilingRecord,
} from '../../../context/VatModuleContext';
import { useVatFilings }  from '../../../hooks/useVatFilings';
import { useRouteUITitle } from '../../../router';

// ─── Constants ────────────────────────────────────────────────────────────────

const YEAR = new Date().getFullYear();
const STEPS = ['select-period', 'review', 'submit'] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<Step, string> = {
  'select-period': '1. Select Period',
  'review':        '2. Review Return',
  'submit':        '3. Submit',
};

// ─── Shared UI atoms ─────────────────────────────────────────────────────────

const AlertBanner: React.FC<{
  variant: 'error' | 'success' | 'info';
  children: React.ReactNode;
}> = ({ variant, children }) => {
  const styles = {
    error:   'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300',
    success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300',
    info:    'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300',
  };
  return (
    <div role="alert" className={`rounded-xl border p-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
};

const PrimaryBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingLabel?: string }
> = ({ children, loading, loadingLabel, disabled, className = '', ...rest }) => (
  <button
    disabled={loading || disabled}
    className={`px-5 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold
      disabled:opacity-40 hover:bg-[var(--pro-azure-dark)] transition-all ${className}`}
    {...rest}
  >
    {loading ? (loadingLabel ?? 'Loading…') : children}
  </button>
);

const GhostBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children, className = '', ...rest
}) => (
  <button
    className={`px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm
      font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800
      transition-all ${className}`}
    {...rest}
  >
    {children}
  </button>
);

// ─── Step 1 — Period selector ─────────────────────────────────────────────────

const StepSelectPeriod: React.FC<{
  periods:    VatFilingPeriod[];
  selected:   string;
  loading:    boolean;
  loadError:  string | null;
  onSelect:   (key: string) => void;
  onBuild:    () => void;
}> = ({ periods, selected, loading, loadError, onSelect, onBuild }) => (
  <div className="space-y-5 max-w-lg">
    <div>
      <label
        htmlFor="et-filing-period"
        className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
      >
        Select Filing Period
      </label>
      <select
        id="et-filing-period"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading || periods.length === 0}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-900 text-sm px-4 py-2.5
          focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]"
      >
        {periods.length === 0 && <option value="">Loading periods…</option>}
        {periods.map((p) => (
          <option key={p.periodKey} value={p.periodKey}>
            {p.label}{p.isOpen ? ' (Open)' : ''} — Due {p.dueDate}
          </option>
        ))}
      </select>
    </div>

    {loadError && <AlertBanner variant="error">{loadError}</AlertBanner>}

    {selected && (
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-3 text-sm text-blue-700 dark:text-blue-300">
        Period <strong>{selected}</strong> selected — ERCA VAT-01 will be assembled
        from your input / output VAT ledger and saved as a DRAFT.
      </div>
    )}

    <PrimaryBtn loading={loading} loadingLabel="Building…" disabled={!selected} onClick={onBuild}>
      Build Return →
    </PrimaryBtn>
  </div>
);

// ─── Step 2 — Review + save ───────────────────────────────────────────────────

const StepReviewReturn: React.FC<{
  draft:      VatReturnDraft;
  filing:     FilingRecord | null;
  saving:     boolean;
  saveError:  string | null;
  onBack:     () => void;
  onSave:     () => void;
  onProceed:  () => void;
}> = ({ draft, filing, saving, saveError, onBack, onSave, onProceed }) => (
  <div className="space-y-5 max-w-3xl">

    {/* Status badge */}
    {filing && (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Filing status:</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
          ${filing.status === 'DRAFT'
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'}`}>
          {filing.status}
        </span>
        <span className="text-[10px] font-mono text-slate-400">id: {filing.id.slice(0, 8)}…</span>
      </div>
    )}

    {/* Return draft table */}
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
          ERCA VAT-01 Draft — {draft.periodKey}
        </h2>
        <span className="text-[10px] font-mono text-slate-400">
          Prepared {new Date(draft.preparedAt).toLocaleString()}
        </span>
      </div>

      <table className="w-full text-sm" aria-label="VAT return draft">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <th className="px-4 py-2 text-left w-12">Box</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-right w-32">Amount (ETB)</th>
            <th className="px-4 py-2 text-right w-32">Tax (ETB)</th>
          </tr>
        </thead>
        <tbody>
          {draft.lines.map((line) => (
            <tr key={line.boxCode}
              className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-4 py-2 font-mono text-[10px] text-slate-400">{line.boxCode}</td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{line.label}</td>
              <td className="px-4 py-2 text-right font-semibold text-slate-800 dark:text-slate-200">
                {(line.amount ?? 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2 text-right text-slate-500">
                {line.taxAmount != null
                  ? line.taxAmount.toLocaleString('en-ET', { minimumFractionDigits: 2 })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-200 dark:border-slate-700">
            <td colSpan={2} className="px-4 py-3 text-slate-700 dark:text-slate-200">Net VAT Payable</td>
            <td colSpan={2} className={`px-4 py-3 text-right text-base
              ${draft.netVatPayable >= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              ETB {draft.netVatPayable.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              {draft.netVatPayable < 0 && (
                <span className="ml-2 text-xs font-normal text-emerald-600">(Refund)</span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    {saveError && <AlertBanner variant="error">{saveError}</AlertBanner>}

    {!filing && (
      <AlertBanner variant="info">
        This draft has not been saved yet. Click <strong>Save Draft</strong> to persist
        it to the database before proceeding.
      </AlertBanner>
    )}

    <div className="flex items-center gap-3 flex-wrap">
      <GhostBtn onClick={onBack}>← Back</GhostBtn>
      {!filing && (
        <PrimaryBtn loading={saving} loadingLabel="Saving…" onClick={onSave}
          className="bg-amber-500 hover:bg-amber-600">
          Save Draft
        </PrimaryBtn>
      )}
      <PrimaryBtn disabled={!filing} onClick={onProceed}>
        Proceed to Submit →
      </PrimaryBtn>
    </div>
  </div>
);

// ─── Step 3 — Submit ──────────────────────────────────────────────────────────

type SubmitChannel = 'API_DIRECT' | 'PORTAL_UPLOAD' | 'EMAIL' | 'MANUAL';

const StepSubmit: React.FC<{
  filing:       FilingRecord;
  submitting:   boolean;
  submitError:  string | null;
  onBack:       () => void;
  onSubmit:     (channel: SubmitChannel) => void;
}> = ({ filing, submitting, submitError, onBack, onSubmit }) => {
  const [channel, setChannel] = useState<SubmitChannel>('MANUAL');
  const isSubmitted = ['SUBMITTED', 'ACCEPTED', 'REJECTED'].includes(filing.status);

  return (
    <div className="space-y-5 max-w-lg">

      {/* Submitted confirmation */}
      {isSubmitted ? (
        <AlertBanner variant="success">
          <p className="font-semibold mb-1">
            {filing.status === 'SUBMITTED' ? '✓ Filing submitted' :
             filing.status === 'ACCEPTED'  ? '✓ Filing accepted by ERCA' :
             '✗ Filing rejected by ERCA'}
          </p>
          <div className="space-y-0.5 text-xs">
            <p>Period: <strong>{filing.periodKey}</strong></p>
            {filing.submittedAt && (
              <p>Submitted: <strong>{new Date(filing.submittedAt).toLocaleString()}</strong></p>
            )}
            {filing.submittedBy && (
              <p>By: <strong>{filing.submittedBy}</strong></p>
            )}
            {filing.ackNumber && (
              <p>Acknowledgement #: <strong className="font-mono">{filing.ackNumber}</strong></p>
            )}
          </div>
        </AlertBanner>
      ) : (
        <>
          {/* Net payable summary */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Return Summary
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Period</span>
              <span className="text-sm font-semibold">{filing.periodKey}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Output VAT</span>
              <span className="text-sm font-semibold">
                ETB {filing.outputVat.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Input VAT</span>
              <span className="text-sm font-semibold">
                ETB {filing.inputVat.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Net VAT Payable</span>
              <span className={`text-base font-bold ${filing.netVatPayable >= 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'}`}>
                ETB {filing.netVatPayable.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Channel selector */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Submission Channel
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['API_DIRECT',    '🔗', 'ERCA API',       'Submit directly via the ERCA EIMS API'],
                ['PORTAL_UPLOAD', '📤', 'Portal Upload',  'Export XML then upload to ERCA portal manually'],
                ['EMAIL',         '📧', 'Email',          'Send signed XML to ERCA by email'],
                ['MANUAL',        '📄', 'Manual',         'Mark as submitted; filing completed outside OVDS'],
              ] as [SubmitChannel, string, string, string][]).map(([val, emoji, label, desc]) => (
                <label key={val}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${channel === val
                      ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                  <input
                    type="radio" name="channel" value={val}
                    checked={channel === val}
                    onChange={() => setChannel(val)}
                    className="mt-0.5 accent-[var(--pro-azure)]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <span className="mr-1" aria-hidden>{emoji}</span>{label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {submitError && <AlertBanner variant="error">{submitError}</AlertBanner>}

          {channel === 'API_DIRECT' && (
            <AlertBanner variant="info">
              ERCA API direct submission requires <code className="font-mono text-[11px] bg-blue-100 dark:bg-blue-900/40 px-1 rounded">EIMS_API_URL</code> to
              be configured. If not set, the filing will be marked SUBMITTED and queued for
              manual reconciliation.
            </AlertBanner>
          )}

          <div className="flex items-center gap-3">
            <GhostBtn onClick={onBack} disabled={submitting}>← Back</GhostBtn>
            <PrimaryBtn loading={submitting} loadingLabel="Submitting…"
              onClick={() => onSubmit(channel)}>
              Submit to ERCA →
            </PrimaryBtn>
          </div>
        </>
      )}

      {/* Start new filing link */}
      <button onClick={onBack}
        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline">
        ← Start a different period
      </button>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const EtVatFiling: React.FC = () => {
  const { getPeriods, buildReturn }           = useVatModules();
  const { saveDraft, submit, saving, saving: _savingAlias,
          saveError, submitting, submitError } = useVatFilings({
    countryCode: 'ET',
    autoLoad:    false,   // we don't need the list on this page
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam   = (searchParams.get('step') ?? 'select-period') as Step;
  const currentStep = STEPS.includes(stepParam) ? stepParam : 'select-period';

  const [periods,    setPeriods]    = useState<VatFilingPeriod[]>([]);
  const [selected,   setSelected]   = useState('');
  const [draft,      setDraft]      = useState<VatReturnDraft | null>(null);
  const [filing,     setFiling]     = useState<FilingRecord | null>(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError,   setBuildError]   = useState<string | null>(null);
  const [periodsError, setPeriodsError] = useState<string | null>(null);

  const mountedRef = useRef(false);

  // Dynamic page title
  const titleMap: Record<Step, string> = {
    'select-period': 'Ethiopia VAT — Select Period',
    'review':        draft ? `Ethiopia VAT — Review ${draft.periodKey}` : 'Ethiopia VAT — Review Return',
    'submit':        filing ? `Ethiopia VAT — Submit ${filing.periodKey}` : 'Ethiopia VAT — Submit',
  };
  useRouteUITitle(titleMap[currentStep]);

  // Load periods on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    (async () => {
      try {
        const data = await getPeriods('ET', YEAR);
        setPeriods(data);
        if (data.length > 0) setSelected(data[0].periodKey);
      } catch (e: unknown) {
        setPeriodsError(e instanceof Error ? e.message : 'Failed to load filing periods');
      }
    })();
  }, [getPeriods]);

  const goTo = useCallback((step: Step) => {
    setSearchParams({ step }, { replace: true });
  }, [setSearchParams]);

  // ── Step 1: build the return (auto-saves as DRAFT via ?save=true) ─────────
  const handleBuild = useCallback(async () => {
    if (!selected) return;
    setBuildLoading(true);
    setBuildError(null);
    try {
      const builtDraft = await buildReturn({
        countryCode: 'ET',
        periodKey:   selected,
        currency:    'ETB',
        save:        true,       // auto-persist DRAFT to VatFilingRecord
      });
      setDraft(builtDraft);

      // Also attempt to load the persisted filing record so we can track its id
      // The API returns the draft only; we'll save explicitly if needed in Step 2
      goTo('review');
    } catch (e: unknown) {
      setBuildError(e instanceof Error ? e.message : 'Failed to build VAT return');
    } finally {
      setBuildLoading(false);
    }
  }, [selected, buildReturn, goTo]);

  // ── Step 2: explicit save (if auto-save didn't produce a filing record yet) ─
  const handleSave = useCallback(async () => {
    if (!draft) return;
    const record = await saveDraft({
      countryCode:   'ET',
      periodKey:     draft.periodKey,
      currency:      draft.currency,
      returnDraft:   draft as unknown as Record<string, unknown>,
      outputVat:     draft.lines
        .filter((l) => l.boxCode?.startsWith('A') || l.boxCode === 'OUTPUT_VAT')
        .reduce((s, l) => s + (l.taxAmount ?? 0), 0),
      inputVat:      draft.lines
        .filter((l) => l.boxCode?.startsWith('B') || l.boxCode === 'INPUT_VAT')
        .reduce((s, l) => s + (l.taxAmount ?? 0), 0),
      netVatPayable: draft.netVatPayable,
    });
    if (record) setFiling(record);
  }, [draft, saveDraft]);

  // ── Step 3: submit ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (channel: 'API_DIRECT' | 'PORTAL_UPLOAD' | 'EMAIL' | 'MANUAL') => {
    if (!filing) return;
    const submitted = await submit(filing.id, { channel });
    if (submitted) setFiling(submitted);
  }, [filing, submit]);

  return (
    <div className="p-6 space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30
          flex items-center justify-center text-2xl" aria-hidden>
          📋
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Ethiopia Monthly VAT Return
          </h1>
          <p className="text-sm text-slate-500">
            ERCA VAT-01 · Standard rate 15% · Proc. 285/2002
          </p>
        </div>
      </div>

      {/* ── Step indicator ───────────────────────────────────────────────── */}
      <nav aria-label="Filing wizard steps" className="flex items-center gap-1 flex-wrap">
        {STEPS.map((step, idx) => {
          const stepIdx    = STEPS.indexOf(currentStep);
          const isPast     = idx < stepIdx;
          const isCurrent  = idx === stepIdx;
          return (
            <React.Fragment key={step}>
              <div className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                isCurrent ? 'bg-[var(--pro-azure)] text-white shadow' :
                isPast    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-400',
              ].join(' ')}>
                {isPast && <span aria-hidden>✓</span>}
                <span>{STEP_LABELS[step]}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <span className="text-slate-300 dark:text-slate-700 mx-0.5" aria-hidden>›</span>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* ── Build error ──────────────────────────────────────────────────── */}
      {buildError && <AlertBanner variant="error">{buildError}</AlertBanner>}

      {/* ── Step content ─────────────────────────────────────────────────── */}

      {currentStep === 'select-period' && (
        <StepSelectPeriod
          periods={periods}
          selected={selected}
          loading={buildLoading}
          loadError={periodsError}
          onSelect={setSelected}
          onBuild={handleBuild}
        />
      )}

      {currentStep === 'review' && draft && (
        <StepReviewReturn
          draft={draft}
          filing={filing}
          saving={saving}
          saveError={saveError}
          onBack={() => goTo('select-period')}
          onSave={handleSave}
          onProceed={() => goTo('submit')}
        />
      )}

      {currentStep === 'submit' && draft && filing && (
        <StepSubmit
          filing={filing}
          submitting={submitting}
          submitError={submitError}
          onBack={() => goTo('review')}
          onSubmit={handleSubmit}
        />
      )}

      {/* Fallback: if someone navigates directly to step > 1 without a draft */}
      {currentStep !== 'select-period' && !draft && (
        <div className="space-y-3">
          <AlertBanner variant="info">
            No return draft loaded. Please go back to Step 1 to build a return.
          </AlertBanner>
          <GhostBtn onClick={() => goTo('select-period')}>← Start from Step 1</GhostBtn>
        </div>
      )}
    </div>
  );
};

export default EtVatFiling;
