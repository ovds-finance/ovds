/**
 * @file VatModuleStore.tsx
 * Route: /tax/vat/store
 *
 * App-Store-style UI for browsing, activating, and deactivating country
 * VAT modules — inspired by Akaunting's App Store concept.
 *
 * Layout
 * ──────
 *  ┌─────────────────────────────────────────────────────┐
 *  │  Header — "VAT Module Store"                        │
 *  ├─────────────────────────────────────────────────────┤
 *  │  [Search]  [Filter: All / Active / Available]       │
 *  ├─────────────────────────────────────────────────────┤
 *  │  Active Modules (installed + enabled for tenant)    │
 *  │  ┌───────┐ ┌───────┐                               │
 *  │  │  ET   │ │  AE   │  …                            │
 *  │  └───────┘ └───────┘                               │
 *  ├─────────────────────────────────────────────────────┤
 *  │  Available Modules (installed but not yet active)   │
 *  │  ┌───────┐ …                                        │
 *  └─────────────────────────────────────────────────────┘
 *
 * Each card:
 *  • Flag emoji + country name + authority abbreviation
 *  • Standard rate badge + currency badge + rule-set version
 *  • Filing frequency chips
 *  • Report templates list
 *  • Activate / Deactivate / Open button
 *  • Compliance standards tags
 */

import React, { useState, useMemo, useCallback } from 'react';
import { toast }           from 'react-hot-toast';
import { useNavigate }     from 'react-router-dom';

import {
  useVatModules,
  type VatModuleSummary,
}                          from '../../context/VatModuleContext';
import { useRouteUITitle } from '../../router';

// ─── Country meta (flag + rate label) — extend as more modules are added ─────

const COUNTRY_META: Record<string, { flag: string; standardRate: string }> = {
  ET: { flag: '🇪🇹', standardRate: '15%' },
  AE: { flag: '🇦🇪', standardRate: '5%'  },
  GB: { flag: '🇬🇧', standardRate: '20%' },
  KE: { flag: '🇰🇪', standardRate: '16%' },
  NG: { flag: '🇳🇬', standardRate: '7.5%'},
  ZA: { flag: '🇿🇦', standardRate: '15%' },
};

// ─── Rate-type badge colours ──────────────────────────────────────────────────

const RATE_BADGE = 'px-2 py-0.5 rounded-full text-xs font-bold';

// ─── Module card ──────────────────────────────────────────────────────────────

interface ModuleCardProps {
  module:    VatModuleSummary;
  active:    boolean;
  onActivate:   (code: string) => void;
  onDeactivate: (code: string) => void;
  onOpen:       (code: string) => void;
  loading:   boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  module, active, onActivate, onDeactivate, onOpen, loading,
}) => {
  const meta = COUNTRY_META[module.countryCode] ?? { flag: '🌍', standardRate: '—' };

  return (
    <article
      className={[
        'relative flex flex-col rounded-2xl border transition-all duration-200',
        'bg-white dark:bg-slate-900',
        active
          ? 'border-[var(--pro-azure)] shadow-lg shadow-green-500/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
      ].join(' ')}
      aria-label={`${module.countryName} VAT module`}
    >
      {/* Active badge */}
      {active && (
        <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-[var(--pro-azure)] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
          Active
        </div>
      )}

      {/* Card header */}
      <div className="p-4 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-3xl leading-none mt-0.5" role="img" aria-label={module.countryName}>
          {meta.flag}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
            {module.displayName}
          </h3>
          <p className="text-xs text-slate-500 truncate">
            {module.authorityName} · {module.currency}
          </p>
        </div>
        {/* Standard rate badge */}
        <span className={`${RATE_BADGE} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shrink-0`}>
          {meta.standardRate}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 space-y-3">
        {/* Version row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`${RATE_BADGE} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
            v{module.moduleVersion}
          </span>
          <span className={`${RATE_BADGE} bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300`}>
            rules v{module.ruleSetVersion}
          </span>
        </div>

        {/* Report templates */}
        {module.reportTemplates.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Report Templates
            </p>
            <ul className="space-y-1">
              {module.reportTemplates.slice(0, 3).map((tpl) => (
                <li key={tpl.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="text-[10px]" aria-hidden>📄</span>
                  <span className="truncate">{tpl.label}</span>
                  <span className="ml-auto shrink-0 text-[9px] font-mono text-slate-400">
                    {tpl.formats.join(' · ')}
                  </span>
                </li>
              ))}
              {module.reportTemplates.length > 3 && (
                <li className="text-[10px] text-slate-400">
                  +{module.reportTemplates.length - 3} more…
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Booted status */}
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${module.booted ? 'bg-emerald-500' : 'bg-amber-400'}`}
            role="img"
            aria-label={module.booted ? 'Engine running' : 'Engine not booted'}
          />
          <span className="text-slate-500">
            {module.booted ? 'Engine running' : 'Engine not booted yet'}
          </span>
        </div>
      </div>

      {/* Card footer — action buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {active ? (
          <>
            <button
              onClick={() => onOpen(module.countryCode)}
              className="flex-1 py-2 bg-[var(--pro-azure)] text-white rounded-lg text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-all"
            >
              Open Dashboard
            </button>
            <button
              onClick={() => onDeactivate(module.countryCode)}
              disabled={loading}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-40"
              aria-label={`Deactivate ${module.countryName} VAT module`}
            >
              Deactivate
            </button>
          </>
        ) : (
          <button
            onClick={() => onActivate(module.countryCode)}
            disabled={loading}
            className="flex-1 py-2 border-2 border-[var(--pro-azure)] text-[var(--pro-azure)] rounded-lg text-xs font-bold hover:bg-[var(--pro-azure)] hover:text-white transition-all disabled:opacity-40"
          >
            {loading ? 'Activating…' : 'Activate'}
          </button>
        )}
      </div>
    </article>
  );
};

// ─── Search + filter bar ──────────────────────────────────────────────────────

type FilterMode = 'all' | 'active' | 'available';

interface FilterBarProps {
  search:    string;
  onSearch:  (v: string) => void;
  filter:    FilterMode;
  onFilter:  (f: FilterMode) => void;
  total:     number;
  active:    number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  search, onSearch, filter, onFilter, total, active,
}) => (
  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
    {/* Search */}
    <div className="relative flex-1 max-w-xs">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden>🔍</span>
      <input
        type="search"
        placeholder="Search by country or authority…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search VAT modules"
        className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]"
      />
    </div>

    {/* Filter chips */}
    <div className="flex gap-1.5" role="group" aria-label="Filter modules">
      {([
        ['all',       `All (${total})`],
        ['active',    `Active (${active})`],
        ['available', `Available (${total - active})`],
      ] as [FilterMode, string][]).map(([mode, label]) => (
        <button
          key={mode}
          onClick={() => onFilter(mode)}
          aria-pressed={filter === mode}
          className={[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
            filter === mode
              ? 'bg-[var(--pro-azure)] text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const VatModuleStore: React.FC = () => {
  const navigate = useNavigate();
  const { catalogue, isActive, activate, deactivate, loading } = useVatModules();

  useRouteUITitle('VAT Module Store');

  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<FilterMode>('all');
  const [actionCode, setActionCode] = useState<string | null>(null); // which card is mutating

  // ── Filtered catalogue ──────────────────────────────────────────────────

  const visible = useMemo<VatModuleSummary[]>(() => {
    let items = catalogue;

    // Text filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (m) =>
          m.countryName.toLowerCase().includes(q)   ||
          m.countryCode.toLowerCase().includes(q)   ||
          m.authorityName.toLowerCase().includes(q) ||
          m.displayName.toLowerCase().includes(q),
      );
    }

    // Mode filter
    if (filter === 'active')    items = items.filter((m) => isActive(m.countryCode));
    if (filter === 'available') items = items.filter((m) => !isActive(m.countryCode));

    return items;
  }, [catalogue, search, filter, isActive]);

  const activeModules    = visible.filter((m) =>  isActive(m.countryCode));
  const availableModules = visible.filter((m) => !isActive(m.countryCode));

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleActivate = useCallback(async (code: string) => {
    setActionCode(code);
    try {
      await activate([code]);
      toast.success(`${code} VAT module activated`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to activate ${code}`);
    } finally {
      setActionCode(null);
    }
  }, [activate]);

  const handleDeactivate = useCallback(async (code: string) => {
    setActionCode(code);
    try {
      await deactivate([code]);
      toast.success(`${code} VAT module deactivated`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to deactivate ${code}`);
    } finally {
      setActionCode(null);
    }
  }, [deactivate]);

  const handleOpen = useCallback((code: string) => {
    navigate(`/tax/vat/${code.toLowerCase()}`);
  }, [navigate]);

  // ── Render ──────────────────────────────────────────────────────────────

  const CardGrid: React.FC<{ modules: VatModuleSummary[] }> = ({ modules }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {modules.map((mod) => (
        <ModuleCard
          key={mod.countryCode}
          module={mod}
          active={isActive(mod.countryCode)}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onOpen={handleOpen}
          loading={loading || actionCode === mod.countryCode}
        />
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--pro-azure)] to-purple-600 flex items-center justify-center text-white text-xl shadow-lg shadow-green-500/20"
              aria-hidden
            >
              🌍
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              VAT Module Store
            </h1>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            Every country's VAT rules, filing formats, and report templates live in
            an independent module. Activate the jurisdictions your organisation operates in.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 shrink-0">
          {[
            { label: 'Installed',  value: catalogue.length,                            colour: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
            { label: 'Active',     value: catalogue.filter((m) => isActive(m.countryCode)).length, colour: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
          ].map(({ label, value, colour }) => (
            <div key={label} className={`rounded-xl px-4 py-2.5 text-center ${colour}`}>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + filter ──────────────────────────────────────────────── */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        total={catalogue.length}
        active={catalogue.filter((m) => isActive(m.countryCode)).length}
      />

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && catalogue.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <span className="text-5xl" aria-hidden>🔍</span>
          <p className="text-slate-600 dark:text-slate-300 font-semibold">No modules match your search</p>
          <p className="text-sm text-slate-400">Try a different country name or clear the filter</p>
          <button
            onClick={() => { setSearch(''); setFilter('all'); }}
            className="px-4 py-2 text-sm font-bold text-[var(--pro-azure)] underline hover:no-underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Active modules section ────────────────────────────────────────── */}
      {activeModules.length > 0 && (
        <section aria-labelledby="active-heading">
          <h2 id="active-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" aria-hidden />
            Active Modules ({activeModules.length})
          </h2>
          <CardGrid modules={activeModules} />
        </section>
      )}

      {/* ── Available modules section ─────────────────────────────────────── */}
      {availableModules.length > 0 && (
        <section aria-labelledby="available-heading">
          <h2 id="available-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" aria-hidden />
            Available to Activate ({availableModules.length})
          </h2>
          <CardGrid modules={availableModules} />
        </section>
      )}

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-600 dark:text-slate-400">Module authoring:</strong>{' '}
        Each country module is an independent package in{' '}
        <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
          packages/modules/tax/src/countries/&lt;iso2&gt;/
        </code>.
        Extend <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">VatModule</code> from{' '}
        <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">@ovds/core/vat</code> and
        register the singleton in{' '}
        <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
          vat-declaration.orchestrator.ts
        </code>.
        See <strong>ARCHITECTURE-OVDS-VAT.md</strong> for the full authoring guide.
      </div>
    </div>
  );
};

export default VatModuleStore;
