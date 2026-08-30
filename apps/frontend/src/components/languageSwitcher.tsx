import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { useClickOutside } from '../hooks';

interface Language {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'English',  nativeLabel: 'English',  flag: '🇬🇧' },
  { code: 'am', label: 'Amharic',  nativeLabel: 'አማርኛ',    flag: '🇪🇹' },
  { code: 'ti', label: 'Tigrinya', nativeLabel: 'ትግርኛ',    flag: '🇪🇹' },
];

interface LanguageSwitcherProps {
  /** 'dropdown' (default) renders a pill button with a popover menu.
   *  'select' renders a plain <select> element (used on Login / EntryPortal). */
  variant?: 'dropdown' | 'select';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  const currentLang = LANGUAGES.find(l => l.code === i18n.language?.split('-')[0]) ?? LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setOpen(false);
  };

  // -- Plain select variant (Login / Register / EntryPortal) ----------------
  if (variant === 'select') {
    return (
      <div className={`flex items-center gap-1.5 bg-white border border-gray-200 hover:border-emerald-300 rounded-lg px-2.5 py-1.5 transition-all duration-150 ${className}`}>
        <Globe size={13} className="text-gray-400 shrink-0" />
        <select
          value={currentLang.code}
          onChange={e => handleChange(e.target.value)}
          className="bg-transparent border-none text-[11px] font-semibold text-gray-600 focus:ring-0 cursor-pointer outline-none"
          aria-label="Select language"
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.nativeLabel}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // -- Dropdown variant (Header) ---------------------------------------------
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label={`Language: ${currentLang.label}`}
        title={`Language: ${currentLang.label}`}
      >
        <Globe size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Language</p>
          </div>
          <div className="py-1">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{lang.nativeLabel}</p>
                  <p className="ovds-caption">{lang.label}</p>
                </div>
                {currentLang.code === lang.code && (
                  <Check size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

