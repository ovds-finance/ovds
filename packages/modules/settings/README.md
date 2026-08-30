# Company Profile, Currencies & Localization

Canonical OVDS module (`packages/modules/settings`).

Akaunting-inspired, DDD-aligned module layout:

```
modules/settings/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/features/settings)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/settings)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-settings` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
