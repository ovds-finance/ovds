import * as crypto from 'crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generatePrivateKeyPem,
  generateCsrPem,
  generateCsrConfig,
  encodeCertificateForEims,
} from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

import { CertificateEncryptionService } from './certificate-encryption.service';


export interface GenerateCsrResult {
  id: string;
  certificateId: string;
  status: string;
  csrPem: string;
  cnfContent: string;
  privateKeyEnc: string;
  tin: string;
  systemNumber: string;
  organizationName: string;
  email: string;
  organizationalUnitName?: string;
  sourceSystemId?: string;
}

@Injectable()
export class EimsCertificateService {
  private readonly logger = new Logger(EimsCertificateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly encryption: CertificateEncryptionService,
  ) {}

  async listCertificates(companyId: string) {
    const rows = await this.prisma.eimsCertificate.findMany({
      where: { companyId },
      include: { sourceSystem: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: rows };
  }

  async generateCsr(companyId: string, dto: {
    tin: string;
    systemNumber: string;
    organizationName: string;
    email: string;
    organizationalUnitName?: string;
    countryName?: string;
    stateOrProvinceName?: string;
    localityName?: string;
    sourceSystemId?: string;
  }): Promise<GenerateCsrResult> {
    const ou = dto.organizationalUnitName || dto.organizationName;
    // DTO values take precedence so operators can override per-submission.
    // Fall back to env vars for country/state/city to match INSA defaults.
    const countryName        = dto.countryName        || this.config.get<string>('EIMS_DEFAULT_COUNTRY', 'ET');
    const stateOrProvinceName = dto.stateOrProvinceName || this.config.get<string>('EIMS_DEFAULT_STATE',   'Addis Ababa');
    const localityName       = dto.localityName       || this.config.get<string>('EIMS_DEFAULT_CITY',    'Addis Ababa');

    const privateKeyPem = await generatePrivateKeyPem(2048);
    const privateKeyEnc = this.encryption.encrypt(privateKeyPem);

    const csrConfig = {
      countryName,
      stateOrProvinceName,
      localityName,
      organizationName: dto.organizationName,
      organizationalUnitName: ou,
      commonName: dto.tin,
      serialNumber: dto.systemNumber,
      emailAddress: dto.email,
    };

    const csrPem = await generateCsrPem(privateKeyPem, csrConfig);
    const cnfContent = generateCsrConfig(csrConfig);

    const record = await this.prisma.eimsCertificate.create({
      data: {
        companyId,
        sourceSystemId: dto.sourceSystemId,
        status: 'PENDING_CSR',
        privateKeyEnc,
        csrPem,
        subjectTin: dto.tin,
        serialNumber: dto.systemNumber,
      },
    });

    this.logger.log(`CSR generated for TIN ${dto.tin} — cert ${record.id}`);
    return {
      id: record.id,
      certificateId: record.id,
      status: record.status,
      csrPem,
      cnfContent,
      privateKeyEnc,
      tin: dto.tin,
      systemNumber: dto.systemNumber,
      organizationName: dto.organizationName,
      email: dto.email,
      organizationalUnitName: ou,
      sourceSystemId: dto.sourceSystemId,
    };
  }

  async installCertificate(companyId: string, id: string, certificatePem: string) {
    const record = await this.prisma.eimsCertificate.findFirst({
      where: { id, companyId },
    });
    if (!record) {
      throw new NotFoundException('Certificate not found');
    }

    const certificateB64 = encodeCertificateForEims(certificatePem);
    let expiresAt: Date | null = null;
    try {
      const cert = new crypto.X509Certificate(certificatePem);
      const notAfter = cert.validTo;
      expiresAt = new Date(notAfter);
    } catch {
      this.logger.warn(`Could not parse expiry from certificate ${id}`);
    }

    const updated = await this.prisma.eimsCertificate.update({
      where: { id },
      data: {
        certificatePem,
        certificateB64,
        status: 'ISSUED',
        issuedAt: new Date(),
        expiresAt,
      },
    });

    this.logger.log(`Certificate installed: ${id}`);
    return { success: true, data: updated };
  }

  async submitCsr(companyId: string, id: string, csrPem: string) {
    const record = await this.prisma.eimsCertificate.findFirst({
      where: { id, companyId },
    });
    if (!record) {
      throw new NotFoundException('Certificate not found');
    }

    const updated = await this.prisma.eimsCertificate.update({
      where: { id },
      data: {
        csrPem: csrPem || record.csrPem,
        status: 'CSR_SUBMITTED',
        submittedAt: new Date(),
      },
    });

    this.logger.log(`CSR submitted for cert ${id}`);
    return { success: true, data: updated };
  }

  async getActiveCertificate(companyId: string) {
    const record = await this.prisma.eimsCertificate.findFirst({
      where: {
        companyId,
        status: 'ISSUED',
        expiresAt: { gt: new Date() },
      },
      orderBy: { issuedAt: 'desc' },
    });
    return record;
  }

  async getDecryptedPrivateKey(companyId: string): Promise<string | null> {
    const record = await this.getActiveCertificate(companyId);
    if (!record || !record.privateKeyEnc) return null;
    return this.encryption.decrypt(record.privateKeyEnc);
  }

  async getCertificatePem(companyId: string): Promise<string | null> {
    const record = await this.getActiveCertificate(companyId);
    return record?.certificatePem ?? null;
  }

  async getCertificateB64(companyId: string): Promise<string | null> {
    const record = await this.getActiveCertificate(companyId);
    return record?.certificateB64 ?? null;
  }

  async certificateExpiryCheck(companyId: string) {
    const rows = await this.prisma.eimsCertificate.findMany({
      where: { companyId, status: 'ISSUED' },
    });
    const now = new Date();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const thirtyDays = THIRTY_DAYS_MS;
    return {
      success: true,
      data: rows
        .filter((r) => r.expiresAt && new Date(r.expiresAt).getTime() - now.getTime() < thirtyDays)
        .map((r) => ({
          id: r.id,
          subjectTin: r.subjectTin,
          serialNumber: r.serialNumber,
          expiresAt: r.expiresAt,
          daysRemaining: r.expiresAt ? Math.ceil((new Date(r.expiresAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null,
        })),
    };
  }
}
