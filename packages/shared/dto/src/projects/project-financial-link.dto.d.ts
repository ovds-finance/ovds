export declare enum FinancialLinkType {
    INVOICE = "INVOICE",
    INCOME = "INCOME",
    VENDOR_BILL = "VENDOR_BILL",
    PAYMENT = "PAYMENT",
    CREDIT_NOTE = "CREDIT_NOTE"
}
export declare enum TransactionDirection {
    IN = "IN",
    OUT = "OUT"
}
export declare class CreateProjectFinancialLinkDto {
    projectId: string;
    taskId?: string;
    linkType: FinancialLinkType;
    linkId: string;
    linkNumber?: string;
    amount: number;
    currencyCode?: string;
    direction?: TransactionDirection;
    linkDate?: string;
    notes?: string;
    companyId?: string;
}
export declare class UpdateProjectFinancialLinkDto {
    linkType?: FinancialLinkType;
    linkNumber?: string;
    amount?: number;
    currencyCode?: string;
    direction?: TransactionDirection;
    linkDate?: string;
    notes?: string;
}
//# sourceMappingURL=project-financial-link.dto.d.ts.map