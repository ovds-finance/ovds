// apps/shared-domains/infra/src/lifecycle/connection-pool-manager.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

interface ManagedClient { client: PrismaClient; lastAccessed: number; }

@Injectable()
export class ConnectionPoolManager implements OnModuleDestroy {
  private activePools = new Map<string, ManagedClient>();
  private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000;

  constructor() { setInterval(() => this.reclaimIdleConnections(), 5 * 60 * 1000); }

  async getClientForTenant(tenantId: string, dsn: string): Promise<PrismaClient> {
    const existing = this.activePools.get(tenantId);
    if (existing) { existing.lastAccessed = Date.now(); return existing.client; }
    const client = new PrismaClient();
    await client.$connect();
    this.activePools.set(tenantId, { client, lastAccessed: Date.now() });
    return client;
  }

  private async reclaimIdleConnections() {
    const now = Date.now();
    for (const [tenantId, managed] of this.activePools.entries()) {
      if (now - managed.lastAccessed > this.IDLE_TIMEOUT_MS) {
        await managed.client.$disconnect();
        this.activePools.delete(tenantId);
      }
    }
  }

  async onModuleDestroy() {
    for (const [, managed] of this.activePools.entries()) { await managed.client.$disconnect(); }
    this.activePools.clear();
  }
}