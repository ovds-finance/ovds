/**
 * Pagination helpers for backend domain services.
 * Consumed by every domain library — never import from app code directly.
 */
import { PAGINATION, PaginatedResult } from '@ovds/shared';
import { PaginationQueryDto } from '@ovds/dto';

/** Build Prisma skip/take from a PaginationQueryDto */
export function buildPrismaPage(query: PaginationQueryDto): { skip: number; take: number } {
  const page = Math.max(1, query.page ?? PAGINATION.DEFAULT_PAGE);
  const take = Math.min(
    query.take ?? query.limit ?? PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );
  return { skip: (page - 1) * take, take };
}

/** Wrap a data array + total count into a PaginatedResult */
export function paginate<T>(data: T[], total: number, query: PaginationQueryDto): PaginatedResult<T> {
  const page = Math.max(1, query.page ?? PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    query.take ?? query.limit ?? PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );
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
export function buildOrderBy(
  query: PaginationQueryDto,
  defaultField = 'createdAt',
  allowedFields?: string[],
): Record<string, 'asc' | 'desc'> {
  const field = query.sortBy ?? defaultField;
  const order = query.sortOrder ?? 'desc';
  if (allowedFields && !allowedFields.includes(field)) {
    return { [defaultField]: order };
  }
  return { [field]: order };
}

/** Build a Prisma search filter for string fields (MariaDB: no mode: 'insensitive') */
export function buildSearchFilter(
  search: string | undefined,
  fields: string[],
): object | undefined {
  if (!search?.trim()) return undefined;
  return { OR: fields.map((f) => ({ [f]: { contains: search.trim() } })) };
}

// ── Cursor pagination ──────────────────────────────────────────────────────────

export interface CursorPageInput { cursor?: string | null; take?: number; }
export interface CursorPageResult<T> { data: T[]; nextCursor: string | null; hasMore: boolean; }

export function buildCursorPage(input: CursorPageInput): { cursor?: { id: string }; skip?: number; take: number } {
  const take = Math.min(input.take ?? 20, 200);
  if (input.cursor) return { cursor: { id: input.cursor }, skip: 1, take: take + 1 };
  return { take: take + 1 };
}

export function buildCursorResult<T extends { id: string }>(items: T[], take: number): CursorPageResult<T> {
  const hasMore = items.length > take;
  const data = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;
  return { data, nextCursor, hasMore };
}

/** Build a date filter for a fiscal period string (YYYY-MM) */
export function buildPeriodFilter(
  period: string,
  field = 'createdAt',
): Record<string, { gte: Date; lte: Date }> | undefined {
  if (!period?.match(/^\d{4}-\d{2}$/)) return undefined;
  const [y, m] = period.split('-').map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { [field]: { gte: start, lte: end } };
}
