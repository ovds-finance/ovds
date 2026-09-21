/**
 * Typed Prisma where-clause builder.
 * Fluent, composable, and safe — replaces raw `const where: any = {}` patterns.
 *
 * Usage:
 *   const where = whereBuilder()
 *     .scope(companyId)
 *     .eq('status', status)
 *     .search(['invoiceNumber', 'customerName'], q)
 *     .dateRange('createdAt', dateFrom, dateTo)
 *     .build();
 */
type PrismaFilter = Record<string, unknown>;
export declare class WhereBuilder {
    private readonly _where;
    /** Tenant isolation — adds companyId only if provided */
    scope(companyId?: string | null): this;
    /** field = value; skips null, undefined, and 'ALL' sentinel */
    eq(field: string, value?: string | number | boolean | null, skipSentinel?: string): this;
    /** field != value */
    neq(field: string, value: string | number | boolean): this;
    /** field IN list */
    inList(field: string, values?: (string | number)[]): this;
    /** field NOT IN list */
    notIn(field: string, values: (string | number)[]): this;
    gt(field: string, value: number): this;
    gte(field: string, value: number | Date): this;
    lt(field: string, value: number): this;
    lte(field: string, value: number | Date): this;
    isTrue(field: string): this;
    isFalse(field: string): this;
    isNull(field: string): this;
    isNotNull(field: string): this;
    /**
     * OR CONTAINS across multiple string fields.
     * No mode:'insensitive' — MariaDB utf8mb4_general_ci handles case.
     */
    search(fields: string[], term?: string): this;
    contains(field: string, value?: string): this;
    startsWith(field: string, value?: string): this;
    dateRange(field: string, from?: string | Date, to?: string | Date): this;
    since(from: string | Date, field?: string): this;
    numRange(field: string, min?: number, max?: number): this;
    /** status IN ('PENDING','OVERDUE') AND dueDate < now */
    overdue(dateField?: string, statusField?: string): this;
    relation(field: string, subWhere: PrismaFilter): this;
    and(conditions: PrismaFilter[]): this;
    or(conditions: PrismaFilter[]): this;
    /** Merge a raw Prisma fragment for edge cases the builder doesn't cover */
    raw(fragment: PrismaFilter): this;
    build(): PrismaFilter;
}
/** Factory function — preferred over `new WhereBuilder()` */
export declare function whereBuilder(): WhereBuilder;
export {};
//# sourceMappingURL=where.builder.d.ts.map