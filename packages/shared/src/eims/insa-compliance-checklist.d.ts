/**
 * INSA Cybersecurity Audit minimum Requirements — compliance checklist.
 * Maps OVDS implementation status against OF/AEAD/001 requirements.
 */
import type { InsaComplianceItem } from './eims.types';
export declare const INSA_COMPLIANCE_CHECKLIST: InsaComplianceItem[];
/** Summary stats for compliance dashboard */
export declare function getInsaComplianceSummary(): {
    total: number;
    implemented: number;
    notApplicable: number;
    gaps: number;
    score: number;
};
//# sourceMappingURL=insa-compliance-checklist.d.ts.map