import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

export interface TelebirrConfig {
  merchantId: string;
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  callbackUrl: string;
  webhookSecret: string;
}

@Injectable()
export class TelebirrCryptoService {
  private readonly logger = new Logger(TelebirrCryptoService.name);

  generateSignature(params: Record<string, string>, secretKey: string): string {
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(queryString);
    return hmac.digest('hex').toUpperCase();
  }

  verifySignature(params: Record<string, string>, signature: string, secretKey: string): boolean {
    const expectedSignature = this.generateSignature(params, secretKey);
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }

  generateRequestId(): string {
    return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  generateReferenceId(): string {
    return `REF-${Date.now()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }

  encryptData(data: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decryptData(encryptedData: string, key: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  verifyWebhookSignature(payload: string, signature: string, webhookSecret: string): boolean {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }
}

@Injectable()
export class TelebirrConfigService {
  private readonly config: TelebirrConfig;

  constructor() {
    this.config = {
      merchantId: process.env.TEBIRR_MERCHANT_ID || '',
      apiKey: process.env.TEBIRR_API_KEY || '',
      secretKey: process.env.TEBIRR_SECRET_KEY || '',
      baseUrl: process.env.TEBIRR_BASE_URL || 'https://api.telebirr.et',
      callbackUrl: process.env.TEBIRR_CALLBACK_URL || '',
      webhookSecret: process.env.TEBIRR_WEBHOOK_SECRET || '',
    };
  }

  getConfig(): TelebirrConfig {
    return this.config;
  }

  validateConfig(): { valid: boolean; missing: string[] } {
    const required = ['merchantId', 'apiKey', 'secretKey', 'baseUrl', 'callbackUrl', 'webhookSecret'];
    const missing = required.filter((key) => !this.config[key as keyof TelebirrConfig]);
    return {
      valid: missing.length === 0,
      missing,
    };
  }
}