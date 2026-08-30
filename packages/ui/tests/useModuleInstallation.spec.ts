import { describe, it, expect } from 'vitest';
import { createModuleInstallationStateMachine, INSTALLATION_STATE_META, ModuleInstallationState } from '../src/hooks/useModuleInstallation';

function makeMachine() {
  const calls: Array<{ type: string; args: any[] }> = [];
  const deps = {
    setState: (...args: any[]) => calls.push({ type: 'setState', args }),
    setProgress: (...args: any[]) => calls.push({ type: 'setProgress', args }),
    setError: (...args: any[]) => calls.push({ type: 'setError', args }),
  };
  return { deps, calls };
}

describe('createModuleInstallationStateMachine', () => {
  it('initializes to IDLE with zero progress and no error', () => {
    const { deps } = makeMachine();
    const sm = createModuleInstallationStateMachine(deps);
    expect(sm.state).toBe('IDLE');
    expect(sm.progress).toBe(0);
    expect(sm.error).toBeUndefined();
  });

  it('transitions through PRE_FLIGHT → FETCHING → EXTRACTION → LIVE', () => {
    const { deps, calls } = makeMachine();
    const sm = createModuleInstallationStateMachine(deps);
    sm.transition('PRE_FLIGHT');
    expect(sm.state).toBe('PRE_FLIGHT');
    sm.transition('FETCHING');
    expect(sm.progress).toBe(0);
    sm.transition('EXTRACTION');
    expect(sm.progress).toBe(40);
    sm.transition('LIVE');
    expect(sm.progress).toBe(100);
    expect(calls.filter(c => c.type === 'setState').map(c => c.args[0])).toEqual(['PRE_FLIGHT', 'FETCHING', 'EXTRACTION', 'LIVE']);
  });

  it('handles CRITICAL_ERROR with message and resets progress', () => {
    const { deps } = makeMachine();
    const sm = createModuleInstallationStateMachine(deps);
    sm.transition('FETCHING');
    expect(sm.progress).toBe(0);
    sm.transition('CRITICAL_ERROR', 'boom');
    expect(sm.state).toBe('CRITICAL_ERROR');
    expect(sm.error).toBe('boom');
    expect(sm.progress).toBe(0);
  });

  it('rolls back and resets progress', () => {
    const { deps } = makeMachine();
    const sm = createModuleInstallationStateMachine(deps);
    sm.transition('EXTRACTION');
    expect(sm.progress).toBe(40);
    sm.transition('ROLLBACK');
    expect(sm.state).toBe('ROLLBACK');
    expect(sm.progress).toBe(0);
  });

  it('resets to IDLE', () => {
    const { deps } = makeMachine();
    const sm = createModuleInstallationStateMachine(deps);
    sm.transition('CRITICAL_ERROR', 'x');
    sm.reset();
    expect(sm.state).toBe('IDLE');
    expect(sm.progress).toBe(0);
    expect(sm.error).toBeUndefined();
  });

  it('every declared state has metadata', () => {
    const states: ModuleInstallationState[] = [
      'IDLE', 'PRE_FLIGHT', 'FETCHING', 'EXTRACTION', 'LIVE', 'CRITICAL_ERROR', 'ROLLBACK',
    ];
    for (const s of states) {
      expect(INSTALLATION_STATE_META[s]).toBeDefined();
      expect(INSTALLATION_STATE_META[s].label).toBeTruthy();
    }
  });

  it('transition function is stable', () => {
    const { deps } = makeMachine();
    const sm = createModuleInstallationStateMachine(deps);
    const first = sm.transition;
    const second = sm.transition;
    expect(first).toBe(second);
  });

  it('notifies deps on every transition', () => {
    const { deps, calls } = makeMachine();
    const sm = createModuleInstallationStateMachine(deps);
    sm.transition('FETCHING');
    sm.transition('EXTRACTION');
    sm.transition('LIVE');
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });

  it('notifies deps on reset', () => {
    const { deps, calls } = makeMachine();
    const sm = createModuleInstallationStateMachine(deps);
    sm.transition('CRITICAL_ERROR', 'x');
    sm.reset();
    const setStateCalls = calls.filter(c => c.type === 'setState').map(c => c.args[0]);
    expect(setStateCalls).toContain('IDLE');
  });
});
