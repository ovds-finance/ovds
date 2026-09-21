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
export declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export declare function PaginatedResultSchema<T extends z.ZodTypeAny>(itemSchema: T): z.ZodObject<{
    data: z.ZodArray<T>;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
}, z.core.$strip>;
export type PaginatedResult<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
export declare function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T): z.ZodObject<{
    success: z.ZodBoolean;
    statusCode: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    requestId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
    ms: z.ZodOptional<z.ZodString>;
    errors: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const IdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type ZodParseSuccess<T> = {
    success: true;
    data: T;
};
export type ZodParseFailure = {
    success: false;
    error: z.ZodError;
};
export type ZodParseResult<T> = ZodParseSuccess<T> | ZodParseFailure;
export type ZodResolver<R extends z.ZodType<any>> = (values: unknown, context?: any, options?: any) => Promise<ZodParseResult<z.infer<R>>>;
export declare function createZodResolver<R extends z.ZodType<any>>(schema: R): ZodResolver<R>;
export declare function zodErrorsToMap(error: z.ZodError): Record<string, string>;
//# sourceMappingURL=zod-bridge.d.ts.map