/**
 * @ovds/modules/projects — DTO / contract definitions.
 *
 * Project Accounting has no dedicated Zod schema file in @ovds/contracts yet.
 * Runtime-validated project shapes are planned for @ovds/contracts/schemas/projects.ts.
 * Until then, shared pagination and API envelope shapes are re-exported:
 *
 *   import { PaginationQuerySchema } from '@ovds/modules/projects/dto';
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
