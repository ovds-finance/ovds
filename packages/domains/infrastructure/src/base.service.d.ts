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
import { Logger } from '@nestjs/common';
import { PaginatedResult } from '@ovds/shared';
import { PaginationQueryDto } from '@ovds/dto';
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
export interface IPrismaClient {
    $transaction: {
        (fn: (tx: any) => Promise<any>, opts?: any): Promise<any>;
        (operations: any[], opts?: any): Promise<any[]>;
    };
    [model: string]: any;
}
export declare abstract class BaseService {
    protected readonly prisma: IPrismaClient;
    protected readonly auditLog: IAuditLogger;
    protected readonly logger: Logger;
    constructor(prisma: IPrismaClient, auditLog: IAuditLogger, serviceName: string);
    protected buildWhere(opts: {
        companyId?: string;
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        dateField?: string;
        extra?: Record<string, unknown>;
    }, searchFields?: string[]): Record<string, unknown>;
    protected findOrThrow<T>(delegate: {
        findFirst: (args: {
            where: Record<string, unknown>;
            include?: Record<string, unknown>;
        }) => Promise<T | null>;
    }, id: string, companyId?: string, include?: Record<string, unknown>, resourceName?: string): Promise<T>;
    protected paginatedList<T>(delegate: {
        findMany: (args: {
            where: Record<string, unknown>;
            skip: number;
            take: number;
            orderBy: Record<string, string>;
            include?: Record<string, unknown>;
        }) => Promise<T[]>;
        count: (args: {
            where: Record<string, unknown>;
        }) => Promise<number>;
    }, opts: ListOptions, searchFields?: string[], include?: Record<string, unknown>, defaultSort?: string): Promise<ListResult<T>>;
    /** Fire-and-forget audit log — never blocks the primary operation */
    protected audit(userId: string, action: string, details?: string, companyId?: string): void;
    protected sumField(delegate: {
        aggregate: (args: {
            where: Record<string, unknown>;
            _sum: Record<string, boolean>;
        }) => Promise<{
            _sum: Record<string, number | null>;
        }>;
    }, where: Record<string, unknown>, fields: string[]): Promise<Record<string, number>>;
    protected assertUnique(delegate: {
        findFirst: (args: {
            where: Record<string, unknown>;
        }) => Promise<unknown>;
    }, where: Record<string, unknown>, message?: string): Promise<void>;
    protected toNum(v: unknown): number;
    protected round2(v: number): number;
}
//# sourceMappingURL=base.service.d.ts.map