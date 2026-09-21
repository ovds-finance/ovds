import { createHmac, timingSafeEqual } from 'crypto';

import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookVerificationGuard {
  private readonly secrets: Record<string, string>;

  constructor(private configService?: ConfigService) {
    this.secrets = {
      chapa: this.configService?.get('CHAPA_SECRET', '') ?? '',
      mobile_money: this.configService?.get('MOBILE_MONEY_API_KEY', '') ?? '',
      eims: this.configService?.get('EIMS_CLIENT_SECRET', '') ?? '',
    };
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provider = request.params?.provider || request.body?.provider;

    if (!provider || !this.secrets[provider]) {
      return true;
    }

    const signature = request.headers['x-webhook-signature'] || request.headers['x-signature'];
    const timestamp = request.headers['x-webhook-timestamp'] || request.headers['x-timestamp'];

    if (!signature || !timestamp) {
      throw new BadRequestException('Missing webhook signature or timestamp');
    }

    const payload = this.getRawBody(request);
    const expectedSignature = this.computeSignature(provider, timestamp, payload);

    if (!this.verifySignature(signature as string, expectedSignature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    return true;
  }

  private getRawBody(request: any): string {
    if (request.rawBody) {
      return request.rawBody.toString();
    }
    return JSON.stringify(request.body || {});
  }

  private computeSignature(provider: string, timestamp: string, payload: string): string {
    const secret = this.secrets[provider];
    const message = `${timestamp}.${payload}`;
    return createHmac('sha256', secret).update(message).digest('hex');
  }

  private verifySignature(provided: string, expected: string): boolean {
    if (provided.length !== expected.length) {
      return false;
    }
    try {
      return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}
