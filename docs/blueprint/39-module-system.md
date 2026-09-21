# 39 — Module System and Extensibility

## 1. Module Architecture

The system replaces Laravel's modular monolith (`akaunting/laravel-module`) with Nx feature libraries and NestJS dynamic modules.

```
libs/
├── feature/                    # Core feature modules (always loaded)
│   ├── organizations/
│   ├── users/
│   ├── vat-registrations/
│   ├── vat-returns/
│   ├── transactions/
│   └── jurisdictions/
├── integration/                # Optional integration modules
│   ├── hmrc/
│   ├── eurovat/
│   ├── xero/
│   └── quickbooks/
└── plugin/                     # Third-party plugins (loadable at runtime)
    └── sample-plugin/
```

## 2. Core vs Plugin Modules

| Type | Examples | Loading | Dependencies |
|------|----------|---------|-------------|
| Core | organizations, users, vat-returns | Compile-time | Always available |
| Integration | hmrc, eurovat, xero | Config-driven | Feature-flagged |
| Plugin | Custom extensions | Runtime discovery | Isolated |

## 3. Feature Module Structure

```
libs/feature/vat-returns/
├── src/
│   ├── lib/
│   │   ├── vat-returns.module.ts
│   │   ├── vat-returns.controller.ts
│   │   ├── vat-returns.service.ts
│   │   ├── vat-returns.repository.ts
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── interfaces/
│   │   ├── mappers/
│   │   └── events/
│   └── index.ts
├── test/
├── project.json
└── tsconfig.lib.json
```

## 4. Dynamic Module Loading

```typescript
// apps/api/src/app.module.ts
@Module({})
export class AppModule {
  constructor(
    private readonly configService: ConfigService,
    private readonly moduleLoader: ModuleLoaderService,
  ) {
    this.moduleLoader.loadEnabledModules();
  }
}

// module-loader.service.ts
@Injectable()
export class ModuleLoaderService {
  private readonly moduleMap = new Map<string, DynamicModule>([
    ['hmrc', HMRCModule],
    ['eurovat', EuroVatModule],
    ['xero', XeroModule],
    ['quickbooks', QuickBooksModule],
  ]);

  loadEnabledModules(): void {
    const enabledModules = this.configService.get('ENABLED_MODULES', '').split(',');

    for (const moduleName of enabledModules) {
      const module = this.moduleMap.get(moduleName.trim());
      if (module) {
        this.registerModule(module);
      }
    }
  }

  private registerModule(module: DynamicModule): void {
    // Register module dynamically
  }
}
```

## 5. Feature Flags

```typescript
// libs/api-core/config/src/feature-flags.service.ts
@Injectable()
export class FeatureFlagService {
  private readonly flags = new Map<string, boolean>();

  constructor(private readonly configService: ConfigService) {
    this.loadFlags();
  }

  private loadFlags(): void {
    const flags = this.configService.get('FEATURE_FLAGS', {});
    for (const [key, value] of Object.entries(flags)) {
      this.flags.set(key, value);
    }
  }

  isEnabled(flag: string): boolean {
    return this.flags.get(flag) ?? false;
  }
}

// Usage in module
@Module({
  imports: [
    VatReturnsModule,
    ...(this.featureFlagService.isEnabled('advanced_reports') ? [AdvancedReportsModule] : []),
  ],
})
export class AppModule {}
```

## 6. Plugin System

```typescript
// plugin/plugin.interface.ts
export interface Plugin {
  readonly name: string;
  readonly version: string;
  readonly description: string;

  register(module: Module): DynamicModule;
  boot?(app: INestApplicationContext): Promise<void>;
  shutdown?(app: INestApplicationContext): Promise<void>;
}

// plugin/plugin-loader.service.ts
@Injectable()
export class PluginLoaderService {
  async loadPlugins(pluginDir: string): Promise<void> {
    const plugins = await this.discoverPlugins(pluginDir);

    for (const plugin of plugins) {
      await this.loadPlugin(plugin);
    }
  }

  private async discoverPlugins(dir: string): Promise<Plugin[]> {
    // Scan directory for plugin manifests
    const manifests = await glob(`${dir}/*/plugin.json`);
    return Promise.all(manifests.map(this.loadPluginManifest));
  }

  private async loadPlugin(plugin: Plugin): Promise<void> {
    const module = plugin.register(this.moduleRef);
    this.moduleRef.register(module);
  }
}
```

## 7. Module Manifest

```json
{
  "name": "hmrc",
  "version": "1.0.0",
  "description": "HMRC Making Tax Digital integration",
  "main": "dist/index.js",
  "permissions": ["integrations.connect", "vat_returns.submit"],
  "dependencies": [],
  "config": {
    "HMRC_CLIENT_ID": { "type": "string", "required": true },
    "HMRC_CLIENT_SECRET": { "type": "string", "required": true }
  }
}
```

## 8. Module Lifecycle

```typescript
// Module lifecycle events
export enum ModuleLifecycleEvent {
  Installing = 'module.installing',
  Installed = 'module.installed',
  Enabling = 'module.enabling',
  Enabled = 'module.enabled',
  Disabling = 'module.disabling',
  Disabled = 'module.disabled',
  Uninstalling = 'module.uninstalling',
  Uninstalled = 'module.uninstalled',
  Updating = 'module.updating',
  Updated = 'module.updated',
}
```

## 9. Laravel Module Mapping

| Laravel Concept | Nx/NestJS Equivalent |
|----------------|---------------------|
| `modules/<Vendor>/<Module>/` | `libs/feature/` or `libs/integration/` |
| `module.json` | `project.json` + optional `plugin.json` |
| `EnableModule` Job | Feature flag + dynamic module loading |
| `InstallModule` Job | Nx build + npm publish (for plugins) |
| `laravel-module` discovery | Nx project graph + explicit imports |
| Module overrides | NestJS module overrides + dependency injection |
