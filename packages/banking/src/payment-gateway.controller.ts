import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as crypto from 'crypto';

import { PaymentGatewayService } from './payment-gateway.service';
import { type PaymentProviderStatus, type PaymentResult } from './dto/payment-gateway.dto';

interface TelebirrCallbackDto {
  msisdn: string;
  totalAmount: string;
  transactionNo: string;
  outTradeNo: string;
  updatedTime: string;
}

interface CbeCallbackDto {
  transactionId: string;
  referenceNumber: string;
  amount: string;
  currency: string;
  status: string;
}

@ApiTags('payment-gateway')
@Controller('api/v1/payment-callbacks')
export class PaymentGatewayController {
  private readonly logger = new Logger(PaymentGatewayController.name);

  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  @Post('telebirr-webhook')
  @ApiOperation({ summary: 'Handle Telebirr payment webhook callback' })
  async handleTelebirrHook(
    @Body() payload: TelebirrCallbackDto,
    @Headers('x-telebirr-signature') signature: string,
  ): Promise<{ status: string; payment: PaymentResult }> {
    const isVerified = this.verifyTelebirrSignature(payload, signature);
    if (!isVerified) {
      throw new BadRequestException('Cryptographic Webhook Validation Handshake Failed');
    }

    const result = await this.paymentGatewayService.processTelebirrCallback(payload);
    return { status: 'ok', payment: result };
  }

  @Post('cbe-webhook')
  @ApiOperation({ summary: 'Handle CBE Core Banking webhook callback' })
  async handleCbeHook(@Body() payload: CbeCallbackDto): Promise<{ status: string; payment: PaymentResult }> {
    const result = await this.paymentGatewayService.processCbeCallback(payload);
    return { status: 'ok', payment: result };
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a payment via a supported provider' })
  async initiatePayment(@Body() input: { provider: 'TELEBIRR' | 'CBE_MOBILE' | 'BANK_TRANSFER'; amount: number; referenceNumber: string; currency?: string }) {
    return this.paymentGatewayService.initiatePayment(input);
  }

  @Get('status/:reference')
  @ApiOperation({ summary: 'Check payment status by reference number' })
  async getPaymentStatus(@Param('reference') reference: string) {
    return this.paymentGatewayService.getPaymentStatus(reference);
  }

  private verifyTelebirrSignature(payload: TelebirrCallbackDto, signature: string): boolean {
    if (!signature) return false;
    const publicKey = process.env.TELEBIRR_PUBLIC_KEY || 'mock-public-key';
    const verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(payload));
    try {
      return verifier.verify(publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }
}
