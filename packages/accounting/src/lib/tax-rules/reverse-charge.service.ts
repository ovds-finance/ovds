import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';

export interface CrossBorderTradeContext {
  tenantId: string;
  invoiceId: string;
  supplierCountry: string;
  buyerCountry: string;
  isBuyerB2B: boolean;
  baseAmountCents: bigint;
}

@Injectable()
export class ReverseChargeService {
  constructor(private prisma: PrismaService) {}

  async applyReverseChargeEvaluation(ctx: CrossBorderTradeContext) {
    if (ctx.supplierCountry === ctx.buyerCountry) {
      throw new BadRequestException('Domestic transactions are ineligible for reverse charge mitigation rules.');
    }

    const isEligibleForReverseCharge = ctx.isBuyerB2B;
    const outputVatRate = isEligibleForReverseCharge ? '0.00' : '21.00';

    return this.prisma.$transaction(async (tx) => {
      const ledgerRecord = await tx.generalLedger.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceRef: ctx.invoiceId,
          accountCode: 'VAT-OUTPUT',
          entryType: 'CREDIT',
          amountInCents: 0n,
          classification: isEligibleForReverseCharge ? 'ZERO_RATED' : 'STANDARD'
        }
      });

      await tx.auditTrail.create({
        data: {
          tenantId: ctx.tenantId,
          userId: 'tax-engine',
          role: 'THIRD_PARTY',
          action: 'REVERSE_CHARGE_APPLIED',
          payload: {
            invoiceId: ctx.invoiceId,
            appliedRate: outputVatRate,
            legalAnnotation: 'Art 196 EU VAT Directive - Reverse Charge Mechanism'
          },
          hash: ''
        }
      });

      return {
        reverseChargeApplied: isEligibleForReverseCharge,
        taxLiabilityCents: 0n,
        annotation: isEligibleForReverseCharge ? 'Reverse Charge Mechanism Applies' : 'Standard local tax rates enforced'
      };
    });
  }
}