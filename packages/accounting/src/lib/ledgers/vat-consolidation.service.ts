import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

@Injectable()
export class VatConsolidationService {
  constructor(private prisma: PrismaService) {}

  async generateConsolidatedGroupSummary(parentGroupId: string, periodStart: Date, periodEnd: Date) {
    const parent = await this.prisma.tenant.findUnique({
      where: { id: parentGroupId },
      include: { subTenants: true }
    });

    if (!parent) throw new BadRequestException('Target parent group tenant entity not found.');

    const tenantIdsInGroup = [parent.id, ...parent.subTenants.map(t => t.id)];

    const activeLedgers = await this.prisma.generalLedger.findMany({
      where: {
        tenantId: { in: tenantIdsInGroup },
        postedAt: { gte: periodStart, lte: periodEnd }
      }
    });

    let totalGroupOutput = new Big(0);
    let totalGroupInput = new Big(0);

    for (const record of activeLedgers) {
      if (record.invoiceRef && record.invoiceRef.startsWith('INTRA-GROUP-')) {
        continue;
      }

      const val = new Big(record.amountInCents.toString());
      if (record.accountCode === 'VAT-OUTPUT') {
        totalGroupOutput = totalGroupOutput.plus(val);
      } else if (record.accountCode === 'VAT-INPUT') {
        totalGroupInput = totalGroupInput.plus(val);
      }
    }

    const netConsolidatedBalance = totalGroupOutput.minus(totalGroupInput);

    return {
      parentGroupTin: parent.tin,
      subTenantsCount: parent.subTenants.length,
      consolidatedOutputCents: BigInt(totalGroupOutput.toFixed(0)),
      consolidatedInputCents: BigInt(totalGroupInput.toFixed(0)),
      netDueCents: BigInt(netConsolidatedBalance.abs().toFixed(0)),
      isRefundClaim: netConsolidatedBalance.lt(0)
    };
  }
}