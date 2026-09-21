var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNumber, IsIn, Min, Max, MaxLength, IsEmail, IsBoolean, IsInt, } from 'class-validator';
import { Type } from 'class-transformer';
// -- Partnership ---------------------------------------------------------------
export class CreatePartnershipDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'JOINT_VENTURE',
        'CONSORTIUM',
        'STRATEGIC_ALLIANCE',
        'SUPPLIER',
        'DISTRIBUTOR',
        'INVESTOR',
        'OTHER',
    ]),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['ACTIVE', 'INACTIVE', 'DISSOLVED', 'PENDING']),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "agreementRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "tinNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "licenseNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "contactName", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "contactEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "contactPhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "kycStatus", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "kycVerifiedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "kycDocumentRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['LOW', 'MEDIUM', 'HIGH']),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "amlRiskLevel", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "beneficialOwnerName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreatePartnershipDto.prototype, "beneficialOwnerTin", void 0);
export class UpdatePartnershipDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "agreementRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "tinNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "licenseNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "contactName", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "contactEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "contactPhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "kycStatus", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "kycVerifiedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "kycDocumentRef", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['LOW', 'MEDIUM', 'HIGH']),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "amlRiskLevel", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "beneficialOwnerName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdatePartnershipDto.prototype, "beneficialOwnerTin", void 0);
export class CreatePartnershipMemberDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "name", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "role", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreatePartnershipMemberDto.prototype, "ownershipPct", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreatePartnershipMemberDto.prototype, "contributionAmt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "joinedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "nationalId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "tin", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['PENDING', 'VERIFIED', 'REJECTED']),
    __metadata("design:type", String)
], CreatePartnershipMemberDto.prototype, "kycStatus", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreatePartnershipMemberDto.prototype, "isBeneficialOwner", void 0);
export class LinkPartnershipCustomerDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], LinkPartnershipCustomerDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['SERVED', 'REFERRED', 'JOINT']),
    __metadata("design:type", String)
], LinkPartnershipCustomerDto.prototype, "relationshipType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LinkPartnershipCustomerDto.prototype, "since", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LinkPartnershipCustomerDto.prototype, "notes", void 0);
// -- Business Loan -------------------------------------------------------------
export class CreateBusinessLoanDto {
}
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "loanNumber", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'TERM_LOAN',
        'WORKING_CAPITAL',
        'OVERDRAFT',
        'LETTER_OF_CREDIT',
        'TRADE_ovds',
        'MORTGAGE',
        'OTHER',
    ]),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "loanType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'APPLIED',
        'UNDER_REVIEW',
        'APPROVED',
        'DISBURSED',
        'ACTIVE',
        'CLOSED',
        'REJECTED',
    ]),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "status", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBusinessLoanDto.prototype, "appliedAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBusinessLoanDto.prototype, "approvedAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBusinessLoanDto.prototype, "disbursedAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBusinessLoanDto.prototype, "interestRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "applicationDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "approvalDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "disbursementDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "maturityDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "purpose", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "collateral", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "partnershipId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateBusinessLoanDto.prototype, "organizationStructureScore", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateBusinessLoanDto.prototype, "customerRelationshipScore", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateBusinessLoanDto.prototype, "financialTransparencyScore", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateBusinessLoanDto.prototype, "monthlyInstallment", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "nextPaymentDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBusinessLoanDto.prototype, "notes", void 0);
export class UpdateBusinessLoanDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "loanType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBusinessLoanDto.prototype, "approvedAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBusinessLoanDto.prototype, "disbursedAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBusinessLoanDto.prototype, "outstandingBalance", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBusinessLoanDto.prototype, "interestRate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "approvalDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "disbursementDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "maturityDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "purpose", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "collateral", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "partnershipId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateBusinessLoanDto.prototype, "organizationStructureScore", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateBusinessLoanDto.prototype, "customerRelationshipScore", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateBusinessLoanDto.prototype, "financialTransparencyScore", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateBusinessLoanDto.prototype, "monthlyInstallment", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "nextPaymentDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateBusinessLoanDto.prototype, "notes", void 0);
export class RecordLoanRepaymentDto {
}
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0.01),
    __metadata("design:type", Number)
], RecordLoanRepaymentDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['BANK_TRANSFER', 'CASH', 'CHEQUE']),
    __metadata("design:type", String)
], RecordLoanRepaymentDto.prototype, "method", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], RecordLoanRepaymentDto.prototype, "reference", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RecordLoanRepaymentDto.prototype, "paidAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], RecordLoanRepaymentDto.prototype, "notes", void 0);
// -- Investment ----------------------------------------------------------------
export class CreateInvestmentDto {
}
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "title", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "investorName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'PRIVATE',
        'INSTITUTIONAL',
        'GOVERNMENT',
        'FOREIGN',
    ]),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "investorType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'EQUITY',
        'DEBT',
        'GRANT',
        'VENTURE_CAPITAL',
        'ANGEL',
        'GOVERNMENT',
        'OTHER',
    ]),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([
        'PROSPECTING',
        'NEGOTIATING',
        'COMMITTED',
        'ACTIVE',
        'EXITED',
        'CANCELLED',
    ]),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "status", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "equityPct", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "expectedReturn", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "commitmentDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "exitDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "partnershipId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "investmentPurpose", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "dueDiligenceNotes", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateInvestmentDto.prototype, "regulatoryApproval", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "notes", void 0);
export class UpdateInvestmentDto {
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "investorName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "investorType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvestmentDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], UpdateInvestmentDto.prototype, "equityPct", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInvestmentDto.prototype, "expectedReturn", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "commitmentDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "exitDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "partnershipId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "investmentPurpose", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "dueDiligenceNotes", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateInvestmentDto.prototype, "regulatoryApproval", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "notes", void 0);
// -- Customer Interaction ------------------------------------------------------
export class CreateCustomerInteractionDto {
}
__decorate([
    IsString(),
    IsIn([
        'CALL',
        'MEETING',
        'EMAIL',
        'PAYMENT',
        'COMPLAINT',
        'OTHER',
    ]),
    __metadata("design:type", String)
], CreateCustomerInteractionDto.prototype, "type", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateCustomerInteractionDto.prototype, "summary", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateCustomerInteractionDto.prototype, "outcome", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateCustomerInteractionDto.prototype, "performedBy", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCustomerInteractionDto.prototype, "interactedAt", void 0);
// -- Loan Status Transition ----------------------------------------------------
export class TransitionLoanStatusDto {
}
__decorate([
    IsString(),
    IsIn([
        'APPLIED',
        'UNDER_REVIEW',
        'APPROVED',
        'DISBURSED',
        'ACTIVE',
        'CLOSED',
        'REJECTED',
    ]),
    __metadata("design:type", String)
], TransitionLoanStatusDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TransitionLoanStatusDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], TransitionLoanStatusDto.prototype, "approvedAmount", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TransitionLoanStatusDto.prototype, "approvalDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TransitionLoanStatusDto.prototype, "disbursementDate", void 0);
// -- Due Diligence Checklist ---------------------------------------------------
export class UpsertDueDiligenceDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], UpsertDueDiligenceDto.prototype, "investmentId", void 0);
