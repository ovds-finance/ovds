import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import toastsData from './i18n/toasts.json';
import ovdsData from './i18n/ovds.json';
import hrData from './i18n/hr.json';
import taxData from './i18n/tax.json';
import navData from './i18n/nav.json';
import commonData from './i18n/common.json';
import ifrsData from './i18n/ifrs.json';
import bizRegData from './i18n/business-registration.json';

// Base translation data — built from domain-specific files (no monolithic i18n.json)
// Note: translationData is intentionally empty; all translations come from domain files below.

// Deep merge helper — target keys win over source
function deepMerge(base: any, override: any): any {
  const result = { ...base };
  for (const key of Object.keys(override ?? {})) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      typeof base[key] === 'object' &&
      base[key] !== null
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

const data = {} as any;

// Build the canonical English translation from domain files
const enBase: Record<string, any> = {};

// Merge toasts into each language's translation namespace
const toasts = toastsData as any;
const enToasts: Record<string, any> = deepMerge(toasts, toasts.en ?? {});

// Domain-specific translation files — merge into base
const ovds = ovdsData as any;
const enovds: Record<string, any> = deepMerge(ovds, ovds.en ?? {});

const hr = hrData as any;
const enHr: Record<string, any> = deepMerge(hr, hr.en ?? {});

const tax = taxData as any;
const enTax: Record<string, any> = deepMerge(tax, tax.en ?? {});

const nav = navData as any;
const enNav: Record<string, any> = deepMerge(nav, nav.en ?? {});

const common = commonData as any;
const enCommon: Record<string, any> = deepMerge(common, common.en ?? {});

const ifrs = ifrsData as any;
const enIfrs: Record<string, any> = deepMerge(ifrs, ifrs.en ?? {});

const bizReg = bizRegData as any;
const enBizReg: Record<string, any> = deepMerge(bizReg, bizReg.en ?? {});

// Build a merged English base that includes all domain files.
// Called once eagerly — English is always needed.
function buildEnBase(): Record<string, any> {
  let base = deepMerge(enBase, enToasts);
  // Merge ovds domain (ovds.invoices, ovds.bills, ovds.items)
  base = deepMerge(base, { ovds: enovds });
  // Merge HR domain (nested under hr.*)
  base = deepMerge(base, { hr: enHr });
  // Also hoist HR sub-domains to top level so t('employees.*'), t('payroll.*'), etc. resolve
  base = deepMerge(base, {
    employees: enHr.employees,
    payroll: enHr.payroll,
    attendance: enHr.attendance,
    leaves: enHr.leaves,
    departments: enHr.departments,
    shifts: enHr.shifts,
    holidays: enHr.holidays,
  });
  // Merge tax domain (vat, drrf, bit, compliance)
  base = deepMerge(base, enTax);
  // Merge nav domain (nav.domains, nav.items, nav.groups, nav.items_ext)
  base = deepMerge(base, { nav: enNav });
  // Hoist mobile_nav to top level so t('mobile_nav.*') resolves
  base = deepMerge(base, { mobile_nav: enNav.mobile_nav ?? {} });
  // Merge common domain (layout, shared UI keys)
  base = deepMerge(base, enCommon);
  // Merge IFRS domain
  base = deepMerge(base, { ifrs: enIfrs });
  // Merge business registration domain
  base = deepMerge(base, enBizReg);
  return base;
}

// Build a merged translation for a non-English locale.
// Called lazily on first languageChanged event — NOT at startup.
function buildLangBase(langKey: string): Record<string, any> {
  const langovds = deepMerge(enovds, ovds[langKey] ?? {});
  const langHr = deepMerge(enHr, hr[langKey] ?? {});
  const langTax = deepMerge(enTax, tax[langKey] ?? {});
  const langNav = deepMerge(enNav, nav[langKey] ?? {});
  const langCommon = deepMerge(enCommon, common[langKey] ?? {});
  const langIfrs = deepMerge(enIfrs, ifrs[langKey] ?? {});
  let base = deepMerge(buildEnBase(), deepMerge(liftFlatNavToItems(data[langKey] ?? {}), toasts[langKey] ?? {}));
  base = deepMerge(base, { ovds: langovds });
  base = deepMerge(base, { hr: langHr });
  // Also hoist HR sub-domains to top level for the language
  base = deepMerge(base, {
    employees: langHr.employees,
    payroll: langHr.payroll,
    attendance: langHr.attendance,
    leaves: langHr.leaves,
    departments: langHr.departments,
    shifts: langHr.shifts,
    holidays: langHr.holidays,
  });
  base = deepMerge(base, langTax);
  // Merge nav domain (nav.domains, nav.items, nav.groups, nav.items_ext)
  base = deepMerge(base, { nav: langNav });
  // Hoist mobile_nav to top level for the language
  base = deepMerge(base, { mobile_nav: langNav.mobile_nav ?? enNav.mobile_nav ?? {} });
  base = deepMerge(base, langCommon);
  base = deepMerge(base, { ifrs: langIfrs });
  const langBizReg = deepMerge(enBizReg, bizReg[langKey] ?? {});
  base = deepMerge(base, langBizReg);
  return base;
}

/**
 * The am/ti sections have a mixed "nav" object: they have a structured
 * nav.domains sub-object but all the nav item labels (employees, invoices,
 * etc.) sit as flat keys directly on nav rather than under nav.items.
 *
 * This function lifts those flat keys into nav.items so that
 * t('nav.items.X') resolves correctly in all languages.
 *
 * Detection: if nav.items is NOT an object (it's a string like "ዕቃዎች"
 * or missing entirely), we need to lift — regardless of whether nav.domains
 * exists.
 */
function liftFlatNavToItems(langData: any): any {
  const flatNav = langData?.nav;
  if (!flatNav) return langData;

  // If nav.items is already a proper object (structured nav), no lift needed
  if (flatNav.items && typeof flatNav.items === 'object' && !Array.isArray(flatNav.items)) {
    return langData;
  }

  // Mixed / flat nav — separate domains from item labels, then nest item labels
  // under nav.items. Keep nav.domains in place.
  const { domains, ...flatItems } = flatNav;
  return {
    ...langData,
    nav: {
      ...(domains ? { domains } : {}),
      items: flatItems,
    },
  };
}

// Track which non-English locales have been loaded to avoid rebuilding them
// on every languageChanged event (e.g. toggling between am and ti).
const loadedLocales = new Set<string>(['en']);

// Non-English locales supported by this app.
const SUPPORTED_LOCALES = ['am', 'ti'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(lang: string): lang is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(lang);
}

/**
 * Lazily add a locale's resource bundle to i18n the first time it is
 * requested. Subsequent calls for the same locale are no-ops.
 */
function loadLocale(lang: string): void {
  if (loadedLocales.has(lang)) return;
  if (!isSupportedLocale(lang)) return;

  i18n.addResourceBundle(lang, 'translation', buildLangBase(lang), true, true);
  loadedLocales.add(lang);
}

// Init with English only — am/ti are loaded on first use.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: buildEnBase() },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'translation',
    ns: ['translation'],
    keySeparator: '.',
    nsSeparator: ':',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Listen for language switches and lazily materialise the locale tree.
// This fires when the app changes language AND when LanguageDetector
// restores a saved locale from localStorage on page load.
i18n.on('languageChanged', (lang: string) => {
  loadLocale(lang);
});

// Pre-warm the detected locale immediately after init if it's non-English.
// i18n.language may already be set by LanguageDetector before languageChanged fires.
const detectedLang = i18n.language ?? '';
const baseLang = detectedLang.split('-')[0]; // normalise 'am-ET' → 'am'
loadLocale(baseLang);

export default i18n;
