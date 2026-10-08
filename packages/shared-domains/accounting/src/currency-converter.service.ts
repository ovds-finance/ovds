import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

@Injectable()
export class CurrencyConverterService {
  private prisma = new PrismaClient();

  async convertToReportingCurrency(
    tenantId: string,
    sourceCurrency: string,
    amount: number,
    transactionDate: Date
  ): Promise<{ exchangeRate: number; translatedAmount: number }> {
    const tenantConfig = await this.prisma.$queryRaw<any[]>`
      SELECT "baseCurrency" FROM "TenantAccountingSetting" WHERE "tenantId" = ${tenantId} LIMIT 1
    `;

    if (!tenantConfig || tenantConfig.length === 0) {
      throw new Error(`Accounting profile settings not found for tenant context: ${tenantId}`);
    }

    const targetCurrency = tenantConfig[0].baseCurrency;

    if (sourceCurrency === targetCurrency) {
      return { exchangeRate: 1.0, translatedAmount: amount };
    }

    const rateRecord = await this.prisma.$queryRaw<any[]>`
      SELECT "rate" FROM "HistoricalExchangeRate"
      WHERE "tenantId" = ${tenantId}
        AND "fromCurrency" = ${sourceCurrency}
        AND "toCurrency" = ${targetCurrency}
        AND "effectiveDate" <= ${transactionDate}
      ORDER BY "effectiveDate" DESC
      LIMIT 1
    `;

    if (!rateRecord || rateRecord.length === 0) {
      throw new Error(`Missing conversion index from [${sourceCurrency}] to [${targetCurrency}] for this period.`);
    }

    const exchangeRate = Number(rateRecord[0].rate);
    const translatedAmount = Number((amount * exchangeRate).toFixed(4));

    return { exchangeRate, translatedAmount };
  }
}
