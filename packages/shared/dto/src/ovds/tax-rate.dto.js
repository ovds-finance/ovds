var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsBoolean, IsUUID, Min, ArrayNotEmpty, } from 'class-validator';
import { TaxCalculationType } from '@ovds/shared';
export class BulkToggleDto {
}
__decorate([
    IsArray(),
    ArrayNotEmpty(),
    IsUUID('4', { each: true }),
    __metadata("design:type", Array)
], BulkToggleDto.prototype, "ids", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], BulkToggleDto.prototype, "isActive", void 0);
export class BulkDeleteDto {
}
__decorate([
    IsArray(),
    ArrayNotEmpty(),
    IsUUID('4', { each: true }),
    __metadata("design:type", Array)
], BulkDeleteDto.prototype, "ids", void 0);
export class CreateTaxRateDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateTaxRateDto.prototype, "name", void 0);
__decorate([
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateTaxRateDto.prototype, "rate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTaxRateDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsEnum(['VAT', 'SALES_TAX', 'WITHHOLDING', 'INCOME_TAX', 'DRRF', 'CUSTOM']),
    __metadata("design:type", String)
], CreateTaxRateDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsEnum(TaxCalculationType),
    __metadata("design:type", String)
], CreateTaxRateDto.prototype, "calculationType", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], CreateTaxRateDto.prototype, "appliesTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTaxRateDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateTaxRateDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateTaxRateDto.prototype, "isInclusive", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateTaxRateDto.prototype, "isCompound", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTaxRateDto.prototype, "compoundParentId", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateTaxRateDto.prototype, "specificAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTaxRateDto.prototype, "roundingRule", void 0);
export class UpdateTaxRateDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTaxRateDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateTaxRateDto.prototype, "rate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTaxRateDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsEnum(['VAT', 'SALES_TAX', 'WITHHOLDING', 'INCOME_TAX', 'DRRF', 'CUSTOM']),
    __metadata("design:type", String)
], UpdateTaxRateDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsEnum(TaxCalculationType),
    __metadata("design:type", String)
], UpdateTaxRateDto.prototype, "calculationType", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], UpdateTaxRateDto.prototype, "appliesTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTaxRateDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateTaxRateDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateTaxRateDto.prototype, "isInclusive", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateTaxRateDto.prototype, "isCompound", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTaxRateDto.prototype, "compoundParentId", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateTaxRateDto.prototype, "specificAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTaxRateDto.prototype, "roundingRule", void 0);
