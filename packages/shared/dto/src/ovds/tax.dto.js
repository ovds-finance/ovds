var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsArray, IsBoolean, Min, } from 'class-validator';
import { TaxFilingType } from '@ovds/shared/ovds/tax.types';
export class FxDifferenceDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], FxDifferenceDto.prototype, "intercompanyTxId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], FxDifferenceDto.prototype, "period", void 0);
export class NonIncomeTaxDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], NonIncomeTaxDto.prototype, "journalLineId", void 0);
export class VatReconciliationDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], VatReconciliationDto.prototype, "period", void 0);
__decorate([
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], VatReconciliationDto.prototype, "taxableAmount", void 0);
__decorate([
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], VatReconciliationDto.prototype, "outputVat", void 0);
__decorate([
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], VatReconciliationDto.prototype, "inputVat", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], VatReconciliationDto.prototype, "netPayable", void 0);
export class IncomeTaxDto {
}
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IncomeTaxDto.prototype, "year", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], IncomeTaxDto.prototype, "annualRevenue", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IncomeTaxDto.prototype, "netProfit", void 0);
__decorate([
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], IncomeTaxDto.prototype, "rate", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IncomeTaxDto.prototype, "taxPayable", void 0);
export class ETaxPayloadDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ETaxPayloadDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], ETaxPayloadDto.prototype, "tin", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], ETaxPayloadDto.prototype, "period", void 0);
__decorate([
    IsEnum(TaxFilingType),
    __metadata("design:type", String)
], ETaxPayloadDto.prototype, "type", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], ETaxPayloadDto.prototype, "taxableAmount", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], ETaxPayloadDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ETaxPayloadDto.prototype, "paymentRef", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], ETaxPayloadDto.prototype, "submittedAt", void 0);
export class TaxReportDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], TaxReportDto.prototype, "period", void 0);
__decorate([
    IsEnum(TaxFilingType),
    __metadata("design:type", String)
], TaxReportDto.prototype, "type", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], TaxReportDto.prototype, "outputVat", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], TaxReportDto.prototype, "inputVat", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], TaxReportDto.prototype, "netVat", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], TaxReportDto.prototype, "incomeTax", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], TaxReportDto.prototype, "drrfLevies", void 0);
__decorate([
    IsArray(),
    IsOptional(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], TaxReportDto.prototype, "attachments", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], TaxReportDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TaxReportDto.prototype, "eTaxReference", void 0);
export class CreateTaxFilingDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "period", void 0);
__decorate([
    IsString() // Use IsString instead of IsEnum to accept BIT alias
    ,
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "type", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "grossIncome", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "taxableIncome", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "matAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "taxpayerType", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "whtCredits", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "provisionalPaid", void 0);
__decorate([
    IsOptional(),
    IsEnum(['GOODS', 'SERVICES', 'SERVICES_NR', 'RENT', 'DIVIDEND', 'INTEREST',
        'ROYALTY_ARTISTIC', 'ROYALTY_TECHNICAL', 'CAPITAL_GAINS', 'IMPORT']),
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "whtType", void 0);
__decorate([
    IsOptional(),
    IsEnum(['ALCOHOL', 'TOBACCO', 'AUTOMOBILE_GT_1800CC', 'AUTOMOBILE_LT_1800CC',
        'AUTOMOBILE_ELECTRIC', 'JEWELRY', 'YACHT', 'PRIVATE_AIRCRAFT', 'FIREARMS',
        'SUGAR_SWEETENED', 'ENERGY_DRINK', 'PLASTIC', 'OTHER']),
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "exciseCategory", void 0);
__decorate([
    IsOptional(),
    IsEnum(['LOAN_VALUE', 'INSURANCE_PREMIUM', 'SERVICE_FEES', 'AIRTIME_SALES',
        'TICKET_SALES', 'ANNUAL_SALES_REVENUE', 'FUEL_SALES', 'TOBACCO_ALCOHOL',
        'GOVERNMENT_SERVICES', 'SALARY_CONTRIBUTION', 'TELECOM_DIGITAL',
        'DIVIDEND', 'OTHER']),
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "drrfCategory", void 0);
__decorate([
    IsOptional(),
    IsEnum(['EMPLOYEE', 'EMPLOYER', 'COMBINED']),
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "pensionType", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "cifValue", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "customsDuty", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateTaxFilingDto.prototype, "isContract", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateTaxFilingDto.prototype, "contractValue", void 0);
__decorate([
    IsOptional(),
    IsEnum(['EXPENSE', 'ASSET', 'LIABILITY', 'COGS', 'NOT_INCOME_TAX']),
    __metadata("design:type", String)
], CreateTaxFilingDto.prototype, "ias12Treatment", void 0);
export class IncomeTaxFilingDto {
}
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IncomeTaxFilingDto.prototype, "fiscalYear", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IncomeTaxFilingDto.prototype, "netProfit", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], IncomeTaxFilingDto.prototype, "adjustments", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IncomeTaxFilingDto.prototype, "taxableIncome", void 0);
__decorate([
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], IncomeTaxFilingDto.prototype, "taxRate", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IncomeTaxFilingDto.prototype, "taxPayable", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], IncomeTaxFilingDto.prototype, "paid", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IncomeTaxFilingDto.prototype, "balanceDue", void 0);
__decorate([
    IsEnum(['PENDING', 'FILED', 'PAID']),
    __metadata("design:type", String)
], IncomeTaxFilingDto.prototype, "status", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], IncomeTaxFilingDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], IncomeTaxFilingDto.prototype, "etaxRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], IncomeTaxFilingDto.prototype, "notes", void 0);
