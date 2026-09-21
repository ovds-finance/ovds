export declare const STATIC_SECTIONS: Array<{
    key: string;
    label: string;
    icon: string;
    sectionLabel: true;
    colorToken: string;
}>;
export declare const ROLE_SECTION_ACCESS: Record<string, string[]>;
export declare function allowedSectionsForRole(role: string): string[];
export declare function isSuperUser(role: string): boolean;
//# sourceMappingURL=section-access.d.ts.map