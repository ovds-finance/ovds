/**
 * @ovds/shared — Ethiopian Business Registration & Harmonization Types
 *
 * Models the 5-step identity harmonization process required to link a
 * business's Fayda NID → TIN → Business License → VAT registration through
 * Ethiopian federal portals (e-Trade + MoR eTax).
 *
 * Hierarchy: NID (Fayda) → TIN (MoR) → Business License (MoTRI) → VAT (MoR)
 * Final step: cross-reference all identifiers through e-Trade and MoR.
 */

// -- Enumerations --------------------------------------------------------------

/** Verification status for each identity layer */
export type VerificationStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REQUIRES_UPDATE';

/** Overall harmonization progress across all 5 steps */
export type HarmonizationStatus =
  | 'INCOMPLETE'
  | 'IN_PROGRESS'
  | 'HARMONIZED'
  | 'ACTION_REQUIRED';

/** Business license category per Ethiopian Commercial Code */
export type BusinessLicenseCategory =
  | 'CATEGORY_A'   // Annual turnover > ETB 2M — VAT mandatory
  | 'CATEGORY_B'   // Annual turnover ETB 500K – 2M
  | 'CATEGORY_C';  // Annual turnover < ETB 500K — TOT only

/** VAT registration status */
export type VatRegistrationStatus =
  | 'NOT_REGISTERED'
  | 'PENDING_APPLICATION'
  | 'REGISTERED'
  | 'SUSPENDED'
  | 'DEREGISTERED';

/** Ethiopian POS/ECR machine requirement status */
export type EcrStatus = 'NOT_REQUIRED' | 'REQUIRED_PENDING' | 'REGISTERED';

// -- Core Interfaces -----------------------------------------------------------

/** Fayda National Identification (NID) details */
export interface NidDetails {
  /** 12-digit Fayda Identification Number (FIN) */
  faydaId: string;
  /** Full legal name as registered with NIDP */
  fullName: string;
  /** Date of birth in ISO format (yyyy-MM-dd) */
  dateOfBirth?: string;
  /** Biometric registration date */
  registeredAt?: string;
  status: VerificationStatus;
  /** URL to the Fayda portal for registration */
  portalUrl?: string;
}

/** Ministry of Revenues (MoR) Taxpayer Identification Number (TIN) details
 *  (MoR was formerly the Ethiopian Revenues and Customs Authority / ERCA,
 *   restructured under Proclamation No. 1097/2018. Register at etax.mor.gov.et)
 */
export interface TinDetails {
  /** 10-digit Ethiopian TIN */
  tin: string;
  /** Legal business name as registered with MoR */
  businessName: string;
  /** Sub-city tax office where TIN is registered */
  taxOffice?: string;
  /** Date TIN was issued */
  issuedAt?: string;
  /** Whether biometric registration at MoR is complete */
  biometricComplete: boolean;
  status: VerificationStatus;
  /** MoR eTax portal URL */
  portalUrl?: string;
}

/** Ministry of Trade & Regional Integration — Business License details */
export interface BusinessLicenseDetails {
  /** Official business license number */
  licenseNumber: string;
  /** Registered trade name */
  tradeName: string;
  /** Licensed commercial activity / sector */
  activity: string;
  /** Physical premises address tied to the license */
  registeredAddress: string;
  category: BusinessLicenseCategory;
  /** Annual turnover (ETB) — determines category */
  annualTurnover?: number;
  /** License issue date (ISO format) */
  issuedAt?: string;
  /** License expiry date (ISO format) */
  expiresAt?: string;
  /** Last renewal date */
  renewedAt?: string;
  status: VerificationStatus;
  /** e-Trade portal URL */
  portalUrl?: string;
}

/** MoR VAT Registration details */
export interface VatDetails {
  /** VAT registration certificate number */
  vatNumber: string;
  /** VAT registration date */
  registeredAt?: string;
  registrationStatus: VatRegistrationStatus;
  /** Monthly filing deadline day */
  filingDeadlineDay: number;
  /** Whether MoR-approved ECR/POS machine (SRM/EFD) is registered on TASS (tass.mor.gov.et) */
  ecrStatus: EcrStatus;
  /** ECR device serial number (if registered) */
  ecrSerial?: string;
  status: VerificationStatus;
  /** MoR VAT registration portal URL (etax.mor.gov.et) */
  portalUrl?: string;
}

/** Cross-reference verification step — all identifiers linked */
export interface CrossReferenceDetails {
  /** Whether NID ↔ TIN link is verified on e-Trade */
  nidTinLinked: boolean;
  /** Whether TIN ↔ Business License link is verified */
  tinLicenseLinked: boolean;
  /** Whether Business License ↔ VAT link is verified */
  licenseVatLinked: boolean;
  /** Whether all records are aligned in MoR's administrative system */
  morSystemActive: boolean;
  /** Any conflict notes found during cross-referencing */
  conflictNotes?: string[];
  /** Last verified date (ISO format) */
  verifiedAt?: string;
}

/** The full harmonization record for a business entity */
export interface BusinessHarmonization {
  id?: string;
  companyId?: string;
  nid?: Partial<NidDetails>;
  tin?: Partial<TinDetails>;
  businessLicense?: Partial<BusinessLicenseDetails>;
  vat?: Partial<VatDetails>;
  crossReference?: Partial<CrossReferenceDetails>;
  overallStatus: HarmonizationStatus;
  /** Completion percentage (0–100) */
  completionPct: number;
  createdAt?: string;
  updatedAt?: string;
}

// -- DTOs ----------------------------------------------------------------------

export interface SaveNidDto {
  faydaId: string;
  fullName: string;
  dateOfBirth?: string;
}

export interface SaveTinDto {
  tin: string;
  businessName: string;
  taxOffice?: string;
  biometricComplete: boolean;
}

export interface SaveBusinessLicenseDto {
  licenseNumber: string;
  tradeName: string;
  activity: string;
  registeredAddress: string;
  annualTurnover?: number;
  issuedAt?: string;
  expiresAt?: string;
}

export interface SaveVatDto {
  vatNumber: string;
  registrationStatus: VatRegistrationStatus;
  ecrStatus: EcrStatus;
  ecrSerial?: string;
}

export interface SaveCrossReferenceDto {
  nidTinLinked: boolean;
  tinLicenseLinked: boolean;
  licenseVatLinked: boolean;
  morSystemActive: boolean;
  conflictNotes?: string[];
}

// -- Validation helpers --------------------------------------------------------

/** Validates a 12-digit Fayda Identification Number */
export function isValidFaydaId(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^\d{12}$/.test(id.replace(/[\s-]/g, ''));
}

/** Formats a Fayda ID as "XXXX-XXXX-XXXX" */
export function fmtFaydaId(id: string): string {
  const clean = id.replace(/\D/g, '').slice(0, 12);
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
}

/** Computes overall harmonization completion percentage */
export function computeHarmonizationPct(record: Partial<BusinessHarmonization>): number {
  let score = 0;
  if (record.nid?.status === 'VERIFIED') score += 20;
  if (record.tin?.status === 'VERIFIED') score += 20;
  if (record.businessLicense?.status === 'VERIFIED') score += 20;
  if (record.vat?.registrationStatus === 'REGISTERED') score += 20;
  const cr = record.crossReference;
  if (cr) {
    const linked = [cr.nidTinLinked, cr.tinLicenseLinked, cr.licenseVatLinked, cr.morSystemActive].filter(Boolean).length;
    score += Math.round((linked / 4) * 20);
  }
  return score;
}

/** Derives overall harmonization status from a partial record */
export function deriveHarmonizationStatus(record: Partial<BusinessHarmonization>): HarmonizationStatus {
  const pct = computeHarmonizationPct(record);
  if (pct === 0) return 'INCOMPLETE';
  if (pct === 100) return 'HARMONIZED';
  const hasRejected = [
    record.nid?.status,
    record.tin?.status,
    record.businessLicense?.status,
    record.vat?.status,
  ].some(s => s === 'REJECTED' || s === 'EXPIRED');
  if (hasRejected) return 'ACTION_REQUIRED';
  return 'IN_PROGRESS';
}
