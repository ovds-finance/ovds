import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Keeps the <html lang> attribute in sync with the active i18next language,
 * and syncs language changes across browser tabs via localStorage events.
 *
 * Mount once at the app root (Layout.tsx).
 *
 * This is required for:
 * - Screen readers to announce content in the correct language
 * - Browsers to apply correct hyphenation / font shaping
 * - WCAG 2.1 SC 3.1.1 (Language of Page)
 */
export function useLangSync(): void {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Sync <html lang> attribute
    const syncHtmlLang = (lng: string) => {
      const code = lng.split('-')[0]; // normalise e.g. "en-US" → "en"
      document.documentElement.setAttribute('lang', code);
    };

    // Sync immediately on mount
    syncHtmlLang(i18n.language);

    // Keep in sync on every language change
    i18n.on('languageChanged', syncHtmlLang);

    // Cross-tab sync: when another tab changes the language via localStorage,
    // pick it up here so all tabs stay in sync without a page reload.
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'i18nextLng' && e.newValue && e.newValue !== i18n.language?.split('-')[0]) {
        i18n.changeLanguage(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      i18n.off('languageChanged', syncHtmlLang);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [i18n]);
}

