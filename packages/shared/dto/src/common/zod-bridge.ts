/**
 * @ovds/dto/common/zod-bridge — Zod schemas + React Hook Form resolver bridge
 *
 * Provides Zod versions of the class-validator DTOs so the frontend can
 * validate forms with the exact same rules the backend enforces via pipes.
 *
 * Design principle:
 *   "An inputs format (like an email field or credit card format) matches
 *   exactly on both sides of the application."
 *
 * Usage in React (React Hook Form):
 *   import { LoginSchema, createZodResolver } from '@ovds/dto';
 *   const { register, handleSubmit } = useForm({
 *     resolver: createZodResolver(LoginSchema)
 *   });
 *
 * Usage in NestJS:
 *   import { LoginSchema } from '@ovds/dto';
 *   @Post('login')
 *   login(@Body(ZodValidationPipe(LoginSchema)) dto: z.infer<typeof LoginSchema>) { ... }
 *
 * NOTE: This file has NO React dependency — safe to import in NestJS.
 */

import { z } from 'zod';

// ── Re-usable Zod helpers ─────────────────────────────────────────────────────

const emailSchema = z.string().email('Invalid email address').max(100);
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');
const usernameSchema = z.string()
  .min(1, 'Username is required')
  .max(100, 'Username must not exceed 100 characters');
const phoneSchema = z.string()
  .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Phone must be 7–20 digits with optional +/spaces/dashes')
  .optional()
  .or(z.literal(''));

// ── Pagination ────────────────────────────────────────────────────────────────
// Single source of truth for pagination rules — shared with NestJS pipes.

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
// Matches the ApiResponse<T> interface in @ovds/shared.

export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    statusCode: z.number().int(),
    message: z.string().optional(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    fields: z.record(z.string(), z.string()).optional(),
    requestId: z.string().optional(),
    timestamp: z.string().optional(),
    ms: z.string().optional(),
    errors: z.array(z.string()).optional(),
  });
}

// ── ID param ──────────────────────────────────────────────────────────────────

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export type IdParam = z.infer<typeof IdParamSchema>;

// ── React Hook Form resolver bridge ───────────────────────────────────────────
//
// This is a thin wrapper around @hookform/resolvers/zod.
// It is defined here so @ovds/dto consumers never need to import
// the resolver package directly — keeping the dependency graph clean.
//
// Frontend apps should still install react-hook-form + @hookform/resolvers
// as direct dependencies.

export type ZodParseSuccess<T> = { success: true; data: T };
export type ZodParseFailure = { success: false; error: z.ZodError };
export type ZodParseResult<T> = ZodParseSuccess<T> | ZodParseFailure;

export type ZodResolver<R extends z.ZodType<any>> = (
  values: unknown,
  context?: any,
  options?: any,
) => Promise<ZodParseResult<z.infer<R>>>;

export function createZodResolver<R extends z.ZodType<any>>(schema: R): ZodResolver<R> {
  return async (values: unknown): Promise<ZodParseResult<z.infer<R>>> => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  };
}

// ── Validation result utilities ───────────────────────────────────────────────

export function zodErrorsToMap(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    map[key] = issue.message;
  }
  return map;
}

// ── Domain schema re-exports (single import path for frontend) ───────────────
//
// Additional domain schemas from @ovds/contracts/schemas can be added here.
// Backend code should import from @ovds/contracts/schemas directly.


