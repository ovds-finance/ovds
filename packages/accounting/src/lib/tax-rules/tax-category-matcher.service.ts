import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export type TaxTreatmentCode = 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';

export interface InvoiceLineItem {
  itemId: string;
  grossAmountCents: bigint;
  treatmentCode: TaxTreatmentCode;
}

@Injectable()
export class TaxCategoryMatcherService {
  constructor(private prisma: PrismaService) {}

  public partitionTaxTreatment(items: InvoiceLineItem[]): {
    deductibleVatCents: bigint;
    nonDeductibleVatCents: bigint;
    exemptBaseCents: bigint;
  } {
    let deductibleAccumulator = new Big(0);
    let nonDeductibleAccumulator = new Big(0);
    let exemptBaseAccumulator = new Big(0);

    for (const item of items) {
      const amount = new Big(item.grossAmountCents.toString());
      switch (item.treatmentCode) {
        case 'STANDARD':
          const vatPart = amount.times(0.21).round(0, Big.roundHalfUp);
          deductibleAccumulator = deductibleAccumulator.plus(vatPart);
          break;
        case 'ZERO_RATED':
          deductibleAccumulator = deductibleAccumulator.plus(0);
          break;
        case 'EXEMPT':
          exemptBaseAccumulator = exemptBaseAccumulator.plus(amount);
          break;
        default:
          throw new BadRequestException(`Compliance Error: Unrecognized regulatory tax treatment identifier: ${item.treatmentCode}`);
      }
    }

    return {
      deductibleVatCents: BigInt(deductibleAccumulator.toFixed(0)),
      nonDeductibleVatCents: BigInt(nonDeductibleAccumulator.toFixed(0)),
      exemptBaseCents: BigInt(exemptBaseAccumulator.toFixed(0))
    };
  }
}