// apps/shared-domains/accounting/src/compliance/worm-vault.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import { createTenantClient } from '@ovds/shared-domains-infra';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ComplianceBlockEnvelope { tenantId: string; periodId: string; ledgerHash: string; signature: string; timestamp: string; }

@Injectable()
export class WormVaultService {
  private readonly wormStorageRoot = '/mnt/compliance-worm-vault';
  private readonly signingPrivateKey = process.env.COMPLIANCE_SIGNING_KEY;
  private readonly basePrisma = new PrismaClient();

  async sealPeriodLedger(tenantId: string, periodId: string): Promise<string> {
    const tenant = await this.basePrisma.tenant.findUnique({ where: { id: tenantId }, select: { subdomain: true } });
    if (!tenant) throw new InternalServerErrorException(`Tenant [${tenantId}] not found`);
    const prisma = createTenantClient(new PrismaClient(), { tenantId, subdomain: tenant.subdomain });
    const entries = await (prisma as any).journalEntry.findMany({ where: { tenantId }, include: { journalLine: true }, orderBy: { postedAt: 'asc' } });
    const dataString = JSON.stringify(entries);
    const ledgerHash = crypto.createHash('sha256').update(dataString).digest('hex');
    if (!this.signingPrivateKey) throw new InternalServerErrorException('Signing key missing.');
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(ledgerHash);
    const signature = signer.sign(this.signingPrivateKey, 'hex');
    const envelope: ComplianceBlockEnvelope = { tenantId, periodId, ledgerHash, signature, timestamp: new Date().toISOString() };
    const dir = path.join(this.wormStorageRoot, tenantId);
    await fs.mkdir(dir, { recursive: true });
    const targetFile = `sealed_${periodId}.worm.json`;
    const finalPath = path.join(dir, targetFile);
    await fs.writeFile(finalPath, JSON.stringify(envelope, null, 2));
    await fs.chmod(finalPath, 0o400);
    return finalPath;
  }
}
