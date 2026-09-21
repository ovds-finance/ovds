# 30 — Compliance and Data Retention

## 1. Compliance Requirements

The system must comply with:

| Regulation | Scope | Key Requirements |
|-----------|-------|-----------------|
| GDPR | EU users | Data minimization, right to erasure, consent |
| VAT regulations | All users | Accurate records, retention periods, audit trails |
| SOC 2 | Enterprise | Access controls, logging, encryption |
| PCI DSS | Payments | Card data handling (if payments integrated) |
| Data residency | EU customers | EU-only data hosting option |

## 2. Data Retention Policies

```typescript
// compliance/retention.service.ts
@Injectable()
export class DataRetentionService {
  private readonly retentionPolicies: Record<string, number> = {
    AuditLog: 7 * 365, // 7 years
    VatReturn: 7 * 365, // 7 years (tax requirement)
    VatReturnHistory: 7 * 365,
    Transaction: 7 * 365,
    ImportJob: 90, // 90 days
    Report: 365, // 1 year
    Notification: 90, // 90 days
  };

  async applyRetentionPolicies(): Promise<void> {
    for (const [model, days] of Object.entries(this.retentionPolicies)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      await this.deleteExpiredRecords(model, cutoffDate);
    }
  }

  private async deleteExpiredRecords(model: string, cutoffDate: Date): Promise<void> {
    const modelRef = (this.prisma as any)[model.toLowerCase()];
    const result = await modelRef.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    this.logger.log(`Deleted ${result.count} ${model} records older than ${cutoffDate.toISOString()}`);
  }
}
```

## 3. GDPR Compliance

### 3.1 Right to Erasure

```typescript
// compliance/gdpr.service.ts
@Injectable()
export class GdprService {
  async deleteUserData(userId: string): Promise<void> {
    // 1. Anonymize user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.local`,
        firstName: 'Deleted',
        lastName: 'User',
        passwordHash: '',
        mfaSecret: '',
        avatarUrl: null,
        phone: null,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // 2. Delete refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    // 3. Delete sessions
    await this.prisma.session.deleteMany({ where: { userId } });

    // 4. Anonymize audit logs (keep for compliance but remove PII)
    await this.prisma.auditLog.updateMany({
      where: { userId },
      data: { userId: null },
    });

    // 5. Notify third parties if needed
    await this.notifyThirdParties(userId);
  }
}
```

### 3.2 Data Portability

```typescript
// compliance/portability.service.ts
@Injectable()
export class DataPortabilityService {
  async exportUserData(userId: string): Promise<Buffer> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const organizations = await this.organizationUserService.findByUser(userId);
    const transactions = await this.prisma.transaction.findMany({
      where: { organizationId: { in: organizations.map(o => o.organizationId) } },
    });

    const data = {
      user: this.sanitizeUser(user),
      organizations,
      transactions,
      exportedAt: new Date().toISOString(),
    };

    return Buffer.from(JSON.stringify(data, null, 2));
  }
}
```

## 4. Audit Trail Requirements

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  organizationId String
  userId        String?
  action        String
  subjectType   String
  subjectId     String
  changes       Json?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())

  @@index([organizationId, createdAt])
  @@index([action])
  @@index([subjectType, subjectId])
}
```

## 5. Immutable Audit Log

```typescript
// audit/immutable-audit.service.ts
@Injectable()
export class ImmutableAuditService {
  async log(params: AuditLogParams): Promise<AuditLog> {
    const log = await this.prisma.auditLog.create({
      data: {
        organizationId: TenantContext.getOrganizationId()!,
        userId: TenantContext.getUserId(),
        action: params.action,
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        changes: params.changes,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    // Write to immutable storage (e.g., append-only log, blockchain)
    await this.writeToImmutableStorage(log);

    return log;
  }
}
```

## 6. Change Tracking

```typescript
// audit/change-tracker.service.ts
@Injectable()
export class ChangeTrackerService {
  async trackChange(entity: string, entityId: string, before: any, after: any): Promise<void> {
    const changes = this.diff(before, after);
    if (Object.keys(changes).length === 0) return;

    await this.auditService.log({
      action: `${entity.toLowerCase()}.updated`,
      subjectType: entity,
      subjectId: entityId,
      changes,
      ipAddress: TenantContext.get('ipAddress'),
      userAgent: TenantContext.get('userAgent'),
    });
  }

  private diff(before: any, after: any): Record<string, any> {
    const changes: Record<string, any> = {};
    for (const key in after) {
      if (before[key] !== after[key]) {
        changes[key] = { before: before[key], after: after[key] };
      }
    }
    return changes;
  }
}
```

## 7. Access Logs

```typescript
// audit/access-log.service.ts
@Injectable()
export class AccessLogService {
  async logAccess(params: AccessLogParams): Promise<void> {
    await this.prisma.accessLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        accessedAt: new Date(),
      },
    });
  }
}
```

## 8. Retention Scheduler

```typescript
// compliance/scheduler.service.ts
@Injectable()
export class ComplianceScheduler {
  constructor(
    private readonly dataRetentionService: DataRetentionService,
    private readonly backupService: BackupService,
  ) {}

  @Cron('0 2 * * 0') // Weekly on Sunday at 2 AM
  async applyRetentionPolicies() {
    await this.dataRetentionService.applyRetentionPolicies();
  }

  @Cron('0 3 * * 0') // Weekly on Sunday at 3 AM
  async verifyBackupIntegrity() {
    await this.backupService.verifyIntegrity();
  }
}
```

## 9. Data Classification

| Classification | Examples | Retention | Encryption |
|---------------|---------|-----------|------------|
| Public | Product names, marketing | Indefinite | None |
| Internal | API docs, internal notes | 3 years | At rest |
| Confidential | User data, transactions | 7 years | At rest + in transit |
| Restricted | API keys, passwords, MFA | Until deleted | Always encrypted |

## 10. Compliance Reporting

```typescript
// compliance/reporting.service.ts
@Injectable()
export class ComplianceReportingService {
  async generateAuditReport(orgId: string, from: Date, to: Date): Promise<Buffer> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: 'asc' },
    });

    const report = {
      organizationId: orgId,
      period: { from, to },
      generatedAt: new Date(),
      totalActions: logs.length,
      actions: logs.map((log) => ({
        timestamp: log.createdAt,
        user: log.userId,
        action: log.action,
        subject: `${log.subjectType}:${log.subjectId}`,
        changes: log.changes,
      })),
    };

    return Buffer.from(JSON.stringify(report, null, 2));
  }
}
```

## 11. GDPR Data Subject Request

```typescript
// compliance/dsr.service.ts
@Injectable()
export class DataSubjectRequestService {
  async processRequest(request: DataSubjectRequest): Promise<void> {
    switch (request.type) {
      case 'access':
        await this.provideDataAccess(request);
        break;
      case 'erasure':
        await this.eraseData(request);
        break;
      case 'portability':
        await this.provideDataPortability(request);
        break;
      case 'rectification':
        await this.rectifyData(request);
        break;
    }

    await this.auditService.log({
      action: 'gdpr.request_processed',
      subjectType: 'DataSubjectRequest',
      subjectId: request.id,
      changes: { type: request.type, userId: request.userId },
    });
  }
}
```

## 12. Consent Management

```typescript
// compliance/consent.service.ts
export interface Consent {
  id: string;
  userId: string;
  purpose: string; // "marketing", "analytics", "data_processing"
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  ipAddress: string;
}

@Injectable()
export class ConsentService {
  async recordConsent(userId: string, purpose: string, granted: boolean, ipAddress: string): Promise<Consent> {
    return this.prisma.consent.create({
      data: {
        userId,
        purpose,
        granted,
        grantedAt: granted ? new Date() : undefined,
        revokedAt: granted ? undefined : new Date(),
        ipAddress,
      },
    });
  }

  async hasConsent(userId: string, purpose: string): Promise<boolean> {
    const consent = await this.prisma.consent.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (!consent) return false;
    return consent.granted && !consent.revokedAt;
  }
}
```
