export declare enum AccountCategory {
    CASH = "CASH",
    BANK = "BANK",
    ACCOUNTS_RECEIVABLE = "ACCOUNTS_RECEIVABLE",
    ACCOUNTS_PAYABLE = "ACCOUNTS_PAYABLE",
    INVENTORY = "INVENTORY",
    FIXED_ASSET = "FIXED_ASSET",
    CURRENT_ASSET = "CURRENT_ASSET",
    CURRENT_LIABILITY = "CURRENT_LIABILITY",
    LONG_TERM_LIABILITY = "LONG_TERM_LIABILITY",
    EQUITY = "EQUITY",
    REVENUE = "REVENUE",
    OTHER_INCOME = "OTHER_INCOME",
    OPERATING_EXPENSE = "OPERATING_EXPENSE",
    COST_OF_GOODS_SOLD = "COST_OF_GOODS_SOLD",
    OTHER_EXPENSE = "OTHER_EXPENSE"
}
export declare enum AccountType {
    ASSET = "ASSET",
    LIABILITY = "LIABILITY",
    EQUITY = "EQUITY",
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}
export declare enum BatchStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    EXPORTED = "EXPORTED",
    PAID = "PAID",
    CANCELLED = "CANCELLED"
}
export declare enum CollectionStage {
    NEW = "NEW",
    ASSIGNED = "ASSIGNED",
    CONTACTED = "CONTACTED",
    PROMISE_TO_PAY = "PROMISE_TO_PAY",
    PARTIAL_PAYMENT = "PARTIAL_PAYMENT",
    LEGAL = "LEGAL",
    WRITTEN_OFF = "WRITTEN_OFF",
    CLOSED = "CLOSED"
}
export declare enum DeductionReason {
    DISCOUNT = "DISCOUNT",
    RETURN = "RETURN",
    DISPUTE = "DISPUTE",
    DAMAGE = "DAMAGE",
    SHORT_PAYMENT = "SHORT_PAYMENT",
    OTHER = "OTHER"
}
export declare enum DeductionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    RESOLVED = "RESOLVED"
}
export declare enum JournalLineTaxType {
    VAT_EXCISE = "VAT_EXCISE",
    STAMP_DUTY = "STAMP_DUTY",
    PAYROLL_WITHHOLD = "PAYROLL_WITHHOLD",
    CUSTOMS_DUTY = "CUSTOMS_DUTY",
    EXCISE_ON_IMPORT = "EXCISE_ON_IMPORT"
}
export declare enum ItemStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    DISCONTINUED = "DISCONTINUED"
}
export declare enum LoanStatus {
    APPLIED = "APPLIED",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    DISBURSED = "DISBURSED",
    ACTIVE = "ACTIVE",
    CLOSED = "CLOSED",
    REJECTED = "REJECTED"
}
export declare enum LoanType {
    TERM_LOAN = "TERM_LOAN",
    OVERDRAFT = "OVERDRAFT",
    WORKING_CAPITAL = "WORKING_CAPITAL",
    EQUIPMENT_FINANCING = "EQUIPMENT_FINANCING",
    MORTGAGE = "MORTGAGE",
    OTHER = "OTHER"
}
export declare enum PaymentType {
    VENDOR = "VENDOR",
    CUSTOMER = "CUSTOMER",
    ACCOUNTS_PAYABLE = "ACCOUNTS_PAYABLE",
    ACCOUNTS_RECEIVABLE = "ACCOUNTS_RECEIVABLE"
}
export type ItemType = 'PRODUCT' | 'SERVICE' | 'DIGITAL' | 'BUNDLE';
export type ItemUnit = 'UNIT' | 'KG' | 'LITRE' | 'METRE' | 'BOX' | 'HOUR';
export interface Item {
    id: string;
    name: string;
    code: string;
    category?: string | null;
    description?: string | null;
    salePrice: number;
    costPrice: number;
    vatRate?: number;
    stock: number;
    reorderLevel?: number;
    itemType: ItemType;
    unit: ItemUnit | string;
    barcode?: string | null;
    imageUrl?: string | null;
    isActive: boolean;
    companyId: string | null;
    groupId?: string | null;
    warehouseId?: string | null;
    minOrderQty?: number;
    maxOrderQty?: number | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    /**
     * GL Account Inheritance (Ovds pattern):
     * When an item is created, it inherits specific GL account codes from the
     * Chart of Accounts. These override the default category-based lookups
     * in autoPostInvoiceCreation and autoPostCogsEntry.
     *
     * Referential Integrity Rule: these are soft-links (accountCode strings, not FKs)
     * so deleting an account does not cascade-delete items — instead the system
     * falls back to category-based account resolution.
     */
    /** Revenue account code (default: '4010' Sales Revenue) */
    revenueAccountCode?: string | null;
    /** COGS account code (default: '5010' Cost of Goods Sold) */
    cogsAccountCode?: string | null;
    /** Inventory asset account code (default: '1200' Inventory) */
    inventoryAccountCode?: string | null;
}
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL' | 'VOID' | 'SENT' | 'POSTED' | 'ARCHIVED';
export type InvoiceSource = 'MANUAL' | 'TELECOM' | 'BANK_QR';
export type RecurringInterval = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export interface InvoiceItem {
    id: string;
    /** DB column is `salePrice`; `price` is kept as an alias for frontend compatibility */
    itemId: string | null;
    quantity: number;
    /** Alias for salePrice — used by frontend form state */
    price: number;
    /** Canonical DB field name */
    salePrice?: number;
    discount: number;
    discountType?: string;
    discountValue?: number;
    description: string | null;
    item?: {
        id: string;
        name: string;
        unit: string;
    };
}
export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string | null;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    customerAddress?: string | null;
    customerTin?: string | null;
    status: InvoiceStatus;
    source?: InvoiceSource;
    date: Date | string;
    dueDate: Date | string | null;
    sentAt?: Date | string | null;
    paidAt?: Date | string | null;
    subtotal?: number;
    discountAmount?: number;
    vatAmount?: number;
    totalAmount: number;
    notes?: string | null;
    companyId: string | null;
    isRecurring?: boolean;
    recurringInterval?: RecurringInterval | null;
    recurringNextDate?: Date | string | null;
    items?: InvoiceItem[];
    ifrs15Step1Complete?: boolean;
    ifrs15Step2Complete?: boolean;
    ifrs15Step3Complete?: boolean;
    ifrs15Step4Complete?: boolean;
    ifrs15Step5Complete?: boolean;
}
export type BillStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';
export type BillCategory = 'UTILITIES' | 'RENT' | 'SUPPLIES' | 'MAINTENANCE' | 'TRANSPORT' | 'OTHER' | string;
export interface Bill {
    id: string;
    billNumber: string;
    vendorId: string | null;
    vendorName?: string;
    vendor?: string;
    category: BillCategory;
    amount: number;
    vatAmount?: number;
    vatRate?: number;
    total: number;
    status: BillStatus;
    /** Frontend/DTO alias — maps to `createdAt` in the database */
    date?: Date | string | null;
    dueDate: Date | string;
    notes?: string | null;
    description?: string | null;
    companyId: string | null;
    vendorTin?: string | null;
    whtApplicable?: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    currencyCode?: string;
}
export interface JournalEntry {
    id: string;
    date: Date;
    reference?: string;
    description: string;
    status: 'DRAFT' | 'POSTED' | 'CANCELLED';
    companyId: string;
    lines: JournalLine[];
}
export interface JournalLine {
    id: string;
    journalEntryId: string;
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
    taxTypeId?: string;
}
/**
 * TaxRateConfig — a configured tax rate record from the taxrate table.
 * Distinct from the TaxType DTO enum in ovds/tax.dto.ts.
 */
export interface TaxRateConfig {
    id: string;
    name: string;
    rate: number;
    type: 'VAT' | 'INCOME_TAX' | 'WITHHOLDING' | 'DRRF' | 'EXCISE' | 'STAMP_DUTY' | 'BIT' | 'TOT' | 'PENSION' | 'SALES_TAX' | 'CUSTOM';
    description?: string | null;
    isActive: boolean;
    appliesTo?: string | null;
    isCompound?: boolean;
    currencyCode?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
/** @deprecated Use TaxRateConfig — this alias will be removed in a future release. */
export type TaxType = TaxRateConfig;
export interface IFRSCompliance {
    standard: string;
    isCompliant: boolean;
    lastAuditDate?: Date;
}
//# sourceMappingURL=accounting.d.ts.map