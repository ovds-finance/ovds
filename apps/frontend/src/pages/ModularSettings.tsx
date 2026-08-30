import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useBlocker } from 'react-router-dom';
import { Skeleton, GridHero, ContextStrip, ContextPill, Modal } from '@ovds/ui';
import { settingsCatalogApi } from '@ovds/features/settings';
import api from '../services/api';
import { setupApi, type CompanySetupProgress, type SetupStepDefinition } from '../services/setupApi';
import { moduleManagerApi } from '@ovds/features/appstore';  
import toast from 'react-hot-toast';
import { useAuth } from '../rbac';
import { useBusiness } from '../context/businessContext';
import type { SettingCategory } from '@ovds/shared';
import {
  Settings2, Save, Search, RefreshCw, ArrowRight,
  CheckCircle2, AlertTriangle, Eye, EyeOff, ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

// SettingCategory as returned by the catalog API includes enriched settings/groups
type EnrichedSettingCategory = SettingCategory & {
  settings?: Array<{
    id: string; key: string; groupId?: string; type: string;
    defaultValue?: string; placeholder?: string; hint?: string; options?: string;
    isRequired?: boolean;
  }>;
};

interface SystemModule {
  id: string; name: string; displayName: string; version: string;
  description: string | null; isCore: boolean; category: string | null;
  isEnabled: boolean; activatedAt: Date | null;
}

// ── Primitive components ───────────────────────────────────────────────────────

type ToggleProps = { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean };
const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled }) => (
  <button
    type="button" role="switch" aria-checked={checked} disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed ${checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
  >
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const Field: React.FC<{ label: string; hint?: string; required?: boolean; children: React.ReactNode }> = ({ label, hint, required, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 leading-relaxed">{hint}</p>}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all";


const ModularSettings: React.FC = () => {
  const { can, user } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const canWrite = can('settings:write');
  const canApps = can('apps:write');
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<EnrichedSettingCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabSearch, setTabSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [profileSnapshot, setProfileSnapshot] = useState<any>(null);
  const [wizardProgress, setWizardProgress] = useState<CompanySetupProgress | null>(null);
  const [wizardStepDefs, setWizardStepDefs] = useState<SetupStepDefinition[]>([]);
  const [wizardLoading, setWizardLoading] = useState(false);
  // Modules tab
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);
  // Password reveal per-field
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Use selectedCompanyId from business context, fall back to user.companyId
  const companyId = selectedCompanyId || user?.companyId;

  // Navigation guard — warn before leaving with unsaved changes
  useBlocker(
    useCallback(({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
        ? !window.confirm('You have unsaved changes. Leave without saving?')
        : false,
    [isDirty]),
  );

  // ── Load categories ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cats = await settingsCatalogApi.categories.list() as EnrichedSettingCategory[];
        setCategories(cats ?? []);
        const firstCat = cats?.[0]?.key ?? '';
        const urlCat = searchParams.get('category');
        const validated = urlCat && cats.some((c: EnrichedSettingCategory) => c.key === urlCat) ? urlCat : firstCat;
        setActiveCategory(validated);
      } catch { toast.error('Failed to load settings'); }
      finally { setLoading(false); }
    })();
  }, [searchParams]);

  // ── Load company profile snapshot ────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/settings/profile/${companyId}`);
        const payload = res?.data?.data ?? res?.data;
        if (!cancelled) setProfileSnapshot(payload);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  // ── Load wizard progress + step definitions ──────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!companyId) return;
      setWizardLoading(true);
      try {
        const [progress, stepDefs] = await Promise.all([
          setupApi.getProgress(companyId),
          setupApi.listSteps(),
        ]);
        setWizardProgress(progress);
        setWizardStepDefs(stepDefs);
      } catch { /* ignore */ }
      finally { setWizardLoading(false); }
    })();
  }, [companyId]);

  // ── Load settings values whenever active category changes ────────────────────
  useEffect(() => {
    (async () => {
      if (!activeCategory) return;
      try {
        const values = await settingsCatalogApi.values.list(companyId);
        const obj: Record<string, string> = {};
        for (const k of Object.keys(values)) obj[k] = values[k].value;
        setSettings(obj);
        setIsDirty(false);
      } catch { /* ignore */ }
    })();
  }, [activeCategory, companyId]);

  // ── Load system modules when modules category is active ──────────────────────
  useEffect(() => {
    if (activeCategory !== 'modules' && activeSection !== 'modules') return;
    (async () => {
      setModulesLoading(true);
      try {
        const mods = await moduleManagerApi.list(companyId);
        setModules(mods ?? []);
      } catch { /* ignore */ }
      finally { setModulesLoading(false); }
    })();
  }, [activeCategory, activeSection, companyId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    if (!isDirty || !canWrite) return;
    setSaving(true);
    try {
      await settingsCatalogApi.values.bulkUpdate(settings, companyId);
      setIsDirty(false);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleSectionSave = async (section: string) => {
    if (!canWrite || !companyId) return;
    setSaving(true);
    try {
      const prefixMap: Record<string, string> = {
        profile: 'company_', localization: '', financial: '', taxes: '', modules: 'module_',
      };
      const prefix = prefixMap[section] ?? '';
      const sectionCfg = profileSections.find(s => s.key === section);
      if (!sectionCfg) { toast.error('Nothing to save in this section'); return; }
      const allowed = new Set(sectionCfg.fields.map((f: string) => prefix ? `${prefix}${f}` : f));
      const payload: Record<string, string> = {};
      for (const k of Object.keys(settings)) {
        if (allowed.has(k)) payload[prefix ? k.slice(prefix.length) : k] = settings[k];
      }
      if (!Object.keys(payload).length) { toast.error('Nothing to save in this section'); return; }
      await api.patch(`/settings/profile/${companyId}/${section}`, payload);
      setIsDirty(false);
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} saved`);
    } catch { toast.error('Failed to save section'); }
    finally { setSaving(false); }
  };

  const handleCategoryChange = useCallback((key: string) => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    setActiveCategory(key);
    setIsDirty(false);
    setSearchParams(prev => { prev.set('category', key); return prev; }, { replace: true });
  }, [isDirty, setSearchParams]);

  const handleToggleModule = async (mod: SystemModule) => {
    if (!canApps || mod.isCore) return;
    const next = !mod.isEnabled;
    setTogglingModule(mod.name);
    try {
      await moduleManagerApi.toggle(mod.name, next);
      setModules(prev => prev.map(m => m.name === mod.name ? { ...m, isEnabled: next } : m));
      toast.success(`${mod.displayName} ${next ? 'enabled' : 'disabled'}`);
    } catch { toast.error(`Failed to toggle ${mod.displayName}`); }
    finally { setTogglingModule(null); }
  };

  const [configuringModule, setConfiguringModule] = useState<SystemModule | null>(null);
  const [moduleSettings, setModuleSettings] = useState<Record<string, string>>({});
  const [moduleSettingsDefs, setModuleSettingsDefs] = useState<any[]>([]);
  const [savingModuleSettings, setSavingModuleSettings] = useState(false);

  const handleOpenConfigure = async (mod: SystemModule) => {
    if (!mod.isEnabled) return;
    setConfiguringModule(mod);
    setModuleSettings({});
    setModuleSettingsDefs([]);
    try {
      const data = await moduleManagerApi.get(mod.name);
      if (data?.currentSettings) {
        setModuleSettings(data.currentSettings);
      } else if (data?.settings) {
        setModuleSettingsDefs(data.settings);
        const defaults: Record<string, string> = {};
        for (const s of data.settings) {
          if (typeof s.defaultValue === 'string') defaults[s.key] = s.defaultValue;
          else if (s.defaultValue !== undefined && s.defaultValue !== null) defaults[s.key] = String(s.defaultValue);
        }
        setModuleSettings(defaults);
      }
    } catch { toast.error('Failed to load module settings'); }
  };

  const handleSaveModuleSettings = async () => {
    if (!configuringModule || !companyId) return;
    setSavingModuleSettings(true);
    try {
      await moduleManagerApi.configure(configuringModule.name, companyId, moduleSettings);
      toast.success('Module settings saved');
      setConfiguringModule(null);
    } catch { toast.error('Failed to save module settings'); }
    finally { setSavingModuleSettings(false); }
  };

  // ── Derived data ──────────────────────────────────────────────────────────────

  const activeCategoryData = useMemo(
    () => categories.find((c: EnrichedSettingCategory) => c.key === activeCategory),
    [categories, activeCategory],
  );

  const filteredCategories = useMemo(() => {
    if (!tabSearch.trim()) return categories;
    const q = tabSearch.toLowerCase();
    return categories.filter((c: EnrichedSettingCategory) =>
      c.name.toLowerCase().includes(q) || c.key.toLowerCase().includes(q),
    );
  }, [categories, tabSearch]);

  const profileSections = useMemo(() => ([
    { key: 'profile',      label: 'Profile',      fields: ['companyName','companyEmail','companyPhone','companyAddress','companyTin','companyVatNumber','companyBusinessType','companyLogoUrl'] },
    { key: 'localization', label: 'Localization',  fields: ['language','timezone','dateFormat','decimalSeparator','thousandsSeparator'] },
    { key: 'financial',    label: 'Financial',     fields: ['defaultCurrency','currencyPosition','currencyRateProvider','currencyAutoUpdate','fiscalYearStart','reportCurrency'] },
    { key: 'taxes',        label: 'Taxes',         fields: ['vatEnabled','vatRate','totEnabled','whtEnabled','bitEnabled','pitEnabled','drrfEnabled'] },
    { key: 'modules',      label: 'Modules',       fields: ['invoice','accounting','banking','expenses','payroll','projects','inventory','crm','vat','bit','pit','drrf','ifrs','manufacturing','treasury','notifications','api'] },
  ]), []);

  // ── Input renderer ────────────────────────────────────────────────────────────

  const renderInput = (def: NonNullable<EnrichedSettingCategory['settings']>[number]) => {
    const value = settings[def.key] ?? def.defaultValue ?? '';

    switch (def.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={e => updateSetting(def.key, e.target.value)}
            disabled={!canWrite}
            className={inputCls}
            rows={3}
            placeholder={def.placeholder}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={e => updateSetting(def.key, e.target.value)}
            disabled={!canWrite}
            className={inputCls}
            placeholder={def.placeholder}
          />
        );
      case 'select': {
        let options: { label: string; value: string }[] = [];
        try { options = JSON.parse(def.options ?? '[]'); } catch { /* empty */ }
        return (
          <div className="relative">
            <select
              value={value}
              onChange={e => updateSetting(def.key, e.target.value)}
              disabled={!canWrite}
              className={inputCls + ' appearance-none pr-8 cursor-pointer'}
            >
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        );
      }
      case 'toggle':
        return (
          <div className="flex items-center gap-2.5 pt-1">
            <Toggle
              checked={value === 'true' || value === '1'}
              onChange={(v: boolean) => updateSetting(def.key, v ? 'true' : 'false')}
              disabled={!canWrite}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {value === 'true' || value === '1' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      case 'image':
        return (
          <input
            type="url"
            value={value}
            onChange={e => updateSetting(def.key, e.target.value)}
            disabled={!canWrite}
            className={inputCls}
            placeholder="https://..."
          />
        );
      case 'password': {
        const isRevealed = revealed[def.key] ?? false;
        return (
          <div className="relative">
            <input
              type={isRevealed ? 'text' : 'password'}
              value={value}
              onChange={e => updateSetting(def.key, e.target.value)}
              disabled={!canWrite}
              className={inputCls + ' pr-10'}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setRevealed(prev => ({ ...prev, [def.key]: !isRevealed }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={isRevealed ? 'Hide' : 'Show'}
            >
              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        );
      }
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={e => updateSetting(def.key, e.target.value)}
            disabled={!canWrite}
            className={inputCls}
            placeholder={def.placeholder}
          />
        );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton.Line className="h-14 rounded-xl" />
        <div className="grid gap-5" style={{ gridTemplateColumns: '260px 1fr' }}>
          <Skeleton.Line className="h-96 rounded-xl" />
          <Skeleton.Line className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No company selected</p>
        <p className="text-xs text-slate-500 mt-1">Select a company from the top bar to manage its settings.</p>
      </div>
    );
  }

  const isCompanyProfileRoute = window.location.pathname === '/settings/company-profile';

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <GridHero
        title={isCompanyProfileRoute ? 'TIN & MoR Credentials' : 'System Administration'}
        subtitle={isCompanyProfileRoute
          ? 'Company identity, tax identifiers, localization, financial parameters, and module configuration'
          : 'Configure company profile, modules, localisation and compliance'}
        crumbs={isCompanyProfileRoute
          ? [{ label: 'System Administration' }, { label: 'TIN & MoR Credentials' }]
          : [{ label: 'System Administration' }, { label: 'Modular Settings' }]}
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 rounded-lg">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                Unsaved changes
              </span>
            )}
            {canWrite && (
              <button
                onClick={activeCategory === 'company' ? () => handleSectionSave(activeSection) : handleSave}
                disabled={saving || !isDirty}
                className="ovds-btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </div>
        }
      />

      {wizardProgress && !wizardLoading && (() => {
        const completed = wizardProgress.steps.filter(s => s.status === 'completed').length;
        const total = wizardProgress.steps.length;
        const pct = Math.round(total > 0 ? (completed / total) * 100 : 0);
        // Join status entries with their definitions to access isRequired
        const defsMap = new Map(wizardStepDefs.map(d => [d.key, d]));
        const remainingRequired = wizardProgress.steps.filter(
          s => s.status !== 'completed' && defsMap.get(s.stepKey)?.isRequired === true,
        ).length;
        return (
          <div className="ovds-widget-card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pct === 100 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                  {pct === 100 ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">System Administration Setup</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {completed}/{total} steps completed ({pct}%)
                    {remainingRequired > 0 && <span className="text-amber-600 ml-2">{remainingRequired} required steps remaining</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#f59e0b' }} />
                </div>
                <Link to="/settings/setup-wizard" className="ovds-btn-secondary flex items-center gap-1.5 text-[11px]">
                  {pct === 100 ? 'View Summary' : 'Continue Setup'} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        );
      })()}
      {isCompanyProfileRoute && profileSnapshot && (
        <div className="ovds-widget-card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              {profileSnapshot.profile?.companyLogoUrl ? (
                <img src={profileSnapshot.profile.companyLogoUrl} alt="logo" className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {profileSnapshot.profile?.companyName?.charAt(0)?.toUpperCase() ?? 'O'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{profileSnapshot.profile?.companyName || 'Unnamed Company'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">TIN: {profileSnapshot.profile?.companyTin || '—'} {profileSnapshot.profile?.companyVatNumber ? `· VAT: ${profileSnapshot.profile.companyVatNumber}` : ''}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 ml-auto text-[10px] font-medium text-slate-600 dark:text-slate-400">
              <span>{profileSnapshot.localization?.language?.toUpperCase() ?? 'EN'}</span>
              <span>{profileSnapshot.financial?.defaultCurrency ?? 'ETB'}</span>
              <span className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${profileSnapshot.taxes?.vatEnabled === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`} /> VAT {profileSnapshot.taxes?.vatEnabled === 'true' ? 'ON' : 'OFF'}</span>
            </div>
          </div>
          {isCompanyProfileRoute && activeCategory === 'company' && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profileSections.map(sec => {
                const isActive = activeSection === sec.key;
                return (
                  <button key={sec.key} onClick={() => setActiveSection(sec.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {sec.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ContextStrip>
        <ContextPill leading={<Settings2 size={11} />} label={activeCategoryData?.name ?? 'Settings'} />
      </ContextStrip>

      <div className="grid gap-5" style={{ gridTemplateColumns: '260px 1fr' }}>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={tabSearch}
                  onChange={e => setTabSearch(e.target.value)}
                  placeholder="Find setting…"
                  className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-slate-200 transition-all"
                />
              </div>
            </div>
            <nav className="py-2" aria-label="Settings navigation">
              {filteredCategories.length === 0 && (
                <p className="px-4 py-3 text-[11px] text-slate-400 italic">No matching categories</p>
              )}
              {filteredCategories.map((cat: EnrichedSettingCategory) => {
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 transition-all ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm shrink-0">{cat.icon || '⚙️'}</span>
                    <span className="text-[12px] flex-1 text-left truncate">{cat.name}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ── Tab body ──────────────────────────────────────────────────────── */}
        <div className="ovds-widget-card p-6 min-w-0">

          {/* Modules category — live system module toggles */}
          {activeCategory === 'modules' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">System Modules</p>
                {modulesLoading && <RefreshCw size={12} className="animate-spin text-slate-400" />}
              </div>
              {modulesLoading && modules.length === 0 ? (
                <div className="space-y-2">
                  {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-12">
                  <Settings2 size={28} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-xs text-slate-400">No modules registered.</p>
                </div>
              ) : (
                modules.map(mod => {
                  const isToggling = togglingModule === mod.name;
                  const canToggle = canApps && !mod.isCore;
                  return (
                    <div
                      key={mod.name}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors ${
                        mod.isEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{mod.displayName}</span>
                          {mod.isCore && (
                            <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-bold uppercase tracking-wide">
                              Core
                            </span>
                          )}
                          {mod.category && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-medium">{mod.category}</span>
                          )}
                        </div>
                        {mod.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{mod.description}</p>
                        )}
                        {mod.activatedAt && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Enabled {new Date(mod.activatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 ml-4 flex items-center gap-2">
                        {isToggling ? (
                          <RefreshCw size={15} className="animate-spin text-slate-400" />
                        ) : (
                          <>
                            {mod.isEnabled && (
                              <button
                                onClick={() => handleOpenConfigure(mod)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                title="Configure module"
                              >
                                <SlidersHorizontal size={14} />
                              </button>
                            )}
                            <Toggle
                              checked={mod.isEnabled}
                              onChange={() => handleToggleModule(mod)}
                              disabled={!canToggle}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {!canApps && (
                <p className="text-[11px] text-slate-400 text-center pt-2">
                  You need <strong>apps:write</strong> permission to toggle modules.
                </p>
              )}
            </div>

          ) : activeCategoryData?.groups && activeCategoryData.groups.length > 0 ? (
            /* Catalog-driven settings groups */
            <div className="space-y-6">
              {activeCategoryData.groups.map((group: any) => {
                let groupSettings = (activeCategoryData.settings ?? []).filter((s: any) => s.groupId === group.id);
                if (isCompanyProfileRoute && activeCategory === 'company') {
                  const sectionCfg = profileSections.find(s => s.key === activeSection);
                  if (sectionCfg) {
                    const allowed = new Set(sectionCfg.fields.map((f: string) => `company_${f}`));
                    groupSettings = groupSettings.filter((s: any) => allowed.has(s.key));
                  }
                }
                if (!groupSettings.length) return null;
                const isCollapsed = collapsedGroups[group.id] ?? false;
                return (
                  <div key={group.id}>
                    {/* Group header — clickable to collapse */}
                    <button
                      type="button"
                      onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.id]: !isCollapsed }))}
                      className="w-full flex items-center gap-3 mb-4 group"
                    >
                      <div className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex-1 text-left">
                        {group.name}
                      </p>
                      <ChevronDown
                        size={12}
                        className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    </button>
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupSettings.map((def: any) => (
                          <div
                            key={def.id}
                            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                          >
                            <Field
                              label={def.key
                                .replace(/^company_/, '')
                                .replace(/^module_/, '')
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              hint={def.hint}
                              required={def.isRequired}
                            >
                              {renderInput(def)}
                            </Field>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                <Settings2 size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No settings defined here yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Use <strong>Settings Catalog</strong> to add groups and field definitions.
              </p>
            </div>
          )}

          {/* Inline save footer when dirty */}
          {isDirty && activeCategory !== 'modules' && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={activeCategory === 'company' ? () => handleSectionSave(activeSection) : handleSave}
                disabled={saving || !canWrite}
                className="ovds-btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Module configuration modal */}
          {configuringModule && (
            <Modal
              open
              onClose={() => setConfiguringModule(null)}
              title={`Configure ${configuringModule.displayName}`}
              subtitle={configuringModule.description || `Module settings for ${configuringModule.displayName}`}
              footer={
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setConfiguringModule(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveModuleSettings}
                    disabled={savingModuleSettings}
                    className="ovds-btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingModuleSettings ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                    {savingModuleSettings ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              }
              width="max-w-xl"
            >
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {!moduleSettingsDefs.length ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    This module has no configurable settings.
                  </p>
                ) : (
                  moduleSettingsDefs.map((s: any) => (
                    <div key={s.key} className="space-y-1.5">
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {s.label}
                      </label>
                      {s.type === 'boolean' ? (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={moduleSettings[s.key] === 'true'}
                          onClick={() => setModuleSettings(prev => ({ ...prev, [s.key]: prev[s.key] === 'true' ? 'false' : 'true' }))}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${moduleSettings[s.key] === 'true' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${moduleSettings[s.key] === 'true' ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      ) : s.type === 'select' && s.options ? (
                        <select
                          value={moduleSettings[s.key] ?? String(s.defaultValue ?? '')}
                          onChange={e => setModuleSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                        >
                          {s.options.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : s.type === 'number' ? (
                        <input
                          type="number"
                          value={moduleSettings[s.key] ?? String(s.defaultValue ?? '')}
                          onChange={e => setModuleSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                        />
                      ) : (
                        <input
                          type="text"
                          value={moduleSettings[s.key] ?? String(s.defaultValue ?? '')}
                          onChange={e => setModuleSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModularSettings;
