import { Controller, Post, Body, Get, Param, Query, Headers, RawBodyRequest, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';

import {
  TelebirrInitiateRequestDto,
  TelebirrInitiateResponseDto,
  TelebirrCallbackDto,
  TelebirrWebhookDto,
  TelebirrRefundRequestDto,
  TelebirrRefundResponseDto,
  TelebirrStatusQueryDto,
  TelebirrStatusResponseDto,
} from './dto/telebirr.dto';
import { TelebirrService } from './telebirr.service';

@ApiTags('Payment Gateway - Telebirr')
@ApiBearerAuth()
@Controller('api/payments/telebirr')
export class TelebirrController {
  private readonly logger = new Logger(TelebirrController.name);

  constructor(private readonly telebirrService: TelebirrService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a Telebirr payment' })
  @ApiResponse({ status: 201, type: TelebirrInitiateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 503, description: 'Payment gateway unavailable' })
  async initiatePayment(
    @Body() request: TelebirrInitiateRequestDto,
  ): Promise<TelebirrInitiateResponseDto> {
    this.logger.log(`Initiating Telebirr payment for transaction: ${request.transactionId}`);
    return this.telebirrService.initiatePayment(request);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Telebirr payment callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleCallback(@Body() callback: TelebirrCallbackDto): Promise<{ received: boolean }> {
    this.logger.log(`Received Telebirr callback for transaction: ${callback.transactionId}, status: ${callback.status}`);
    
    const result = await this.telebirrService.handleCallback(callback);
    
    if (!result.verified) {
      this.logger.warn(`Invalid callback signature for transaction: ${callback.transactionId}`);
      return { received: true };
    }

    // TODO: Emit event for payment processing (integrate with event system)
    // this.eventEmitter.emit('payment.completed', result.data);

    return { received: true };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Telebirr webhook events' })
  @ApiHeader({ name: 'X-Telebirr-Signature', description: 'Webhook signature for verification' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-telebirr-signature') signature: string,
    @Body() webhook: TelebirrWebhookDto,
  ): Promise<{ received: boolean }> {
    const payload = req.rawBody?.toString() || JSON.stringify(webhook);
    
    this.logger.log(`Received Telebirr webhook: ${webhook.event} for transaction: ${webhook.data.transactionId}`);

    const isValid = await this.telebirrService.verifyWebhook(payload, signature);
    
    if (!isValid) {
      this.logger.warn(`Invalid webhook signature for event: ${webhook.event}`);
      return { received: true };
    }

    // TODO: Process webhook event based on type
    // this.eventEmitter.emit(`telebirr.${webhook.event}`, webhook.data);

    return { received: true };
  }

  @Post('refund')
  @ApiOperation({ summary: 'Process a refund via Telebirr' })
  @ApiResponse({ status: 200, type: TelebirrRefundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  @ApiResponse({ status: 503, description: 'Payment gateway unavailable' })
  async processRefund(
    @Body() request: TelebirrRefundRequestDto,
  ): Promise<TelebirrRefundResponseDto> {
    this.logger.log(`Processing Telebirr refund for transaction: ${request.originalTransactionId}`);
    return this.telebirrService.processRefund(request);
  }

  @Get('status/:transactionId')
  @ApiOperation({ summary: 'Query payment status from Telebirr' })
  @ApiResponse({ status: 200, type: TelebirrStatusResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 503, description: 'Payment gateway unavailable' })
  async queryStatus(
    @Param('transactionId') transactionId: string,
  ): Promise<TelebirrStatusResponseDto> {
    this.logger.log(`Querying Telebirr status for transaction: ${transactionId}`);
    return this.telebirrService.queryStatus({ transactionId });
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Telebirr gateway connectivity' })
  @ApiResponse({ status: 200, description: 'Gateway reachable' })
  @ApiResponse({ status: 503, description: 'Gateway unreachable' })
  async healthCheck(): Promise<{ status: string; gateway: string }> {
    // TODO: Implement actual health check against Telebirr API
    return { status: 'ok', gateway: 'telebirr' };
  }
}