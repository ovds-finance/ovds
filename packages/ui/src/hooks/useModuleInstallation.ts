import { useState, useCallback } from 'react';

export type ModuleInstallationState =
  | 'IDLE'
  | 'PRE_FLIGHT'
  | 'FETCHING'
  | 'EXTRACTION'
  | 'LIVE'
  | 'CRITICAL_ERROR'
  | 'ROLLBACK';

export interface ModuleInstallationStateMachine {
  state: ModuleInstallationState;
  progress: number;
  error?: string;
  transition: (next: ModuleInstallationState, error?: string) => void;
  reset: () => void;
}

export interface ModuleInstallationStateMachineDeps {
  setState: (s: ModuleInstallationState) => void;
  setProgress: (p: number) => void;
  setError: (e?: string) => void;
}

export function createModuleInstallationStateMachine(deps: ModuleInstallationStateMachineDeps): ModuleInstallationStateMachine {
  let current: ModuleInstallationState = 'IDLE';
  let progress = 0;
  let error: string | undefined;

  const notify = () => {
    deps.setState(current);
    deps.setProgress(progress);
    deps.setError(error);
  };

  const transition = (next: ModuleInstallationState, err?: string) => {
    current = next;
    error = err;
    if (next === 'FETCHING') {
      progress = 0;
    } else if (next === 'EXTRACTION') {
      progress = 40;
    } else if (next === 'LIVE') {
      progress = 100;
    } else if (next === 'CRITICAL_ERROR' || next === 'ROLLBACK') {
      progress = 0;
    }
    notify();
  };

  const reset = () => {
    current = 'IDLE';
    progress = 0;
    error = undefined;
    notify();
  };

  return {
    get state() { return current; },
    get progress() { return progress; },
    get error() { return error; },
    transition,
    reset,
  };
}

export function useModuleInstallation(): ModuleInstallationStateMachine {
  const [state, setState] = useState<ModuleInstallationState>('IDLE');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | undefined>(undefined);

  return createModuleInstallationStateMachine({ setState, setProgress, setError });
}

export const INSTALLATION_STATE_META: Record<ModuleInstallationState, {
  label: string;
  ariaBusy?: boolean;
  ariaLive?: 'polite' | 'assertive';
  role?: string;
}> = {
  IDLE:             { label: 'Ready to Install', ariaBusy: false },
  PRE_FLIGHT:       { label: 'Checking System Dependencies', ariaBusy: true, ariaLive: 'polite' },
  FETCHING:         { label: 'Streaming Bundle', ariaLive: 'assertive' },
  EXTRACTION:       { label: 'Extracting Sandbox', ariaBusy: true },
  LIVE:             { label: 'Active Execution', role: 'status' },
  CRITICAL_ERROR:   { label: 'Critical Error', role: 'alert', ariaLive: 'assertive' },
  ROLLBACK:         { label: 'Rollback Triggered', role: 'alert' },
};
