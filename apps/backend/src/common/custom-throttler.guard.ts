import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, InjectThrottlerOptions, InjectThrottlerStorage, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Request } from 'express';

import { THROTTLE_OPTIONS, ThrottleOptions } from './throttle.decorator';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Request): Promise<string> {
    const ip = (req as any).ip || (req as any).connection?.remoteAddress || 'unknown';
    const route = (req as any).route?.path || req.url;
    return `${ip}:${route}`;
  }

  protected async throwThrottlingException(_context: ExecutionContext, throttlerLimitDetail: any) {
    // RFC 6585 §4 requires HTTP 429 for rate limiting — not 400.
    // Some WAFs and client SDKs rely on 429 to trigger automatic backoff.
    const ttlSeconds = Math.max(1, Math.ceil((throttlerLimitDetail?.ttl ?? 60) / 1000));
    const { HttpException, HttpStatus } = require('@nestjs/common');
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        errorCode: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retryAfter: `${ttlSeconds} seconds`,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
