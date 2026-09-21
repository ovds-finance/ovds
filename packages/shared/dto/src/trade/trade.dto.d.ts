import { TradeDirection } from '@ovds/shared/types';
export declare class CreateShipmentDto {
    direction: TradeDirection;
    referenceNo?: string;
    hsCode?: string;
    hsDescription?: string;
    goodsDescription?: string;
    originCountry?: string;
    destinationCountry?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    incoterms?: string;
    invoiceValue?: number;
    currencyCode?: string;
    notes?: string;
}
export declare class UpdateShipmentStepDto {
    status: string;
    notes?: string;
    metadata?: string;
}
export declare class CreateForexApprovalDto {
    bankName: string;
    applicationDate?: string;
    foreignCurrency?: string;
    foreignAmount?: number;
    exchangeRate?: number;
    notes?: string;
}
export declare class CreateProformaDto {
    supplierName: string;
    buyerName: string;
    issueDate: string;
    validUntil?: string;
    totalValue?: number;
    currencyCode?: string;
    incoterms?: string;
    paymentTerms?: string;
    lineItemsJson?: string;
    shipmentId?: string;
    notes?: string;
}
//# sourceMappingURL=trade.dto.d.ts.map