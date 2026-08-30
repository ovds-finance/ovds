/**
 * @ovds/contracts/schemas/sync
 *
 * Zod schemas for offline sync, queue management, conflict resolution,
 * engine reconciliation, and sector-level offline capabilities.
 */
import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const SyncOperationTypeSchema = z.enum([
  'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_SYNC',
  'BILL_CREATE', 'BILL_UPDATE',
  'PAYMENT_RECORD',
  'SETTINGS_UPDATE',
  'COMPANY_SWITCH',
  'ENGINE_RECONCILE',
  'DEVICE_HEARTBEAT',
  'TAX_FILING_SYNC',
]);

export const SyncEntryStatusSchema = z.enum([
  'PENDING', 'SYNCING', 'SYNCED', 'CONFLICT', 'FAILED', 'CORRUPTED', 'EXPIRED',
]);

export const ReconciliationEngineIdSchema = z.enum(['legacy', 'ovds', 'unified']);

export const ConflictResolutionStrategySchema = z.enum([
  'LAST_WRITE_WINS', 'MANUAL', 'CLOUD_WINS', 'LOCAL_WINS',
]);

// ── Queue Entry ───────────────────────────────────────────────────────────────

export const SyncQueueEntrySchema = z.object({
  id: z.string(),
  operationType: SyncOperationTypeSchema,
  documentReference: z.string(),
  documentType: z.string().optional(),
  payload: z.unknown(),
  queuedAt: z.string(),
  syncedAt: z.string().optional(),
  status: SyncEntryStatusSchema,
  companyId: z.string().optional(),
  retryCount: z.number().int().nonnegative(),
  lastError: z.string().optional(),
  checksum: z.string().optional(),
  idempotencyKey: z.string(),
  engineSource: ReconciliationEngineIdSchema.optional(),
  expiresAt: z.string().optional(),
});

export const EnqueueOperationSchema = z.object({
  operationType: SyncOperationTypeSchema,
  documentReference: z.string(),
  documentType: z.string().optional(),
  payload: z.unknown(),
  companyId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  engineSource: ReconciliationEngineIdSchema.optional(),
  ttlSeconds: z.number().int().positive().optional(),
});

// ── Queue Stats ───────────────────────────────────────────────────────────────

export const SyncQueueStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  syncing: z.number().int().nonnegative(),
  synced: z.number().int().nonnegative(),
  conflicts: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  corrupted: z.number().int().nonnegative(),
  expired: z.number().int().nonnegative(),
});

// ── Sync Cycle Result ─────────────────────────────────────────────────────────

export const SyncCycleResultSchema = z.object({
  localPushCompleted: z.boolean(),
  cloudPullCompleted: z.boolean(),
  reconciled: z.boolean(),
  syncDuration: z.number(),
  entriesProcessed: z.number().int(),
  conflictsDetected: z.number().int(),
  pushFailures: z.number().int(),
  pullUpdates: z.number().int(),
});

// ── Pull Result ───────────────────────────────────────────────────────────────

export const PullResultSchema = z.object({
  cloudPullCompleted: z.boolean(),
  updatesReceived: z.number().int(),
});

// ── Conflict ──────────────────────────────────────────────────────────────────

export const ConflictDetailSchema = z.object({
  entry: SyncQueueEntrySchema,
  localVersion: z.object({ updatedAt: z.string(), checksum: z.string() }),
  cloudVersion: z.object({ updatedAt: z.string(), checksum: z.string() }),
  detectedAt: z.string(),
  resolutionStrategy: ConflictResolutionStrategySchema,
});

export const ConflictResolutionResultSchema = z.object({
  winningVersion: z.object({
    id: z.string(),
    documentReference: z.string(),
    updatedAt: z.string(),
    source: z.enum(['local', 'cloud']),
  }),
  conflictArtifactPreserved: z.boolean(),
  userNotified: z.boolean(),
  resolutionStrategy: ConflictResolutionStrategySchema,
});

// ── Reconciliation ────────────────────────────────────────────────────────────

export const ReconciliationResultSchema = z.object({
  reconciled: z.boolean(),
  localOnly: z.array(SyncQueueEntrySchema),
  cloudOnly: z.array(SyncQueueEntrySchema),
  conflicts: z.array(ConflictDetailSchema),
  summary: z.string(),
  engineStates: z.record(
    ReconciliationEngineIdSchema,
    z.object({ lastSyncAt: z.string(), isConsistent: z.boolean() }),
  ),
});

// ── Offline Capabilities ──────────────────────────────────────────────────────

export const OfflineCapabilitiesSchema = z.object({
  canCreateInvoices: z.boolean(),
  canCreateBills: z.boolean(),
  canRecordPayments: z.boolean(),
  canSwitchCompany: z.boolean(),
  canRunReconciliation: z.boolean(),
  canFileTax: z.boolean(),
  maxQueueSize: z.number().int().positive(),
  supportedSectors: z.array(z.string()),
  requiresFiscalDevice: z.boolean(),
});

// ── Device ────────────────────────────────────────────────────────────────────

export const RegisterDeviceSchema = z.object({
  deviceId: z.string(),
  companyId: z.string(),
  sector: z.string().optional(),
});

export const DeviceRegistrationResultSchema = RegisterDeviceSchema.extend({
  registeredBy: z.string(),
});

// ── Engine State ──────────────────────────────────────────────────────────────

export const EngineStatesSchema = z.record(
  ReconciliationEngineIdSchema,
  z.object({ lastSyncAt: z.string(), isConsistent: z.boolean() }),
);
