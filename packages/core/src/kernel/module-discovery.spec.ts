import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleDiscovery } from './module-discovery';

describe('ModuleDiscovery', () => {
  let discovery: ModuleDiscovery;

  beforeEach(() => {
    ModuleDiscovery.reset();
    discovery = ModuleDiscovery.getInstance();
  });

  it('returns the same singleton instance', () => {
    const other = ModuleDiscovery.getInstance();
    expect(other).toBe(discovery);
  });

  it('starts with no registered modules', () => {
    expect(discovery.getRegisteredModuleNames()).toHaveLength(0);
  });

  it('registers a module factory', () => {
    const factory = () => ({ info: { name: 'test-module' } });
    discovery.registerModule('test-module', factory);
    expect(discovery.getRegisteredModuleNames()).toContain('test-module');
  });

  it('creates a module from a registered factory', () => {
    const mockModule = { info: { name: 'test-module' } };
    const factory = () => mockModule;
    discovery.registerModule('test-module', factory);

    const created = discovery.createModule('test-module');
    expect(created).toBe(mockModule);
  });

  it('returns undefined for unregistered module', () => {
    const created = discovery.createModule('nonexistent');
    expect(created).toBeUndefined();
  });

  it('creates all registered modules', () => {
    discovery.registerModule('mod-a', () => ({ info: { name: 'a' } }));
    discovery.registerModule('mod-b', () => ({ info: { name: 'b' } }));

    const modules = discovery.createAllModules();
    expect(modules).toHaveLength(2);
  });

  it('filters modules by enabledModules', () => {
    discovery.registerModule('mod-a', () => ({ info: { name: 'a' } }));
    discovery.registerModule('mod-b', () => ({ info: { name: 'b' } }));

    const modules = discovery.createAllModules({ enabledModules: ['mod-a'] });
    expect(modules).toHaveLength(1);
    expect(modules[0]!.info.name).toBe('a');
  });

  it('excludes modules by disabledModules', () => {
    discovery.registerModule('mod-a', () => ({ info: { name: 'a' } }));
    discovery.registerModule('mod-b', () => ({ info: { name: 'b' } }));

    const modules = discovery.createAllModules({ disabledModules: ['mod-b'] });
    expect(modules).toHaveLength(1);
    expect(modules[0]!.info.name).toBe('a');
  });

  it('can unregister a module', () => {
    discovery.registerModule('test', () => ({ info: { name: 'test' } }));
    expect(discovery.getRegisteredModuleNames()).toContain('test');

    discovery.unregisterModule('test');
    expect(discovery.getRegisteredModuleNames()).not.toContain('test');
  });

  it('creates separate instances when reset is called', () => {
    discovery.registerModule('mod', () => ({ info: { name: 'mod' } }));
    ModuleDiscovery.reset();

    const fresh = ModuleDiscovery.getInstance();
    expect(fresh.getRegisteredModuleNames()).toHaveLength(0);
  });
});
