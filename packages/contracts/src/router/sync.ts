/**
 * @ovds/contracts — Offline Sync oRPC Router Contract
 *
 * Exposes the full offline sync / resilience surface:
 *   queue.*     — enqueue, stats, clear
 *   push        — push pending entries to cloud
 *   pull        — pull cloud updates and validate checksums
 *   cycle       — run full sync cycle (push + pull + reconcile)
 *   engines.*   — reconciliation engine state management
 *   conflicts.* — detect and resolve sync conflicts
 *   devices.*   — register / unregister offline-capable devices
 *   capabilities — query offline capabilities for a sector/company
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  SyncQueueEntrySchema,
  SyncQueueStatsSchema,
  SyncCycleResultSchema,
  PullResultSchema,
  ConflictDetailSchema,
  ConflictResolutionResultSchema,
  ReconciliationResultSchema,
  OfflineCapabilitiesSchema,
  RegisterDeviceSchema,
  DeviceRegistrationResultSchema,
  EngineStatesSchema,
  EnqueueOperationSchema,
  ConflictResolutionStrategySchema,
  ReconciliationEngineIdSchema,
} from '../schemas/sync';

// ── Queue ─────────────────────────────────────────────────────────────────────

const queueContract = {
  stats: oc
    .input(z.object({}))
    .output(SyncQueueStatsSchema),
  enqueue: oc
    .input(EnqueueOperationSchema)
    .output(SyncQueueEntrySchema),
  clear: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(z.object({ cleared: z.boolean(), companyId: z.string().optional() })),
};

// ── Engines ───────────────────────────────────────────────────────────────────

const enginesContract = {
  states: oc
    .input(z.object({}))
    .output(EngineStatesSchema),
  reconcile: oc
    .input(z.object({ companyId: z.string().optional(), force: z.boolean().optional() }))
    .output(ReconciliationResultSchema),
  setState: oc
    .input(z.object({ engineId: ReconciliationEngineIdSchema, isConsistent: z.boolean() }))
    .output(z.object({ success: z.boolean() })),
};

// ── Conflicts ─────────────────────────────────────────────────────────────────

const conflictsContract = {
  detect: oc
    .input(z.object({}))
    .output(z.array(ConflictDetailSchema)),
  resolve: oc
    .input(z.object({
      id: z.string(),
      strategy: ConflictResolutionStrategySchema.optional(),
    }))
    .output(ConflictResolutionResultSchema),
};

// ── Devices ───────────────────────────────────────────────────────────────────

const devicesContract = {
  register: oc
    .input(RegisterDeviceSchema)
    .output(DeviceRegistrationResultSchema),
  unregister: oc
    .input(z.object({ deviceId: z.string() }))
    .output(z.object({ deviceId: z.string(), unregistered: z.boolean() })),
};

// ── Root sync contract ────────────────────────────────────────────────────────

export const syncContract = oc.router({
  queue:        oc.router(queueContract),
  push:         oc.input(z.object({})).output(z.object({ success: z.boolean() })),
  pull:         oc.input(z.object({})).output(PullResultSchema),
  cycle:        oc.input(z.object({})).output(SyncCycleResultSchema),
  engines:      oc.router(enginesContract),
  conflicts:    oc.router(conflictsContract),
  devices:      oc.router(devicesContract),
  capabilities: oc.input(z.object({})).output(OfflineCapabilitiesSchema),
});

export type SyncContract = typeof syncContract;
