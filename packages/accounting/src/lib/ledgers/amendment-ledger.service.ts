import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export interface AmendmentRequest {
  tenantId: string;
  targetDeclarationId: string;
  revisedNetAmountCents: bigint;
  vatRatePercent: string;
  reason: string;
}

@Injectable()
export class AmendmentLedgerService {
  constructor(private prisma: PrismaService) {}

  async processDeclarationAmendment(dto: AmendmentRequest) {
    return this.prisma.$transaction(async (tx) => {
      const originalDecl = await tx.vatDeclaration.findUnique({
        where: { id: dto.targetDeclarationId, tenantId: dto.tenantId }
      });

      if (!originalDecl || originalDecl.status !== 'SUBMITTED') {
        throw new BadRequestException('Only finalized and submitted declarations may be formally amended.');
      }

      const historicalEntries = await tx.generalLedger.findMany({
        where: { tenantId: dto.tenantId, invoiceRef: `DECL-${dto.targetDeclarationId}` }
      });

      for (const entry of historicalEntries) {
        const reversedEntryType = entry.entryType === 'DEBIT' ? 'CREDIT' : 'DEBIT';

        await tx.generalLedger.create({
          data: {
            tenantId: dto.tenantId,
            invoiceRef: `AMEND-REV-${dto.targetDeclarationId}`,
            accountCode: entry.accountCode,
            entryType: reversedEntryType,
            amountInCents: entry.amountInCents,
          }
        });
      }

      const newNet = new Big(dto.revisedNetAmountCents.toString());
      const rate = new Big(dto.vatRatePercent).div(100);
      const replacementVatCents = newNet.times(rate).round(0, Big.roundHalfUp).toString();

      const structuralCorrection = await tx.generalLedger.create({
        data: {
          tenantId: dto.tenantId,
          invoiceRef: `AMEND-NEW-${dto.targetDeclarationId}`,
          accountCode: 'VAT-OUTPUT',
          entryType: 'CREDIT',
          amountInCents: BigInt(replacementVatCents),
        }
      });

      await tx.vatDeclaration.update({
        where: { id: dto.targetDeclarationId },
        data: { status: 'AMENDED' }
      });

      return {
        amendmentCorrelationId: structuralCorrection.id,
        netCorrectionVatCents: replacementVatCents
      };
    });
  }
}