/**
 * IFRS / FX types — re-exported from @ovds/shared (single source of truth).
 * DO NOT define types here. Edit packages/shared/src/ovds/ifrs.types.ts instead.
 */
export type {
  FxDifferenceResponse,
  NonIncomeTaxResponse,
  IfrsComplianceDashboard,
  FinancialStatement,
} from '@ovds/shared';
export type {
  FxDifferenceDto,
  NonIncomeTaxDto,
} from '@ovds/dto';


// IAS21_EXAMPLES — practical foreign currency examples for the IFRS guide
export const IAS21_EXAMPLES = [
  { scenario: 'Import payable in USD', treatment: 'Retranslate at closing rate; difference to P&L' },
  { scenario: 'Subsidiary with EUR functional currency', treatment: 'Translate assets/liabilities at closing rate; equity at historical' },
  { scenario: 'Foreign currency bank account', treatment: 'Monetary item — retranslate each reporting date' },
  { scenario: 'Prepaid expense in GBP (non-monetary)', treatment: 'Keep at historical rate; no retranslation' },
] as const;
