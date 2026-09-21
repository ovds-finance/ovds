# Authentication, Users & Access Control

Canonical OVDS module (`packages/modules/auth`).

Ovds SaaS DDD-aligned module layout:

```
modules/auth/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/features/auth)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/auth)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-auth` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
