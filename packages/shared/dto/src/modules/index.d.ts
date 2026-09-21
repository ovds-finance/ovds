import { AuditFirmStatus, EngagementStatus, AuditType, RiskLevel, FindingSeverity, ContactMethod, UpdateFrequency } from '@ovds/shared';
import { ReleaseType } from '@ovds/shared';
/**
 * DTOs defined alongside non-DTO exports in @ovds/shared domain modules.
 * These class-validator-decorated classes live here (NOT in @ovds/shared which is pure types).
 */
export declare class AppDto {
    name: string;
    slug?: string;
    version: string;
    developer: string;
    description?: string;
    iconUrl?: string;
    downloadUrl: string;
}
export declare class ReviewDto {
    appId: string;
    userId?: string;
    rating: number;
    comment?: string;
}
export declare class CreateAuditFirmDto {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    industry?: string;
    notes?: string;
    rating?: number;
}
export declare class UpdateAuditFirmDto {
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    industry?: string;
    notes?: string;
    rating?: number;
    status?: AuditFirmStatus;
}
export declare class CreateEngagementDto {
    firmId?: string;
    title: string;
    auditType?: AuditType;
    riskLevel?: RiskLevel;
    scope?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
    budget?: number;
    actualCost?: number;
    referenceDocUrl?: string;
}
export declare class UpdateEngagementDto {
    title?: string;
    auditType?: AuditType;
    riskLevel?: RiskLevel;
    scope?: string;
    status?: EngagementStatus;
    startDate?: string;
    endDate?: string;
    notes?: string;
    reportSummary?: string;
    budget?: number;
    actualCost?: number;
    referenceDocUrl?: string;
}
export declare class CreateCommentDto {
    engagementId: string;
    content: string;
    authorName?: string;
}
export declare class CreateFindingDto {
    engagementId: string;
    title: string;
    description?: string;
    severity?: FindingSeverity;
    recommendation?: string;
    dueDate?: string;
    assignedTo?: string;
    referenceDocUrl?: string;
}
export declare class UpdateFindingDto {
    title?: string;
    description?: string;
    severity?: FindingSeverity;
    recommendation?: string;
    resolution?: string;
    status?: string;
    dueDate?: string;
    assignedTo?: string;
    referenceDocUrl?: string;
}
export declare class CreateOnboardingDto {
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    businessName?: string;
    address?: string;
    website?: string;
    socialMedia?: string;
    valueProposition: string;
    mainGoals: string;
    successDefinition?: string;
    idealCustomerProfile?: string;
    mainCompetitors?: string;
    topChallenges: string;
    currentBlockers?: string;
    budget?: string;
    desiredTimeline?: string;
    usp?: string;
    kpis?: string;
    hasLogo?: string;
    existingMaterials?: string;
    preferredContact?: ContactMethod;
    updateFrequency?: UpdateFrequency;
    timezone?: string;
    brandLove?: string;
}
export declare class CreateReleaseDto {
    version: string;
    changelog?: string;
    isMandatory?: boolean;
    type?: ReleaseType;
}
export declare class ApplyReleaseDto {
    releaseId: string;
}
export declare class CreateFeatureFlagDto {
    name: string;
    description?: string;
}
export declare class ToggleFeatureFlagDto {
    companyId: string;
    flagId: string;
    isEnabled: boolean;
}
export declare class CreateWebhookDto {
    url: string;
    events?: string[];
    secret?: string;
}
export declare class UpdateWebhookDto {
    url?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
}
//# sourceMappingURL=index.d.ts.map