import { CompanyType, AppEnvironment } from '@ovds/shared/types';
export { CompanyType, AppEnvironment };
export declare class CreateCompanyDto {
    name: string;
    type: CompanyType;
    tin?: string;
    vatNumber?: string;
    language?: string;
    location?: string;
    apiKey?: string;
    currencyCode?: string;
    logoUrl?: string;
    fiscalYearStart?: number;
    industry?: string;
    teamSize?: string;
    environment?: AppEnvironment;
    autoUpdate?: boolean;
    settings?: any;
}
export declare class UpdateCompanyDto {
    name?: string;
    type?: CompanyType;
    tin?: string;
    vatNumber?: string;
    language?: string;
    location?: string;
    apiKey?: string;
    currencyCode?: string;
    logoUrl?: string;
    fiscalYearStart?: number;
    industry?: string;
    teamSize?: string;
    environment?: AppEnvironment;
    autoUpdate?: boolean;
    settings?: any;
}
//# sourceMappingURL=create-company.dto.d.ts.map