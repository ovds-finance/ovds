export declare class CreatePartnershipDto {
    name: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    agreementRef?: string;
    tinNumber?: string;
    licenseNumber?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    notes?: string;
    kycStatus?: string;
    kycVerifiedAt?: string;
    kycDocumentRef?: string;
    amlRiskLevel?: string;
    beneficialOwnerName?: string;
    beneficialOwnerTin?: string;
}
export declare class UpdatePartnershipDto {
    name?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    agreementRef?: string;
    tinNumber?: string;
    licenseNumber?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    notes?: string;
    kycStatus?: string;
    kycVerifiedAt?: string;
    kycDocumentRef?: string;
    amlRiskLevel?: string;
    beneficialOwnerName?: string;
    beneficialOwnerTin?: string;
}
export declare class CreatePartnershipMemberDto {
    name: string;
    role: string;
    ownershipPct?: number;
    contributionAmt?: number;
    joinedAt?: string;
    notes?: string;
    nationalId?: string;
    tin?: string;
    phone?: string;
    email?: string;
    kycStatus?: string;
    isBeneficialOwner?: boolean;
}
export declare class LinkPartnershipCustomerDto {
    customerId: string;
    relationshipType?: string;
    since?: string;
    notes?: string;
}
export declare class CreateBusinessLoanDto {
    loanNumber: string;
    bankName: string;
    loanType?: string;
    status?: string;
    appliedAmount: number;
    approvedAmount?: number;
    disbursedAmount?: number;
    interestRate?: number;
    applicationDate?: string;
    approvalDate?: string;
    disbursementDate?: string;
    maturityDate?: string;
    purpose?: string;
    collateral?: string;
    partnershipId?: string;
    customerId?: string;
    organizationStructureScore?: number;
    customerRelationshipScore?: number;
    financialTransparencyScore?: number;
    monthlyInstallment?: number;
    nextPaymentDate?: string;
    notes?: string;
}
export declare class UpdateBusinessLoanDto {
    bankName?: string;
    loanType?: string;
    status?: string;
    approvedAmount?: number;
    disbursedAmount?: number;
    outstandingBalance?: number;
    interestRate?: number;
    approvalDate?: string;
    disbursementDate?: string;
    maturityDate?: string;
    purpose?: string;
    collateral?: string;
    partnershipId?: string;
    customerId?: string;
    organizationStructureScore?: number;
    customerRelationshipScore?: number;
    financialTransparencyScore?: number;
    monthlyInstallment?: number;
    nextPaymentDate?: string;
    notes?: string;
}
export declare class RecordLoanRepaymentDto {
    amount: number;
    method?: string;
    reference?: string;
    paidAt?: string;
    notes?: string;
}
export declare class CreateInvestmentDto {
    title: string;
    investorName: string;
    investorType?: string;
    type?: string;
    status?: string;
    amount: number;
    equityPct?: number;
    expectedReturn?: number;
    commitmentDate?: string;
    startDate?: string;
    exitDate?: string;
    partnershipId?: string;
    customerId?: string;
    investmentPurpose?: string;
    dueDiligenceNotes?: string;
    regulatoryApproval?: boolean;
    notes?: string;
}
export declare class UpdateInvestmentDto {
    title?: string;
    investorName?: string;
    investorType?: string;
    type?: string;
    status?: string;
    amount?: number;
    equityPct?: number;
    expectedReturn?: number;
    commitmentDate?: string;
    startDate?: string;
    exitDate?: string;
    partnershipId?: string;
    customerId?: string;
    investmentPurpose?: string;
    dueDiligenceNotes?: string;
    regulatoryApproval?: boolean;
    notes?: string;
}
export declare class CreateCustomerInteractionDto {
    type: string;
    summary: string;
    outcome?: string;
    performedBy?: string;
    interactedAt?: string;
}
export declare class TransitionLoanStatusDto {
    status: string;
    notes?: string;
    approvedAmount?: number;
    approvalDate?: string;
    disbursementDate?: string;
}
export declare class UpsertDueDiligenceDto {
    investmentId: string;
    items: {
        key: string;
        label: string;
        completed: boolean;
        notes?: string;
    }[];
}
//# sourceMappingURL=partnership.dto.d.ts.map