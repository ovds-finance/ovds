var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsOptional, IsInt, IsBoolean, IsArray, IsIn, ArrayMaxSize, ArrayMinSize, MaxLength, Min, Max, } from 'class-validator';
import { Type, Transform } from 'class-transformer';
// -- Bulk operations -----------------------------------------------------------
export class BulkIdsDto {
}
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(500),
    IsString({ each: true }),
    MaxLength(36, { each: true }),
    __metadata("design:type", Array)
], BulkIdsDto.prototype, "ids", void 0);
// -- Warehouses ----------------------------------------------------------------
export class CreateWarehouseDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "name", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "country", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "manager", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateWarehouseDto.prototype, "isDefault", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateWarehouseDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "companyId", void 0);
export class UpdateWarehouseDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateWarehouseDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateWarehouseDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateWarehouseDto.prototype, "manager", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateWarehouseDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateWarehouseDto.prototype, "isActive", void 0);
// -- Transfer Orders -----------------------------------------------------------
export class TransferOrderLineDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], TransferOrderLineDto.prototype, "itemId", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], TransferOrderLineDto.prototype, "quantity", void 0);
export class CreateTransferOrderDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateTransferOrderDto.prototype, "fromWarehouseId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateTransferOrderDto.prototype, "toWarehouseId", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(200),
    Type(() => TransferOrderLineDto),
    __metadata("design:type", Array)
], CreateTransferOrderDto.prototype, "items", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateTransferOrderDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTransferOrderDto.prototype, "companyId", void 0);
// -- Inventory Adjustments -----------------------------------------------------
export class CreateInventoryAdjustmentDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateInventoryAdjustmentDto.prototype, "itemId", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], CreateInventoryAdjustmentDto.prototype, "quantity", void 0);
__decorate([
    IsString(),
    IsIn([
        'ADD',
        'SUBTRACT',
        'SET',
        'DAMAGE',
        'RETURN',
        'TRANSFER',
    ]),
    __metadata("design:type", String)
], CreateInventoryAdjustmentDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateInventoryAdjustmentDto.prototype, "reason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateInventoryAdjustmentDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInventoryAdjustmentDto.prototype, "warehouseId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInventoryAdjustmentDto.prototype, "companyId", void 0);
// -- Fixed Assets --------------------------------------------------------------
export class CreateFixedAssetDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateFixedAssetDto.prototype, "name", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateFixedAssetDto.prototype, "category", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateFixedAssetDto.prototype, "purchaseDate", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateFixedAssetDto.prototype, "purchaseCost", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateFixedAssetDto.prototype, "salvageValue", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateFixedAssetDto.prototype, "usefulLifeYears", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'STRAIGHT_LINE',
        'DECLINING_BALANCE',
        'UNITS_OF_PRODUCTION',
    ]),
    __metadata("design:type", String)
], CreateFixedAssetDto.prototype, "depreciationMethod", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateFixedAssetDto.prototype, "location", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateFixedAssetDto.prototype, "serialNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateFixedAssetDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateFixedAssetDto.prototype, "companyId", void 0);
export class UpdateFixedAssetDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateFixedAssetDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateFixedAssetDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateFixedAssetDto.prototype, "purchaseCost", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateFixedAssetDto.prototype, "salvageValue", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], UpdateFixedAssetDto.prototype, "usefulLifeYears", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'STRAIGHT_LINE',
        'DECLINING_BALANCE',
        'UNITS_OF_PRODUCTION',
    ]),
    __metadata("design:type", String)
], UpdateFixedAssetDto.prototype, "depreciationMethod", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'ACTIVE',
        'DISPOSED',
        'UNDER_MAINTENANCE',
        'FULLY_DEPRECIATED',
    ]),
    __metadata("design:type", String)
], UpdateFixedAssetDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateFixedAssetDto.prototype, "location", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateFixedAssetDto.prototype, "serialNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateFixedAssetDto.prototype, "notes", void 0);
// -- Leases --------------------------------------------------------------------
export class CreateLeaseDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "assetDescription", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "lessor", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "lessorName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "commencementDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], CreateLeaseDto.prototype, "termMonths", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateLeaseDto.prototype, "monthlyPayment", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateLeaseDto.prototype, "interestRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateLeaseDto.prototype, "discountRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateLeaseDto.prototype, "totalValue", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateLeaseDto.prototype, "rouAssetValue", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateLeaseDto.prototype, "totalLeaseLiability", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'OPERATING',
        'ovds',
    ]),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "leaseType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'ACTIVE',
        'EXPIRED',
        'TERMINATED',
    ]),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLeaseDto.prototype, "companyId", void 0);
export class UpdateLeaseDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "assetDescription", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "leaseNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "lessor", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "lessorName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "lessorTin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "assetCategory", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "commencementDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "termMonths", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "monthlyPayment", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "interestRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "discountRate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "totalValue", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "rouAssetValue", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "rouAssetInitial", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "rouAssetCarrying", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "totalLeaseLiability", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "leaseLiabilityInitial", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "leaseLiabilityCurrent", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "totalInterestExpense", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "totalDepreciation", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "totalPaymentsMade", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "residualValueGuarantee", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateLeaseDto.prototype, "purchaseOptionPrice", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateLeaseDto.prototype, "purchaseOptionCertain", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateLeaseDto.prototype, "renewalOptions", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'OPERATING',
        'ovds',
    ]),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "leaseType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'ACTIVE',
        'EXPIRED',
        'TERMINATED',
    ]),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateLeaseDto.prototype, "notes", void 0);
// -- Item Groups ---------------------------------------------------------------
export class CreateItemGroupDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateItemGroupDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateItemGroupDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemGroupDto.prototype, "companyId", void 0);
export class UpdateItemGroupDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateItemGroupDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateItemGroupDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateItemGroupDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemGroupDto.prototype, "companyId", void 0);
// -- Item Variants -------------------------------------------------------------
export class CreateItemVariantDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateItemVariantDto.prototype, "name", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateItemVariantDto.prototype, "sku", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemVariantDto.prototype, "price", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemVariantDto.prototype, "costPrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateItemVariantDto.prototype, "stock", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateItemVariantDto.prototype, "attributes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateItemVariantDto.prototype, "imageUrl", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateItemVariantDto.prototype, "isActive", void 0);
export class UpdateItemVariantDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateItemVariantDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateItemVariantDto.prototype, "sku", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateItemVariantDto.prototype, "priceAdjustment", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], UpdateItemVariantDto.prototype, "stock", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateItemVariantDto.prototype, "attributes", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateItemVariantDto.prototype, "isActive", void 0);
// -- Transaction Categories ----------------------------------------------------
export class CreateTransactionCategoryDto {
}
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "name", void 0);
__decorate([
    IsString(),
    IsIn(['income', 'expense', 'item', 'transfer']),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "color", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTransactionCategoryDto.prototype, "companyId", void 0);
export class UpdateTransactionCategoryDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateTransactionCategoryDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['income', 'expense', 'item', 'transfer']),
    __metadata("design:type", String)
], UpdateTransactionCategoryDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateTransactionCategoryDto.prototype, "color", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateTransactionCategoryDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTransactionCategoryDto.prototype, "companyId", void 0);
// -- Stock Adjustment (inline body) --------------------------------------------
export class AdjustStockDto {
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "delta", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['ADD', 'SUBTRACT']),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "reason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "warehouseId", void 0);
export class AdjustInventoryDto extends AdjustStockDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], AdjustInventoryDto.prototype, "itemId", void 0);
// -- Transfer Order Status -----------------------------------------------------
export class UpdateTransferOrderStatusDto {
}
__decorate([
    IsString(),
    IsIn([
        'DRAFT',
        'APPROVED',
        'IN_TRANSIT',
        'COMPLETED',
        'CANCELLED',
    ]),
    __metadata("design:type", String)
], UpdateTransferOrderStatusDto.prototype, "status", void 0);
// -- Currency Rate -------------------------------------------------------------
export class UpsertCurrencyRateDto {
}
__decorate([
    IsString(),
    MaxLength(3),
    __metadata("design:type", String)
], UpsertCurrencyRateDto.prototype, "fromCurrency", void 0);
__decorate([
    IsString(),
    MaxLength(3),
    __metadata("design:type", String)
], UpsertCurrencyRateDto.prototype, "toCurrency", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpsertCurrencyRateDto.prototype, "rate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpsertCurrencyRateDto.prototype, "source", void 0);
// -- Expense Claims ------------------------------------------------------------
export class CreateExpenseDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "title", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateExpenseDto.prototype, "amount", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "receiptUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'PENDING',
        'APPROVED',
        'REJECTED',
        'PAID',
    ]),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "submittedBy", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "companyId", void 0);
export class UpdateExpenseDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateExpenseDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateExpenseDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateExpenseDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateExpenseDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateExpenseDto.prototype, "receiptUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'PENDING',
        'APPROVED',
        'REJECTED',
        'PAID',
    ]),
    __metadata("design:type", String)
], UpdateExpenseDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateExpenseDto.prototype, "submittedBy", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateExpenseDto.prototype, "companyId", void 0);
// -- Fund Transfers ------------------------------------------------------------
export class CreateFundTransferDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateFundTransferDto.prototype, "fromAccountId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateFundTransferDto.prototype, "toAccountId", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0.01),
    __metadata("design:type", Number)
], CreateFundTransferDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(3),
    __metadata("design:type", String)
], CreateFundTransferDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['INTERNAL', 'ACH', 'WIRE']),
    __metadata("design:type", String)
], CreateFundTransferDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateFundTransferDto.prototype, "reference", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateFundTransferDto.prototype, "note", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateFundTransferDto.prototype, "companyId", void 0);
export class UpdateFundTransferDto {
}
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']),
    __metadata("design:type", String)
], UpdateFundTransferDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateFundTransferDto.prototype, "reference", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateFundTransferDto.prototype, "note", void 0);
// -- Purchase Orders -----------------------------------------------------------
export class PurchaseOrderLineDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PurchaseOrderLineDto.prototype, "itemId", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], PurchaseOrderLineDto.prototype, "description", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PurchaseOrderLineDto.prototype, "quantity", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], PurchaseOrderLineDto.prototype, "unitPrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], PurchaseOrderLineDto.prototype, "vatRate", void 0);
export class CreatePurchaseOrderDto {
}
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "poNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "vendorId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "vendorName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "expectedDelivery", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(500),
    Type(() => PurchaseOrderLineDto),
    __metadata("design:type", Array)
], CreatePurchaseOrderDto.prototype, "items", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'DRAFT',
        'PENDING',
        'SENT',
        'APPROVED',
        'RECEIVED',
        'REJECTED',
        'CANCELLED',
    ]),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreatePurchaseOrderDto.prototype, "totalAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "companyId", void 0);
export class UpdatePurchaseOrderDto {
}
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'DRAFT',
        'PENDING',
        'SENT',
        'APPROVED',
        'RECEIVED',
        'REJECTED',
        'CANCELLED',
    ]),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdatePurchaseOrderDto.prototype, "totalAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "vendorName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "expectedDelivery", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(500),
    Type(() => PurchaseOrderLineDto),
    __metadata("design:type", Array)
], UpdatePurchaseOrderDto.prototype, "items", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "companyId", void 0);
// -- Scanned Bills -------------------------------------------------------------
export class CreateScannedBillDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['BANK', 'TELECOM', 'INVOICE']),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "billType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "vendor", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateScannedBillDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "reference", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "referenceNo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "referencNo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "source", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "currencyCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(10),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "currency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "paidAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "payer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "receiver", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "bankAccountNo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "bankAccountName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "telecomRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "bankRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "creditPart", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "debitPart", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "paidRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "paidName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "rawData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "imageData", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(5000),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "rawText", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Object)
], CreateScannedBillDto.prototype, "ocrConfidence", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "linkedExpenseId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "linkedInvoiceId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "linkedBillId", void 0);
__decorate([
    IsOptional(),
    IsString()
    // companyId removed to fix duplicate identifier TS2300
    ,
    __metadata("design:type", String)
], CreateScannedBillDto.prototype, "linkedCompanyId", void 0);
export class ScannedBillQueryDto {
}
__decorate([
    IsOptional(),
    Transform(({ value }) => (value === '' || value === null ? undefined : value)),
    IsString(),
    __metadata("design:type", String)
], ScannedBillQueryDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => (value === '' || value === null ? undefined : value)),
    IsString(),
    __metadata("design:type", String)
], ScannedBillQueryDto.prototype, "companyIdFilter", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => (value === '' || value === null ? undefined : value)),
    IsString(),
    __metadata("design:type", String)
], ScannedBillQueryDto.prototype, "billType", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => (value === '' || value === null ? undefined : value)),
    IsString(),
    __metadata("design:type", String)
], ScannedBillQueryDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => (value === '' || value === null ? undefined : value)),
    IsString(),
    __metadata("design:type", String)
], ScannedBillQueryDto.prototype, "search", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => {
        if (value === '' || value === null || value === undefined)
            return undefined;
        const n = typeof value === 'string' ? Number(value) : value;
        return Number.isFinite(n) ? n : undefined;
    }),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ScannedBillQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => {
        if (value === '' || value === null || value === undefined)
            return undefined;
        const n = typeof value === 'string' ? Number(value) : value;
        return Number.isFinite(n) ? n : undefined;
    }),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ScannedBillQueryDto.prototype, "limit", void 0);
export class ScannedBillStatsQueryDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ScannedBillStatsQueryDto.prototype, "companyId", void 0);
// -- Receipts ------------------------------------------------------------------
export class CreateReceiptDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "invoiceId", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "customer", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0.01),
    __metadata("design:type", Number)
], CreateReceiptDto.prototype, "amount", void 0);
__decorate([
    IsString(),
    IsIn([
        'CASH',
        'BANK_TRANSFER',
        'TELECOM',
        'CHEQUE',
        'OTHER',
    ]),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "method", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "paidAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "companyId", void 0);
export class UpdateReceiptDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateReceiptDto.prototype, "customer", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateReceiptDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'CASH',
        'BANK_TRANSFER',
        'TELECOM',
        'CHEQUE',
        'OTHER',
    ]),
    __metadata("design:type", String)
], UpdateReceiptDto.prototype, "method", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateReceiptDto.prototype, "paidAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], UpdateReceiptDto.prototype, "notes", void 0);
// -- VAT DTOs ------------------------------------------------------------------
export class CreateReverseChargeDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateReverseChargeDto.prototype, "supplier", void 0);
__decorate([
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateReverseChargeDto.prototype, "service", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateReverseChargeDto.prototype, "invoiceDate", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateReverseChargeDto.prototype, "amountETB", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateReverseChargeDto.prototype, "period", void 0);
export class CreateRefundClaimDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateRefundClaimDto.prototype, "period", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateRefundClaimDto.prototype, "submittedDate", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateRefundClaimDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateRefundClaimDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateRefundClaimDto.prototype, "invoiceNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateRefundClaimDto.prototype, "invoiceId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateRefundClaimDto.prototype, "customerName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateRefundClaimDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateRefundClaimDto.prototype, "reason", void 0);
export class CreateWithholdingDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateWithholdingDto.prototype, "supplier", void 0);
__decorate([
    IsString(),
    MaxLength(15),
    __metadata("design:type", String)
], CreateWithholdingDto.prototype, "tin", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateWithholdingDto.prototype, "invoiceDate", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateWithholdingDto.prototype, "invoiceAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateWithholdingDto.prototype, "period", void 0);
export class CreateInputEntryDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateInputEntryDto.prototype, "supplier", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateInputEntryDto.prototype, "category", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateInputEntryDto.prototype, "invoiceNo", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateInputEntryDto.prototype, "date", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInputEntryDto.prototype, "netAmount", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInputEntryDto.prototype, "vatAmount", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateInputEntryDto.prototype, "claimable", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateInputEntryDto.prototype, "period", void 0);
export class CreateOutputEntryDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateOutputEntryDto.prototype, "customer", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateOutputEntryDto.prototype, "category", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateOutputEntryDto.prototype, "invoiceNo", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOutputEntryDto.prototype, "date", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateOutputEntryDto.prototype, "netAmount", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateOutputEntryDto.prototype, "vatAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateOutputEntryDto.prototype, "period", void 0);
export class CreateExportEvidenceDto {
}
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateExportEvidenceDto.prototype, "invoiceNo", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateExportEvidenceDto.prototype, "customer", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateExportEvidenceDto.prototype, "exportDate", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateExportEvidenceDto.prototype, "amountETB", void 0);
export class CreateEtaxSubmissionDto {
}
__decorate([
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateEtaxSubmissionDto.prototype, "period", void 0);
__decorate([
    IsString(),
    IsIn(['VAT_RETURN', 'WHT_RETURN', 'BIT_DECLARATION']),
    __metadata("design:type", String)
], CreateEtaxSubmissionDto.prototype, "type", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateEtaxSubmissionDto.prototype, "totalAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateEtaxSubmissionDto.prototype, "notes", void 0);
// -- Payment Dispute -----------------------------------------------------------
export class CreatePaymentDisputeDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreatePaymentDisputeDto.prototype, "invoiceId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePaymentDisputeDto.prototype, "paymentId", void 0);
__decorate([
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreatePaymentDisputeDto.prototype, "reason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], CreatePaymentDisputeDto.prototype, "evidence", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreatePaymentDisputeDto.prototype, "amount", void 0);
// -- Ingestion -----------------------------------------------------------------
export class CreateIngestionJobDto {
}
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateIngestionJobDto.prototype, "sourceType", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateIngestionJobDto.prototype, "targetType", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateIngestionJobDto.prototype, "payload", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateIngestionJobDto.prototype, "mimeType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateIngestionJobDto.prototype, "fileName", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateIngestionJobDto.prototype, "autoCommitThreshold", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateIngestionJobDto.prototype, "bankAccountId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateIngestionJobDto.prototype, "companyId", void 0);
export class CommitIngestionRowDto {
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CommitIngestionRowDto.prototype, "rowIndex", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CommitIngestionRowDto.prototype, "overrides", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CommitIngestionRowDto.prototype, "bankAccountId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CommitIngestionRowDto.prototype, "targetType", void 0);
// -- Reconciliation ------------------------------------------------------------
export class RunReconciliationDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RunReconciliationDto.prototype, "bankAccountId", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], RunReconciliationDto.prototype, "applyAutoReconcile", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(365),
    __metadata("design:type", Number)
], RunReconciliationDto.prototype, "dateWindowDays", void 0);
// -- Scanned Bill Link ---------------------------------------------------------
export class LinkScannedBillDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LinkScannedBillDto.prototype, "linkedExpenseId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LinkScannedBillDto.prototype, "linkedInvoiceId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LinkScannedBillDto.prototype, "linkedBillId", void 0);
// -- IFRS Statement Generator --------------------------------------------------
export class GenerateStatementDto {
}
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], GenerateStatementDto.prototype, "type", void 0);
__decorate([
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], GenerateStatementDto.prototype, "period", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], GenerateStatementDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], GenerateStatementDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], GenerateStatementDto.prototype, "endDate", void 0);
// -- KYC Status ----------------------------------------------------------------
export class UpdateKycStatusDto {
}
__decorate([
    IsString(),
    IsIn([
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'EXPIRED',
    ]),
    __metadata("design:type", String)
], UpdateKycStatusDto.prototype, "kycStatus", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateKycStatusDto.prototype, "kycDocumentRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['LOW', 'MEDIUM', 'HIGH']),
    __metadata("design:type", String)
], UpdateKycStatusDto.prototype, "amlRiskLevel", void 0);
// -- Recurring Transactions ----------------------------------------------------
export class CreateRecurringTransactionDto {
}
__decorate([
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateRecurringTransactionDto.prototype, "description", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0.01),
    __metadata("design:type", Number)
], CreateRecurringTransactionDto.prototype, "amount", void 0);
__decorate([
    IsString(),
    IsIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
    __metadata("design:type", String)
], CreateRecurringTransactionDto.prototype, "interval", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateRecurringTransactionDto.prototype, "nextDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateRecurringTransactionDto.prototype, "reference", void 0);
// -- Bulk Bank Import ----------------------------------------------------------
export class BulkBankImportDto {
}
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(5000),
    __metadata("design:type", Array)
], BulkBankImportDto.prototype, "rows", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], BulkBankImportDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], BulkBankImportDto.prototype, "bankAccountId", void 0);
