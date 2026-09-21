var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsOptional, IsInt, Min, Max, IsIn, MaxLength, IsEmail, IsBoolean, IsArray, } from 'class-validator';
import { Type, Transform } from 'class-transformer';
export class CreateItemDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateItemDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateItemDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateItemDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateItemDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateItemDto.prototype, "sku", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateItemDto.prototype, "unit", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "salePrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "costPrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "stock", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "stockQuantity", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "reorderLevel", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], CreateItemDto.prototype, "trackInventory", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], CreateItemDto.prototype, "vatApplicable", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "itemType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "groupId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "warehouseId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "barcode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "imageUrl", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], CreateItemDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "price", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "purchasePrice", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateItemDto.prototype, "customFields", void 0);
export class UpdateItemDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "sku", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "unit", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "salePrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "costPrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "stock", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "reorderLevel", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], UpdateItemDto.prototype, "trackInventory", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "itemType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "groupId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "warehouseId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "barcode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "imageUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], UpdateItemDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateItemDto.prototype, "customFields", void 0);
export class InvoiceLineItemDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceLineItemDto.prototype, "id", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceLineItemDto.prototype, "itemId", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], InvoiceLineItemDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], InvoiceLineItemDto.prototype, "salePrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], InvoiceLineItemDto.prototype, "price", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], InvoiceLineItemDto.prototype, "discount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], InvoiceLineItemDto.prototype, "discountValue", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceLineItemDto.prototype, "discountType", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], InvoiceLineItemDto.prototype, "taxRate", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", String)
], InvoiceLineItemDto.prototype, "exciseCategory", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], InvoiceLineItemDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], InvoiceLineItemDto.prototype, "createdAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], InvoiceLineItemDto.prototype, "updatedAt", void 0);
export class CreateInvoiceDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "id", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "invoiceNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "paymentTerms", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "totalAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "vatAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "discountAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "customer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "customerName", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => value === '' ? undefined : value),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "customerEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "customerPhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "customerAddress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "customerTin", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "subtotal", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "drrfAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateInvoiceDto.prototype, "isVatRegistered", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "totAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "totRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "exciseAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "exciseRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "exciseCategory", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "importSurtaxAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "importBase", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "customsDutyAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "exciseDutyAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "whtAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "whtRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "whtType", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateInvoiceDto.prototype, "applyWht", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "stampDutyAmount", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateInvoiceDto.prototype, "stampDutyRequired", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "matAmount", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateInvoiceDto.prototype, "matApplied", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "invoiceDiscount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "lateInterestRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "qrData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "customerNotes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "paymentSource", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "telecomReceiptRef", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "telecomAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "telecomPaidAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "telecomRawData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "bankAccountNo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "bankQrRawData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "receiptImageData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "bankSlipImageData", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], CreateInvoiceDto.prototype, "items", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "footer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "discountLocation", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "discountType", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "discountValue", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "recurringInterval", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateInvoiceDto.prototype, "isRecurring", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "recurringNextDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "invoiceCurrency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "currencyRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "orderNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "warehouseId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "companyTitle", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "ifrsPerformanceObligation", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "ifrsRecognitionTiming", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "ifrsContractRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "ifrsVariableConsideration", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "ifrsReceivableClass", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "ifrsCreditRisk", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "ifrsEclProvision", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "ifrsMeasurementCategory", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateInvoiceDto.prototype, "ifrsHasWarranty", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "ifrsWarrantyProvision", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "ifrsContingency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "interactionType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "archType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "processType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "bankAccountName", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], CreateInvoiceDto.prototype, "ccEmails", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], CreateInvoiceDto.prototype, "bccEmails", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], CreateInvoiceDto.prototype, "taxes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], CreateInvoiceDto.prototype, "createdAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], CreateInvoiceDto.prototype, "updatedAt", void 0);
export class CreateEstimateDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "id", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "estimateNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "invoiceNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "customer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "customerName", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "customerEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "customerPhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "customerAddress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "customerTin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'DRAFT',
        'PENDING',
        'PAID',
        'OVERDUE',
        'CANCELLED',
    ]),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "estimateDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "expiryDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "paymentTerms", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEstimateDto.prototype, "totalAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEstimateDto.prototype, "total", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEstimateDto.prototype, "vatAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEstimateDto.prototype, "taxAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEstimateDto.prototype, "subtotal", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEstimateDto.prototype, "invoiceDiscount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(3),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEstimateDto.prototype, "currencyRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "customerNotes", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], CreateEstimateDto.prototype, "items", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEstimateDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], CreateEstimateDto.prototype, "createdAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], CreateEstimateDto.prototype, "updatedAt", void 0);
export class UpdateEstimateDto extends CreateEstimateDto {
}
export class UpdateInvoiceDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "customer", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "customerEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "customerPhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "customerAddress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "customerTin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'DRAFT',
        'PENDING',
        'PAID',
        'OVERDUE',
        'CANCELLED',
    ]),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "totalAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "vatAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "subtotal", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "drrfAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateInvoiceDto.prototype, "isVatRegistered", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "totAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "totRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "exciseAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "exciseRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "exciseCategory", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "importSurtaxAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "importBase", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "customsDutyAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "exciseDutyAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "whtAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "whtRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "whtType", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateInvoiceDto.prototype, "applyWht", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "stampDutyAmount", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateInvoiceDto.prototype, "stampDutyRequired", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "matAmount", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateInvoiceDto.prototype, "matApplied", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "invoiceDiscount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "lateInterestRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "paymentSource", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "telecomReceiptRef", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "telecomAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "telecomPaidAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "telecomRawData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "bankAccountNo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "bankQrRawData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "customerNotes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "receiptImageData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "bankSlipImageData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "scheduledSendAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'NET7',
        'NET15',
        'NET30',
        'NET60',
        'NET90',
        'IMMEDIATE',
    ]),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "paymentTerms", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "footer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "discountLocation", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "discountType", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "discountValue", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "recurringInterval", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateInvoiceDto.prototype, "isRecurring", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "invoiceCurrency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "currencyRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "orderNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "ifrsPerformanceObligation", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "ifrsContractRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "ifrsReceivableClass", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "ifrsCreditRisk", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateInvoiceDto.prototype, "ifrsEclProvision", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "interactionType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "archType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "processType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateInvoiceDto.prototype, "bankAccountName", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], UpdateInvoiceDto.prototype, "ccEmails", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], UpdateInvoiceDto.prototype, "bccEmails", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], UpdateInvoiceDto.prototype, "taxes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], UpdateInvoiceDto.prototype, "createdAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], UpdateInvoiceDto.prototype, "updatedAt", void 0);
export class BillLineItemDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], BillLineItemDto.prototype, "itemId", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], BillLineItemDto.prototype, "quantity", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], BillLineItemDto.prototype, "purchasePrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], BillLineItemDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], BillLineItemDto.prototype, "description", void 0);
export class CreateBillDto {
}
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateBillDto.prototype, "billNumber", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateBillDto.prototype, "vendor", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateBillDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['PENDING', 'PAID', 'OVERDUE']),
    __metadata("design:type", String)
], CreateBillDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillDto.prototype, "dueDate", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBillDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateBillDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBillDto.prototype, "vatAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBillDto.prototype, "total", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateBillDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateBillDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateBillDto.prototype, "color", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillDto.prototype, "vendorId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateBillDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBillDto.prototype, "currencyRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(15),
    __metadata("design:type", String)
], CreateBillDto.prototype, "vendorTin", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], CreateBillDto.prototype, "whtApplicable", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateBillDto.prototype, "isRecurring", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateBillDto.prototype, "recurringInterval", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillDto.prototype, "recurringNextDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillDto.prototype, "warehouseId", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], CreateBillDto.prototype, "items", void 0);
export class UpdateBillDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "billNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "vendor", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['PENDING', 'PAID', 'OVERDUE']),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBillDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateBillDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBillDto.prototype, "vatAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBillDto.prototype, "total", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "color", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(15),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "vendorTin", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "vendorId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBillDto.prototype, "currencyRate", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Boolean)
], UpdateBillDto.prototype, "whtApplicable", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateBillDto.prototype, "isRecurring", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "recurringInterval", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "recurringNextDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "warehouseId", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], UpdateBillDto.prototype, "items", void 0);
export class CreateBillPaymentDto {
}
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0.01),
    __metadata("design:type", Number)
], CreateBillPaymentDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['CASH', 'BANK_TRANSFER', 'TELECOM', 'CHEQUE', 'OTHER']),
    __metadata("design:type", String)
], CreateBillPaymentDto.prototype, "method", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateBillPaymentDto.prototype, "reference", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateBillPaymentDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillPaymentDto.prototype, "paidAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillPaymentDto.prototype, "bankAccountId", void 0);
export class CreateInvoicePaymentDto {
}
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0.01),
    __metadata("design:type", Number)
], CreateInvoicePaymentDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['CASH', 'BANK_TRANSFER', 'TELECOM', 'CHEQUE', 'OTHER']),
    __metadata("design:type", String)
], CreateInvoicePaymentDto.prototype, "method", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateInvoicePaymentDto.prototype, "reference", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateInvoicePaymentDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvoicePaymentDto.prototype, "paidAt", void 0);
export class UniversalLineItemDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UniversalLineItemDto.prototype, "itemId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], UniversalLineItemDto.prototype, "description", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UniversalLineItemDto.prototype, "quantity", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UniversalLineItemDto.prototype, "unitPrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UniversalLineItemDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UniversalLineItemDto.prototype, "discount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UniversalLineItemDto.prototype, "discountType", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], UniversalLineItemDto.prototype, "discountValue", void 0);
export class CreateUniversalInvoiceDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "invoiceNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "billNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "docType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "customerName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "vendor", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "customerEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "customerPhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "customerAddress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "customerTin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(15),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "vendorTin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['DRAFT', 'PENDING', 'PAID', 'OVERDUE']),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateUniversalInvoiceDto.prototype, "subtotal", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateUniversalInvoiceDto.prototype, "vatAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateUniversalInvoiceDto.prototype, "totalAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateUniversalInvoiceDto.prototype, "drrfAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateUniversalInvoiceDto.prototype, "vatRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['ONLINE', 'OFFLINE', 'HYBRID']),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "deliveryMode", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateUniversalInvoiceDto.prototype, "generateShareLink", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateUniversalInvoiceDto.prototype, "downloadablePdf", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateUniversalInvoiceDto.prototype, "sendEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "paymentSource", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "paymentMethod", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "template", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "brandLogo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateUniversalInvoiceDto.prototype, "brandColor", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateUniversalInvoiceDto.prototype, "paymentInstructions", void 0);
export class InvoiceQueryDto {
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], InvoiceQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(200),
    __metadata("design:type", Number)
], InvoiceQueryDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(200),
    __metadata("design:type", Number)
], InvoiceQueryDto.prototype, "take", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "dateFrom", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "dateTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "paymentSource", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "customerTin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "customer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], InvoiceQueryDto.prototype, "customerEmail", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], InvoiceQueryDto.prototype, "overdueOnly", void 0);
export class CreateCustomerDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "rhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "tin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "paymentTerms", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "businessType", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateCustomerDto.prototype, "creditLimit", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "riskLevel", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "vatNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateCustomerDto.prototype, "customFields", void 0);
export class UpdateCustomerDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "rhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "tin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "paymentTerms", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "businessType", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateCustomerDto.prototype, "creditLimit", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "riskLevel", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "vatNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateCustomerDto.prototype, "customFields", void 0);
