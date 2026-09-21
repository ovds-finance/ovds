# Items, Inventory & Manufacturing

Canonical OVDS module (`packages/modules/items`).

Ovds SaaS DDD-aligned module layout:

```
modules/items/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains-items)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/items)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-items` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
