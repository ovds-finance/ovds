import { PaymentType, BatchStatus } from '@ovds/shared/types';
export { PaymentType, BatchStatus };
export declare class CreateCashForecastDto {
    period: string;
    projected: number;
    low?: number;
    high?: number;
    confidence?: number;
    notes?: string;
}
export declare class CreatePaymentBatchDto {
    name?: string;
    type: PaymentType;
    paymentDate?: string;
    notes?: string;
    items: Array<{
        invoiceId?: string;
        billId?: string;
        amount: number;
        reference?: string;
        notes?: string;
    }>;
}
export declare class UpdatePaymentBatchDto {
    status?: BatchStatus;
    paymentDate?: string;
    exportedAt?: string;
    exportFormat?: string;
}
//# sourceMappingURL=treasury.dto.d.ts.map