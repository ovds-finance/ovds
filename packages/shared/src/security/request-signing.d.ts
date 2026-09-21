/**
 * HMAC request signing — shared between backend verification and frontend clients.
 * Algorithm: HMAC-SHA256 of `${timestamp}.${JSON.stringify(payload)}`
 */
export declare const REQUEST_SIGNING_MAX_AGE_MS: number;
export interface RequestSignatureHeaders {
    'X-Request-Timestamp': string;
    'X-Request-Signature': string;
}
/** Compute HMAC-SHA256 hex signature (Node crypto or Web Crypto). */
export declare function computeRequestSignature(secret: string, payload: unknown, timestamp: number): Promise<string>;
/** Build signing headers for an outbound HTTP request. */
export declare function signRequestPayload(secret: string, payload: unknown, timestamp?: number): Promise<RequestSignatureHeaders>;
/** Paths requiring HMAC signing (matches backend @SignedRequest endpoints). */
export declare const SIGNED_REQUEST_PATH_PATTERNS: RegExp[];
export declare function requiresSignedRequestPath(path: string, method: string): boolean;
/** Payload shape must match SignedRequestGuard.reconstructPayload */
export declare function buildSignedPayload(method: string, body: unknown, params?: Record<string, string>, query?: Record<string, unknown>): unknown;
//# sourceMappingURL=request-signing.d.ts.map