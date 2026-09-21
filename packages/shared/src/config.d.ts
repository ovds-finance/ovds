export declare const DEFAULT_TAX_RATE = 0.15;
export declare const DEFAULT_CURRENCY = "ETB";
export declare const DEFAULT_COUNTRY = "ET";
export declare const INVOICE_PREFIX = "INV-";
export declare const BILL_PREFIX = "BILL-";
export declare const DEFAULT_PAYMENT_TERMS = "Net 30";
export declare const DRRF_RATE = 0.01;
export declare const DEFAULT_VAT_RATE = 15;
export declare const DEFAULT_COUNTRY_NAME = "ETHIOPIA";
export declare const DEFAULT_CITY = "Addis Ababa";
export declare const DEFAULT_REGION = "Addis Ababa";
export declare const DEFAULT_WEREDA = "01";
export declare const DEFAULT_PAYMENT_MODE = "CASH";
export declare const DEFAULT_PAYMENT_TERM = "IMMEDIATE";
export declare const DEFAULT_SYSTEM_TYPE: "ERP";
export declare const DEFAULT_VERSION = "1.0.0";
export declare const EIMS_DEFAULT_COUNTRY = "ETHIOPIA";
export declare const EIMS_DEFAULT_CITY = "Addis Ababa";
export declare const EIMS_DEFAULT_REGION = "Addis Ababa";
export declare const EIMS_DEFAULT_WEREDA = "01";
export declare const EIMS_DEFAULT_PAYMENT_MODE = "CASH";
export declare const EIMS_DEFAULT_PAYMENT_TERM = "IMMEDIATE";
export declare const EIMS_DEFAULT_SYSTEM_TYPE: "ERP";
export declare const EIMS_DEFAULT_VERSION = "1.0.0";
export declare const OTP_PURPOSES: readonly ["LOGIN", "REGISTER", "PASSWORD_RESET", "MFA"];
export declare const ACCESS_TOKEN_MAX_AGE: number;
export declare const REFRESH_TOKEN_MAX_AGE: number;
export declare const THROTTLE_TTL_MS = 60000;
export declare const THROTTLE_LIMIT = 100;
export declare const AUTH_LOGIN_THROTTLE_LIMIT = 10;
export declare const AUTH_REGISTER_THROTTLE_LIMIT = 5;
export declare const AUTH_OTP_THROTTLE_LIMIT = 3;
export declare const PAGINATION_DEFAULT_LIMIT = 20;
export declare const PAGINATION_MAX_LIMIT = 100;
export declare const REPORT_DEFAULT_LIMIT = 200;
export declare const TOT_GOODS_RATE = 2;
export declare const TOT_SERVICES_RATE = 10;
export declare const BIT_RATE = 30;
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
export declare const WHT_GOODS_RATE = 0.03;
export declare const WHT_SERVICES_RATE = 0.03;
export declare const DEFAULT_PENALTY_RATE = 1.5;
export declare const OTP_MAX_REQUESTS = 3;
export declare const BCryptSaltRounds = 12;
export declare const JWT_REFRESH_EXPIRY = "7d";
export declare const EIMS_SANDBOX_TOKEN_TTL_MS = 3600000;
export declare const EIMS_TOKEN_REFRESH_BUFFER_MS = 30000;
export declare const EIMS_TIMEOUT_MS = 30000;
export declare const EIMS_RETRY_BASE_DELAY_MS = 500;
export declare const EIMS_RETRY_MAX_DELAY_MS = 5000;
export declare const EIMS_RETRY_JITTER_MS = 500;
export declare const EIMS_RETRY_AFTER_SEC = 2;
/**
 * Human-readable notice surfaced in the UI whenever EIMS_SANDBOX=true.
 * Used by frontend EIMS pages and backend compliance readiness reports to
 * make the non-production mode clearly visible to operators.
 */
export declare const EIMS_SANDBOX_NOTICE: string;
/**
 * Short badge label shown in the EIMS dashboard header when sandbox is active.
 */
export declare const EIMS_SANDBOX_BADGE = "MoR Sandbox";
/**
 * Derive sandbox status from the runtime environment on the **backend** (NestJS).
 * Accepts the raw string value of `process.env.EIMS_SANDBOX`.
 *
 * @example
 * const sandbox = isEimsSandbox(configService.get('EIMS_SANDBOX'));
 */
export declare function isEimsSandbox(raw: string | undefined | null): boolean;
/**
 * Derive sandbox status on the **frontend** from a boolean flag propagated
 * by the backend's `GET /eims/compliance/readiness` response.
 * Falls back to checking a window-level flag injected by the backend health
 * endpoint (`window.__EIMS_SANDBOX__`) so pages that load before the API
 * responds can still show the correct indicator.
 *
 * @param apiFlag  The `sandbox` boolean from the EIMS readiness API response.
 */
export declare function isEimsSandboxClient(apiFlag?: boolean | null): boolean;
export declare const NAV_CACHE_TTL_SECONDS = 300;
export declare const DEFAULT_DUE_DAYS_MS: number;
export declare const CERT_EXPIRY_WARNING_DAYS = 30;
export declare const INVOICE_ACTIVITY_LIMIT = 20;
export declare const LATEST_RELEASES_LIMIT = 5;
export declare const TOT_PAGINATION_LIMIT = 50;
export declare const WHT_PAGINATION_LIMIT = 100;
export declare const VAT_FILINGS_LIMIT = 50;
export declare const VAT_INPUT_LEDGER_LIMIT = 100;
export declare const VAT_OUTPUT_LEDGER_LIMIT = 100;
export declare const ACK_VAULT_LIMIT = 50;
export declare const EIMS_BULK_JOBS_LIMIT = 100;
export declare const EIMS_REGISTRATIONS_LIMIT = 200;
export declare const EIMS_BSP_REPORT_LIMIT = 100;
export declare const EIMS_RECEIPTS_LIMIT = 200;
export declare const SLA_UPTIME_PERCENT = 99.9;
export declare const TOKEN_BLACKLIST_RETENTION_DAYS = 7;
export declare const BACKEND_API_PREFIX = "api";
export declare const SWAGGER_PATH = "openapi";
export declare const JSON_DOCUMENT_PATH = "openapi.json";
//# sourceMappingURL=config.d.ts.map