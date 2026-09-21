# 63 — Edge Computing and Distributed Systems

## 1. Edge Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Edge Computing Architecture                   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Edge      │  │   Sync      │  │   Global Load            │ │
│  │   Nodes     │  │   Protocol  │  │   Balancer               │ │
│  │             │  │             │  │                         │ │
│  │ - Local     │  │ - CRDT      │  │ - Geo-routing           │ │
│  │   Cache     │  │ - Merge     │  │ - Latency-based         │ │
│  │ - Offline   │  │ - Conflict  │  │ - Failover              │ │
│  │   Queue     │  │   Resolve   │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Distributed       │                        │
│                   │   State Manager     │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Edge Node Model

```typescript
// edge/edge-node.interface.ts
export interface EdgeNode {
  readonly id: string;
  readonly region: string;
  readonly location: string;
  readonly status: 'online' | 'offline' | 'syncing';
  readonly capabilities: EdgeCapabilities;
  readonly lastSync: Date;
  readonly queueDepth: number;
}

export interface EdgeCapabilities {
  readonly offlineMode: boolean;
  readonly localCache: boolean;
  readonly computeEnabled: boolean;
  readonly storageCapacity: number;
}

export interface EdgeSyncState {
  readonly nodeId: string;
  readonly lastSyncTimestamp: Date;
  readonly pendingChanges: ChangeSet[];
  readonly conflicts: Conflict[];
  readonly syncStatus: SyncStatus;
}
```

## 3. Conflict-free Replicated Data Types

```typescript
// edge/crdt/crdt.service.ts
@Injectable()
export class CRDTService {
  // LWW-Register (Last-Writer-Wins)
  mergeLWW(local: LWWRegister, remote: LWWRegister): LWWRegister {
    if (local.timestamp > remote.timestamp) {
      return local;
    } else if (remote.timestamp > local.timestamp) {
      return remote;
    } else {
      // Tie-breaking: higher node ID wins
      return local.nodeId > remote.nodeId ? local : remote;
    }
  }

  // OR-Set (Observed-Remove Set)
  mergeORSet(local: ORSet, remote: ORSet): ORSet {
    const added = new Set([...local.added, ...remote.added]);
    const removed = new Set([...local.removed, ...remote.removed]);

    // Remove any items that were removed in either set
    for (const item of removed) {
      added.delete(item);
    }

    return { added, removed };
  }

  // Counter CRDT
  mergeCounter(local: Counter, remote: Counter): Counter {
    return {
      value: local.value + remote.value,
      timestamp: Math.max(local.timestamp, remote.timestamp),
    };
  }
}
```

## 4. Sync Protocol

```typescript
// edge/sync/sync-protocol.service.ts
@Injectable()
export class SyncProtocolService {
  async sync(nodeId: string, since: Date): Promise<SyncResult> {
    const node = await this.getNode(nodeId);
    const changes = await this.getChangesSince(node.region, since);

    const batches = this.batchChanges(changes, 1000);

    for (const batch of batches) {
      await this.sendBatch(node, batch);
      await this.waitForAck(node, batch.id);
    }

    return {
      syncedAt: new Date(),
      changesProcessed: changes.length,
      conflicts: await this.resolveConflicts(nodeId),
    };
  }

  private async resolveConflicts(nodeId: string): Promise<Conflict[]> {
    const conflicts = await this.prisma.conflict.findMany({
      where: { nodeId, resolved: false },
    });

    for (const conflict of conflicts) {
      const resolution = await this.applyConflictResolution(conflict);
      conflict.resolution = resolution;
      conflict.resolved = true;
      conflict.resolvedAt = new Date();
      await this.prisma.conflict.update({
        where: { id: conflict.id },
        data: conflict,
      });
    }

    return conflicts;
  }
}
```

## 5. Offline Queue

```typescript
// edge/offline/offline-queue.service.ts
@Injectable()
export class OfflineQueueService {
  async enqueue(nodeId: string, operation: QueuedOperation): Promise<void> {
    await this.prisma.edgeQueue.create({
      data: {
        nodeId,
        operation: operation.type,
        payload: operation.payload,
        timestamp: new Date(),
        retries: 0,
      },
    });
  }

  async processQueue(nodeId: string): Promise<void> {
    const queue = await this.prisma.edgeQueue.findMany({
      where: { nodeId, processed: false },
      orderBy: { timestamp: 'asc' },
    });

    for (const item of queue) {
      try {
        await this.applyOperation(item);
        await this.prisma.edgeQueue.update({
          where: { id: item.id },
          data: { processed: true, processedAt: new Date() },
        });
      } catch (error) {
        await this.prisma.edgeQueue.update({
          where: { id: item.id },
          data: { retries: { increment: 1 } },
        });
      }
    }
  }
}
```

## 6. Geo-routing

```typescript
// edge/geo-routing/geo-router.service.ts
@Injectable()
export class GeoRouterService {
  async route(request: Request): Promise<EdgeNode> {
    const clientRegion = this.detectClientRegion(request);
    const latencyMap = await this.getLatencyMap(clientRegion);

    // Find closest node with capacity
    const nodes = await this.prisma.edgeNode.findMany({
      where: { status: 'online', region: clientRegion },
    });

    const sortedNodes = nodes.sort((a, b) => {
      const latencyA = latencyMap[a.region] || Infinity;
      const latencyB = latencyMap[b.region] || Infinity;
      return latencyA - latencyB;
    });

    return sortedNodes[0];
  }

  private detectClientRegion(request: Request): string {
    const ip = request.ip;
    const geoData = this.geoLookup.lookup(ip);
    return geoData.continent + '-' + geoData.country;
  }
}
```

## 7. Distributed State Manager

```typescript
// edge/distributed-state/distributed-state.service.ts
@Injectable()
export class DistributedStateService {
  private readonly state = new Map<string, any>();

  async get(key: string, nodeId: string): Promise<any> {
    // Try local cache first
    const local = this.state.get(key);
    if (local) return local;

    // Fetch from central store
    const central = await this.centralStore.get(key);
    this.state.set(key, central);

    return central;
  }

  async set(key: string, value: any, nodeId: string): Promise<void> {
    this.state.set(key, value);

    // Async replication to central store
    await this.centralStore.set(key, value);

    // Broadcast to other nodes
    await this.broadcastChange(nodeId, key, value);
  }

  async broadcastChange(sourceNodeId: string, key: string, value: any): Promise<void> {
    const nodes = await this.getOtherNodes(sourceNodeId);

    for (const node of nodes) {
      await this.sendChange(node, key, value);
    }
  }
}
```

## 8. Observability

```typescript
// edge/observability/edge-observability.service.ts
@Injectable()
export class EdgeObservabilityService {
  async collectMetrics(nodeId: string): Promise<EdgeMetrics> {
    return {
      nodeId,
      timestamp: new Date(),
      cpu: await this.getCpuUsage(),
      memory: await this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      network: await this.getNetworkStats(),
      queueDepth: await this.getQueueDepth(nodeId),
      syncLatency: await this.getSyncLatency(nodeId),
    };
  }

  async reportHealth(nodeId: string): Promise<HealthReport> {
    const metrics = await this.collectMetrics(nodeId);

    const health: HealthReport = {
      nodeId,
      status: 'healthy',
      issues: [],
    };

    if (metrics.cpu > 80) health.issues.push({ severity: 'warning', message: 'High CPU usage' });
    if (metrics.memory > 85) health.issues.push({ severity: 'warning', message: 'High memory usage' });
    if (metrics.queueDepth > 10000) health.issues.push({ severity: 'critical', message: 'Queue backlog' });

    health.status = health.issues.some((i) => i.severity === 'critical') ? 'unhealthy' : 'healthy';

    return health;
  }
}
```
