# 16 — Service Providers and Application Bootstrap

## 1. Application Bootstrap Flow

```
main.ts
  └── AppModule
        ├── ConfigModule (global)
        ├── PrismaModule (global)
        ├── TenantModule (global)
        ├── AuthModule
        ├── QueueModule
        ├── EventBusModule
        ├── HealthModule
        └── Feature Modules...
```

## 2. App Module Configuration

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@api-core/prisma';
import { TenantModule } from '@api-core/tenant';
import { AuthModule } from '@api-core/auth';
import { QueueModule } from '@api-core/queue';
import { EventBusModule } from '@api-core/events';
import { HealthModule } from '@api-core/health';
import { OrganizationsModule } from '@feature/organizations';
import { UsersModule } from '@feature/users';
import { VatRegistrationsModule } from '@feature/vat-registrations';
import { VatReturnsModule } from '@feature/vat-returns';
import { TransactionsModule } from '@feature/transactions';
import { IntegrationsModule } from '@feature/integrations';
import { BillingModule } from '@feature/billing';
import { ReportingModule } from '@feature/reporting';
import { NotificationsModule } from '@feature/notifications';
import { AuditModule } from '@api-core/audit';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV}`],
    }),
    PrismaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        datasources: {
          shared: { url: config.get('DATABASE_SHARED_URL') },
          tenant: { url: config.get('DATABASE_TENANT_URL') },
        },
        middleware: [tenantMiddleware, softDeleteMiddleware, auditMiddleware],
      }),
      inject: [ConfigService],
    }),
    TenantModule,
    AuthModule,
    ScheduleModule.forRoot(),
    QueueModule,
    EventBusModule,
    HealthModule,
    OrganizationsModule,
    UsersModule,
    VatRegistrationsModule,
    VatReturnsModule,
    TransactionsModule,
    IntegrationsModule,
    BillingModule,
    ReportingModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {}
```

## 3. Main Bootstrap

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from '@api-core/common';
import { PrismaExceptionFilter } from '@api-core/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(','),
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Global exception filters
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  // Prefix
  app.setGlobalPrefix('api/v1');

  // OpenAPI
  const config = new DocumentBuilder()
    .setTitle('VAT Declaration System API')
    .setDescription('Online VAT Declaration SaaS API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('vat-returns')
    .addTag('transactions')
    .addTag('integrations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
```

## 4. Core Service Providers

### 4.1 Prisma Module

```typescript
// libs/api-core/prisma/src/prisma.module.ts
@Module({})
export class PrismaModule {
  static forRootAsync(options: PrismaModuleAsyncOptions): DynamicModule {
    return {
      module: PrismaModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: PRISMA_SERVICE,
          useFactory: async (config: ConfigService) => {
            const service = new PrismaService();
            await service.connect(options.datasources);
            return service;
          },
          inject: [ConfigService],
        },
      ],
      exports: [PRISMA_SERVICE],
    };
  }

  static forFeature(models: string[]): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        ...models.map((model) => ({
          provide: `${model.toUpperCase()}_REPOSITORY`,
          useFactory: (prisma: PrismaService) => {
            return new BaseRepository(prisma, model);
          },
          inject: [PRISMA_SERVICE],
        })),
      ],
      exports: [...models.map((model) => `${model.toUpperCase()}_REPOSITORY`)],
    };
  }
}
```

### 4.2 Tenant Module

```typescript
// libs/api-core/tenant/src/tenant.module.ts
@Module({
  imports: [ConfigModule],
  providers: [TenantResolverService, TenantMiddleware, TenantGuard],
  exports: [TenantResolverService, TenantContext],
})
export class TenantModule {}
```

### 4.3 Event Bus Module

```typescript
// libs/api-core/events/src/event-bus.module.ts
@Module({
  imports: [ConfigModule],
  providers: [EventBusService, ...EventListeners],
  exports: [EventBusService],
})
export class EventBusModule {
  constructor(private readonly eventBus: EventBusService) {
    // Auto-register listeners
    const listeners = Reflect.getMetadata('events:subscribe', EventBusModule) || [];
    listeners.forEach((eventClass) => {
      // Register listener
    });
  }
}
```

## 5. Feature Module Registration

```typescript
// feature/vat-returns/src/lib/vat-returns.module.ts
@Module({
  imports: [
    PrismaModule.forFeature(['VatReturn', 'VatReturnItem', 'VatReturnHistory']),
    CommonModule,
  ],
  controllers: [VatReturnsController, VatReturnItemsController],
  providers: [
    VatReturnsService,
    VatReturnRepository,
    VatReturnItemService,
    VatReturnValidator,
    VatReturnCalculator,
  ],
  exports: [VatReturnsService, VatReturnRepository],
})
export class VatReturnsModule {}
```

## 6. Global Exception Filters

```typescript
// libs/api-core/common/src/filters/prisma-exception.filter.ts
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = this.mapStatusCode(exception.code);

    response.status(status).json({
      success: false,
      error: {
        code: exception.code,
        message: this.mapMessage(exception.code),
        details: exception.meta,
      },
    });
  }

  private mapStatusCode(code: string): number {
    switch (code) {
      case 'P2002':
        return 409; // Unique constraint violation
      case 'P2025':
        return 404; // Record not found
      case 'P2003':
        return 400; // Foreign key constraint
      default:
        return 500;
    }
  }
}
```

## 7. Global Interceptors

```typescript
// libs/api-core/common/src/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) return data;
        if (data instanceof Response) return data; // Let file responses through
        return {
          success: true,
          data,
          meta: this.buildMeta(context),
        };
      }),
    );
  }

  private buildMeta(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    return {
      requestId: request.id,
      timestamp: new Date().toISOString(),
      ...(response.locals?.pagination ? { pagination: response.locals.pagination } : {}),
    };
  }
}
```

## 8. Custom Decorators

```typescript
// libs/api-core/common/src/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.organization;
  },
);

export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

export const Public = () => SetMetadata('isPublic', true);
```

## 9. Middleware Pipeline

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware order matters
  app.use(new PrismaTenantMiddleware().use);
  app.use(new RequestLoggerMiddleware().use);
  app.use(new RateLimitMiddleware().use);
  app.use(new CorsMiddleware().use);
  app.use(new HelmetMiddleware().use);

  // ... rest of bootstrap
}
```

## 10. Graceful Shutdown

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Graceful shutdown hooks
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await app.close();
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await app.close();
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });

  await app.listen(3001);
}
```
