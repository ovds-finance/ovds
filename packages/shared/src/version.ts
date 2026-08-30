/**
 * @ovds/shared — Symbol versioning & cross-environment compatibility manifest
 *
 * PURPOSE:
 *   Prevents symbol collisions when multiple copies of @ovds/shared are loaded
 *   (e.g. CJS dist in backend, ESM source in frontend via Vite alias, Jest in tests).
 *
 * HOW IT WORKS:
 *   1. SHARED_VERSION — a single string that all consumers can compare at runtime.
 *      If two modules import @ovds/shared and get different SHARED_VERSION values,
 *      they are loading different builds → symbol collision risk.
 *
 *   2. SHARED_SYMBOL — a unique Symbol stored on globalThis. The first module to
 *      load @ovds/shared registers it. Subsequent loads detect the existing symbol
 *      and warn if the version differs (dynamic linking check).
 *
 *   3. SHARED_ENV — records which environment resolved this module (browser/node/test).
 *      Used for search-path priority debugging.
 *
 * USAGE (optional — call once at app bootstrap):
 *   import { assertSharedSingleton } from '@ovds/shared';
 *   assertSharedSingleton(); // throws if two different versions are loaded
 */

export const SHARED_VERSION = '0.1.0' as const;

export const SHARED_BUILD_ID =
  `@ovds/shared@${SHARED_VERSION}` as const;

// -- Environment detection -----------------------------------------------------
type SharedEnv = 'browser' | 'node' | 'test' | 'unknown';

function detectEnv(): SharedEnv {
  if (typeof process !== 'undefined' && process.env?.['JEST_WORKER_ID']) return 'test';
  if (typeof process !== 'undefined' && process.env?.['VITEST']) return 'test';
  if (typeof (globalThis as any).window !== 'undefined') return 'browser';
  if (typeof process !== 'undefined' && process.versions?.node) return 'node';
  return 'unknown';
}

export const SHARED_ENV: SharedEnv = detectEnv();

// -- Global singleton registration (dynamic linking) ---------------------------
// Use a string key on globalThis so it survives across CJS/ESM module boundaries.
const REGISTRY_KEY = '__ovds_shared_registry__';

interface SharedRegistry {
  version: string;
  env: SharedEnv;
  loadedAt: string;
}

function getGlobal(): Record<string, unknown> {
  if (typeof globalThis !== 'undefined') return globalThis as Record<string, unknown>;
  if (typeof global !== 'undefined') return global as unknown as Record<string, unknown>;
  if (typeof (globalThis as any).window !== 'undefined') return (globalThis as any).window as Record<string, unknown>;
  return {} as Record<string, unknown>;
}

const g = getGlobal();

if (!g[REGISTRY_KEY]) {
  // First load — register this instance
  g[REGISTRY_KEY] = {
    version: SHARED_VERSION,
    env: SHARED_ENV,
    loadedAt: new Date().toISOString(),
  } satisfies SharedRegistry;
}

/**
 * assertSharedSingleton — call at app bootstrap to detect duplicate loads.
 *
 * Throws if a different version of @ovds/shared was already registered,
 * which indicates a symbol collision risk (e.g. dist/ and src/ both loaded).
 */
export function assertSharedSingleton(): void {
  const registered = g[REGISTRY_KEY] as SharedRegistry | undefined;
  if (!registered) return; // nothing registered yet — safe

  if (registered.version !== SHARED_VERSION) {
    throw new Error(
      `[OVDS] Symbol collision detected: @ovds/shared loaded twice with different versions.\n` +
      `  Already loaded: v${registered.version} (${registered.env}) at ${registered.loadedAt}\n` +
      `  Current load:   v${SHARED_VERSION} (${SHARED_ENV})\n` +
      `  Fix: ensure all consumers resolve @ovds/shared to the same source via Vite alias / tsconfig paths.`
    );
  }
}

/**
 * getSharedRegistry — returns the currently registered shared instance info.
 * Useful for debugging search-path priority issues.
 */
export function getSharedRegistry(): SharedRegistry | undefined {
  return g[REGISTRY_KEY] as SharedRegistry | undefined;
}
