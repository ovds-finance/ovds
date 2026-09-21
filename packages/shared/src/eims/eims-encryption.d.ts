/**
 * EIMS payload encryption — AES-256-GCM per EIMS_compliance_Draft.pdf §5.1.5
 *
 * After authentication, non-auth requests may be wrapped as { data: "ciphertext" }
 * using the session encryptionKey from the auth response.
 *
 * NOTE: This module requires Node.js crypto and is intended for backend use only.
 * It is included in @ovds/shared for type-sharing but should not be called in
 * browser contexts (the functions will throw if Node.js crypto is unavailable).
 */
/** Derive a 32-byte AES key from the UUID encryptionKey returned at login */
export declare function deriveEncryptionKey(encryptionKey: string): Promise<Buffer>;
/** Encrypt a JSON payload for EIMS transmission */
export declare function encryptEimsPayload(payload: unknown, encryptionKey: string): Promise<string>;
/** Decrypt an EIMS response payload */
export declare function decryptEimsPayload<T = unknown>(ciphertext: string, encryptionKey: string): Promise<T>;
/** Wrap payload in { data: ciphertext } envelope if encryption is enabled */
export declare function wrapEncryptedBody(payload: unknown, encryptionKey: string | null, useEncryption: boolean): Promise<{
    data: string;
} | unknown>;
/** Unwrap { data: ciphertext } response */
export declare function unwrapEncryptedBody<T = unknown>(body: unknown, encryptionKey: string | null): Promise<T>;
//# sourceMappingURL=eims-encryption.d.ts.map