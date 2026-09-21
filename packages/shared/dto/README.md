# @ovds/dto

Shared Data Transfer Objects for the OVDS platform. Provides Zod schemas, class-validator DTOs, and serialization utilities shared between React (frontend) and NestJS (backend).

## Structure

```
packages/shared/dto/
├── src/
│   ├── common/
│   │   ├── zod-bridge.ts       # Shared Zod schemas (Login, Register, etc.)
│   │   ├── serializer.ts       # Entity → DTO serialization
│   │   └── pagination.dto.ts   # Pagination DTO classes
│   ├── auth/zod-bridge.ts      # Auth domain schemas
│   ├── hr/zod-bridge.ts        # HR domain schemas
│   ├── ovds/zod-bridge.ts      # Invoice/Bill/Customer/Vendor schemas
│   ├── trade/zod-bridge.ts     # Trade/Shipping schemas
│   ├── loyalty/zod-bridge.ts   # Loyalty schemas
│   ├── settings/zod-bridge.ts  # Settings/RBAC schemas
│   ├── banking/zod-bridge.ts   # Banking schemas
│   ├── crm/zod-bridge.ts       # CRM schemas
│   ├── inventory/zod-bridge.ts # Inventory schemas
│   ├── purchases/zod-bridge.ts # Purchase orders, GRNs
│   ├── tax/zod-bridge.ts       # VAT, WHT, TOT schemas
│   ├── accounting/zod-bridge.ts # Journal entries, accounts
│   ├── compliance/zod-bridge.ts # Compliance schemas
│   └── projects/zod-bridge.ts  # Project management schemas
└── package.json
```

## Usage

### React (Frontend)

```tsx
import { useZodForm } from '@ovds/ui';
import { LoginSchema, CreateInvoiceSchema } from '@ovds/dto';

function LoginForm() {
  const { register, handleSubmit } = useZodForm({
    schema: LoginSchema,
    defaultValues: { username: '', password: '' }
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username')} />
      <input type="password" {...register('password')} />
      <button type="submit">Sign in</button>
    </form>
  );
}
```

### NestJS (Backend)

```ts
import { ZodValidationPipe } from '@ovds/contracts';
import { LoginSchema, CreateInvoiceSchema } from '@ovds/dto';

@Post('login')
login(@Body(new ZodValidationPipe(LoginSchema)) dto: z.infer<typeof LoginSchema>) {
  return this.authService.validate(dto);
}
```

## Serialization

Convert Prisma entities to clean DTOs before sending to frontend:

```ts
import { serializeEntity, serializePaginated, stripSensitive } from '@ovds/dto';

// Single entity
const clean = serializeEntity(rawEntity, {
  omit: ['internalNotes'],
  datesToIso: true,
  decimalsToString: true,
});

// Paginated response
const page = serializePaginated(
  entities.map(serializeEntity),
  total,
  page,
  limit,
);
```

## Schema Naming Convention

| Pattern | Example | Usage |
|---------|---------|-------|
| `XxxSchema` | `InvoiceSchema` | Validation schema |
| `CreateXxxSchema` | `CreateInvoiceSchema` | Create form |
| `UpdateXxxSchema` | `UpdateInvoiceSchema` | Update form |
| `Xxx` | `Invoice` | TypeScript type |

## Domain Coverage

| Domain | Schemas | Status |
|--------|---------|--------|
| auth | Login, Register, User, Role | ✅ Complete |
| hr | Employee, Department, Leave, Payroll | ✅ Complete |
| ovds | Invoice, Bill, Customer, Vendor | ✅ Complete |
| trade | Shipment, Forex, Proforma | ✅ Complete |
| loyalty | Transaction, Tier, Reward | ✅ Complete |
| settings | Categories, RBAC, Wizard | ✅ Complete |
| banking | Accounts, Transactions, Reconciliation | ✅ Complete |
| crm | Leads, Opportunities, Activities | ✅ Complete |
| inventory | Items, Warehouses, Stock | ✅ Complete |
| purchases | PO, GRN, Debit Note, Payment | ✅ Complete |
| tax | VAT, WHT, TOT, BIT, Compliance | ✅ Complete |
| accounting | Journal, Accounts, Fiscal Year | ✅ Complete |
| compliance | Frameworks, Controls, Risks | ✅ Complete |
| projects | Projects, Tasks, Timers | ✅ Complete |

## Best Practices

1. **Shared schemas** — Define in `@ovds/contracts/schemas`, mirror in `@ovds/dto`
2. **Frontend validation** — Use `useZodForm` with schemas from `@ovds/dto`
3. **Backend validation** — Use `ZodValidationPipe` with schemas from `@ovds/dto`
4. **Serialization** — Always use `serializeEntity` before returning Prisma entities
5. **No hardcoded values** — Use design tokens for colors, spacing, typography
