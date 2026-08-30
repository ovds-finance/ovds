import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  Max,
  MaxLength,
  IsEmail,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

// -- Partnership ---------------------------------------------------------------

export class CreatePartnershipDto {
  @IsString() @MaxLength(200) name!: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'JOINT_VENTURE',
    'CONSORTIUM',
    'STRATEGIC_ALLIANCE',
    'SUPPLIER',
    'DISTRIBUTOR',
    'INVESTOR',
    'OTHER',
  ])
  type?: string;
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'DISSOLVED', 'PENDING'])
  status?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(200) agreementRef?: string;
  @IsOptional() @IsString() @MaxLength(50) tinNumber?: string;
  @IsOptional() @IsString() @MaxLength(100) licenseNumber?: string;
  @IsOptional() @IsString() @MaxLength(200) contactName?: string;
  @IsOptional() @IsEmail() @MaxLength(200) contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(50) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() notes?: string;
  // KYC / AML fields
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'])
  kycStatus?: string;
  @IsOptional() @IsString() kycVerifiedAt?: string;
  @IsOptional() @IsString() @MaxLength(200) kycDocumentRef?: string;
  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  amlRiskLevel?: string;
  @IsOptional() @IsString() @MaxLength(200) beneficialOwnerName?: string;
  @IsOptional() @IsString() @MaxLength(50) beneficialOwnerTin?: string;
}

export class UpdatePartnershipDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(200) agreementRef?: string;
  @IsOptional() @IsString() @MaxLength(50) tinNumber?: string;
  @IsOptional() @IsString() @MaxLength(100) licenseNumber?: string;
  @IsOptional() @IsString() @MaxLength(200) contactName?: string;
  @IsOptional() @IsEmail() @MaxLength(200) contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(50) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() notes?: string;
  // KYC / AML fields
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'])
  kycStatus?: string;
  @IsOptional() @IsString() kycVerifiedAt?: string;
  @IsOptional() @IsString() @MaxLength(200) kycDocumentRef?: string;
  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  amlRiskLevel?: string;
  @IsOptional() @IsString() @MaxLength(200) beneficialOwnerName?: string;
  @IsOptional() @IsString() @MaxLength(50) beneficialOwnerTin?: string;
}

export class CreatePartnershipMemberDto {
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MaxLength(100) role!: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipPct?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  contributionAmt?: number;
  @IsOptional() @IsString() joinedAt?: string;
  @IsOptional() @IsString() notes?: string;
  // KYC fields — required for beneficial owners (ownershipPct >= 25%)
  @IsOptional() @IsString() @MaxLength(50) nationalId?: string;
  @IsOptional() @IsString() @MaxLength(50) tin?: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(200) email?: string;
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED'])
  kycStatus?: string;
  @IsOptional() @IsBoolean() isBeneficialOwner?: boolean;
}

export class LinkPartnershipCustomerDto {
  @IsString() customerId!: string;
  @IsOptional()
  @IsString()
  @IsIn(['SERVED', 'REFERRED', 'JOINT'])
  relationshipType?: string;
  @IsOptional() @IsString() since?: string;
  @IsOptional() @IsString() notes?: string;
}

// -- Business Loan -------------------------------------------------------------

export class CreateBusinessLoanDto {
  @IsString() @MaxLength(100) loanNumber!: string;
  @IsString() @MaxLength(200) bankName!: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'TERM_LOAN',
    'WORKING_CAPITAL',
    'OVERDRAFT',
    'LETTER_OF_CREDIT',
    'TRADE_ovds',
    'MORTGAGE',
    'OTHER',
  ])
  loanType?: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'APPLIED',
    'UNDER_REVIEW',
    'APPROVED',
    'DISBURSED',
    'ACTIVE',
    'CLOSED',
    'REJECTED',
  ])
  status?: string;
  @Type(() => Number) @IsNumber() @Min(0) appliedAmount!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) approvedAmount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  disbursedAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) interestRate?: number;
  @IsOptional() @IsString() applicationDate?: string;
  @IsOptional() @IsString() approvalDate?: string;
  @IsOptional() @IsString() disbursementDate?: string;
  @IsOptional() @IsString() maturityDate?: string;
  @IsOptional() @IsString() purpose?: string;
  @IsOptional() @IsString() collateral?: string;
  @IsOptional() @IsString() partnershipId?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  organizationStructureScore?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  customerRelationshipScore?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  financialTransparencyScore?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyInstallment?: number;
  @IsOptional() @IsString() nextPaymentDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateBusinessLoanDto {
  @IsOptional() @IsString() @MaxLength(200) bankName?: string;
  @IsOptional() @IsString() loanType?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) approvedAmount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  disbursedAmount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outstandingBalance?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) interestRate?: number;
  @IsOptional() @IsString() approvalDate?: string;
  @IsOptional() @IsString() disbursementDate?: string;
  @IsOptional() @IsString() maturityDate?: string;
  @IsOptional() @IsString() purpose?: string;
  @IsOptional() @IsString() collateral?: string;
  @IsOptional() @IsString() partnershipId?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  organizationStructureScore?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  customerRelationshipScore?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  financialTransparencyScore?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyInstallment?: number;
  @IsOptional() @IsString() nextPaymentDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class RecordLoanRepaymentDto {
  @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @IsOptional()
  @IsString()
  @IsIn(['BANK_TRANSFER', 'CASH', 'CHEQUE'])
  method?: string;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
  @IsOptional() @IsString() paidAt?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

// -- Investment ----------------------------------------------------------------

export class CreateInvestmentDto {
  @IsString() @MaxLength(200) title!: string;
  @IsString() @MaxLength(200) investorName!: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'PRIVATE',
    'INSTITUTIONAL',
    'GOVERNMENT',
    'FOREIGN',
  ])
  investorType?: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'EQUITY',
    'DEBT',
    'GRANT',
    'VENTURE_CAPITAL',
    'ANGEL',
    'GOVERNMENT',
    'OTHER',
  ])
  type?: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'PROSPECTING',
    'NEGOTIATING',
    'COMMITTED',
    'ACTIVE',
    'EXITED',
    'CANCELLED',
  ])
  status?: string;
  @Type(() => Number) @IsNumber() @Min(0) amount!: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  equityPct?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) expectedReturn?: number;
  @IsOptional() @IsString() commitmentDate?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() exitDate?: string;
  @IsOptional() @IsString() partnershipId?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() investmentPurpose?: string;
  @IsOptional() @IsString() dueDiligenceNotes?: string;
  @IsOptional() @IsBoolean() regulatoryApproval?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateInvestmentDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(200) investorName?: string;
  @IsOptional() @IsString() investorType?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) amount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  equityPct?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) expectedReturn?: number;
  @IsOptional() @IsString() commitmentDate?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() exitDate?: string;
  @IsOptional() @IsString() partnershipId?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() investmentPurpose?: string;
  @IsOptional() @IsString() dueDiligenceNotes?: string;
  @IsOptional() @IsBoolean() regulatoryApproval?: boolean;
  @IsOptional() @IsString() notes?: string;
}

// -- Customer Interaction ------------------------------------------------------

export class CreateCustomerInteractionDto {
  @IsString()
  @IsIn([
    'CALL',
    'MEETING',
    'EMAIL',
    'PAYMENT',
    'COMPLAINT',
    'OTHER',
  ])
  type!: string;
  @IsString() summary!: string;
  @IsOptional() @IsString() @MaxLength(200) outcome?: string;
  @IsOptional() @IsString() @MaxLength(100) performedBy?: string;
  @IsOptional() @IsString() interactedAt?: string;
}

// -- Loan Status Transition ----------------------------------------------------

export class TransitionLoanStatusDto {
  @IsString()
  @IsIn([
    'APPLIED',
    'UNDER_REVIEW',
    'APPROVED',
    'DISBURSED',
    'ACTIVE',
    'CLOSED',
    'REJECTED',
  ])
  status!: string;

  @IsOptional() @IsString() notes?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) approvedAmount?: number;
  @IsOptional() @IsString() approvalDate?: string;
  @IsOptional() @IsString() disbursementDate?: string;
}

// -- Due Diligence Checklist ---------------------------------------------------

export class UpsertDueDiligenceDto {
  @IsString() investmentId!: string;
  items!: { key: string; label: string; completed: boolean; notes?: string }[];
}
