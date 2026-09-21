# 51 — API Versioning and Deprecation Strategy

## 1. Versioning Strategy

The API uses **path-based versioning** with backward-compatible changes within a major version.

```
/api/v1/vat-returns          # Stable v1
/api/v1/organizations         # Stable v1
/api/v2/vat-returns           # Next major version (breaking changes)
```

## 2. Versioning Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| New endpoint | Minor | `POST /vat-returns/{id}/duplicate` |
| New optional field | Minor | Add `notes` field to response |
| New enum value | Minor | Add `archived` status |
| Deprecation warning | Minor | Add `Deprecation` header |
| Remove endpoint | Major | Remove `/api/v1/old-endpoint` |
| Remove field | Major | Remove `legacy_id` field |
| Change field type | Major | Change `string` to `number` |
| Change response structure | Major | Wrap response in new envelope |

## 3. Deprecation Process

### 3.1 Deprecation Timeline

```
Week 1: Announce deprecation
  └── Add Deprecation header
  └── Update documentation
  └── Notify API consumers

Week 2-8: Grace period
  └── Continue supporting old endpoint
  └── Monitor usage of deprecated endpoint
  └── Send reminders to consumers

Week 9: Soft removal
  └── Return 410 Gone for deprecated endpoint
  └── Provide migration guide

Week 10: Hard removal
  └── Remove endpoint entirely
  └── Bump major version
```

### 3.2 Deprecation Headers

```
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Jun 2024 00:00:00 GMT
Link: <https://api.vat-saas.com/v2/vat-returns>; rel="successor-version"
```

### 3.3 Deprecation Middleware

```typescript
// infrastructure/middleware/deprecation.middleware.ts
@Injectable()
export class DeprecationMiddleware implements NestMiddleware {
  private readonly deprecatedRoutes = new Map([
    ['GET', '/api/v1/vat-returns/legacy'],
    ['POST', '/api/v1/transactions/old-import'],
  ]);

  use(req: Request, res: Response, next: NextFunction): void {
    const routeKey = `${req.method}:${req.url}`;

    if (this.deprecatedRoutes.has(routeKey)) {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', 'Sat, 01 Jun 2024 00:00:00 GMT');
      res.setHeader('Link', '<https://api.vat-saas.com/v2/vat-returns>; rel="successor-version"');

      // Log deprecation usage
      this.logger.warn(`Deprecated endpoint accessed: ${routeKey}`);
    }

    next();
  }
}
```

## 4. Version Negotiation

```typescript
// infrastructure/version-negotiation.ts
export interface VersionConfig {
  current: string;
  deprecated: string[];
  sunsetDates: Record<string, Date>;
}

@Injectable()
export class VersionNegotiationService {
  private readonly versions: VersionConfig = {
    current: 'v2',
    deprecated: ['v1'],
    sunsetDates: {
      v1: new Date('2024-06-01'),
    },
  };

  negotiate(request: Request): string {
    // 1. Check URL path
    const pathVersion = request.url.match(/^\/api\/(v\d+)/)?.[1];
    if (pathVersion) return pathVersion;

    // 2. Check header
    const headerVersion = request.headers['x-api-version'] as string;
    if (headerVersion) return headerVersion;

    // 3. Check Accept header
    const acceptVersion = request.headers['accept'].match(/version=(\d+)/)?.[1];
    if (acceptVersion) return `v${acceptVersion}`;

    // 4. Default to current
    return this.versions.current;
  }
}
```

## 5. Migration Guides

```markdown
# Migration Guide: v1 to v2

## Breaking Changes

### 1. VAT Return Status Values

**Before (v1):**
```json
{
  "status": "pending"
}
```

**After (v2):**
```json
{
  "status": "pending_review"
}
```

**Migration:** Replace `pending` with `pending_review`.

### 2. Response Envelope

**Before (v1):**
```json
{
  "data": { ... }
}
```

**After (v2):**
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

**Migration:** Update client to expect new envelope structure.

### 3. Pagination

**Before (v1):**
```
GET /vat-returns?page=2&limit=20
```

**After (v2):**
```
GET /vat-returns?cursor=eyJpZCI6ICIxMjM0NSJ9&limit=20
```

**Migration:** Switch to cursor-based pagination.
```

## 6. Version-Specific Controllers

```typescript
// apps/api/src/v1/vat-returns/v1-vat-returns.controller.ts
@Controller('vat-returns')
export class V1VatReturnsController {
  constructor(private readonly vatReturnsService: VatReturnsService) {}

  @Get()
  async findAll(@Query() query: any) {
    const returns = await this.vatReturnsService.findManyV1(query);
    return { data: returns };
  }
}

// apps/api/src/v2/vat-returns/v2-vat-returns.controller.ts
@Controller('vat-returns')
export class V2VatReturnsController {
  constructor(private readonly vatReturnsService: VatReturnsService) {}

  @Get()
  async findAll(@Query() query: QueryVatReturnDto) {
    const { data, meta } = await this.vatReturnsService.findManyV2(query);
    return { success: true, data, meta };
  }
}
```

## 7. API Changelog

```markdown
# API Changelog

## v2.0.0 (2024-06-01)

### Breaking Changes
- Renamed `pending` status to `pending_review`
- Changed response envelope to include `success` and `meta`
- Switched to cursor-based pagination
- Removed `/api/v1/legacy` endpoints

### New Features
- Added batch operations (`POST /vat-returns/batch`)
- Added webhook management endpoints
- Added advanced filtering

## v1.1.0 (2024-03-01)

### Additions
- Added `notes` field to VAT returns
- Added `submittedBy` field to responses

### Deprecations
- `/api/v1/legacy` deprecated, sunsets 2024-06-01

## v1.0.0 (2024-01-01)

### Initial Release
- VAT return CRUD
- Transaction management
- Basic reporting
```

## 8. Client Compatibility

```typescript
// apps/web/src/lib/api/versioning.ts
export class ApiVersionManager {
  private currentVersion = 'v2';
  private supportedVersions = ['v1', 'v2'];

  getVersionHeader(): string {
    return `X-API-Version: ${this.currentVersion}`;
  }

  isVersionSupported(version: string): boolean {
    return this.supportedVersions.includes(version);
  }

  getMigrationGuide(fromVersion: string, toVersion: string): string {
    // Return migration guide URL
    return `https://docs.vat-saas.com/migration/${fromVersion}-to-${toVersion}`;
  }
}
```

## 9. Sunset Notifications

```typescript
// notifications/services/sunset-notification.service.ts
@Injectable()
export class SunsetNotificationService {
  async sendSunsetReminders(): Promise<void> {
    const deprecatedEndpoints = await this.getDeprecatedEndpoints();

    for (const endpoint of deprecatedEndpoints) {
      const users = await this.getUsersUsingEndpoint(endpoint.path);

      for (const user of users) {
        await this.notificationService.send({
          userId: user.id,
          organizationId: user.organizationId,
          type: 'api_deprecation',
          title: 'API Endpoint Deprecation',
          message: `The endpoint ${endpoint.path} will be removed on ${endpoint.sunsetDate}. Please migrate to ${endpoint.replacement}.`,
          data: {
            endpoint: endpoint.path,
            sunsetDate: endpoint.sunsetDate,
            replacement: endpoint.replacement,
          },
          priority: 'high',
        });
      }
    }
  }
}
```

## 10. Deprecation Dashboard

```typescript
// admin/deprecated-endpoints/deprecated-endpoints.controller.ts
@Controller('admin/deprecated-endpoints')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('admin.access')
export class DeprecatedEndpointsController {
  @Get()
  async getDeprecatedEndpoints() {
    return this.deprecationService.getDeprecatedEndpoints();
  }

  @Get('usage')
  async getUsageStats() {
    return this.deprecationService.getUsageStats();
  }

  @Post(':id/force-remove')
  async forceRemove(@Param('id') id: string) {
    await this.deprecationService.forceRemove(id);
    return { success: true };
  }
}
```
