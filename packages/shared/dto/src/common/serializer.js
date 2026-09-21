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
export function stripSensitive(entity) {
    const out = {};
    for (const key of Object.keys(entity)) {
        if (SENSITIVE_FIELDS.has(key))
            continue;
        out[key] = entity[key];
    }
    return out;
}
// ── Date / Decimal normalization ──────────────────────────────────────────────
export function serializeDate(value) {
    if (!value)
        return null;
    if (value instanceof Date)
        return value.toISOString();
    return value;
}
export function serializeDecimal(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'string')
        return value;
    if (typeof value?.toFixed === 'function')
        return value.toFixed();
    return String(value);
}
const DEFAULT_OPTIONS = {
    omit: [],
    include: [],
    datesToIso: true,
    decimalsToString: true,
};
export function serializeEntity(entity, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const omitSet = new Set([...SENSITIVE_FIELDS, ...opts.omit]);
    const includeSet = opts.include.length > 0 ? new Set(opts.include) : null;
    const out = {};
    for (const [key, value] of Object.entries(entity)) {
        if (omitSet.has(key))
            continue;
        if (includeSet && !includeSet.has(key))
            continue;
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
export function serializePaginated(items, total, page, limit, serializer) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
        data: items.map(item => serializer ? serializer(item) : serializeEntity(item)),
        total,
        page,
        limit,
        totalPages,
    };
}
export function serializeApiResponse(opts) {
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
