/**
 * Budgets — Annual budget management page
 *
 * Priority 4 from gap analysis.
 *
 * Features:
 *  - Year selector (±3 years from current)
 *  - Loads Chart of Accounts (INCOME + EXPENSE accounts only)
 *  - Loads saved budget from GET /ovds/reports/budget-vs-actual?year=N
 *  - Per-account annual budget input (editable inline)
 *  - Monthly spread toggle — auto-divide annual by 12
 *  - Live variance calculation against YTD actuals
 *  - Save to POST /ovds/reports/budget { year, budget: { [code]: number } }
 *  - Export CSV
 *
 * Backend endpoints:
 *   GET  /ovds/reports/budget-vs-actual?year=N&companyId=X
 *   POST /ovds/reports/budget  { year, budget }
 *   GET  /ovds/accounting/accounts?companyId=X
 */
import { evalMath } from '@ovds/ui';
import {
  BarChart3,
  Save,
  RefreshCw,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage,
  AppKpi,
  AppTable,
  AppTh,
  AppTd,
  AppTr,
  Btn,
  EmptyState,
  SearchBar,
  Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

// -- Types ---------------------------------------------------------------------

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  category?: string;
}

interface BudgetRow {
  code: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  category?: string;
  budget: number; // annual target
  actual: number; // YTD actual from P&L
  variance: number; // actual - budget
  variancePct: number | null;
}

type SectionKey = 'INCOME' | 'EXPENSE';

// -- Helpers --------------------------------------------------------------------

const fmtNum = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

function parseBudgetInput(s: string): number {
  const cleaned = s.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.max(0, n);
}

// -- Variance badge -------------------------------------------------------------
const VarianceBadge: React.FC<{ row: BudgetRow }> = ({ row }) => {
  if (row.budget === 0)
    return <span className="text-[10px] text-slate-300">—</span>;

  const isIncome = row.type === 'INCOME';
  // For income: positive variance is good (over budget). For expense: negative is good (under).
  const isFav = isIncome ? row.variance >= 0 : row.variance <= 0;
  const pct = row.variancePct;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
        isFav
          ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)] dark:border-green-800'
          : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
      }`}
    >
      {isFav ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {pct != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'}
    </span>
  );
};

// -- Progress bar ---------------------------------------------------------------
const BudgetBar: React.FC<{ row: BudgetRow }> = ({ row }) => {
  if (row.budget === 0) return null;
  const pct = Math.min(100, Math.round((row.actual / row.budget) * 100));
  const isExpense = row.type === 'EXPENSE';
  const overBudget = isExpense ? row.actual > row.budget : false;
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          overBudget ? 'bg-rose-500' : 'bg-[var(--pro-azure)]'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// -- Section header row ---------------------------------------------------------
const SectionRow: React.FC<{
  label: string;
  totalBudget: number;
  totalActual: number;
  expanded: boolean;
  onToggle: () => void;
  type: SectionKey;
}> = ({ label, totalBudget, totalActual, expanded, onToggle, type }) => {
  const variance = totalActual - totalBudget;
  const isFav = type === 'INCOME' ? variance >= 0 : variance <= 0;
  return (
    <tr
      onClick={onToggle}
      className="bg-slate-50/80 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-200 dark:border-slate-700"
    >
      <td className="px-4 py-2.5" colSpan={2}>
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp size={12} className="text-slate-400" />
          ) : (
            <ChevronDown size={12} className="text-slate-400" />
          )}
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {label}
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tabular-nums">
          {totalBudget > 0 ? fmtNum(totalBudget) : '—'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
          {fmtNum(totalActual)}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span
          className={`text-[11px] font-black tabular-nums ${isFav ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-rose-600 dark:text-rose-400'}`}
        >
          {variance >= 0 ? '+' : ''}
          {fmtNum(variance)}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        {totalBudget > 0 && (
          <span
            className={`text-[10px] font-bold ${isFav ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}
          >
            {Math.round((totalActual / totalBudget) * 100)}%
          </span>
        )}
      </td>
    </tr>
  );
};

// -- Main page -----------------------------------------------------------------
const Budgets: React.FC = () => {
  usePageTitle('Budgets');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({}); // code → annual budget
  const [actuals, setActuals] = useState<Record<string, number>>({}); // code → YTD actual
  const [dirty, setDirty] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['INCOME', 'EXPENSE']),
  );

  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
  const cqAmp = selectedCompanyId ? `&companyId=${selectedCompanyId}` : '';

  // -- Load accounts + saved budget + actuals ---------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    setDirty(false);
    try {
      const [acctRes, budgetRes] = await Promise.all([
        api.get(`/accounting/accounts${cq}`),
        api
          .get(`/ovds/reports/budget-vs-actual?year=${year}${cqAmp}`)
          .catch(() => ({ data: null })),
      ]);

      // Accounts — keep only INCOME and EXPENSE
      const allAccounts: Account[] = (
        acctRes.data?.data ??
        acctRes.data ??
        []
      ).filter((a: any) => a.type === 'INCOME' || a.type === 'EXPENSE');
      setAccounts(allAccounts);

      // Saved budget values from the budget-vs-actual response
      const bva = budgetRes.data?.data ?? budgetRes.data;
      const newBudgetMap: Record<string, number> = {};
      const newActuals: Record<string, number> = {};

      if (bva) {
        // income items
        for (const item of bva.income?.items ?? []) {
          if (item.code) {
            newBudgetMap[item.code] = item.budget ?? 0;
            newActuals[item.code] = item.amount ?? 0;
          }
        }
        // expense items
        for (const item of bva.expenses?.items ?? []) {
          if (item.code) {
            newBudgetMap[item.code] = item.budget ?? 0;
            newActuals[item.code] = item.amount ?? 0;
          }
        }
      }

      setBudgetMap(newBudgetMap);
      setActuals(newActuals);
    } catch (_err: any) {
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [year, cq, cqAmp]);

  useEffect(() => {
    load();
  }, [load]);

  // -- Build display rows -----------------------------------------------------
  const rows: BudgetRow[] = useMemo(() => {
    return accounts
      .filter((a) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          (a.code ?? '').toLowerCase().includes(q)
        );
      })
      .map((a) => {
        const budget = budgetMap[a.code] ?? 0;
        const actual = actuals[a.code] ?? 0;
        const variance = actual - budget;
        const variancePct =
          budget > 0 ? Math.round((variance / budget) * 1000) / 10 : null;
        return {
          code: a.code,
          name: a.name,
          type: a.type as SectionKey,
          category: a.category,
          budget,
          actual,
          variance,
          variancePct,
        };
      });
  }, [accounts, budgetMap, actuals, search]);

  const incomeRows = useMemo(
    () => rows.filter((r) => r.type === 'INCOME'),
    [rows],
  );
  const expenseRows = useMemo(
    () => rows.filter((r) => r.type === 'EXPENSE'),
    [rows],
  );

  // KPI cells
  const totalBudgetRevenue = useMemo(
    () => incomeRows.reduce((s, r) => s + r.budget, 0),
    [incomeRows],
  );
  const totalBudgetExpenses = useMemo(
    () => expenseRows.reduce((s, r) => s + r.budget, 0),
    [expenseRows],
  );
  const totalActualRevenue = useMemo(
    () => incomeRows.reduce((s, r) => s + r.actual, 0),
    [incomeRows],
  );
  const totalActualExpenses = useMemo(
    () => expenseRows.reduce((s, r) => s + r.actual, 0),
    [expenseRows],
  );
  const budgetNetProfit = totalBudgetRevenue - totalBudgetExpenses;
  const actualNetProfit = totalActualRevenue - totalActualExpenses;

  const kpiCells = useMemo(
    () => [
      {
        label: 'Budget Revenue',
        value: `ETB ${fmtNum(totalBudgetRevenue)}`,
        color: 'green' as const,
      },
      {
        label: 'Actual Revenue',
        value: `ETB ${fmtNum(totalActualRevenue)}`,
        color: 'sky' as const,
      },
      {
        label: 'Budget Expenses',
        value: `ETB ${fmtNum(totalBudgetExpenses)}`,
        color: 'amber' as const,
      },
      {
        label: 'Actual Expenses',
        value: `ETB ${fmtNum(totalActualExpenses)}`,
        color: actualNetProfit >= 0 ? ('green' as const) : ('rose' as const),
      },
      {
        label: 'Budget Net Profit',
        value: `ETB ${fmtNum(budgetNetProfit)}`,
        color: budgetNetProfit >= 0 ? ('green' as const) : ('rose' as const),
      },
      {
        label: 'Actual Net Profit',
        value: `ETB ${fmtNum(actualNetProfit)}`,
        color: actualNetProfit >= 0 ? ('green' as const) : ('rose' as const),
      },
    ],
    [
      totalBudgetRevenue,
      totalActualRevenue,
      totalBudgetExpenses,
      totalActualExpenses,
      budgetNetProfit,
      actualNetProfit,
    ],
  );

  // -- Update a single account budget ----------------------------------------
  const updateBudget = (code: string, value: string) => {
    const n = parseBudgetInput(value);
    setBudgetMap((m) => ({ ...m, [code]: n }));
    setDirty(true);
  };

  // -- Bulk fill — set all INCOME or EXPENSE from actuals -------------------
  const fillFromActuals = (type: SectionKey) => {
    const filtered = accounts.filter((a) => a.type === type);
    const updates: Record<string, number> = {};
    for (const a of filtered) {
      updates[a.code] = actuals[a.code] ?? 0;
    }
    setBudgetMap((m) => ({ ...m, ...updates }));
    setDirty(true);
    toast.success(`Filled ${type.toLowerCase()} budgets from YTD actuals`);
  };

  // -- Spread monthly — divide annual by 12 (informational toast) -----------
  const spreadMonthly = () => {
    toast(
      `Monthly spread: divide each annual budget by 12 to get monthly targets.`,
      {
        icon: '📅',
        duration: 3000,
      },
    );
  };

  // -- Save ------------------------------------------------------------------
  const save = async () => {
    if (!can('ovds:write')) {
      toast.error('No permission to save budgets');
      return;
    }
    setSaving(true);
    try {
      await api.post('/ovds/reports/budget', {
        year,
        budget: budgetMap,
        ...(selectedCompanyId ? { companyId: selectedCompanyId } : {}),
      });
      setDirty(false);
      toast.success(`Budget for ${year} saved`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  // -- Export CSV ------------------------------------------------------------
  const exportCsv = () => {
    const header =
      'Code,Account Name,Type,Budget (Annual),Actual (YTD),Variance,Variance %';
    const csvRows = rows.map(
      (r) =>
        `"${r.code}","${r.name}","${r.type}",${r.budget},${r.actual},${r.variance},${r.variancePct ?? ''}`,
    );
    const blob = new Blob([[header, ...csvRows].join('\n')], {
      type: 'text/csv',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `budget-${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Exported');
  };

  const toggleSection = (s: SectionKey) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // -- Render account rows for a section -------------------------------------
  const renderRows = (sectionRows: BudgetRow[], type: SectionKey) => {
    const expanded = expandedSections.has(type);
    const totalBudget = sectionRows.reduce((s, r) => s + r.budget, 0);
    const totalActual = sectionRows.reduce((s, r) => s + r.actual, 0);

    return (
      <React.Fragment key={type}>
        <SectionRow
          label={type === 'INCOME' ? 'Income / Revenue' : 'Expenses'}
          totalBudget={totalBudget}
          totalActual={totalActual}
          expanded={expanded}
          onToggle={() => toggleSection(type)}
          type={type}
        />
        {expanded &&
          sectionRows.map((row) => (
            <AppTr key={row.code}>
              {/* Account */}
              <AppTd>
                <div className="pl-4">
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    {row.name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {row.code}
                  </p>
                </div>
              </AppTd>

              {/* Category */}
              <AppTd>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                  {row.category?.replace(/_/g, ' ') ?? '—'}
                </span>
              </AppTd>

              {/* Budget input */}
              <AppTd align="right">
                {can('ovds:write') ? (
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={row.budget === 0 ? '' : row.budget}
                    onChange={(e) => updateBudget(row.code, e.target.value)}
                    onBlur={(e) => updateBudget(row.code, String(evalMath(e.target.value) ?? e.target.value))}
                    placeholder="0"
                    className={`w-32 text-right px-2 py-1 rounded-lg border text-[11px] font-semibold tabular-nums outline-none transition-colors
                    ${
                      dirty && row.budget > 0
                        ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-700'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }
                    focus:border-teal-400 focus:ring-1 focus:ring-teal-400 dark:focus:border-teal-400`}
                  />
                ) : (
                  <span className="text-[11px] tabular-nums font-semibold text-slate-600">
                    {row.budget > 0 ? (
                      fmtNum(row.budget)
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </span>
                )}
              </AppTd>

              {/* Actual YTD */}
              <AppTd align="right">
                <span className="text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-300">
                  {fmtNum(row.actual)}
                </span>
                <BudgetBar row={row} />
              </AppTd>

              {/* Variance */}
              <AppTd align="right">
                {row.budget > 0 ? (
                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      (
                        type === 'INCOME'
                          ? row.variance >= 0
                          : row.variance <= 0
                      )
                        ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {row.variance >= 0 ? '+' : ''}
                    {fmtNum(row.variance)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300">—</span>
                )}
              </AppTd>

              {/* % Achieved */}
              <AppTd align="right">
                <VarianceBadge row={row} />
              </AppTd>
            </AppTr>
          ))}
        {/* Section totals footer */}
        {expanded && (
          <tr className="bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <td colSpan={2} className="px-4 py-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {type === 'INCOME' ? 'Total Revenue' : 'Total Expenses'}
              </span>
            </td>
            <td className="px-4 py-2.5 text-right">
              <span className="text-[11px] font-black tabular-nums text-slate-700 dark:text-slate-200">
                {totalBudget > 0 ? fmtNum(totalBudget) : '—'}
              </span>
            </td>
            <td className="px-4 py-2.5 text-right">
              <span className="text-[11px] font-black tabular-nums text-slate-700 dark:text-slate-200">
                {fmtNum(totalActual)}
              </span>
            </td>
            <td className="px-4 py-2.5 text-right">
              <span
                className={`text-[11px] font-black tabular-nums ${
                  (
                    type === 'INCOME'
                      ? totalActual >= totalBudget
                      : totalActual <= totalBudget
                  )
                    ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {totalActual - totalBudget >= 0 ? '+' : ''}
                {fmtNum(totalActual - totalBudget)}
              </span>
            </td>
            <td className="px-4 py-2.5 text-right">
              {totalBudget > 0 && (
                <span className="text-[10px] font-bold text-slate-500">
                  {Math.round((totalActual / totalBudget) * 100)}%
                </span>
              )}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <AppPage
      title="Budgets"
      subtitle="Annual budget planning · Budget vs actual · Per-account targets · Accounting & ovds Software · Banking & ovds · Revenue · Market Forecast · Growth · Strategic Insights"
      icon={<Target size={18} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'ovds' }, { label: 'Budgets' }]}
      actions={
        <>
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none hover:border-violet-300 transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <Btn
            variant="ghost"
            size="sm"
            icon={
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            }
            onClick={load}
          >
            Refresh
          </Btn>
          <Btn
            variant="secondary"
            size="sm"
            icon={<Download size={11} />}
            onClick={exportCsv}
          >
            Export CSV
          </Btn>
          {can('ovds:write') && (
            <Btn
              variant={dirty ? 'primary' : 'secondary'}
              size="sm"
              icon={
                saving ? (
                  <RefreshCw size={11} className="animate-spin" />
                ) : (
                  <Save size={11} />
                )
              }
              onClick={save}
              loading={saving}
            >
              {dirty ? 'Save Budget' : 'Saved'}
            </Btn>
          )}
        </>
      }
    >
      {/* KPI strip */}
      <AppKpi cells={kpiCells} cols={6} />

      {/* Unsaved changes banner */}
      {dirty && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px]">
          <AlertTriangle
            size={13}
            className="text-amber-600 dark:text-amber-400 shrink-0"
          />
          <p className="text-amber-700 dark:text-amber-400 font-semibold flex-1">
            You have unsaved budget changes for <strong>FY {year}</strong>.
          </p>
          <Btn
            variant="primary"
            size="sm"
            onClick={save}
            loading={saving}
            icon={<Save size={10} />}
          >
            Save Now
          </Btn>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search accounts…"
          className="w-52"
        />
        <div className="flex-1" />

        {/* Quick-fill helpers */}
        {can('ovds:write') && accounts.length > 0 && (
          <>
            <Btn
              variant="ghost"
              size="sm"
              icon={<Zap size={10} />}
              onClick={() => fillFromActuals('INCOME')}
              className="text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)]"
            >
              Fill Revenue from Actuals
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              icon={<Zap size={10} />}
              onClick={() => fillFromActuals('EXPENSE')}
              className="text-amber-600 hover:bg-amber-50"
            >
              Fill Expenses from Actuals
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              icon={<BarChart3 size={10} />}
              onClick={spreadMonthly}
            >
              Monthly Spread
            </Btn>
          </>
        )}

        <span className="text-[11px] text-slate-400">
          {accounts.length} accounts
        </span>
      </div>

      {/* Budget table */}
      {loading ? (
        <div className="space-y-px">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-white dark:bg-slate-900 rounded animate-pulse"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={20} />}
          title="No accounts found"
          desc="Create income and expense accounts in the Chart of Accounts first."
          action={{
            label: 'Go to Chart of Accounts',
            onClick: () => (window.location.href = '/accounting'),
          }}
        />
      ) : (
        <AppTable>
          <thead>
            <tr>
              <AppTh>Account</AppTh>
              <AppTh>Category</AppTh>
              <AppTh align="right">Budget (Annual)</AppTh>
              <AppTh align="right">Actual (YTD)</AppTh>
              <AppTh align="right">Variance</AppTh>
              <AppTh align="right">% Achieved</AppTh>
            </tr>
          </thead>
          <tbody>
            {renderRows(incomeRows, 'INCOME')}
            {renderRows(expenseRows, 'EXPENSE')}

            {/* Net profit summary row */}
            <tr className="bg-slate-800 dark:bg-slate-700 text-white">
              <td colSpan={2} className="px-4 py-3">
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Net Profit / (Loss)
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-[11px] font-black tabular-nums">
                  {fmtNum(budgetNetProfit)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`text-[11px] font-black tabular-nums ${actualNetProfit >= 0 ? 'text-[var(--pro-azure-light)]' : 'text-rose-400'}`}
                >
                  {fmtNum(actualNetProfit)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`text-[11px] font-black tabular-nums ${actualNetProfit - budgetNetProfit >= 0 ? 'text-[var(--pro-azure-light)]' : 'text-rose-400'}`}
                >
                  {actualNetProfit - budgetNetProfit >= 0 ? '+' : ''}
                  {fmtNum(actualNetProfit - budgetNetProfit)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {budgetNetProfit !== 0 && (
                  <span
                    className={`text-[10px] font-black ${actualNetProfit >= budgetNetProfit ? 'text-[var(--pro-azure-light)]' : 'text-rose-400'}`}
                  >
                    {Math.round(
                      (actualNetProfit / Math.abs(budgetNetProfit)) * 100,
                    )}
                    %
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </AppTable>
      )}

      {/* Helper explainer */}
      <div className="p-4 bg-violet-50 dark:bg-violet-950/10 border border-violet-200 dark:border-violet-800 rounded-xl text-[11px] space-y-2">
        <p className="font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider text-[10px]">
          How Budgets Work
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              icon: <Target size={12} />,
              title: 'Set Annual Targets',
              desc: 'Enter the annual budget amount per account. Leave blank to exclude from tracking.',
            },
            {
              icon: <BarChart3 size={12} />,
              title: 'Track vs Actuals',
              desc: 'Actuals are pulled live from your journal entries. Variance updates automatically.',
            },
            {
              icon: <CheckCircle size={12} />,
              title: 'Budget vs Actual',
              desc: 'View performance in the Accounting Dashboard widget and in the Comparison tab on Reports.',
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-2">
              <span className="text-violet-500 mt-0.5 shrink-0">
                {item.icon}
              </span>
              <div>
                <p className="font-bold text-violet-700 dark:text-violet-400">
                  {item.title}
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppPage>
  );
};

export default Budgets;
