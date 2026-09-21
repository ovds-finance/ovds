# 25 — Security Architecture

## 1. Security Principles

The system follows these security principles:

- **Least Privilege**: Users and services have only the permissions they need.
- **Defense in Depth**: Multiple layers of security controls.
- **Zero Trust**: Every request is authenticated and authorized.
- **Secure by Default**: Security is enabled by default, not as an afterthought.
- **Data Protection**: Sensitive data is encrypted at rest and in transit.

## 2. Threat Model

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Prisma parameterized queries, no raw SQL |
| XSS | Input sanitization, CSP headers, React escaping |
| CSRF | SameSite cookies, CSRF tokens, CORS |
| Authentication Bypass | JWT validation, guard chains |
| Authorization Bypass | RBAC guards, tenant scoping, RLS |
| Data Breach | Encryption at rest, access controls, audit logs |
| DDoS | Rate limiting, WAF, CDN |
| Session Hijacking | Short-lived JWTs, refresh token rotation |
| Credential Theft | MFA, password strength, breach detection |

## 3. Authentication Security

### 3.1 Password Security

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

### 3.2 JWT Security

```typescript
// auth/jwt.service.ts
@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  sign(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
      issuer: 'vat-saas',
      audience: 'vat-saas-api',
    });
  }

  verify(token: string): JwtPayload {
    try {
      return this.jwt.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
        issuer: 'vat-saas',
        audience: 'vat-saas-api',
      }) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### 3.3 Refresh Token Rotation

```typescript
// auth/refresh-token.service.ts
@Injectable()
export class RefreshTokenService {
  async rotate(userId: string, oldToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const accessToken = this.jwtService.sign({ sub: userId });
    const newRefreshToken = await this.generateRefreshToken(userId);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
```

## 4. Authorization Security

### 4.1 Permission Checks

```typescript
// auth/permissions.service.ts
@Injectable()
export class PermissionsService {
  async hasPermission(userId: string, orgId: string, permission: string): Promise<boolean> {
    const membership = await this.organizationUserService.findByUserAndOrg(userId, orgId);
    if (!membership) return false;

    const role = await this.roleService.findById(membership.roleId);
    const permissions = role.permissions as Record<string, string[]>;

    // Owner has all permissions
    if (membership.isOwner || permissions['*']) return true;

    // Check resource permissions
    const [resource, action] = permission.split('.');
    return permissions[resource]?.includes(action) || permissions[resource]?.includes('*');
  }
}
```

### 4.2 Tenant Isolation

```typescript
// tenant/tenant-guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantService: TenantService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.headers['x-organization-id'] || request.user?.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    // Verify user has access to this organization
    if (!request.user?.organizations?.includes(organizationId)) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return true;
  }
}
```

## 5. Input Validation and Sanitization

### 5.1 Zod Validation

```typescript
// common/validation/zod.pipe.ts
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

### 5.2 SQL Injection Prevention

```typescript
// ✅ Safe: Prisma parameterized queries
const user = await prisma.user.findFirst({
  where: { email: userInput.email },
});

// ✅ Safe: Prisma raw queries with parameters
const results = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput.email}
`;

// ❌ Unsafe: Never concatenate user input into raw SQL
// const sql = `SELECT * FROM users WHERE email = '${userInput.email}'`;
```

### 5.3 XSS Prevention

```typescript
// ✅ Safe: React escapes by default
<div>{userInput.name}</div>

// ❌ Dangerous: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput.content }} />

// ✅ If HTML is needed, sanitize first
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput.content) }} />
```

## 6. Security Headers

```typescript
// infrastructure/security/helmet.config.ts
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.vat-saas.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
};
```

## 7. API Security

### 7.1 Rate Limiting

```typescript
// infrastructure/security/rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const limit = this.reflector.getAllAndOverride<number>('rateLimit', [handler, context.getClass()]) || 10;
    const ttl = this.reflector.getAllAndOverride<number>('rateLimitTtl', [handler, context.getClass()]) || 60;

    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);
    const { totalHits, resetTime } = await this.rateLimiter.check(key, limit, ttl);

    if (totalHits >= limit) {
      throw new TooManyRequestsException(`Rate limit exceeded. Retry after ${Math.ceil((resetTime.getTime() - Date.now()) / 1000)}s.`);
    }

    return true;
  }

  private generateKey(request: Request): string {
    const userId = request.user?.id || request.ip;
    const endpoint = request.route?.path || request.url;
    return `${userId}:${endpoint}`;
  }
}
```

### 7.2 CORS Configuration

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin) => {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
      if (allowedOrigins.includes(origin) || origin === undefined) {
        return origin;
      }
      return null;
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID', 'X-Correlation-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  });
}
```

## 8. Data Encryption

### 8.1 Encryption at Rest

```typescript
// common/services/encryption.service.ts
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get('ENCRYPTION_KEY');
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### 8.2 Field-Level Encryption

```typescript
// Integrations store encrypted credentials
const integration = await prisma.integration.create({
  data: {
    organizationId: orgId,
    provider: 'hmrc',
    credentials: encryptionService.encrypt(JSON.stringify({
      accessToken: '...',
      refreshToken: '...',
    })),
  },
});

// Decrypt when needed
const credentials = JSON.parse(encryptionService.decrypt(integration.credentials));
```

## 9. Secrets Management

### 9.1 Environment Variables

```typescript
// config/validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().default(3001),
  DATABASE_SHARED_URL: z.string().url(),
  DATABASE_TENANT_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex
  HMRC_CLIENT_ID: z.string().optional(),
  HMRC_CLIENT_SECRET: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### 9.2 Secret Rotation

```typescript
// security/secret-rotation.service.ts
@Injectable()
export class SecretRotationService {
  constructor(private readonly encryptionService: EncryptionService) {}

  async rotateIntegrationCredentials(integrationId: string): Promise<void> {
    const integration = await this.integrationService.findById(integrationId);
    const credentials = JSON.parse(this.encryptionService.decrypt(integration.credentials));

    // Re-authenticate with provider
    const newCredentials = await this.providerRegistry.resolve(integration.provider).refreshToken(credentials.refreshToken);

    // Encrypt and store
    await this.integrationService.updateCredentials(integrationId, {
      accessToken: newCredentials.accessToken,
      refreshToken: newCredentials.refreshToken,
      expiresAt: newCredentials.expiresAt,
    });
  }
}
```

## 10. Audit Logging

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
```

## 11. Security Headers Middleware

```typescript
// infrastructure/security/security-headers.middleware.ts
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  }
}
```

## 12. Account Security

### 12.1 Account Lockout

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

### 12.2 Password Expiration

```typescript
// auth/password-policy.service.ts
@Injectable()
export class PasswordPolicyService {
  private readonly maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days

  async checkExpiration(userId: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    const passwordAge = Date.now() - new Date(user.passwordChangedAt).getTime();
    return passwordAge > this.maxAge;
  }
}
```

### 12.3 Session Management

```typescript
// auth/session.service.ts
@Injectable()
export class SessionService {
  async create(userId: string, request: Request): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || 'unknown',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
}
```

## 13. OWASP Top 10 Compliance

| OWASP Risk | Mitigation |
|------------|-----------|
| A01: Broken Access Control | RBAC, tenant guards, RLS |
| A02: Cryptographic Failures | AES-256-GCM, TLS 1.3, short-lived JWTs |
| A03: Injection | Prisma ORM, Zod validation, input sanitization |
| A04: Insecure Design | Threat modeling, secure defaults |
| A05: Security Misconfiguration | Helmet, security headers, minimal error exposure |
| A06: Vulnerable Components | Dependabot, Snyk, lockfile updates |
| A07: Authentication Failures | MFA, account lockout, password strength |
| A08: Data Integrity Failures | Immutable audit logs, signatures |
| A09: Logging Failures | Structured logging, correlation IDs |
| A10: SSRF | URL allowlist, no raw user input in requests |

## 14. Penetration Testing Checklist

- [ ] SQL injection on all endpoints
- [ ] XSS on all input fields
- [ ] CSRF on all state-changing endpoints
- [ ] Authentication bypass attempts
- [ ] Authorization bypass between tenants
- [ ] Rate limit bypass
- [ ] JWT token tampering
- [ ] Refresh token reuse
- [ ] Password reset token predictability
- [ ] Session fixation
- [ ] Clickjacking
- [ ] SSL/TLS configuration

## 15. Security Monitoring

```typescript
// security/anomaly-detection.service.ts
@Injectable()
export class AnomalyDetectionService {
  async checkLoginAnomaly(userId: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const recentLogins = await this.prisma.auditLog.findMany({
      where: {
        action: 'auth.login',
        userId,
        createdAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const ips = new Set(recentLogins.map((l) => l.ipAddress));
    const userAgents = new Set(recentLogins.map((l) => l.userAgent));

    // Alert on new IP or user agent
    if (!ips.has(ipAddress) || !userAgents.has(userAgent)) {
      await this.notificationService.send({
        organizationId: 'system',
        type: 'security_alert',
        title: 'Suspicious login detected',
        message: `New login from ${ipAddress}`,
        priority: 'high',
      });
      return true;
    }

    return false;
  }
}
```
