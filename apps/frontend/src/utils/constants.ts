// QR code generation — routes through the first-party backend endpoint at
// /api/utils/qr so invoice data (amounts, TINs, reference numbers) never
// leaks to the third-party api.qrserver.com service.
// Override with VITE_QR_CODE_SERVICE_URL if you run a dedicated QR micro-service.
export const QR_CODE_SERVICE_URL = import.meta.env.VITE_QR_CODE_SERVICE_URL || '/api/utils/qr';
export const TELECOM_RECEIPT_BASE_URL = import.meta.env.VITE_TELECOM_RECEIPT_BASE_URL || 'https://transactioninfo.ethiotelecom.et/';
export const DEFAULT_MAIL_FROM = import.meta.env.VITE_DEFAULT_MAIL_FROM || 'noreply@ovds.com.et';
export const BEARER_PREFIX = 'Bearer ';
export const FRONTEND_URL = window.location.origin;
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const QUERY_GC_TIME_MS = parseInt(import.meta.env.VITE_QUERY_GC_TIME_MS || '600000', 10);
export const CHUNK_RETRY_KEY = import.meta.env.VITE_CHUNK_RETRY_KEY || 'chunk_retry';
export const CHUNK_RELOAD_TIMEOUT_MS = parseInt(import.meta.env.VITE_CHUNK_RELOAD_TIMEOUT_MS || '3000', 10);

export function generateErrorId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 6).toUpperCase();
  }
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
