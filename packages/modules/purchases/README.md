# Purchases, Expenses, Bills & Vendors

Canonical OVDS module (`packages/modules/purchases`).

Akaunting-inspired, DDD-aligned module layout:

```
modules/purchases/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains/purchases)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/purchases)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-purchases` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
