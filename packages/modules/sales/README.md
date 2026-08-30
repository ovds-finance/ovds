# Sales, Invoicing, Customers & CRM

Canonical OVDS module (`packages/modules/sales`).

Akaunting-inspired, DDD-aligned module layout:

```
modules/sales/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains/sales)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/sales)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-sales` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
