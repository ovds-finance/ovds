import { LoyaltyTransactionType } from '@ovds/shared/types';
export declare class CreateLoyaltyTransactionDto {
    customerId: string;
    points: number;
    reason: string;
    referenceId?: string;
    type?: LoyaltyTransactionType;
    companyId?: string;
}
//# sourceMappingURL=loyalty.dto.d.ts.map