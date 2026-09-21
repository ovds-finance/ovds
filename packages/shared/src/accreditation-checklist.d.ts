/**
 * Sales Registration Systems Accreditation Checklist
 * Directive No. 1142/2026 compliance verification
 * Static template data seeded per accreditation session.
 */
export interface AccreditationItemSeed {
    sectionKey: string;
    itemKey: string;
    itemText: string;
    itemType?: 'requirement' | 'compliance_ref';
    refSection?: string;
}
export declare const ACCREDITATION_CHECKLIST_TEMPLATE: AccreditationItemSeed[];
export declare const ACCREDITATION_SECTION_META: Record<string, {
    label: string;
    directive: string;
    icon: string;
}>;
export declare const ACCREDITATION_SECTION_ORDER: string[];
//# sourceMappingURL=accreditation-checklist.d.ts.map