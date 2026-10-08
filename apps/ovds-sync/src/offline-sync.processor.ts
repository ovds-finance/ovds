import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Decimal from 'decimal.js';
import { createHash } from 'node:crypto';

import { PRISMA_CLIENT, type PrismaServiceLike } from '@ovds/ledger';
import type { M2mPrincipal } from '@ovds/shared-domains/infra';
import { LedgerEngineService, JournalPayload, EntryType, TransactionType } from '@ovds/ledger';

export interface OfflineSyncBatch {
  tenantId: string;
  referenceNumber: string;
  type: string;
  narration: string;
  /// Client-generated UUID for exactly-once processing across retries
  idempotencyKey?: string;
  /// Hardware-bound device identifier for audit trail
  deviceFingerprint?: string;
  /// Vector clock for conflict detection across offline edits
  vectorClock?: Record<string, number>;
  lines: Array<{
    accountId: string;
    debit?: number | string;
    credit?: number | string;
    vatAmount?: number | string;
    description?: string;
  }>;
}

/** Maximum journal lines accepted in one offline batch. */
const MAX_BATCH_LINES = 500;

type BatchStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

/**
 * OfflineSyncProcessor
 *
 * Scans the `offline_sync_log` table for pending sync batches uploaded by
 * hybrid (OFFLINE_HYBRID) taxpayers, then posts each batch as a balanced
 * JournalTransaction via LedgerEngineService.
 *
 * Runs as:
 *  - An HTTP server with a /sync endpoint and scheduled batch processing
 *  - A Redis-worker microservice that processes RMQ jobs for high-volume loads
 */
@Injectable()
export class OfflineSyncProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OfflineSyncProcessor.name);

  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaServiceLike) {}

  onModuleInit(): void {
    this.logger.log('OfflineSyncProcessor initialized');
  }

  onModuleDestroy(): void {
    this.logger.log('OfflineSyncProcessor shutdown');
  }

  /**
   * POST endpoint: Accept a single offline batch upload from a hybrid taxpayer.
   *
   * The batch is validated for double-entry balance, de-duplicated against the
   * tenant's own prior submissions, then stored as an OfflineSyncLog entry for
   * asynchronous processing.
   *
   * @param batch     Body, with `tenantId` already pinned by the auth guard.
   * @param principal The authenticated machine caller.
   */
  async submitBatch(
    batch: OfflineSyncBatch,
    principal: M2mPrincipal,
  ): Promise<{ batchId: string; status: string }> {
    this.assertBalanced(batch);
    this.assertScopedToKey(batch, principal);

    const payloadHash = this.computePayloadHash(batch);

    // Idempotency: a terminal that loses its uplink retries the same batch
    // verbatim. Without this check the retry creates a second log entry for the
    // same fiscal period and the ledger is posted twice.
    const existing = await this.prisma.offlineSyncLog?.findFirst?.({
      where: { tenantId: principal.tenantId, payloadHash, syncStatus: { not: 'FAILED' } },
      select: { batchId: true, syncStatus: true },
    });

    if (existing) {
      this.logger.log(
        `Duplicate offline batch ${existing.batchId} for tenant ${principal.tenantId} (hash ${payloadHash.slice(0, 12)}) — not re-queued`,
      );
      return { batchId: existing.batchId, status: 'duplicate' };
    }

    const batchId = this.buildBatchId();

    const logEntry = await this.prisma.offlineSyncLog?.create?.({
      data: {
        tenantId: principal.tenantId,
        batchId,
        payloadHash,
        processedCount: batch.lines.length,
        syncStatus: 'PENDING',
        payload: batch as unknown as object,
        syncedAt: new Date(),
      },
    });

    this.logger.log(
      `Offline sync batch ${batchId} received for tenant ${principal.tenantId} — ${batch.lines.length} lines, hash ${payloadHash.slice(0, 12)}`,
    );

    return { batchId: logEntry?.batchId ?? batchId, status: 'received' };
  }

  /**
   * Scheduled job: process pending offline sync batches.
   * Runs every 5 minutes via @nestjs/schedule.
   *
   * @param tenantId Restrict to one tenant. The HTTP flush endpoint always
   *                 passes the caller's tenant so a single terminal key can
   *                 never drain the whole platform's backlog.
   */
  @Cron('*/5 * * * *')
  async processPendingBatches(
    tenantId?: string,
  ): Promise<{ processed: number; errors: number }> {
    const batches = await this.prisma.offlineSyncLog?.findMany?.({
      where: { syncStatus: 'PENDING', ...(tenantId ? { tenantId } : {}) },
      take: 100,
      orderBy: { syncedAt: 'asc' },
    });

    let processed = 0;
    let errors = 0;

    if (!batches || batches.length === 0) {
      return { processed: 0, errors: 0 };
    }

    for (const batch of batches) {
      try {
        await this.processBatch(batch);
        processed++;
      } catch (error) {
        errors++;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to process sync batch ${batch.batchId}: ${message}`,
        );
        await this.prisma.offlineSyncLog?.update?.({
          where: { id: batch.id },
          data: { syncStatus: 'FAILED', syncErrors: message, processedAt: new Date() },
        });
      }
    }

    this.logger.log(`Sync batch processing complete: ${processed} succeeded, ${errors} failed`);
    return { processed, errors };
  }

  /**
   * Posts one batch to the ledger.
   *
   * NOTE: this deliberately does NOT mark a batch PROCESSED unless a journal
   * entry was actually written. The previous implementation set
   * `syncErrors = 'Processed — batch payload applied to journal transaction'`
   * without touching the ledger, so a fiscal period reported as synced in the
   * taxpayer's ledger was in fact never posted — the exact class of silent
   * discrepancy that becomes an ERCA assessment liability.
   *
   * Until the ledger posting step is wired to `LedgerEngineService`, an
   * unbatched payload fails loudly here rather than being reported as done.
   */
  private async processBatch(logEntry: {
    id: string;
    batchId: string;
    tenantId: string;
    payload: unknown;
  }): Promise<void> {
    const batch = logEntry.payload as OfflineSyncBatch | null | undefined;

    if (!batch?.lines?.length) {
      throw new Error('Batch payload is missing or empty; cannot post to the ledger');
    }

    throw new Error(
      `Ledger posting is not yet wired for batch ${logEntry.batchId} (tenant ${logEntry.tenantId}, ${batch.lines.length} lines). ` +
        'The batch is retained with syncStatus=FAILED so it can be replayed once ' +
        'OfflineSyncProcessor is connected to LedgerEngineService.',
    );
  }

  /**
   * Rejects a batch that does not balance.
   *
   * The ledger is double-entry: `sum(debit) == sum(credit)` must hold for every
   * transaction or the general ledger stops being a general ledger. Accepting
   * an unbalanced batch here means the defect surfaces later as an unexplained
   * trial-balance gap during a VAT filing.
   */
  private assertBalanced(batch: OfflineSyncBatch): void {
    const lines = batch?.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new BadRequestException('Batch must contain at least one journal line.');
    }
    if (lines.length > MAX_BATCH_LINES) {
      throw new BadRequestException(
        `Batch exceeds the ${MAX_BATCH_LINES}-line limit (received ${lines.length}).`,
      );
    }

    let debits = new Decimal(0);
    let credits = new Decimal(0);

    lines.forEach((line, index) => {
      if (!line?.accountId) {
        throw new BadRequestException(`Line ${index + 1}: accountId is required.`);
      }

      const debit = this.toDecimal(line.debit, `Line ${index + 1}: debit`);
      const credit = this.toDecimal(line.credit, `Line ${index + 1}: credit`);

      if (debit.isNegative() || credit.isNegative()) {
        throw new BadRequestException(
          `Line ${index + 1}: debit and credit must not be negative.`,
        );
      }
      if (debit.isZero() && credit.isZero()) {
        throw new BadRequestException(
          `Line ${index + 1}: must carry either a debit or a credit amount.`,
        );
      }
      if (!debit.isZero() && !credit.isZero()) {
        throw new BadRequestException(
          `Line ${index + 1}: carries both a debit and a credit; use two lines instead.`,
        );
      }

      debits = debits.plus(debit);
      credits = credits.plus(credit);
    });

    if (!debits.equals(credits)) {
      throw new BadRequestException(
        `Batch is not double-entry balanced: debits ${debits.toFixed(2)} do not equal credits ${credits.toFixed(2)}.`,
      );
    }
  }

  /**
   * Defence in depth against cross-tenant writes. The controller already pins
   * `tenantId` from the API key; this re-checks after the fact so a future
   * caller that forgets to pin it fails closed instead of posting into another
   * taxpayer's ledger.
   */
  private assertScopedToKey(batch: OfflineSyncBatch, principal: M2mPrincipal): void {
    if (!principal?.tenantId) {
      throw new BadRequestException('Machine tenant context is unavailable.');
    }
    if (batch.tenantId && batch.tenantId !== principal.tenantId) {
      throw new BadRequestException(
        'Batch tenant does not match the authenticated API key tenant.',
      );
    }
  }

  private toDecimal(value: number | string | undefined | null, label: string): Decimal {
    if (value === undefined || value === null || value === '') return new Decimal(0);
    try {
      return new Decimal(value);
    } catch {
      throw new BadRequestException(`${label} is not a valid decimal amount.`);
    }
  }

  private buildBatchId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * SHA-256 (hex) of the canonical batch payload.
   *
   * The previous implementation was a 32-bit djb2-style accumulator printed in
   * base36 — roughly four billion distinct values. It was stored in
   * `offline_sync_log.payloadHash`, which the blueprint designates as the
   * "SHA-256 validation of the modification payload", and which this service
   * now also uses for batch de-duplication. At that width, unrelated batches
   * collide routinely, so a genuine new batch would be discarded as a duplicate
   * and a fiscal period would go unposted.
   */
  private computePayloadHash(batch: OfflineSyncBatch): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          referenceNumber: batch.referenceNumber,
          type: batch.type,
          narration: batch.narration,
          lines: batch.lines,
        }),
        'utf8',
      )
      .digest('hex');
  }
}
