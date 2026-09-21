/**
 * AdvancedFilterBuilder — Reusable filter builder for list pages
 *
 * Supports: text, select, date-range, number-range, boolean filters
 * Persists active filters to localStorage per page key
 * Emits onChange with the current filter state
 */
import { Filter, X, ChevronDown, Plus, Trash2, RotateCcw } from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';

export type FilterOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'between'
  | 'in' | 'not_in'
  | 'is_empty' | 'is_not_empty'
  | 'before' | 'after' | 'date_between';

export type FilterFieldType = 'text' | 'number' | 'select' | 'date' | 'boolean';

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[];  // for select type
  placeholder?: string;
}

export interface ActiveFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  value2?: string;  // for between/date_between
}

interface Props {
  fields: FilterField[];
  storageKey?: string;
  onChange: (filters: ActiveFilter[]) => void;
  className?: string;
}

const OPERATORS_BY_TYPE: Record<FilterFieldType, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'not equals' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '≥' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '≤' },
    { value: 'between', label: 'between' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'in', label: 'is any of' },
    { value: 'not_in', label: 'is none of' },
  ],
  date: [
    { value: 'equals', label: 'on' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'date_between', label: 'between' },
  ],
  boolean: [
    { value: 'equals', label: 'is' },
  ],
};

const needsValue2 = (op: FilterOperator) => op === 'between' || op === 'date_between';
const noValueNeeded = (op: FilterOperator) => op === 'is_empty' || op === 'is_not_empty';

let idCounter = 0;
const newId = () => `f_${++idCounter}_${Date.now()}`;

const AdvancedFilterBuilder: React.FC<Props> = ({ fields, storageKey, onChange, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ActiveFilter[]>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`filter_${storageKey}`);
        if (saved) return JSON.parse(saved);
      } catch { /* ignore invalid JSON */ }
    }
    return [];
  });

  // Persist and emit on change
  const applyFilters = useCallback((updated: ActiveFilter[]) => {
    setFilters(updated);
    if (storageKey) {
      localStorage.setItem(`filter_${storageKey}`, JSON.stringify(updated));
    }
    onChange(updated);
  }, [storageKey, onChange]);

  // Emit on mount if there are saved filters
  useEffect(() => {
    if (filters.length > 0) onChange(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFilter = () => {
    const firstField = fields[0];
    const firstOp = OPERATORS_BY_TYPE[firstField.type][0].value;
    applyFilters([...filters, { id: newId(), field: firstField.key, operator: firstOp, value: '' }]);
  };

  const removeFilter = (id: string) => {
    applyFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, patch: Partial<ActiveFilter>) => {
    applyFilters(filters.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, ...patch };
      // Reset operator when field changes
      if (patch.field && patch.field !== f.field) {
        const newField = fields.find(ff => ff.key === patch.field);
        if (newField) {
          updated.operator = OPERATORS_BY_TYPE[newField.type][0].value;
          updated.value = '';
          updated.value2 = undefined;
        }
      }
      return updated;
    }));
  };

  const clearAll = () => applyFilters([]);

  const activeCount = filters.filter(f => f.value || noValueNeeded(f.operator)).length;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-colors ${
          activeCount > 0
            ? 'bg-[var(--pro-azure)] text-white border-[var(--pro-azure-dark)] shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)]'
        }`}
      >
        <Filter size={14} />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="bg-white/20 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            {activeCount}
          </span>
        )}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-[520px] max-w-[95vw]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Advanced Filters</span>
              {activeCount > 0 && (
                <span className="bg-[var(--pro-azure)] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  {activeCount} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {filters.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors font-bold"
                >
                  <RotateCcw size={11} /> Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Filter rows */}
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {filters.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No filters applied. Click "Add filter" to get started.
              </p>
            )}
            {filters.map((filter) => {
              const fieldDef = fields.find(f => f.key === filter.field);
              const operators = fieldDef ? OPERATORS_BY_TYPE[fieldDef.type] : [];
              const noVal = noValueNeeded(filter.operator);
              const twoVals = needsValue2(filter.operator);

              return (
                <div key={filter.id} className="flex items-start gap-2 group">
                  {/* Field selector */}
                  <select
                    value={filter.field}
                    onChange={e => updateFilter(filter.id, { field: e.target.value })}
                    className="flex-1 min-w-0 px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20"
                  >
                    {fields.map(f => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>

                  {/* Operator selector */}
                  <select
                    value={filter.operator}
                    onChange={e => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                    className="w-32 shrink-0 px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  {/* Value input(s) */}
                  {!noVal && (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      {fieldDef?.type === 'select' ? (
                        <select
                          value={filter.value}
                          onChange={e => updateFilter(filter.id, { value: e.target.value })}
                          className="flex-1 px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20"
                        >
                          <option value="">Select…</option>
                          {fieldDef.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : fieldDef?.type === 'boolean' ? (
                        <select
                          value={filter.value}
                          onChange={e => updateFilter(filter.id, { value: e.target.value })}
                          className="flex-1 px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <>
                          <input
                            type={fieldDef?.type === 'date' ? 'date' : fieldDef?.type === 'number' ? 'number' : 'text'}
                            value={filter.value}
                            onChange={e => updateFilter(filter.id, { value: e.target.value })}
                            placeholder={fieldDef?.placeholder ?? 'Value…'}
                            className="flex-1 min-w-0 px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20 placeholder:text-slate-400"
                          />
                          {twoVals && (
                            <>
                              <span className="text-xs text-slate-400 shrink-0">–</span>
                              <input
                                type={fieldDef?.type === 'date' ? 'date' : 'number'}
                                value={filter.value2 ?? ''}
                                onChange={e => updateFilter(filter.id, { value2: e.target.value })}
                                placeholder="To…"
                                className="flex-1 min-w-0 px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20 placeholder:text-slate-400"
                              />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {noVal && <div className="flex-1" />}

                  {/* Remove */}
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={addFilter}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:text-[var(--pro-azure-dark)] transition-colors"
            >
              <Plus size={13} /> Add filter
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 bg-[var(--pro-azure)] text-white rounded-lg text-xs font-medium hover:bg-[var(--pro-azure-dark)] transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilterBuilder;

/**
 * Helper: convert ActiveFilter[] to API query params
 * Usage: const params = filtersToParams(filters, fieldDefs);
 */
// eslint-disable-next-line react-refresh/only-export-components
export function filtersToParams(filters: ActiveFilter[], fields: FilterField[]): Record<string, string> {
  const params: Record<string, string> = {};
  filters.forEach(f => {
    const fieldDef = fields.find(ff => ff.key === f.field);
    if (!fieldDef) return;
    const noVal = f.operator === 'is_empty' || f.operator === 'is_not_empty';
    if (!noVal && !f.value) return;

    switch (f.operator) {
      case 'equals':       params[f.field] = f.value; break;
      case 'not_equals':   params[`${f.field}_ne`] = f.value; break;
      case 'contains':     params[`${f.field}_contains`] = f.value; break;
      case 'not_contains': params[`${f.field}_ncontains`] = f.value; break;
      case 'starts_with':  params[`${f.field}_sw`] = f.value; break;
      case 'ends_with':    params[`${f.field}_ew`] = f.value; break;
      case 'gt':           params[`${f.field}_gt`] = f.value; break;
      case 'gte':          params[`${f.field}_gte`] = f.value; break;
      case 'lt':           params[`${f.field}_lt`] = f.value; break;
      case 'lte':          params[`${f.field}_lte`] = f.value; break;
      case 'between':      params[`${f.field}_gte`] = f.value; if (f.value2) params[`${f.field}_lte`] = f.value2; break;
      case 'before':       params[`${f.field}_lt`] = f.value; break;
      case 'after':        params[`${f.field}_gt`] = f.value; break;
      case 'date_between': params[`${f.field}_gte`] = f.value; if (f.value2) params[`${f.field}_lte`] = f.value2; break;
      case 'in':           params[`${f.field}_in`] = f.value; break;
      case 'not_in':       params[`${f.field}_nin`] = f.value; break;
      case 'is_empty':     params[`${f.field}_empty`] = 'true'; break;
      case 'is_not_empty': params[`${f.field}_empty`] = 'false'; break;
    }
  });
  return params;
}






