# Platform, App Store & Releases

Canonical OVDS module (`packages/modules/platform`).

Akaunting-inspired, DDD-aligned module layout:

```
modules/platform/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/domains/platform)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/platform)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-platform` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
