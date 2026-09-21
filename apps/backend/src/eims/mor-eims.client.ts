/**
 * MorEimsClient — backend integration with the Ministry of Revenues (MoR)
 * Electronic Invoice Management System (EIMS) core API.
 *
 * Implements the exact contract defined in the official MoR EIMS Postman
 * collection:
 *   - POST /v1/auth/login         → Bearer accessToken (clientId/clientSecret/
 *                                     apiKey/tin)
 *   - POST /v1/register           → 200 + { irn, signedQR, ... }
 *   - POST /v1/bulkRegister       → 202 + { conversationId }
 *   - POST /v1/cancel             → { cancellationDate }
 *   - POST /v1/bulkCancel         → 202 + { conversationId }
 *   - POST /v1/verify             → { status, irn, invoice }
 *   - POST /v1/receipt/sales      → 200 + { receiptIrn, signedQR, ... }
 *   - POST /v1/receipt/withholding→ 200 + { receiptIrn, ... }
 *
 * Every response uses the envelope { statusCode, message, body }. Bulk calls
 * are asynchronous: the MoR returns 202 with a conversationId that the caller
 * later reconciles via the bulk callback. Error payloads carry one of:
 *   SCHEMA ERROR | RULE VALIDATION ERROR | VERIFICATION ERROR | NOT_ACCEPTABLE.
 *
 * The client is environment-agnostic: when `sandbox` is true it returns
 * deterministic mock acknowledgements (so the OVDS demo never hits the live
 * MoR), otherwise it calls the real endpoint over HTTPS with the cached
 * Bearer token.
 */
import {
  EimsAuthRequest,
  EimsAuthResponse,
  EimsErrorResponse,
  EimsInvoiceRegistrationRequest,
  EimsRegistrationResponse,
  EimsCancellationRequest,
  EimsCancellationResponse,
  EimsVerifyResponse,
  EimsSalesReceiptRequest,
  EimsWithholdingReceiptRequest,
  EimsReceiptResponse,
  EimsBulkRegistrationResponse,
  EimsBulkCancellationItem,
  EimsIntegrationConfig,
  buildSignedEimsRequest,
  EIMS_SANDBOX_TOKEN_TTL_MS,
  EIMS_TOKEN_REFRESH_BUFFER_MS,
  EIMS_RETRY_BASE_DELAY_MS,
  EIMS_RETRY_MAX_DELAY_MS,
  EIMS_RETRY_JITTER_MS,
  EIMS_RETRY_AFTER_SEC,
} from '@ovds/shared';
import axios, { AxiosInstance } from 'axios';

interface SigningMaterial {
  privateKeyPem: string;
  certificateB64: string;
}

export type MorErrorType =
  | 'SCHEMA ERROR'
  | 'RULE VALIDATION ERROR'
  | 'VERIFICATION ERROR'
  | 'NOT_ACCEPTABLE'
  | 'AUTHENTICATION ERROR'
  | 'SYSTEM ERROR';

export class MorEimsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorType: MorErrorType,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'MorEimsError';
  }
}

interface TokenEntry {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface MorEnvelope<T> {
  statusCode: number;
  message: string;
  body: T;
}

const TIN_RE = /^\d{10}$/;

function assertTin(tin: string, where: string): void {
  if (!TIN_RE.test(tin)) {
    throw new MorEimsError(
      `${where}: TIN must be exactly 10 digits (got "${tin}")`,
      400,
      'SCHEMA ERROR',
    );
  }
}

function deterministicIrn(seed: string): string {
  let hash = 0n;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31n + BigInt(seed.charCodeAt(i))) & ((1n << 64n) - 1n);
  }
  const hex = hash.toString(16).padStart(16, '0');
  return hex + hex + hex + hex;
}

function sandboxToken(): string {
  return deterministicIrn('sandbox-auth-' + Date.now().toString());
}

export class MorEimsClient {
  private readonly http: AxiosInstance;
  private token: TokenEntry | null = null;
  private readonly getSigningMaterial?: () => Promise<SigningMaterial | null>;

  constructor(
    private readonly config: EimsIntegrationConfig,
    getSigningMaterial?: () => Promise<SigningMaterial | null>,
  ) {
    if (!config.sandbox) assertTin(config.tin, 'EIMS config tin');
    this.http = axios.create({
      baseURL: config.apiUrl.replace(/\/$/, ''),
      timeout: config.timeout ?? 30_000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.getSigningMaterial = getSigningMaterial;
  }

  get sandbox(): boolean {
    return this.config.sandbox;
  }

  get tin(): string {
    return this.config.tin;
  }

  private async wrapPayload(payload: unknown): Promise<unknown> {
    if (!this.getSigningMaterial) return payload;
    const material = await this.getSigningMaterial();
    if (!material) return payload;
    return await buildSignedEimsRequest(payload, material.privateKeyPem, material.certificateB64);
  }

  private async postEnvelope<T>(
    path: string,
    payload: unknown,
    retriesLeft = 2,
  ): Promise<{ env: MorEnvelope<T>; status: number }> {
    if (this.config.sandbox) {
      return this.sandboxPostEnvelope(path, payload);
    }
    const token = await this.authenticate();
    const signedPayload = await this.wrapPayload(payload);
    try {
      const res = await this.http.post<MorEnvelope<T>>(path, signedPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { env: res.data, status: res.status };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        const env = err.response.data as MorEnvelope<unknown> | undefined;
        const isRetryable = status === 502 || status === 503 || status === 504;
        if (isRetryable && retriesLeft > 0) {
          const retryAfter = parseInt(
            err.response.headers?.['retry-after'] ?? String(EIMS_RETRY_AFTER_SEC),
            10,
          );
          const baseDelay = isNaN(retryAfter) ? EIMS_RETRY_BASE_DELAY_MS : Math.min(retryAfter * 1000, EIMS_RETRY_MAX_DELAY_MS);
          const jitter = Math.random() * EIMS_RETRY_JITTER_MS;
          await new Promise((r) => setTimeout(r, baseDelay + jitter));
          return this.postEnvelope(path, payload, retriesLeft - 1);
        }
        throw new MorEimsError(
          env?.message ?? err.message,
          status,
          this.classifyError(env?.message ?? '', status),
          env?.body,
        );
      }
      throw err;
    }
  }

  private async sandboxPostEnvelope<T>(
    path: string,
    _payload: unknown,
  ): Promise<{ env: MorEnvelope<T>; status: number }> {
    this.token = {
      accessToken: sandboxToken(),
      refreshToken: sandboxToken(),
      expiresAt: Date.now() + EIMS_SANDBOX_TOKEN_TTL_MS,
    };
    const seed = path + JSON.stringify(_payload);
    return {
      env: {
        statusCode: 200,
        message: 'SUCCESS',
        body: { sandbox: true, irn: deterministicIrn(seed) } as T,
      },
      status: 200,
    };
  }

  private classifyError(message: string, status: number): MorErrorType {
    const m = message.toUpperCase();
    if (m.includes('SCHEMA')) return 'SCHEMA ERROR';
    if (m.includes('VERIF')) return 'VERIFICATION ERROR';
    if (m.includes('NOT ACCEPTABLE')) return 'NOT_ACCEPTABLE';
    if (status === 401 || status === 403) return 'AUTHENTICATION ERROR';
    return 'RULE VALIDATION ERROR';
  }

  // ── Authentication ──────────────────────────────────────────────────────────

  async authenticate(force = false): Promise<string> {
    if (this.config.sandbox) {
      this.token = {
        accessToken: sandboxToken(),
        refreshToken: sandboxToken(),
        expiresAt: Date.now() + EIMS_SANDBOX_TOKEN_TTL_MS,
      };
      return this.token.accessToken;
    }

    if (!force && this.token && this.token.expiresAt > Date.now() + EIMS_TOKEN_REFRESH_BUFFER_MS) {
      return this.token.accessToken;
    }

    const body: EimsAuthRequest = {
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      apikey: this.config.apiKey,
      tin: this.config.tin,
    };

    const signedBody = await this.wrapPayload(body);
    const res = await this.http.post<MorEnvelope<EimsAuthResponse['data']>>(
      '/v1/auth/login',
      signedBody,
    );
    const env = res.data;
    if (env.statusCode !== 200 || !env.body?.accessToken) {
      throw new MorEimsError(
        `MoR auth failed: ${env.message}`,
        env.statusCode,
        'AUTHENTICATION ERROR',
        env.body,
      );
    }
    this.token = {
      accessToken: env.body.accessToken,
      refreshToken: env.body.refreshToken,
      expiresAt: Date.now() + (env.body.expiresIn ?? 3600) * 1000,
    };
    return this.token.accessToken;
  }

  // ── Invoice registration ──────────────────────────────────────────────────────

  async registerInvoice(
    request: EimsInvoiceRegistrationRequest,
  ): Promise<EimsRegistrationResponse> {
    assertTin(request.SellerDetails.Tin, 'SellerDetails.Tin');
    assertTin(request.BuyerDetails.Tin, 'BuyerDetails.Tin');

    const { env } = await this.postEnvelope<EimsRegistrationResponse['body']>(
      '/v1/register',
      request,
    );
    return {
      statusCode: env.statusCode,
      message: env.message,
      body: env.body as EimsRegistrationResponse['body'],
    };
  }

  async bulkRegister(
    requests: EimsInvoiceRegistrationRequest[],
  ): Promise<{ response: EimsBulkRegistrationResponse; status: number }> {
    requests.forEach((r) => assertTin(r.SellerDetails.Tin, 'SellerDetails.Tin'));

    const { env, status } = await this.postEnvelope<EimsBulkRegistrationResponse>(
      '/v1/bulkRegister',
      requests,
    );
    return {
      response: env.body as EimsBulkRegistrationResponse,
      status,
    };
  }

  // ── Cancellation ──────────────────────────────────────────────────────────────

  async cancelInvoice(
    request: EimsCancellationRequest,
  ): Promise<EimsCancellationResponse> {
    const { env } = await this.postEnvelope<EimsCancellationResponse['body']>(
      '/v1/cancel',
      request,
    );
    return {
      statusCode: env.statusCode,
      message: env.message,
      body: env.body as EimsCancellationResponse['body'],
    };
  }

  async bulkCancel(
    items: EimsBulkCancellationItem[],
  ): Promise<{ response: EimsBulkRegistrationResponse; status: number }> {
    const { env, status } = await this.postEnvelope<EimsBulkRegistrationResponse>(
      '/v1/bulkCancel',
      items,
    );
    return { response: env.body as EimsBulkRegistrationResponse, status };
  }

  // ── Verification ────────────────────────────────────────────────────────────

  async verify(irn: string): Promise<EimsVerifyResponse> {
    const { env } = await this.postEnvelope<EimsVerifyResponse['body']>(
      '/v1/verify',
      { irn },
    );
    return {
      statusCode: env.statusCode,
      message: env.message,
      body: env.body as EimsVerifyResponse['body'],
    };
  }

  // ── Receipts ────────────────────────────────────────────────────────────────

  async registerSalesReceipt(
    request: EimsSalesReceiptRequest,
  ): Promise<EimsReceiptResponse> {
    const { env } = await this.postEnvelope<EimsReceiptResponse['body']>(
      '/v1/receipt/sales',
      request,
    );
    return {
      statusCode: env.statusCode,
      message: env.message,
      body: env.body as EimsReceiptResponse['body'],
    };
  }

  async registerWithholdingReceipt(
    request: EimsWithholdingReceiptRequest,
  ): Promise<EimsReceiptResponse> {
    const { env } = await this.postEnvelope<EimsReceiptResponse['body']>(
      '/v1/receipt/withholding',
      request,
    );
    return {
      statusCode: env.statusCode,
      message: env.message,
      body: env.body as EimsReceiptResponse['body'],
    };
  }

  async submitInvoiceSummaryReport(
    request: Record<string, unknown>,
  ): Promise<{ statusCode: number; message: string; body: { reportReference: string; status: string; ackDate: string } }> {
    const { env } = await this.postEnvelope<{ reportReference: string; status: string; ackDate: string }>(
      '/v1/summaryReport',
      request,
    );
    return {
      statusCode: env.statusCode,
      message: env.message,
      body: env.body as { reportReference: string; status: string; ackDate: string },
    };
  }
}

export type { EimsErrorResponse };
