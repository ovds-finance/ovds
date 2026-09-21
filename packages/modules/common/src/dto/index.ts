/**
 * @ovds/modules/common — DTO / contract definitions.
 *
 * Common cross-cutting contracts: pagination, API envelopes, ID params,
 * date ranges, and company context — the shapes shared by every module.
 *
 * Usage (backend):
 *   import { PaginationQuerySchema, ApiResponseSchema } from '@ovds/modules/common/dto';
 *   import { IdParamSchema, DateRangeSchema } from '@ovds/modules/common/dto';
 */

export * from '@ovds/contracts/schemas/common';
