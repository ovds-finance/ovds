/**
 * @ovds/contracts/pipes/zod-validation — NestJS validation pipe using Zod schemas
 *
 * Replaces class-validator + class-transformer for endpoints that prefer Zod.
 * Uses the same schemas defined in @ovds/dto and @ovds/contracts/schemas so
 * the frontend and backend enforce identical rules.
 *
 * Usage:
 *   import { ZodValidationPipe, LoginSchema } from '@ovds/contracts';
 *
 *   @Post('login')
 *   login(@Body(new ZodValidationPipe(LoginSchema)) dto: z.infer<typeof LoginSchema>) {
 *     ...
 *   }
 *
 * The pipe:
 *  1. Runs schema.safeParse() on the incoming value.
 *  2. On success, returns the parsed (and possibly coerced) value.
 *  3. On failure, throws BadRequestException with a field-level error map
 *     compatible with the ApiResponse envelope used across the platform.
 */

import { PipeTransform, Injectable, BadRequestException, Type } from '@nestjs/common';
import { ZodError, ZodSchema, ZodTypeAny } from 'zod';

export interface ZodValidationPipeOptions<T extends ZodTypeAny> {
  schema: T;
  /**
   * If true (default), the pipe applies schema.parse() which also applies
   * defaults, transforms, and refinements. Set to false for safeParse-only.
   */
  applyTransforms?: boolean;
  /**
   * Custom error message prefix. Default: "Validation failed"
   */
  errorPrefix?: string;
}

@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(
    private readonly schema: T,
    private readonly applyTransforms = true,
    private readonly errorPrefix = 'Validation failed',
  ) {}

  static create<T extends ZodTypeAny>(schema: T, options?: Partial<ZodValidationPipeOptions<T>>) {
    return new ZodValidationPipe<T>(schema, options?.applyTransforms ?? true, options?.errorPrefix ?? 'Validation failed');
  }

  transform(value: unknown) {
    try {
      if (this.applyTransforms) {
        return this.schema.parse(value);
      }
      const result = this.schema.safeParse(value);
      if (!result.success) {
        throw new ZodError(result.error.issues);
      }
      return result.data;
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of error.issues) {
          const key = issue.path.join('.') || '_root';
          fields[key] = issue.message;
        }
        throw new BadRequestException({
          success: false,
          statusCode: 400,
          message: `${this.errorPrefix}: ${error.issues.length} error(s)`,
          fields,
        });
      }
      throw error;
    }
  }
}

// ── Re-export zod-errors-to-map helper for use in global exception filters ─────

export { zodErrorsToMap } from '@ovds/dto';
