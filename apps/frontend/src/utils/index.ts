/**
 * Utils barrel export.
 * Import utility functions from here:
 *   import { fmtDate, fmtCurrency, downloadCSV, statusLabel } from '../utils';
 */

// -- Formatting ----------------------------------------------------------------
export {
  fmtNum,
  fmtDecimal,
  fmtPct,
  fmtCurrency,
  fmtCurrencyDecimal,
  fmtCompact,
  fmtDate,
  fmtDateShort,
  fmtDateTime,
  fmtDaysLeft,
  fmtRelative,
  fmtRelativeTime,
  getLocale,
  computeReceiptConfidence,
} from './fmt';

// -- Download ------------------------------------------------------------------
export { downloadBlob, downloadCSV, downloadJSON } from './download';

// -- Confirm / Prompt dialogs --------------------------------------------------
export { confirm, prompt } from './confirm';

// -- Status labels & colors ----------------------------------------------------
export { statusLabel, statusColor } from './statusLabel';

// -- Session / Storage helpers -------------------------------------------------
export {
  getStoredToken,
  getStoredUser,
  setStoredUser,
  clearSession,
  safeJsonParse,
} from './storage';

// -- Array / API response helpers ---------------------------------------------
export { toArray, unwrapArray, unwrapNestedArray } from './array';

// -- OCR error normalization --------------------------------------------------
export { normalizeOcrError } from './ocr';
