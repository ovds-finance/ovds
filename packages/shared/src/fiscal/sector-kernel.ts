import type { FiscalDeviceKind, FiscalDeviceConnection } from './hardware-types';

export type BusinessSector =
  | 'RETAIL_FOOD'
  | 'RETAIL_BEVERAGES'
  | 'TOBACCO'
  | 'PETROLEUM'
  | 'RETAIL_TEXTILES'
  | 'BOOKS_STATIONERY'
  | 'CLOTHES_LEATHER'
  | 'PHARMACEUTICALS'
  | 'RETAIL_OTHER'
  | 'RETAIL_USED'
  | 'VEHICLES_PARTS'
  | 'RAILWAY_TRANSPORT'
  | 'PUBLIC_TRANSPORT'
  | 'PASSENGER_TRANSPORT'
  | 'COURIER'
  | 'HOTELS'
  | 'CAMPING_RECREATION'
  | 'RESTAURANTS'
  | 'BARS'
  | 'HOSPITALS'
  | 'MEDICAL_DENTAL'
  | 'BEAUTY_SALON'
  | 'SKIN_CARE'
  | 'SAUNA_STEAM'
  | 'VETERINARY'
  | 'PARKS_AMUSEMENT'
  | 'MANUFACTURING'
  | 'SERVICE'
  | 'IMPORT_EXPORT'
  | 'WHOLESALE'
  | 'OTHER';

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

export const SECTOR_KERNEL_CONFIGS: SectorKernelConfig[] = [
  {
    sector: 'RETAIL_FOOD',
    displayName: 'Retail Trade of Food',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'RETAIL_BEVERAGES',
    displayName: 'Retail Trade of Beverages',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'TOBACCO',
    displayName: 'Cigarettes and Tobacco Products',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'PETROLEUM',
    displayName: 'Petroleum and Petroleum Products',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'RETAIL_TEXTILES',
    displayName: 'Retail Trade of Textiles',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'BOOKS_STATIONERY',
    displayName: 'Books, Newspapers, and Stationery',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'CLOTHES_LEATHER',
    displayName: 'Clothes, Shoes, and Leather Products',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'PHARMACEUTICALS',
    displayName: 'Pharmaceuticals, Medical, and Cosmetics',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'RETAIL_OTHER',
    displayName: 'Retail Trade of Other New Goods',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'RETAIL_USED',
    displayName: 'Retail Trade of Used Goods',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'VEHICLES_PARTS',
    displayName: 'Vehicles, Motorcycles, and Spare Parts',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'RAILWAY_TRANSPORT',
    displayName: 'Urban and Inter-City Railway Transport',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'STANDARD',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER'],
      preferredConnection: 'RS232',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'PUBLIC_TRANSPORT',
    displayName: 'Urban and Suburban Public Transport',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'STANDARD',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER'],
      preferredConnection: 'RS232',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'PASSENGER_TRANSPORT',
    displayName: 'Other Passenger Transport Services',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'STANDARD',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER'],
      preferredConnection: 'RS232',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'COURIER',
    displayName: 'Courier (Postal) Services',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'STANDARD',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'HOTELS',
    displayName: 'Short-Term Accommodation Services (Hotels)',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'PMS_LEDGER',
      taxFocus: 'TOURISM_LEVIES',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'CAMPING_RECREATION',
    displayName: 'Camping and Recreational Sites',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'PMS_LEDGER',
      taxFocus: 'TOURISM_LEVIES',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'RESTAURANTS',
    displayName: 'Restaurants and Mobile Food Services',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'PMS_LEDGER',
      taxFocus: 'TOURISM_LEVIES',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'BARS',
    displayName: 'Beverage Serving (Bar) Services',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'PMS_LEDGER',
      taxFocus: 'TOURISM_LEVIES',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'HOSPITALS',
    displayName: 'Hospital Institution Services',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'STANDARD',
      taxFocus: 'STANDARD',
    },
    invoice: {
      requiresFiscalDevice: false,
      supportedDeviceKinds: ['FISCAL_PRINTER'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: false,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'MEDICAL_DENTAL',
    displayName: 'Medical and Dental Practices',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'STANDARD',
      taxFocus: 'STANDARD',
    },
    invoice: {
      requiresFiscalDevice: false,
      supportedDeviceKinds: ['FISCAL_PRINTER'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: false,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'BEAUTY_SALON',
    displayName: 'Hairdressing and Beauty Salon Services',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'STANDARD',
      taxFocus: 'STANDARD',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'SKIN_CARE',
    displayName: 'Beauty and Skincare Treatment',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'STANDARD',
      taxFocus: 'STANDARD',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'SAUNA_STEAM',
    displayName: 'Sauna, Steam, and Shower Services',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'STANDARD',
      taxFocus: 'STANDARD',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'VETERINARY',
    displayName: 'Veterinary Services',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'STANDARD',
      taxFocus: 'STANDARD',
    },
    invoice: {
      requiresFiscalDevice: false,
      supportedDeviceKinds: ['FISCAL_PRINTER'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: false,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'PARKS_AMUSEMENT',
    displayName: 'Parks and Amusement Places',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'STANDARD',
      taxFocus: 'TOURISM_LEVIES',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'MANUFACTURING',
    displayName: 'Manufacturing',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'BOM_WIP',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: false,
      supportedDeviceKinds: ['FISCAL_PRINTER'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: false,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'SERVICE',
    displayName: 'Service & Consulting',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'STANDARD',
      taxFocus: 'WHT',
    },
    invoice: {
      requiresFiscalDevice: false,
      supportedDeviceKinds: ['FISCAL_PRINTER'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: false,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: 0.10, whtRate: 0.03, zeroRatedExport: false },
  },
  {
    sector: 'IMPORT_EXPORT',
    displayName: 'Import & Export',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'MULTI_CURRENCY',
      taxFocus: 'ZERO_RATED_VAT',
    },
    invoice: {
      requiresFiscalDevice: false,
      supportedDeviceKinds: ['FISCAL_PRINTER'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: false,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: true },
  },
  {
    sector: 'WHOLESALE',
    displayName: 'Wholesale',
    aiReconfiguration: {
      ledgerRouting: 'HIGH_FREQUENCY',
      inventoryEngine: 'REALTIME_MULTILOC',
      taxFocus: 'VAT_TOT_SWITCH',
    },
    invoice: {
      requiresFiscalDevice: true,
      supportedDeviceKinds: ['EJ_MODULE', 'FISCAL_PRINTER', 'ANDROID_POS'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: true,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
  {
    sector: 'OTHER',
    displayName: 'Other',
    aiReconfiguration: {
      ledgerRouting: 'STANDARD',
      inventoryEngine: 'STANDARD',
      taxFocus: 'STANDARD',
    },
    invoice: {
      requiresFiscalDevice: false,
      supportedDeviceKinds: ['FISCAL_PRINTER'],
      preferredConnection: 'USB',
      autoPrint: true,
      qrMandatory: false,
    },
    tax: { defaultVatRate: 0.15, defaultTotRate: null, whtRate: null, zeroRatedExport: false },
  },
];

export function getSectorConfig(sector: BusinessSector): SectorKernelConfig {
  return SECTOR_KERNEL_CONFIGS.find(c => c.sector === sector) ?? SECTOR_KERNEL_CONFIGS[SECTOR_KERNEL_CONFIGS.length - 1];
}
