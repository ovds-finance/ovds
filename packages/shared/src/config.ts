export const DEFAULT_TAX_RATE = 0.15;
// Allow `typeof window` checks to compile in Node/ESNext-targeted builds.
// The runtime guard `typeof window !== 'undefined'` is always present.
/* eslint-disable no-var */
declare var window: any;
/* eslint-enable no-var */
export const DEFAULT_CURRENCY = 'ETB';
export const DEFAULT_COUNTRY = 'ET';
export const INVOICE_PREFIX = 'INV-';
export const BILL_PREFIX = 'BILL-';
export const DEFAULT_PAYMENT_TERMS = 'Net 30';
export const DRRF_RATE = 0.01;
export const DEFAULT_VAT_RATE = 15;
export const DEFAULT_COUNTRY_NAME = 'ETHIOPIA';
export const DEFAULT_CITY = 'Addis Ababa';
export const DEFAULT_REGION = 'Addis Ababa';
export const DEFAULT_WEREDA = '01';
export const DEFAULT_PAYMENT_MODE = 'CASH';
export const DEFAULT_PAYMENT_TERM = 'IMMEDIATE';
export const DEFAULT_SYSTEM_TYPE = 'ERP' as const;
export const DEFAULT_VERSION = '1.0.0';
export const EIMS_DEFAULT_COUNTRY = 'ETHIOPIA';
export const EIMS_DEFAULT_CITY = 'Addis Ababa';
export const EIMS_DEFAULT_REGION = 'Addis Ababa';
export const EIMS_DEFAULT_WEREDA = '01';
export const EIMS_DEFAULT_PAYMENT_MODE = 'CASH';
export const EIMS_DEFAULT_PAYMENT_TERM = 'IMMEDIATE';
export const EIMS_DEFAULT_SYSTEM_TYPE = 'ERP' as const;
export const EIMS_DEFAULT_VERSION = '1.0.0';
export const OTP_PURPOSES = ['LOGIN', 'REGISTER', 'PASSWORD_RESET', 'MFA'] as const;
export const ACCESS_TOKEN_MAX_AGE = 24 * 60 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const THROTTLE_TTL_MS = 60000;
export const THROTTLE_LIMIT = 100;
export const AUTH_LOGIN_THROTTLE_LIMIT = 10;
export const AUTH_REGISTER_THROTTLE_LIMIT = 5;
export const AUTH_OTP_THROTTLE_LIMIT = 3;
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;
export const REPORT_DEFAULT_LIMIT = 200;
export const TOT_GOODS_RATE = 2;
export const TOT_SERVICES_RATE = 10;
export const BIT_RATE = 30;

/**
 * @deprecated Use `ETH_TAX.WHT_GOODS_RATE` from `constants.ts` instead.
 *
 * These values were 0.02/0.10 (pre-2025). Federal Income Tax (Amendment)
 * Proclamation No. 1395/2025 Art. 94 raised WHT to 3% for both goods and
 * services. The canonical rates now live in `ETH_TAX` in `constants.ts`,
 * which has spec tests confirming the correct values. All new code must
 * import from there.
 *
 * @see packages/shared/src/constants.ts — ETH_TAX.WHT_GOODS_RATE (0.03)
 * @see packages/shared/src/constants.ts — ETH_TAX.WHT_SERVICE_RATE (0.03)
 */
export const WHT_GOODS_RATE = 0.03;
export const WHT_SERVICES_RATE = 0.03;
export const DEFAULT_PENALTY_RATE = 1.5;
export const OTP_MAX_REQUESTS = 3;
export const BCryptSaltRounds = 12;
export const JWT_REFRESH_EXPIRY = '7d';
export const EIMS_SANDBOX_TOKEN_TTL_MS = 3_600_000;
export const EIMS_TOKEN_REFRESH_BUFFER_MS = 30_000;
export const EIMS_TIMEOUT_MS = 30_000;
export const EIMS_RETRY_BASE_DELAY_MS = 500;
export const EIMS_RETRY_MAX_DELAY_MS = 5000;
export const EIMS_RETRY_JITTER_MS = 500;
export const EIMS_RETRY_AFTER_SEC = 2;

// ── EIMS sandbox mode indicator ───────────────────────────────────────────────

/**
 * Human-readable notice surfaced in the UI whenever EIMS_SANDBOX=true.
 * Used by frontend EIMS pages and backend compliance readiness reports to
 * make the non-production mode clearly visible to operators.
 */
export const EIMS_SANDBOX_NOTICE =
  'EIMS SANDBOX MODE — submissions are simulated locally and are NOT transmitted to the ' +
  'Ministry of Revenues (MoR) live endpoint. Set EIMS_SANDBOX=false and supply valid ' +
  'EIMS_CLIENT_ID / EIMS_CLIENT_SECRET / EIMS_API_KEY / EIMS_TIN to enable live filing.';

/**
 * Short badge label shown in the EIMS dashboard header when sandbox is active.
 */
export const EIMS_SANDBOX_BADGE = 'MoR Sandbox';

/**
 * Derive sandbox status from the runtime environment on the **backend** (NestJS).
 * Accepts the raw string value of `process.env.EIMS_SANDBOX`.
 *
 * @example
 * const sandbox = isEimsSandbox(configService.get('EIMS_SANDBOX'));
 */
export function isEimsSandbox(raw: string | undefined | null): boolean {
  return raw === 'true' || raw === '1';
}

/**
 * Derive sandbox status on the **frontend** from a boolean flag propagated
 * by the backend's `GET /eims/compliance/readiness` response.
 * Falls back to checking a window-level flag injected by the backend health
 * endpoint (`window.__EIMS_SANDBOX__`) so pages that load before the API
 * responds can still show the correct indicator.
 *
 * @param apiFlag  The `sandbox` boolean from the EIMS readiness API response.
 */
export function isEimsSandboxClient(apiFlag?: boolean | null): boolean {
  if (typeof apiFlag === 'boolean') return apiFlag;
  if (typeof window !== 'undefined') {
    return (window as unknown as Record<string, unknown>)['__EIMS_SANDBOX__'] === true;
  }
  return false;
}
export const NAV_CACHE_TTL_SECONDS = 300;
export const DEFAULT_DUE_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export const CERT_EXPIRY_WARNING_DAYS = 30;
export const INVOICE_ACTIVITY_LIMIT = 20;
export const LATEST_RELEASES_LIMIT = 5;
export const TOT_PAGINATION_LIMIT = 50;
export const WHT_PAGINATION_LIMIT = 100;
export const VAT_FILINGS_LIMIT = 50;
export const VAT_INPUT_LEDGER_LIMIT = 100;
export const VAT_OUTPUT_LEDGER_LIMIT = 100;
export const ACK_VAULT_LIMIT = 50;
export const EIMS_BULK_JOBS_LIMIT = 100;
export const EIMS_REGISTRATIONS_LIMIT = 200;
export const EIMS_BSP_REPORT_LIMIT = 100;
export const EIMS_RECEIPTS_LIMIT = 200;
export const SLA_UPTIME_PERCENT = 99.9;
export const TOKEN_BLACKLIST_RETENTION_DAYS = 7;
export const BACKEND_API_PREFIX = 'api';
export const SWAGGER_PATH = 'openapi';
export const JSON_DOCUMENT_PATH = 'openapi.json';
