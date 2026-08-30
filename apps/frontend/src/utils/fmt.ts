/**
 * Formatting utilities — re-exported from @ovds/shared (single source of truth).
 *
 * The full implementation lives in packages/shared/src/fmt.ts
 * so both frontend and backend use identical formatting logic.
 *
 * DO NOT add implementations here. Edit packages/shared/src/fmt.ts instead.
 *
 * NOTE: getLocale is NOT in @ovds/shared (it's browser/i18n-specific).
 *       Import it from '../lib/locale' directly.
 */
export {
  fmtNum,
  fmtCurrency,
  fmtDecimal,
  fmtCurrencyDecimal,
  fmtCompact,
  fmtPct,
  fmtDate,
  fmtDateShort,
  fmtDateTime,
  fmtRelative,
  fmtDaysLeft,
  fmtRelativeTime,
  safeJsonParse,
  amountInWords,
} from '@ovds/shared';

// computeReceiptConfidence is frontend-specific (receipt evidence scoring)
// It stays here as a local implementation
export const computeReceiptConfidence = (evidence: {
  telecomRef?: string;
  telecomParsed?: { amount?: number | null; paidAt?: string | null; payer?: string | null };
  bankName?: string;
  bankAccountNo?: string;
  mcc?: string;
  qrType?: string;
  tinValidated?: boolean;
  isDuplicate?: boolean;
  orderNo?: string;
  receiptImageData?: string;
  bankSlipImageData?: string;
  interactionType?: string;
  archType?: string;
  processType?: string;
}): number => {
  let score = 0;
  if (evidence.telecomRef)               score += 15;
  if (evidence.telecomParsed?.amount)    score += 10;
  if (evidence.telecomParsed?.paidAt)    score += 5;
  if (evidence.telecomParsed?.payer)     score += 5;
  if (evidence.bankName)                 score += 10;
  if (evidence.bankAccountNo)            score += 5;
  if (evidence.mcc)                      score += 5;
  if (evidence.qrType === 'DYNAMIC')     score += 10;
  else if (evidence.qrType === 'STATIC') score += 5;
  if (evidence.tinValidated)             score += 15;
  if (evidence.orderNo)                  score += 5;
  if (evidence.receiptImageData)         score += 5;
  if (evidence.bankSlipImageData)        score += 5;
  if (evidence.interactionType)          score += 5;
  if (evidence.archType)                 score += 5;
  if (evidence.processType)             score += 5;
  if (evidence.isDuplicate)             score = Math.max(0, score - 40);
  return Math.min(100, score);
};

// Re-export getLocale from lib/locale for backward compat
export { getLocale } from '../lib/locale';
