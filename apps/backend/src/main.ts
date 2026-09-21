import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EventBus } from '@ovds/core';
import { ModuleBootstrap } from '@ovds/core';
import * as express from 'express';

import { AppModule } from './app.module';
import { OnPremiseMigrationBootstrapper } from './bootstrap/on-premise-migration.bootstrapper';
import { CookieParserMiddleware } from './common/cookie-parser.middleware';
import { CorsService } from './common/cors.service';
import { CsrfProtectionMiddleware } from './common/csrf-protection.middleware';
import { PrismaService } from './common/prisma.service';
import { SanitizeInputMiddleware } from './common/sanitize-input.middleware';
import { SecurityHeadersMiddleware } from './common/security-headers.middleware';
import { TenantContextInterceptor } from './common/tenant-context.middleware';
import { TenantSubdomainMiddleware } from './common/tenant-subdomain.middleware';

const validModes = ['CLOUD_SAAS', 'ON_PREMISE_SINGLE', 'ON_PREMISE_MULTI'];
const mode = process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS';
if (!validModes.includes(mode)) {
  throw new Error(
    `Invalid DEPLOYMENT_MODE '${mode}'. Valid values: ${validModes.join(', ')}.`,
  );
}

if (process.argv.includes('--rollback')) {
  OnPremiseMigrationBootstrapper.runRollback();
  process.exit(0);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    // Buffer log messages until a custom logger is attached so nothing is
    // lost during the synchronous module-graph construction phase.
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = parseInt(process.env['PORT'] ?? configService.get('PORT', '3001'), 10);
  const apiPrefix = configService.get('API_PREFIX', 'api');

  logger.log(`Deployment mode: ${process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS'}`);

  app.setGlobalPrefix(apiPrefix);

  // ── Body-size limits (explicit, not relying on framework defaults) ────────
  // json: 512 KB covers all realistic API payloads; urlencoded: 64 KB.
  // Larger uploads must use multipart (handled per-route by FileInterceptor).
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.use(express.json({ limit: '512kb' }));
  httpAdapter.use(express.urlencoded({ extended: true, limit: '64kb' }));

  // ── Strip dangerous inbound headers that could confuse middleware ─────────
  // x-forwarded-host spoofing can bypass host-based tenant resolution.
  // x-original-url / x-rewrite-url can smuggle alternate paths past guards.
  httpAdapter.use((_req: any, _res: any, next: () => void) => {
    delete _req.headers['x-forwarded-host'];
    delete _req.headers['x-original-url'];
    delete _req.headers['x-rewrite-url'];
    next();
  });

  // Enable Socket.IO WebSocket adapter
   
  app.useWebSocketAdapter(new IoAdapter(app) as any);

  // ── Middleware — construct each instance once, then bind ─────────────────
  // Instantiating the class twice (once for `new`, once for `.bind`) was the
  // prior pattern; fixed here to avoid unnecessary double-allocation.
  const cookieParser = new CookieParserMiddleware();
  app.use(cookieParser.use.bind(cookieParser));

  const sanitize = new SanitizeInputMiddleware();
  app.use(sanitize.use.bind(sanitize));

  const securityHeaders = new SecurityHeadersMiddleware(configService);
  app.use(securityHeaders.use.bind(securityHeaders));

  const csrf = new CsrfProtectionMiddleware();
  app.use(csrf.use.bind(csrf));

  const tenantSubdomain = new TenantSubdomainMiddleware(app.get(PrismaService));
  app.use(tenantSubdomain.use.bind(tenantSubdomain));

  app.useGlobalInterceptors(new TenantContextInterceptor());

  // Payload size limits to prevent DoS — handled by NestJS built-in body parsing

  // CORS configuration
  const corsService = app.get(CorsService);
  const corsConfig = corsService.getCorsConfig();
  app.enableCors(corsConfig);

  const eventBus = EventBus.getInstance();
  const container = {
    prisma: app.get(PrismaService),
    eventBus,
    settings: configService,
    logger,
  };

  // ── Module bootstrap ─────────────────────────────────────────────────────
  // Health checks are opt-in via env var so cold starts in production or CI
  // are not blocked waiting for every external service to respond.
  // Set RUN_HEALTH_CHECKS_ON_BOOT=true in .env.production to re-enable.
  const runHealthChecks = process.env.RUN_HEALTH_CHECKS_ON_BOOT === 'true';
  const bootstrapResult = await ModuleBootstrap.getInstance().bootstrap({
    eventBus,
    container,
    runHealthChecks,
  });

  if (bootstrapResult.errors.length > 0) {
    for (const err of bootstrapResult.errors) {
      logger.error(`Module bootstrap error [${err.name}] (${err.phase}): ${err.message}`);
    }
  }
  logger.log(`Booted modules: ${bootstrapResult.names.join(', ')}`);

  if (bootstrapResult.healthResults) {
    const unhealthy = bootstrapResult.healthResults.filter((h: { status: string }) => h.status === 'unhealthy');
    if (unhealthy.length > 0) {
      logger.warn(`Unhealthy modules: ${unhealthy.map((h: { name: string; message?: string }) => `${h.name}: ${h.message}`).join(', ')}`);
    }
  }

  // ── OpenAPI / Swagger ────────────────────────────────────────────────────
  // Built only when explicitly enabled or in non-production environments.
  // In production set ENABLE_SWAGGER=true (e.g. for ZAP security scans in CI).
  // The ZAP scan target is /api/openapi.json — keep jsonDocumentUrl in sync.
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('OVDS SaaS API')
      .setDescription('OVDS backend — EIMS / MoR, finance, and enterprise modules')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/openapi`, app, document, {
      jsonDocumentUrl: 'openapi.json',
    });
    logger.log(`Swagger UI available at /${apiPrefix}/openapi`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`API prefix: /${apiPrefix}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
