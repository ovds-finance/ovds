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

export class WhereBuilder {
  private readonly _where: PrismaFilter = {};

  /** Tenant isolation — adds companyId only if provided */
  scope(companyId?: string | null): this {
    if (companyId) this._where.companyId = companyId;
    return this;
  }

  /** field = value; skips null, undefined, and 'ALL' sentinel */
  eq(field: string, value?: string | number | boolean | null, skipSentinel = 'ALL'): this {
    if (value !== undefined && value !== null && value !== skipSentinel) {
      this._where[field] = value;
    }
    return this;
  }

  /** field != value */
  neq(field: string, value: string | number | boolean): this {
    this._where[field] = { not: value };
    return this;
  }

  /** field IN list */
  inList(field: string, values?: (string | number)[]): this {
    if (values?.length) this._where[field] = { in: values };
    return this;
  }

  /** field NOT IN list */
  notIn(field: string, values: (string | number)[]): this {
    if (values.length) this._where[field] = { notIn: values };
    return this;
  }

  gt(field: string, value: number): this { this._where[field] = { gt: value }; return this; }
  gte(field: string, value: number | Date): this { this._where[field] = { gte: value }; return this; }
  lt(field: string, value: number): this { this._where[field] = { lt: value }; return this; }
  lte(field: string, value: number | Date): this { this._where[field] = { lte: value }; return this; }
  isTrue(field: string): this { this._where[field] = true; return this; }
  isFalse(field: string): this { this._where[field] = false; return this; }
  isNull(field: string): this { this._where[field] = null; return this; }
  isNotNull(field: string): this { this._where[field] = { not: null }; return this; }

  /**
   * OR CONTAINS across multiple string fields.
   * No mode:'insensitive' — MariaDB utf8mb4_general_ci handles case.
   */
  search(fields: string[], term?: string): this {
    if (!term?.trim() || !fields.length) return this;
    this._where.OR = fields.map((f) => ({ [f]: { contains: term.trim() } }));
    return this;
  }

  contains(field: string, value?: string): this {
    if (value?.trim()) this._where[field] = { contains: value.trim() };
    return this;
  }

  startsWith(field: string, value?: string): this {
    if (value?.trim()) this._where[field] = { startsWith: value.trim() };
    return this;
  }

  dateRange(field: string, from?: string | Date, to?: string | Date): this {
    if (!from && !to) return this;
    const range: Record<string, Date> = {};
    if (from) range.gte = from instanceof Date ? from : new Date(from);
    if (to) range.lte = to instanceof Date ? to : new Date(to);
    this._where[field] = range;
    return this;
  }

  since(from: string | Date, field = 'createdAt'): this {
    return this.dateRange(field, from, undefined);
  }

  numRange(field: string, min?: number, max?: number): this {
    if (min === undefined && max === undefined) return this;
    const range: Record<string, number> = {};
    if (min !== undefined) range.gte = min;
    if (max !== undefined) range.lte = max;
    this._where[field] = range;
    return this;
  }

  /** status IN ('PENDING','OVERDUE') AND dueDate < now */
  overdue(dateField = 'dueDate', statusField = 'status'): this {
    this._where[statusField] = { in: ['PENDING', 'OVERDUE'] };
    this._where[dateField] = { lt: new Date() };
    return this;
  }

  relation(field: string, subWhere: PrismaFilter): this {
    this._where[field] = subWhere;
    return this;
  }

  and(conditions: PrismaFilter[]): this {
    const existing = (this._where.AND as PrismaFilter[] | undefined) ?? [];
    this._where.AND = [...existing, ...conditions];
    return this;
  }

  or(conditions: PrismaFilter[]): this {
    this._where.OR = conditions;
    return this;
  }

  /** Merge a raw Prisma fragment for edge cases the builder doesn't cover */
  raw(fragment: PrismaFilter): this {
    Object.assign(this._where, fragment);
    return this;
  }

  build(): PrismaFilter {
    return { ...this._where };
  }
}

/** Factory function — preferred over `new WhereBuilder()` */
export function whereBuilder(): WhereBuilder {
  return new WhereBuilder();
}
