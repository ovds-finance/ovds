/**
 * Sector mapping utilities for offline resilience enforcement.
 *
 * Maps existing company classification fields (businessType, tax profile sector)
 * to the 26 MoR-regulated sectors that legally require offline capability.
 *
 * Regulation: Ministry of Revenues directive requiring offline-first POS/invoice
 * for businesses in the 26 listed sectors during internet interruptions.
 */
import type { RegulatedSector } from './offline.types';
/**
 * Normalises raw company strings to a canonical regulated-sector code when
 * the business clearly falls under one of the 26 legally-covered sectors.
 *
 * Returns undefined when the company cannot be confidently mapped.
 */
export declare function resolveRegulatedSector(input: {
    businessType?: string | null;
    industry?: string | null;
    taxProfileSector?: string | null;
    companyType?: string | null;
}): RegulatedSector | undefined;
/**
 * Returns true when the given company (identified by its raw classification
 * fields) belongs to one of the 26 MoR-regulated sectors.
 */
export declare function isRegulatedSector(input: {
    businessType?: string | null;
    industry?: string | null;
    taxProfileSector?: string | null;
    companyType?: string | null;
}): boolean;
//# sourceMappingURL=sector-mapping.d.ts.map