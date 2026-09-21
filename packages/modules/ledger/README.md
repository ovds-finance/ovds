# General Ledger, Chart of Accounts & Double-Entry

Canonical OVDS module (`packages/modules/ledger`).

Ovds SaaS DDD-aligned module layout:

```
modules/ledger/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains-accounting)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/accounting)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-ledger` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
