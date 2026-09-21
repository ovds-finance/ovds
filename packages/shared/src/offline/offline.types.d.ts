/**
 * Offline Resilience Types for Ministry of Revenues Regulation No. 570/2025
 * Covers the 26 business sectors legally required to have offline functionality
 * Businesses in these sectors are PROHIBITED from using software without offline capability
 */
export type RegulatedSector = 'FOOD_RETAIL' | 'BEVERAGE_RETAIL' | 'TOBACCO_RETAIL' | 'PETROLEUM_RETAIL' | 'TEXTILE_RETAIL' | 'STATIONERY_RETAIL' | 'CLOTHING_RETAIL' | 'PHARMA_RETAIL' | 'NEW_GOODS_RETAIL' | 'USED_GOODS_RETAIL' | 'VEHICLE_RETAIL' | 'RAILWAY_TRANSPORT' | 'PUBLIC_TRANSPORT' | 'PASSENGER_TRANSPORT' | 'COURIER_SERVICES' | 'SHORT_TERM_ACCOMMODATION' | 'CAMPING_RECREATION' | 'RESTAURANT_FOOD_SERVICES' | 'BEVERAGE_SERVICES' | 'HOSPITAL_SERVICES' | 'MEDICAL_PRACTICE' | 'HAIRDRESSING_SALON' | 'BEAUTY_SKINCARE' | 'SAUNA_SERVICES' | 'VETERINARY_SERVICES' | 'PARK_AMUSEMENT';
export declare const REGULATED_SECTORS: RegulatedSector[];
export interface OfflineInvoiceQueue {
    id: string;
    companyId: string;
    invoiceData: OfflineInvoiceData;
    status: OfflineQueueStatus;
    createdAt: Date | string;
    updatedAt: Date | string;
    syncAttempts: number;
    lastSyncAttempt?: Date | string;
    syncError?: string;
    deviceId: string;
    fiscalYear: string;
    sequenceNumber: number;
}
export type OfflineQueueStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
export interface OfflineInvoiceData {
    invoiceNumber: string;
    customerName: string;
    customerTin?: string;
    customerPhone?: string;
    customerAddress?: string;
    date: Date | string;
    dueDate?: Date | string;
    items: OfflineInvoiceItem[];
    subtotal: number;
    vatAmount: number;
    drrfAmount?: number;
    totalAmount: number;
    notes?: string;
    paymentMethod?: 'CASH' | 'CHEQUE' | 'CARD' | 'MOBILE';
    isRecurring?: boolean;
    recurringInterval?: string;
}
export interface OfflineInvoiceItem {
    itemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    discount?: number;
}
export interface OfflineSyncPayload {
    deviceId: string;
    companyId: string;
    queuedInvoices: OfflineInvoiceQueue[];
    checksum: string;
    timestamp: Date | string;
}
export interface UniversalInvoiceBill {
    invoiceNumber: string;
    billNumber?: string;
    fiscalYear: string;
    sequenceNumber: number;
    transactionType: 'INVOICE' | 'BILL';
    customerVendor: {
        name: string;
        tin?: string;
        phone?: string;
        address?: string;
    };
    items: UniversalLineItem[];
    amounts: {
        subtotal: number;
        vatAmount: number;
        drrfAmount: number;
        whtAmount?: number;
        totalAmount: number;
    };
    timestamps: {
        createdAt: Date | string;
        dueDate?: Date | string;
        paidAt?: Date | string;
    };
    compliance: EthiopianTaxCompliance;
    digitalSignature?: string;
    qrCode?: string;
}
export interface UniversalLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    vatAmount: number;
    total: number;
}
export interface EthiopianTaxCompliance {
    vatRegistrationRequired: boolean;
    vatRate: number;
    drrfRate: number;
    whtApplicable: boolean;
    matRate: number;
    taxCategory: 'A' | 'B' | 'C';
}
export interface OfflineCapabilities {
    canWorkOffline: boolean;
    requiresResilience: boolean;
    offlineStorageLimit: number;
    syncStrategy: 'IMMEDIATE' | 'BATCH' | 'MANUAL';
    lastSyncTimestamp?: Date | string;
    pendingSyncCount: number;
}
export type InvoiceTemplateId = 'MODERN_BLUE' | 'CLASSIC_GRAY' | 'MINIMAL_WHITE' | 'DARK_PREMIUM' | 'ETHIOPIAN_OFFICIAL' | 'SIMPLE_RECEIPT';
export interface InvoiceTemplate {
    id: InvoiceTemplateId;
    name: string;
    description: string;
    previewColors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    layout: 'STANDARD' | 'COMPACT' | 'THERMAL' | 'A4_PORTRAIT' | 'A4_LANDSCAPE';
    showQrCode: boolean;
    showTaxBreakdown: boolean;
    showBankDetails: boolean;
    showTerms: boolean;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
}
export declare const INVOICE_TEMPLATES: InvoiceTemplate[];
export type ConflictResolutionStrategy = 'SKIP' | 'OVERWRITE' | 'MERGE' | 'CREATE_NEW';
export type DeliveryMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export interface OfflineDeliveryMode {
    mode: DeliveryMode;
    requiresOfflineCapability: boolean;
    syncStrategy: 'IMMEDIATE' | 'BATCH' | 'MANUAL';
    offlineFirst: boolean;
}
export interface OfflineDeviceInfo {
    deviceId: string;
    deviceName: string;
    deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'POS';
    lastSyncAt?: Date | string;
    pendingCount: number;
    isOnline: boolean;
}
//# sourceMappingURL=offline.types.d.ts.map