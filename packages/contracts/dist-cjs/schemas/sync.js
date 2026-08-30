/**
 * @ovds/contracts/schemas/sync
 *
 * Zod schemas for offline sync, queue management, conflict resolution,
 * engine reconciliation, and sector-level offline capabilities.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get ConflictDetailSchema () {
        return ConflictDetailSchema;
    },
    get ConflictResolutionResultSchema () {
        return ConflictResolutionResultSchema;
    },
    get ConflictResolutionStrategySchema () {
        return ConflictResolutionStrategySchema;
    },
    get DeviceRegistrationResultSchema () {
        return DeviceRegistrationResultSchema;
    },
    get EngineStatesSchema () {
        return EngineStatesSchema;
    },
    get EnqueueOperationSchema () {
        return EnqueueOperationSchema;
    },
    get OfflineCapabilitiesSchema () {
        return OfflineCapabilitiesSchema;
    },
    get PullResultSchema () {
        return PullResultSchema;
    },
    get ReconciliationEngineIdSchema () {
        return ReconciliationEngineIdSchema;
    },
    get ReconciliationResultSchema () {
        return ReconciliationResultSchema;
    },
    get RegisterDeviceSchema () {
        return RegisterDeviceSchema;
    },
    get SyncCycleResultSchema () {
        return SyncCycleResultSchema;
    },
    get SyncEntryStatusSchema () {
        return SyncEntryStatusSchema;
    },
    get SyncOperationTypeSchema () {
        return SyncOperationTypeSchema;
    },
    get SyncQueueEntrySchema () {
        return SyncQueueEntrySchema;
    },
    get SyncQueueStatsSchema () {
        return SyncQueueStatsSchema;
    }
});
const _zod = require("zod");
const SyncOperationTypeSchema = _zod.z.enum([
    'INVOICE_CREATE',
    'INVOICE_UPDATE',
    'INVOICE_SYNC',
    'BILL_CREATE',
    'BILL_UPDATE',
    'PAYMENT_RECORD',
    'SETTINGS_UPDATE',
    'COMPANY_SWITCH',
    'ENGINE_RECONCILE',
    'DEVICE_HEARTBEAT',
    'TAX_FILING_SYNC'
]);
const SyncEntryStatusSchema = _zod.z.enum([
    'PENDING',
    'SYNCING',
    'SYNCED',
    'CONFLICT',
    'FAILED',
    'CORRUPTED',
    'EXPIRED'
]);
const ReconciliationEngineIdSchema = _zod.z.enum([
    'legacy',
    'ovds',
    'unified'
]);
const ConflictResolutionStrategySchema = _zod.z.enum([
    'LAST_WRITE_WINS',
    'MANUAL',
    'CLOUD_WINS',
    'LOCAL_WINS'
]);
const SyncQueueEntrySchema = _zod.z.object({
    id: _zod.z.string(),
    operationType: SyncOperationTypeSchema,
    documentReference: _zod.z.string(),
    documentType: _zod.z.string().optional(),
    payload: _zod.z.unknown(),
    queuedAt: _zod.z.string(),
    syncedAt: _zod.z.string().optional(),
    status: SyncEntryStatusSchema,
    companyId: _zod.z.string().optional(),
    retryCount: _zod.z.number().int().nonnegative(),
    lastError: _zod.z.string().optional(),
    checksum: _zod.z.string().optional(),
    idempotencyKey: _zod.z.string(),
    engineSource: ReconciliationEngineIdSchema.optional(),
    expiresAt: _zod.z.string().optional()
});
const EnqueueOperationSchema = _zod.z.object({
    operationType: SyncOperationTypeSchema,
    documentReference: _zod.z.string(),
    documentType: _zod.z.string().optional(),
    payload: _zod.z.unknown(),
    companyId: _zod.z.string().optional(),
    idempotencyKey: _zod.z.string().optional(),
    engineSource: ReconciliationEngineIdSchema.optional(),
    ttlSeconds: _zod.z.number().int().positive().optional()
});
const SyncQueueStatsSchema = _zod.z.object({
    total: _zod.z.number().int().nonnegative(),
    pending: _zod.z.number().int().nonnegative(),
    syncing: _zod.z.number().int().nonnegative(),
    synced: _zod.z.number().int().nonnegative(),
    conflicts: _zod.z.number().int().nonnegative(),
    failed: _zod.z.number().int().nonnegative(),
    corrupted: _zod.z.number().int().nonnegative(),
    expired: _zod.z.number().int().nonnegative()
});
const SyncCycleResultSchema = _zod.z.object({
    localPushCompleted: _zod.z.boolean(),
    cloudPullCompleted: _zod.z.boolean(),
    reconciled: _zod.z.boolean(),
    syncDuration: _zod.z.number(),
    entriesProcessed: _zod.z.number().int(),
    conflictsDetected: _zod.z.number().int(),
    pushFailures: _zod.z.number().int(),
    pullUpdates: _zod.z.number().int()
});
const PullResultSchema = _zod.z.object({
    cloudPullCompleted: _zod.z.boolean(),
    updatesReceived: _zod.z.number().int()
});
const ConflictDetailSchema = _zod.z.object({
    entry: SyncQueueEntrySchema,
    localVersion: _zod.z.object({
        updatedAt: _zod.z.string(),
        checksum: _zod.z.string()
    }),
    cloudVersion: _zod.z.object({
        updatedAt: _zod.z.string(),
        checksum: _zod.z.string()
    }),
    detectedAt: _zod.z.string(),
    resolutionStrategy: ConflictResolutionStrategySchema
});
const ConflictResolutionResultSchema = _zod.z.object({
    winningVersion: _zod.z.object({
        id: _zod.z.string(),
        documentReference: _zod.z.string(),
        updatedAt: _zod.z.string(),
        source: _zod.z.enum([
            'local',
            'cloud'
        ])
    }),
    conflictArtifactPreserved: _zod.z.boolean(),
    userNotified: _zod.z.boolean(),
    resolutionStrategy: ConflictResolutionStrategySchema
});
const ReconciliationResultSchema = _zod.z.object({
    reconciled: _zod.z.boolean(),
    localOnly: _zod.z.array(SyncQueueEntrySchema),
    cloudOnly: _zod.z.array(SyncQueueEntrySchema),
    conflicts: _zod.z.array(ConflictDetailSchema),
    summary: _zod.z.string(),
    engineStates: _zod.z.record(ReconciliationEngineIdSchema, _zod.z.object({
        lastSyncAt: _zod.z.string(),
        isConsistent: _zod.z.boolean()
    }))
});
const OfflineCapabilitiesSchema = _zod.z.object({
    canCreateInvoices: _zod.z.boolean(),
    canCreateBills: _zod.z.boolean(),
    canRecordPayments: _zod.z.boolean(),
    canSwitchCompany: _zod.z.boolean(),
    canRunReconciliation: _zod.z.boolean(),
    canFileTax: _zod.z.boolean(),
    maxQueueSize: _zod.z.number().int().positive(),
    supportedSectors: _zod.z.array(_zod.z.string()),
    requiresFiscalDevice: _zod.z.boolean()
});
const RegisterDeviceSchema = _zod.z.object({
    deviceId: _zod.z.string(),
    companyId: _zod.z.string(),
    sector: _zod.z.string().optional()
});
const DeviceRegistrationResultSchema = RegisterDeviceSchema.extend({
    registeredBy: _zod.z.string()
});
const EngineStatesSchema = _zod.z.record(ReconciliationEngineIdSchema, _zod.z.object({
    lastSyncAt: _zod.z.string(),
    isConsistent: _zod.z.boolean()
}));
