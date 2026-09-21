"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhereBuilder = void 0;
exports.whereBuilder = whereBuilder;
class WhereBuilder {
    constructor() {
        this._where = {};
    }
    /** Tenant isolation — adds companyId only if provided */
    scope(companyId) {
        if (companyId)
            this._where.companyId = companyId;
        return this;
    }
    /** field = value; skips null, undefined, and 'ALL' sentinel */
    eq(field, value, skipSentinel = 'ALL') {
        if (value !== undefined && value !== null && value !== skipSentinel) {
            this._where[field] = value;
        }
        return this;
    }
    /** field != value */
    neq(field, value) {
        this._where[field] = { not: value };
        return this;
    }
    /** field IN list */
    inList(field, values) {
        if (values?.length)
            this._where[field] = { in: values };
        return this;
    }
    /** field NOT IN list */
    notIn(field, values) {
        if (values.length)
            this._where[field] = { notIn: values };
        return this;
    }
    gt(field, value) { this._where[field] = { gt: value }; return this; }
    gte(field, value) { this._where[field] = { gte: value }; return this; }
    lt(field, value) { this._where[field] = { lt: value }; return this; }
    lte(field, value) { this._where[field] = { lte: value }; return this; }
    isTrue(field) { this._where[field] = true; return this; }
    isFalse(field) { this._where[field] = false; return this; }
    isNull(field) { this._where[field] = null; return this; }
    isNotNull(field) { this._where[field] = { not: null }; return this; }
    /**
     * OR CONTAINS across multiple string fields.
     * No mode:'insensitive' — MariaDB utf8mb4_general_ci handles case.
     */
    search(fields, term) {
        if (!term?.trim() || !fields.length)
            return this;
        this._where.OR = fields.map((f) => ({ [f]: { contains: term.trim() } }));
        return this;
    }
    contains(field, value) {
        if (value?.trim())
            this._where[field] = { contains: value.trim() };
        return this;
    }
    startsWith(field, value) {
        if (value?.trim())
            this._where[field] = { startsWith: value.trim() };
        return this;
    }
    dateRange(field, from, to) {
        if (!from && !to)
            return this;
        const range = {};
        if (from)
            range.gte = from instanceof Date ? from : new Date(from);
        if (to)
            range.lte = to instanceof Date ? to : new Date(to);
        this._where[field] = range;
        return this;
    }
    since(from, field = 'createdAt') {
        return this.dateRange(field, from, undefined);
    }
    numRange(field, min, max) {
        if (min === undefined && max === undefined)
            return this;
        const range = {};
        if (min !== undefined)
            range.gte = min;
        if (max !== undefined)
            range.lte = max;
        this._where[field] = range;
        return this;
    }
    /** status IN ('PENDING','OVERDUE') AND dueDate < now */
    overdue(dateField = 'dueDate', statusField = 'status') {
        this._where[statusField] = { in: ['PENDING', 'OVERDUE'] };
        this._where[dateField] = { lt: new Date() };
        return this;
    }
    relation(field, subWhere) {
        this._where[field] = subWhere;
        return this;
    }
    and(conditions) {
        const existing = this._where.AND ?? [];
        this._where.AND = [...existing, ...conditions];
        return this;
    }
    or(conditions) {
        this._where.OR = conditions;
        return this;
    }
    /** Merge a raw Prisma fragment for edge cases the builder doesn't cover */
    raw(fragment) {
        Object.assign(this._where, fragment);
        return this;
    }
    build() {
        return { ...this._where };
    }
}
exports.WhereBuilder = WhereBuilder;
/** Factory function — preferred over `new WhereBuilder()` */
function whereBuilder() {
    return new WhereBuilder();
}
//# sourceMappingURL=where.builder.js.map