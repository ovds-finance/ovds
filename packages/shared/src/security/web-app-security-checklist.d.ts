/**
 * Internal Web Application Security Assessment Guide — OVDS control mapping.
 * Aligns OWASP ZAP passive alerts + OWASP ASVS with implemented controls.
 * Source: Internal Web Application Security Assessment Guide v1.0
 */
export interface WebAppSecurityItem {
    id: string;
    phase: 'Passive Scan' | 'Authentication' | 'Authorization' | 'Session' | 'Input Validation' | 'API Security' | 'Headers' | 'Error Handling' | 'Cryptography' | 'Logging';
    title: string;
    requirement: string;
    zapAlert?: string;
    asvsRef?: string;
    implemented: boolean;
    ovdsControl: string;
    evidence: string;
    testPath?: string;
}
export declare const WEB_APP_SECURITY_CHECKLIST: WebAppSecurityItem[];
export declare function getWebAppSecuritySummary(): {
    total: number;
    implemented: number;
    pending: number;
    readinessScore: number;
};
//# sourceMappingURL=web-app-security-checklist.d.ts.map