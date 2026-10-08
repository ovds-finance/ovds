import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export interface DropshipTransactionContext {
  tenantId: string;
  orderId: string;
  dispatchCountryCode: string;
  destinationCountryCode: string;
  grossAmountCents: bigint;
  destinationVatRatePercent: string;
}

@Injectable()
export class OssHarmonizationService {
  constructor(private prisma: PrismaService) {}

  async processOssDropshipInvoice(ctx: DropshipTransactionContext) {
    if (ctx.dispatchCountryCode === ctx.destinationCountryCode) {
      throw new BadRequestException('Domestic transactions cannot be routed to the OSS Harmonization framework.');
    }

    const gross = new Big(ctx.grossAmountCents.toString());
    const rateFactor = new Big(ctx.destinationVatRatePercent).div(100).plus(1);

    const netAmountCents = gross.div(rateFactor).round(0, Big.roundHalfUp);
    const calculatedVatCents = gross.minus(netAmountCents).round(0, Big.roundHalfUp).toString();
    const vatBigInt = BigInt(calculatedVatCents);

    return this.prisma.$transaction(async (tx) => {
      const ossLedgerRow = await tx.generalLedger.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceRef: `OSS-ORDER-${ctx.orderId}`,
          accountCode: `VAT-OSS-OUTPUT-${ctx.destinationCountryCode.toUpperCase()}`,
          entryType: 'CREDIT',
          amountInCents: vatBigInt,
          classification: 'STANDARD'
        }
      });

      await tx.auditTrail.create({
        data: {
          tenantId: ctx.tenantId,
          userId: 'oss-tax-engine',
          role: 'TAXPAYER',
          action: 'OSS_TAX_COMPUTED',
          payload: {
            orderId: ctx.orderId,
            origin: ctx.dispatchCountryCode,
            destination: ctx.destinationCountryCode,
            appliedRate: ctx.destinationVatRatePercent,
            vatCents: calculatedVatCents
          },
          hash: ''
        }
      });

      return {
        success: true,
        ossLedgerId: ossLedgerRow.id,
        allocatedVatCents: vatBigInt,
        destinationZone: ctx.destinationCountryCode.toUpperCase()
      };
    });
  }
}