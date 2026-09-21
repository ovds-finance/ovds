export declare class BulkIdsDto {
    ids: string[];
}
export declare class CreateWarehouseDto {
    name: string;
    code: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    manager?: string;
    isDefault?: boolean;
    isActive?: boolean;
    companyId?: string;
}
export declare class UpdateWarehouseDto {
    name?: string;
    address?: string;
    manager?: string;
    code?: string;
    isActive?: boolean;
}
export declare class TransferOrderLineDto {
    itemId: string;
    quantity: number;
}
export declare class CreateTransferOrderDto {
    fromWarehouseId: string;
    toWarehouseId: string;
    items: TransferOrderLineDto[];
    notes?: string;
    companyId?: string;
}
export declare class CreateInventoryAdjustmentDto {
    itemId: string;
    quantity: number;
    type: string;
    reason?: string;
    notes?: string;
    warehouseId?: string;
    companyId?: string;
}
export declare class CreateFixedAssetDto {
    name: string;
    category: string;
    purchaseDate: string;
    purchaseCost: number;
    salvageValue?: number;
    usefulLifeYears?: number;
    depreciationMethod?: string;
    location?: string;
    serialNumber?: string;
    notes?: string;
    companyId?: string;
}
export declare class UpdateFixedAssetDto {
    name?: string;
    category?: string;
    purchaseCost?: number;
    salvageValue?: number;
    usefulLifeYears?: number;
    depreciationMethod?: string;
    status?: string;
    location?: string;
    serialNumber?: string;
    notes?: string;
}
export declare class CreateLeaseDto {
    assetDescription: string;
    lessor?: string;
    lessorName?: string;
    commencementDate?: string;
    startDate?: string;
    endDate?: string;
    termMonths?: number;
    monthlyPayment: number;
    interestRate?: number;
    discountRate?: number;
    totalValue?: number;
    rouAssetValue?: number;
    totalLeaseLiability?: number;
    leaseType?: string;
    status?: string;
    notes?: string;
    companyId?: string;
}
export declare class UpdateLeaseDto {
    assetDescription?: string;
    leaseNumber?: string;
    lessor?: string;
    lessorName?: string;
    lessorTin?: string;
    assetCategory?: string;
    commencementDate?: string;
    startDate?: string;
    endDate?: string;
    termMonths?: number;
    monthlyPayment?: number;
    interestRate?: number;
    discountRate?: number;
    totalValue?: number;
    rouAssetValue?: number;
    rouAssetInitial?: number;
    rouAssetCarrying?: number;
    totalLeaseLiability?: number;
    leaseLiabilityInitial?: number;
    leaseLiabilityCurrent?: number;
    totalInterestExpense?: number;
    totalDepreciation?: number;
    totalPaymentsMade?: number;
    residualValueGuarantee?: number;
    purchaseOptionPrice?: number;
    purchaseOptionCertain?: boolean;
    renewalOptions?: any;
    leaseType?: string;
    status?: string;
    notes?: string;
}
export declare class CreateItemGroupDto {
    name: string;
    description?: string;
    companyId?: string;
}
export declare class UpdateItemGroupDto {
    name?: string;
    description?: string;
    isActive?: boolean;
    companyId?: string;
}
export declare class CreateItemVariantDto {
    name: string;
    sku: string;
    price?: number;
    costPrice?: number;
    stock?: number;
    attributes?: string;
    imageUrl?: string;
    isActive?: boolean;
}
export declare class UpdateItemVariantDto {
    name?: string;
    sku?: string;
    priceAdjustment?: number;
    stock?: number;
    attributes?: string;
    isActive?: boolean;
}
export declare class CreateTransactionCategoryDto {
    name: string;
    type: string;
    color?: string;
    description?: string;
    companyId?: string;
}
export declare class UpdateTransactionCategoryDto {
    name?: string;
    type?: string;
    color?: string;
    description?: string;
    companyId?: string;
}
export declare class AdjustStockDto {
    delta?: number;
    quantity?: number;
    type?: string;
    reason?: string;
    warehouseId?: string;
}
export declare class AdjustInventoryDto extends AdjustStockDto {
    itemId: string;
}
export declare class UpdateTransferOrderStatusDto {
    status: string;
}
export declare class UpsertCurrencyRateDto {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string;
}
export declare class CreateExpenseDto {
    title: string;
    amount: number;
    category: string;
    description?: string;
    receiptUrl?: string;
    currencyCode?: string;
    status?: string;
    submittedBy?: string;
    companyId?: string;
}
export declare class UpdateExpenseDto {
    title?: string;
    amount?: number;
    category?: string;
    description?: string;
    receiptUrl?: string;
    status?: string;
    submittedBy?: string;
    companyId?: string;
}
export declare class CreateFundTransferDto {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    currencyCode?: string;
    type?: string;
    reference?: string;
    note?: string;
    companyId?: string;
}
export declare class UpdateFundTransferDto {
    status?: string;
    reference?: string;
    note?: string;
}
export declare class PurchaseOrderLineDto {
    itemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate?: number;
}
export declare class CreatePurchaseOrderDto {
    poNumber: string;
    vendorId?: string;
    vendorName?: string;
    expectedDelivery?: string;
    notes?: string;
    currencyCode?: string;
    items?: PurchaseOrderLineDto[];
    status?: string;
    totalAmount?: number;
    companyId?: string;
}
export declare class UpdatePurchaseOrderDto {
    status?: string;
    totalAmount?: number;
    vendorName?: string;
    expectedDelivery?: string;
    notes?: string;
    items?: PurchaseOrderLineDto[];
    companyId?: string;
}
export declare class CreateScannedBillDto {
    companyId?: string;
    billType?: string;
    vendor?: string;
    amount?: number;
    reference?: string;
    referenceNo?: string;
    /** Typo-tolerant version of referenceNo */
    referencNo?: string;
    source?: string;
    currencyCode?: string;
    /** Alias for currencyCode */
    currency?: string;
    paidAt?: string;
    /** Alias for paidAt */
    date?: string;
    payer?: string;
    receiver?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
    telecomRef?: string;
    bankRef?: string;
    creditPart?: string;
    debitPart?: string;
    paidRef?: string;
    paidName?: string;
    description?: string;
    rawData?: string;
    /** Base64-encoded image or URL */
    imageData?: string;
    rawText?: string;
    ocrConfidence?: number | null;
    linkedExpenseId?: string;
    linkedInvoiceId?: string;
    linkedBillId?: string;
    linkedCompanyId?: string;
}
export declare class ScannedBillQueryDto {
    companyId?: string;
    companyIdFilter?: string;
    billType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class ScannedBillStatsQueryDto {
    companyId?: string;
}
export declare class CreateReceiptDto {
    invoiceId?: string;
    customer: string;
    amount: number;
    method: string;
    paidAt: string;
    notes?: string;
    companyId?: string;
}
export declare class UpdateReceiptDto {
    customer?: string;
    amount?: number;
    method?: string;
    paidAt?: string;
    notes?: string;
}
export declare class CreateReverseChargeDto {
    supplier: string;
    service: string;
    invoiceDate: string;
    amountETB: number;
    period?: string;
}
export declare class CreateRefundClaimDto {
    period?: string;
    submittedDate?: string;
    amount: number;
    notes?: string;
    invoiceNumber?: string;
    invoiceId?: string;
    customerName?: string;
    type?: string;
    reason?: string;
}
export declare class CreateWithholdingDto {
    supplier: string;
    tin: string;
    invoiceDate: string;
    invoiceAmount: number;
    period?: string;
}
export declare class CreateInputEntryDto {
    supplier: string;
    category: string;
    invoiceNo: string;
    date: string;
    netAmount: number;
    vatAmount: number;
    claimable: boolean;
    period?: string;
}
export declare class CreateOutputEntryDto {
    customer: string;
    category: string;
    invoiceNo: string;
    date: string;
    netAmount: number;
    vatAmount: number;
    period?: string;
}
export declare class CreateExportEvidenceDto {
    invoiceNo: string;
    customer: string;
    exportDate: string;
    amountETB: number;
}
export declare class CreateEtaxSubmissionDto {
    period: string;
    type: 'VAT_RETURN' | 'WHT_RETURN' | 'BIT_DECLARATION';
    totalAmount: number;
    notes?: string;
}
export declare class CreatePaymentDisputeDto {
    invoiceId: string;
    paymentId?: string;
    reason: string;
    evidence?: string;
    amount?: number;
}
export declare class CreateIngestionJobDto {
    sourceType: string;
    targetType: string;
    payload: string;
    mimeType?: string;
    fileName?: string;
    autoCommitThreshold?: number;
    bankAccountId?: string;
    companyId?: string;
}
export declare class CommitIngestionRowDto {
    rowIndex: number;
    overrides?: Record<string, unknown>;
    bankAccountId?: string;
    targetType?: string;
}
export declare class RunReconciliationDto {
    bankAccountId?: string;
    applyAutoReconcile?: boolean;
    dateWindowDays?: number;
}
export declare class LinkScannedBillDto {
    linkedExpenseId?: string;
    linkedInvoiceId?: string;
    linkedBillId?: string;
}
export declare class GenerateStatementDto {
    type: string;
    period: string;
    companyId?: string;
    startDate?: string;
    endDate?: string;
}
export declare class UpdateKycStatusDto {
    kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
    kycDocumentRef?: string;
    amlRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}
export declare class CreateRecurringTransactionDto {
    description: string;
    amount: number;
    interval: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    nextDate: string;
    reference?: string;
}
export declare class BulkBankImportDto {
    rows: Record<string, string>[];
    companyId?: string;
    bankAccountId?: string;
}
//# sourceMappingURL=inventory.dto.d.ts.map