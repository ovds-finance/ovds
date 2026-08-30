import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CorsConfig {
  origin: string | string[] | boolean;
  credentials: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

@Injectable()
export class CorsService {
  private readonly allowedOrigins: string[];
  private readonly isDevelopment: boolean;

  constructor(private configService?: ConfigService) {
    this.isDevelopment = configService?.get('NODE_ENV') === 'development' || process.env.NODE_ENV === 'test';
    
    const originsConfig = configService?.get<string>('CORS_ORIGIN', '') ?? process.env.CORS_ORIGIN ?? '';
    this.allowedOrigins = originsConfig
      .split(',')
      .map((o: string) => o.trim())
      .filter((o: string) => o.length > 0);
  }

  getCorsConfig(): CorsConfig {
    const devOrigins = (this.configService?.get<string>('CORS_DEV_ORIGINS', '') ?? process.env.CORS_DEV_ORIGINS ?? '')
      .split(',')
      .map((o: string) => o.trim())
      .filter((o: string) => o.length > 0);
    if (this.isDevelopment) {
      return {
        origin: devOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
          'X-CSRF-Token',
        ],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Current-Page'],
        maxAge: parseInt(this.configService?.get('CORS_MAX_AGE', '86400') ?? '86400', 10),
      };
    }

    // In production, use configured origins
    // Never use wildcard (*) with credentials in production
    const origin = this.allowedOrigins.length > 0 
      ? this.allowedOrigins 
      : false; // Reject all origins if none configured

    return {
      origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token',
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Current-Page'],
      maxAge: parseInt(this.configService?.get('CORS_MAX_AGE', '86400') ?? '86400', 10),
    };
  }

  validateOrigin(origin: string): boolean {
    if (this.isDevelopment) {
      return true;
    }
    return this.allowedOrigins.includes(origin);
  }

  getAllowedOrigins(): string[] {
    return this.allowedOrigins;
  }
}
