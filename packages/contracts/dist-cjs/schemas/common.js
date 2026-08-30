/**
 * @ovds/contracts — Common Schemas
 *
 * Pagination, API envelope, and cross-cutting request/response shapes.
 * These are pure Zod — no Prisma dependency — so they work in every environment.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get ApiResponseSchema () {
        return ApiResponseSchema;
    },
    get CompanyContextSchema () {
        return CompanyContextSchema;
    },
    get DateRangeSchema () {
        return DateRangeSchema;
    },
    get IdParamSchema () {
        return IdParamSchema;
    },
    get PaginatedResultSchema () {
        return PaginatedResultSchema;
    },
    get PaginationQuerySchema () {
        return PaginationQuerySchema;
    }
});
const _zod = require("zod");
const PaginationQuerySchema = _zod.z.object({
    page: _zod.z.coerce.number().int().min(1).default(1),
    limit: _zod.z.coerce.number().int().min(1).max(200).default(20),
    search: _zod.z.string().optional(),
    sortBy: _zod.z.string().optional(),
    sortOrder: _zod.z.enum([
        'asc',
        'desc'
    ]).default('asc')
});
function PaginatedResultSchema(itemSchema) {
    return _zod.z.object({
        data: _zod.z.array(itemSchema),
        total: _zod.z.number().int().nonnegative(),
        page: _zod.z.number().int().positive(),
        limit: _zod.z.number().int().positive(),
        totalPages: _zod.z.number().int().nonnegative()
    });
}
function ApiResponseSchema(dataSchema) {
    return _zod.z.object({
        success: _zod.z.boolean(),
        statusCode: _zod.z.number().int(),
        message: _zod.z.string().optional(),
        data: dataSchema.optional(),
        error: _zod.z.string().optional(),
        requestId: _zod.z.string().optional(),
        timestamp: _zod.z.string().optional()
    });
}
const IdParamSchema = _zod.z.object({
    id: _zod.z.string().uuid()
});
const CompanyContextSchema = _zod.z.object({
    companyId: _zod.z.string().uuid().optional()
});
const DateRangeSchema = _zod.z.object({
    dateFrom: _zod.z.string().optional(),
    dateTo: _zod.z.string().optional()
});
