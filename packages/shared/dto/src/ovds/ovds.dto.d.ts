export declare class CreateItemDto {
    name: string;
    code?: string;
    category?: string;
    description?: string;
    sku?: string;
    unit?: string;
    salePrice?: number;
    costPrice?: number;
    vatRate?: number;
    stock?: number;
    /** Frontend alias for stock */
    stockQuantity?: number;
    reorderLevel?: number;
    trackInventory?: boolean;
    /** Frontend alias for vatRate — true = 15%, false = 0% */
    vatApplicable?: boolean;
    companyId?: string;
    itemType?: string;
    /** Frontend sends type instead of itemType */
    type?: string;
    groupId?: string;
    warehouseId?: string;
    barcode?: string;
    imageUrl?: string;
    isActive?: boolean;
    /** Frontend alias for salePrice */
    price?: number;
    /** Frontend alias for costPrice */
    purchasePrice?: number;
    customFields?: Record<string, string | null>;
}
export declare class UpdateItemDto {
    name?: string;
    code?: string;
    category?: string;
    sku?: string;
    unit?: string;
    salePrice?: number;
    costPrice?: number;
    vatRate?: number;
    stock?: number;
    reorderLevel?: number;
    trackInventory?: boolean;
    itemType?: string;
    groupId?: string;
    warehouseId?: string;
    barcode?: string;
    imageUrl?: string;
    description?: string;
    isActive?: boolean;
    customFields?: Record<string, string | null>;
}
export declare class InvoiceLineItemDto {
    id?: string;
    itemId?: string;
    quantity: number;
    salePrice?: number;
    price?: number;
    discount?: number;
    discountValue?: number;
    discountType?: string;
    taxRate?: number;
    exciseCategory?: string;
    description?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
export declare class CreateInvoiceDto {
    id?: string;
    invoiceNumber?: string;
    /** Invoice status — DRAFT by default */
    status?: string;
    /** Invoice date */
    date?: string;
    /** Payment due date */
    dueDate?: string;
    /** Payment terms e.g. NET30 */
    paymentTerms?: string;
    /** Computed grand total sent from frontend */
    totalAmount?: number;
    /** VAT amount computed on the frontend */
    vatAmount?: number;
    /** Invoice-level discount amount */
    discountAmount?: number;
    /** Customer display name — either customer or customerName must be provided */
    customer?: string;
    /** Alias for customer — some callers send customerName directly */
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerTin?: string;
    subtotal?: number;
    /** DRRF 1% of subtotal */
    drrfAmount?: number;
    vatRate?: number;
    isVatRegistered?: boolean;
    totAmount?: number;
    totRate?: number;
    exciseAmount?: number;
    exciseRate?: number;
    exciseCategory?: string;
    importSurtaxAmount?: number;
    importBase?: number;
    customsDutyAmount?: number;
    exciseDutyAmount?: number;
    whtAmount?: number;
    whtRate?: number;
    whtType?: string;
    applyWht?: boolean;
    stampDutyAmount?: number;
    stampDutyRequired?: boolean;
    matAmount?: number;
    matApplied?: boolean;
    invoiceDiscount?: number;
    lateInterestRate?: number;
    qrData?: string;
    customerNotes?: string;
    paymentSource?: string;
    telecomReceiptRef?: string;
    telecomAmount?: number;
    telecomPaidAt?: string;
    telecomRawData?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankQrRawData?: string;
    notes?: string;
    receiptImageData?: string;
    bankSlipImageData?: string;
    /** Line items — optional for minimal draft creation (e.g. from capture modal) */
    items?: InvoiceLineItemDto[];
    category?: string;
    footer?: string;
    discountLocation?: string;
    discountType?: string;
    discountValue?: number;
    recurringInterval?: string;
    isRecurring?: boolean;
    recurringNextDate?: string;
    invoiceCurrency?: string;
    currencyCode?: string;
    currencyRate?: number;
    orderNumber?: string;
    warehouseId?: string;
    companyTitle?: string;
    companyId?: string;
    customerId?: string;
    ifrsPerformanceObligation?: string;
    ifrsRecognitionTiming?: string;
    ifrsContractRef?: string;
    ifrsVariableConsideration?: string;
    ifrsReceivableClass?: string;
    ifrsCreditRisk?: string;
    ifrsEclProvision?: number;
    ifrsMeasurementCategory?: string;
    ifrsHasWarranty?: boolean;
    ifrsWarrantyProvision?: number;
    ifrsContingency?: string;
    interactionType?: string;
    archType?: string;
    processType?: string;
    bankAccountName?: string;
    ccEmails?: string[];
    bccEmails?: string[];
    taxes?: any[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
export declare class CreateEstimateDto {
    id?: string;
    estimateNumber?: string;
    invoiceNumber?: string;
    customer?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerTin?: string;
    status?: string;
    date?: string;
    estimateDate?: string;
    dueDate?: string;
    expiryDate?: string;
    paymentTerms?: string;
    totalAmount?: number;
    total?: number;
    vatAmount?: number;
    taxAmount?: number;
    subtotal?: number;
    invoiceDiscount?: number;
    currencyCode?: string;
    currencyRate?: number;
    notes?: string;
    customerNotes?: string;
    items?: InvoiceLineItemDto[];
    companyId?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
export declare class UpdateEstimateDto extends CreateEstimateDto {
}
export declare class UpdateInvoiceDto {
    customer?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerTin?: string;
    status?: string;
    totalAmount?: number;
    vatAmount?: number;
    subtotal?: number;
    drrfAmount?: number;
    vatRate?: number;
    isVatRegistered?: boolean;
    totAmount?: number;
    totRate?: number;
    exciseAmount?: number;
    exciseRate?: number;
    exciseCategory?: string;
    importSurtaxAmount?: number;
    importBase?: number;
    customsDutyAmount?: number;
    exciseDutyAmount?: number;
    whtAmount?: number;
    whtRate?: number;
    whtType?: string;
    applyWht?: boolean;
    stampDutyAmount?: number;
    stampDutyRequired?: boolean;
    matAmount?: number;
    matApplied?: boolean;
    invoiceDiscount?: number;
    lateInterestRate?: number;
    paymentSource?: string;
    telecomReceiptRef?: string;
    telecomAmount?: number;
    telecomPaidAt?: string;
    telecomRawData?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankQrRawData?: string;
    notes?: string;
    customerNotes?: string;
    receiptImageData?: string;
    bankSlipImageData?: string;
    dueDate?: string;
    scheduledSendAt?: string;
    paymentTerms?: string;
    category?: string;
    footer?: string;
    discountLocation?: string;
    discountType?: string;
    discountValue?: number;
    recurringInterval?: string;
    isRecurring?: boolean;
    invoiceCurrency?: string;
    currencyCode?: string;
    currencyRate?: number;
    orderNumber?: string;
    customerId?: string;
    ifrsPerformanceObligation?: string;
    ifrsContractRef?: string;
    ifrsReceivableClass?: string;
    ifrsCreditRisk?: string;
    ifrsEclProvision?: number;
    interactionType?: string;
    archType?: string;
    processType?: string;
    bankAccountName?: string;
    ccEmails?: string[];
    bccEmails?: string[];
    taxes?: any[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
export declare class BillLineItemDto {
    itemId: string;
    quantity: number;
    purchasePrice: number;
    vatRate?: number;
    description?: string;
}
export declare class CreateBillDto {
    billNumber: string;
    vendor: string;
    category: string;
    status?: string;
    /** Bill date (ISO string) */
    date?: string;
    dueDate?: string;
    amount: number;
    vatRate?: number;
    vatAmount?: number;
    total?: number;
    notes?: string;
    /** Frontend alias for notes */
    description?: string;
    /** Display color (hex) for branding — Ovds "Changing the Color of a Bill" */
    color?: string;
    companyId?: string;
    vendorId?: string;
    currencyCode?: string;
    currencyRate?: number;
    /** Vendor TIN — required for WHT certificate generation (ERCA compliance) */
    vendorTin?: string;
    /** Whether 3% WHT applies to this bill (Proclamation No. 1395/2025: services ≥ ETB 10k, goods ≥ ETB 20k) */
    whtApplicable?: boolean;
    isRecurring?: boolean;
    recurringInterval?: string;
    recurringNextDate?: string;
    warehouseId?: string;
    /** Line items — for granular inventory tracking (IN) */
    items?: BillLineItemDto[];
}
export declare class UpdateBillDto {
    billNumber?: string;
    vendor?: string;
    category?: string;
    status?: string;
    date?: string;
    dueDate?: string;
    amount?: number;
    vatRate?: number;
    vatAmount?: number;
    total?: number;
    notes?: string;
    /** Frontend alias for notes */
    description?: string;
    /** Display color (hex) for branding — Ovds "Changing the Color of a Bill" */
    color?: string;
    vendorTin?: string;
    vendorId?: string;
    companyId?: string;
    currencyCode?: string;
    currencyRate?: number;
    whtApplicable?: boolean;
    isRecurring?: boolean;
    recurringInterval?: string;
    recurringNextDate?: string;
    warehouseId?: string;
    items?: BillLineItemDto[];
}
export declare class CreateBillPaymentDto {
    amount: number;
    method?: string;
    reference?: string;
    notes?: string;
    paidAt?: string;
    bankAccountId?: string;
}
export declare class CreateInvoicePaymentDto {
    amount: number;
    method?: string;
    reference?: string;
    notes?: string;
    paidAt?: string;
}
export declare class UniversalLineItemDto {
    itemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate?: number;
    discount?: number;
    discountType?: string;
    discountValue?: number;
}
export declare class CreateUniversalInvoiceDto {
    invoiceNumber?: string;
    billNumber?: string;
    docType?: string;
    customerName?: string;
    vendor?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerTin?: string;
    vendorTin?: string;
    status?: string;
    date?: string;
    dueDate?: string;
    subtotal?: number;
    vatAmount?: number;
    totalAmount?: number;
    drrfAmount?: number;
    vatRate?: number;
    notes?: string;
    category?: string;
    companyId?: string;
    deliveryMode?: string;
    generateShareLink?: boolean;
    downloadablePdf?: boolean;
    sendEmail?: boolean;
    paymentSource?: string;
    paymentMethod?: string;
    template?: string;
    brandLogo?: string;
    brandColor?: string;
    paymentInstructions?: any;
    items: UniversalLineItemDto[];
}
export declare class InvoiceQueryDto {
    page?: number;
    limit?: number;
    /** Alias for limit — some callers use ?take= */
    take?: number;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentSource?: string;
    companyId?: string;
    /** Filter by customer TIN — for B2B VAT invoice lookup */
    customerTin?: string;
    /** Filter by customer ID — used by CustomerSummary page */
    customer?: string;
    /** Filter by customer email */
    customerEmail?: string;
    /** Only return overdue invoices */
    overdueOnly?: boolean | string;
}
export declare class CreateCustomerDto {
    name: string;
    email?: string;
    phone?: string;
    /** Alias accepted by some callers */
    rhone?: string;
    address?: string;
    tin?: string;
    paymentTerms?: string;
    notes?: string;
    companyId?: string;
    businessType?: string;
    creditLimit?: number;
    riskLevel?: string;
    vatNumber?: string;
    currencyCode?: string;
    customFields?: Record<string, string | null>;
}
export declare class UpdateCustomerDto {
    name?: string;
    email?: string;
    phone?: string;
    rhone?: string;
    address?: string;
    tin?: string;
    paymentTerms?: string;
    notes?: string;
    companyId?: string;
    businessType?: string;
    creditLimit?: number;
    riskLevel?: string;
    vatNumber?: string;
    currencyCode?: string;
    customFields?: Record<string, string | null>;
}
//# sourceMappingURL=ovds.dto.d.ts.map