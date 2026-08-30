<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# OVDS Modular Architecture

OVDS uses an OVDS-inspired modular architecture where every business capability
lives in an **independent module** that hooks into a **central Core System**.

## Layered overview

```
                        React SPA (frontend)
                         └── ModuleProvider
                         └── ModuleRouter
                               │
                    oRPC / HTTP API contracts
                               │
           ┌───────────────────┴─────────────────────┐
           │            Core System                    │
           │  @ovds/core  +  ModuleRegistryService     │
           │                                           │
           │  Events • Providers • Settings • Menu     │
           └─────────┬─────────────────┬───────────────┘
                     │                 │
            NestJS module      NestJS module
            (HR)               (ovds)
                     │                 │
                     └────────┬────────┘
                              │
                       Prisma + MySQL
```

## Core System (`@ovds/core`)

Located in `packages/core/`. Provides the kernel that all modules plug into:

| Concern | Interface / Class | Purpose |
|---------|------------------|---------|
| Module contract | `ModuleInterface` | Every module implements this |
| Module registry | `ModuleRegistry` | Load-order, dependency resolution, enable/disable |
| Event bus | `EventBus` / `EventDispatcher` | Pub/sub with priority ordering |
| Settings | `SettingsServiceInterface` | Module-scoped key/value settings |
| Menu | `MenuBuilderInterface` | Dynamic shell navigation built by modules |
| Providers | `CoreServiceProvider` | Bootstrapped before modules boot |
| Constants | `CORE_EVENTS`, `MODULE_CATEGORIES` | Canonical event names and categories |

## Module layout

Each module is an independent package under `packages/modules/<module-name>/`:

```
packages/modules/<module-name>/
├── src/
│   ├── <module-name>.provider.ts   # ModuleInterface implementation
│   ├── <module-name>.module.ts     # Optional NestJS module
│   ├── <module-name>.controller.ts # REST / oRPC endpoints
│   ├── <module-name>.service.ts    # Business logic
│   ├── dto/                        # Request/response types
│   └── events/                     # Module-specific event listeners
├── prisma/                         # Module-specific schema extensions
├── package.json
├── project.json
└── tsconfig.json
```

## Module contract (`ModuleInterface`)

```ts
export interface ModuleInterface {
  info: ModuleInfo;              // name, displayName, version, category, dependsOn
  register(eventBus): void;      // Subscribe to events
  boot(container): void;         // Start background jobs, warm caches
  routes(): ModuleRoute[];       // Paths this module owns
  menus(): MenuItem[];           // Navigation entries
  settings(): ModuleSetting[];   // Configuration keys
  permissions(): ModulePermission[]; // RBAC permissions
  migrations?: string[];         // Prisma migration seeds
  health?(): Promise<ModuleHealth>;
}
```

## Creating a new module

1. Create `packages/modules/<name>/`
2. Implement `ModuleInterface` in `<name>.provider.ts`
3. Register the module in `ModuleRegistryService` (or auto-discover it)
4. Add Prisma models to the core schema (or extend in module schema)
5. Tag with `"type:module"` in `project.json`
6. Add path alias to `tsconfig.base.json`

## Per-company enable / disable

`ModuleManifest` tracks installed modules. `CompanyModule` tracks which modules
are enabled per company with per-company JSON settings. Toggling a module
dispatches `core.module.enabled` or `core.module.disabled` so the rest of the
system can react.

## Event catalog

Core events live in `CORE_EVENTS` (`packages/core/src/constants.ts`):

- `core.module.registered`
- `core.module.booted`
- `core.module.enabled`
- `core.module.disabled`
- `core.settings.updated`
- `core.company.created`
- `core.user.created`
- `core.menu.built`



