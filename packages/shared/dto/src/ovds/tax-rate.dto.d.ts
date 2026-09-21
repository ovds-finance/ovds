import { TaxCalculationType } from '@ovds/shared';
export declare class BulkToggleDto {
    ids: string[];
    isActive: boolean;
}
export declare class BulkDeleteDto {
    ids: string[];
}
export declare class CreateTaxRateDto {
    name: string;
    rate: number;
    currencyCode?: string;
    type?: 'VAT' | 'SALES_TAX' | 'WITHHOLDING' | 'INCOME_TAX' | 'DRRF' | 'CUSTOM';
    calculationType?: TaxCalculationType;
    appliesTo?: string[];
    description?: string;
    isActive?: boolean;
    isInclusive?: boolean;
    isCompound?: boolean;
    compoundParentId?: string;
    specificAmount?: number;
    roundingRule?: string;
}
export declare class UpdateTaxRateDto {
    name?: string;
    rate?: number;
    currencyCode?: string;
    type?: 'VAT' | 'SALES_TAX' | 'WITHHOLDING' | 'INCOME_TAX' | 'DRRF' | 'CUSTOM';
    calculationType?: TaxCalculationType;
    appliesTo?: string[];
    description?: string;
    isActive?: boolean;
    isInclusive?: boolean;
    isCompound?: boolean;
    compoundParentId?: string;
    specificAmount?: number;
    roundingRule?: string;
}
//# sourceMappingURL=tax-rate.dto.d.ts.map