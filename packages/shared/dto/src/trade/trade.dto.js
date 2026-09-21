var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, } from 'class-validator';
import { TradeDirection } from '@ovds/shared/types';
export class CreateShipmentDto {
}
__decorate([
    IsEnum(TradeDirection),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "direction", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "referenceNo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "hsCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "hsDescription", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "goodsDescription", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "originCountry", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "destinationCountry", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "portOfLoading", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "portOfDischarge", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "incoterms", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "invoiceValue", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "notes", void 0);
export class UpdateShipmentStepDto {
}
__decorate([
    IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED']),
    __metadata("design:type", String)
], UpdateShipmentStepDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateShipmentStepDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateShipmentStepDto.prototype, "metadata", void 0);
export class CreateForexApprovalDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateForexApprovalDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateForexApprovalDto.prototype, "applicationDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateForexApprovalDto.prototype, "foreignCurrency", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateForexApprovalDto.prototype, "foreignAmount", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateForexApprovalDto.prototype, "exchangeRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateForexApprovalDto.prototype, "notes", void 0);
export class CreateProformaDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "supplierName", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "buyerName", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "issueDate", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "validUntil", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateProformaDto.prototype, "totalValue", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "incoterms", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "paymentTerms", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "lineItemsJson", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "shipmentId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProformaDto.prototype, "notes", void 0);
