export declare class TransactionItemDto {
    invoiceNumber: string;
    itemTotalCents: number;
}
export declare class DeclareVatDto {
    taxpayerTin: string;
    declarationPeriod: string;
    salesItems: TransactionItemDto[];
    purchaseItems: TransactionItemDto[];
}
//# sourceMappingURL=vat.dto.d.ts.map