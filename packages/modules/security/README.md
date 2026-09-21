# Security & Cyber Audit

Canonical OVDS module (`packages/modules/security`).

Ovds SaaS DDD-aligned module layout:

```
modules/security/
  src/
    index.ts        # public barrel (domain types + namespaced web)
    domain/         # centralized domain types & rules  (@ovds/features/security)
    dto/            # zod / class-validator contracts
    web/            # React pages & components           (@ovds/features/security)
```

This module absorbs the previously-scattered packages for this bounded context.
Import from `@ovds/modules-security` instead of the old `features/*` / `domains/*`
packages; those remain as backward-compatible shims until fully migrated.
