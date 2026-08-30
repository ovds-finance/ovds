# OVDS Security Developer Guide

## 1. Security-First Development Principles

All OVDS developers must follow these principles when writing code:

1. **Never Trust Client Input** — Always validate on the server side, regardless of client-side validation.
2. **Least Privilege** — Users should have only the permissions they need.
3. **Defense in Depth** — Multiple layers of security controls.
4. **Fail Secure** — On error, deny access rather than allow it.
5. **Security by Default** — New features must be secure by default.

## 2. Authentication Guidelines

### 2.1 Password Handling

```typescript
// DO — Use bcrypt with appropriate cost
const hashedPassword = await bcrypt.hash(password, 12);

// DO — Enforce minimum 8 characters with complexity
if (password.length < 8) throw new BadRequestException('Password too short');
if (!/[A-Z]/.test(password)) throw new BadRequestException('Password needs uppercase');
if (!/[a-z]/.test(password)) throw new BadRequestException('Password needs lowercase');
if (!/[0-9]/.test(password)) throw new BadRequestException('Password needs number');
if (!/[^A-Za-z0-9]/.test(password)) throw new BadRequestException('Password needs special character');

// DON'T — Never log passwords or tokens
logger.debug('Login attempt', { password }); // WRONG
logger.debug('Login attempt', { username });  // CORRECT
```

### 2.2 JWT Token Handling

```typescript
// DO — Include companyId for tenant isolation
const payload = {
  sub: user.id,
  username: user.username,
  role: user.role,
  companyId: user.companyId,
  sessionsCount: user.sessionsCount,
};

// DO — Verify sessionsCount for session rotation
if (payload.sessionsCount !== user.sessionsCount) {
  throw new UnauthorizedException('Session invalidated');
}

// DON'T — Never include sensitive data in JWT
const payload = { sub: user.id, password: user.password }; // WRONG
```

### 2.3 Session Management

```typescript
// DO — Invalidate old sessions on new login
async login(credentials: LoginDto) {
  const result = await this.validateCredentials(credentials);
  await this.invalidatePreviousSessions(result.user.id);
  return result;
}

// DO — Use Redis for distributed session tracking
await this.cache.set(`session:${userId}`, tokenJti, TTL.SESSION);
```

## 3. Authorization Guidelines

### 3.1 Always Verify Ownership

```typescript
// DO — Verify ownership before any mutation
async updateLease(id: string, companyId: string, data: UpdateLeaseDto) {
  const lease = await this.prisma.lease.findFirst({
    where: { id, companyId },
  });
  if (!lease) throw new NotFoundException();
  return this.prisma.lease.update({ where: { id }, data });
}

// DON'T — Trust client-provided IDs without verification
async updateLease(id: string, data: UpdateLeaseDto) {  // WRONG - no companyId check
  return this.prisma.lease.update({ where: { id }, data });
}
```

### 3.2 Use Guards Consistently

```typescript
// DO — Apply guards at controller level
@Controller('leases')
@UseGuards(AuthGuard, CompanyGuard, RBACGuard)
export class LeasesController {}

// DO — Use role decorators for endpoint-specific access
@Delete(':id')
@Roles(Role.ADMIN, Role.ACCOUNTING)
deleteLease(@Param('id') id: string) {}
```

### 3.3 Strip Client-Provided Tenant IDs

```typescript
// DO — Use authenticated user's companyId, never from body
async createInvoice(@CurrentUser() user: RequestUser, @Body() dto: CreateInvoiceDto) {
  return this.prisma.invoice.create({
    data: { ...dto, companyId: user.companyId },  // Server-controlled
  });
}

// DON'T — Allow client to specify companyId
async createInvoice(@Body() dto: CreateInvoiceDto) {
  return this.prisma.invoice.create({
    data: dto,  // WRONG - client could specify any companyId
  });
}
```

## 4. Input Validation Guidelines

### 4.1 Use DTOs with Validation

```typescript
// DO — Define strict DTOs with class-validator
import { IsString, IsNotEmpty, Length, IsNumber, Min, Max } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  customerId: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  amount: number;
}
```

### 4.2 Sanitize All Input

```typescript
// DO — Use the SecurityValidationService
constructor(private security: SecurityValidationService) {}

async processInput(input: string) {
  const sanitized = this.security.sanitizeString(input);
  if (!sanitized.valid) {
    throw new BadRequestException(sanitized.error);
  }
  return sanitized.value;
}
```

### 4.3 Validate File Uploads

```typescript
// DO — Validate both extension and magic bytes
const validation = await this.security.validateFileUpload(file);
if (!validation.valid) {
  throw new BadRequestException(validation.error);
}

// DO — Check for dangerous extensions
if (this.security.hasDangerousExtension(file.originalname)) {
  throw new BadRequestException('File type not allowed');
}
```

## 5. Error Handling Guidelines

### 5.1 Never Expose Internals

```typescript
// DO — Return generic error messages
try {
  await this.riskyOperation();
} catch (error) {
  this.logger.error('Operation failed', error.stack);
  throw new InternalServerErrorException('Operation failed');
}

// DON'T — Expose internal details
try {
  await this.riskyOperation();
} catch (error) {
  throw new InternalServerErrorException(error.message);  // WRONG
}
```

### 5.2 Use Global Exception Filter

```typescript
// The AllExceptionsFilter handles all unhandled exceptions
// It strips stack traces and internal details from responses
// Developers should not create custom error responses with details
```

## 6. Database Guidelines

### 6.1 Use Prisma ORM

```typescript
// DO — Use Prisma for all database access
const users = await this.prisma.user.findMany({
  where: { companyId },
  select: { id: true, username: true },  // Only needed fields
});

// DON'T — Use raw queries without parameterization
const users = await this.prisma.$queryRaw`SELECT * FROM users WHERE companyId = ${companyId}`;
```

### 6.2 Prevent Mass Assignment

```typescript
// DO — Explicitly specify allowed fields
const user = await this.prisma.user.create({
  data: {
    username: dto.username,
    email: dto.email,
    // role is NOT included - cannot be set by client
  },
});

// DON'T — Pass entire DTO to create/update
const user = await this.prisma.user.create({ data: dto });  // WRONG
```

## 7. API Security Guidelines

### 7.1 Rate Limiting

```typescript
// Rate limiting is applied globally via ThrottlerGuard
// For sensitive endpoints, add additional checks:

@Post('login')
@Throttle(5, 900000)  // 5 attempts per 15 minutes
async login(@Body() dto: LoginDto) {
  // Additional rate limiting logic if needed
}
```

### 7.2 API Response Fields

```typescript
// DO — Return only necessary fields
return {
  id: user.id,
  username: user.username,
  // passwordHash is NOT included
};

// DON'T — Return entire user object
return user;  // WRONG - may include password hash, internal flags
```

## 8. Security Testing Checklist

Before submitting any PR, verify:

- [ ] All new endpoints have authentication guards
- [ ] All mutations verify ownership/tenant
- [ ] Input validation is applied server-side
- [ ] No sensitive data in responses
- [ ] No sensitive data in logs
- [ ] Error messages don't expose internals
- [ ] File uploads validate magic bytes
- [ ] No hardcoded secrets or credentials
- [ ] SQL queries use parameterization
- [ ] New tests cover security scenarios

## 9. Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Email security@ovds.et with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Allow 90 days for remediation before public disclosure

## 10. Security Contacts

- **Security Team**: security@ovds.et
- **Lead Developer**: dev@ovds.et
- **DevOps**: ops@ovds.et

## 11. References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP ZAP Guide](https://www.zaproxy.org/docs/desktop/addons/security/)
- [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final)
