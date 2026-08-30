/**
 * Estimates (Quotes) — full-featured standalone page
 * Pipeline view · Expiry tracking · Convert-to-invoice · Bulk actions
 * Uses EstimateModal (full-screen form) from the Invoices feature
 */
import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Edit2, Trash2, RefreshCw, CheckCircle2,
  ArrowRight, Search, Send, Copy, TrendingUp, TrendingDown,
  Clock, AlertTriangle, BarChart2, List, LayoutGrid,
  Download, Filter, X, ChevronDown, Eye, Calendar,
  ArrowUpRight, Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useDebounce } from '../hooks';
import { estimatesApi } from '../services/ovdsApi';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { fmtCurrency } from '../utils/fmt';
import { Can } from '../components/can';
import EstimateModal from '../components/invoice/estimateModal';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EstimateItem {
  id?: string;
  itemId?: string | null;
  description?: string | null;
  quantity: number;
  price: number;
  discount?: number;
}

export interface Estimate {
  id: string;
  invoiceNumber?: string;
  estimateNumber?: string;
  customer?: string;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerTin?: string | null;
  status: string;
  date?: string;
  estimateDate?: string;
  dueDate?: string;
  expiryDate?: string;
  subtotal?: number;
  vatAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  total?: number;
  notes?: string | null;
  items?: EstimateItem[];
  convertedInvoiceId?: string | null;
  companyId?: string | null;
  paymentTerms?: string;
  invoiceCurrency?: string;
  invoiceDiscount?: number;
  referenceNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

type StatusFilter = 'ALL' | 'DRAFT' | 'PENDING' | 'PAID' | 'REJECTED' | 'EXPIRED';
type ViewMode = 'list' | 'kanban';
type SortField = 'date' | 'dueDate' | 'totalAmount' | 'customer' | 'status';
type SortDir = 'asc' | 'desc';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MS_PER_DAY = 86_400_000;
const DEFAULT_DUE_DAYS = 30;
const fmt = (n: number) => fmtCurrency(n, 'ETB');

function getEstimateNumber(e: Estimate) {
  return e.estimateNumber ?? e.invoiceNumber ?? '—';
}
function getCustomerName(e: Estimate) {
  return e.customer ?? e.customerName ?? '—';
}
function getDate(e: Estimate) {
  return e.date ?? e.estimateDate ?? '';
}
function getExpiry(e: Estimate) {
  return e.dueDate ?? e.expiryDate ?? '';
}
function getTotal(e: Estimate) {
  return Number(e.totalAmount ?? e.total ?? 0);
}

function daysUntilExpiry(e: Estimate): number | null {
  const exp = getExpiry(e);
  if (!exp) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expDate = new Date(exp);
  expDate.setHours(0, 0, 0, 0);
  return Math.round((expDate.getTime() - now.getTime()) / MS_PER_DAY);
}


// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  DRAFT:    { label: 'Draft',     cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',         dot: 'bg-slate-400' },
  PENDING:  { label: 'Sent',      cls: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400',               dot: 'bg-sky-500' },
  PAID:     { label: 'Accepted',  cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected',  cls: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',           dot: 'bg-rose-500' },
  EXPIRED:  { label: 'Expired',   cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',       dot: 'bg-amber-500' },
  SENT:     { label: 'Sent',      cls: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400',               dot: 'bg-sky-500' },
  ACCEPTED: { label: 'Accepted',  cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  CONVERTED:{ label: 'Converted', cls: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',   dot: 'bg-violet-500' },
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const m = STATUS_META[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

// ── Expiry badge ─────────────────────────────────────────────────────────────
const ExpiryBadge: React.FC<{ estimate: Estimate }> = ({ estimate }) => {
  const days = daysUntilExpiry(estimate);
  if (days === null || estimate.status === 'PAID' || estimate.status === 'ACCEPTED' || estimate.status === 'CONVERTED') return null;
  if (days < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold">
      <AlertTriangle size={9} /> Expired {Math.abs(days)}d ago
    </span>
  );
  if (days === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
      <Clock size={9} /> Expires today
    </span>
  );
  if (days <= 3) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
      <Clock size={9} /> {days}d left
    </span>
  );
  return null;
};


// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { val: string; pos: boolean } | null;
}> = ({ label, value, sub, icon, color, trend }) => (
  <div className={`rounded-xl border p-4 flex flex-col gap-2 ${color}`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
      <span className="opacity-50">{icon}</span>
    </div>
    <div className="flex items-end justify-between gap-2">
      <p className="text-2xl font-black tabular-nums leading-none">{value}</p>
      {trend && (
        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend.pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
          {trend.pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend.val}
        </span>
      )}
    </div>
    {sub && <p className="text-[10px] opacity-50 font-medium">{sub}</p>}
  </div>
);

// ── Kanban column ─────────────────────────────────────────────────────────────
const KanbanCol: React.FC<{
  label: string; count: number; total: number;
  color: string; headerCls: string; dotCls: string;
  estimates: Estimate[];
  onEdit: (e: Estimate) => void;
  onSend: (e: Estimate) => void;
  onAccept: (e: Estimate) => void;
  onConvert: (e: Estimate) => void;
  onDelete: (e: Estimate) => void;
  canWrite: boolean;
}> = ({ label, count, total, color, headerCls, dotCls, estimates, onEdit, onSend, onAccept, onConvert, onDelete, canWrite }) => (
  <div className="flex-1 min-w-[220px] max-w-[320px] flex flex-col gap-2">
    <div className={`rounded-xl px-4 py-3 ${headerCls} border border-slate-200 dark:border-slate-700`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotCls}`} />
          <span className={`text-xs font-bold ${color}`}>{label}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {total > 0 && <p className={`text-sm font-black tabular-nums mt-1 ${color}`}>{fmt(total)}</p>}
    </div>
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
      {estimates.map(est => (
        <KanbanCard key={est.id} estimate={est} onEdit={onEdit} onSend={onSend} onAccept={onAccept} onConvert={onConvert} onDelete={onDelete} canWrite={canWrite} />
      ))}
    </div>
  </div>
);


// ── Kanban Card ───────────────────────────────────────────────────────────────
const KanbanCard: React.FC<{
  estimate: Estimate;
  onEdit: (e: Estimate) => void;
  onSend: (e: Estimate) => void;
  onAccept: (e: Estimate) => void;
  onConvert: (e: Estimate) => void;
  onDelete: (e: Estimate) => void;
  canWrite: boolean;
}> = ({ estimate: est, onEdit, onSend, onAccept, onConvert, onDelete, canWrite }) => {
  const days = daysUntilExpiry(est);
  const urgent = days !== null && days >= 0 && days <= 3;
  const expired = days !== null && days < 0;
  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-xl border transition-all hover:shadow-md cursor-default
      ${urgent ? 'border-amber-300 dark:border-amber-700' : expired ? 'border-rose-200 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="px-3.5 pt-3.5 pb-2.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">{getEstimateNumber(est)}</span>
          <StatusPill status={est.status} />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mb-1">{getCustomerName(est)}</p>
        <div className="flex items-center justify-between">
          <span className="text-base font-black tabular-nums text-slate-800 dark:text-slate-100">{fmt(getTotal(est))}</span>
          <ExpiryBadge estimate={est} />
        </div>
        {getDate(est) && (
          <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Calendar size={9} />
            {new Date(getDate(est)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {est.status === 'DRAFT' && canWrite && (
          <button onClick={() => onSend(est)} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
            <Send size={9} /> Send
          </button>
        )}
        {est.status === 'PENDING' && canWrite && (
          <button onClick={() => onAccept(est)} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
            <CheckCircle2 size={9} /> Accept
          </button>
        )}
        {est.status === 'PAID' && canWrite && (
          <button onClick={() => onConvert(est)} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all">
            <ArrowRight size={9} /> Convert
          </button>
        )}
        {canWrite && (est.status === 'DRAFT' || est.status === 'PENDING') && (
          <button onClick={() => onEdit(est)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ml-auto">
            <Edit2 size={10} />
          </button>
        )}
        {est.status === 'DRAFT' && canWrite && (
          <button onClick={() => onDelete(est)} className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
            <Trash2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Estimates: React.FC = () => {
  usePageTitle('Estimates & Quotes');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const navigate = useNavigate();
  const canWrite = can('invoices:write');

  // ── Data state ────────────────────────────────────────────────────────────
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; draft: number; sent: number; accepted: number } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [customers, setCustomers] = useState<string[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  // ── View / modal state ────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalEstimate, setModalEstimate] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Blank estimate factory ────────────────────────────────────────────────
  const blankEstimate = useCallback(() => ({
    estimateNumber: '',
    customer: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerTin: '',
    status: 'DRAFT',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + DEFAULT_DUE_DAYS * MS_PER_DAY).toISOString().split('T')[0],
    paymentTerms: 'NET30',
    totalAmount: 0,
    vatAmount: 0,
    subtotal: 0,
    invoiceDiscount: 0,
    notes: '',
    invoiceCurrency: 'ETB',
    items: [{ itemId: '', quantity: 1, price: 0, discount: 0, description: '' }],
  }), []);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchEstimates = useCallback(async (pg = 1) => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res: any = await estimatesApi.list({
        companyId: selectedCompanyId,
        page: pg,
        limit: pageSize,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearch || undefined,
      });
      if (res && typeof res === 'object' && 'data' in res) {
        const r = res as any;
        const rows: Estimate[] = (r.data ?? []).map((e: any) => ({
          ...e,
          customer: e.customer ?? e.customerName ?? '',
        }));
        setEstimates(rows);
        setPage(r.pagination?.page ?? pg);
        setTotal(r.pagination?.total ?? rows.length);
        setTotalPages(r.pagination?.totalPages ?? r.pagination?.pages ?? 1);
      } else {
        const arr: Estimate[] = (Array.isArray(res) ? res : []).map((e: any) => ({
          ...e,
          customer: e.customer ?? e.customerName ?? '',
        }));
        setEstimates(arr);
        setPage(1);
        setTotal(arr.length);
        setTotalPages(1);
      }
    } catch {
      toast.error('Failed to load estimates');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, statusFilter, debouncedSearch, pageSize]);

  const fetchStats = useCallback(async () => {
    if (!selectedCompanyId) return;
    setStatsLoading(true);
    try {
      const res: any = await estimatesApi.stats(selectedCompanyId);
      const d = res?.data ?? res;
      setStats({ total: d?.total ?? 0, draft: d?.draft ?? 0, sent: d?.sent ?? 0, accepted: d?.accepted ?? 0 });
    } catch { /* non-fatal */ }
    finally { setStatsLoading(false); }
  }, [selectedCompanyId]);

  const fetchSupportData = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const [custRes, itemsRes, settingsRes] = await Promise.all([
        api.get(`/ovds/customers/registry?companyId=${selectedCompanyId}`),
        api.get(`/ovds/inventory/items?companyId=${selectedCompanyId}&take=200`),
        api.get('/settings'),
      ]);
      const custData = custRes.data?.data ?? custRes.data ?? [];
      setCustomers(
        Array.isArray(custData)
          ? custData.map((c: any) => typeof c === 'string' ? c : (c.customerName ?? c.name ?? '')).filter(Boolean)
          : []
      );
      setItemsList(
        Array.isArray(itemsRes.data?.data?.items) ? itemsRes.data.data.items
          : Array.isArray(itemsRes.data?.data) ? itemsRes.data.data
          : []
      );
      setSettings(settingsRes.data?.data ?? {});
    } catch { /* non-fatal */ }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchEstimates(1);
    fetchStats();
  }, [fetchEstimates, fetchStats]);

  useEffect(() => {
    fetchSupportData();
  }, [fetchSupportData]);

  const refresh = useCallback(() => {
    fetchEstimates(page);
    fetchStats();
  }, [fetchEstimates, fetchStats, page]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const sortedEstimates = useMemo(() => {
    return [...estimates].sort((a, b) => {
      let av: any, bv: any;
      switch (sortField) {
        case 'date':        av = getDate(a);    bv = getDate(b);    break;
        case 'dueDate':     av = getExpiry(a);  bv = getExpiry(b);  break;
        case 'totalAmount': av = getTotal(a);   bv = getTotal(b);   break;
        case 'customer':    av = getCustomerName(a); bv = getCustomerName(b); break;
        case 'status':      av = a.status;      bv = b.status;      break;
        default:            av = getDate(a);    bv = getDate(b);
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [estimates, sortField, sortDir]);

  const kanbanCols = useMemo(() => [
    { key: 'DRAFT',    label: 'Draft',    color: 'text-slate-600 dark:text-slate-300',      headerCls: 'bg-white dark:bg-slate-800',          dotCls: 'bg-slate-400' },
    { key: 'PENDING',  label: 'Sent',     color: 'text-sky-700 dark:text-sky-400',          headerCls: 'bg-sky-50 dark:bg-sky-950/30',         dotCls: 'bg-sky-500' },
    { key: 'PAID',     label: 'Accepted', color: 'text-emerald-700 dark:text-emerald-400',  headerCls: 'bg-emerald-50 dark:bg-emerald-950/30', dotCls: 'bg-emerald-500' },
    { key: 'REJECTED', label: 'Rejected', color: 'text-rose-700 dark:text-rose-400',        headerCls: 'bg-rose-50 dark:bg-rose-950/30',       dotCls: 'bg-rose-500' },
  ].map(col => ({
    ...col,
    estimates: sortedEstimates.filter(e => e.status === col.key),
    total: sortedEstimates.filter(e => e.status === col.key).reduce((s, e) => s + getTotal(e), 0),
    count: sortedEstimates.filter(e => e.status === col.key).length,
  })), [sortedEstimates]);

  const expiringCount = useMemo(() =>
    estimates.filter(e => { const d = daysUntilExpiry(e); return d !== null && d >= 0 && d <= 3 && e.status !== 'PAID' && e.status !== 'ACCEPTED'; }).length,
    [estimates]
  );
  const expiredCount = useMemo(() =>
    estimates.filter(e => { const d = daysUntilExpiry(e); return d !== null && d < 0 && e.status !== 'PAID' && e.status !== 'ACCEPTED'; }).length,
    [estimates]
  );
  const totalValue = useMemo(() => estimates.reduce((s, e) => s + getTotal(e), 0), [estimates]);
  const acceptedValue = useMemo(() => estimates.filter(e => e.status === 'PAID').reduce((s, e) => s + getTotal(e), 0), [estimates]);
  const conversionRate = useMemo(() => {
    const base = stats?.total ?? estimates.length;
    const accepted = stats?.accepted ?? estimates.filter(e => e.status === 'PAID').length;
    return base > 0 ? Math.round((accepted / base) * 100) : 0;
  }, [estimates, stats]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleNewEstimate = () => {
    setEditingId(null);
    setModalEstimate(blankEstimate());
    setShowModal(true);
  };

  const handleEditEstimate = (e: Estimate) => {
    setEditingId(e.id);
    setModalEstimate({ ...e, customer: getCustomerName(e) });
    setShowModal(true);
  };

  const handleModalSubmit = async (formEvent: React.FormEvent, status?: string) => {
    formEvent.preventDefault();
    if (!selectedCompanyId) return toast.error('Select a company first');
    const data = { ...modalEstimate, companyId: selectedCompanyId, status: status || modalEstimate.status || 'DRAFT' };
    try {
      if (editingId) {
        await estimatesApi.update(editingId, data);
        toast.success('Estimate updated');
      } else {
        await estimatesApi.create(data);
        toast.success('Estimate created');
      }
      setShowModal(false);
      refresh();
    } catch {
      toast.error('Failed to save estimate');
    }
  };

  const handleSend = async (e: Estimate) => {
    setActionLoading(e.id);
    try {
      await estimatesApi.send(e.id);
      toast.success(`${getEstimateNumber(e)} sent`);
      refresh();
    } catch { toast.error('Failed to send estimate'); }
    finally { setActionLoading(null); }
  };

  const handleAccept = async (e: Estimate) => {
    setActionLoading(e.id);
    try {
      await estimatesApi.update(e.id, { status: 'PAID' });
      toast.success(`${getEstimateNumber(e)} marked as accepted`);
      refresh();
    } catch { toast.error('Failed to update status'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (e: Estimate) => {
    setActionLoading(e.id);
    try {
      await estimatesApi.update(e.id, { status: 'REJECTED' });
      toast.success(`${getEstimateNumber(e)} marked as rejected`);
      refresh();
    } catch { toast.error('Failed to update status'); }
    finally { setActionLoading(null); }
  };

  const handleConvert = async (e: Estimate) => {
    const ok = await confirm({ title: `Convert ${getEstimateNumber(e)} to invoice?`, message: 'A new draft invoice will be created. The estimate will be marked as converted.', variant: 'info' });
    if (!ok) return;
    setActionLoading(e.id);
    try {
      const res: any = await estimatesApi.convertToInvoice(e.id);
      const invId = res?.id ?? res?.data?.id;
      toast.success(`Converted → ${res?.invoiceNumber ?? 'New invoice'}`);
      refresh();
      if (invId) setTimeout(() => navigate(`/sales/invoices`), 800);
    } catch { toast.error('Failed to convert estimate'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (e: Estimate) => {
    const ok = await confirm({ title: `Delete ${getEstimateNumber(e)}?`, message: 'This cannot be undone.', variant: 'danger' });
    if (!ok) return;
    setActionLoading(e.id);
    try {
      await estimatesApi.remove(e.id);
      toast.success('Estimate deleted');
      refresh();
    } catch { toast.error('Failed to delete estimate'); }
    finally { setActionLoading(null); }
  };

  const handleDuplicate = async (e: Estimate) => {
    setActionLoading(e.id);
    try {
      await api.post(`/ovds/estimates/${e.id}/duplicate`, {});
      toast.success('Estimate duplicated');
      refresh();
    } catch { toast.error('Failed to duplicate estimate'); }
    finally { setActionLoading(null); }
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const handleBulkSend = async () => {
    if (!selected.size) return;
    const ok = await confirm({ title: `Send ${selected.size} estimate(s)?`, variant: 'info' });
    if (!ok) return;
    try {
      await Promise.all(Array.from(selected).map(id => estimatesApi.send(id)));
      toast.success(`${selected.size} estimate(s) sent`);
      setSelected(new Set());
      refresh();
    } catch { toast.error('Bulk send failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    const ok = await confirm({ title: `Delete ${selected.size} estimate(s)?`, variant: 'danger' });
    if (!ok) return;
    try {
      await Promise.all(Array.from(selected).map(id => estimatesApi.remove(id)));
      toast.success(`${selected.size} estimate(s) deleted`);
      setSelected(new Set());
      refresh();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleExportCSV = () => {
    if (!sortedEstimates.length) return;
    const headers = ['Estimate #', 'Customer', 'Date', 'Valid Until', 'Status', 'Subtotal', 'VAT', 'Total'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = sortedEstimates.map(e => [
      getEstimateNumber(e), getCustomerName(e),
      getDate(e), getExpiry(e), e.status,
      e.subtotal ?? '', e.vatAmount ?? '', getTotal(e),
    ]);
    const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estimates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  // ── Sort toggle ───────────────────────────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortTh: React.FC<{ field: SortField; children: React.ReactNode; align?: string }> = ({ field, children, align }) => (
    <th
      onClick={() => toggleSort(field)}
      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 select-none whitespace-nowrap transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field
          ? <span className="text-teal-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
          : <span className="text-slate-200 dark:text-slate-700">↕</span>}
      </span>
    </th>
  );

  // ── Tab counts ────────────────────────────────────────────────────────────
  const tabCounts: Record<StatusFilter, number> = useMemo(() => ({
    ALL:      stats?.total ?? total,
    DRAFT:    stats?.draft ?? estimates.filter(e => e.status === 'DRAFT').length,
    PENDING:  stats?.sent  ?? estimates.filter(e => e.status === 'PENDING').length,
    PAID:     stats?.accepted ?? estimates.filter(e => e.status === 'PAID').length,
    REJECTED: estimates.filter(e => e.status === 'REJECTED').length,
    EXPIRED:  estimates.filter(e => e.status === 'EXPIRED').length,
  }), [stats, total, estimates]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
            <FileText size={17} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">Estimates & Quotes</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Create estimates, get approval from customers, and convert to invoices</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(expiringCount > 0 || expiredCount > 0) && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
              <AlertTriangle size={11} />
              {expiringCount > 0 && `${expiringCount} expiring soon`}
              {expiringCount > 0 && expiredCount > 0 && ' · '}
              {expiredCount > 0 && `${expiredCount} expired`}
            </span>
          )}
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
              ${showFilters ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
            <Filter size={12} /> Filters {showFilters && <X size={10} />}
          </button>
          <button onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
            <Download size={12} /> Export
          </button>
          <button onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <Can permission="invoices:write">
            <button onClick={handleNewEstimate}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-sm shadow-violet-200 dark:shadow-none">
              <Plus size={13} /> New Estimate
            </button>
          </Can>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Pipeline"
          value={fmt(totalValue)}
          sub={`${stats?.total ?? total} estimates`}
          icon={<FileText size={16} />}
          color="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
          trend={null}
        />
        <KpiCard
          label="Accepted Value"
          value={fmt(acceptedValue)}
          sub={`${stats?.accepted ?? estimates.filter(e => e.status === 'PAID').length} accepted`}
          icon={<CheckCircle2 size={16} />}
          color="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-100"
          trend={null}
        />
        <KpiCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          sub="Accepted ÷ Total"
          icon={<BarChart2 size={16} />}
          color={conversionRate >= 50
            ? 'bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-100'
            : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-100'}
          trend={null}
        />
        <KpiCard
          label="Pending Response"
          value={stats?.sent ?? estimates.filter(e => e.status === 'PENDING').length}
          sub={expiringCount > 0 ? `${expiringCount} expiring soon` : 'awaiting customer'}
          icon={<Clock size={16} />}
          color={expiringCount > 0
            ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-100'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'}
          trend={null}
        />
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search estimate # or customer…"
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all placeholder:text-slate-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all" />
            <span className="text-slate-300 text-sm">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all" />
          </div>
          {(search || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-rose-200 dark:border-rose-800">
              <X size={11} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ── Inline search (always shown) ─────────────────────────────────── */}
      {!showFilters && (
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
      )}

      {/* ── Tabs + view toggle ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
          {(['ALL', 'DRAFT', 'PENDING', 'PAID', 'REJECTED', 'EXPIRED'] as StatusFilter[]).map(tab => {
            const tabLabels: Record<StatusFilter, string> = {
              ALL: 'All', DRAFT: 'Draft', PENDING: 'Sent', PAID: 'Accepted', REJECTED: 'Rejected', EXPIRED: 'Expired',
            };
            const cnt = tabCounts[tab];
            return (
              <button key={tab} onClick={() => { setStatusFilter(tab); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                  ${statusFilter === tab ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                {tabLabels[tab]}
                {cnt > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusFilter === tab ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
          <button onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            title="List view"><List size={14} /></button>
          <button onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            title="Kanban view"><LayoutGrid size={14} /></button>
        </div>
      </div>

      {/* ── Bulk action bar ──────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl">
          <span className="text-xs font-bold text-violet-700 dark:text-violet-400">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-2">
            <button onClick={handleBulkSend}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-all border border-sky-200 dark:border-sky-800">
              <Send size={11} /> Send All
            </button>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all border border-rose-200 dark:border-rose-800">
              <Trash2 size={11} /> Delete
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto p-1 text-slate-400 hover:text-slate-600 transition-all">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Kanban view ──────────────────────────────────────────────────── */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {kanbanCols.map(col => (
            <KanbanCol
              key={col.key}
              label={col.label}
              count={col.count}
              total={col.total}
              color={col.color}
              headerCls={col.headerCls}
              dotCls={col.dotCls}
              estimates={col.estimates}
              onEdit={handleEditEstimate}
              onSend={handleSend}
              onAccept={handleAccept}
              onConvert={handleConvert}
              onDelete={handleDelete}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}

      {/* ── List view ────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Loading skeleton */}
          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="flex-1 grid grid-cols-7 gap-4">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <div key={j} className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : sortedEstimates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                <FileText size={22} className="text-violet-400" />
              </div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No estimates found</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Create your first estimate to send to customers for approval</p>
              {canWrite && (
                <button onClick={handleNewEstimate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-sm">
                  <Plus size={14} /> New Estimate
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox"
                      checked={sortedEstimates.length > 0 && sortedEstimates.every(e => selected.has(e.id))}
                      onChange={() => {
                        if (sortedEstimates.every(e => selected.has(e.id))) setSelected(new Set());
                        else setSelected(new Set(sortedEstimates.map(e => e.id)));
                      }}
                      className="w-3.5 h-3.5 rounded text-violet-600 accent-violet-600"
                    />
                  </th>
                  <SortTh field="date">Estimate #</SortTh>
                  <SortTh field="customer">Customer</SortTh>
                  <SortTh field="date">Date</SortTh>
                  <SortTh field="dueDate">Valid Until</SortTh>
                  <SortTh field="totalAmount" align="right">Total</SortTh>
                  <SortTh field="status">Status</SortTh>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {sortedEstimates.map(est => {
                  const isLoading = actionLoading === est.id;
                  const expiry = getExpiry(est);
                  const days = daysUntilExpiry(est);
                  const isUrgent = days !== null && days >= 0 && days <= 3 && est.status !== 'PAID' && est.status !== 'ACCEPTED';
                  const isExpired = days !== null && days < 0 && est.status !== 'PAID';
                  return (
                    <tr key={est.id}
                      className={`group transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30
                        ${isUrgent ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}
                        ${isExpired && est.status === 'DRAFT' ? 'opacity-60' : ''}`}>
                      <td className="w-10 px-4 py-3.5">
                        <input type="checkbox"
                          checked={selected.has(est.id)}
                          onChange={() => {
                            const s = new Set(selected);
                            if (s.has(est.id)) s.delete(est.id); else s.add(est.id);
                            setSelected(s);
                          }}
                          className="w-3.5 h-3.5 rounded text-violet-600 accent-violet-600"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">{getEstimateNumber(est)}</span>
                          <ExpiryBadge estimate={est} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">{getCustomerName(est)}</p>
                          {est.customerEmail && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{est.customerEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-500">
                        {getDate(est) ? new Date(getDate(est)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {expiry ? (
                          <span className={`text-[11px] ${isUrgent ? 'text-amber-600 font-semibold' : isExpired ? 'text-rose-500' : 'text-slate-500'}`}>
                            {new Date(expiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        ) : <span className="text-slate-300 text-[11px]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[12px] font-bold tabular-nums text-slate-800 dark:text-slate-100">{fmt(getTotal(est))}</span>
                        {(est.subtotal && est.vatAmount) ? (
                          <p className="text-[9px] text-slate-400">+{fmt(Number(est.vatAmount))} VAT</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5"><StatusPill status={est.status} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isLoading ? (
                            <RefreshCw size={13} className="animate-spin text-slate-400 mx-2" />
                          ) : (
                            <>
                              {/* Send: DRAFT only */}
                              {est.status === 'DRAFT' && canWrite && (
                                <ActionBtn onClick={() => handleSend(est)} title="Send to customer" hoverCls="hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-600 dark:hover:text-sky-400">
                                  <Send size={12} />
                                </ActionBtn>
                              )}
                              {/* Accept: PENDING */}
                              {est.status === 'PENDING' && canWrite && (
                                <ActionBtn onClick={() => handleAccept(est)} title="Mark as accepted" hoverCls="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400">
                                  <CheckCircle2 size={12} />
                                </ActionBtn>
                              )}
                              {/* Reject: PENDING */}
                              {est.status === 'PENDING' && canWrite && (
                                <ActionBtn onClick={() => handleReject(est)} title="Mark as rejected" hoverCls="hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500">
                                  <Minus size={12} />
                                </ActionBtn>
                              )}
                              {/* Convert: PAID/Accepted */}
                              {est.status === 'PAID' && canWrite && (
                                <ActionBtn onClick={() => handleConvert(est)} title="Convert to invoice" hoverCls="hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400">
                                  <ArrowRight size={12} />
                                </ActionBtn>
                              )}
                              {/* View navigates to invoice if converted */}
                              {est.convertedInvoiceId && (
                                <ActionBtn onClick={() => navigate('/sales/invoices')} title="View invoice" hoverCls="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700">
                                  <Eye size={12} />
                                </ActionBtn>
                              )}
                              {/* Edit: DRAFT or PENDING */}
                              {(est.status === 'DRAFT' || est.status === 'PENDING') && canWrite && (
                                <ActionBtn onClick={() => handleEditEstimate(est)} title="Edit" hoverCls="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200">
                                  <Edit2 size={12} />
                                </ActionBtn>
                              )}
                              {/* Duplicate: always */}
                              {canWrite && (
                                <ActionBtn onClick={() => handleDuplicate(est)} title="Duplicate" hoverCls="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200">
                                  <Copy size={12} />
                                </ActionBtn>
                              )}
                              {/* Delete: DRAFT only */}
                              {est.status === 'DRAFT' && canWrite && (
                                <ActionBtn onClick={() => handleDelete(est)} title="Delete" hoverCls="hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500">
                                  <Trash2 size={12} />
                                </ActionBtn>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {viewMode === 'list' && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{total} estimate{total !== 1 ? 's' : ''} · page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetchEstimates(page - 1); }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pg = start + i;
              if (pg > totalPages) return null;
              return (
                <button key={pg} onClick={() => { setPage(pg); fetchEstimates(pg); }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border
                    ${pg === page ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  {pg}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); fetchEstimates(page + 1); }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── EstimateModal (full-screen, from Invoices feature) ───────────── */}
      {showModal && (
        <EstimateModal
          show={showModal}
          estimate={modalEstimate}
          setEstimate={setModalEstimate}
          onClose={() => { setShowModal(false); setEditingId(null); setModalEstimate(blankEstimate()); }}
          onSubmit={handleModalSubmit}
          itemsList={itemsList}
          currency={settings?.default_currency ?? 'ETB'}
          customers={customers}
          settings={settings}
        />
      )}
    </div>
  );
};

// ── Tiny action button helper ─────────────────────────────────────────────────
const ActionBtn: React.FC<{
  onClick: () => void;
  title: string;
  hoverCls: string;
  children: React.ReactNode;
}> = ({ onClick, title, hoverCls, children }) => (
  <button
    onClick={e => { e.stopPropagation(); onClick(); }}
    title={title}
    className={`w-6 h-6 rounded-md flex items-center justify-center text-slate-400 transition-all ${hoverCls}`}
  >
    {children}
  </button>
);

export default Estimates;
