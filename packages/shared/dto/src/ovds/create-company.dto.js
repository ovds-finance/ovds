var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, } from 'class-validator';
import { CompanyType, AppEnvironment } from '@ovds/shared/types';
export { CompanyType, AppEnvironment };
export class CreateCompanyDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "name", void 0);
__decorate([
    IsEnum(CompanyType),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "tin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "vatNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "language", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "location", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "apiKey", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "logoUrl", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Number)
], CreateCompanyDto.prototype, "fiscalYearStart", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "industry", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "teamSize", void 0);
__decorate([
    IsOptional(),
    IsEnum(AppEnvironment),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "environment", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateCompanyDto.prototype, "autoUpdate", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateCompanyDto.prototype, "settings", void 0);
export class UpdateCompanyDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsEnum(CompanyType),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "tin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "vatNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "language", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "location", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "apiKey", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "logoUrl", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Number)
], UpdateCompanyDto.prototype, "fiscalYearStart", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "industry", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "teamSize", void 0);
__decorate([
    IsOptional(),
    IsEnum(AppEnvironment),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "environment", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateCompanyDto.prototype, "autoUpdate", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], UpdateCompanyDto.prototype, "settings", void 0);
