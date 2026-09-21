# 03 — NestJS Backend Architecture

## 1. Bounded Contexts

The backend is organized into bounded contexts mapped to NestJS modules. Each context owns its entities, services, controllers, and DTOs.

| Bounded Context     | NestJS Module                  | Core Entities                                | Key Responsibilities                              |
|---------------------|--------------------------------|----------------------------------------------|---------------------------------------------------|
| Identity & Access   | `AuthModule`, `UsersModule`    | User, OrganizationUser, Role, RefreshToken    | Authentication, authorization, user management    |
| Multi-Tenancy       | `TenantModule`                 | Organization                                  | Tenant resolution, scoping, context propagation    |
| Core VAT            | `VatRegistrationsModule`       | VatRegistration, Jurisdiction, VatRate        | Registration management, jurisdiction config       |
| VAT Returns         | `VatReturnsModule`             | VatReturn, VatReturnItem, VatReturnHistory    | Return CRUD, submission lifecycle, validation     |
| Transactions        | `TransactionsModule`           | Transaction                                   | Import, categorization, reconciliation            |
| Integrations        | `IntegrationsModule`           | Integration                                   | Third-party auth, sync, webhook handling          |
| Billing             | `BillingModule`                | Subscription, SubscriptionPlan                | Plan enforcement, invoicing, usage tracking        |
| Reporting           | `ReportingModule`              | Report                                        | Report generation, export, scheduled reports      |
| Notifications       | `NotificationsModule`          | Notification                                  | In-app, email, push notifications                 |
| Audit & Compliance  | `AuditModule`                  | AuditLog                                      | Immutable audit trail, compliance queries         |

## 2. Module Structure Pattern

Each feature module follows this structure:

```
libs/feature/vat-returns/src/lib/
├── vat-returns.module.ts
├── vat-returns.controller.ts
├── vat-returns.service.ts
├── vat-returns.repository.ts
├── dto/
│   ├── create-vat-return.dto.ts
│   ├── update-vat-return.dto.ts
│   ├── submit-vat-return.dto.ts
│   ├── query-vat-return.dto.ts
│   └── pagination.dto.ts
├── entities/
│   └── vat-return.entity.ts
├── interfaces/
│   ├── vat-return.interface.ts
│   └── vat-return-item.interface.ts
├── mappers/
│   └── vat-return.mapper.ts
├── validators/
│   └── vat-return.validator.ts
└── events/
    ├── vat-return-submitted.event.ts
    └── vat-return-accepted.event.ts
```

## 3. Application Module Wiring

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { JurisdictionsModule } from '@feature/jurisdictions';
import { IntegrationsModule } from '@feature/integrations';
import { BillingModule } from '@feature/billing';
import { ReportingModule } from '@feature/reporting';
import { NotificationsModule } from '@feature/notifications';
import { AuditModule } from '@api-core/audit';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantModule,
    AuthModule,
    QueueModule,
    EventBusModule,
    HealthModule,
    OrganizationsModule,
    UsersModule,
    VatRegistrationsModule,
    VatReturnsModule,
    TransactionsModule,
    JurisdictionsModule,
    IntegrationsModule,
    BillingModule,
    ReportingModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {}
```

## 4. Request Lifecycle

```
HTTP Request
    │
    ▼
[Global Guards]        ← JwtAuthGuard, TenantGuard, PermissionsGuard
    │
    ▼
[Global Interceptors]  ← LoggingInterceptor, TransformInterceptor, TimeoutInterceptor
    │
    ▼
[Route Guard]          ← Controller-level @UseGuards
    │
    ▼
[Validation Pipe]      ← ZodValidationPipe with DTO schema
    │
    ▼
[Controller]           ← Route handler, request DTO binding
    │
    ▼
[Service]              ← Business logic, transaction boundaries
    │
    ▼
[Repository]           ← Prisma client, scoped queries
    │
    ▼
[Response Interceptor] ← Standardized envelope, HATEOAS links
    │
    ▼
HTTP Response
```

## 5. Dependency Injection Pattern

Services depend on abstractions (interfaces), not concrete Prisma models:

```typescript
// interfaces/vat-return.repository.interface.ts
export interface IVatReturnRepository {
  findById(id: string, orgId: string): Promise<VatReturn | null>;
  findByPeriod(orgId: string, start: Date, end: Date): Promise<VatReturn[]>;
  create(data: CreateVatReturnDto): Promise<VatReturn>;
  update(id: string, orgId: string, data: UpdateVatReturnDto): Promise<VatReturn>;
  delete(id: string, orgId: string): Promise<void>;
}

// vat-return.repository.ts
@Injectable()
export class VatReturnRepository implements IVatReturnRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, orgId: string): Promise<VatReturn | null> {
    return this.prisma.vatReturn.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: { items: true, history: true },
    });
  }

  // ... other methods
}

// vat-returns.module.ts
@Module({
  providers: [
    VatReturnsService,
    {
      provide: 'IVatReturnRepository',
      useClass: VatReturnRepository,
    },
  ],
  controllers: [VatReturnsController],
})
export class VatReturnsModule {}
```

## 6. Guards

### 6.1 JwtAuthGuard

Validates JWT access token, attaches `currentUser` to request.

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### 6.2 TenantGuard

Resolves tenant context from subdomain, header, or JWT claim.

```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantService: TenantService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) throw new TenantNotFoundException();
    this.tenantService.setContext(tenantId);
    return true;
  }
}
```

### 6.3 PermissionsGuard

Enforces RBAC permissions using Casbin or custom role check.

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private casbin: CasbinService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndMerge<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resource = context.getClass().name;
    const action = context.getHandler().name;

    return this.casbin.enforce(user.id, resource, action, requiredPermissions);
  }
}
```

## 7. Interceptors

### 7.1 TransformInterceptor

Standardizes API response envelope:

```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        meta: this.buildMeta(context),
        links: this.buildLinks(context),
      })),
    );
  }
}
```

### 7.2 LoggingInterceptor

Logs request/response metadata with correlation IDs:

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.headers['x-correlation-id'] || generateId();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log({
          correlationId,
          method: request.method,
          url: request.url,
          status: response.statusCode,
          duration: Date.now() - start,
          userId: request.user?.id,
        });
      }),
    );
  }
}
```

## 8. Exception Filters

```typescript
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
}
```

## 9. DTOs and Validation

Use Zod for schema validation with class-transformer for DTO binding:

```typescript
// dto/submit-vat-return.dto.ts
import { z } from 'zod';

export const SubmitVatReturnSchema = z.object({
  returnId: z.string().cuid(),
  confirmAccuracy: z.boolean(),
  confirmSubmission: z.boolean(),
});

export type SubmitVatReturnDto = z.infer<typeof SubmitVatReturnSchema>;

// vat-returns.controller.ts
@Post(':id/submit')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Permissions('vat_returns.submit')
@UsePipes(new ZodValidationPipe(SubmitVatReturnSchema))
async submit(
  @Param('id') returnId: string,
  @Body() dto: SubmitVatReturnDto,
  @CurrentUser() user: User,
) {
  return this.vatReturnsService.submit(returnId, dto, user.id);
}
```

## 10. CQRS-Inspired Command/Query Separation

Read and write operations are separated at the service layer:

```typescript
// service/vat-return.service.ts
@Injectable()
export class VatReturnService {
  constructor(
    private readonly command: VatReturnCommand,
    private readonly query: VatReturnQuery,
  ) {}

  // Write path
  async create(dto: CreateVatReturnDto, userId: string): Promise<VatReturn> {
    return this.command.create(dto, userId);
  }

  async submit(id: string, dto: SubmitVatReturnDto, userId: string): Promise<VatReturn> {
    return this.command.submit(id, dto, userId);
  }

  // Read path
  async findById(id: string): Promise<VatReturn> {
    return this.query.findById(id);
  }

  async findMany(query: QueryVatReturnDto): Promise<PaginatedResult<VatReturn>> {
    return this.query.findMany(query);
  }
}
```

## 11. Event-Driven Architecture

Events are emitted for state changes and handled asynchronously:

```typescript
// events/vat-return-submitted.event.ts
export class VatReturnSubmittedEvent {
  constructor(
    public readonly returnId: string,
    public readonly organizationId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly submittedBy: string,
  ) {}
}

// listeners/vat-return-submission.listener.ts
@EventsListener(VatReturnSubmittedEvent)
export class VatReturnSubmittedListener {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async handle(event: VatReturnSubmittedEvent) {
    // 1. Submit to tax authority
    await this.integrationService.submitReturn(event.returnId);

    // 2. Send notification
    await this.notificationService.notifySubmission(event.organizationId, event.returnId);

    // 3. Audit log
    await this.auditService.log({
      action: 'vat_return.submitted',
      subjectType: 'VatReturn',
      subjectId: event.returnId,
    });
  }
}
```

## 12. Context Propagation

Tenant and user context are propagated through async local storage:

```typescript
// tenant/tenant-context.ts
export class TenantContext {
  private static store = new AsyncLocalStorage<Map<string, any>>();

  static run(store: Map<string, any>, fn: () => void) {
    this.store.enterWith(store);
    fn();
  }

  static getOrganizationId(): string {
    return this.store.getStore()?.get('organizationId');
  }

  static getUserId(): string {
    return this.store.getStore()?.get('userId');
  }
}

// Prisma middleware for automatic tenant scoping
prisma.$use(async (params, next) => {
  const orgId = TenantContext.getOrganizationId();
  if (orgId && ['create', 'findMany', 'findFirst', 'update', 'delete'].includes(params.action)) {
    params.args.where = { ...params.args.where, organizationId: orgId };
    if (params.action === 'create') {
      params.args.data = { ...params.args.data, organizationId: orgId };
    }
  }
  return next(params);
});
```

## 13. Testing Architecture

```typescript
// test/vat-returns.service.spec.ts
describe('VatReturnService', () => {
  let service: VatReturnService;
  let repository: MockType<IVatReturnRepository>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VatReturnService,
        { provide: 'IVatReturnRepository', useFactory: repositoryMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(VatReturnService);
  });

  it('should create a VAT return', async () => {
    const dto: CreateVatReturnDto = { /* ... */ };
    const result = await service.create(dto, 'user-id');
    expect(result).toBeDefined();
    expect(result.status).toBe('draft');
  });
});
```

## 14. OpenAPI Documentation

```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('VAT Declaration System API')
  .setDescription('Online VAT Declaration SaaS API')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('vat-returns')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

Decorators on DTOs and controllers provide schema metadata:

```typescript
@ApiProperty({ example: 'cm123abc', description: 'Unique VAT return identifier' })
id: string;

@ApiProperty({ example: '2024-01-01', description: 'Period start date (ISO 8601)' })
periodStart: string;
```

## 15. Performance Considerations

- **Pagination**: Cursor-based for large datasets, offset-based for admin.
- **Filtering**: Prisma `where` clauses with indexed fields only.
- **Projections**: Return only required fields via DTO select.
- **Batching**: `Promise.all` for independent queries.
- **Connection Pooling**: PgBouncer for database connections.
- **Caching**: Redis for lookup tables (jurisdictions, VAT rates).
