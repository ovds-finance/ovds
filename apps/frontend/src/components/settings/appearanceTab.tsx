import { CheckCircle2, Monitor, Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { getStoredTheme, setStoredTheme, type ThemePreference } from '../../utils/storage';

interface Props { canWrite: boolean; }

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; color?: string }> = ({
  checked, onChange, disabled, color = 'bg-[var(--pro-azure-50)]0',
}) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]/30 disabled:opacity-50 ${checked ? color : 'bg-slate-200 dark:bg-slate-700'}`}>
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const SL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1 h-4 rounded-full bg-[var(--pro-azure-50)]0 shrink-0" />
    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{children}</p>
  </div>
);

const DENSITY_OPTIONS = [
  { id: 'comfortable', label: 'Comfortable', desc: 'More spacing, easier to read', preview: 'py-3' },
  { id: 'compact',     label: 'Compact',     desc: 'Tighter spacing, more content', preview: 'py-1.5' },
  { id: 'cozy',        label: 'Cozy',        desc: 'Balanced — default', preview: 'py-2' },
];

const FONT_SIZE_OPTIONS = [
  { id: 'sm',   label: 'Small',   cls: 'text-xs' },
  { id: 'base', label: 'Default', cls: 'text-sm' },
  { id: 'lg',   label: 'Large',   cls: 'text-base' },
];

const SIDEBAR_WIDTH_OPTIONS = [
  { id: 'narrow',  label: 'Narrow',  px: '200px' },
  { id: 'default', label: 'Default', px: '240px' },
  { id: 'wide',    label: 'Wide',    px: '280px' },
];

const AppearanceTab: React.FC<Props> = ({ canWrite }) => {
  // Reads/writes THEME_KEY — the same key main.tsx reads before first paint.
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme());
  const [density, setDensity] = useState(() => localStorage.getItem('ovds_density') ?? 'cozy');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('ovds_font_size') ?? 'base');
  const [sidebarWidth, setSidebarWidth] = useState(() => localStorage.getItem('ovds_sidebar_width') ?? 'default');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem('ovds_animations') !== 'false');
  const [compactTables, setCompactTables] = useState(() => localStorage.getItem('ovds_compact_tables') === 'true');
  const [showAvatars, setShowAvatars] = useState(() => localStorage.getItem('ovds_show_avatars') !== 'false');
  const [stickyHeader, setStickyHeader] = useState(() => localStorage.getItem('ovds_sticky_header') !== 'false');
  const [saving, setSaving] = useState(false);

  // Apply theme immediately
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark'); else root.classList.remove('dark');
    }
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    setStoredTheme(theme);
    localStorage.setItem('ovds_density', density);
    localStorage.setItem('ovds_font_size', fontSize);
    localStorage.setItem('ovds_sidebar_width', sidebarWidth);
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
    localStorage.setItem('ovds_animations', String(animationsEnabled));
    localStorage.setItem('ovds_compact_tables', String(compactTables));
    localStorage.setItem('ovds_show_avatars', String(showAvatars));
    localStorage.setItem('ovds_sticky_header', String(stickyHeader));
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    toast.success('Appearance preferences saved');
  };

  const THEME_OPTIONS = [
    { id: 'light',  label: 'Light',  icon: <Sun size={16} /> },
    { id: 'dark',   label: 'Dark',   icon: <Moon size={16} /> },
    { id: 'system', label: 'System', icon: <Monitor size={16} /> },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Theme */}
      <div><SL>Theme</SL>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${theme === t.id ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === t.id ? 'bg-[var(--pro-azure)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {t.icon}
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{t.label}</span>
              {theme === t.id && <CheckCircle2 size={10} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div><SL>Content Density</SL>
        <div className="grid grid-cols-3 gap-2">
          {DENSITY_OPTIONS.map(d => (
            <button key={d.id} onClick={() => setDensity(d.id)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${density === d.id ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
              <div className="space-y-0.5 mb-2">
                {[1,2,3].map(i => (
                  <div key={i} className={`bg-slate-200 dark:bg-slate-700 rounded w-full`} style={{ height: d.id === 'compact' ? '4px' : d.id === 'comfortable' ? '8px' : '6px' }} />
                ))}
              </div>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{d.label}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div><SL>Font Size</SL>
        <div className="flex gap-1.5">
          {FONT_SIZE_OPTIONS.map(f => (
            <button key={f.id} onClick={() => setFontSize(f.id)}
              className={`flex-1 py-2 rounded-lg border-2 transition-all ${fontSize === f.id ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
              <span className={`font-bold text-slate-700 dark:text-slate-200 ${f.cls}`}>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar width */}
      <div><SL>Sidebar Width</SL>
        <div className="flex gap-1.5">
          {SIDEBAR_WIDTH_OPTIONS.map(s => (
            <button key={s.id} onClick={() => setSidebarWidth(s.id)}
              className={`flex-1 py-2 rounded-lg border-2 transition-all ${sidebarWidth === s.id ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{s.label}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{s.px}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div>
        <SL>Interface Options</SL>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {[
            { key: 'sidebarCollapsed', label: 'Start with sidebar collapsed',  hint: 'Sidebar shows icon-only on load', value: sidebarCollapsed, set: setSidebarCollapsed },
            { key: 'animationsEnabled', label: 'Enable animations',            hint: 'Page transitions and micro-animations', value: animationsEnabled, set: setAnimationsEnabled },
            { key: 'compactTables',    label: 'Compact table rows',            hint: 'Reduce row height in data tables', value: compactTables, set: setCompactTables },
            { key: 'showAvatars',      label: 'Show user avatars',             hint: 'Display role gradient avatars in header', value: showAvatars, set: setShowAvatars },
            { key: 'stickyHeader',     label: 'Sticky page header',            hint: 'Keep page header visible while scrolling', value: stickyHeader, set: setStickyHeader },
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{opt.label}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{opt.hint}</p>
              </div>
              <Toggle checked={opt.value} onChange={opt.set} />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-1">
        <p className="ovds-caption">Preferences stored locally in your browser</p>
        <button onClick={handleSave} disabled={saving || !canWrite}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--pro-azure)] text-white rounded text-[11px] font-semibold hover:bg-[var(--pro-azure-dark)] transition-all disabled:opacity-60">
          {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={12} />}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default AppearanceTab;







