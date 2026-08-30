import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, InjectThrottlerOptions, InjectThrottlerStorage, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { THROTTLE_OPTIONS, ThrottleOptions } from './throttle.decorator';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

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

  protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: any) {
    const ttlSeconds = Math.max(1, Math.ceil((throttlerLimitDetail?.ttl ?? 60) / 1000));
    throw new BadRequestException({
      message: 'Too many requests. Please try again later.',
      retryAfter: `${ttlSeconds} seconds`,
    });
  }
}
