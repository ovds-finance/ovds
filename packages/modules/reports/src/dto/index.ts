/**
 * @ovds/modules/reports — DTO / contract definitions.
 *
 * Reports & Analytics has no dedicated Zod schema file in @ovds/contracts yet.
 * Runtime-validated report request/response shapes are defined inline in the
 * NestJS controller — add them to @ovds/contracts/schemas/reporting.ts when
 * the reporting contract is stabilised.
 *
 * Pagination and API envelope shapes are available from common:
 *   import { PaginationQuerySchema, ApiResponseSchema } from '@ovds/modules/reports/dto';
 */

export {
  PaginationQuerySchema,
  type PaginationQuery,
  PaginatedResultSchema,
  type PaginatedResult,
  ApiResponseSchema,
  IdParamSchema,
  type IdParam,
  DateRangeSchema,
} from '@ovds/contracts/schemas/common';
