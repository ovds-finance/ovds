import { Globe, Check } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

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
      <div
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-150 ${className}`}
        style={{
          background:  'var(--surface)',
          border:      '1px solid var(--border)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--pro-azure-100)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <Globe size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
        <select
          value={currentLang.code}
          onChange={e => handleChange(e.target.value)}
          className="bg-transparent border-none text-[11px] font-semibold focus:ring-0 cursor-pointer outline-none"
          style={{ color: 'var(--text-2)' }}
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
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)')}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
        aria-label={`Language: ${currentLang.label}`}
        title={`Language: ${currentLang.label}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Globe size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 z-[200] overflow-hidden"
          style={{
            background:   'var(--surface)',
            border:       '1px solid var(--border)',
            borderRadius: 8,
            boxShadow:    '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
            animation:    'aki-enter 150ms cubic-bezier(0.16,1,0.3,1) both',
          }}
          role="menu"
        >
          {/* Header */}
          <div
            className="px-3 py-2"
            style={{ borderBottom: '1px solid var(--border-alt)' }}
          >
            <p
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: 'var(--text-5)' }}
            >
              Language
            </p>
          </div>

          {/* Options */}
          <div className="py-1">
            {LANGUAGES.map(lang => {
              const isActive = currentLang.code === lang.code;
              return (
                <button
                  key={lang.code}
                  role="menuitem"
                  onClick={() => handleChange(lang.code)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-100 focus-visible:outline-none"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-subtle)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-semibold truncate"
                      style={{ color: 'var(--text)' }}
                    >
                      {lang.nativeLabel}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: 'var(--text-4)' }}
                    >
                      {lang.label}
                    </p>
                  </div>
                  {isActive && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'var(--pro-azure)', color: '#fff' }}
                    >
                      <Check size={9} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

