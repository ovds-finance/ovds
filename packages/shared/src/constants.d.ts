/**
 * System-wide constants for the OVDS monorepo.
 * Shared between frontend (React) and backend (NestJS).
 */
export declare const APP_NAME = "OVDS";
export declare const APP_VERSION = "2.1.0";
export declare const APP_BUILD = "2026.09.01";
export declare const API_VERSION = "v1";
export declare const API_PREFIX = "/api";
export declare const BRAND: {
    readonly primary: "#00E784";
    readonly primaryDark: "#00C96E";
    readonly primaryLight: "#6EFFC0";
    readonly sidebar: "#1e293b";
    readonly danger: "#dc2626";
    readonly warning: "#d97706";
    readonly info: "#0284c7";
    readonly success: "#00C96E";
    readonly textMain: "#333333";
    readonly textMuted: "#64748b";
    readonly surface: "#ffffff";
    readonly border: "#e2e8f0";
};
export declare const ETH_TAX: {
    readonly VAT_RATE: 0.15;
    readonly VAT_REGISTRATION_THRESHOLD: 2000000;
    readonly WHT_IMPORT_RATE: 0.03;
    readonly WHT_SERVICE_RATE: 0.03;
    readonly WHT_GOODS_RATE: 0.03;
    readonly WHT_GOVERNMENT_RATE: 0.3;
    readonly WHT_DIVIDEND_RATE: 0.15;
    readonly WHT_INTEREST_RATE: 0.1;
    readonly WHT_INTEREST_FI_RATE: 0.3;
    readonly WHT_ROYALTY_ARTISTIC: 0.05;
    readonly WHT_ROYALTY_TECHNICAL: 0.1;
    readonly WHT_MGMT_FEES_NR: 0.15;
    readonly WHT_TECH_FEES_NR: 0.15;
    readonly WHT_SERVICE_NR_RATE: 0.15;
    readonly WHT_SERVICE_THRESHOLD: 500;
    readonly WHT_GOODS_THRESHOLD: 10000;
    readonly CAPITAL_GAINS_RATE: 0.15;
    readonly GAMES_OF_CHANCE_RATE: 0.2;
    readonly REPATRIATED_PROFIT_RATE: 0.15;
    readonly UNDISTRIBUTED_PROFIT_RATE: 0.15;
    readonly DIGITAL_CONTENT_RATE: 0.15;
    readonly TOT_GOODS_RATE: 0.02;
    readonly TOT_CONSTRUCTION_RATE: 0.02;
    readonly TOT_SERVICES_RATE: 0.1;
    readonly TOT_THRESHOLD_ETB: 500000;
    readonly BIT_MAX_RATE: 0.3;
    readonly MAT_RATE: 0.025;
    readonly CAT_A_THRESHOLD: 1000000;
    readonly CASH_PAYMENT_DEDUCTION_CAP: 50000;
    /** Payment modes that satisfy the electronic-settlement requirement above the cap. */
    readonly ELECTRONIC_SETTLEMENT_MODES: readonly ["CHEQUE", "CPO", "Local Bank Transfer", "SWIFT", "Wire Transfer", "Letter of Credit", "Card"];
    readonly CORPORATE_RENTAL_RATE: 0.3;
    readonly IMPORT_SURTAX_RATE: 0.1;
    readonly CUSTOMS_DUTY_MIN: 0;
    readonly CUSTOMS_DUTY_MAX: 0.35;
    readonly EXCISE_RATE_MIN: 0.05;
    readonly EXCISE_RATE_MAX: 5;
    readonly EXCISE_RATES: {
        readonly ALCOHOL: 0.15;
        readonly TOBACCO: 0.2;
        readonly AUTOMOBILE_GT_1800CC: 0.55;
        readonly AUTOMOBILE_LT_1800CC: 0.47;
        readonly AUTOMOBILE_ELECTRIC: 0.25;
        readonly JEWELRY: 0.3;
        readonly YACHT: 0.35;
        readonly PRIVATE_AIRCRAFT: 0.5;
        readonly FIREARMS: 0.4;
        readonly SUGAR_SWEETENED: 0.1;
        readonly ENERGY_DRINK: 0.175;
        readonly PLASTIC: 0.05;
    };
    readonly STAMP_DUTY_MIN: 500;
    readonly DRRF_RATE: 0.01;
    readonly PENSION_EMPLOYEE: 0.07;
    readonly PENSION_EMPLOYER: 0.11;
    readonly PENSION_CAP_ETB: 15000;
    readonly CURRENCY: "ETB";
    readonly FISCAL_YEAR_START: 7;
    readonly GRADUATE_TAX_MIN_RATE: 0.1;
    readonly GRADUATE_TAX_BOARDING_PCT: 1;
    readonly GRADUATE_TAX_TUITION_MIN: 0.15;
    readonly ADVANCE_BIT_RATE: 0.03;
    readonly COMESA_RATE_REDUCTION: 0.1;
    readonly TP_DOCUMENTATION_THRESHOLD: 500000;
    readonly TAC_DEPOSIT_PCT: 0.5;
    readonly HIGH_COURT_DEPOSIT_PCT: 0.75;
    readonly THIN_CAP_RATIO: 2;
    readonly FOREIGN_CREDIT_YEARS: 2;
    readonly LOSS_CARRY_FORWARD_YEARS: 5;
    readonly LOSS_CONSECUTIVE_MAX: 2;
};
export declare const PIT_BRACKETS_2025: readonly [{
    readonly min: 0;
    readonly max: 2000;
    readonly rate: 0;
    readonly deduction: 0;
}, {
    readonly min: 2001;
    readonly max: 4000;
    readonly rate: 0.15;
    readonly deduction: 300;
}, {
    readonly min: 4001;
    readonly max: 7000;
    readonly rate: 0.2;
    readonly deduction: 500;
}, {
    readonly min: 7001;
    readonly max: 10000;
    readonly rate: 0.25;
    readonly deduction: 850;
}, {
    readonly min: 10001;
    readonly max: 14000;
    readonly rate: 0.3;
    readonly deduction: 1350;
}, {
    readonly min: 14001;
    readonly max: number;
    readonly rate: 0.35;
    readonly deduction: 2050;
}];
export declare const PIT_BRACKETS_2016: readonly [{
    readonly min: 0;
    readonly max: 600;
    readonly rate: 0;
    readonly deduction: 0;
}, {
    readonly min: 601;
    readonly max: 1650;
    readonly rate: 0.1;
    readonly deduction: 60;
}, {
    readonly min: 1651;
    readonly max: 3200;
    readonly rate: 0.15;
    readonly deduction: 142.5;
}, {
    readonly min: 3201;
    readonly max: 5250;
    readonly rate: 0.2;
    readonly deduction: 302.5;
}, {
    readonly min: 5251;
    readonly max: 7800;
    readonly rate: 0.25;
    readonly deduction: 565;
}, {
    readonly min: 7801;
    readonly max: 10900;
    readonly rate: 0.3;
    readonly deduction: 955;
}, {
    readonly min: 10901;
    readonly max: number;
    readonly rate: 0.35;
    readonly deduction: 1500;
}];
export declare const PIT_BRACKETS: readonly [{
    readonly min: 0;
    readonly max: 2000;
    readonly rate: 0;
    readonly deduction: 0;
}, {
    readonly min: 2001;
    readonly max: 4000;
    readonly rate: 0.15;
    readonly deduction: 300;
}, {
    readonly min: 4001;
    readonly max: 7000;
    readonly rate: 0.2;
    readonly deduction: 500;
}, {
    readonly min: 7001;
    readonly max: 10000;
    readonly rate: 0.25;
    readonly deduction: 850;
}, {
    readonly min: 10001;
    readonly max: 14000;
    readonly rate: 0.3;
    readonly deduction: 1350;
}, {
    readonly min: 14001;
    readonly max: number;
    readonly rate: 0.35;
    readonly deduction: 2050;
}];
export type PitBracketSet = typeof PIT_BRACKETS_2025 | typeof PIT_BRACKETS_2016;
export interface PITResult {
    grossSalary: number;
    pensionEmployee: number;
    taxableIncome: number;
    incomeTax: number;
    pensionEmployer: number;
    drrf: number;
    netSalary: number;
    effectiveRate: number;
}
/** CamelCase alias consumed by frontend / ui packages. */
export type PitResult = PITResult;
/**
 * Compute Ethiopian Pay-As-You-Earn (PAYE) for a single employee.
 * @param grossSalary           Monthly gross earnings (ETB)
 * @param pensionRate          Employee pension rate (default 7% — Proc. 1268/2023)
 * @param employerPensionRate  Employer pension rate (default 11%)
 * @param brackets             Optional bracket set (defaults to PIT_BRACKETS)
 */
export declare function calculatePIT(grossSalary: number, pensionRate?: number, employerPensionRate?: number, brackets?: PitBracketSet): PITResult;
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 200;
};
export declare const BUSINESS_MODULE_MAP: Record<string, string[]>;
export declare const DATE_FORMAT = "yyyy-MM-dd";
export declare const DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
export declare const DISPLAY_DATE = "dd MMM yyyy";
export declare const UPLOAD: {
    readonly MAX_SIZE_MB: 10;
    readonly ALLOWED_IMAGES: readonly ["image/jpeg", "image/png", "image/webp"];
    readonly ALLOWED_DOCS: readonly ["application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
};
export declare const CACHE_TTL: {
    readonly SHORT: 30;
    readonly MEDIUM: 300;
    readonly LONG: 3600;
    readonly DAY: 86400;
};
export declare const WS_EVENTS: {
    readonly ATTENDANCE_UPDATE: "attendance:update";
    readonly NOTIFICATION_NEW: "notification:new";
    readonly PAYROLL_GENERATED: "payroll:generated";
    readonly INVOICE_PAID: "invoice:paid";
    readonly DASHBOARD_REFRESH: "dashboard:refresh";
    readonly PRESENCE_UPDATE: "presence:update";
};
export declare const MOR_PORTALS: {
    /** Ministry of Revenue Online e-Tax — domestic tax filings and taxpayer accounts */
    readonly ETAX: {
        readonly label: "MoR Online e-Tax";
        readonly url: "https://etax.erca.gov.et";
        readonly api: "https://api.etax.erca.gov.et";
        readonly description: "VAT, PAYE, WHT, BIT, TOT, DRRF — all domestic tax declarations";
    };
    /** Tax Administration Support System — SRM management, vehicle verification, declarations */
    readonly TASS: {
        readonly label: "Tax Administration Support System (TASS)";
        readonly url: "https://tass.mor.gov.et";
        readonly description: "Sales device (SRM/EFD) registration, vehicle tax verification, declaration submission";
    };
    /** Ethiopia Customs Trade Portal — e-SADs, e-Manifests, tariff engine, tax simulator */
    readonly CUSTOMS: {
        readonly label: "Ethiopia Customs Trade Portal";
        readonly url: "https://trade.gov.et";
        readonly api: "https://api.trade.gov.et";
        readonly description: "e-SADs, e-Manifests, HS Tariff search, Import Tax Simulator, ASYCUDA World";
    };
    /** Ministry of Revenue Official Site */
    readonly MOR_OFFICIAL: {
        readonly label: "Ministry of Revenue Official Site";
        readonly url: "https://www.mor.gov.et";
        readonly contact: "+251 116 62 64 35";
        readonly email: "info@mor.gov.et";
        readonly description: "Tax legislation, forms, regional office locator";
    };
    /** Ethiopian Customs Commission */
    readonly ECC_OFFICIAL: {
        readonly label: "Ethiopian Customs Commission";
        readonly url: "https://customs.gov.et";
        readonly description: "Customs procedures, tariff schedules, trade statistics";
    };
    /** ASYCUDA World Ethiopia */
    readonly ASYCUDA: {
        readonly label: "ASYCUDA World Ethiopia";
        readonly url: "https://asycuda.et";
        readonly description: "Customs declaration status and clearance tracking";
    };
    /** Regional Tax Centre Locator */
    readonly REGIONAL: {
        readonly label: "Find Your Regional Tax Centre";
        readonly url: "https://www.mor.gov.et/branches";
        readonly description: "Locate your assigned MoR branch for in-person inquiries and account issues";
    };
    /** ESLSE — Ethiopian Shipping and Logistics Services Enterprise */
    readonly ESLSE: {
        readonly label: "ESLSE Sea-Freight Tracking";
        readonly url: "https://www.eslse.et";
        readonly description: "Track sea-freight shipments via Ethiopian Shipping and Logistics";
    };
    /** Ethiopian Airlines Cargo */
    readonly EAL_CARGO: {
        readonly label: "Ethiopian Airlines Cargo Tracking";
        readonly url: "https://www.ethiopianairlines.com/aa/cargo/track-shipment";
        readonly description: "Air-freight AWB tracking";
    };
};
export type MorPortalKey = keyof typeof MOR_PORTALS;
export declare const MOR_DEADLINES: {
    /** VAT / TOT / WHT — 30th of the following month (Proclamation 1341/2024) */
    readonly MONTHLY_RETURN_DAY: 30;
    /** PAYE — last day of the following month (Proclamation 1395/2025) */
    readonly PAYE_DUE_DAY: 30;
    /** Pension remittance → PFSA — 30th of following month */
    readonly PENSION_DUE_DAY: 30;
    /** BIT annual declaration — November 7 of the following year */
    readonly BIT_ANNUAL_MONTH: 11;
    readonly BIT_ANNUAL_DAY: 7;
    /** DRRF quarterly levy — 15th of last month of the quarter */
    readonly DRRF_QUARTERLY_DAY: 15;
    readonly DRRF_QUARTER_END_MONTHS: readonly [3, 6, 9, 12];
    /** Schedule D final withholding — 30 days after month-end or 2 months after transaction */
    readonly SCHEDULE_D_MONTHLY_DAYS: 30;
    readonly SCHEDULE_D_TRANSACTION_MONTHS: 2;
    /** Graduate Tax (Higher Education Cost Sharing) — monthly with PAYE */
    readonly GRADUATE_TAX_DUE_DAY: 30;
    /** Capital gains tax — within 2 months of disposal */
    readonly CAPITAL_GAINS_DUE_MONTHS: 2;
    /** Customs duties — at time of clearance from customs area */
    readonly CUSTOMS_DUE: "AT_CLEARANCE";
    /** Excise tax on local production — within 30 days of production */
    readonly EXCISE_LOCAL_DAYS: 30;
};
export declare const MOR_THRESHOLDS: {
    /** Category A: annual gross income ≥ ETB 1,000,000 (bodies) */
    readonly CATEGORY_A_ETB: 1000000;
    /** Category B: ETB 500,000 – ETB 999,999 */
    readonly CATEGORY_B_MIN_ETB: 500000;
    readonly CATEGORY_B_MAX_ETB: 999999;
    /** Category C: < ETB 500,000 */
    readonly CATEGORY_C_MAX_ETB: 499999;
    /** VAT mandatory registration threshold (Regulation 570/2025) */
    readonly VAT_REGISTRATION_ETB: 2000000;
    /** TOT applies when annual revenue < ETB 2M (same as VAT threshold) */
    readonly TOT_MAX_REVENUE_ETB: 2000000;
    /** Transfer pricing documentation required (Directive 2015) */
    readonly TP_DOC_THRESHOLD_ETB: 500000;
    /** WHT goods threshold (≥ ETB 10,000) */
    readonly WHT_GOODS_THRESHOLD_ETB: 10000;
    /** WHT services threshold (≥ ETB 500) */
    readonly WHT_SERVICE_THRESHOLD_ETB: 500;
};
export declare const COMESA_MEMBERS: readonly ["BI", "KM", "CD", "DJ", "EG", "ER", "ET", "SZ", "KE", "LY", "MG", "MW", "MU", "RW", "SC", "SD", "SO", "TN", "UG", "ZM", "ZW"];
export declare const COMESA_FTA_MEMBERS: readonly ["DJ", "KE", "MG", "MW", "MU", "SD", "ZM", "ZW", "BI", "RW"];
export type ComesaMember = typeof COMESA_MEMBERS[number];
//# sourceMappingURL=constants.d.ts.map