/**
 * MoR EIMS Self-Onboarding & Source Registration checklist
 * Source: docs/01-getting-started/mor-eims-onboarding.md
 */
export interface MorOnboardingStep {
    id: string;
    phase: 'Taxpayer Portal' | 'Source Registration' | 'INSA Certificate' | 'BSP Submission';
    title: string;
    description: string;
    required: boolean;
    templateFile?: string;
    externalUrl?: string;
    ovdsSupport: string;
}
export declare const MOR_ONBOARDING_CHECKLIST: MorOnboardingStep[];
/** INSA CSR field requirements per certificate_guideline.pdf */
export declare const INSA_CSR_REQUIREMENTS: {
    keyAlgorithm: string;
    keySize: number;
    signatureAlgorithm: string;
    subjectFields: {
        C: string;
        ST: string;
        L: string;
        O: string;
        OU: string;
        CN: string;
        serialNumber: string;
        emailAddress: string;
    };
    submissionEmail: string;
    opensslCommand: string;
};
export type MorSourceRegistrationStep = 'ENTERPRISE_SELECTED' | 'ESTABLISHMENT_SELECTED' | 'SOURCE_ADDED' | 'PENDING_APPROVAL' | 'APPROVED';
//# sourceMappingURL=mor-onboarding-checklist.d.ts.map