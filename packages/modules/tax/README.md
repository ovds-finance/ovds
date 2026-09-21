# Tax, VAT, WHT & Declarations

Canonical OVDS module (`packages/modules/tax`).

Ovds SaaS DDD-aligned module layout:

```
modules/tax/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains-tax)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/tax)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-tax` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
