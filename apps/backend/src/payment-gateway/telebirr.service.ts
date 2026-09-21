import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import {
  TelebirrInitiateRequestDto,
  TelebirrInitiateResponseDto,
  TelebirrCallbackDto,
  TelebirrPaymentStatus,
  TelebirrRefundRequestDto,
  TelebirrRefundResponseDto,
  TelebirrStatusQueryDto,
  TelebirrStatusResponseDto,
} from './dto/telebirr.dto';
import { TelebirrCryptoService, TelebirrConfigService } from './telebirr-crypto.service';

@Injectable()
export class TelebirrService {
  private readonly logger = new Logger(TelebirrService.name);
  private readonly config: ReturnType<TelebirrConfigService['getConfig']>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cryptoService: TelebirrCryptoService,
    private readonly configProvider: TelebirrConfigService,
  ) {
    this.config = this.configProvider.getConfig();
  }

  async initiatePayment(request: TelebirrInitiateRequestDto): Promise<TelebirrInitiateResponseDto> {
    const validation = this.configProvider.validateConfig();
    if (!validation.valid) {
      this.logger.error(`Telebirr configuration incomplete: ${validation.missing.join(', ')}`);
      throw new HttpException(
        'Payment gateway configuration incomplete',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const referenceId = this.cryptoService.generateReferenceId();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const params: Record<string, string> = {
      merchant_id: this.config.merchantId,
      api_key: this.config.apiKey,
      transaction_id: request.transactionId,
      reference_id: referenceId,
      amount: request.amount.toFixed(2),
      currency: request.currency,
      customer_phone: request.customerPhone,
      customer_email: request.customerEmail,
      callback_url: request.callbackUrl || this.config.callbackUrl,
      transaction_type: request.transactionType,
      expires_at: expiresAt.toISOString(),
    };

    const signature = this.cryptoService.generateSignature(params, this.config.secretKey);
    params['signature'] = signature;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.config.baseUrl}/v1/payments/initiate`, params, {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': this.config.merchantId,
          },
          timeout: 30000,
        }),
      );

      if (response.data.success && response.data.payment_url) {
        return {
          success: true,
          transactionId: request.transactionId,
          paymentUrl: response.data.payment_url,
          referenceId,
          expiresAt,
        };
      }

      throw new HttpException(
        response.data.message || 'Payment initiation failed',
        HttpStatus.BAD_GATEWAY,
      );
    } catch (error: any) {
      this.logger.error(`Telebirr payment initiation failed: ${error.message}`);
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Payment gateway error',
          error.response.status,
        );
      }
      throw new HttpException(
        'Failed to connect to payment gateway',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async handleCallback(callback: TelebirrCallbackDto): Promise<{ verified: boolean; data?: TelebirrCallbackDto }> {
    const params = {
      transaction_id: callback.transactionId,
      reference_id: callback.referenceId,
      status: callback.status,
      amount: callback.amount.toFixed(2),
      currency: callback.currency,
      paid_at: callback.paidAt || '',
    };

    const isValid = this.cryptoService.verifySignature(params, callback.signature, this.config.secretKey);

    if (!isValid) {
      this.logger.warn(`Invalid signature for transaction ${callback.transactionId}`);
      return { verified: false };
    }

    return { verified: true, data: callback };
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    return this.cryptoService.verifyWebhookSignature(payload, signature, this.config.webhookSecret);
  }

  async queryStatus(query: TelebirrStatusQueryDto): Promise<TelebirrStatusResponseDto> {
    const params: Record<string, string> = {
      merchant_id: this.config.merchantId,
      api_key: this.config.apiKey,
      transaction_id: query.transactionId,
    };

    const signature = this.cryptoService.generateSignature(params, this.config.secretKey);
    params['signature'] = signature;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.config.baseUrl}/v1/payments/status`, params, {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': this.config.merchantId,
          },
          timeout: 15000,
        }),
      );

      return {
        transactionId: query.transactionId,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        paidAt: response.data.paid_at,
        failureReason: response.data.failure_reason,
      };
    } catch (error: any) {
      this.logger.error(`Telebirr status query failed: ${error.message}`);
      throw new HttpException(
        'Failed to query payment status',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async processRefund(request: TelebirrRefundRequestDto): Promise<TelebirrRefundResponseDto> {
    const params: Record<string, string> = {
      merchant_id: this.config.merchantId,
      api_key: this.config.apiKey,
      original_transaction_id: request.originalTransactionId,
      amount: request.amount.toFixed(2),
      reason: request.reason || 'Customer requested refund',
    };

    const signature = this.cryptoService.generateSignature(params, this.config.secretKey);
    params['signature'] = signature;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.config.baseUrl}/v1/payments/refund`, params, {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': this.config.merchantId,
          },
          timeout: 30000,
        }),
      );

      return {
        success: response.data.success,
        refundId: response.data.refund_id,
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error: any) {
      this.logger.error(`Telebirr refund failed: ${error.message}`);
      throw new HttpException(
        'Failed to process refund',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  mapStatusToInternal(telebirrStatus: TelebirrPaymentStatus): string {
    const statusMap: Record<TelebirrPaymentStatus, string> = {
      [TelebirrPaymentStatus.PENDING]: 'PENDING',
      [TelebirrPaymentStatus.SUCCESS]: 'COMPLETED',
      [TelebirrPaymentStatus.FAILED]: 'FAILED',
      [TelebirrPaymentStatus.CANCELLED]: 'CANCELLED',
      [TelebirrPaymentStatus.EXPIRED]: 'EXPIRED',
    };
    return statusMap[telebirrStatus] || 'UNKNOWN';
  }
}