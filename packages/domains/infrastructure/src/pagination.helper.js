"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrismaPage = buildPrismaPage;
exports.paginate = paginate;
exports.buildOrderBy = buildOrderBy;
exports.buildSearchFilter = buildSearchFilter;
exports.buildCursorPage = buildCursorPage;
exports.buildCursorResult = buildCursorResult;
exports.buildPeriodFilter = buildPeriodFilter;
/**
 * Pagination helpers for backend domain services.
 * Consumed by every domain library — never import from app code directly.
 */
const shared_1 = require("@ovds/shared");
/** Build Prisma skip/take from a PaginationQueryDto */
function buildPrismaPage(query) {
    const page = Math.max(1, query.page ?? shared_1.PAGINATION.DEFAULT_PAGE);
    const take = Math.min(query.take ?? query.limit ?? shared_1.PAGINATION.DEFAULT_LIMIT, shared_1.PAGINATION.MAX_LIMIT);
    return { skip: (page - 1) * take, take };
}
/** Wrap a data array + total count into a PaginatedResult */
function paginate(data, total, query) {
    const page = Math.max(1, query.page ?? shared_1.PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(query.take ?? query.limit ?? shared_1.PAGINATION.DEFAULT_LIMIT, shared_1.PAGINATION.MAX_LIMIT);
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        total,
        page,
        limit,
        totalPages,
        pagination: { page, take: limit, total, pages: totalPages },
    };
}
/** Build a Prisma orderBy clause from sortBy/sortOrder query params */
function buildOrderBy(query, defaultField = 'createdAt', allowedFields) {
    const field = query.sortBy ?? defaultField;
    const order = query.sortOrder ?? 'desc';
    if (allowedFields && !allowedFields.includes(field)) {
        return { [defaultField]: order };
    }
    return { [field]: order };
}
/** Build a Prisma search filter for string fields (MariaDB: no mode: 'insensitive') */
function buildSearchFilter(search, fields) {
    if (!search?.trim())
        return undefined;
    return { OR: fields.map((f) => ({ [f]: { contains: search.trim() } })) };
}
function buildCursorPage(input) {
    const take = Math.min(input.take ?? 20, 200);
    if (input.cursor)
        return { cursor: { id: input.cursor }, skip: 1, take: take + 1 };
    return { take: take + 1 };
}
function buildCursorResult(items, take) {
    const hasMore = items.length > take;
    const data = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;
    return { data, nextCursor, hasMore };
}
/** Build a date filter for a fiscal period string (YYYY-MM) */
function buildPeriodFilter(period, field = 'createdAt') {
    if (!period?.match(/^\d{4}-\d{2}$/))
        return undefined;
    const [y, m] = period.split('-').map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    return { [field]: { gte: start, lte: end } };
}
//# sourceMappingURL=pagination.helper.js.map