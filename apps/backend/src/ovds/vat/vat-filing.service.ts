/**
 * @file vat-filing.service.ts
 * @module OvdsVatModule
 *
 * VatFilingService
 * ────────────────
 * The single source of truth for ALL VAT filing record persistence.
 * Owns the full lifecycle of a VatFilingRecord from DRAFT through SUBMITTED,
 * ACCEPTED / REJECTED, and AMENDED.
 *
 * Filing state machine:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │                                                         │
 *   │   DRAFT ──► PENDING_REVIEW ──► SUBMITTED ──► ACCEPTED  │
 *   │     │                │                  └──► REJECTED  │
 *   │     │                │                       │         │
 *   │     └────────────────┴──── (amend) ──► DRAFT │         │
 *   │                                              │         │
 *   └──────────────────────────────────────────────┘         │
 *
 * Design decisions:
 *  • Once a filing reaches SUBMITTED, it becomes immutable — amendments
 *    create a NEW VatFilingRecord with `amendmentOf = originalId`.
 *  • Every status transition appends a VatFilingEvent (audit trail).
 *  • Rendered report artifacts are tracked in VatReportArtifact.
 *  • All DB operations are scoped by `tenantId` — no cross-tenant leakage.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 }   from '@nestjs/event-emitter';

import { PrismaService }   from '../../common/prisma.service';

import type {
  SaveFilingDto,
  ListFilingsDto,
  SubmitFilingDto,
  AmendFilingDto,
  RecordAckDto,
  VatFilingStatus,
} from './dto/vat-declaration.dto';

// ─── Public return shapes ─────────────────────────────────────────────────────

export interface FilingRecord {
  id:              string;
  tenantId:        string;
  countryCode:     string;
  periodKey:       string;
  status:          VatFilingStatus;
  currency:        string;
  outputVat:       number;
  inputVat:        number;
  netVatPayable:   number;
  returnDraft:     Record<string, unknown>;
  complianceResult?: Record<string, unknown> | null;
  submittedAt?:    string | null;
  submittedBy?:    string | null;
  ackNumber?:      string | null;
  ackReceivedAt?:  string | null;
  ackPayload?:     Record<string, unknown> | null;
  dueDate?:        string | null;
  amendmentOf?:    string | null;
  notes?:          string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface FilingListResult {
  data:  FilingRecord[];
  total: number;
  page:  number;
  limit: number;
}

export interface FilingEventRecord {
  id:         string;
  filingId:   string;
  tenantId:   string;
  eventType:  string;
  fromStatus: string | null;
  toStatus:   string;
  actorId?:   string | null;
  payload?:   Record<string, unknown> | null;
  occurredAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class VatFilingService {
  private readonly logger = new Logger(VatFilingService.name);

  constructor(
    private readonly prisma:       PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Save / upsert a DRAFT ─────────────────────────────────────────────────

  /**
   * Persist or update a VAT return draft.
   *
   * Idempotent: if a DRAFT already exists for (tenantId, countryCode, periodKey)
   * it is updated.  If the existing record is NOT a DRAFT (i.e. it has already
   * been submitted), a ConflictException is thrown — use amend() instead.
   */
  async saveDraft(
    tenantId: string,
    dto:      SaveFilingDto,
    actorId:  string,
  ): Promise<FilingRecord> {
    const existing = await this.findExistingDraft(tenantId, dto.countryCode, dto.periodKey);

    if (existing && existing.status !== 'DRAFT') {
      throw new ConflictException(
        `Filing for ${dto.countryCode}/${dto.periodKey} is already in status ` +
        `"${existing.status}". Use POST /vat/filings/:id/amend to create an amendment.`,
      );
    }

    const returnDraftJson  = JSON.stringify(dto.returnDraft);
    const complianceJson   = dto.complianceResult ? JSON.stringify(dto.complianceResult) : null;
    const dueDateValue     = dto.dueDate ? new Date(dto.dueDate) : null;

    let record: any;

    if (existing) {
      // Update the existing DRAFT
      record = await (this.prisma as any).vatFilingRecord.update({
        where: { id: existing.id },
        data: {
          currency:       dto.currency,
          outputVat:      dto.outputVat,
          inputVat:       dto.inputVat,
          netVatPayable:  dto.netVatPayable,
          returnDraftJson,
          complianceJson,
          dueDate:        dueDateValue,
          notes:          dto.notes ?? null,
          updatedAt:      new Date(),
        },
      });

      await this.appendEvent(record.id, tenantId, 'UPDATED', 'DRAFT', 'DRAFT', actorId);
    } else {
      // Create a new DRAFT
      record = await (this.prisma as any).vatFilingRecord.create({
        data: {
          tenantId,
          countryCode:    dto.countryCode,
          periodKey:      dto.periodKey,
          status:         'DRAFT',
          currency:       dto.currency,
          outputVat:      dto.outputVat,
          inputVat:       dto.inputVat,
          netVatPayable:  dto.netVatPayable,
          returnDraftJson,
          complianceJson,
          dueDate:        dueDateValue,
          notes:          dto.notes ?? null,
        },
      });

      await this.appendEvent(record.id, tenantId, 'CREATED', null, 'DRAFT', actorId);
    }

    this.eventEmitter.emit('vat.filing.saved', {
      filingId:    record.id,
      tenantId,
      countryCode: dto.countryCode,
      periodKey:   dto.periodKey,
      status:      'DRAFT',
    });

    this.logger.log(
      `Filing ${record.id} saved as DRAFT — ${dto.countryCode}/${dto.periodKey} for tenant ${tenantId}`,
    );

    return this.toFilingRecord(record);
  }

  // ── List filings ──────────────────────────────────────────────────────────

  async listFilings(tenantId: string, dto: ListFilingsDto): Promise<FilingListResult> {
    const where: Record<string, unknown> = { tenantId };

    if (dto.countryCode) where['countryCode'] = dto.countryCode;
    if (dto.status)      where['status']      = dto.status;

    // Year filter — match periodKey prefix YYYY-* or YYYY
    if (dto.year) {
      where['periodKey'] = { startsWith: String(dto.year) };
    }

    const skip  = (dto.page - 1) * dto.limit;

    const [records, total] = await Promise.all([
      (this.prisma as any).vatFilingRecord.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: dto.limit,
      }),
      (this.prisma as any).vatFilingRecord.count({ where }),
    ]);

    return {
      data:  records.map((r: any) => this.toFilingRecord(r)),
      total,
      page:  dto.page,
      limit: dto.limit,
    };
  }

  // ── Get single filing ─────────────────────────────────────────────────────

  async getFiling(tenantId: string, id: string): Promise<FilingRecord> {
    const record = await (this.prisma as any).vatFilingRecord.findFirst({
      where: { id, tenantId },
    });

    if (!record) {
      throw new NotFoundException(`VAT filing "${id}" not found for this tenant.`);
    }

    return this.toFilingRecord(record);
  }

  // ── Get filing events (audit trail) ──────────────────────────────────────

  async getFilingEvents(tenantId: string, filingId: string): Promise<FilingEventRecord[]> {
    // Verify the filing belongs to this tenant first
    await this.getFiling(tenantId, filingId);

    const events = await (this.prisma as any).vatFilingEvent.findMany({
      where: { filingId, tenantId },
      orderBy: { occurredAt: 'asc' },
    });

    return events.map((e: any) => ({
      id:         e.id,
      filingId:   e.filingId,
      tenantId:   e.tenantId,
      eventType:  e.eventType,
      fromStatus: e.fromStatus ?? null,
      toStatus:   e.toStatus,
      actorId:    e.actorId ?? null,
      payload:    e.payloadJson ? JSON.parse(e.payloadJson) : null,
      occurredAt: e.occurredAt.toISOString(),
    }));
  }

  // ── Submit filing ─────────────────────────────────────────────────────────

  /**
   * Transitions a DRAFT or PENDING_REVIEW filing to SUBMITTED.
   *
   * For API_DIRECT channel this is where the authority adapter would be called
   * (not implemented yet — deferred to the authority integration packages).
   * For all other channels the record is marked SUBMITTED for manual processing.
   */
  async submitFiling(
    tenantId:  string,
    id:        string,
    dto:       SubmitFilingDto,
    actorId:   string,
  ): Promise<FilingRecord> {
    const record = await (this.prisma as any).vatFilingRecord.findFirst({
      where: { id, tenantId },
    });

    if (!record) {
      throw new NotFoundException(`VAT filing "${id}" not found for this tenant.`);
    }

    const allowedFromStatuses: VatFilingStatus[] = ['DRAFT', 'PENDING_REVIEW'];
    if (!allowedFromStatuses.includes(record.status as VatFilingStatus)) {
      throw new ConflictException(
        `Cannot submit filing in status "${record.status}". ` +
        `Filing must be DRAFT or PENDING_REVIEW.`,
      );
    }

    const fromStatus = record.status as VatFilingStatus;

    const updated = await (this.prisma as any).vatFilingRecord.update({
      where: { id },
      data: {
        status:      'SUBMITTED',
        submittedAt: new Date(),
        submittedBy: actorId,
        notes:       dto.notes ? (record.notes ? `${record.notes}\n${dto.notes}` : dto.notes) : record.notes,
        updatedAt:   new Date(),
      },
    });

    await this.appendEvent(id, tenantId, 'SUBMITTED', fromStatus, 'SUBMITTED', actorId, {
      channel: dto.channel ?? 'MANUAL',
    });

    this.eventEmitter.emit('vat.filing.submitted', {
      filingId:    id,
      tenantId,
      countryCode: record.countryCode,
      periodKey:   record.periodKey,
      channel:     dto.channel ?? 'MANUAL',
      submittedBy: actorId,
    });

    this.logger.log(
      `Filing ${id} submitted by ${actorId} via ${dto.channel ?? 'MANUAL'} channel`,
    );

    return this.toFilingRecord(updated);
  }

  // ── Record authority acknowledgement ──────────────────────────────────────

  /**
   * Called by the authority integration adapter (or a webhook handler) when
   * the tax authority responds with ACCEPTED or REJECTED.
   */
  async recordAck(
    tenantId: string,
    id:       string,
    dto:      RecordAckDto,
    actorId:  string,
  ): Promise<FilingRecord> {
    const record = await (this.prisma as any).vatFilingRecord.findFirst({
      where: { id, tenantId },
    });

    if (!record) {
      throw new NotFoundException(`VAT filing "${id}" not found for this tenant.`);
    }

    if (record.status !== 'SUBMITTED') {
      throw new ConflictException(
        `Cannot record acknowledgement for filing in status "${record.status}". ` +
        `Filing must be in SUBMITTED status.`,
      );
    }

    const ackPayloadJson = dto.ackPayload ? JSON.stringify(dto.ackPayload) : null;

    const updated = await (this.prisma as any).vatFilingRecord.update({
      where: { id },
      data: {
        status:       dto.status,
        ackNumber:    dto.ackNumber,
        ackReceivedAt: new Date(),
        ackPayloadJson,
        updatedAt:    new Date(),
      },
    });

    await this.appendEvent(id, tenantId, dto.status, 'SUBMITTED', dto.status, actorId, {
      ackNumber:       dto.ackNumber,
      rejectionReason: dto.rejectionReason ?? null,
    });

    this.eventEmitter.emit(`vat.filing.${dto.status.toLowerCase()}`, {
      filingId:    id,
      tenantId,
      countryCode: record.countryCode,
      periodKey:   record.periodKey,
      ackNumber:   dto.ackNumber,
    });

    this.logger.log(
      `Filing ${id} acknowledged as ${dto.status} — ackNumber: ${dto.ackNumber}`,
    );

    return this.toFilingRecord(updated);
  }

  // ── Amend a submitted filing ──────────────────────────────────────────────

  /**
   * Creates a new DRAFT filing that amends the specified original.
   * The original is left untouched (immutable once submitted).
   * The new record carries `amendmentOf = originalId` so the audit chain is preserved.
   */
  async amendFiling(
    tenantId: string,
    id:       string,
    dto:      AmendFilingDto,
    actorId:  string,
  ): Promise<FilingRecord> {
    const original = await (this.prisma as any).vatFilingRecord.findFirst({
      where: { id, tenantId },
    });

    if (!original) {
      throw new NotFoundException(`VAT filing "${id}" not found for this tenant.`);
    }

    const amendableStatuses: VatFilingStatus[] = ['SUBMITTED', 'ACCEPTED', 'REJECTED'];
    if (!amendableStatuses.includes(original.status as VatFilingStatus)) {
      throw new ConflictException(
        `Cannot amend a filing in status "${original.status}". ` +
        `Only SUBMITTED, ACCEPTED, or REJECTED filings can be amended.`,
      );
    }

    // Check for an existing open amendment
    const openAmendment = await (this.prisma as any).vatFilingRecord.findFirst({
      where: {
        tenantId,
        countryCode:  original.countryCode,
        periodKey:    original.periodKey,
        amendmentOf:  id,
        status:       'DRAFT',
      },
    });

    if (openAmendment) {
      throw new ConflictException(
        `An open amendment (id: ${openAmendment.id}) already exists for this filing. ` +
        `Complete or discard it before creating a new amendment.`,
      );
    }

    const amendment = await (this.prisma as any).vatFilingRecord.create({
      data: {
        tenantId,
        countryCode:    original.countryCode,
        periodKey:      original.periodKey,
        status:         'DRAFT',
        currency:       original.currency,
        outputVat:      original.outputVat,
        inputVat:       original.inputVat,
        netVatPayable:  original.netVatPayable,
        returnDraftJson: original.returnDraftJson,
        complianceJson: null,
        dueDate:        original.dueDate,
        amendmentOf:    id,
        notes: `AMENDMENT of ${id}: ${dto.reason}${dto.notes ? `\n${dto.notes}` : ''}`,
      },
    });

    await this.appendEvent(amendment.id, tenantId, 'CREATED', null, 'DRAFT', actorId, {
      amendmentOf: id,
      reason:      dto.reason,
    });

    this.eventEmitter.emit('vat.filing.amended', {
      originalFilingId: id,
      amendmentId:      amendment.id,
      tenantId,
      countryCode:      original.countryCode,
      periodKey:        original.periodKey,
      reason:           dto.reason,
    });

    this.logger.log(
      `Amendment ${amendment.id} created for filing ${id} by ${actorId} — reason: ${dto.reason}`,
    );

    return this.toFilingRecord(amendment);
  }

  // ── Track a rendered report artifact ─────────────────────────────────────

  async trackArtifact(params: {
    tenantId:     string;
    filingId?:    string;
    countryCode:  string;
    periodKey:    string;
    templateId:   string;
    format:       string;
    storageUrl:   string;
    mimeType?:    string;
    fileSizeBytes?: number;
    generatedBy?: string;
    expiresAt?:   Date;
  }): Promise<void> {
    try {
      await (this.prisma as any).vatReportArtifact.create({
        data: {
          tenantId:      params.tenantId,
          filingId:      params.filingId ?? null,
          countryCode:   params.countryCode,
          periodKey:     params.periodKey,
          templateId:    params.templateId,
          format:        params.format,
          storageUrl:    params.storageUrl,
          mimeType:      params.mimeType ?? null,
          fileSizeBytes: params.fileSizeBytes ?? null,
          generatedBy:   params.generatedBy ?? null,
          expiresAt:     params.expiresAt ?? null,
        },
      });
    } catch (err) {
      // Non-fatal — artifact tracking failure should not block the user
      this.logger.warn(`trackArtifact failed: ${(err as Error).message}`);
    }
  }

  // ── Delete expired artifacts ──────────────────────────────────────────────

  async cleanupExpiredArtifacts(): Promise<number> {
    const result = await (this.prisma as any).vatReportArtifact.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async findExistingDraft(
    tenantId:    string,
    countryCode: string,
    periodKey:   string,
  ) {
    return (this.prisma as any).vatFilingRecord.findFirst({
      where: { tenantId, countryCode, periodKey },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async appendEvent(
    filingId:   string,
    tenantId:   string,
    eventType:  string,
    fromStatus: string | null,
    toStatus:   string,
    actorId:    string,
    payload?:   Record<string, unknown>,
  ): Promise<void> {
    try {
      await (this.prisma as any).vatFilingEvent.create({
        data: {
          filingId,
          tenantId,
          eventType,
          fromStatus: fromStatus ?? null,
          toStatus,
          actorId,
          payloadJson: payload ? JSON.stringify(payload) : null,
        },
      });
    } catch (err) {
      // Non-fatal — event logging failure should not rollback the main operation
      this.logger.warn(`appendEvent failed for filing ${filingId}: ${(err as Error).message}`);
    }
  }

  // ── Shape mapper ──────────────────────────────────────────────────────────

  private toFilingRecord(raw: any): FilingRecord {
    return {
      id:              raw.id,
      tenantId:        raw.tenantId,
      countryCode:     raw.countryCode,
      periodKey:       raw.periodKey,
      status:          raw.status as VatFilingStatus,
      currency:        raw.currency,
      outputVat:       Number(raw.outputVat),
      inputVat:        Number(raw.inputVat),
      netVatPayable:   Number(raw.netVatPayable),
      returnDraft:     this.safeParse(raw.returnDraftJson),
      complianceResult: raw.complianceJson ? this.safeParse(raw.complianceJson) : null,
      submittedAt:     raw.submittedAt ? (raw.submittedAt as Date).toISOString() : null,
      submittedBy:     raw.submittedBy ?? null,
      ackNumber:       raw.ackNumber ?? null,
      ackReceivedAt:   raw.ackReceivedAt ? (raw.ackReceivedAt as Date).toISOString() : null,
      ackPayload:      raw.ackPayloadJson ? this.safeParse(raw.ackPayloadJson) : null,
      dueDate:         raw.dueDate ? (raw.dueDate as Date).toISOString().slice(0, 10) : null,
      amendmentOf:     raw.amendmentOf ?? null,
      notes:           raw.notes ?? null,
      createdAt:       (raw.createdAt as Date).toISOString(),
      updatedAt:       (raw.updatedAt as Date).toISOString(),
    };
  }

  private safeParse(json: string): Record<string, unknown> {
    try   { return JSON.parse(json); }
    catch { return {}; }
  }
}
