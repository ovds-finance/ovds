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
export function resolveRegulatedSector(input: {
  businessType?: string | null;
  industry?: string | null;
  taxProfileSector?: string | null;
  companyType?: string | null;
}): RegulatedSector | undefined {
  const raw = [
    input.businessType,
    input.industry,
    input.taxProfileSector,
    input.companyType,
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  if (!raw) return undefined;

  // ── Retail trade of food ──────────────────────────────────────────────────
  if (/\bFOOD\b/.test(raw) && /\bRETAIL\b|\bSHOP\b|\bSTORE\b|\bMARKET\b/.test(raw))
    return 'FOOD_RETAIL';
  if (/\bGROCERY\b|\bSUPERMARKET\b|\bFOODSTUFF\b/.test(raw)) return 'FOOD_RETAIL';
  if (/\bBAKERY\b/.test(raw) && !/\bWHOLESALE\b/.test(raw)) return 'FOOD_RETAIL';

  // ── Retail trade of beverages ────────────────────────────────────────────
  if (/\bBEVERAGE\b/.test(raw) && /\bRETAIL\b|\bSHOP\b|\bBAR\b/.test(raw))
    return 'BEVERAGE_RETAIL';
  if (/\bWINE\b|\bLIQUOR\b|\bALCOHOL\b/.test(raw) && /\bRETAIL\b|\bSHOP\b/.test(raw))
    return 'BEVERAGE_RETAIL';

  // ── Cigarettes and tobacco products ──────────────────────────────────────
  if (/\bTOBACCO\b|\bCIGARETTE\b|\bCIGAR\b/.test(raw)) return 'TOBACCO_RETAIL';

  // ── Petroleum and petroleum products ─────────────────────────────────────
  if (/\bPETROLEUM\b|\bGAS_STATION\b|\bFUEL\b|\bOIL\b/.test(raw))
    return 'PETROLEUM_RETAIL';
  if (/\bDIESEL\b|\bGASOLINE\b|\bPETROL\b/.test(raw)) return 'PETROLEUM_RETAIL';

  // ── Retail trade of textiles ─────────────────────────────────────────────
  if (/\bTEXTILE\b/.test(raw) && /\bRETAIL\b|\bSHOP\b/.test(raw)) return 'TEXTILE_RETAIL';
  if (/\bFABRIC\b/.test(raw) && /\bRETAIL\b/.test(raw)) return 'TEXTILE_RETAIL';

  // ── Books, newspapers, and stationery ────────────────────────────────────
  if (/\bSTATIONERY\b|\bBOOK\b|\bNEWSPAPER\b|\bPRINTING\b/.test(raw))
    return 'STATIONERY_RETAIL';

  // ── Clothes, shoes, and leather products ─────────────────────────────────
  if (/\bCLOTHING\b|\bAPPAREL\b|\bFASHION\b/.test(raw) && /\bRETAIL\b|\bSHOP\b/.test(raw))
    return 'CLOTHING_RETAIL';
  if (/\bSHOE\b|\bFOOTWEAR\b/.test(raw) && /\bRETAIL\b/.test(raw)) return 'CLOTHING_RETAIL';
  if (/\bLEATHER\b/.test(raw) && /\bRETAIL\b|\bGOODS\b/.test(raw)) return 'CLOTHING_RETAIL';

  // ── Pharmaceuticals, medical, and cosmetics goods ────────────────────────
  if (/\bPHARMACY\b|\bPHARMACEUTICAL\b|\bMEDICAL\b/.test(raw) && /\bRETAIL\b|\bSHOP\b|\bSTORE\b/.test(raw))
    return 'PHARMA_RETAIL';
  if (/\bCOSMETIC\b/.test(raw) && /\bRETAIL\b|\bSHOP\b/.test(raw)) return 'PHARMA_RETAIL';
  if (/\bDRUG\b|\bMEDICINE\b/.test(raw) && /\bRETAIL\b/.test(raw)) return 'PHARMA_RETAIL';

  // ── Retail trade of other new goods ──────────────────────────────────────
  if (/\bRETAIL\b/.test(raw) && /\bNEW\b|\bGENERAL\b/.test(raw) && !/\bWHOLESALE\b/.test(raw))
    return 'NEW_GOODS_RETAIL';
  if (/\bGENERAL\s+STORE\b|\bCONVENIENCE\b/.test(raw)) return 'NEW_GOODS_RETAIL';

  // ── Retail trade of used goods ───────────────────────────────────────────
  if (/\bUSED\b/.test(raw) && /\bGOODS\b|\bSECOND.HAND\b/.test(raw))
    return 'USED_GOODS_RETAIL';
  if (/\bSECOND.HAND\b|\bTHRIFT\b/.test(raw)) return 'USED_GOODS_RETAIL';

  // ── Vehicles, motorcycles, and spare parts ───────────────────────────────
  if (/\bVEHICLE\b|\bMOTORCYCLE\b|\bAUTO\b|\bCAR\b/.test(raw) && /\bRETAIL\b|\bDEALER\b|\bSPARE\b/.test(raw))
    return 'VEHICLE_RETAIL';
  if (/\bAUTOMOBILE\b/.test(raw)) return 'VEHICLE_RETAIL';

  // ── Urban and inter-city railway transport ───────────────────────────────
  if (/\bRAILWAY\b|\bTRAIN\b/.test(raw)) return 'RAILWAY_TRANSPORT';

  // ── Urban and suburban public transport ──────────────────────────────────
  if (/\bBUS\b/.test(raw) && /\bSERVICE\b|\bTRANSPORT\b/.test(raw)) return 'PUBLIC_TRANSPORT';
  if (/\bPUBLIC\s+TRANSPORT\b|\bMINIBUS\b/.test(raw)) return 'PUBLIC_TRANSPORT';

  // ── Other passenger transport services ───────────────────────────────────
  if (/\bTAXI\b|\bCAB\b/.test(raw)) return 'PASSENGER_TRANSPORT';
  if (/\bPASSENGER\b.*\bTRANSPORT\b|\bTRANSPORT\b.*\bPASSENGER\b/.test(raw)) return 'PASSENGER_TRANSPORT';

  // ── Courier (postal) services ────────────────────────────────────────────
  if (/\bCOURIER\b|\bPOSTAL\b|\bPOST\b|\bDELIVERY\b/.test(raw))
    return 'COURIER_SERVICES';

  // ── Short-term accommodation services (Hotels) ───────────────────────────
  if (/\bHOTEL\b|\bLODGE\b|\bACCOMMODATION\b/.test(raw)) return 'SHORT_TERM_ACCOMMODATION';
  if (/\bGUEST\s+HOUSE\b/.test(raw)) return 'SHORT_TERM_ACCOMMODATION';

  // ── Camping and recreational sites ───────────────────────────────────────
  if (/\bCAMPING\b|\bCAMPSITE\b/.test(raw)) return 'CAMPING_RECREATION';
  if (/\bRECREATION\b|\bRESORT\b/.test(raw)) return 'CAMPING_RECREATION';

  // ── Restaurants and mobile food services ─────────────────────────────────
  if (/\bRESTAURANT\b|\bCAFE\b|\bFOOD\s+SERVICE\b/.test(raw))
    return 'RESTAURANT_FOOD_SERVICES';
  if (/\bCATERING\b/.test(raw) && !/\bINDUSTRIAL\b/.test(raw)) return 'RESTAURANT_FOOD_SERVICES';

  // ── Beverage serving (Bar) services ──────────────────────────────────────
  if (/\bBAR\b|\bPUB\b|\bNIGHTCLUB\b/.test(raw)) return 'BEVERAGE_SERVICES';
  if (/\bDISCOTHEQUE\b/.test(raw)) return 'BEVERAGE_SERVICES';

  // ── Hospital institution services ────────────────────────────────────────
  if (/\bHOSPITAL\b/.test(raw)) return 'HOSPITAL_SERVICES';
  if (/\bCLINIC\b/.test(raw) && /\bINPATIENT\b|\bHOSPITAL\b/.test(raw))
    return 'HOSPITAL_SERVICES';

  // ── Medical and dental practices ─────────────────────────────────────────
  if (/\bDENTAL\b|\bDENTIST\b/.test(raw)) return 'MEDICAL_PRACTICE';
  if (/\bMEDICAL\s+PRACTICE\b|\bDOCTOR\b|\bPHYSICIAN\b/.test(raw))
    return 'MEDICAL_PRACTICE';

  // ── Hairdressing and beauty salon services ───────────────────────────────
  if (/\bHAIR\b|\bSALON\b|\bBARBER\b/.test(raw)) return 'HAIRDRESSING_SALON';
  if (/\BEAUTY\b/.test(raw) && /\bSALON\b/.test(raw)) return 'HAIRDRESSING_SALON';

  // ── Beauty and skincare treatment ────────────────────────────────────────
  if (/\bSKIN\b|\bBEAUTY\b.*\bCARE\b|\bSPA\b/.test(raw)) return 'BEAUTY_SKINCARE';
  if (/\bCOSMETOLOGY\b/.test(raw)) return 'BEAUTY_SKINCARE';

  // ── Sauna, steam, and shower services ────────────────────────────────────
  if (/\bSAUNA\b|\bSTEAM\b|\bBATH\b/.test(raw)) return 'SAUNA_SERVICES';

  // ── Veterinary services ──────────────────────────────────────────────────
  if (/\bVETERINARY\b|\bVET\b/.test(raw)) return 'VETERINARY_SERVICES';

  // ── Parks and amusement places ───────────────────────────────────────────
  if (/\bPARK\b|\bAMUSEMENT\b|\bTHEME\s+PARK\b|\bZOO\b/.test(raw))
    return 'PARK_AMUSEMENT';
  if (/\bPLAYGROUND\b|\bENTERTAINMENT\b/.test(raw)) return 'PARK_AMUSEMENT';

  return undefined;
}

/**
 * Returns true when the given company (identified by its raw classification
 * fields) belongs to one of the 26 MoR-regulated sectors.
 */
export function isRegulatedSector(input: {
  businessType?: string | null;
  industry?: string | null;
  taxProfileSector?: string | null;
  companyType?: string | null;
}): boolean {
  return resolveRegulatedSector(input) !== undefined;
}
