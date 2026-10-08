import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export interface BadDebtReliefRequest {
  tenantId: string;
  originalInvoiceRef: string;
  outstandingBalanceCents: bigint;
  vatRatePercent: string;
  courtLiquidationRef: string;
}

@Injectable()
export class BadDebtReliefService {
  constructor(private prisma: PrismaService) {}

  async processBadDebtWriteOff(dto: BadDebtReliefRequest) {
    return this.prisma.$transaction(async (tx) => {
      const existingRelief = await tx.generalLedger.findFirst({
        where: { tenantId: dto.tenantId, invoiceRef: `BAD-DEBT-RELIEF-${dto.originalInvoiceRef}` }
      });

      if (existingRelief) {
        throw new BadRequestException('Bad-debt relief has already been claimed for this transaction reference.');
      }

      const gross = new Big(dto.outstandingBalanceCents.toString());
      const rateFactor = new Big(dto.vatRatePercent).div(100).plus(1);

      const netAmount = gross.div(rateFactor);
      const recoverableVatCents = gross.minus(netAmount).round(0, Big.roundHalfUp).toString();
      const vatBigInt = BigInt(recoverableVatCents);

      const recoveryEntry = await tx.generalLedger.create({
        data: {
          tenantId: dto.tenantId,
          invoiceRef: `BAD-DEBT-RELIEF-${dto.originalInvoiceRef}`,
          accountCode: 'VAT-OUTPUT',
          entryType: 'DEBIT',
          amountInCents: vatBigInt,
        }
      });

      await tx.auditTrail.create({
        data: {
          tenantId: dto.tenantId,
          userId: 'compliance-worker',
          role: 'TAXPAYER',
          action: 'CLAIM_BAD_DEBT_RELIEF',
          payload: { originalInvoiceRef: dto.originalInvoiceRef, liquidationToken: dto.courtLiquidationRef, reclaimedCents: recoverableVatCents },
          hash: require('crypto').createHash('sha256').update(recoveryEntry.id + recoverableVatCents).digest('hex')
        }
      });

      return {
        success: true,
        reclaimedVatCents: vatBigInt
      };
    });
  }
}