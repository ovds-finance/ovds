/**
 * @ovds/dto/common/serializer — entity-to-DTO serialization utilities
 *
 * Provides pure functions that convert raw Prisma database entities into
 * clean, predictable DTO shapes before they hit the wire.
 *
 * Guarantees:
 *  1. Sensitive fields (password hashes, API keys, MFA secrets) are always stripped.
 *  2. Dates are ISO-8601 strings, never raw Date objects or timestamps.
 *  3. Decimals are serialized as strings to preserve precision.
 *  4. Null/undefined are normalized to avoid frontend null-checking surprises.
 *
 * Usage in NestJS:
 *   import { serializeUser, serializePaginated } from '@ovds/dto';
 *   return serializePaginated(users.map(serializeUser), total, page, limit);
 */

// ── Type helpers ──────────────────────────────────────────────────────────────

export type PickOptional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
export type DeepOmitArray<T, K extends string> = T extends readonly (infer U)[]
  ? DeepOmitArray<U, K>[]
  : T extends object
    ? { [P in keyof T as P extends K ? never : P]: DeepOmitArray<T[P], K> }
    : T;

// ── Sensitive field names (always stripped from outgoing responses) ────────────

export const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'hashedPassword',
  'salt',
  'apiKey',
  'apiSecret',
  'secret',
  'mfaSecret',
  'totpSecret',
  'privateKey',
  'accessToken',
  'refreshToken',
  'resetToken',
  'emailVerificationToken',
  'webhookSecret',
  'encryptionKey',
  'key',
  'keyPrefix',
  'credential',
  'credentials',
]);

export function stripSensitive<T extends Record<string, any>>(entity: T): Omit<T, typeof SENSITIVE_FIELDS extends Set<string> ? string : never> {
  const out: Record<string, any> = {};
  for (const key of Object.keys(entity)) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    out[key] = entity[key];
  }
  return out as any;
}

// ── Date / Decimal normalization ──────────────────────────────────────────────

export function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function serializeDecimal(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value?.toFixed === 'function') return value.toFixed();
  return String(value);
}

// ── Generic entity serializer ──────────────────────────────────────────────────

export interface SerializeOptions {
  omit?: string[];
  include?: string[];
  datesToIso?: boolean;
  decimalsToString?: boolean;
}

const DEFAULT_OPTIONS: Required<SerializeOptions> = {
  omit: [],
  include: [],
  datesToIso: true,
  decimalsToString: true,
};

export function serializeEntity<T extends Record<string, any>>(
  entity: T,
  options: SerializeOptions = {},
): Record<string, any> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const omitSet = new Set([...SENSITIVE_FIELDS, ...opts.omit]);
  const includeSet = opts.include.length > 0 ? new Set(opts.include) : null;

  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(entity)) {
    if (omitSet.has(key)) continue;
    if (includeSet && !includeSet.has(key)) continue;

    if (value === null || value === undefined) {
      out[key] = null;
      continue;
    }

    if (opts.datesToIso && value instanceof Date) {
      out[key] = value.toISOString();
      continue;
    }

    if (opts.decimalsToString && typeof value === 'object' && typeof value.toFixed === 'function') {
      out[key] = value.toFixed();
      continue;
    }

    out[key] = value;
  }

  return out;
}

// ── Paginated response builder ────────────────────────────────────────────────

export interface PaginatedDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function serializePaginated<T extends Record<string, any>>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  serializer?: (item: T) => Record<string, any>,
): PaginatedDto<Record<string, any>> {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data: items.map(item => serializer ? serializer(item) : serializeEntity(item)),
    total,
    page,
    limit,
    totalPages,
  };
}

// ── Standard API envelope ─────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
  fields?: Record<string, string>;
  requestId?: string;
  timestamp?: string;
  ms?: string;
  errors?: string[];
}

export function serializeApiResponse<T>(
  opts: {
    success: boolean;
    statusCode: number;
    message?: string;
    data?: T;
    error?: string;
    fields?: Record<string, string>;
    requestId?: string;
    ms?: string;
    errors?: string[];
  },
): ApiEnvelope<T> {
  return {
    success: opts.success,
    statusCode: opts.statusCode,
    message: opts.message,
    data: opts.data,
    error: opts.error,
    fields: opts.fields,
    requestId: opts.requestId,
    timestamp: new Date().toISOString(),
    ms: opts.ms,
    errors: opts.errors,
  };
}
