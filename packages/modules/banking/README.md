# Banking, Transactions & Reconciliation

Canonical OVDS module (`packages/modules/banking`).

Ovds SaaS DDD-aligned module layout:

```
modules/banking/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains-banking)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/banking)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-banking` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
