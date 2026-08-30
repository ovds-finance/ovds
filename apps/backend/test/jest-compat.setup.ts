// Jest-compat bridge for legacy Jest-written specs running under Vitest.
//
// This repo’s backend specs were authored for Jest (global `jest`, `jest.spyOn`, etc.).
// Nx executes them via Vitest right now, so this file provides a minimal Jest-like
// surface implemented using Vitest APIs.

import { vi } from 'vitest';

// Minimal Jest-like global bridge.
// NOTE: This repo’s backend tests were authored for Jest.
// We keep this bridge intentionally small; some tests will be migrated
// to Vitest APIs incrementally.
const jestLike: any = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,

  // Some specs use `jest.Mock` / `mockedFn.mockResolvedValue(...)`.
  // Under Vitest these are just Vi spies/mocks, so we keep types permissive.
};

// Ensure bcrypt methods are writable and become vi.fn() mocks.
// Vitest runs in ESM-like mode where bcrypt exports may have non-writable bindings.
// We patch them in a try/catch to avoid hard failures.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt: unknown = require('bcryptjs');
  const b: any = bcrypt;

  if (b.compare) {
    Object.defineProperty(b, 'compare', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  }
  if (b.hash) {
    Object.defineProperty(b, 'hash', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  }
} catch {
  // ignore
}

console.log('[jest-compat] loaded');

(globalThis as any).jest = jestLike;
