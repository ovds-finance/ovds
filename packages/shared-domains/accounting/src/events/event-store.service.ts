// apps/shared-domains/accounting/src/events/event-store.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import { createTenantClient } from '@ovds/shared-domains-infra';

export interface LedgerEventEnvelope { eventType: string; tenantId: string; aggregateId: string; payload: any; actorId: string; }

@Injectable()
export class EventStoreService {
  private readonly basePrisma = new PrismaClient();

  async appendEvent(envelope: LedgerEventEnvelope): Promise<void> {
    const tenant = await this.basePrisma.tenant.findUnique({ where: { id: envelope.tenantId }, select: { subdomain: true } });
    if (!tenant) throw new BadRequestException(`Tenant [${envelope.tenantId}] not found`);
    const prisma = createTenantClient(new PrismaClient(), { tenantId: envelope.tenantId, subdomain: tenant.subdomain });
    try {
      await (prisma as any).ledgerEventStream.create({ data: { tenantId: envelope.tenantId, eventType: envelope.eventType, aggregateId: envelope.aggregateId, eventPayload: JSON.stringify(envelope.payload), recordedBy: envelope.actorId, timestamp: new Date() } });
    } catch (fault: any) { throw new BadRequestException(`Event commit failed: ${fault.message}`); }
  }

  async getEventStream(tenantId: string, aggregateId: string): Promise<any[]> {
    const tenant = await this.basePrisma.tenant.findUnique({ where: { id: tenantId }, select: { subdomain: true } });
    if (!tenant) throw new BadRequestException(`Tenant [${tenantId}] not found`);
    const prisma = createTenantClient(new PrismaClient(), { tenantId, subdomain: tenant.subdomain });
    return await (prisma as any).ledgerEventStream.findMany({ where: { tenantId, aggregateId }, orderBy: { timestamp: 'asc' } });
  }
}
