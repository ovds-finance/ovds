import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsUrl,
  IsEnum,
  IsEmail,
  IsDateString,
  IsArray,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import {
  AuditFirmStatus,
  EngagementStatus,
  AuditType,
  RiskLevel,
  FindingSeverity,
  ContactMethod,
  UpdateFrequency,
} from '@ovds/shared';
import { ReleaseType } from '@ovds/shared';

/**
 * DTOs defined alongside non-DTO exports in @ovds/shared domain modules.
 * These class-validator-decorated classes live here (NOT in @ovds/shared which is pure types).
 */

// ─── AppStore ────────────────────────────────────────────────────────────────

export class AppDto {
  @IsString() name: string;
  @IsOptional() @IsString() slug?: string;
  @IsString() version: string;
  @IsString() developer: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl() iconUrl?: string;
  @IsString() downloadUrl: string;
}

export class ReviewDto {
  @IsString() appId: string;
  @IsOptional() @IsString() userId?: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() comment?: string;
}

// ─── Audit Outsourcing ───────────────────────────────────────────────────────

export class CreateAuditFirmDto {
  @IsString() name: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() @Min(0) @Max(5) rating?: number;
}

export class UpdateAuditFirmDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() @Min(0) @Max(5) rating?: number;
  @IsOptional() @IsEnum(AuditFirmStatus) status?: AuditFirmStatus;
}

export class CreateEngagementDto {
  @IsOptional() @IsString() firmId?: string;
  @IsString() title: string;
  @IsOptional() @IsEnum(AuditType) auditType?: AuditType;
  @IsOptional() @IsEnum(RiskLevel) riskLevel?: RiskLevel;
  @IsOptional() @IsString() scope?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() @Min(0) budget?: number;
  @IsOptional() @IsInt() @Min(0) actualCost?: number;
  @IsOptional() @IsString() referenceDocUrl?: string;
}

export class UpdateEngagementDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(AuditType) auditType?: AuditType;
  @IsOptional() @IsEnum(RiskLevel) riskLevel?: RiskLevel;
  @IsOptional() @IsString() scope?: string;
  @IsOptional() @IsEnum(EngagementStatus) status?: EngagementStatus;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() reportSummary?: string;
  @IsOptional() @IsInt() @Min(0) budget?: number;
  @IsOptional() @IsInt() @Min(0) actualCost?: number;
  @IsOptional() @IsString() referenceDocUrl?: string;
}

export class CreateCommentDto {
  @IsString() engagementId: string;
  @IsString() content: string;
  @IsOptional() @IsString() authorName?: string;
}

export class CreateFindingDto {
  @IsString() engagementId: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(FindingSeverity) severity?: FindingSeverity;
  @IsOptional() @IsString() recommendation?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() referenceDocUrl?: string;
}

export class UpdateFindingDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(FindingSeverity) severity?: FindingSeverity;
  @IsOptional() @IsString() recommendation?: string;
  @IsOptional() @IsString() resolution?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() referenceDocUrl?: string;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export class CreateOnboardingDto {
  @IsString() contactName: string;
  @IsEmail() contactEmail: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() businessName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() socialMedia?: string;
  @IsString() valueProposition: string;
  @IsString() mainGoals: string;
  @IsOptional() @IsString() successDefinition?: string;
  @IsOptional() @IsString() idealCustomerProfile?: string;
  @IsOptional() @IsString() mainCompetitors?: string;
  @IsString() topChallenges: string;
  @IsOptional() @IsString() currentBlockers?: string;
  @IsOptional() @IsString() budget?: string;
  @IsOptional() @IsString() desiredTimeline?: string;
  @IsOptional() @IsString() usp?: string;
  @IsOptional() @IsString() kpis?: string;
  @IsOptional() @IsString() hasLogo?: string;
  @IsOptional() @IsString() existingMaterials?: string;
  @IsOptional() @IsEnum(ContactMethod) preferredContact?: ContactMethod;
  @IsOptional() @IsEnum(UpdateFrequency) updateFrequency?: UpdateFrequency;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() brandLove?: string;
}

// ─── Release / Feature Flags ─────────────────────────────────────────────────

export class CreateReleaseDto {
  @IsString() @IsNotEmpty() version: string;
  @IsOptional() @IsString() changelog?: string;
  @IsOptional() @IsBoolean() isMandatory?: boolean;
  @IsOptional() @IsEnum(ReleaseType) type?: ReleaseType;
}

export class ApplyReleaseDto {
  @IsString() @IsNotEmpty() releaseId: string;
}

export class CreateFeatureFlagDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
}

export class ToggleFeatureFlagDto {
  @IsString() @IsNotEmpty() companyId: string;
  @IsString() @IsNotEmpty() flagId: string;
  @IsBoolean() isEnabled: boolean;
}

// ─── Settings / Webhooks ─────────────────────────────────────────────────────

export class CreateWebhookDto {
  @IsUrl({ require_tld: false }) @MaxLength(500) url: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) events?: string[];
  @IsOptional() @IsString() @MaxLength(200) secret?: string;
}

export class UpdateWebhookDto {
  @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500) url?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) events?: string[];
  @IsOptional() @IsString() @MaxLength(200) secret?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
