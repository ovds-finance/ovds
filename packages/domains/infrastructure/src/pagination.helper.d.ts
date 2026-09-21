/**
 * Pagination helpers for backend domain services.
 * Consumed by every domain library — never import from app code directly.
 */
import { PaginatedResult } from '@ovds/shared';
import { PaginationQueryDto } from '@ovds/dto';
/** Build Prisma skip/take from a PaginationQueryDto */
export declare function buildPrismaPage(query: PaginationQueryDto): {
    skip: number;
    take: number;
};
/** Wrap a data array + total count into a PaginatedResult */
export declare function paginate<T>(data: T[], total: number, query: PaginationQueryDto): PaginatedResult<T>;
/** Build a Prisma orderBy clause from sortBy/sortOrder query params */
export declare function buildOrderBy(query: PaginationQueryDto, defaultField?: string, allowedFields?: string[]): Record<string, 'asc' | 'desc'>;
/** Build a Prisma search filter for string fields (MariaDB: no mode: 'insensitive') */
export declare function buildSearchFilter(search: string | undefined, fields: string[]): object | undefined;
export interface CursorPageInput {
    cursor?: string | null;
    take?: number;
}
export interface CursorPageResult<T> {
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
}
export declare function buildCursorPage(input: CursorPageInput): {
    cursor?: {
        id: string;
    };
    skip?: number;
    take: number;
};
export declare function buildCursorResult<T extends {
    id: string;
}>(items: T[], take: number): CursorPageResult<T>;
/** Build a date filter for a fiscal period string (YYYY-MM) */
export declare function buildPeriodFilter(period: string, field?: string): Record<string, {
    gte: Date;
    lte: Date;
}> | undefined;
//# sourceMappingURL=pagination.helper.d.ts.map