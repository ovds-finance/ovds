import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleBootstrap } from './module-bootstrap';
import type { ModuleInterface } from './module.interface';

const mockModule = (name: string): ModuleInterface => ({
  info: { name, displayName: name, version: '1', description: '', author: '', category: '', icon: '', installType: 'app' as const },
  register: () => {},
  boot: () => {},
  routes: () => [],
  menus: () => [],
  settings: () => [],
  permissions: () => [],
});

describe('ModuleBootstrap', () => {
  beforeEach(() => {
    ModuleBootstrap.reset();
  });

  it('is a singleton', () => {
    const a = ModuleBootstrap.getInstance();
    const b = ModuleBootstrap.getInstance();
    expect(a).toBe(b);
  });

  it('starts with no registrations', () => {
    const bs = ModuleBootstrap.getInstance();
    expect(bs.getRegisteredNames()).toHaveLength(0);
  });

  it('registers a module', () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('test', () => mockModule('test'));
    expect(bs.getRegisteredNames()).toContain('test');
  });

  it('registers multiple modules', () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('a', () => mockModule('a'));
    bs.registerModule('b', () => mockModule('b'));
    expect(bs.getRegisteredNames()).toHaveLength(2);
  });

  it('updates enabled flag for existing module', () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('test', () => mockModule('test'), false);
    expect(bs.getRegisteredNames()).toHaveLength(1);

    bs.registerModule('test', () => mockModule('test'), true);
    expect(bs.getRegisteredNames()).toHaveLength(1);
  });

  it('resolves names without filtering', () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('a', () => mockModule('a'));
    bs.registerModule('b', () => mockModule('b'));

    const { names } = bs.resolveOptions();
    expect(names.sort()).toEqual(['a', 'b']);
  });

  it('filters by enabled modules', () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('a', () => mockModule('a'));
    bs.registerModule('b', () => mockModule('b'));

    const { names } = bs.resolveOptions({ enabledModules: ['a'] });
    expect(names).toEqual(['a']);
  });

  it('filters out disabled modules', () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('a', () => mockModule('a'));
    bs.registerModule('b', () => mockModule('b'));

    const { names } = bs.resolveOptions({ disabledModules: ['b'] });
    expect(names).toEqual(['a']);
  });

  it('bootstraps modules into instances', async () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('a', () => mockModule('a'));
    bs.registerModule('b', () => mockModule('b'));

    const result = await bs.bootstrap();
    expect(result.modules).toHaveLength(2);
    expect(result.names.sort()).toEqual(['a', 'b']);
    expect(result.errors).toHaveLength(0);
  });

  it('handles factory errors gracefully', async () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('broken', () => {
      throw new Error('Factory failed');
    });

    const result = await bs.bootstrap();
    expect(result.errors).toHaveLength(1);
    expect(result.modules).toHaveLength(0);
  });

  it('resets state on reset()', () => {
    const bs = ModuleBootstrap.getInstance();
    bs.registerModule('test', () => mockModule('test'));
    expect(bs.getRegisteredNames()).toHaveLength(1);

    ModuleBootstrap.reset();
    const fresh = ModuleBootstrap.getInstance();
    expect(fresh.getRegisteredNames()).toHaveLength(0);
  });
});
