import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsUUID,
  IsIn,
  ArrayMaxSize,
  ArrayMinSize,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';


// -- Bulk operations -----------------------------------------------------------

export class BulkIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @MaxLength(36, { each: true })
  ids!: string[];
}

// -- Warehouses ----------------------------------------------------------------

export class CreateWarehouseDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manager?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manager?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// -- Transfer Orders -----------------------------------------------------------

export class TransferOrderLineDto {
  @IsString()
  itemId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateTransferOrderDto {
  @IsString()
  fromWarehouseId!: string;

  @IsString()
  toWarehouseId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @Type(() => TransferOrderLineDto)
  items!: TransferOrderLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

// -- Inventory Adjustments -----------------------------------------------------

export class CreateInventoryAdjustmentDto {
  @IsString()
  itemId!: string;

  @Type(() => Number)
  @IsInt()
  quantity!: number;

  @IsString()
  @IsIn([
    'ADD',
    'SUBTRACT',
    'SET',
    'DAMAGE',
    'RETURN',
    'TRANSFER',
  ])
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

// -- Fixed Assets --------------------------------------------------------------

export class CreateFixedAssetDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsString()
  purchaseDate!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseCost!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salvageValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usefulLifeYears?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'STRAIGHT_LINE',
    'DECLINING_BALANCE',
    'UNITS_OF_PRODUCTION',
  ])
  depreciationMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateFixedAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salvageValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usefulLifeYears?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'STRAIGHT_LINE',
    'DECLINING_BALANCE',
    'UNITS_OF_PRODUCTION',
  ])
  depreciationMethod?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'ACTIVE',
    'DISPOSED',
    'UNDER_MAINTENANCE',
    'FULLY_DEPRECIATED',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// -- Leases --------------------------------------------------------------------

export class CreateLeaseDto {
  @IsString()
  @MaxLength(200)
  assetDescription!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lessor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lessorName?: string;

  // Frontend sends commencementDate; startDate is kept for backwards compat
  @IsOptional()
  @IsString()
  commencementDate?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  termMonths?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyPayment!: number;

  // interestRate sent by frontend (decimal, e.g. 0.08 = 8%)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  interestRate?: number;

  // discountRate is the canonical backend field name
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalValue?: number;

  // Pre-calculated IFRS 16 values from the frontend preview
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rouAssetValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalLeaseLiability?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'OPERATING',
    'ovds',
  ])
  leaseType?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'ACTIVE',
    'EXPIRED',
    'TERMINATED',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateLeaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  assetDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  leaseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lessor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lessorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  lessorTin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  assetCategory?: string;

  @IsOptional()
  @IsString()
  commencementDate?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  termMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyPayment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rouAssetValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rouAssetInitial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rouAssetCarrying?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalLeaseLiability?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  leaseLiabilityInitial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  leaseLiabilityCurrent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalInterestExpense?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalDepreciation?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalPaymentsMade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  residualValueGuarantee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseOptionPrice?: number;

  @IsOptional()
  @IsBoolean()
  purchaseOptionCertain?: boolean;

  @IsOptional()
  renewalOptions?: any;

  @IsOptional()
  @IsString()
  @IsIn([
    'OPERATING',
    'ovds',
  ])
  leaseType?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'ACTIVE',
    'EXPIRED',
    'TERMINATED',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// -- Item Groups ---------------------------------------------------------------

export class CreateItemGroupDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateItemGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  companyId?: string;
}

// -- Item Variants -------------------------------------------------------------

export class CreateItemVariantDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(50)
  sku!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  attributes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateItemVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceAdjustment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  attributes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// -- Transaction Categories ----------------------------------------------------

export class CreateTransactionCategoryDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsIn(['income', 'expense', 'item', 'transfer'])
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateTransactionCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['income', 'expense', 'item', 'transfer'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

// -- Stock Adjustment (inline body) --------------------------------------------

export class AdjustStockDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delta?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @IsIn(['ADD', 'SUBTRACT'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}

export class AdjustInventoryDto extends AdjustStockDto {
  @IsString()
  itemId!: string;
}

// -- Transfer Order Status -----------------------------------------------------

export class UpdateTransferOrderStatusDto {
  @IsString()
  @IsIn([
    'DRAFT',
    'APPROVED',
    'IN_TRANSIT',
    'COMPLETED',
    'CANCELLED',
  ])
  status!: string;
}

// -- Currency Rate -------------------------------------------------------------

export class UpsertCurrencyRateDto {
  @IsString()
  @MaxLength(3)
  fromCurrency!: string;

  @IsString()
  @MaxLength(3)
  toCurrency!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}

// -- Expense Claims ------------------------------------------------------------

export class CreateExpenseDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PAID',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  submittedBy?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PAID',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  submittedBy?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

// -- Fund Transfers ------------------------------------------------------------

export class CreateFundTransferDto {
  @IsString()
  fromAccountId!: string;

  @IsString()
  toAccountId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['INTERNAL', 'ACH', 'WIRE'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateFundTransferDto {
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

// -- Purchase Orders -----------------------------------------------------------

export class PurchaseOrderLineDto {
  @IsOptional()
  @IsString()
  itemId?: string;

  @IsString()
  @MaxLength(200)
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @MaxLength(100)
  poNumber!: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendorName?: string;

  @IsOptional()
  @IsString()
  expectedDelivery?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencyCode?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @Type(() => PurchaseOrderLineDto)
  items?: PurchaseOrderLineDto[];

  @IsOptional()
  @IsString()
  @IsIn([
    'DRAFT',
    'PENDING',
    'SENT',
    'APPROVED',
    'RECEIVED',
    'REJECTED',
    'CANCELLED',
  ])
  status?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  @IsIn([
    'DRAFT',
    'PENDING',
    'SENT',
    'APPROVED',
    'RECEIVED',
    'REJECTED',
    'CANCELLED',
  ])
  status?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendorName?: string;

  @IsOptional()
  @IsString()
  expectedDelivery?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @Type(() => PurchaseOrderLineDto)
  items?: PurchaseOrderLineDto[];

  @IsOptional()
  @IsString()
  companyId?: string;
}

// -- Scanned Bills -------------------------------------------------------------

export class CreateScannedBillDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BANK', 'TELECOM', 'INVOICE'])
  billType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenceNo?: string;

  /** Typo-tolerant version of referenceNo */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  referencNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencyCode?: string;

  /** Alias for currencyCode */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  paidAt?: string;

  /** Alias for paidAt */
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  payer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  receiver?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankAccountName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  telecomRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankRef?: string;

  @IsOptional()
  @IsString()
  creditPart?: string;

  @IsOptional()
  @IsString()
  debitPart?: string;

  @IsOptional()
  @IsString()
  paidRef?: string;

  @IsOptional()
  @IsString()
  paidName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  rawData?: string;

  /** Base64-encoded image or URL */
  @IsOptional()
  @IsString()
  imageData?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  rawText?: string;

  @IsOptional()
  @IsNumber()
  ocrConfidence?: number | null;

  @IsOptional()
  @IsString()
  linkedExpenseId?: string;

  @IsOptional()
  @IsString()
  linkedInvoiceId?: string;

  @IsOptional()
  @IsString()
  linkedBillId?: string;

  @IsOptional()
  @IsString()
  // companyId removed to fix duplicate identifier TS2300
  linkedCompanyId?: string;
}


export class ScannedBillQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  companyId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  companyIdFilter?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  billType?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  search?: string;


  // Frontend often sends query params as strings (and sometimes empty strings).
  // This Transform makes "" → undefined so @IsInt(@Min(1)) won't fail.
  // Note: we also normalize NaN/invalid numbers to undefined to prevent 400.
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n = typeof value === 'string' ? Number(value) : (value as number);
    return Number.isFinite(n) ? n : undefined;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n = typeof value === 'string' ? Number(value) : (value as number);
    return Number.isFinite(n) ? n : undefined;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}


export class ScannedBillStatsQueryDto {
  @IsOptional()
  @IsString()
  companyId?: string;
}

// -- Receipts ------------------------------------------------------------------

export class CreateReceiptDto {
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsString()
  @MaxLength(200)
  customer!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsIn([
    'CASH',
    'BANK_TRANSFER',
    'TELECOM',
    'CHEQUE',
    'OTHER',
  ])
  method!: string;

  @IsString()
  paidAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateReceiptDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customer?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'CASH',
    'BANK_TRANSFER',
    'TELECOM',
    'CHEQUE',
    'OTHER',
  ])
  method?: string;

  @IsOptional()
  @IsString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// -- VAT DTOs ------------------------------------------------------------------

export class CreateReverseChargeDto {
  @IsString() @MaxLength(200) supplier!: string;
  @IsString() @MaxLength(500) service!: string;
  @IsString() invoiceDate!: string;
  @Type(() => Number) @IsNumber() @Min(0) amountETB!: number;
  @IsOptional() @IsString() @MaxLength(20) period?: string;
}

export class CreateRefundClaimDto {
  @IsOptional() @IsString() @MaxLength(20) period?: string;
  @IsOptional() @IsString() submittedDate?: string;
  @Type(() => Number) @IsNumber() @Min(0) amount!: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsString() @MaxLength(50) invoiceNumber?: string;
  @IsOptional() @IsString() invoiceId?: string;
  @IsOptional() @IsString() @MaxLength(200) customerName?: string;
  @IsOptional() @IsString() @MaxLength(50) type?: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class CreateWithholdingDto {
  @IsString() @MaxLength(200) supplier!: string;
  @IsString() @MaxLength(15) tin!: string;
  @IsString() invoiceDate!: string;
  @Type(() => Number) @IsNumber() @Min(0) invoiceAmount!: number;
  @IsOptional() @IsString() @MaxLength(20) period?: string;
}

export class CreateInputEntryDto {
  @IsString() @MaxLength(200) supplier!: string;
  @IsString() @MaxLength(100) category!: string;
  @IsString() @MaxLength(50) invoiceNo!: string;
  @IsString() date!: string;
  @Type(() => Number) @IsNumber() @Min(0) netAmount!: number;
  @Type(() => Number) @IsNumber() @Min(0) vatAmount!: number;
  @IsBoolean() claimable!: boolean;
  @IsOptional() @IsString() @MaxLength(20) period?: string;
}

export class CreateOutputEntryDto {
  @IsString() @MaxLength(200) customer!: string;
  @IsString() @MaxLength(100) category!: string;
  @IsString() @MaxLength(50) invoiceNo!: string;
  @IsString() date!: string;
  @Type(() => Number) @IsNumber() @Min(0) netAmount!: number;
  @Type(() => Number) @IsNumber() @Min(0) vatAmount!: number;
  @IsOptional() @IsString() @MaxLength(20) period?: string;
}

export class CreateExportEvidenceDto {
  @IsString() @MaxLength(50) invoiceNo!: string;
  @IsString() @MaxLength(200) customer!: string;
  @IsString() exportDate!: string;
  @Type(() => Number) @IsNumber() @Min(0) amountETB!: number;
}

export class CreateEtaxSubmissionDto {
  @IsString() @MaxLength(20) period!: string;
  @IsString()
  @IsIn(['VAT_RETURN', 'WHT_RETURN', 'BIT_DECLARATION'])
  type!: 'VAT_RETURN' | 'WHT_RETURN' | 'BIT_DECLARATION';
  @Type(() => Number) @IsNumber() @Min(0) totalAmount!: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

// -- Payment Dispute -----------------------------------------------------------

export class CreatePaymentDisputeDto {
  @IsString() invoiceId!: string;
  @IsOptional() @IsString() paymentId?: string;
  @IsString() @MaxLength(1000) reason!: string;
  @IsOptional() @IsString() @MaxLength(2000) evidence?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) amount?: number;
}

// -- Ingestion -----------------------------------------------------------------

export class CreateIngestionJobDto {
  @IsString() @MaxLength(50) sourceType!: string;
  @IsString() @MaxLength(50) targetType!: string;
  @IsString() payload!: string;
  @IsOptional() @IsString() @MaxLength(100) mimeType?: string;
  @IsOptional() @IsString() @MaxLength(200) fileName?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  autoCommitThreshold?: number;
  @IsOptional() @IsString() bankAccountId?: string;
  @IsOptional() @IsString() companyId?: string;
}

export class CommitIngestionRowDto {
  @Type(() => Number) @IsInt() @Min(0) rowIndex!: number;
  @IsOptional() overrides?: Record<string, unknown>;
  @IsOptional() @IsString() bankAccountId?: string;
  @IsOptional() @IsString() @MaxLength(50) targetType?: string;
}

// -- Reconciliation ------------------------------------------------------------

export class RunReconciliationDto {
  @IsOptional() @IsString() bankAccountId?: string;
  @IsOptional() @IsBoolean() applyAutoReconcile?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  dateWindowDays?: number;
}

// -- Scanned Bill Link ---------------------------------------------------------

export class LinkScannedBillDto {
  @IsOptional() @IsString() linkedExpenseId?: string;
  @IsOptional() @IsString() linkedInvoiceId?: string;
  @IsOptional() @IsString() linkedBillId?: string;
}

// -- IFRS Statement Generator --------------------------------------------------

export class GenerateStatementDto {
  @IsString() @MaxLength(50) type!: string;
  @IsString() @MaxLength(20) period!: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
}

// -- KYC Status ----------------------------------------------------------------

export class UpdateKycStatusDto {
  @IsString()
  @IsIn([
    'PENDING',
    'VERIFIED',
    'REJECTED',
    'EXPIRED',
  ])
  kycStatus!: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  kycDocumentRef?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  amlRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

// -- Recurring Transactions ----------------------------------------------------

export class CreateRecurringTransactionDto {
  @IsString()
  @MaxLength(500)
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  interval!: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @IsString()
  nextDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;
}

// -- Bulk Bank Import ----------------------------------------------------------

export class BulkBankImportDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  rows!: Record<string, string>[];

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  bankAccountId?: string;
}
