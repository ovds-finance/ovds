/**
 * OVDS oRPC Client — single source of type-safe API access
 *
 * Usage:
 *   import { orpc } from '../lib/orpc';
 *
 *   // Direct async call:
 *   const item = await orpc.inventory.items.get({ id });
 *
 *   // React Query (via useInventory hooks — preferred):
 *   const { data } = useItems({ companyId, page: 1 });
 *
 * Type safety:
 *   The client is fully typed via ContractRouterClient<AppContract>.
 *   Every procedure call is validated at compile time against the Zod schemas
 *   in @ovds/contracts. A typo in a procedure name or wrong argument shape
 *   is a TypeScript error, not a runtime 404/422.
 *
 * Domains:
 *   orpc.auth.*         — login, refresh, me, logout, changePassword
 *   orpc.ovds.*         — invoices, bills, customers, vendors, bankAccounts, accounts
 *   orpc.hr.*           — employees, departments, leaves, payroll
 *   orpc.inventory.*    — items, groups, warehouses, stock
 *   orpc.banking.*      — accounts, transactions, reconciliation
 *   orpc.tax.*          — vat, tot, bit, wht, drrf, payee, pension
 *   orpc.settings.*     — system settings, company profile
 *   orpc.monetization.* — plans, entitlements, subscriptions
 *   orpc.nav.*          — sidebar navigation groups
 *   orpc.sync.*         — offline sync state and regulated sectors
 */
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import { createORPCReactQueryUtils } from '@orpc/react-query';
import type { AppContract } from '@ovds/contracts/router';

import { BEARER_PREFIX } from '../utils/constants';

// ── Auth token provider ───────────────────────────────────────────────────────

function getToken(): string | null {
  try {
    return (
      localStorage.getItem('ovds_token') ||
      localStorage.getItem('auth0_token') ||
      sessionStorage.getItem('auth0_token')
    );
  } catch {
    return null;
  }
}

function getCompanyId(): string | null {
  try {
    return localStorage.getItem('selectedCompanyId');
  } catch {
    return null;
  }
}

// ── RPC Link ──────────────────────────────────────────────────────────────────

// RPCLink internally calls `new URL(url)` which requires an absolute URL.
// In dev the Vite proxy forwards /api → backend, so we resolve against origin.
const _rpcBase = import.meta.env.VITE_API_URL || '/api';
const _rpcUrl = _rpcBase.startsWith('http')
  ? `${_rpcBase}/rpc`
  : `${window.location.origin}${_rpcBase}/rpc`;

const rpcLink = new RPCLink({
  url: _rpcUrl,
  headers: () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) headers['Authorization'] = `${BEARER_PREFIX}${token}`;

    const companyId = getCompanyId();
    if (companyId) headers['x-company-id'] = companyId;

    try {
      const lng =
        localStorage.getItem('i18nextLng') ??
        (typeof navigator !== 'undefined' ? navigator.language : null);
      if (lng) {
        headers['x-locale']        = String(lng).split('-')[0];
        headers['Accept-Language'] = lng;
      }
    } catch {
      // ignore — non-critical
    }

    return headers;
  },
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      credentials: 'include',
    });
  },
});

// ── Typed client ──────────────────────────────────────────────────────────────
// ContractRouterClient<AppContract> gives full static type-checking for all
// procedure names, input shapes (validated against Zod schemas), and output
// shapes. Compile-time errors surface typos and breaking contract changes
// before they reach production.
//
// The `as unknown as` cast is required because appContract is a ContractRouter
// (pure definition — not callable), while createORPCClient expects NestedClient
// (callable). The cast is safe: the runtime Proxy wires the calls correctly;
// TypeScript only needs the shape, which ContractRouterClient provides.

export const orpc = createORPCClient<ContractRouterClient<AppContract>>(rpcLink);

// ── React Query utils ─────────────────────────────────────────────────────────
// Wraps every procedure with .queryOptions() / .mutationOptions() / .key()
// for seamless TanStack Query integration.
// The domain-specific hooks (e.g. useInventory.ts) use orpc directly to keep
// explicit return types at the call site.

export const orpcUtils = createORPCReactQueryUtils(orpc);
