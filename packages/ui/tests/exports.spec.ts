import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Package exports', () => {
  it('exports surfaceTokens and brandTokens from design system', async () => {
    const ds = await import('@ovds/design-system');
    expect(ds.surfaceTokens).toBeDefined();
    expect(ds.brandTokens).toBeDefined();
  });

  it('INSTALLATION_STATE_META covers all states', async () => {
    const { INSTALLATION_STATE_META } = await import('../src/hooks/useModuleInstallation');
    const states = ['IDLE', 'PRE_FLIGHT', 'FETCHING', 'EXTRACTION', 'LIVE', 'CRITICAL_ERROR', 'ROLLBACK'] as const;
    for (const s of states) {
      expect(INSTALLATION_STATE_META[s]).toBeDefined();
      expect(INSTALLATION_STATE_META[s].label.length).toBeGreaterThan(0);
    }
  });

  it('all v5.0 module system exports exist in index', async () => {
    const mod = await import('../src/index');
    expect(mod.ModuleInstallationOverlay).toBeDefined();
    expect(mod.ModuleInstallationBadge).toBeDefined();
    expect(mod.ModuleDiscoveryGallery).toBeDefined();
    expect(mod.SecuritySandbox).toBeDefined();
    expect(mod.SecurityPermissionRow).toBeDefined();
    expect(mod.useModuleInstallation).toBeDefined();
    expect(mod.INSTALLATION_STATE_META).toBeDefined();
  }, 15000);

  it('all exported components are valid React components', async () => {
    const mod = await import('../src/index');
    const components = [
      mod.ModuleInstallationOverlay,
      mod.ModuleInstallationBadge,
      mod.ModuleDiscoveryGallery,
      mod.SecuritySandbox,
      mod.SecurityPermissionRow,
    ];
    for (const comp of components) {
      expect(typeof comp).toBe('function');
      const el = React.createElement(comp as any, {});
      expect(React.isValidElement(el)).toBe(true);
    }
  }, 15000);
});
