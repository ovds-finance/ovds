# Common Cross-Cutting Utilities

Canonical OVDS module (`packages/modules/common`).

Ovds SaaS DDD-aligned module layout:

```
modules/common/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/shared)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/ui)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-common` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
