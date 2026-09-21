# 06 — Multi-Tenancy, Auth, and RBAC

## 1. Multi-Tenancy Model

The system uses **shared database, row-level isolation** as the default strategy. Every query is scoped to the current organization.

### 1.1 Tenant Resolution

Tenant is resolved in this priority order:

1. **Subdomain**: `acme.vat-saas.com` → `organizationId = acme`
2. **Header**: `X-Organization-ID: <uuid>`
3. **JWT Claim**: `organization_id` in access token
4. **Session**: For web requests with session cookie

```typescript
// tenant/tenant-resolver.service.ts
@Injectable()
export class TenantResolverService {
  constructor(private readonly organizationService: OrganizationService) {}

  resolve(request: Request): Promise<Organization> {
    const subdomain = this.extractSubdomain(request.hostname);
    const headerId = request.headers['x-organization-id'];
    const jwtClaim = request.user?.organizationId;

    const identifier = subdomain || headerId || jwtClaim;
    if (!identifier) throw new TenantNotFoundException();

    return this.organizationService.findActiveByIdentifier(identifier);
  }
}
```

### 1.2 Tenant Context Propagation

```typescript
// tenant/tenant-context.ts
export class TenantContext {
  private static store = new AsyncLocalStorage<Map<string, any>>();

  static run(context: Map<string, any>, fn: () => void) {
    this.store.enterWith(context);
    fn();
  }

  static getOrganizationId(): string {
    return this.store.getStore()?.get('organizationId');
  }

  static getUserId(): string {
    return this.store.getStore()?.get('userId');
  }
}

// tenant/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantResolver: TenantResolverService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const organization = await this.tenantResolver.resolve(req);
    TenantContext.run(
      new Map([
        ['organizationId', organization.id],
        ['userId', req.user?.id],
      ]),
      () => next(),
    );
  }
}
```

### 1.3 Prisma Middleware for Automatic Scoping

```typescript
// prisma/tenant-middleware.ts
export function applyTenantMiddleware(prisma: PrismaService) {
  prisma.$use(async (params, next) => {
    const orgId = TenantContext.getOrganizationId();
    if (!orgId) return next(params);

    const tenantTables = [
      'VatRegistration', 'VatReturn', 'VatReturnItem', 'Transaction',
      'Jurisdiction', 'ImportJob', 'Report', 'Integration',
    ];

    const model = params.model;
    if (!tenantTables.includes(model)) return next(params);

    switch (params.action) {
      case 'findMany':
      case 'findFirst':
      case 'findUnique':
        params.args.where = { ...params.args.where, organizationId: orgId, deletedAt: null };
        break;
      case 'create':
        params.args.data = { ...params.args.data, organizationId: orgId };
        break;
      case 'update':
      case 'delete':
        params.args.where = { ...params.args.where, organizationId: orgId };
        break;
      case 'count':
        params.args.where = { ...params.args.where, organizationId: orgId };
        break;
    }

    return next(params);
  });
}
```

## 2. Authentication

### 2.1 JWT Strategy

```typescript
// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.usersService.findById(payload.sub);
  }
}

export interface JwtPayload {
  sub: string;        // User ID
  email: string;
  organizationId?: string;
  role: string;
  iat: number;
  exp: number;
}
```

### 2.2 Refresh Token Flow

```typescript
// auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.validateCredentials(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    const token = await this.refreshTokenService.findByToken(refreshToken);
    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(token.userId);
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    await this.refreshTokenService.revoke(token.id);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAll(userId);
  }

  private generateAccessToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' },
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(64).toString('hex');
    await this.refreshTokenService.create({
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    return token;
  }
}
```

### 2.3 Multi-Factor Authentication (MFA)

```typescript
// auth/mfa.service.ts
@Injectable()
export class MfaService {
  constructor(private readonly speakeasy: SpeakeasyFactory) {}

  async enableMfa(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const secret = this.speakeasy.generateSecret({
      name: `VAT SaaS (${user.email})`,
      issuer: 'VAT Declaration System',
    });

    await this.usersService.update(userId, { mfaSecret: secret.base32, mfaEnabled: false });
    return { secret: secret.base32, otpauthUrl: secret.otpauth_url };
  }

  async verifyMfa(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    return this.speakeasy.totp.verify({
      secret: user.mfaSecret!,
      encoding: 'base32',
      token,
      window: 1,
    });
  }
}
```

## 3. Role-Based Access Control (RBAC)

### 3.1 Permission Model

Permissions are defined as `resource:action` pairs:

```typescript
// auth/permissions.ts
export const Permissions = {
  // Organizations
  organizations: {
    read: 'organizations.read',
    update: 'organizations.update',
    delete: 'organizations.delete',
  },
  // Users
  users: {
    read: 'users.read',
    create: 'users.create',
    update: 'users.update',
    delete: 'users.delete',
    invite: 'users.invite',
  },
  // VAT Registrations
  vatRegistrations: {
    read: 'vat_registrations.read',
    create: 'vat_registrations.create',
    update: 'vat_registrations.update',
    delete: 'vat_registrations.delete',
    verify: 'vat_registrations.verify',
  },
  // VAT Returns
  vatReturns: {
    read: 'vat_returns.read',
    create: 'vat_returns.create',
    update: 'vat_returns.update',
    delete: 'vat_returns.delete',
    submit: 'vat_returns.submit',
    cancel: 'vat_returns.cancel',
  },
  // Transactions
  transactions: {
    read: 'transactions.read',
    create: 'transactions.create',
    update: 'transactions.update',
    delete: 'transactions.delete',
    import: 'transactions.import',
    reconcile: 'transactions.reconcile',
  },
  // Integrations
  integrations: {
    read: 'integrations.read',
    connect: 'integrations.connect',
    disconnect: 'integrations.disconnect',
    sync: 'integrations.sync',
  },
  // Reports
  reports: {
    read: 'reports.read',
    export: 'reports.export',
    schedule: 'reports.schedule',
  },
  // Billing
  billing: {
    read: 'billing.read',
    update: 'billing.update',
  },
  // Admin
  admin: {
    access: 'admin.access',
  },
} as const;
```

### 3.2 Default Roles

```typescript
// auth/roles/seed.ts
export const defaultRoles: RoleSeed[] = [
  {
    name: 'owner',
    description: 'Full access to all organization features',
    permissions: ['*'],
    isSystem: true,
  },
  {
    name: 'admin',
    description: 'Administrative access except billing',
    permissions: [
      'organizations.read', 'organizations.update',
      'users.read', 'users.create', 'users.update', 'users.delete', 'users.invite',
      'vat_registrations.*',
      'vat_returns.*',
      'transactions.*',
      'integrations.*',
      'reports.*',
      'settings.*',
    ],
    isSystem: true,
  },
  {
    name: 'accountant',
    description: 'VAT return and transaction management',
    permissions: [
      'vat_registrations.read',
      'vat_returns.read', 'vat_returns.create', 'vat_returns.update', 'vat_returns.submit',
      'transactions.read', 'transactions.create', 'transactions.update', 'transactions.import',
      'reports.read', 'reports.export',
    ],
    isSystem: true,
  },
  {
    name: 'viewer',
    description: 'Read-only access to VAT data',
    permissions: [
      'vat_registrations.read',
      'vat_returns.read',
      'transactions.read',
      'reports.read',
    ],
    isSystem: true,
  },
];
```

### 3.3 RBAC Guard Implementation

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
    const orgId = TenantContext.getOrganizationId();

    if (!user || !orgId) return false;

    const userPermissions = await this.permissionService.getUserPermissions(user.id, orgId);

    return requiredPermissions.every((perm) => {
      if (userPermissions.includes('*')) return true; // Owner wildcard
      return userPermissions.includes(perm);
    });
  }
}

// Usage in controllers
@Get()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Permissions(Permissions.vatReturns.read)
async findAll(@Query() query: QueryVatReturnDto) {
  return this.vatReturnsService.findMany(query);
}
```

### 3.4 Organization Switching

```typescript
// organizations/services/organization-switcher.service.ts
@Injectable()
export class OrganizationSwitcherService {
  constructor(private readonly authService: AuthService) {}

  async switchOrganization(userId: string, organizationId: string): Promise<AuthResponse> {
    const membership = await this.organizationUserService.findByUserAndOrg(userId, organizationId);
    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const accessToken = this.authService.generateAccessToken({
      sub: userId,
      organizationId,
      role: membership.role.name,
    });

    const refreshToken = await this.authService.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }
}
```

## 4. Row-Level Security (PostgreSQL RLS)

For defense-in-depth, PostgreSQL RLS policies enforce tenant isolation at the database level:

```sql
-- Enable RLS on tenant tables
ALTER TABLE vat_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy using app user context
CREATE POLICY tenant_isolation ON vat_returns
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Set context per request (via NestJS middleware)
SET app.current_organization_id = '<org-uuid>';
```

## 5. Password Security

```typescript
// auth/password.service.ts
@Injectable()
export class PasswordService {
  constructor(private readonly argon2: Argon2Service) {}

  async hash(password: string): Promise<string> {
    return this.argon2.hash(password, {
      type: Argon2Type.Argon2id,
      memoryCost: 65536,  // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return this.argon2.verify(hash, password);
  }

  async validateStrength(password: string): Promise<void> {
    const result = passwordStrength(password);
    if (result.score < 3) {
      throw new BadRequestException('Password does not meet strength requirements');
    }
  }
}
```

## 6. Session Management

```typescript
// auth/session.service.ts
export interface Session {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
}

@Injectable()
export class SessionService {
  async create(userId: string, request: Request): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || 'unknown',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        lastActiveAt: new Date(),
      },
    });
  }

  async list(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revoke(sessionId: string, userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });
  }

  async revokeAllExcept(userId: string, currentSessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId, id: { not: currentSessionId } },
    });
  }
}
```

## 7. Audit Trail

```typescript
// audit/audit.service.ts
@Injectable()
export class AuditService {
  async log(params: AuditLogParams): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        organizationId: TenantContext.getOrganizationId()!,
        userId: TenantContext.getUserId(),
        action: params.action,
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        changes: params.changes,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}

// Usage via interceptor
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async (result) => {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const className = context.getClass().name;
        const action = `${className}.${handler.name}`;

        await this.auditService.log({
          action,
          subjectType: this.extractSubjectType(handler),
          subjectId: result?.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
```

## 8. Account Lockout

```typescript
// auth/account-lockout.service.ts
@Injectable()
export class AccountLockoutService {
  private readonly maxAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  async recordFailedAttempt(userId: string): Promise<boolean> {
    const user = await this.usersService.incrementFailedLogin(userId);
    if (user.failedLoginCount >= this.maxAttempts) {
      await this.usersService.lock(userId, new Date(Date.now() + this.lockoutDuration));
      return true;
    }
    return false;
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.usersService.update(userId, { failedLoginCount: 0, lockedUntil: null });
  }
}
```

## 9. Organization Lifecycle

```typescript
// organizations/services/organization.service.ts
@Injectable()
export class OrganizationService {
  async create(dto: CreateOrganizationDto, userId: string): Promise<Organization> {
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: await this.generateUniqueSlug(dto.name),
        countryCode: dto.countryCode,
        currencyCode: dto.currencyCode,
        users: { create: { userId, roleId: (await this.getOwnerRole()).id, isOwner: true } },
      },
    });

    await this.eventBus.emit(new OrganizationCreatedEvent(org.id));
    return org;
  }

  async suspend(organizationId: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { isActive: false },
    });
    await this.eventBus.emit(new OrganizationSuspendedEvent(organizationId));
  }

  async delete(organizationId: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { deletedAt: new Date() },
    });
    await this.eventBus.emit(new OrganizationDeletedEvent(organizationId));
  }
}
```

## 10. Security Headers

```typescript
// main.ts
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(','),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());
  app.setGlobalPrefix('api/v1');
}
```
