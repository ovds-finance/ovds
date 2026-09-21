# 41 — Laravel to NestJS Pattern Translation

## 1. Architecture Pattern Mapping

| Laravel Concept | NestJS Equivalent | Key Difference |
|----------------|------------------|----------------|
| `App\Abstracts\Controller` | `@Controller()` + base class | Decorators vs inheritance |
| `FormRequest` | `ZodValidationPipe` + DTO | Schema-first validation |
| `Eloquent Model` | Prisma Client + Repository | ORM vs query builder |
| `Global Scope` | Prisma Middleware | Automatic query modification |
| `Job` (sync) | Service method | Direct method call |
| `Job` (queued) | BullMQ Processor | Background processing |
| `Event` | Event class + EventBus | Explicit interface |
| `Listener` | `@EventsListener` decorator | Decorator-based subscription |
| `Service Provider` | NestJS Module | DI container |
| `Facade` | Injectable Service | Explicit dependency injection |
| `Helper` | Utility class / function | Plain TypeScript |
| `Blade Component` | React Component | Component-based UI |
| `Livewire` | React + TanStack Query | Client-side reactivity |
| `Middleware` | NestJS Middleware / Guard | Pipeline |
| `Route Macro` | NestJS Route decorator | Declarative routing |
| `Artisan Command` | NestJS Command (Commander) | CLI framework |
| `Migration` | Prisma Migration | Schema-first |
| `Seeder` | Seed script | Data initialization |
| `Factory` | Test factory / Faker | Test data |
| `Policy` | Guard + Permission check | Authorization |
| `Resource` | DTO + TransformInterceptor | API response shaping |
| `Observer` | Event listener | Model lifecycle |
| `Trait` | Mixin / utility class | Code reuse |
| `Contract` | TypeScript interface | Type safety |

## 2. Request Lifecycle Translation

### 2.1 Laravel Lifecycle

```
Request → Middleware → Route → Controller → FormRequest → Job → Event → Listener → Response
```

### 2.2 NestJS Lifecycle

```
Request → Middleware → Guard → Pipe → Controller → Service → Repository → Prisma → Response
             ↓              ↓       ↓
        TenantResolver   JwtAuth  ZodValidation
```

## 3. Controller Pattern Translation

### 3.1 Laravel Controller

```php
// Laravel: app/Http/Controllers/DocumentController.php
class DocumentController extends Controller {
  public function index(Request $request) {
    $documents = Document::collect('document', $request);
    return response()->json($documents);
  }

  public function store(StoreDocumentRequest $request) {
    $document = $this->dispatch(new CreateDocument($request));
    return response()->json($document, 201);
  }
}
```

### 3.2 NestJS Translation

```typescript
// NestJS: vat-returns/vat-returns.controller.ts
@Controller('vat-returns')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class VatReturnsController {
  constructor(private readonly vatReturnsService: VatReturnsService) {}

  @Get()
  @Permissions('vat_returns.read')
  async findAll(@Query() query: QueryVatReturnDto) {
    const { data, meta } = await this.vatReturnsService.findMany(query);
    return this.buildPaginatedResponse(data, meta);
  }

  @Post()
  @Permissions('vat_returns.create')
  async create(@Body() dto: CreateVatReturnDto, @CurrentUser() user: User) {
    const vatReturn = await this.vatReturnsService.create(dto, user.id);
    return { data: vatReturn };
  }
}
```

## 4. Model Pattern Translation

### 4.1 Laravel Model

```php
// Laravel: app/Models/Document/Document.php
class Document extends Model {
  use Tenants, Owners, Sources, Sortable, SoftDeletes;

  protected $fillable = ['company_id', 'type', 'status', 'amount', ...];
  protected $casts = ['amount' => 'double', 'enabled' => 'boolean'];

  public function items() { return $this->hasMany(DocumentItem::class); }
  public function history() { return $this->hasMany(DocumentHistory::class); }
}
```

### 4.2 NestJS Translation

```typescript
// NestJS: entities/vat-return.entity.ts
export class VatReturn {
  id: string;
  organizationId: string;
  vatRegistrationId: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  status: VatReturnStatus;
  version: number;
  totalSales?: Decimal;
  totalVatDue?: Decimal;
  netVatDue?: Decimal;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Prisma schema handles relations
// vat-return.repository.ts
@Injectable()
export class VatReturnRepository {
  async findById(id: string, orgId: string): Promise<VatReturn | null> {
    return this.prisma.vatReturn.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: { items: true, history: true },
    });
  }
}
```

## 5. Validation Translation

### 5.1 Laravel FormRequest

```php
// Laravel: app/Http/Requests/Document/StoreDocumentRequest.php
class StoreDocumentRequest extends FormRequest {
  public function rules() {
    return [
      'contact_id' => 'required|exists:contacts,id',
      'items' => 'required|array|min:1',
      'items.*.name' => 'required|string',
      'items.*.quantity' => 'required|numeric',
    ];
  }
}
```

### 5.2 NestJS Translation

```typescript
// NestJS: dto/create-vat-return.dto.ts
import { z } from 'zod';

export const CreateVatReturnSchema = z.object({
  vatRegistrationId: z.string().cuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  items: z.array(
    z.object({
      type: z.enum(['sales', 'purchases', 'adjustments']),
      boxCode: z.string(),
      netAmount: z.number().positive(),
      vatRate: z.number().min(0).max(100),
      vatAmount: z.number().min(0),
      grossAmount: z.number().positive(),
    })
  ).min(1),
});

export type CreateVatReturnDto = z.infer<typeof CreateVatReturnSchema>;
```

## 6. Middleware Translation

### 6.1 Laravel Middleware

```php
// Laravel: app/Http/Middleware/IdentifyCompany.php
class IdentifyCompany {
  public function handle($request, Closure $next) {
    $company = Company::where('slug', $request->route('slug'))->firstOrFail();
    Company::setCurrent($company);
    return $next($request);
  }
}
```

### 6.2 NestJS Translation

```typescript
// NestJS: tenant/tenant-resolver.middleware.ts
@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly tenantResolver: TenantResolverService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const organization = await this.tenantResolver.resolve(req);
    req.organization = organization;

    // Set PostgreSQL RLS context
    await this.prisma.$executeRaw`SET app.current_organization_id = ${organization.id}`;

    next();
  }
}
```

## 7. Global Scope Translation

### 7.1 Laravel Global Scope

```php
// Laravel: app/Scopes/Company.php
class Company implements Scope {
  public function apply(Builder $builder, Model $model) {
    $builder->where('company_id', Company::current()->id);
  }
}
```

### 7.2 NestJS Translation

```typescript
// NestJS: prisma/tenant-middleware.ts
export function applyTenantMiddleware(prisma: PrismaService) {
  prisma.$use(async (params, next) => {
    const orgId = TenantContext.getOrganizationId();
    if (!orgId) return next(params);

    const tenantTables = ['VatRegistration', 'VatReturn', 'Transaction'];

    if (tenantTables.includes(params.model)) {
      switch (params.action) {
        case 'findMany':
        case 'findFirst':
        case 'findUnique':
          params.args.where = { ...params.args.where, organizationId: orgId, deletedAt: null };
          break;
        case 'create':
          params.args.data = { ...params.args.data, organizationId: orgId };
          break;
      }
    }

    return next(params);
  });
}
```

## 8. Job Pattern Translation

### 8.1 Laravel Job

```php
// Laravel: app/Jobs/Document/CreateDocument.php
class CreateDocument implements ShouldCreate, HasOwner, HasSource {
  public function handle() {
    // 1. Authorize
    // 2. Boot
    // 3. Create
    // 4. Fire event
  }
}
```

### 8.2 NestJS Translation

```typescript
// NestJS: vat-returns.service.ts
@Injectable()
export class VatReturnsService {
  async create(dto: CreateVatReturnDto, userId: string): Promise<VatReturn> {
    // 1. Authorize (guard handles this)
    // 2. Create
    const vatReturn = await this.createVatReturn(dto, userId);
    // 3. Fire event
    await this.eventBus.emit(new VatReturnCreatedEvent(vatReturn.id));
    return vatReturn;
  }
}
```

## 9. Event Listener Translation

### 9.1 Laravel Listener

```php
// Laravel: app/Listeners/Document/CreateDocumentCreatedHistory.php
class CreateDocumentCreatedHistory {
  public function handle(DocumentCreated $event) {
    DocumentHistory::create([...]);
  }
}
```

### 9.2 NestJS Translation

```typescript
// NestJS: listeners/document/vat-return-created.listener.ts
@EventsListener(VatReturnCreatedEvent)
export class VatReturnCreatedListener {
  constructor(private readonly historyService: VatReturnHistoryService) {}

  async handle(event: VatReturnCreatedEvent): Promise<void> {
    await this.historyService.create({
      vatReturnId: event.returnId,
      action: 'created',
      userId: event.createdBy,
    });
  }
}
```

## 10. Frontend Pattern Translation

### 10.1 Laravel Blade + Livewire

```blade
{{-- Laravel: resources/views/documents/index.blade.php --}}
<x-table>
  @foreach ($documents as $document)
    <tr>
      <td>{{ $document->number }}</td>
      <td>{{ $document->status }}</td>
      <td>{{ $document->amount }}</td>
    </tr>
  @endforeach
</x-table>

@livewire('notifications')
```

### 10.2 React Translation

```typescript
// NestJS: apps/web/src/features/vat-returns/components/return-list.tsx
export function ReturnList() {
  const { data: returns, isLoading } = useVatReturns();

  if (isLoading) return <Skeleton rows={5} />;

  return (
    <DataTable data={returns} columns={columns}>
      <TableBody>
        {returns.map((ret) => (
          <TableRow key={ret.id}>
            <TableCell>{ret.number}</TableCell>
            <TableCell><StatusBadge status={ret.status} /></TableCell>
            <TableCell><Currency amount={ret.netVatDue} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
```
