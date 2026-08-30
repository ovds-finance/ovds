# Project Accounting

Canonical OVDS module (`packages/modules/projects`).

Akaunting-inspired, DDD-aligned module layout:

```
modules/projects/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains/projects)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/projects)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-projects` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
