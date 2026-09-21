# Reports & Analytics

Canonical OVDS module (`packages/modules/reports`).

Ovds SaaS DDD-aligned module layout:

```
modules/reports/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains-reporting)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/reporting)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-reports` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
