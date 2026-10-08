import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export interface TaxCalculationRequest {
  tenantId: string;
  netAmountCents: bigint;
  vatRatePercent: string;
}

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async recordVatTransaction(dto: TaxCalculationRequest, invoiceRef: string) {
    const net = new Big(dto.netAmountCents.toString());
    const rate = new Big(dto.vatRatePercent).div(100);

    const vatAmountCents = net.times(rate).round(0, Big.roundHalfUp).toString();
    const vatBigInt = BigInt(vatAmountCents);

    return this.prisma.$transaction(async (tx) => {
      const vatEntry = await tx.generalLedger.create({
        data: {
          tenantId: dto.tenantId,
          invoiceRef,
          accountCode: 'VAT-OUTPUT',
          entryType: 'CREDIT',
          amountInCents: vatBigInt,
        },
      });

      const previousAudit = await tx.auditTrail.findFirst({
        where: { tenantId: dto.tenantId },
        orderBy: { createdAt: 'desc' },
      });

      const prevHash = previousAudit ? previousAudit.hash : 'GENESIS';
      const actionPayload = JSON.stringify({ vatEntryId: vatEntry.id, amount: vatAmountCents });

      const crypto = require('crypto');
      const currentHash = crypto
        .createHash('sha256')
        .update(prevHash + actionPayload)
        .digest('hex');

      await tx.auditTrail.create({
        data: {
          tenantId: dto.tenantId,
          userId: 'system-actor',
          role: 'TAXPAYER',
          action: 'RECORD_VAT_ENTRY',
          payload: JSON.parse(actionPayload),
          hash: currentHash,
        },
      });

      return {
        success: true,
        vatCalculatedCents: vatBigInt,
      };
    });
  }
}