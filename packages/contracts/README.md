# @ovds/contracts

NestJS contracts for the OVDS platform. Provides Zod schemas, validation pipes, exception filters, and response interceptors for consistent API behavior.

## Structure

```
packages/contracts/
├── src/
│   ├── pipes/
│   │   └── zod-validation.pipe.ts   # Zod-based request validation
│   ├── filters/
│   │   └── http-exception.filter.ts # Standard ApiResponse envelope
│   ├── interceptors/
│   │   └── serialize-response.interceptor.ts # Entity → DTO transformation
│   ├── schemas/
│   │   ├── common.ts                # Shared schemas (pagination, etc.)
│   │   ├── auth.ts                  # Auth domain schemas
│   │   ├── sales.ts                 # Sales domain schemas
│   │   └── ...                      # 20+ domain schema files
│   └── index.ts                     # Barrel exports
└── package.json
```

## Usage

### Zod Validation Pipe

Replace class-validator with Zod for consistent validation:

```ts
import { ZodValidationPipe } from '@ovds/contracts';
import { CreateInvoiceSchema } from '@ovds/dto';

@Post()
create(
  @Body(new ZodValidationPipe(CreateInvoiceSchema)) 
  dto: z.infer<typeof CreateInvoiceSchema>
) {
  return this.service.create(dto);
}
```

### Exception Filter

Apply globally to standardize error responses:

```ts
import { HttpExceptionFilter } from '@ovds/contracts';

// In main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

All errors are returned in the standard envelope:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: 2 error(s)",
  "fields": {
    "email": "Invalid email address",
    "password": "Password is required"
  },
  "error": "Bad Request",
  "requestId": "abc-123",
  "timestamp": "2026-09-06T04:00:00.000Z"
}
```

### Response Interceptor

Automatically serialize Prisma entities:

```ts
import { SerializeResponseInterceptor } from '@ovds/contracts';

@UseInterceptors(SerializeResponseInterceptor)
@Controller('invoices')
export class InvoicesController {
  @Get()
  findAll() {
    return this.service.findAll(); // Prisma entities → clean JSON
  }
}
```

## Schema Organization

Schemas are organized by domain:

| File | Domain |
|------|--------|
| `schemas/auth.ts` | Authentication, users, roles |
| `schemas/sales.ts` | Invoices, estimates, credit notes |
| `schemas/banking.ts` | Accounts, transactions, reconciliations |
| `schemas/hr.ts` | Employees, departments, leave, payroll |
| `schemas/tax.ts` | VAT, WHT, TOT, BIT, compliance |
| `schemas/settings.ts` | Settings, RBAC, setup wizard |
| `schemas/inventory.ts` | Items, warehouses, stock |
| `schemas/crm.ts` | Leads, opportunities, activities |
| `schemas/trade.ts` | Shipments, forex, proforma |
| `schemas/loyalty.ts` | Loyalty transactions, tiers |
| `schemas/projects.ts` | Projects, tasks, timers |
| `schemas/accounting.ts` | Journal entries, accounts |
| `schemas/compliance.ts` | Controls, risks, incidents |

## Best Practices

1. **Schemas in contracts** — Define schemas in `@ovds/contracts/schemas`
2. **Mirror in dto** — Mirror schemas in `@ovds/dto` for frontend use
3. **Use pipes** — Apply `ZodValidationPipe` to all controller endpoints
4. **Use interceptors** — Apply `SerializeResponseInterceptor` globally
5. **Use filters** — Apply `HttpExceptionFilter` globally for consistent errors
