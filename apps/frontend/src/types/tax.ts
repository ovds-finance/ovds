/**
 * Tax types — re-exported from @ovds/shared (single source of truth).
 *
 * All tax types live in packages/shared/src/ovds/tax.types.ts and tax.dto.ts.
 * DO NOT define types here. Edit packages/shared/src/ovds/ instead.
 */
import {TaxFilingType} from '@ovds/shared';

/**
 * Re-export TaxFilingType as TaxType for the frontend.
 * Components like TaxFiling.tsx use TaxType as an enum (value and type).
 */
export const TaxType = TaxFilingType;
export type TaxType = TaxFilingType;

export type {

  TaxDashboard,

  VatReconciliation,

  IncomeTaxReport,

  TaxReport,

  CreateTaxFiling,

  ETaxPayload,

  WithholdingReport,

} from '@ovds/shared';

// Scoped re-exports for backward compat — do NOT use export * from '@ovds/shared'
export type {
  TaxFilingType,
  EtaxSubmission,
} from '@ovds/shared';


