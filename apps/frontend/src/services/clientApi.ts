/**
 * Client API
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend service for the hybrid Client module.
 * Covers: installer manifest, node registration, node listing/revocation,
 * and sync-token issuance.
 *
 * All requests go through the central `api` Axios instance so they
 * automatically benefit from:
 *   - JWT attach (bearer + HttpOnly cookie modes)
 *   - 401 token-refresh queue
 *   - 429 and 5xx retry logic
 *   - HMAC request signing
 *   - x-company-id tenant header
 */
import { isHttpOnlyAuth } from '../utils/authMode';

import api, { API_BASE } from './api';

const USE_HTTPONLY = isHttpOnlyAuth();

// Prefix for all client routes — matches the backend controller path.
const BASE = '/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClientPlatformManifest {
  os: 'windows' | 'linux-deb' | 'linux-appimage' | 'docker';
  filename: string;
  downloadUrl: string;
  sha256: string;
  sizeBytes: number;
}

export interface ClientManifest {
  version: string;
  releaseDate: string;
  platforms: ClientPlatformManifest[];
  minPlanSlug: string;
  changelogUrl: string;
}

export interface EnterpriseNode {
  nodeId: string;
  companyId: string;
  friendlyName: string;
  role: 'REMOTE_TERMINAL' | 'PRIVATE_NODE';
  registeredAt: string;
  lastSeenAt: string | null;
}

export interface NewNodeResult extends EnterpriseNode {
  /** One-time token — only returned on registration, never again. */
  nodeToken: string;
}

export interface SyncToken {
  token: string;
  expiresAt: string;
  companyId: string;
  nodeId: string;
  scopes: string[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch the current installer manifest (Enterprise plan check server-side). */
export async function getClientManifest(): Promise<ClientManifest> {
  const { data } = await api.get<ClientManifest>(`${BASE}/manifest`);
  return data;
}

/**
 * Fetch the Invoice Module manifest — available on ALL plans (no Enterprise gate).
 * Uses the /invoice-module/manifest endpoint which has no plan check.
 */
export async function getInvoiceModuleManifest(): Promise<ClientManifest> {
  const { data } = await api.get<ClientManifest>(`${BASE}/invoice-module/manifest`);
  return data;
}

/**
 * Register a new workstation node.
 * Returns a one-time node token — store it securely, it won't be shown again.
 */
export async function registerNode(
  friendlyName: string,
  role: 'REMOTE_TERMINAL' | 'PRIVATE_NODE' = 'REMOTE_TERMINAL',
): Promise<NewNodeResult> {
  const { data } = await api.post<NewNodeResult>(`${BASE}/nodes`, { friendlyName, role });
  return data;
}

/** List all registered nodes for the current company. */
export async function listNodes(): Promise<EnterpriseNode[]> {
  const { data } = await api.get<EnterpriseNode[]>(`${BASE}/nodes`);
  return data;
}

/** Revoke a node — its local token becomes invalid immediately. */
export async function revokeNode(nodeId: string): Promise<{ revoked: true }> {
  const { data } = await api.delete<{ revoked: true }>(`${BASE}/nodes/${nodeId}`);
  return data;
}

/**
 * Issue a short-lived sync token for a specific node.
 * Valid for 24 h, scoped to invoices:sync, tax-rules:read, templates:read.
 */
export async function issueSyncToken(
  nodeId: string,
  nodeToken: string,
): Promise<SyncToken> {
  const { data } = await api.post<SyncToken>(`${BASE}/sync-token`, { nodeId, nodeToken });
  return data;
}

/**
 * Build a download URL for the desktop installer.
 * When HttpOnly cookie auth is active, cookies carry auth so no token in URL.
 * Otherwise appends the bearer token as a query param for the download handler.
 */
export function getDownloadUrl(
  platform: 'windows' | 'linux-deb' | 'linux-appimage' | 'docker',
): string {
  if (USE_HTTPONLY) {
    return `${API_BASE}/client/download/${platform}`;
  }
  const token =
    localStorage.getItem('ovds_token') ||
    localStorage.getItem('auth0_token') ||
    localStorage.getItem('token') ||
    '';
  return `${API_BASE}/client/download/${platform}?token=${encodeURIComponent(token)}`;
}

/**
 * Build a download URL for the Invoice Module installer.
 * Available on all plans — uses the /invoice-module/download/:platform route.
 * The endpoint is public so no token is required.
 */
export function getInvoiceModuleDownloadUrl(
  platform: 'windows' | 'linux-deb' | 'linux-appimage' | 'docker',
): string {
  return `${API_BASE}/client/invoice-module/download/${platform}`;
}
