import { Injectable, Logger } from '@nestjs/common';
import { IAuditLogger } from '@ovds/domains/infrastructure';

@Injectable()
export class AuditLogService implements IAuditLogger {
  private readonly logger = new Logger(AuditLogService.name);

  async log(userId: string, action: string, details?: string, companyId?: string): Promise<void> {
    this.logger.debug(`AUDIT [${companyId ?? 'system'}] user=${userId} action=${action} details=${details ?? ''}`);
  }
}
