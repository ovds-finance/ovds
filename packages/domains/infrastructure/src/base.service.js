"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
/**
 * BaseService — Generic CRUD foundation for all domain service libraries.
 *
 * Domain services in packages/domains/<domain>/src/lib/ extend this class.
 * The NestJS app module wires PrismaService and AuditLogService via DI,
 * then passes them to the super() constructor.
 *
 * Usage in a domain lib:
 *   @Injectable()
 *   export class AccountingService extends BaseService {
 *     constructor(prisma: PrismaService, audit: AuditLogService) {
 *       super(prisma, audit, 'AccountingService');
 *     }
 *   }
 */
const common_1 = require("@nestjs/common");
const pagination_helper_1 = require("./pagination.helper");
let BaseService = class BaseService {
    constructor(prisma, auditLog, serviceName) {
        this.prisma = prisma;
        this.auditLog = auditLog;
        this.logger = new common_1.Logger(serviceName);
    }
    // ── Where-clause builder ───────────────────────────────────────────────────
    buildWhere(opts, searchFields = []) {
        const where = {};
        if (opts.companyId)
            where.companyId = opts.companyId;
        if (opts.status && opts.status !== 'ALL')
            where.status = opts.status;
        if (opts.search?.trim() && searchFields.length > 0) {
            const filter = (0, pagination_helper_1.buildSearchFilter)(opts.search, searchFields);
            if (filter)
                Object.assign(where, filter);
        }
        if (opts.dateFrom || opts.dateTo) {
            const field = opts.dateField ?? 'createdAt';
            const range = {};
            if (opts.dateFrom)
                range.gte = new Date(opts.dateFrom);
            if (opts.dateTo)
                range.lte = new Date(opts.dateTo);
            where[field] = range;
        }
        if (opts.extra)
            Object.assign(where, opts.extra);
        return where;
    }
    // ── findOrThrow ────────────────────────────────────────────────────────────
    async findOrThrow(delegate, id, companyId, include, resourceName = 'Record') {
        const where = { id };
        if (companyId)
            where.companyId = companyId;
        const record = await delegate.findFirst({ where, ...(include ? { include } : {}) });
        if (!record)
            throw new common_1.NotFoundException(`${resourceName} not found`);
        return record;
    }
    // ── Paginated list ─────────────────────────────────────────────────────────
    async paginatedList(delegate, opts, searchFields = [], include, defaultSort = 'createdAt') {
        const { skip, take } = (0, pagination_helper_1.buildPrismaPage)(opts);
        const where = this.buildWhere(opts, searchFields);
        const orderBy = (0, pagination_helper_1.buildOrderBy)(opts, defaultSort);
        const [data, total] = await Promise.all([
            delegate.findMany({ where, skip, take, orderBy, ...(include ? { include } : {}) }),
            delegate.count({ where }),
        ]);
        return (0, pagination_helper_1.paginate)(data, total, opts);
    }
    // ── Helpers ────────────────────────────────────────────────────────────────
    /** Fire-and-forget audit log — never blocks the primary operation */
    audit(userId, action, details, companyId) {
        this.auditLog
            .log(userId, action, details, companyId)
            .catch((err) => this.logger.warn(`Audit log failed: ${err?.message}`));
    }
    async sumField(delegate, where, fields) {
        const _sum = Object.fromEntries(fields.map((f) => [f, true]));
        const result = await delegate.aggregate({ where, _sum });
        return Object.fromEntries(fields.map((f) => [f, Number(result._sum[f] ?? 0)]));
    }
    async assertUnique(delegate, where, message = 'Record already exists') {
        const existing = await delegate.findFirst({ where });
        if (existing)
            throw new common_1.ConflictException(message);
    }
    toNum(v) { return Number(v ?? 0); }
    round2(v) { return Math.round(v * 100) / 100; }
};
exports.BaseService = BaseService;
exports.BaseService = BaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, Object, String])
], BaseService);
//# sourceMappingURL=base.service.js.map