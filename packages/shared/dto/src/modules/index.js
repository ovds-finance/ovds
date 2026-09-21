var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsInt, IsBoolean, IsUrl, IsEnum, IsEmail, IsDateString, IsArray, IsNotEmpty, Min, Max, MaxLength, ArrayMaxSize, } from 'class-validator';
import { AuditFirmStatus, EngagementStatus, AuditType, RiskLevel, FindingSeverity, ContactMethod, UpdateFrequency, } from '@ovds/shared';
import { ReleaseType } from '@ovds/shared';
/**
 * DTOs defined alongside non-DTO exports in @ovds/shared domain modules.
 * These class-validator-decorated classes live here (NOT in @ovds/shared which is pure types).
 */
// ─── AppStore ────────────────────────────────────────────────────────────────
export class AppDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], AppDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AppDto.prototype, "slug", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AppDto.prototype, "version", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AppDto.prototype, "developer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AppDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsUrl(),
    __metadata("design:type", String)
], AppDto.prototype, "iconUrl", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AppDto.prototype, "downloadUrl", void 0);
export class ReviewDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], ReviewDto.prototype, "appId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ReviewDto.prototype, "userId", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(5),
    __metadata("design:type", Number)
], ReviewDto.prototype, "rating", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ReviewDto.prototype, "comment", void 0);
// ─── Audit Outsourcing ───────────────────────────────────────────────────────
export class CreateAuditFirmDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateAuditFirmDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAuditFirmDto.prototype, "contactPerson", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAuditFirmDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAuditFirmDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAuditFirmDto.prototype, "industry", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAuditFirmDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    Max(5),
    __metadata("design:type", Number)
], CreateAuditFirmDto.prototype, "rating", void 0);
export class UpdateAuditFirmDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAuditFirmDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAuditFirmDto.prototype, "contactPerson", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAuditFirmDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAuditFirmDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAuditFirmDto.prototype, "industry", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAuditFirmDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    Max(5),
    __metadata("design:type", Number)
], UpdateAuditFirmDto.prototype, "rating", void 0);
__decorate([
    IsOptional(),
    IsEnum(AuditFirmStatus),
    __metadata("design:type", String)
], UpdateAuditFirmDto.prototype, "status", void 0);
export class CreateEngagementDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "firmId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsEnum(AuditType),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "auditType", void 0);
__decorate([
    IsOptional(),
    IsEnum(RiskLevel),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "riskLevel", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "scope", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateEngagementDto.prototype, "budget", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateEngagementDto.prototype, "actualCost", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEngagementDto.prototype, "referenceDocUrl", void 0);
export class UpdateEngagementDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsEnum(AuditType),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "auditType", void 0);
__decorate([
    IsOptional(),
    IsEnum(RiskLevel),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "riskLevel", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "scope", void 0);
__decorate([
    IsOptional(),
    IsEnum(EngagementStatus),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "reportSummary", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], UpdateEngagementDto.prototype, "budget", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], UpdateEngagementDto.prototype, "actualCost", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateEngagementDto.prototype, "referenceDocUrl", void 0);
export class CreateCommentDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "engagementId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "authorName", void 0);
export class CreateFindingDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateFindingDto.prototype, "engagementId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateFindingDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateFindingDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsEnum(FindingSeverity),
    __metadata("design:type", String)
], CreateFindingDto.prototype, "severity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateFindingDto.prototype, "recommendation", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateFindingDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateFindingDto.prototype, "assignedTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateFindingDto.prototype, "referenceDocUrl", void 0);
export class UpdateFindingDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsEnum(FindingSeverity),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "severity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "recommendation", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "resolution", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "assignedTo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateFindingDto.prototype, "referenceDocUrl", void 0);
// ─── Onboarding ──────────────────────────────────────────────────────────────
export class CreateOnboardingDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "contactName", void 0);
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "contactEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "contactPhone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "businessName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "website", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "socialMedia", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "valueProposition", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "mainGoals", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "successDefinition", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "idealCustomerProfile", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "mainCompetitors", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "topChallenges", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "currentBlockers", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "budget", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "desiredTimeline", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "usp", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "kpis", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "hasLogo", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "existingMaterials", void 0);
__decorate([
    IsOptional(),
    IsEnum(ContactMethod),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "preferredContact", void 0);
__decorate([
    IsOptional(),
    IsEnum(UpdateFrequency),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "updateFrequency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "timezone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOnboardingDto.prototype, "brandLove", void 0);
// ─── Release / Feature Flags ─────────────────────────────────────────────────
export class CreateReleaseDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "version", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "changelog", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateReleaseDto.prototype, "isMandatory", void 0);
__decorate([
    IsOptional(),
    IsEnum(ReleaseType),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "type", void 0);
export class ApplyReleaseDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ApplyReleaseDto.prototype, "releaseId", void 0);
export class CreateFeatureFlagDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateFeatureFlagDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateFeatureFlagDto.prototype, "description", void 0);
export class ToggleFeatureFlagDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ToggleFeatureFlagDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ToggleFeatureFlagDto.prototype, "flagId", void 0);
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], ToggleFeatureFlagDto.prototype, "isEnabled", void 0);
// ─── Settings / Webhooks ─────────────────────────────────────────────────────
export class CreateWebhookDto {
}
__decorate([
    IsUrl({ require_tld: false }),
    MaxLength(500),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "url", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(50),
    IsString({ each: true }),
    __metadata("design:type", Array)
], CreateWebhookDto.prototype, "events", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "secret", void 0);
export class UpdateWebhookDto {
}
__decorate([
    IsOptional(),
    IsUrl({ require_tld: false }),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateWebhookDto.prototype, "url", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(50),
    IsString({ each: true }),
    __metadata("design:type", Array)
], UpdateWebhookDto.prototype, "events", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateWebhookDto.prototype, "secret", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateWebhookDto.prototype, "isActive", void 0);
