# 22 — Controller Patterns and API Layer

## 1. Base Controller

```typescript
// libs/api-core/common/src/controllers/base.controller.ts
export abstract class BaseController {
  protected buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  protected async ensureOrganizationAccess(orgId: string, userId: string): Promise<void> {
    const membership = await this.organizationUserService.findByUserAndOrg(userId, orgId);
    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Access denied to this organization');
    }
  }
}
```

## 2. RESTful Controller Pattern

```typescript
// vat-returns/vat-returns.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Permissions } from '@nestjs/common';
import { VatReturnsService } from './vat-returns.service';
import { CreateVatReturnDto, UpdateVatReturnDto, QueryVatReturnDto, SubmitVatReturnDto } from './dto';

@Controller('vat-returns')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class VatReturnsController extends BaseController {
  constructor(private readonly vatReturnsService: VatReturnsService) {
    super();
  }

  @Get()
  @Permissions('vat_returns.read')
  async findAll(@Query() query: QueryVatReturnDto) {
    const { data, meta } = await this.vatReturnsService.findMany(query);
    return this.buildPaginatedResponse(data, meta.total, meta.page, meta.limit);
  }

  @Get(':id')
  @Permissions('vat_returns.read')
  async findOne(@Param('id') id: string) {
    const vatReturn = await this.vatReturnsService.findById(id);
    if (!vatReturn) throw new VatReturnNotFoundException(id);
    return { data: vatReturn };
  }

  @Post()
  @Permissions('vat_returns.create')
  async create(@Body() dto: CreateVatReturnDto, @CurrentUser() user: User) {
    const vatReturn = await this.vatReturnsService.create(dto, user.id);
    return { data: vatReturn }, 201;
  }

  @Put(':id')
  @Permissions('vat_returns.update')
  async update(@Param('id') id: string, @Body() dto: UpdateVatReturnDto, @Query('expectedVersion') expectedVersion: number) {
    const vatReturn = await this.vatReturnsService.update(id, dto, expectedVersion);
    return { data: vatReturn };
  }

  @Delete(':id')
  @Permissions('vat_returns.delete')
  async remove(@Param('id') id: string) {
    await this.vatReturnsService.softDelete(id);
    return { success: true };
  }

  @Post(':id/submit')
  @Permissions('vat_returns.submit')
  async submit(@Param('id') id: string, @Body() dto: SubmitVatReturnDto) {
    const result = await this.vatReturnsService.submit(id, dto);
    return { data: result };
  }
}
```

## 3. DTOs with Validation

```typescript
// vat-returns/dto/create-vat-return.dto.ts
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const CreateVatReturnSchema = z.object({
  vatRegistrationId: z.string().cuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      type: z.enum(['sales', 'purchases', 'adjustments', 'corrections']),
      boxCode: z.string().min(1).max(10),
      description: z.string().max(500).optional(),
      netAmount: z.number().positive(),
      vatRate: z.number().min(0).max(100),
      vatAmount: z.number().min(0),
      grossAmount: z.number().positive(),
      transactionId: z.string().cuid().optional(),
    })
  ).min(1),
});

export type CreateVatReturnDto = z.infer<typeof CreateVatReturnSchema>;

// Decorator for Swagger
export const CreateVatReturnApiProperty = (property: keyof CreateVatReturnDto) =>
  ApiProperty({
    example: (CreateVatReturnSchema as any)[property].example,
    description: (CreateVatReturnSchema as any)[property].description,
  });
```

## 4. Route Groups

```typescript
// routes/vat-returns.ts
import { Router } from 'express';

const router = Router();

// Public routes (if any)
router.get('/public/info', publicInfoController.info);

// Authenticated routes
router.use(authMiddleware.authenticate);
router.use(tenantMiddleware.resolve);

router.get('/', vatReturnController.findAll);
router.get('/:id', vatReturnController.findOne);
router.post('/', vatReturnController.create);
router.put('/:id', vatReturnController.update);
router.delete('/:id', vatReturnController.remove);
router.post('/:id/submit', vatReturnController.submit);
router.post('/:id/cancel', vatReturnController.cancel);
router.get('/:id/history', vatReturnController.getHistory);

export default router;
```

## 5. API Versioning

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Version 1
  app.setGlobalPrefix('api/v1');

  // Or header-based versioning
  app.useGlobalPrefix('api');
  app.use('/v1', v1Router);
  app.use('/v2', v2Router);

  await app.listen(3001);
}
```

## 6. Response Envelopes

```typescript
// libs/api-core/common/src/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) return data;
        if (data instanceof Response) return data;

        const isPaginated = Array.isArray(data) || (data.data && Array.isArray(data.data));

        return {
          success: true,
          data: data.data || data,
          meta: isPaginated ? data.meta : undefined,
          links: isPaginated ? data.links : undefined,
          requestId: context.switchToHttp().getRequest().id,
        };
      }),
    );
  }
}
```

## 7. Error Response Envelope

```typescript
// libs/api-core/common/src/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      success: false,
      error: {
        code: this.getErrorCode(status),
        message: typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse.message,
        details: typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
      },
      requestId: host.switchToHttp().getRequest().id,
    });
  }
}
```

## 8. Request ID Middleware

```typescript
// infrastructure/middleware/request-id.middleware.ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-ID', requestId);
    req.id = requestId;
    next();
  }
}
```

## 9. CORS Configuration

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization, X-Organization-ID, X-Correlation-ID',
    exposedHeaders: 'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    credentials: true,
    maxAge: 86400,
  });

  await app.listen(3001);
}
```

## 10. Health Check Endpoints

```typescript
// health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: Redis,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
    };
  }

  @Get('ready')
  async readiness() {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      queue: await this.checkQueue(),
    };

    const isReady = Object.values(checks).every(c => c.status === 'up');
    return { status: isReady ? 'ready' : 'degraded', checks };
  }

  @Get('live')
  async liveness() {
    return { status: 'alive' };
  }
}
```
