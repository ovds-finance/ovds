export declare enum ContactMethod {
    EMAIL = "EMAIL",
    SLACK = "SLACK",
    PHONE = "PHONE",
    WHATSAPP = "WHATSAPP"
}
export declare enum UpdateFrequency {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    BIWEEKLY = "BIWEEKLY",
    MONTHLY = "MONTHLY"
}
export interface CreateOnboardingDto {
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
//# sourceMappingURL=onboarding.d.ts.map