/**
 * BusinessRegistrationService
 *
 * Persists the Ethiopian Business Registration / ID Harmonization wizard
 * data using the existing SettingValue model (key = "biz_reg", scoped to
 * companyId).  No schema migration is required.
 *
 * Each step POST merges its payload into the stored JSON blob; GET /record
 * returns the full accumulated record so the wizard can repopulate on reload.
 *
 * Steps: nid → tin → license → vat → cross-reference → complete
 */
import { Injectable, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';

const SETTING_KEY = 'biz_reg';

export interface BizRegRecord {
  companyId?: string;
  completedAt?: string;
  nid?: {
    faydaId: string;
    fullName: string;
    dateOfBirth?: string;
    savedAt: string;
  };
  tin?: {
    tin: string;
    businessName: string;
    taxOffice?: string;
    biometricComplete: boolean;
    savedAt: string;
  };
  businessLicense?: {
    licenseNumber: string;
    tradeName: string;
    activity: string;
    registeredAddress: string;
    annualTurnover?: number;
    issuedAt?: string;
    expiresAt?: string;
    savedAt: string;
  };
  vat?: {
    vatNumber?: string;
    registrationStatus: string;
    ecrStatus: string;
    ecrSerial?: string;
    savedAt: string;
  };
  crossReference?: {
    nidTinLinked: boolean;
    tinLicenseLinked: boolean;
    licenseVatLinked: boolean;
    morSystemActive: boolean;
    conflictNotes?: string[];
    savedAt: string;
  };
}

@Injectable()
export class BusinessRegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async loadRecord(companyId: string): Promise<BizRegRecord> {
    const row = await this.prisma.settingValue.findFirst({
      where: { key: SETTING_KEY, companyId },
    }).catch(() => null);
    if (!row) return { companyId };
    try {
      return JSON.parse(row.value) as BizRegRecord;
    } catch {
      return { companyId };
    }
  }

  private async saveRecord(companyId: string, record: BizRegRecord): Promise<void> {
    const value = JSON.stringify(record);
    await this.prisma.settingValue.upsert({
      where: { key_companyId: { key: SETTING_KEY, companyId } },
      update: { value, updatedAt: new Date() },
      create: {
        key: SETTING_KEY,
        value,
        companyId,
        scope: 'company',
        type: 'json',
      },
    });
  }

  private resolveCompanyId(body: any, jwtCompanyId?: string): string {
    const id = (body?.companyId as string | undefined) ?? jwtCompanyId;
    if (!id) throw new BadRequestException('companyId is required');
    return id;
  }

  // ── Step endpoints ─────────────────────────────────────────────────────────

  async getRecord(companyId?: string): Promise<{ success: boolean; data: BizRegRecord }> {
    if (!companyId) return { success: true, data: {} };
    const record = await this.loadRecord(companyId);
    return { success: true, data: record };
  }

  async saveNid(body: any, jwtCompanyId?: string) {
    const companyId = this.resolveCompanyId(body, jwtCompanyId);
    const record = await this.loadRecord(companyId);
    record.nid = {
      faydaId: body.faydaId ?? '',
      fullName: body.fullName ?? '',
      dateOfBirth: body.dateOfBirth,
      savedAt: new Date().toISOString(),
    };
    await this.saveRecord(companyId, record);
    return { success: true, data: { step: 'nid', savedAt: record.nid.savedAt } };
  }

  async saveTin(body: any, jwtCompanyId?: string) {
    const companyId = this.resolveCompanyId(body, jwtCompanyId);
    const record = await this.loadRecord(companyId);
    record.tin = {
      tin: body.tin ?? '',
      businessName: body.businessName ?? '',
      taxOffice: body.taxOffice,
      biometricComplete: body.biometricComplete === true,
      savedAt: new Date().toISOString(),
    };
    await this.saveRecord(companyId, record);
    return { success: true, data: { step: 'tin', savedAt: record.tin.savedAt } };
  }

  async saveLicense(body: any, jwtCompanyId?: string) {
    const companyId = this.resolveCompanyId(body, jwtCompanyId);
    const record = await this.loadRecord(companyId);
    record.businessLicense = {
      licenseNumber: body.licenseNumber ?? '',
      tradeName: body.tradeName ?? '',
      activity: body.activity ?? '',
      registeredAddress: body.registeredAddress ?? '',
      annualTurnover: body.annualTurnover != null ? Number(body.annualTurnover) : undefined,
      issuedAt: body.issuedAt,
      expiresAt: body.expiresAt,
      savedAt: new Date().toISOString(),
    };
    await this.saveRecord(companyId, record);
    return { success: true, data: { step: 'license', savedAt: record.businessLicense.savedAt } };
  }

  async saveVat(body: any, jwtCompanyId?: string) {
    const companyId = this.resolveCompanyId(body, jwtCompanyId);
    const record = await this.loadRecord(companyId);
    record.vat = {
      vatNumber: body.vatNumber,
      registrationStatus: body.registrationStatus ?? 'NOT_REGISTERED',
      ecrStatus: body.ecrStatus ?? 'NOT_REQUIRED',
      ecrSerial: body.ecrSerial,
      savedAt: new Date().toISOString(),
    };
    await this.saveRecord(companyId, record);
    return { success: true, data: { step: 'vat', savedAt: record.vat.savedAt } };
  }

  async saveCrossReference(body: any, jwtCompanyId?: string) {
    const companyId = this.resolveCompanyId(body, jwtCompanyId);
    const record = await this.loadRecord(companyId);
    record.crossReference = {
      nidTinLinked: body.nidTinLinked === true,
      tinLicenseLinked: body.tinLicenseLinked === true,
      licenseVatLinked: body.licenseVatLinked === true,
      morSystemActive: body.morSystemActive === true,
      conflictNotes: Array.isArray(body.conflictNotes) ? body.conflictNotes : (body.conflictNotes ? [body.conflictNotes] : undefined),
      savedAt: new Date().toISOString(),
    };
    await this.saveRecord(companyId, record);
    return { success: true, data: { step: 'cross-reference', savedAt: record.crossReference.savedAt } };
  }

  async complete(body: any, jwtCompanyId?: string) {
    const companyId = this.resolveCompanyId(body, jwtCompanyId);
    const record = await this.loadRecord(companyId);
    record.completedAt = new Date().toISOString();
    await this.saveRecord(companyId, record);

    // Derive harmonization status from completeness of each section
    const sections = ['nid', 'tin', 'businessLicense', 'vat', 'crossReference'] as const;
    const completed = sections.filter(s => record[s] != null).length;
    const pct = Math.round((completed / sections.length) * 100);
    const status =
      pct === 100 && record.crossReference?.morSystemActive
        ? 'HARMONIZED'
        : pct >= 60
          ? 'IN_PROGRESS'
          : completed > 0
            ? 'IN_PROGRESS'
            : 'INCOMPLETE';

    return {
      success: true,
      data: {
        completed: true,
        completedAt: record.completedAt,
        completionPct: pct,
        overallStatus: status,
      },
    };
  }
}
