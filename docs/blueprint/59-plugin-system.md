# 59 — Plugin System and Extensibility

## 1. Plugin Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Plugin System                               │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Plugin    │  │   Plugin    │  │   Plugin Registry        │ │
│  │   Manifest  │  │   Lifecycle │  │                         │ │
│  │             │  │             │  │ - Discovery             │ │
│  │ - name      │  │ - Install   │  │ - Validation            │ │
│  │ - version   │  │ - Enable    │  │ - Dependency Resolver   │ │
│  │ - hooks     │  │ - Disable   │  │ - Hot Reload            │ │
│  │ - perms     │  │ - Uninstall │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Hook System       │                        │
│                   │   (Event Pipeline)  │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Plugin Manifest

```yaml
# plugin.yaml
name: advanced-vat-reports
version: 1.0.0
description: Advanced VAT reporting with custom templates
author: Your Company
license: MIT

dependencies:
  - core: ">=1.0.0"
  - reporting: ">=1.0.0"

hooks:
  on_install:
    - create_default_templates
    - register_report_types
  on_enable:
    - register_menu_items
    - register_api_routes
  on_disable:
    - cleanup_temp_data
  on_uninstall:
    - drop_plugin_tables

permissions:
  - advanced_vat_reports.read
  - advanced_vat_reports.write
  - advanced_vat_reports.admin
```

## 3. Plugin Interface

```typescript
// plugins/plugin.interface.ts
export interface Plugin {
  readonly manifest: PluginManifest;
  readonly hooks: PluginHooks;

  install(context: PluginContext): Promise<void>;
  enable(): Promise<void>;
  disable(): Promise<void>;
  uninstall(): Promise<void>;
}

export interface PluginManifest {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly license: string;
  readonly dependencies: PluginDependency[];
  readonly hooks: HookDefinition[];
  readonly permissions: string[];
}

export interface PluginContext {
  readonly prisma: PrismaService;
  readonly eventBus: EventBus;
  readonly httpServer: INestApplication;
  readonly config: ConfigService;
}

export interface PluginHooks {
  onInstall?: (context: PluginContext) => Promise<void>;
  onEnable?: (context: PluginContext) => Promise<void>;
  onDisable?: (context: PluginContext) => Promise<void>;
  onUninstall?: (context: PluginContext) => Promise<void>;
  onUpgrade?: (from: string, to: string, context: PluginContext) => Promise<void>;
}
```

## 4. Plugin Registry

```typescript
// plugins/plugin-registry.service.ts
@Injectable()
export class PluginRegistryService {
  private readonly plugins = new Map<string, Plugin>();
  private readonly hooks = new Map<string, HookHandler[]>();

  async register(plugin: Plugin): Promise<void> {
    // Validate manifest
    await this.validateManifest(plugin.manifest);

    // Check dependencies
    await this.resolveDependencies(plugin.manifest.dependencies);

    // Load plugin
    this.plugins.set(plugin.manifest.name, plugin);

    // Register hooks
    for (const hookDef of plugin.manifest.hooks) {
      const handlers = this.hooks.get(hookDef.name) || [];
      handlers.push(plugin.hooks[hookDef.name].bind(plugin));
      this.hooks.set(hookDef.name, handlers);
    }
  }

  async trigger(hookName: string, context: HookContext): Promise<void> {
    const handlers = this.hooks.get(hookName) || [];
    for (const handler of handlers) {
      await handler(context);
    }
  }

  async install(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) throw new PluginNotFoundException(pluginName);

    await plugin.install(this.createContext());
    await this.updatePluginStatus(pluginName, 'installed');
  }

  async enable(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) throw new PluginNotFoundException(pluginName);

    await plugin.enable();
    await this.trigger('plugin.enabled', { pluginName });
    await this.updatePluginStatus(pluginName, 'enabled');
  }

  list(): PluginInfo[] {
    return Array.from(this.plugins.values()).map((plugin) => ({
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      status: this.getPluginStatus(plugin.manifest.name),
      dependencies: plugin.manifest.dependencies,
    }));
  }
}
```

## 5. Hook System

```typescript
// plugins/hooks.ts
export type HookName =
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.deleted'
  | 'vat_return.submitted'
  | 'vat_return.approved'
  | 'invoice.generated'
  | 'payment.processed'
  | 'report.generated'
  | 'user.created'
  | 'menu.registered'
  | 'api.registered';

export interface HookContext {
  readonly organizationId: string;
  readonly userId?: string;
  readonly data: any;
}

export interface HookHandler {
  (context: HookContext): Promise<void>;
}
```

## 6. Hook Middleware

```typescript
// plugins/hook-middleware.decorator.ts
export function Hook(event: HookName) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: HookContext = {
        organizationId: args[0].organizationId,
        userId: args[0].userId,
        data: args[0],
      };

      // Execute before hooks
      await pluginRegistry.trigger(`${event}.before`, context);

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Execute after hooks
      context.data.result = result;
      await pluginRegistry.trigger(`${event}.after`, context);

      return result;
    };

    return descriptor;
  };
}

// Usage
export class TransactionService {
  @Hook('transaction.created')
  async create(orgId: string, dto: CreateTransactionDto): Promise<Transaction> {
    // ... business logic
  }
}
```

## 7. Plugin Permissions

```typescript
// plugins/permissions.ts
export const PLUGIN_PERMISSIONS: Record<string, string[]> = {
  'advanced-vat-reports': [
    'advanced_vat_reports.read',
    'advanced_vat_reports.write',
    'advanced_vat_reports.admin',
  ],
  'custom-invoicing': [
    'custom_invoicing.read',
    'custom_invoicing.write',
  ],
};
```

## 8. Plugin API

```typescript
// plugins/plugin.controller.ts
@Controller('plugins')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('plugins.admin')
export class PluginController {
  @Get()
  async list() {
    return this.pluginRegistry.list();
  }

  @Post(':name/install')
  async install(@Param('name') name: string) {
    return this.pluginRegistry.install(name);
  }

  @Post(':name/enable')
  async enable(@Param('name') name: string) {
    return this.pluginRegistry.enable(name);
  }

  @Post(':name/disable')
  async disable(@Param('name') name: string) {
    return this.pluginRegistry.disable(name);
  }

  @Delete(':name/uninstall')
  async uninstall(@Param('name') name: string) {
    return this.pluginRegistry.uninstall(name);
  }
}
```

## 9. Marketplace Integration

```typescript
// plugins/marketplace.service.ts
@Injectable()
export class PluginMarketplaceService {
  async search(query: string, filters: MarketplaceFilters): Promise<MarketplacePlugin[]> {
    const response = await fetch(`${this.config.get('MARKETPLACE_URL')}/plugins/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.get('MARKETPLACE_API_KEY')}` },
      body: JSON.stringify({ query, filters }),
    });

    return response.json();
  }

  async installFromMarketplace(pluginId: string, version: string): Promise<void> {
    const plugin = await this.search(pluginId, {});
    const response = await fetch(`${this.config.get('MARKETPLACE_URL')}/plugins/${pluginId}/download`, {
      headers: { 'Authorization': `Bearer ${this.config.get('MARKETPLACE_API_KEY')}` },
    });

    const tarball = Buffer.from(await response.arrayBuffer());
    await this.extractAndInstall(pluginId, version, tarball);
  }
}
```
