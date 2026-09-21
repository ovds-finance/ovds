import type { FiscalDeviceKind, FiscalDeviceConnection } from './hardware-types';
export type BusinessSector = 'RETAIL_FOOD' | 'RETAIL_BEVERAGES' | 'TOBACCO' | 'PETROLEUM' | 'RETAIL_TEXTILES' | 'BOOKS_STATIONERY' | 'CLOTHES_LEATHER' | 'PHARMACEUTICALS' | 'RETAIL_OTHER' | 'RETAIL_USED' | 'VEHICLES_PARTS' | 'RAILWAY_TRANSPORT' | 'PUBLIC_TRANSPORT' | 'PASSENGER_TRANSPORT' | 'COURIER' | 'HOTELS' | 'CAMPING_RECREATION' | 'RESTAURANTS' | 'BARS' | 'HOSPITALS' | 'MEDICAL_DENTAL' | 'BEAUTY_SALON' | 'SKIN_CARE' | 'SAUNA_STEAM' | 'VETERINARY' | 'PARKS_AMUSEMENT' | 'MANUFACTURING' | 'SERVICE' | 'IMPORT_EXPORT' | 'WHOLESALE' | 'OTHER';
export interface SectorKernelConfig {
    sector: BusinessSector;
    displayName: string;
    aiReconfiguration: {
        ledgerRouting: 'HIGH_FREQUENCY' | 'STANDARD' | 'PROJECT_BASED' | 'TIME_AND_MATERIALS';
        inventoryEngine: 'REALTIME_MULTILOC' | 'BOM_WIP' | 'PMS_LEDGER' | 'MULTI_CURRENCY' | 'STANDARD';
        taxFocus: 'VAT_TOT_SWITCH' | 'DEPRECIATION' | 'WHT' | 'ZERO_RATED_VAT' | 'TOURISM_LEVIES' | 'STANDARD';
    };
    invoice: {
        requiresFiscalDevice: boolean;
        supportedDeviceKinds: FiscalDeviceKind[];
        preferredConnection: FiscalDeviceConnection;
        autoPrint: boolean;
        qrMandatory: boolean;
    };
    tax: {
        defaultVatRate: number;
        defaultTotRate: number | null;
        whtRate: number | null;
        zeroRatedExport: boolean;
    };
}
export declare const SECTOR_KERNEL_CONFIGS: SectorKernelConfig[];
export declare function getSectorConfig(sector: BusinessSector): SectorKernelConfig;
//# sourceMappingURL=sector-kernel.d.ts.map