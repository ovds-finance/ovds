/**
 * FinancialRatioWidget — Liquidity, Profitability, Solvency & Efficiency ratios
 *
 * Fetches from GET /ovds/reports/ratios and renders a compact ratio dashboard
 * with trend indicators and Ethiopian SMB benchmarks.
 */
import React, { useState } from 'react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useBusiness } from '../../context/businessContext';
import { RefreshCw, Info } from 'lucide-react';

interface Ratio {
  label: string;
  value: number | null;
  benchmark: number;
  unit: string;
  higherIsBetter: boolean;
  description: string;
}

interface RatioGroup {
  group: string;
  color: string;
  ratios: Ratio[];
}

const GRADE_COLOR: Record<string, string> = {
  Good:    'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
  Fair:    'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
  Poor:    'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30',
  'N/A':   'text-slate-400 bg-slate-100 dark:bg-slate-800',
};

function gradeRatio(ratio: Ratio): 'Good' | 'Fair' | 'Poor' | 'N/A' {
  if (ratio.value === null || ratio.value === undefined) return 'N/A';
  const pct = ratio.benchmark > 0 ? ratio.value / ratio.benchmark : 0;
  if (ratio.higherIsBetter) {
    if (pct >= 1.0) return 'Good';
    if (pct >= 0.7) return 'Fair';
    return 'Poor';
  } else {
    if (pct <= 1.0) return 'Good';
    if (pct <= 1.5) return 'Fair';
    return 'Poor';
  }
}

function fmtRatio(value: number | null, unit: string): string {
  if (value === null || value === undefined) return '—';
  if (unit === '%') return `${(value * 100).toFixed(1)}%`;
  if (unit === 'x') return `${value.toFixed(2)}x`;
  if (unit === 'days') return `${Math.round(value)} days`;
  return value.toFixed(2);
}

const RatioRow: React.FC<{ ratio: Ratio }> = ({ ratio }) => {
  const [showTip, setShowTip] = useState(false);
  const grade = gradeRatio(ratio);
  const gradeCls = GRADE_COLOR[grade];
  const benchmarkFmt = fmtRatio(ratio.benchmark, ratio.unit);
  const valueFmt = fmtRatio(ratio.value, ratio.unit);

  const pct = ratio.value !== null && ratio.benchmark > 0
    ? Math.min(100, Math.round((ratio.higherIsBetter
        ? (ratio.value / ratio.benchmark)
        : (ratio.benchmark / Math.max(ratio.value, 0.001))) * 100))
    : 0;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ratio.label}</span>
          <button
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            className="relative text-slate-300 hover:text-slate-500 transition-colors"
          >
            <Info size={11} />
            {showTip && (
              <div className="absolute left-0 bottom-full mb-1 w-48 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-lg p-2 z-50 shadow-xl">
                {ratio.description}
                <br />
                <span className="text-slate-400 dark:text-slate-300">Benchmark: {benchmarkFmt}</span>
              </div>
            )}
          </button>
        </div>
        <div className="mt-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${grade === 'Good' ? 'bg-emerald-500' : grade === 'Fair' ? 'bg-amber-400' : 'bg-rose-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${gradeCls}`}>{valueFmt}</span>
        <p className="text-[9px] text-slate-400 mt-0.5">bench: {benchmarkFmt}</p>
      </div>
    </div>
  );
};

const FinancialRatioWidget: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { data, loading, refetch } = useApiQuery<RatioGroup[]>(
    `/ovds/reports/ratios${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    {
      staleTime: 5 * 60_000,
      enabled: !!selectedCompanyId,
      suppressToast: true,
      select: (r: any) => { const d = r?.data ?? r; return Array.isArray(d) ? d : []; },
    }
  );

  const [activeGroup, setActiveGroup] = useState(0);
  const groups: RatioGroup[] = data ?? [];
  const current = groups[activeGroup];

  return (
    <div className="ovds-widget-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Financial Ratios</p>
          <p className="ovds-caption mt-0.5">vs. Ethiopian SMB benchmarks</p>
        </div>
        <button onClick={() => refetch()} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Group tabs */}
      {groups.length > 0 && (
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          {groups.map((g, i) => (
            <button
              key={g.group}
              onClick={() => setActiveGroup(i)}
              className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
                activeGroup === i
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {g.group}
            </button>
          ))}
        </div>
      )}

      <div className="px-5 py-2">
        {loading ? (
          <div className="space-y-3 py-2">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !current ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No financial data available yet.
          </div>
        ) : (
          <div>
            {current.ratios.map(ratio => (
              <RatioRow key={ratio.label} ratio={ratio} />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Good (≥ benchmark)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Fair (70–99%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Poor (&lt; 70%)</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialRatioWidget;






