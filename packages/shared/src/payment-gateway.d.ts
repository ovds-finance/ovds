/**
 * Payment Gateway Types — Ethiopian payment ecosystem
 * Covers: Telebirr, CBEBirr, HelloCash, M-Pesa Ethiopia, Amole, bank EFT
 *
 * All monetary amounts are in ETB (Ethiopian Birr).
 */
export type PaymentGateway = 'TELEBIRR' | 'CBEBIRR' | 'HELLOCASH' | 'MPESA_ET' | 'AMOLE' | 'AWASH_PAY' | 'DASHEN_PAY' | 'BANK_EFT' | 'BANK_WIRE' | 'CASH' | 'CHEQUE' | 'OTHER';
export type PaymentGatewayStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'EXPIRED' | 'CANCELLED';
export type PaymentGatewayDirection = 'INBOUND' | 'OUTBOUND';
export interface PaymentGatewayTransaction {
    /** Internal OVDS transaction ID */
    id: string;
    /** Gateway-assigned transaction reference */
    gatewayRef?: string | null;
    /** Which gateway processed this payment */
    gateway: PaymentGateway;
    direction: PaymentGatewayDirection;
    status: PaymentGatewayStatus;
    /** Amount in ETB */
    amount: number;
    /** ISO currency code, defaults to ETB */
    currencyCode?: string;
    /** Fee charged by the gateway (ETB) */
    gatewayFee?: number | null;
    /** Net amount after fees */
    netAmount?: number | null;
    /** Customer/payer phone or account */
    senderRef?: string | null;
    /** Recipient phone or account */
    receiverRef?: string | null;
    /** Linked invoice ID if payment is for an invoice */
    invoiceId?: string | null;
    /** Linked bill ID if payment is for a vendor bill */
    billId?: string | null;
    companyId?: string | null;
    /** ISO 8601 timestamp of initiation */
    initiatedAt: string | Date;
    /** ISO 8601 timestamp of completion (success/failure) */
    completedAt?: string | Date | null;
    /** Raw payload from gateway webhook — store for audit */
    rawPayload?: string | null;
    notes?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}
export interface PaymentGatewayConfig {
    id: string;
    gateway: PaymentGateway;
    companyId: string;
    /** Display name shown to customers */
    displayName: string;
    /** Merchant/Business ID assigned by the gateway */
    merchantId?: string | null;
    /** Indicates config is active */
    isActive: boolean;
    /** Whether this is the default gateway for new invoices */
    isDefault: boolean;
    /** Supported payment types: 'qr' | 'ussd' | 'deeplink' | 'api' */
    supportedTypes?: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
}
export interface PaymentQrPayload {
    /** Gateway that generated this QR */
    gateway: PaymentGateway;
    /** The QR code string (EMVCo format or gateway-specific) */
    qrString: string;
    /** Deep-link URL (for mobile SDKs) */
    deepLink?: string | null;
    /** Amount embedded in QR */
    amount: number;
    currencyCode?: string;
    /** Merchant name */
    merchantName?: string;
    /** Short reference (invoice number, etc.) */
    reference?: string;
    /** Expiry timestamp */
    expiresAt?: string | Date | null;
}
export interface PaymentGatewayWebhookEvent {
    eventId: string;
    gateway: PaymentGateway;
    eventType: 'payment.success' | 'payment.failed' | 'payment.reversed' | 'payment.pending' | 'refund.success' | 'refund.failed';
    gatewayRef: string;
    amount: number;
    currencyCode?: string;
    /** Payer phone/account as provided by gateway */
    payerRef?: string;
    merchantRef?: string;
    /** ISO 8601 */
    occurredAt: string;
    rawPayload: Record<string, unknown>;
}
export interface GatewayReconciliationSummary {
    gateway: PaymentGateway;
    period: string;
    /** Total transactions in gateway statement */
    gatewayCount: number;
    /** Total transactions matched to OVDS invoices */
    matchedCount: number;
    /** Unmatched transactions needing manual review */
    unmatchedCount: number;
    /** Total amount per gateway (ETB) */
    gatewayTotal: number;
    /** Total amount matched in OVDS (ETB) */
    matchedTotal: number;
    /** Difference (reconciling items) */
    variance: number;
    generatedAt: string | Date;
}
export interface InitiatePaymentDto {
    gateway: PaymentGateway;
    amount: number;
    currencyCode?: string;
    invoiceId?: string;
    customerPhone?: string;
    reference?: string;
    companyId?: string;
    callbackUrl?: string;
}
export interface PaymentWebhookResponseDto {
    received: boolean;
    transactionId?: string;
    status?: PaymentGatewayStatus;
}
export declare const GATEWAY_FEES: Record<PaymentGateway, {
    pct: number;
    flat: number;
    min: number;
    max: number;
}>;
/** Calculate gateway fee for an amount */
export declare function calcGatewayFee(gateway: PaymentGateway, amount: number): number;
/** Get display label for a gateway */
export declare const GATEWAY_LABELS: Record<PaymentGateway, string>;
//# sourceMappingURL=payment-gateway.d.ts.map