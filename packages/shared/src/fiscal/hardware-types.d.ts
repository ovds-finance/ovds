export type FiscalDeviceKind = 'EJ_MODULE' | 'FISCAL_PRINTER' | 'ANDROID_POS' | 'DESKTOP_POS';
export type FiscalDeviceConnection = 'USB' | 'RS232' | 'NETWORK' | 'BLUETOOTH' | 'WIFI';
export type FiscalDeviceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'OFFLINE' | 'SYNCING';
export interface FiscalDevice {
    id: string;
    companyId: string;
    deviceId: string;
    name: string;
    kind: FiscalDeviceKind;
    model: string;
    serialNumber: string;
    connection: FiscalDeviceConnection;
    status: FiscalDeviceStatus;
    fiscalMemoryUsedPct: number | null;
    lastFiscalReportDate: string | null;
    registeredAt: string;
    createdAt: string;
    updatedAt: string;
}
export interface FiscalInvoicePayload {
    invoiceId: string;
    deviceId: string;
    companyId: string;
    tin: string;
    customerTin?: string;
    customerName?: string;
    subTotal: number;
    vatAmount: number;
    totAmount: number;
    grandTotal: number;
    items: FiscalInvoiceItem[];
    fiscalString: string;
    qrCodeData: string;
    signedHash: string;
    issuedAt: string;
    isOffline: boolean;
}
export interface FiscalInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    totRate: number;
    lineTotal: number;
}
export interface OfflineInvoiceQueueItem {
    id: string;
    companyId: string;
    deviceId: string;
    payload: FiscalInvoicePayload;
    status: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
    retryCount: number;
    createdAt: string;
    syncedAt?: string;
}
export interface HardwareAbstractionResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    deviceId?: string;
}
//# sourceMappingURL=hardware-types.d.ts.map