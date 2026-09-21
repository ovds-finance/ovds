var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNumber, Min, IsEnum, } from 'class-validator';
import { Type } from 'class-transformer';
export var FinancialLinkType;
(function (FinancialLinkType) {
    FinancialLinkType["INVOICE"] = "INVOICE";
    FinancialLinkType["INCOME"] = "INCOME";
    FinancialLinkType["VENDOR_BILL"] = "VENDOR_BILL";
    FinancialLinkType["PAYMENT"] = "PAYMENT";
    FinancialLinkType["CREDIT_NOTE"] = "CREDIT_NOTE";
})(FinancialLinkType || (FinancialLinkType = {}));
export var TransactionDirection;
(function (TransactionDirection) {
    TransactionDirection["IN"] = "IN";
    TransactionDirection["OUT"] = "OUT";
})(TransactionDirection || (TransactionDirection = {}));
export class CreateProjectFinancialLinkDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "projectId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "taskId", void 0);
__decorate([
    IsEnum(FinancialLinkType),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "linkType", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "linkId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "linkNumber", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProjectFinancialLinkDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsEnum(TransactionDirection),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "direction", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "linkDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProjectFinancialLinkDto.prototype, "companyId", void 0);
export class UpdateProjectFinancialLinkDto {
}
__decorate([
    IsOptional(),
    IsEnum(FinancialLinkType),
    __metadata("design:type", String)
], UpdateProjectFinancialLinkDto.prototype, "linkType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectFinancialLinkDto.prototype, "linkNumber", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProjectFinancialLinkDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectFinancialLinkDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsEnum(TransactionDirection),
    __metadata("design:type", String)
], UpdateProjectFinancialLinkDto.prototype, "direction", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectFinancialLinkDto.prototype, "linkDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProjectFinancialLinkDto.prototype, "notes", void 0);
