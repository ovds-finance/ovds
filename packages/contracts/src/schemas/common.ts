/**
 * @ovds/contracts — Common Schemas
 *
 * Pagination, API envelope, and cross-cutting request/response shapes.
 * These are pure Zod — no Prisma dependency — so they work in every environment.
 */
import { z } from 'zod';

// ── Pagination ────────────────────────────────────────────────────────────────

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export function PaginatedResultSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
}

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ── API Envelope ──────────────────────────────────────────────────────────────

/**
 * ApiResponseSchema — Zod runtime validator for the standard API envelope.
 *
 * Kept in sync with the `ApiResponse<T>` interface in @ovds/shared.
 * Fields marked "backend-only" are emitted by NestJS interceptors and are
 * optional so frontend consumers that omit them still pass validation.
 */
export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    statusCode: z.number().int(),
    message: z.string().optional(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    /** Per-field validation error map — populated by class-validator pipes. */
    fields: z.record(z.string(), z.string()).optional(),
    requestId: z.string().optional(),
    timestamp: z.string().optional(),
    /** Server processing time in milliseconds. */
    ms: z.string().optional(),
    /** Array of error message strings (batch / multi-error responses). */
    errors: z.array(z.string()).optional(),
  });
}

// ── ID param ─────────────────────────────────────────────────────────────────

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export type IdParam = z.infer<typeof IdParamSchema>;

// ── Company context header ────────────────────────────────────────────────────

export const CompanyContextSchema = z.object({
  companyId: z.string().uuid().optional(),
});

// ── Date range ───────────────────────────────────────────────────────────────

export const DateRangeSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
