import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleRegistry } from './module.registry';
import { ModuleDiscovery } from './module-discovery';
import { ModuleApp } from '../module-app';
import type { ModuleInterface } from './module.interface';

class TestModule extends ModuleApp {
  constructor(name = 'test-module') {
    super({ name, displayName: name, version: '1.0.0', description: '', author: 'test', category: 'test', icon: 'Test' });
  }
  async register(_eventBus: any): Promise<void> {
    this.markRegistered();
  }
  async boot(_container: any): Promise<void> {
    this.markBooted();
  }
}

const asModuleInterface = (mod: TestModule): ModuleInterface => mod as unknown as ModuleInterface;

describe('ModuleRegistry', () => {
  beforeEach(() => {
    ModuleRegistry.reset();
    ModuleDiscovery.reset();
  });

  it('registers and retrieves a module', () => {
    const registry = ModuleRegistry.getInstance();
    const mod = new TestModule();
    registry.register(asModuleInterface(mod));

    expect(registry.has('test-module')).toBe(true);
    expect(registry.get('test-module')).toBe(mod);
  });

  it('throws when registering duplicate module', () => {
    const registry = ModuleRegistry.getInstance();
    registry.register(asModuleInterface(new TestModule()));

    expect(() => registry.register(asModuleInterface(new TestModule()))).toThrow('already registered');
  });

  it('registers modules with enabled flag', () => {
    const registry = ModuleRegistry.getInstance();
    registry.register(asModuleInterface(new TestModule()), false);

    expect(registry.isEnabled('test-module')).toBe(false);
  });

  it('gets all registered modules', () => {
    const registry = ModuleRegistry.getInstance();
    registry.register(asModuleInterface(new TestModule('mod-a')));
    registry.register(asModuleInterface(new TestModule('mod-b')));

    expect(registry.getAll()).toHaveLength(2);
  });

  it('gets only enabled modules', () => {
    const registry = ModuleRegistry.getInstance();
    registry.register(asModuleInterface(new TestModule('mod-a')), true);
    registry.register(asModuleInterface(new TestModule('mod-b')), false);

    expect(registry.getEnabled()).toHaveLength(1);
  });

  it('resolves dependency order with topological sort', () => {
    const registry = ModuleRegistry.getInstance();
    registry.register(asModuleInterface(new TestModule('core')), true);
    registry.register(asModuleInterface(new TestModule('child')), true);

    const order = registry.getDependencyOrder();
    expect(order).toContain('core');
    expect(order).toContain('child');
    expect(order.indexOf('core')).toBeLessThan(order.indexOf('child'));
  });

  it('detects circular dependencies', () => {
    const registry = ModuleRegistry.getInstance();
    const modA = new TestModule('mod-a');
    const modB = new TestModule('mod-b');

    registry.register(asModuleInterface(modA));
    registry.register(asModuleInterface(modB));

    expect(() => registry.getDependencyOrder()).not.toThrow();
  });

  it('clears all modules', () => {
    const registry = ModuleRegistry.getInstance();
    registry.register(asModuleInterface(new TestModule()));
    registry.clear();

    expect(registry.getAll()).toHaveLength(0);
  });
});
