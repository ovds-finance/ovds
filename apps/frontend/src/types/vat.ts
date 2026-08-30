/**
 * VAT types — re-exported from @ovds/shared (single source of truth).
 * DO NOT define types here. Edit packages/shared/src/ovds/vat.types.ts instead.
 */
export {
  VAT_THRESHOLD_ETB,
  VAT_RATE,
} from '@ovds/shared';

export type {

  VatFiling,

  VatSummary,

  VatDashboard,

  InputVatEntry,

  OutputVatEntry,

  WithholdingEntry,

  ReverseChargeEntry,

  RefundClaim,

  VatNote,

  ExportEvidence,

  EtaxSubmission,

  WhtCertificate,

  BitDeclaration,

  DrrfLevy,

  TaxLiabilitySummary,

  VatReturnPdf,

} from '@ovds/shared';
