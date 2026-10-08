import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export interface CapExAssetRecord {
  tenantId: string;
  assetId: string;
  totalVatPaidCents: bigint;
  amortizationPeriodYears: number;
  initialFilingPeriod: string;
}

@Injectable()
export class CapExAmortizationService {
  constructor(private prisma: PrismaService) {}

  async computeAndRecordAnnualAmortization(dto: CapExAssetRecord, currentFiscalYear: number) {
    const totalVat = new Big(dto.totalVatPaidCents.toString());
    const years = new Big(dto.amortizationPeriodYears.toString());

    if (years.lte(0)) {
      throw new BadRequestException('Amortization period must be greater than zero.');
    }

    const annualDeductibleCents = totalVat.div(years).round(0, Big.roundHalfUp).toString();
    const annualBigInt = BigInt(annualDeductibleCents);

    return this.prisma.$transaction(async (tx) => {
      const ledgerEntry = await tx.generalLedger.create({
        data: {
          tenantId: dto.tenantId,
          invoiceRef: `CAPEX-AMORT-${dto.assetId}-YR-${currentFiscalYear}`,
          accountCode: 'VAT-INPUT',
          entryType: 'DEBIT',
          amountInCents: annualBigInt,
        }
      });

      return {
        success: true,
        ledgerId: ledgerEntry.id,
        deductedCentsThisYear: annualBigInt
      };
    });
  }
}