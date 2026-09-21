# 20 — Middleware and Request Pipeline

## 1. Request Lifecycle

```
HTTP Request
    │
    ▼
[NestJS Middleware Pipeline]
    │
    ├── 1. Helmet (Security Headers)
    ├── 2. CORS
    ├── 3. Cookie Parser
    ├── 4. Request Logger
    ├── 5. Rate Limiter
    ├── 6. Tenant Resolver
    ├── 7. Authentication (JWT Guard)
    ├── 8. Validation Pipe
    │
    ▼
[Controller Route Handler]
    │
    ▼
[Service Layer]
    │
    ▼
[Repository / Prisma]
    │
    ▼
[Response Interceptors]
    │
    ▼
HTTP Response
```

## 2. Middleware Implementation

### 2.1 Request Logger Middleware

```typescript
// infrastructure/middleware/request-logger.middleware.ts
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';
    const correlationId = headers['x-correlation-id'] || randomUUID();

    res.locals.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;

      this.logger.log({
        correlationId,
        method,
        url,
        statusCode,
        duration,
        ip,
        userAgent,
        userId: req.user?.id,
        organizationId: req.organization?.id,
      });
    });

    next();
  }
}
```

### 2.2 Rate Limiter Middleware

```typescript
// infrastructure/middleware/rate-limiter.middleware.ts
@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly limiter = new Map<string, { count: number; resetAt: Date }>();

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.getKey(req);
    const limit = this.getLimit(req.path);
    const now = new Date();

    if (this.limiter.has(key)) {
      const entry = this.limiter.get(key)!;
      if (now > entry.resetAt) {
        this.limiter.set(key, { count: 1, resetAt: new Date(now.getTime() + limit.windowMs) });
      } else if (entry.count >= limit.max) {
        res.setHeader('Retry-After', Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000));
        throw new TooManyRequestsException(`Rate limit exceeded. Try again in ${res.getHeader('Retry-After')} seconds.`);
      } else {
        entry.count++;
      }
    } else {
      this.limiter.set(key, { count: 1, resetAt: new Date(now.getTime() + limit.windowMs) });
    }

    res.setHeader('X-RateLimit-Limit', limit.max.toString());
    res.setHeader('X-RateLimit-Remaining', (limit.max - (this.limiter.get(key)?.count || 0)).toString());

    next();
  }

  private getKey(req: Request): string {
    const orgId = req.headers['x-organization-id'] || req.ip;
    return `${orgId}:${req.path}`;
  }

  private getLimit(path: string): { max: number; windowMs: number } {
    if (path.startsWith('/auth/login')) return { max: 5, windowMs: 60_000 };
    if (path.startsWith('/integrations')) return { max: 50, windowMs: 60_000 };
    return { max: 1000, windowMs: 60_000 };
  }
}
```

### 2.3 Tenant Resolver Middleware

```typescript
// tenant/tenant-resolver.middleware.ts
@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly tenantResolver: TenantResolverService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organization = await this.tenantResolver.resolve(req);
      req.organization = organization;
      res.locals.organizationId = organization.id;

      // Set PostgreSQL RLS context
      await this.prisma.$executeRaw`SET app.current_organization_id = ${organization.id}`;

      next();
    } catch (error) {
      throw new TenantNotFoundException();
    }
  }
}
```

## 3. Guards

### 3.1 JwtAuthGuard

```typescript
// auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### 3.2 PermissionsGuard

```typescript
// auth/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndMerge<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.organization?.id;

    if (!user || !orgId) return false;

    const userPermissions = await this.permissionService.getUserPermissions(user.id, orgId);

    return requiredPermissions.every((perm) => {
      if (userPermissions.includes('*')) return true;
      return userPermissions.includes(perm);
    });
  }
}
```

### 3.3 ThrottlerGuard (Rate Limiting)

```typescript
// infrastructure/guards/throttler.guard.ts
@Injectable()
export class ThrottlerGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly throttlerService: ThrottlerService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const classRef = context.getClass();
    const limit = this.reflector.getAllAndOverride<number>('limit', [handler, classRef]) || 10;
    const ttl = this.reflector.getAllAndOverride<number>('ttl', [handler, classRef]) || 60;

    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);

    const { totalHits, resetTime } = await this.throttlerService.check(key, limit, ttl);

    if (totalHits >= limit) {
      throw new TooManyRequestsException(`Rate limit exceeded. Retry after ${Math.ceil((resetTime.getTime() - Date.now()) / 1000)}s.`);
    }

    return true;
  }

  private generateKey(request: Request): string {
    return `throttler:${request.ip}:${request.route?.path}`;
  }
}
```

## 4. Pipes

### 4.1 Validation Pipe

```typescript
// infrastructure/pipes/zod-validation.pipe.ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodSchema<any>) {}

  transform(value: any): any {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new BadRequestException(errors);
    }
    return result.data;
  }
}
```

### 4.2 ParseInt Pipe

```typescript
// infrastructure/pipes/parse-int.pipe.ts
@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string): number {
    const int = parseInt(value, 10);
    if (isNaN(int)) {
      throw new BadRequestException('Invalid integer');
    }
    return int;
  }
}
```

## 5. Interceptors

### 5.1 TransformInterceptor

```typescript
// infrastructure/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) return data;
        if (data instanceof Response) return data;
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
      ...(response.locals?.pagination && { pagination: response.locals.pagination }),
    };
  }
}
```

### 5.2 TimeoutInterceptor

```typescript
// infrastructure/interceptors/timeout.interceptor.ts
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number;

  constructor(timeoutMs = 30000) {
    this.timeoutMs = timeoutMs;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return timer(this.timeoutMs).pipe(
      take(1),
      mergeMap(() => {
        throw new GatewayTimeoutException('Request timeout');
      }),
      catchError(() => next.handle()),
    );
  }
}
```

## 6. Exception Filters

### 6.1 PrismaExceptionFilter

```typescript
// infrastructure/filters/prisma-exception.filter.ts
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
      case 'P2002': return 409; // Unique constraint
      case 'P2025': return 404; // Not found
      case 'P2003': return 400; // Foreign key
      default: return 500;
    }
  }
}
```

### 6.2 HttpExceptionFilter

```typescript
// infrastructure/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();
    const message = exception.message;

    response.status(status).json({
      success: false,
      error: {
        code: this.mapCode(status),
        message,
        details: exception.getResponse(),
      },
    });
  }
}
```

## 7. Middleware Registration

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(','),
    credentials: true,
  });

  // Security
  app.use(helmet());

  // Cookie parser
  app.use(cookieParser());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new TimeoutInterceptor(30000),
  );

  // Global exception filters
  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Global guards
  app.useGlobalGuards(
    new JwtAuthGuard(),
    new PermissionsGuard(),
    new ThrottlerGuard(),
  );

  // Middleware (applied in order)
  app.use(new RequestLoggerMiddleware().use);
  app.use(new RateLimiterMiddleware().use);
  app.use(new TenantResolverMiddleware().use);

  // Prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(3001);
}
```

## 8. Request Context

```typescript
// infrastructure/context/request-context.ts
export interface RequestContext {
  correlationId: string;
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  startTime: number;
}

@Injectable()
export class RequestContextService {
  private readonly context = new AsyncLocalStorage<RequestContext>();

  run(context: RequestContext, fn: () => void): void {
    this.context.enterWith(context);
    fn();
  }

  get(): RequestContext | undefined {
    return this.context.getStore();
  }
}
```
