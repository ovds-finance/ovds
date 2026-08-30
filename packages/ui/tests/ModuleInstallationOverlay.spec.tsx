import { describe, it, expect } from 'vitest';
import React from 'react';
import { ModuleInstallationBadge, ModuleInstallationOverlay } from '../src/components/ModuleInstallationOverlay';
import { INSTALLATION_STATE_META } from '../src/hooks/useModuleInstallation';

describe('ModuleInstallationBadge', () => {
  it('is a valid React component', () => {
    expect(typeof ModuleInstallationBadge).toBe('function');
    const el = React.createElement(ModuleInstallationBadge, { state: 'LIVE' });
    expect(React.isValidElement(el)).toBe(true);
  });

  it('accepts state and optional label props', () => {
    const el = React.createElement(ModuleInstallationBadge, { state: 'LIVE', label: 'Custom' });
    expect(el.props.state).toBe('LIVE');
    expect(el.props.label).toBe('Custom');
  });

  it('meta provides default label for LIVE state', () => {
    expect(INSTALLATION_STATE_META['LIVE'].label).toBe('Active Execution');
  });

  it('meta provides ARIA role for CRITICAL_ERROR', () => {
    expect(INSTALLATION_STATE_META['CRITICAL_ERROR'].role).toBe('alert');
    expect(INSTALLATION_STATE_META['CRITICAL_ERROR'].ariaLive).toBe('assertive');
  });

  it('meta provides role for LIVE state', () => {
    expect(INSTALLATION_STATE_META['LIVE'].role).toBe('status');
  });
});

describe('ModuleInstallationOverlay', () => {
  const fakeSm = (state: string, progress = 0, error?: string) => ({
    state, progress, error,
    transition: () => {},
    reset: () => {},
  } as any);

  it('is a valid React component', () => {
    expect(typeof ModuleInstallationOverlay).toBe('function');
    const el = React.createElement(ModuleInstallationOverlay, { moduleName: 'Test', stateMachine: fakeSm('IDLE') });
    expect(React.isValidElement(el)).toBe(true);
  });

  it('accepts moduleName and stateMachine props', () => {
    const sm = fakeSm('PRE_FLIGHT');
    const el = React.createElement(ModuleInstallationOverlay, { moduleName: 'MyModule', stateMachine: sm });
    expect(el.props.moduleName).toBe('MyModule');
    expect(el.props.stateMachine).toBe(sm);
  });

  it('returns null when state is IDLE', async () => {
    const mod = await import('../src/components/ModuleInstallationOverlay');
    const result = (mod as any).ModuleInstallationOverlay({ moduleName: 'Test', stateMachine: fakeSm('IDLE') });
    expect(result).toBeNull();
  });

  it('accepts dismissable and onDismiss props', () => {
    const onDismiss = () => {};
    const el = React.createElement(ModuleInstallationOverlay, { moduleName: 'M', stateMachine: fakeSm('LIVE'), dismissable: true, onDismiss });
    expect(el.props.dismissable).toBe(true);
    expect(el.props.onDismiss).toBe(onDismiss);
  });

  it('exposes error through stateMachine for CRITICAL_ERROR', () => {
    const sm = fakeSm('CRITICAL_ERROR', 0, 'boom');
    const el = React.createElement(ModuleInstallationOverlay, { moduleName: 'M', stateMachine: sm });
    expect(sm.error).toBe('boom');
  });
});
