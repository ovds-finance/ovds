import { Injectable, Logger, Optional } from '@nestjs/common';
import { IAuditLogger } from '@ovds/domains-infrastructure';

import { PrismaService } from '../common/prisma.service';

/**
 * AuditLogService
 *
 * Persists audit log entries to the database via Prisma.
 *
 * The `audit()` helper on BaseService uses this interface, so every
 * `this.audit(userId, action, details, companyId)` call across the
 * codebase will now create a durable record in the `auditLog` table.
 *
 * If Prisma persistence fails (e.g. DB down), the error is swallowed
 * and the entry is logged to the NestJS logger as a fallback — audit
 * logging must never break the primary operation.
 */
@Injectable()
export class AuditLogService implements IAuditLogger {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async log(userId: string, action: string, details?: string, companyId?: string): Promise<void> {
    const entry = {
      userId: userId || null,
      action: action || 'UNKNOWN',
      details: details || null,
      companyId: companyId || null,
      createdAt: new Date(),
    };

    if (!this.prisma) {
      this.logger.debug(`AUDIT [${companyId ?? 'system'}] user=${userId} action=${action} details=${details ?? ''}`);
      return;
    }

    try {
      await (this.prisma as any).auditLog.create({
        data: entry,
        select: { id: true },
      });
    } catch (err: any) {
      this.logger.warn(`Audit log persistence failed: ${err.message}`);
      this.logger.debug(`AUDIT [${companyId ?? 'system'}] user=${userId} action=${action} details=${details ?? ''}`);
    }
  }
}
