import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export interface LineItemIngress {
  productId: string;
  classification: 'STANDARD' | 'REDUCED' | 'ZERO_RATED' | 'EXEMPT' | 'OUT_OF_SCOPE';
  grossAmountCents: bigint;
}

@Injectable()
export class ClassificationIsolatorService {
  constructor(private prisma: PrismaService) {}

  public isolateFilingBuckets(items: LineItemIngress[]): {
    assessableTaxableCents: bigint;
    reportableExemptCents: bigint;
    isolatedOutOfScopeCents: bigint;
  } {
    let taxableAccumulator = new Big(0);
    let exemptAccumulator = new Big(0);
    let outOfScopeAccumulator = new Big(0);

    for (const item of items) {
      const amount = new Big(item.grossAmountCents.toString());
      switch (item.classification) {
        case 'STANDARD':
        case 'REDUCED':
        case 'ZERO_RATED':
          taxableAccumulator = taxableAccumulator.plus(amount);
          break;
        case 'EXEMPT':
          exemptAccumulator = exemptAccumulator.plus(amount);
          break;
        case 'OUT_OF_SCOPE':
          outOfScopeAccumulator = outOfScopeAccumulator.plus(amount);
          break;
      }
    }

    return {
      assessableTaxableCents: BigInt(taxableAccumulator.toFixed(0)),
      reportableExemptCents: BigInt(exemptAccumulator.toFixed(0)),
      isolatedOutOfScopeCents: BigInt(outOfScopeAccumulator.toFixed(0))
    };
  }
}