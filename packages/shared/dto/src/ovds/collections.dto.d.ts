import { CollectionStage, DeductionReason, DeductionStatus } from '@ovds/shared/types';
export { CollectionStage, DeductionReason, DeductionStatus };
export declare class CreateCollectionCaseDto {
    invoiceId: string;
    assignedTo?: string;
    notes?: string;
}
export declare class UpdateCollectionCaseDto {
    stage?: CollectionStage;
    assignedTo?: string;
    contactDate?: string;
    promiseDate?: string;
    partialPaid?: number;
    notes?: string;
}
export declare class CreateDeductionDto {
    invoiceId: string;
    reason: DeductionReason;
    amount: number;
    notes?: string;
}
export declare class UpdateDeductionDto {
    status?: DeductionStatus;
    resolvedAt?: string;
    resolution?: string;
    notes?: string;
}
//# sourceMappingURL=collections.dto.d.ts.map