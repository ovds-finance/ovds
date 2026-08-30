<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Module Migration Guide

This guide shows how to migrate an existing OVDS NestJS module to adopt
the new modular architecture.

## Before (legacy module)

```ts
@Module({
  imports: [PrismaModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
```

## After (modular module)

```ts
// packages/modules/hr/src/hr.provider.ts
export const hrModule: ModuleInterface = {
  info: {
    name: 'hr',
    displayName: 'Human Resources',
    version: '1.0.0',
    category: 'hr',
    icon: 'Users',
    dependsOn: ['core'],
  },

  register(eventBus: EventBusInterface): void {
    eventBus.listen('core.company.created', async (event) => {
      // seed default leave policies
    });
  },

  boot(container: ModuleContainer): void {
    // start background attendance sync
  },

  routes(): ModuleRoute[] {
    return [
      { path: '/hr/employees', component: '@ovds/modules/hr/pages/Employees' },
    ];
  },

  menus(): MenuItem[] {
    return [
      { key: 'hr', label: 'HR', path: '/hr', icon: 'Users', order: 1 },
    ];
  },

  settings(): ModuleSetting[] {
    return [
      { key: 'leave_policy', label: 'Leave Policy', type: 'select', options: [...] },
    ];
  },

  permissions(): ModulePermission[] {
    return [
      { key: 'hr.view', label: 'View HR' },
      { key: 'hr.manage', label: 'Manage HR' },
    ];
  },
};
```

## Step-by-step checklist

- [ ] Add `packages/modules/<name>/src/<name>.provider.ts`
- [ ] Implement `ModuleInterface`
- [ ] Move DTOs into `dto/` subfolder
- [ ] Move event listeners from `register()` in the NestJS module into the provider
- [ ] Add `menus()`, `settings()`, `permissions()` declarations
- [ ] Add path alias in `tsconfig.base.json`
- [ ] Add `"type:module"` tag to `project.json`
- [ ] Register module in `ModuleRegistryService.onModuleInit()`



