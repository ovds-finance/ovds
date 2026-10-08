import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export interface TaxPeriodSummary {
  inputVatTotal: string;
  outputVatTotal: string;
  netVatDue: string;
  isRefund: boolean;
}

@Injectable()
export class VatAggregatorService {
  constructor(private prisma: PrismaService) {}

  async computePeriodSummary(tenantId: string, startDate: Date, endDate: Date): Promise<TaxPeriodSummary> {
    const records = await this.prisma.generalLedger.findMany({
      where: {
        tenantId,
        postedAt: { gte: startDate, lte: endDate },
      },
    });

    let inputTotal = new Big(0);
    let outputTotal = new Big(0);

    for (const record of records) {
      const amount = new Big(record.amountInCents.toString());
      if (record.accountCode === 'VAT-INPUT') {
        inputTotal = inputTotal.plus(amount);
      } else if (record.accountCode === 'VAT-OUTPUT') {
        outputTotal = outputTotal.plus(amount);
      }
    }

    const netDue = outputTotal.minus(inputTotal);
    const isRefund = netDue.lt(0);

    return {
      inputVatTotal: inputTotal.div(100).toFixed(2),
      outputVatTotal: outputTotal.div(100).toFixed(2),
      netVatDue: netDue.abs().div(100).toFixed(2),
      isRefund,
    };
  }
}