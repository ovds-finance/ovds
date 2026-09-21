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
export type PickOptional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
export type DeepOmitArray<T, K extends string> = T extends readonly (infer U)[] ? DeepOmitArray<U, K>[] : T extends object ? {
    [P in keyof T as P extends K ? never : P]: DeepOmitArray<T[P], K>;
} : T;
export declare const SENSITIVE_FIELDS: Set<string>;
export declare function stripSensitive<T extends Record<string, any>>(entity: T): Omit<T, typeof SENSITIVE_FIELDS extends Set<string> ? string : never>;
export declare function serializeDate(value: Date | string | null | undefined): string | null;
export declare function serializeDecimal(value: any): string | null;
export interface SerializeOptions {
    omit?: string[];
    include?: string[];
    datesToIso?: boolean;
    decimalsToString?: boolean;
}
export declare function serializeEntity<T extends Record<string, any>>(entity: T, options?: SerializeOptions): Record<string, any>;
export interface PaginatedDto<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare function serializePaginated<T extends Record<string, any>>(items: T[], total: number, page: number, limit: number, serializer?: (item: T) => Record<string, any>): PaginatedDto<Record<string, any>>;
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
export declare function serializeApiResponse<T>(opts: {
    success: boolean;
    statusCode: number;
    message?: string;
    data?: T;
    error?: string;
    fields?: Record<string, string>;
    requestId?: string;
    ms?: string;
    errors?: string[];
}): ApiEnvelope<T>;
//# sourceMappingURL=serializer.d.ts.map