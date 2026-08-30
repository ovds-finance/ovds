/**
 * @ovds/ui — Verification & Validation (V&V) process screen
 *
 * Ovds-style, minimalistic, highly structured V&V flow for regulated
 * OVDS records (tax invoices, journal entries, reconciliations). See
 * VVProcessScreen for the orchestrator and the per-component breakdown.
 */
export { VVProcessScreen } from './VVProcessScreen';
export type { VVProcessScreenProps } from './VVProcessScreen';

export { VVWizardHeader } from './VVWizardHeader';
export type { VVWizardHeaderProps, VVWizardStep } from './VVWizardHeader';

export { VVValidationField } from './VVValidationField';
export type { VVValidationFieldProps } from './VVValidationField';

export { VVSummaryCard } from './VVSummaryCard';
export type { VVSummaryCardProps, VVCardTone } from './VVSummaryCard';

export { VVComparisonModal } from './VVComparisonModal';
export type { VVComparisonModalProps } from './VVComparisonModal';

export { VVActionFooter } from './VVActionFooter';
export type { VVActionFooterProps } from './VVActionFooter';

export { VVSavedIndicator } from './VVSavedIndicator';
export type { VVSavedIndicatorProps } from './VVSavedIndicator';

export { VVProgressiveDisclosure } from './VVProgressiveDisclosure';
export type { VVProgressiveDisclosureProps } from './VVProgressiveDisclosure';

export { VVDoubleEntryCue } from './VVDoubleEntryCue';
export type { VVDoubleEntryCueProps } from './VVDoubleEntryCue';

export { VVChecklist } from './VVChecklist';
export type { VVChecklistProps, VVCheck } from './VVChecklist';

export {
  validateVV,
  diffVV,
  doubleEntryTotals,
  fmtVV,
  vvBuildChecks,
  vvIsEmpty,
  vvRequired,
  vvIsValidTin,
  vvIsPositiveNumber,
  vvMaxLength,
} from './validate';
export type {
  VVField,
  VVValue,
  VVValues,
  VVStepId,
  FieldDiff,
  DiffStatus,
} from './validate';
