/**
 * Client API
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend service for the hybrid Client module.
 * Covers: installer manifest, node registration, node listing/revocation,
 * and sync-token issuance.
 */
import axios from 'axios';
import { BEARER_PREFIX } from '../utils/constants';
import { isHttpOnlyAuth } from '../utils/authMode';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '10000', 10);
const USE_HTTPONLY = isHttpOnlyAuth();

const clientAxios: any = axios.create({
  baseURL: `${API_BASE}/client`,
  timeout: API_TIMEOUT,
  withCredentials: USE_HTTPONLY,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from storage (same pattern as the rest of the app)
clientAxios.interceptors.request.use((config: any) => {
  if (!USE_HTTPONLY) {
    const token =
      localStorage.getItem('ovds_token') ||
      localStorage.getItem('auth0_token') ||
      localStorage.getItem('token');
    if (token) config.headers.Authorization = `${BEARER_PREFIX}${token}`;
  }
  return config;
});

// Unwrap the TransformInterceptor envelope { statusCode, message, data, success }
// so every caller receives the inner `data` directly instead of the envelope.
clientAxios.interceptors.response.use((response: any) => {
  const body = response.data;
  if (
    body &&
    typeof body === 'object' &&
    'success' in body &&
    'data' in body
  ) {
    response.data = body.data;
  }
  return response;
});

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
  const { data } = await clientAxios.get('/manifest');
  return data;
}

/**
 * Fetch the Invoice Module manifest — available on ALL plans (no Enterprise gate).
 * Uses the /invoice-module/manifest endpoint which has no plan check.
 */
export async function getInvoiceModuleManifest(): Promise<ClientManifest> {
  const { data } = await clientAxios.get('/invoice-module/manifest');
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
  const { data } = await clientAxios.post('/nodes', {
    friendlyName,
    role,
  });
  return data;
}

/** List all registered nodes for the current company. */
export async function listNodes(): Promise<EnterpriseNode[]> {
  const { data } = await clientAxios.get('/nodes');
  return data;
}

/** Revoke a node — its local token becomes invalid immediately. */
export async function revokeNode(nodeId: string): Promise<{ revoked: true }> {
  const { data } = await clientAxios.delete(
    `/nodes/${nodeId}`,
  );
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
  const { data } = await clientAxios.post('/sync-token', {
    nodeId,
    nodeToken,
  });
  return data;
}

/** Trigger a download — returns a path; cookies carry auth when USE_HTTPONLY is on. */
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
