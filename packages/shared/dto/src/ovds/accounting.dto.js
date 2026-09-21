var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, Min, MaxLength, } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType, AccountCategory } from '@ovds/shared/types';
export class CreateAccountDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "code", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "name", void 0);
__decorate([
    IsEnum(AccountType),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "type", void 0);
__decorate([
    IsEnum(AccountCategory),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateAccountDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateAccountDto.prototype, "customFields", void 0);
export class UpdateAccountDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsEnum(AccountType),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsEnum(AccountCategory),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateAccountDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateAccountDto.prototype, "customFields", void 0);
export class JournalLineDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], JournalLineDto.prototype, "accountId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], JournalLineDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], JournalLineDto.prototype, "description", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], JournalLineDto.prototype, "debit", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], JournalLineDto.prototype, "credit", void 0);
export class CreateJournalEntryDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "reference", void 0);
__decorate([
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "description", void 0);
__decorate([
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => JournalLineDto),
    __metadata("design:type", Array)
], CreateJournalEntryDto.prototype, "lines", void 0);
export class CreateVendorDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "tin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "paymentTerms", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "vatNumber", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateVendorDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateVendorDto.prototype, "whtApplicable", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "whtType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateVendorDto.prototype, "accountNumber", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateVendorDto.prototype, "customFields", void 0);
export class UpdateVendorDto extends CreateVendorDto {
}
export class CreateBankAccountDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "name", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "accountNumber", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "currency", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], CreateBankAccountDto.prototype, "openingBalance", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBankAccountDto.prototype, "accountId", void 0);
