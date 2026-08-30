/**
 * Maps an i18next language code to the best available browser locale string.
 *
 * Tigrinya (ti-ET) has very limited browser support for Intl APIs, so we
 * fall back to am-ET (Amharic/Ethiopia) which shares the same calendar and
 * number system. English always uses en-US.
 */
export const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-US',
  am: 'am-ET',
  ti: 'am-ET', // ti-ET not widely supported; am-ET is the closest Ethiopian locale
};

/**
 * Returns the best Intl locale string for the given i18next language code.
 * Falls back to 'en-US' for unknown codes.
 */
export function getLocale(lang: string): string {
  const code = lang?.split('-')[0] ?? 'en';
  return LANG_TO_LOCALE[code] ?? 'en-US';
}

