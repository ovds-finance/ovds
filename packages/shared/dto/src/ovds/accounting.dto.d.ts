import { AccountType, AccountCategory } from '@ovds/shared/types';
export declare class CreateAccountDto {
    companyId?: string;
    code: string;
    name: string;
    type: AccountType;
    category: AccountCategory;
    description?: string;
    isActive?: boolean;
    parentId?: string;
    customFields?: Record<string, string | null>;
}
export declare class UpdateAccountDto {
    companyId?: string;
    code?: string;
    name?: string;
    type?: AccountType;
    category?: AccountCategory;
    description?: string;
    isActive?: boolean;
    parentId?: string;
    customFields?: Record<string, string | null>;
}
export declare class JournalLineDto {
    accountId: string;
    companyId?: string;
    description?: string;
    debit: number;
    credit: number;
}
export declare class CreateJournalEntryDto {
    companyId?: string;
    date?: string;
    reference?: string;
    description: string;
    lines: JournalLineDto[];
}
export declare class CreateVendorDto {
    companyId?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tin?: string;
    notes?: string;
    paymentTerms?: string;
    /** Vendor category: SUPPLIER, CONTRACTOR, SERVICE_PROVIDER, UTILITY, GOVERNMENT, OTHER */
    category?: string;
    /** Vendor status: ACTIVE | INACTIVE */
    status?: string;
    vatNumber?: string;
    isActive?: boolean;
    whtApplicable?: boolean;
    whtType?: string;
    bankName?: string;
    accountNumber?: string;
    customFields?: Record<string, string | null>;
}
export declare class UpdateVendorDto extends CreateVendorDto {
}
export declare class CreateBankAccountDto {
    companyId?: string;
    name: string;
    accountNumber: string;
    bankName: string;
    currencyCode?: string;
    currency?: string;
    openingBalance?: number;
    accountId?: string;
}
//# sourceMappingURL=accounting.dto.d.ts.map