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
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PaginatedResult } from '@ovds/shared';
import { PaginationQueryDto } from '@ovds/dto';
import { buildPrismaPage, buildOrderBy, paginate, buildSearchFilter } from './pagination.helper';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ListOptions extends PaginationQueryDto {
  companyId?: string;
  status?: string;
  search?: string;
  searchFields?: string[];
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  extra?: Record<string, unknown>;
}

export type ListResult<T> = PaginatedResult<T>;

// ── Base Service ───────────────────────────────────────────────────────────────

/**
 * Abstract base — inject PrismaService and AuditLogService from the NestJS app
 * via the concrete subclass constructor, then pass them to super().
 *
 * Domain libs must NOT import PrismaService or AuditLogService directly —
 * those are NestJS app concerns. Instead, accept them as constructor parameters
 * typed against their interfaces (see IAuditLogger and IPrismaClient below).
 */
export interface IAuditLogger {
  log(userId: string, action: string, details?: string, companyId?: string): Promise<void>;
}

// Minimal Prisma-compatible client interface (avoids direct @prisma/client dep in lib)
export interface IPrismaClient {
  $transaction: {
    (fn: (tx: any) => Promise<any>, opts?: any): Promise<any>;
    (operations: any[], opts?: any): Promise<any[]>;
  };
  [model: string]: any;
}

@Injectable()
export abstract class BaseService {
  protected readonly logger: Logger;

  constructor(
    protected readonly prisma: IPrismaClient,
    protected readonly auditLog: IAuditLogger,
    serviceName: string,
  ) {
    this.logger = new Logger(serviceName);
  }

  // ── Where-clause builder ───────────────────────────────────────────────────

  protected buildWhere(
    opts: {
      companyId?: string;
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      dateField?: string;
      extra?: Record<string, unknown>;
    },
    searchFields: string[] = [],
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (opts.companyId) where.companyId = opts.companyId;
    if (opts.status && opts.status !== 'ALL') where.status = opts.status;
    if (opts.search?.trim() && searchFields.length > 0) {
      const filter = buildSearchFilter(opts.search, searchFields);
      if (filter) Object.assign(where, filter);
    }
    if (opts.dateFrom || opts.dateTo) {
      const field = opts.dateField ?? 'createdAt';
      const range: Record<string, Date> = {};
      if (opts.dateFrom) range.gte = new Date(opts.dateFrom);
      if (opts.dateTo) range.lte = new Date(opts.dateTo);
      where[field] = range;
    }
    if (opts.extra) Object.assign(where, opts.extra);
    return where;
  }

  // ── findOrThrow ────────────────────────────────────────────────────────────

  protected async findOrThrow<T>(
    delegate: {
      findFirst: (args: { where: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<T | null>;
    },
    id: string,
    companyId?: string,
    include?: Record<string, unknown>,
    resourceName = 'Record',
  ): Promise<T> {
    const where: Record<string, unknown> = { id };
    if (companyId) where.companyId = companyId;
    const record = await delegate.findFirst({ where, ...(include ? { include } : {}) });
    if (!record) throw new NotFoundException(`${resourceName} not found`);
    return record;
  }

  // ── Paginated list ─────────────────────────────────────────────────────────

  protected async paginatedList<T>(
    delegate: {
      findMany: (args: {
        where: Record<string, unknown>;
        skip: number;
        take: number;
        orderBy: Record<string, string>;
        include?: Record<string, unknown>;
      }) => Promise<T[]>;
      count: (args: { where: Record<string, unknown> }) => Promise<number>;
    },
    opts: ListOptions,
    searchFields: string[] = [],
    include?: Record<string, unknown>,
    defaultSort = 'createdAt',
  ): Promise<ListResult<T>> {
    const { skip, take } = buildPrismaPage(opts);
    const where = this.buildWhere(opts, searchFields);
    const orderBy = buildOrderBy(opts, defaultSort);
    const [data, total] = await Promise.all([
      delegate.findMany({ where, skip, take, orderBy, ...(include ? { include } : {}) }),
      delegate.count({ where }),
    ]);
    return paginate(data, total, opts);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Fire-and-forget audit log — never blocks the primary operation */
  protected audit(userId: string, action: string, details?: string, companyId?: string): void {
    this.auditLog
      .log(userId, action, details, companyId)
      .catch((err) => this.logger.warn(`Audit log failed: ${err?.message}`));
  }

  protected async sumField(
    delegate: {
      aggregate: (args: { where: Record<string, unknown>; _sum: Record<string, boolean> }) => Promise<{ _sum: Record<string, number | null> }>;
    },
    where: Record<string, unknown>,
    fields: string[],
  ): Promise<Record<string, number>> {
    const _sum = Object.fromEntries(fields.map((f) => [f, true]));
    const result = await delegate.aggregate({ where, _sum });
    return Object.fromEntries(fields.map((f) => [f, Number(result._sum[f] ?? 0)]));
  }

  protected async assertUnique(
    delegate: { findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown> },
    where: Record<string, unknown>,
    message = 'Record already exists',
  ): Promise<void> {
    const existing = await delegate.findFirst({ where });
    if (existing) throw new ConflictException(message);
  }

  protected toNum(v: unknown): number { return Number(v ?? 0); }
  protected round2(v: number): number { return Math.round(v * 100) / 100; }
}
