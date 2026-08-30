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
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "syncContract", {
    enumerable: true,
    get: function() {
        return syncContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _sync = require("../schemas/sync");
// ── Queue ─────────────────────────────────────────────────────────────────────
const queueContract = {
    stats: _contract.oc.input(_zod.z.object({})).output(_sync.SyncQueueStatsSchema),
    enqueue: _contract.oc.input(_sync.EnqueueOperationSchema).output(_sync.SyncQueueEntrySchema),
    clear: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.object({
        cleared: _zod.z.boolean(),
        companyId: _zod.z.string().optional()
    }))
};
// ── Engines ───────────────────────────────────────────────────────────────────
const enginesContract = {
    states: _contract.oc.input(_zod.z.object({})).output(_sync.EngineStatesSchema),
    reconcile: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        force: _zod.z.boolean().optional()
    })).output(_sync.ReconciliationResultSchema),
    setState: _contract.oc.input(_zod.z.object({
        engineId: _sync.ReconciliationEngineIdSchema,
        isConsistent: _zod.z.boolean()
    })).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Conflicts ─────────────────────────────────────────────────────────────────
const conflictsContract = {
    detect: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_sync.ConflictDetailSchema)),
    resolve: _contract.oc.input(_zod.z.object({
        id: _zod.z.string(),
        strategy: _sync.ConflictResolutionStrategySchema.optional()
    })).output(_sync.ConflictResolutionResultSchema)
};
// ── Devices ───────────────────────────────────────────────────────────────────
const devicesContract = {
    register: _contract.oc.input(_sync.RegisterDeviceSchema).output(_sync.DeviceRegistrationResultSchema),
    unregister: _contract.oc.input(_zod.z.object({
        deviceId: _zod.z.string()
    })).output(_zod.z.object({
        deviceId: _zod.z.string(),
        unregistered: _zod.z.boolean()
    }))
};
const syncContract = _contract.oc.router({
    queue: _contract.oc.router(queueContract),
    push: _contract.oc.input(_zod.z.object({})).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    pull: _contract.oc.input(_zod.z.object({})).output(_sync.PullResultSchema),
    cycle: _contract.oc.input(_zod.z.object({})).output(_sync.SyncCycleResultSchema),
    engines: _contract.oc.router(enginesContract),
    conflicts: _contract.oc.router(conflictsContract),
    devices: _contract.oc.router(devicesContract),
    capabilities: _contract.oc.input(_zod.z.object({})).output(_sync.OfflineCapabilitiesSchema)
});
