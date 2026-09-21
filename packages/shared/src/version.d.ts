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
export declare const SHARED_VERSION: "0.1.0";
export declare const SHARED_BUILD_ID: "@ovds/shared@0.1.0";
type SharedEnv = 'browser' | 'node' | 'test' | 'unknown';
export declare const SHARED_ENV: SharedEnv;
interface SharedRegistry {
    version: string;
    env: SharedEnv;
    loadedAt: string;
}
/**
 * assertSharedSingleton — call at app bootstrap to detect duplicate loads.
 *
 * Throws if a different version of @ovds/shared was already registered,
 * which indicates a symbol collision risk (e.g. dist/ and src/ both loaded).
 */
export declare function assertSharedSingleton(): void;
/**
 * getSharedRegistry — returns the currently registered shared instance info.
 * Useful for debugging search-path priority issues.
 */
export declare function getSharedRegistry(): SharedRegistry | undefined;
export {};
//# sourceMappingURL=version.d.ts.map