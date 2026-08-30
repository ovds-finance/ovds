/**
 * BankingRules — Auto-match rules for automatic transaction categorisation
 *
 * Section 5 of the banking user flow:
 *   "Use automated rules to scan imported transactions. The system automatically
 *    categorises recurring items like utility bills, software subscriptions, or
 *    regular vendor payouts."
 *
 * Features:
 *   - Create / edit / delete rules (persisted in BankMatchingRule table)
 *   - Priority ordering — lower number evaluated first
 *   - Test a pattern against pending transactions before saving
 *   - Apply all rules with one click
 *   - Income / Expense / Any type filter
 *   - Active / inactive toggle
 *
 * API:
 *   GET    /banking/rules              — list rules
 *   POST   /banking/rules              — create rule
 *   PATCH  /banking/rules/:id          — update rule
 *   DELETE /banking/rules/:id          — delete rule
 *   POST   /banking/rules/test         — test pattern
 *   POST   /banking/rules/apply        — apply all rules
 */
import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Zap, Plus, Trash2, RefreshCw, Play, Edit2,
  FlaskConical, ArrowUp, ArrowDown, CheckCircle2,
  XCircle, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select,
  EmptyState, Card,
} from '../components/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AutoMatchRule {
  id: string;
  pattern: string;
  categoryId?: string;
  categoryName?: string;
  type: 'INCOME' | 'EXPENSE' | 'ANY';
  priority: number;
  isActive: boolean;
  hits: number;
  createdAt: string;
}

interface Category { id: string; name: string; type: string; }

const DEFAULT_FORM = { pattern: '', categoryId: '', categoryName: '', type: 'ANY' as 'ANY' | 'INCOME' | 'EXPENSE', priority: 0, isActive: true };

// ── Type badge ────────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
    type === 'INCOME'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800' :
    type === 'EXPENSE' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800' :
    'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
  }`}>{type}</span>
);

// ── Rule form ─────────────────────────────────────────────────────────────────

interface RuleFormProps {
  form: typeof DEFAULT_FORM;
  onChange: (f: typeof DEFAULT_FORM) => void;
  categories: Category[];
  onTest: () => void;
  testing: boolean;
  testResult: { matched: number; samples: string[] } | null;
}

const RuleForm: React.FC<RuleFormProps> = ({ form, onChange, categories, onTest, testing, testResult }) => {
  const set = (k: keyof typeof DEFAULT_FORM, v: any) => onChange({ ...form, [k]: v });

  const onCategoryChange = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    onChange({ ...form, categoryId: catId, categoryName: cat?.name ?? '' });
  };

  return (
    <div className="space-y-4">
      {/* Pattern with test button */}
      <FormField label="Pattern (substring match)" required>
        <div className="flex gap-2">
          <Input
            value={form.pattern}
            onChange={e => set('pattern', e.target.value)}
            placeholder='e.g. "telebirr", "ethiotelecom", "awash bank"'
            autoFocus
            className="flex-1"
          />
          <Btn
            variant="secondary"
            size="sm"
            icon={<FlaskConical size={11} />}
            loading={testing}
            disabled={!form.pattern.trim()}
            onClick={onTest}
          >
            Test
          </Btn>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Case-insensitive. Matches anywhere in the transaction description.</p>
      </FormField>

      {/* Test result */}
      {testResult !== null && (
        <div className={`flex items-start gap-3 p-3 rounded-xl border text-[11px] ${
          testResult.matched > 0
            ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500'
        }`}>
          {testResult.matched > 0 ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" /> : <Info size={13} className="shrink-0 mt-0.5" />}
          <div className="min-w-0">
            <p className="font-semibold">
              {testResult.matched > 0
                ? `Matches ${testResult.matched} pending transaction${testResult.matched !== 1 ? 's' : ''}`
                : 'No pending uncategorised transactions match this pattern'}
            </p>
            {testResult.samples.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {testResult.samples.map((s, i) => (
                  <li key={i} className="font-mono text-[10px] truncate text-slate-500 dark:text-slate-400">• {s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Type + priority */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Transaction Type">
          <Select value={form.type} onChange={e => set('type', e as any)}>
            <option value="ANY">Any (income + expense)</option>
            <option value="INCOME">Income only (credits)</option>
            <option value="EXPENSE">Expense only (debits)</option>
          </Select>
        </FormField>
        <FormField label="Priority">
          <Input
            type="number"
            min={0}
            max={999}
            value={form.priority}
            onChange={e => set('priority', parseInt(e.target.value, 10) || 0)}
          />
          <p className="text-[10px] text-slate-400 mt-1">Lower number = evaluated first. Rules with same priority apply in creation order.</p>
        </FormField>
      </div>

      {/* Category */}
      <FormField label="Assign Category">
        <Select value={form.categoryId} onChange={e => onCategoryChange(e)}>
          <option value="">No category</option>
          {(categories as Category[]).map((c: Category) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
        </Select>
      </FormField>

      {/* Free-text label fallback */}
      {!form.categoryId && (
        <FormField label="Category Label (free text)">
          <Input
            value={form.categoryName}
            onChange={e => set('categoryName', e.target.value)}
            placeholder='e.g. "Utilities", "Software Subscriptions"'
          />
        </FormField>
      )}

      {/* Active toggle */}
      <FormField label="Active">
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => set('isActive', !form.isActive)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-[11px] text-slate-500">{form.isActive ? 'Rule is active' : 'Rule is paused'}</span>
        </div>
      </FormField>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const BankingRules: React.FC = () => {
  usePageTitle('Auto-Match Rules');
  const { can }               = useAuth();
  const { selectedCompanyId } = useBusiness();
  const qc                    = useQueryClient();
  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';

  const [modal, setModal]   = useState<{ open: boolean; editId?: string; form: typeof DEFAULT_FORM }>({ open: false, form: DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ matched: number; samples: string[] } | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: rulesRaw = [], isLoading, refetch } = useQuery({
    queryKey: ['banking-rules', selectedCompanyId],
    queryFn: () => api.get(`/banking/rules${cq}`).then((r: any) => {
      const d = r.data?.data ?? r.data;
      return Array.isArray(d) ? d : [];
    }).catch(() => []),
    staleTime: 30_000,
  });
  const rules: AutoMatchRule[] = rulesRaw;

  const { data: catsRaw = [] } = useQuery({
    queryKey: ['banking-categories', selectedCompanyId],
    queryFn: () => api.get(`/banking/categories${cq}`).then((r: any) => {
      const d = r.data?.data ?? r.data;
      return Array.isArray(d) ? d : [];
    }).catch(() => []),
    staleTime: 60_000,
  });
  const categories: Category[] = catsRaw;

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpi = [
    { label: 'Total Rules',   value: rules.length,                                                              color: 'slate'   as const },
    { label: 'Active',        value: rules.filter((r: AutoMatchRule) => r.isActive).length,                     color: 'emerald' as const },
    { label: 'Income Rules',  value: rules.filter((r: AutoMatchRule) => r.type === 'INCOME').length,            color: 'sky'     as const },
    { label: 'Expense Rules', value: rules.filter((r: AutoMatchRule) => r.type === 'EXPENSE').length,           color: 'rose'    as const },
    { label: 'Total Hits',    value: rules.reduce((s: number, r: AutoMatchRule) => s + (r.hits ?? 0), 0),       color: 'violet'  as const },
  ];

  // ── Actions ───────────────────────────────────────────────────────────────

  const openNew = () => {
    setTestResult(null);
    setModal({ open: true, form: { ...DEFAULT_FORM } });
  };

  const openEdit = (rule: AutoMatchRule) => {
    setTestResult(null);
    setModal({
      open:   true,
      editId: rule.id,
      form: {
        pattern:      rule.pattern,
        categoryId:   rule.categoryId ?? '',
        categoryName: rule.categoryName ?? '',
        type:         rule.type,
        priority:     rule.priority,
        isActive:     rule.isActive,
      },
    });
  };

  const handleTest = useCallback(async () => {
    if (!modal.form.pattern.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const r = await api.post(`/banking/rules/test${cq}`, { pattern: modal.form.pattern });
      setTestResult(r.data?.data ?? r.data);
    } catch {
      toast.error('Test failed');
    } finally {
      setTesting(false);
    }
  }, [modal.form.pattern, cq]);

  const handleSave = useCallback(async () => {
    if (!modal.form.pattern.trim()) { toast.error('Pattern is required'); return; }
    setSaving(true);
    try {
      const payload = {
        pattern:      modal.form.pattern.trim(),
        categoryId:   modal.form.categoryId || undefined,
        categoryName: modal.form.categoryName || undefined,
        type:         modal.form.type,
        priority:     modal.form.priority,
        isActive:     modal.form.isActive,
        companyId:    selectedCompanyId,
      };

      if (modal.editId) {
        await api.patch(`/banking/rules/${modal.editId}`, payload);
        toast.success('Rule updated');
      } else {
        await api.post('/banking/rules', payload);
        toast.success('Rule created');
      }

      setModal({ open: false, form: DEFAULT_FORM });
      setTestResult(null);
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  }, [modal, selectedCompanyId, refetch]);

  const handleDelete = useCallback(async (rule: AutoMatchRule) => {
    if (!await confirm({ title: `Delete rule "${rule.pattern}"?`, variant: 'danger', message: `This rule has matched ${rule.hits} transactions. Existing categorisations will not be reversed.` })) return;
    try {
      await api.delete(`/banking/rules/${rule.id}`);
      toast.success('Rule deleted');
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    }
  }, [refetch]);

  const handleToggleActive = useCallback(async (rule: AutoMatchRule) => {
    try {
      await api.patch(`/banking/rules/${rule.id}`, { isActive: !rule.isActive });
      toast.success(rule.isActive ? 'Rule paused' : 'Rule activated');
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    }
  }, [refetch]);

  const handlePriority = useCallback(async (rule: AutoMatchRule, dir: 'up' | 'down') => {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const idx    = sorted.findIndex(r => r.id === rule.id);
    const swap   = dir === 'up' ? sorted[idx - 1] : sorted[idx + 1];
    if (!swap) return;
    try {
      await Promise.all([
        api.patch(`/banking/rules/${rule.id}`, { priority: swap.priority }),
        api.patch(`/banking/rules/${swap.id}`, { priority: rule.priority }),
      ]);
      refetch();
    } catch {
      toast.error('Failed to reorder');
    }
  }, [rules, refetch]);

  const handleApply = useCallback(async () => {
    if (!selectedCompanyId) { toast.error('Select a company first'); return; }
    setApplying(true);
    try {
      const r = await api.post(`/banking/rules/apply?companyId=${selectedCompanyId}`);
      const d = r.data?.data ?? r.data;
      toast.success(`${d?.matched ?? 0} transactions auto-categorised by ${d?.rules ?? 0} rules`);
      qc.invalidateQueries({ queryKey: ['banking-txns'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to apply rules');
    } finally {
      setApplying(false);
    }
  }, [selectedCompanyId, qc]);

  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppPage
      title="Auto-Match Rules"
      subtitle="Automatically categorise recurring transactions — utility bills, subscriptions, vendor payouts"
      icon={<Zap size={18} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'Banking', to: '/banking' }, { label: 'Rules' }]}
      actions={
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
          {can('banking:write') && (
            <Btn variant="secondary" size="sm" icon={<Play size={11} />} loading={applying} onClick={handleApply}>
              Apply All Rules
            </Btn>
          )}
          {can('banking:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={openNew}>New Rule</Btn>
          )}
        </div>
      }
    >
      <AppKpi cells={kpi} />

      {/* How it works */}
      <Card className="p-4 bg-violet-50/50 dark:bg-violet-950/10 border-violet-100 dark:border-violet-900">
        <div className="flex items-start gap-3">
          <Zap size={15} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-violet-800 dark:text-violet-300 mb-1">How Auto-Match Rules Work</p>
            <p className="text-[11px] text-violet-600 dark:text-violet-400">
              Rules are evaluated in <strong>priority order</strong> (lowest number first). When a PENDING transaction's description
              contains the pattern (case-insensitive), it is automatically assigned the linked category. Use "Test" before saving
              to see how many transactions a pattern matches. Click "Apply All Rules" to run against all uncategorised transactions.
            </p>
          </div>
        </div>
      </Card>

      <AppTable loading={isLoading}>
        <thead><tr>
          <AppTh width="56px">Priority</AppTh>
          <AppTh>Pattern</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Category</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right">Hits</AppTh>
          <AppTh>Created</AppTh>
          <AppTh align="right" width="100px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {sortedRules.length === 0 && !isLoading ? (
            <tr><td colSpan={8}>
              <EmptyState
                icon={<Zap size={18} className="text-violet-400" />}
                title="No rules yet"
                desc="Create a rule to auto-categorise transactions matching a pattern."
                action={can('banking:write') ? { label: 'New Rule', onClick: openNew } : undefined}
              />
            </td></tr>
          ) : sortedRules.map((rule, idx) => (
            <AppTr key={rule.id} className={!rule.isActive ? 'opacity-50' : undefined}>

              {/* Priority + reorder */}
              <AppTd>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums w-5 text-right">{rule.priority}</span>
                  {can('banking:write') && (
                    <div className="flex flex-col">
                      <button
                        onClick={() => handlePriority(rule, 'up')}
                        disabled={idx === 0}
                        className="w-4 h-3.5 flex items-center justify-center text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={9} />
                      </button>
                      <button
                        onClick={() => handlePriority(rule, 'down')}
                        disabled={idx === sortedRules.length - 1}
                        className="w-4 h-3.5 flex items-center justify-center text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ArrowDown size={9} />
                      </button>
                    </div>
                  )}
                </div>
              </AppTd>

              {/* Pattern */}
              <AppTd>
                <code className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-violet-700 dark:text-violet-400">
                  {rule.pattern}
                </code>
              </AppTd>

              {/* Type */}
              <AppTd><TypeBadge type={rule.type} /></AppTd>

              {/* Category */}
              <AppTd>
                {rule.categoryName
                  ? <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{rule.categoryName}</span>
                  : <span className="text-[10px] text-slate-300 italic">No category</span>}
              </AppTd>

              {/* Active */}
              <AppTd>
                {can('banking:write') ? (
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                      rule.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                    title={rule.isActive ? 'Click to pause' : 'Click to activate'}
                  >
                    {rule.isActive ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                    {rule.isActive ? 'Active' : 'Paused'}
                  </button>
                ) : (
                  <span className={`text-[10px] font-bold ${rule.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {rule.isActive ? 'Active' : 'Paused'}
                  </span>
                )}
              </AppTd>

              {/* Hits */}
              <AppTd align="right">
                <span className="text-[11px] font-mono tabular-nums text-slate-500">{rule.hits ?? 0}</span>
              </AppTd>

              {/* Created */}
              <AppTd>
                <span className="text-[11px] text-slate-400">
                  {new Date(rule.createdAt).toLocaleDateString()}
                </span>
              </AppTd>

              {/* Actions */}
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('banking:write') && (
                    <>
                      <button
                        onClick={() => openEdit(rule)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all"
                        title="Edit rule"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        title="Delete rule"
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      {/* Create / Edit modal */}
      <Modal
        open={modal.open}
        onClose={() => { setModal({ open: false, form: DEFAULT_FORM }); setTestResult(null); }}
        title={modal.editId ? 'Edit Auto-Match Rule' : 'New Auto-Match Rule'}
        subtitle="Define a pattern → category mapping for automatic transaction classification"
        footer={
          <>
            <Btn variant="secondary" onClick={() => { setModal({ open: false, form: DEFAULT_FORM }); setTestResult(null); }}>Cancel</Btn>
            <Btn variant="primary" loading={saving} onClick={handleSave}>
              {modal.editId ? 'Save Changes' : 'Create Rule'}
            </Btn>
          </>
        }
      >
        <RuleForm
          form={modal.form}
          onChange={f => setModal(m => ({ ...m, form: f }))}
          categories={categories}
          onTest={handleTest}
          testing={testing}
          testResult={testResult}
        />
      </Modal>
    </AppPage>
  );
};

export default BankingRules;

