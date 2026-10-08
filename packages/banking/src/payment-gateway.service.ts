import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { DeclarationStatus } from '@ovds/database';

import { PRISMA_CLIENT, type PrismaServiceLike } from '@ovds/ledger';
import { type PaymentProviderStatus, type PaymentResult, type PaymentProvider } from './dto/payment-gateway.dto';

export interface InitiatePaymentInput {
  provider: PaymentProvider;
  amount: number;
  referenceNumber: string;
  currency?: string;
}

export interface TelebirrCallbackDto {
  msisdn: string;
  totalAmount: string;
  transactionNo: string;
  outTradeNo: string;
  updatedTime: string;
}

export interface CbeCallbackDto {
  transactionId: string;
  referenceNumber: string;
  amount: string;
  currency: string;
  status: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaServiceLike) {}

  async initiatePayment(input: InitiatePaymentInput): Promise<{ paymentReference: string; checkoutUrl?: string }> {
    const paymentReference = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let checkoutUrl: string | undefined;

    if (input.provider === 'TELEBIRR') {
      checkoutUrl = `https://telebirr.com/checkout?ref=${paymentReference}&amount=${input.amount}`;
    } else if (input.provider === 'CBE_MOBILE') {
      checkoutUrl = `https://cbe.com.et/mobilepay?ref=${paymentReference}&amount=${input.amount}`;
    } else if (input.provider === 'BANK_TRANSFER') {
      checkoutUrl = `ovds://bank-transfer?ref=${paymentReference}&amount=${input.amount}&currency=${input.currency || 'ETB'}`;
    }

    this.logger.log(`Payment initiated: ${paymentReference} via ${input.provider} for ${input.amount}`);
    return { paymentReference, checkoutUrl };
  }

  async processTelebirrCallback(payload: TelebirrCallbackDto): Promise<PaymentResult> {
    return this.prisma.$transaction(async (tx: any) => {
      const declaration = await tx.tenantVatDeclaration.findUnique({
        where: { id: payload.outTradeNo },
      });

      if (!declaration) {
        throw new NotFoundException('Target VAT declaration asset reference not found');
      }

      await tx.tenantVatDeclaration.update({
        where: { id: payload.outTradeNo },
        data: {
          status: DeclarationStatus.CLEARED,
          paymentReference: payload.transactionNo,
        },
      });

      return {
        paymentReference: payload.transactionNo,
        status: 'COMPLETED' as PaymentProviderStatus,
        providerTransactionId: payload.transactionNo,
        amount: payload.totalAmount,
        currency: 'ETB',
        paidAt: payload.updatedTime,
      };
    });
  }

  async processCbeCallback(payload: CbeCallbackDto): Promise<PaymentResult> {
    const declaration = await this.prisma.tenantVatDeclaration.findFirst({
      where: { paymentReference: payload.referenceNumber },
    });

    if (!declaration) {
      throw new NotFoundException(`Payment reference ${payload.referenceNumber} not found`);
    }

    return {
      paymentReference: payload.referenceNumber,
      status: payload.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
      providerTransactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
    };
  }

  async getPaymentStatus(referenceNumber: string): Promise<PaymentResult> {
    const declaration = await this.prisma.tenantVatDeclaration.findFirst({
      where: { paymentReference: referenceNumber },
      select: {
        paymentReference: true,
        netVatDue: true,
        status: true,
      },
    });

    if (declaration) {
      return {
        paymentReference: declaration.paymentReference!,
        status: declaration.status === 'CLEARED' ? 'COMPLETED' : 'PENDING',
        amount: declaration.netVatDue.toString(),
        currency: 'ETB',
      };
    }

    throw new NotFoundException(`Payment reference ${referenceNumber} not found`);
  }
}
