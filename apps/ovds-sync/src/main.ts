'use strict';

import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { OfflineSyncModule } from './offline-sync.module';

const logger = new Logger('OvdsSyncBootstrap');

/**
 * Minimal exception filter for the ovds-sync HTTP server.
 * Returns a consistent JSON error envelope so load-balancer health checks
 * and POS clients never receive a raw NestJS HTML error page.
 */
function createHttpExceptionFilter() {
  // `HttpException` is imported at module scope rather than pulled in with an
  // inline `require('@nestjs/common')`. A required symbol is typed `any`, so
  // `exception instanceof HttpException` could not narrow `exception` from
  // `unknown` and the two accesses below failed to compile.
  @Catch()
  class SyncExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const message =
        exception instanceof HttpException
          ? exception.message
          : 'Internal sync server error';

      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        logger.error(
          `[${request?.method} ${request?.url}] ${exception instanceof Error ? exception.message : String(exception)}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      }

      response.status(status).json({
        statusCode: status,
        message: process.env.NODE_ENV === 'production' && status === 500
          ? 'An unexpected error occurred.'
          : message,
        timestamp: new Date().toISOString(),
        path: request?.url ?? 'unknown',
        service: 'ovds-sync',
      });
    }
  }

  return new SyncExceptionFilter();
}

async function bootstrap(): Promise<void> {
  const isWorker = process.env.SYNC_MODE === 'worker';

  if (isWorker) {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      OfflineSyncModule,
      {
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          retryAttempts: 5,
          retryDelay: 3000,
        },
      },
    );
    await app.listen();
    logger.log('OVDS Sync worker listening on Redis transport');
  } else {
    const app = await NestFactory.create(OfflineSyncModule);

    // Global exception filter — consistent error envelope for all HTTP errors
    app.useGlobalFilters(createHttpExceptionFilter());

    // Validation pipe — rejects malformed batch payloads before they reach the processor
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );

    // CORS — allow POS terminals on local network to POST batch payloads
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') ?? false,
      methods: ['GET', 'POST'],
    });

    const port = parseInt(process.env.PORT || '3003', 10);
    await app.listen(port, '0.0.0.0');
    logger.log(`OVDS Sync server running on http://0.0.0.0:${port}`);
  }
}

bootstrap().catch((error: unknown) => {
  logger.error('Failed to bootstrap OVDS Sync microservice:', error instanceof Error ? error : String(error));
  process.exit(1);
});
