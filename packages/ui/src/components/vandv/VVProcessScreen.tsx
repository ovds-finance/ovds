/**
 * VVProcessScreen — Ovds-style Verification & Validation process screen.
 *
 * Assembles the full V&V flow into one cohesive, minimalistic surface:
 *
 *   Step 1 · Intake & Entry      → VVWizardHeader (smart numbered tracker)
 *   Step 2 · Data Validation     → VVValidationField (inline error highlighting
 *                                   + double-entry debit/credit tints) behind a
 *                                   VVProgressiveDisclosure (progressive disclosure)
 *   Step 3 · Verification        → VVDoubleEntryCue + VVSummaryCard grid
 *   Step 4 · Final Review        → VVComparisonModal (original vs validated diff)
 *   Step 5 · Submission          → VVActionFooter (sticky, high-contrast submit)
 *
 * Best practices baked in: progressive disclosure (Advanced Options),
 * double-entry cues (green inflow / red outflow tints), and a VVSavedIndicator
 * timestamp in the top-right corner.
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AlertTriangle, Eye, FileCheck2, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  validateVV,
  doubleEntryTotals,
  fmtVV,
  vvBuildChecks,
  type VVField,
  type VVValue,
  type VVValues,
} from './validate';
import { VVWizardHeader, type VVWizardStep } from './VVWizardHeader';
import { VVValidationField } from './VVValidationField';
import { VVSummaryCard, type VVCardTone } from './VVSummaryCard';
import { VVComparisonModal } from './VVComparisonModal';
import { VVActionFooter } from './VVActionFooter';
import { VVProgressiveDisclosure } from './VVProgressiveDisclosure';
import { VVSavedIndicator } from './VVSavedIndicator';
import { VVDoubleEntryCue } from './VVDoubleEntryCue';
import { VVChecklist } from './VVChecklist';

const DEFAULT_STEPS: VVWizardStep[] = [
  { id: 'details', label: 'Details', description: 'Enter & capture' },
  { id: 'validate', label: 'Validate', description: 'Verify totals' },
  { id: 'confirm', label: 'Confirm', description: 'Review & submit' },
];

export interface VVProcessScreenProps {
  fields: VVField[];
  /** Original values for the diff view; omit for a brand-new submission. */
  original?: VVValues;
  entityLabel?: string;
  /** Override the default 3-step tracker. */
  steps?: VVWizardStep[];
  initialValues?: VVValues;
  /** Called when the user confirms & submits. Receives the validated values. */
  onSubmit: (values: VVValues) => void | Promise<void>;
  onCancel?: () => void;
  onReset?: () => void;
  /** Auto-save badge state (top-right). */
  autoSave?: { lastSavedAt: string | null; saving?: boolean };
  /** Fired whenever the captured values change (used to drive draft auto-save). */
  onChange?: (values: VVValues) => void;
  submitLabel?: string;
  className?: string;
}

const toBase = (fields: VVField[]): VVValues => {
  const base: VVValues = {};
  for (const f of fields) base[f.key] = f.value ?? null;
  return base;
};

export const VVProcessScreen: React.FC<VVProcessScreenProps> = ({
  fields,
  original,
  entityLabel = 'Record',
  steps = DEFAULT_STEPS,
  initialValues,
  onSubmit,
  onCancel,
  onReset,
  autoSave,
  submitLabel = 'Validate & Submit',
  className,
  onChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [values, setValues] = useState<VVValues>(() => ({ ...toBase(fields), ...(initialValues ?? {}) }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => validateVV(fields, values), [fields, values]);
  const errorKeys = Object.keys(errors);
  const totals = useMemo(() => doubleEntryTotals(fields, values), [fields, values]);
  const checks = useMemo(() => vvBuildChecks(fields, values, errors, totals), [fields, values, errors, totals]);
  const baseFields = useMemo(() => fields.filter((f) => !f.advanced), [fields]);
  const advancedFields = useMemo(() => fields.filter((f) => f.advanced), [fields]);

  // Emit value changes to the host so it can persist drafts (skip first render).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange?.(values);
  }, [values, onChange]);

  const errorCounts: Record<number, number> = { 0: errorKeys.length };

  const setValue = (key: string, v: VVValue) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const reset = () => {
    setValues(toBase(fields));
    setTouched({});
    setCurrentIndex(0);
    setAdvancedOpen(false);
    onReset?.();
  };

  const canAdvance = currentIndex < steps.length - 1;
  const handlePrimary = async () => {
    if (canAdvance) {
      setCurrentIndex((i) => i + 1);
      return;
    }
    // Final step — block on validation errors.
    if (errorKeys.length > 0) {
      setTouched(Object.fromEntries(fields.map((f) => [f.key, true])));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  const primaryLabel =
    currentIndex === 0 ? 'Continue to Validate' : currentIndex === 1 ? 'Continue to Review' : submitLabel;

  const footerHint =
    currentIndex === 2
      ? errorKeys.length > 0
        ? `${errorKeys.length} field${errorKeys.length > 1 ? 's' : ''} need${errorKeys.length > 1 ? '' : 's'} attention before submit`
        : totals.balanced
          ? 'Balanced & ready to submit'
          : 'Out of balance — review totals'
      : undefined;

  const renderField = (field: VVField) => (
    <VVValidationField
      key={field.key}
      field={field}
      value={values[field.key]}
      error={touched[field.key] ? errors[field.key] : undefined}
      showError={touched[field.key]}
      onChange={setValue}
      onBlur={(k) => setTouched((p) => ({ ...p, [k]: true }))}
    />
  );

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Top bar: wizard header + auto-save indicator */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div className="flex-1 min-w-[260px]">
          <VVWizardHeader steps={steps} currentIndex={currentIndex} errorCounts={errorCounts} />
        </div>
        <VVSavedIndicator
          saving={autoSave?.saving ?? false}
          lastSavedAt={autoSave?.lastSavedAt ?? null}
          className="shrink-0"
        />
      </div>

      {/* Step body */}
      <div className="flex-1">
        {currentIndex === 0 && (
          <div className="aki-field-row cols-2" data-aki-step="details">
            {baseFields.map(renderField)}
            {advancedFields.length > 0 && (
              <div className="col-span-full mt-1">
                <VVProgressiveDisclosure open={advancedOpen} onToggle={setAdvancedOpen} count={advancedFields.length}>
                  <div className="aki-field-row cols-2">{advancedFields.map(renderField)}</div>
                </VVProgressiveDisclosure>
              </div>
            )}
          </div>
        )}

        {currentIndex === 1 && (
          <div className="space-y-5" data-aki-step="validate">
            {errorKeys.length > 0 ? (
              <div className="flex items-start gap-2.5 rounded-oki border border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/20 px-4 py-3">
                <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-rose-700 dark:text-rose-300">
                    {errorKeys.length} field{errorKeys.length > 1 ? 's' : ''} need
                    {errorKeys.length > 1 ? '' : 's'} attention
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {errorKeys.map((k) => (
                      <li key={k} className="text-[11px] text-rose-600 dark:text-rose-400">
                        {fields.find((f) => f.key === k)?.label}: {errors[k]}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-oki border border-[var(--pro-azure-100)] dark:border-green-800 bg-[var(--pro-azure-50)]/60 dark:bg-green-950/20 px-4 py-3">
                <ShieldCheck size={16} className="text-[var(--pro-azure)] shrink-0" />
                <p className="text-[12px] font-semibold text-[var(--pro-azure-dark)] dark:text-green-300">
                  All fields validated — review the parsed totals below
                </p>
              </div>
            )}

            <VVDoubleEntryCue fields={fields} values={values} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <VVSummaryCard
                label="Total Debit (Inflow)"
                value={fmtVV(totals.debit)}
                tone="success"
                badge={totals.debit > 0 ? 'Captured' : undefined}
              />
              <VVSummaryCard
                label="Total Credit (Outflow)"
                value={fmtVV(totals.credit)}
                tone="credit"
                badge={totals.credit > 0 ? 'Captured' : undefined}
              />
              <VVSummaryCard
                label="Balance"
                value={fmtVV(totals.balance)}
                tone={totals.balanced ? 'neutral' : 'danger'}
                badge={totals.balanced ? 'Balanced' : 'Unbalanced'}
              />
              <VVSummaryCard
                label="Validation"
                value={`${fields.length - errorKeys.length}/${fields.length}`}
                tone={errorKeys.length === 0 ? 'success' : 'danger'}
                badge={errorKeys.length === 0 ? 'Pass' : 'Fail'}
              />
            </div>

            <VVChecklist checks={checks} />
          </div>
        )}

        {currentIndex === 2 && (
          <div className="space-y-5" data-aki-step="confirm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <FileCheck2 size={15} className="text-[var(--pro-azure)]" />
                Final review — confirm accuracy before submission to the ledger
              </p>
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-oki px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Eye size={13} />
                Review differences
              </button>
            </div>

            <VVDoubleEntryCue fields={fields} values={values} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <VVSummaryCard label="Total Debit" value={fmtVV(totals.debit)} tone="success" />
              <VVSummaryCard label="Total Credit" value={fmtVV(totals.credit)} tone="credit" />
              <VVSummaryCard
                label="Balance"
                value={fmtVV(totals.balance)}
                tone={totals.balanced ? 'neutral' : 'danger'}
                badge={totals.balanced ? 'Balanced' : 'Unbalanced'}
              />
              <VVSummaryCard
                label="Status"
                value={errorKeys.length === 0 ? 'Ready' : 'Blocked'}
                tone={(errorKeys.length === 0 ? 'success' : 'danger') as VVCardTone}
                badge={errorKeys.length === 0 ? 'OK' : 'Fix'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky action footer */}
      <VVActionFooter
        showSubmit={currentIndex === steps.length - 1}
        nextLabel={primaryLabel}
        submitLabel={submitLabel}
        onNext={handlePrimary}
        onSubmit={handlePrimary}
        onBack={currentIndex === 0 ? undefined : () => setCurrentIndex((i) => Math.max(0, i - 1))}
        onCancel={currentIndex === 0 ? onCancel : undefined}
        onReset={reset}
        busy={submitting}
        hint={footerHint}
      />

      {/* Split-view comparison modal */}
      <VVComparisonModal
        open={reviewOpen}
        fields={fields}
        original={original}
        validated={values}
        entityLabel={entityLabel}
        onClose={() => setReviewOpen(false)}
        onConfirm={() => {
          setReviewOpen(false);
          if (errorKeys.length === 0) void handlePrimary();
        }}
      />
    </div>
  );
};
