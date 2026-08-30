import { describe, it, expect } from 'vitest';
import { maintainingTechnologyModule, MaintainingTechnologyModuleProvider } from './index';
import { createMockEventBus, createMockContainer } from '@ovds/core';

describe('MaintainingTechnologyModuleProvider', () => {
  it('is created from the singleton instance', () => {
    expect(maintainingTechnologyModule).toBeInstanceOf(MaintainingTechnologyModuleProvider);
  });

  it('has correct module info', () => {
    expect(maintainingTechnologyModule.info.name).toBe('maintaining-technology');
    expect(maintainingTechnologyModule.info.displayName).toBe('Maintaining Technology');
    expect(maintainingTechnologyModule.info.category).toBe('maintaining-technology');
    expect(maintainingTechnologyModule.info.icon).toBe('Server');
    expect(maintainingTechnologyModule.info.dependsOn).toContain('core');
    expect(maintainingTechnologyModule.info.dependsOn).toContain('settings');
  });

  it('defines routes for maintaining technology', () => {
    const routes = maintainingTechnologyModule.routes();
    const paths = routes.map((r) => r.path);

    expect(paths).toContain('/settings/maintaining-technology');
  });

  it('defines default settings', () => {
    const settings = maintainingTechnologyModule.settings();
    const keys = settings.map((s) => s.key);

    expect(keys).toContain('backup_frequency');
    expect(keys).toContain('auto_backup_enabled');
    expect(keys).toContain('cloud_sync_enabled');
    expect(keys).toContain('min_free_storage_pct');
    expect(keys).toContain('permission_review_frequency');
  });

  it('defines permissions', () => {
    const permissions = maintainingTechnologyModule.permissions();
    const keys = permissions.map((p) => p.key);

    expect(keys).toContain('maintaining_technology.view');
    expect(keys).toContain('maintaining_technology.manage_backups');
    expect(keys).toContain('maintaining_technology.manage_patches');
    expect(keys).toContain('maintaining_technology.manage_access');
    expect(keys).toContain('maintaining_technology.run_diagnostics');
    expect(keys).toContain('maintaining_technology.manage_settings');
  });

  it('registers and boots successfully', async () => {
    const mod = new MaintainingTechnologyModuleProvider();
    const eventBus = createMockEventBus();
    const container = createMockContainer();

    await mod.register(eventBus as any);
    await mod.boot(container as any);

    expect(mod.isRegistered).toBe(true);
    expect(mod.isBooted).toBe(true);
  });
});
