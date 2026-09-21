/**
 * MoR BSP Master Compliance Checklist — test cases IRC-P01 through IRC-P07
 * Source: MoR_BSP_Master.docx (EIRMS rollout readiness)
 */
export interface MorBspTestCase {
    id: string;
    category: 'Invoice Registration' | 'Receipt Registration' | 'Cancellation' | 'Negative Test' | 'Security' | 'Offline Mode';
    title: string;
    description: string;
    /** OVDS capability that satisfies this test */
    ovdsCapability: string;
    /** Whether OVDS implements automated support for this scenario */
    automated: boolean;
    /** API endpoint or UI path to execute */
    executePath?: string;
    docRef: string;
}
export declare const MOR_BSP_CHECKLIST: MorBspTestCase[];
export declare function getMorBspSummary(): {
    total: number;
    automated: number;
    manual: number;
    readinessScore: number;
};
//# sourceMappingURL=mor-bsp-checklist.d.ts.map