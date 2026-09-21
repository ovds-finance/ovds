import { eimsApi } from '@ovds/features/eims';
import { recurringInvoicesApi } from '@ovds/features/invoice';
import {
  FileText,
  Building2,
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck2,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ShieldCheck,
  History,
  Repeat2,
  Send,
  Upload,
  BarChart2,
  Archive,
  List,
  LayoutGrid,
  Filter,
  X,
  Minus,
  Copy,
  Eye,
  AlertTriangle,
  BellRing,
  Ban,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import CustomerRegistryModal from '../components/invoice/customerRegistryModal';
import EstimateModal from '../components/invoice/estimateModal';
import InvoiceModuleModal from '../components/invoice/InvoiceModuleModal';
import {
  InvoiceModalsProvider,
  InvoiceModals,
} from '../components/invoiceModals';
import { DEFAULT_INVOICE_COLUMN_KEYS } from '../components/invoicesTable';
import { type PipelineView } from '../components/pipelineComponents';
import { ActionsRow, ActionsIconBtn } from '../components/ui/ActionsRow';
import { DataGrid, GridStatusBadge, type GridColumn, type GridRowAction } from '../components/ui/DataGrid';
import { GridPageLayout, type GridTab } from '../components/ui/GridPageLayout';
import { MetricsOverviewGrid, type MetricItem } from '../components/ui/MetricsOverviewGrid';
import { useBusiness } from '../context/businessContext';
import {
  useAuditLog,
  useInterval,
  usePageTitle,
  useDebounce,
} from '../hooks';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { invoicesApi, estimatesApi } from '../services/ovdsApi';
import { confirm, prompt } from '../utils/confirm';
import { matchesEimsFilter, type EimsFilter } from '../utils/eimsBadge';
import { calcLineTax } from '../utils/ethiopianTax';
import { fmtCurrency } from '../utils/fmt';
// ── Grid-over-Card architecture imports ───────────────────────────────────────

// -- Design tokens -------------------------------------------------------------
const fmt = (n: number) => fmtCurrency(n, 'ETB');

// -- Named constants (replaces magic numbers) ----------------------------------
const MS_PER_DAY = 86_400_000;
const DEFAULT_DUE_DAYS = 30;
const DEFAULT_VAT_RATE = 15;
const MONTHLY_CHART_MONTHS = 6;
const INTERVAL_DAILY_FACTOR = 30;
const INTERVAL_WEEKLY_FACTOR = 4.33;
const INTERVAL_QUARTERLY_FACTOR = 3;
const INTERVAL_YEARLY_FACTOR = 12;
const FULL_DATE_OPTS: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };

// -- Local Invoice type --------------------------------------------------------
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerEmail?: string | null;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'SENT';
  date: string;
  dueDate?: string | null;
  paidAt?: string | null;
  subtotal?: number;
  vatAmount?: number;
  totalAmount: number;
  paymentSource?: string | null;
  isRecurring?: boolean;
  recurringInterval?: string | null;
  payments?: { amount: number; paidAt: string }[];
  [key: string]: unknown;
}

// -- Estimate type -------------------------------------------------------------
export interface Estimate {
  id: string;
  estimateNumber: string;
  customer: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'CONVERTED';
  date: string;
  dueDate?: string | null;
  subtotal?: number;
  vatAmount?: number;
  totalAmount: number;
  notes?: string | null;
  items?: any[];
  convertedInvoiceId?: string | null;
  [key: string]: unknown;
}

// -- Types ---------------------------------------------------------------------
type MainTab = 'INVOICES' | 'ESTIMATES' | 'RECURRING';
type StatusTab = 'ALL' | 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
type EstimateStatusTab =
  | 'ALL'
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CONVERTED';
type SourceFilter =
  | 'ALL'
  | 'MANUAL'
  | 'TELECOM'
  | 'BANK_QR'
  | 'CHAPA'
  | 'BANK_TRANSFER'
  | 'CASH';
type EimsFilterTab = EimsFilter;
type SortField =
  | 'date'
  | 'dueDate'
  | 'totalAmount'
  | 'subtotal'
  | 'customer'
  | 'invoiceNumber';
type SortDir = 'asc' | 'desc';
type InvoiceViewMode = 'list' | 'kanban';

// -- KPI Card (same design as Estimates page) ---------------------------------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const InvKpiCard: React.FC<{
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
        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend.pos ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-rose-500'}`}>
          {trend.pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend.val}
        </span>
      )}
    </div>
    {sub && <p className="text-[10px] opacity-50 font-medium">{sub}</p>}
  </div>
);

// -- Status pill (same design as Estimates page) ------------------------------
const INV_STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',          dot: 'bg-slate-400' },
  PENDING:   { label: 'Sent',      cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',        dot: 'bg-amber-500' },
  PAID:      { label: 'Paid',      cls: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]', dot: 'bg-[var(--pro-azure-50)]0' },
  OVERDUE:   { label: 'Overdue',   cls: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',            dot: 'bg-rose-500' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',          dot: 'bg-slate-300' },
};
const InvStatusPill: React.FC<{ status: string }> = ({ status }) => {
  const m = INV_STATUS_META[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

// -- Kanban column (invoice) --------------------------------------------------
const InvKanbanCol: React.FC<{
  label: string; count: number; total: number;
  color: string; headerCls: string; dotCls: string;
  invoices: Invoice[];
  onEdit: (inv: Invoice) => void;
  onSend: (inv: Invoice) => void;
  onDelete: (inv: Invoice) => void;
  onRecordPayment: (inv: Invoice) => void;
  onRowClick: (inv: Invoice) => void;
}> = ({ label, count, total, color, headerCls, dotCls, invoices: colInvoices, onEdit, onSend, onDelete, onRecordPayment, onRowClick }) => (
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
      {colInvoices.map(inv => (
        <div
          key={inv.id}
          onClick={() => onRowClick(inv)}
          className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md cursor-default"
        >
          <div className="px-3.5 pt-3.5 pb-2.5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {inv.invoiceNumber || `INV-${inv.id.slice(-6)}`}
              </span>
              <InvStatusPill status={inv.status} />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mb-1">{inv.customer}</p>
            <div className="flex items-center justify-between">
              <span className="text-base font-black tabular-nums text-slate-800 dark:text-slate-100">{fmt(Number(inv.totalAmount))}</span>
            </div>
            {inv.dueDate && (
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Calendar size={9} />
                {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {inv.status === 'DRAFT' && (
              <button onClick={e => { e.stopPropagation(); onSend(inv); }} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
                <Send size={9} /> Send
              </button>
            )}
            {inv.status === 'PENDING' && (
              <button onClick={e => { e.stopPropagation(); onRecordPayment(inv); }} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20 transition-all">
                <CheckCircle2 size={9} /> Record Payment
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); onEdit(inv); }} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ml-auto">
              <Edit2 size={10} />
            </button>
            {inv.status === 'DRAFT' && (
              <button onClick={e => { e.stopPropagation(); onDelete(inv); }} className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                <Trash2 size={10} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// -- Tiny action button helper ------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const InvActionBtn: React.FC<{
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

// -- Main Component ----------------------------------------------------------
const InvoicesInner: React.FC = () => {
  usePageTitle('Invoices & Estimates');
  const { t } = useTranslation();
  const { selectedCompanyId: rawSelectedCompanyId, companies } = useBusiness();
  const selectedCompanyId = rawSelectedCompanyId ?? (companies.length > 0 ? companies[0].id : null);
  const { log } = useAuditLog();
  const { queueCount, isSyncing, syncNow } = useOfflineQueue();
  const { isOnline } = useNetworkStatus();

  // -- State -----------------------------------------------------------------
  const [mainTab, setMainTab] = useState<MainTab>('INVOICES');

  // -- Invoice blank factory -------------------------------------------------
  const blankInvoice = useCallback(
    (dueDays?: number) => ({
      invoiceNumber: '',
      customer: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      customerTin: '',
      status: 'DRAFT',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + (dueDays ?? DEFAULT_DUE_DAYS) * MS_PER_DAY).toISOString().split('T')[0],
      paymentTerms: 'NET30',
      totalAmount: 0,
      vatAmount: 0,
      subtotal: 0,
      discountAmount: 0,
      invoiceDiscount: 0,
      discountType: 'FIXED',
      discountValue: 0,
      discountLocation: 'TOTAL',
      category: '',
      footer: '',
      lateInterestRate: 0,
      paymentSource: '',
      telecomReceiptRef: '',
      bankName: '',
      customerNotes: '',
      notes: '',
      invoiceCurrency: 'ETB',
      companyTitle: 'TAX INVOICE',
      invoiceTemplate: 'modern',
      invoiceColor: '#2563EB',
      terms: '',
      isRecurring: false,
      recurringInterval: 'MONTHLY',
      ifrsPerformanceObligation: '',
      ifrsRecognitionTiming: 'POINT_IN_TIME',
      ifrsContractRef: '',
      ifrsVariableConsideration: 'NONE',
      ifrsReceivableClass: 'CURRENT',
      ifrsCreditRisk: 'LOW',
      ifrsEclProvision: '',
      ifrsMeasurementCategory: 'AMORTISED_COST',
      ifrsHasWarranty: false,
      ifrsWarrantyProvision: '',
      ifrsContingency: 'NONE',
      interactionType: '',
      archType: '',
      processType: '',
      items: [
        {
          id: Math.random().toString(36).slice(2, 11),
          itemId: '',
          quantity: 1,
          price: 0,
          discount: 0,
          discountType: 'FIXED',
          discountValue: 0,
          description: '',
          showDiscount: false,
          showTax: true,
          showTaxPanel: false,
          taxRate: null,
        },
      ],
      ccEmails: [],
      bccEmails: [],
      taxes: [],
    }),
    [],
  );

  // -- Modal State -----------------------------------------------------------
  const [newInvoice, setNewInvoice] = useState<any>(blankInvoice);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [showIngestionHub, setShowIngestionHub] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [_showShortcuts, setShowShortcuts] = useState(false);
  const [receiptViewerRef, setReceiptViewerRef] = useState('');
  const [evidenceInvoice, setEvidenceInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [showCustomerRegistry, setShowCustomerRegistry] = useState(false);
  const [showInvoiceModuleModal, setShowInvoiceModuleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState<
    'send' | 'cancel' | null
  >(null);
  const [drawerInvoice, setDrawerInvoice] = useState<Invoice | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [customers, setCustomers] = useState<string[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);

  // -- Estimates State -------------------------------------------------------
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [estimatePage, setEstimatePage] = useState(1);
  const [estimateTotalPages, setEstimateTotalPages] = useState(1);
  const [estimateTotalCount, setEstimateTotalCount] = useState(0);
   const [estimateStatusTab, setEstimateStatusTab] =
     useState<EstimateStatusTab>('ALL');
   const [estimateSearch, setEstimateSearch] = useState('');
   const [selectedEstimates, setSelectedEstimates] = useState<Set<string>>(new Set());
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [showCustomerRegistryStandalone, setShowCustomerRegistryStandalone] =
    useState(false);
  const [registryCustomers, setRegistryCustomers] = useState<any[]>([]);
  const debouncedEstimateSearch = useDebounce(estimateSearch, 400);
  const blankEstimate = useCallback(
    (dueDays?: number) => ({
      estimateNumber: '',
      customer: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      customerTin: '',
      status: 'DRAFT',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + (dueDays ?? DEFAULT_DUE_DAYS) * MS_PER_DAY).toISOString().split('T')[0],
      paymentTerms: 'NET30',
      totalAmount: 0,
      vatAmount: 0,
      subtotal: 0,
      invoiceDiscount: 0,
      notes: '',
      items: [
        { itemId: '', quantity: 1, price: 0, discount: 0, description: '' },
      ],
    }),
    [],
  );
  const [newEstimate, setNewEstimate] = useState<any>(blankEstimate);

  // -- Invoice Table State ---------------------------------------------------
  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [eimsFilter, setEimsFilter] = useState<EimsFilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);
  // -- Pipeline view state ---------------------------------------------------
  const [pipelineView] = useState<PipelineView>('list');
  // -- List/kanban toggle (matches Estimates page) ---------------------------
  const [invoiceViewMode, setInvoiceViewMode] = useState<InvoiceViewMode>('list');
  // -- Filter panel toggle (matches Estimates page) -------------------------
  const [showFilters, setShowFilters] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<any>({});
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchTerm, 400);

  const sortedCustomers = useMemo(() => {
    if (!customers.length || !invoices.length) return customers;
    const recency = new Map<string, number>();
    invoices.forEach((inv, idx) => {
      if (inv.customer && !recency.has(inv.customer)) {
        recency.set(inv.customer, invoices.length - idx);
      }
    });
    return [...customers].sort((a, b) => (recency.get(b) || 0) - (recency.get(a) || 0));
  }, [customers, invoices]);

  // -- Analytics Computeds ---------------------------------------------------
  const totalBilled = useMemo(
    () =>
      invoices
        .filter((i) => i.status !== 'CANCELLED')
        .reduce((a, i) => a + Number(i.totalAmount), 0),
    [invoices],
  );
  const prevMonthBilled = useMemo(() => {
    const d = new Date();
    const lastMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const endLastMonth = new Date(d.getFullYear(), d.getMonth(), 0);
    return invoices
      .filter((i) => i.status !== 'CANCELLED')
      .filter((i) => {
        const id = new Date(i.date);
        return id >= lastMonth && id <= endLastMonth;
      })
      .reduce((a, i) => a + Number(i.totalAmount), 0);
  }, [invoices]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const billedTrend = useMemo(() => {
    const currMonth = invoices
      .filter((i) => i.status !== 'CANCELLED')
      .filter((i) => {
        const id = new Date(i.date);
        return (
          id.getFullYear() === today.getFullYear() &&
          id.getMonth() === today.getMonth()
        );
      })
      .reduce((a, i) => a + Number(i.totalAmount), 0);
    if (prevMonthBilled === 0) return { val: '0%', pos: true };
    const diff = ((currMonth - prevMonthBilled) / prevMonthBilled) * 100;
    return { val: `${Math.abs(Math.round(diff))}%`, pos: diff >= 0 };
  }, [invoices, prevMonthBilled, today]);

  const overdueCount = useMemo(
    () => invoices.filter((i) => i.status === 'OVERDUE').length,
    [invoices],
  );
  const collectionRate = useMemo(() => {
    const totalCollected = invoices.reduce(
      (a, i) =>
        a + (i.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0),
      0,
    );
    return totalBilled > 0
      ? Math.round((totalCollected / totalBilled) * 100)
      : 0;
  }, [invoices, totalBilled]);
  const dso = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'PAID');
    if (paid.length) {
      const totalDays = paid.reduce((s, i) => {
        const created = new Date(i.date).getTime();
        let pAt = i.paidAt ? new Date(i.paidAt as string).getTime() : 0;
        if (!pAt && i.payments && i.payments.length > 0) {
          pAt = Math.max(...i.payments.map((p) => new Date(p.paidAt).getTime()));
        }
        if (!pAt) return s;
        return s + Math.max(0, (pAt - created) / MS_PER_DAY);
      }, 0);
      const count = paid.filter(
        (i) => i.paidAt || (i.payments && i.payments.length > 0),
      ).length;
      return count > 0 ? Math.round(totalDays / count) : 0;
    }

    const unpaid = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
    if (!unpaid.length) return 0;
    const now = Date.now();
    const totalDays = unpaid.reduce((s, i) => {
      const created = new Date(i.date).getTime();
      return s + Math.max(0, (now - created) / MS_PER_DAY);
    }, 0);
    return Math.round(totalDays / unpaid.length);
  }, [invoices]);
  const monthlyData = useMemo(
    () =>
      Array.from({ length: MONTHLY_CHART_MONTHS }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
        const label = d.toLocaleString('en-US', { month: 'short' });
        const mis = invoices.filter((inv) => {
          const id = new Date(inv.date);
          return (
            id.getFullYear() === d.getFullYear() &&
            id.getMonth() === d.getMonth()
          );
        });
        return {
          label,
          invoiced: mis.reduce((s, inv) => s + Number(inv.totalAmount), 0),
          collected: mis
            .filter((inv) => inv.status === 'PAID')
            .reduce((s, inv) => s + Number(inv.totalAmount), 0),
          count: mis.length,
        };
      }),
    [invoices, today],
  );
  const displayInvoices = useMemo(() => {
    if (eimsFilter === 'ALL' || pipelineView === 'list') return invoices;
    return invoices.filter((inv) => matchesEimsFilter(inv as any, eimsFilter));
  }, [invoices, eimsFilter, pipelineView]);

  // -- Data Fetching ---------------------------------------------------------
  const fetchSettings = useCallback(async () => {
    try {
      const r = await api.get('/settings');
      setSettings(r.data.data || {});
      const raw = localStorage.getItem('col_vis_invoice_columns');
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      const cols = parsed.length > 0 ? parsed : DEFAULT_INVOICE_COLUMN_KEYS;
      setVisibleCols(new Set(cols));
    } catch {
      toast.error('Failed to load settings');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  const fetchCustomersAndItems = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const [custRes, itemsRes] = await Promise.all([
        api.get(`/ovds/customers/registry?companyId=${selectedCompanyId}`),
        api.get(`/ovds/inventory/items?companyId=${selectedCompanyId}&take=200`),
      ]);
      const custData: unknown = custRes.data?.data?.data ?? custRes.data?.data ?? custRes.data;
      setCustomers(
        Array.isArray(custData)
          ? custData
              .map((c: string | { customerName?: string; name?: string }) =>
                typeof c === 'string' ? c : (c.customerName ?? c.name ?? ''),
              )
              .filter(Boolean)
          : [],
      );
      setItemsList(
        Array.isArray(itemsRes.data.data?.items)
          ? itemsRes.data.data.items
          : Array.isArray(itemsRes.data.data)
            ? itemsRes.data.data
            : [],
      );
    } catch {
      toast.error('Failed to load customers and items');
    }
  }, [selectedCompanyId]);

  const fetchEstimates = useCallback(
    async (page = 1) => {
      if (!selectedCompanyId) return;
      try {
        setEstimatesLoading(true);
        const res = await estimatesApi.list({
          companyId: selectedCompanyId,
          page,
          limit: pageSize,
          status: estimateStatusTab !== 'ALL' ? estimateStatusTab : undefined,
          search: debouncedEstimateSearch || undefined,
        });
        // estimatesApi.list returns unwrapped data — handle both paginated and array shapes
        if (res && typeof res === 'object' && 'data' in (res as any)) {
          const r = res as any;
          setEstimates(r.data ?? []);
          setEstimatePage(r.pagination?.page || page);
          setEstimateTotalPages(r.pagination?.totalPages || 1);
          setEstimateTotalCount(r.pagination?.total || 0);
        } else {
          const arr = Array.isArray(res) ? res : [];
          setEstimates(arr);
          setEstimatePage(1);
          setEstimateTotalPages(1);
          setEstimateTotalCount(arr.length);
        }
      } catch {
        toast.error('Failed to load estimates');
        setEstimates([]);
      } finally {
        setEstimatesLoading(false);
      }
    },
    [selectedCompanyId, estimateStatusTab, debouncedEstimateSearch, pageSize],
  );

  const fetchRegistryCustomers = useCallback(async () => {
    try {
      const url = selectedCompanyId
        ? `/ovds/customers/registry?companyId=${selectedCompanyId}`
        : `/ovds/customers/registry`;
      const r = await api.get(url, { headers: { 'x-background': '1' } } as any);
      const raw = r.data?.data?.data ?? r.data?.data ?? r.data ?? [];
      setRegistryCustomers(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load registry customers');
      setRegistryCustomers([]);
    }
  }, [selectedCompanyId]);

  const fetchInvoices = useCallback(
    async (page = 1, overridePageSize?: number) => {
      try {
        setLoading(true);
        const params: Record<string, unknown> = { page, limit: overridePageSize ?? pageSize };
        if (statusTab !== 'ALL') params.status = statusTab;
        if (debouncedSearch) params.search = debouncedSearch;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        if (sourceFilter !== 'ALL') params.paymentSource = sourceFilter;
        if (eimsFilter !== 'ALL') params.eimsStatus = eimsFilter;
        if (selectedCompanyId) params.companyId = selectedCompanyId;
        params.sortBy = sortField;
        params.sortOrder = sortDir;
        const r = await api.get('/ovds/invoices', { params });
        const d = r.data.data;
        const raw: any[] = d?.data ?? [];
        const normalised: Invoice[] = raw.map((inv) => ({
          ...inv,
          customer: inv.customer ?? inv.customerName ?? '',
          customerEmail: inv.customerEmail ?? null,
        }));
        setInvoices(normalised);
        setTotalInvoices(d?.pagination?.total ?? 0);
        setTotalPages(d?.pagination?.pages ?? 1);
        setCurrentPage(d?.pagination?.page ?? page);
      } catch {
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    },
    [
      pageSize,
      statusTab,
      debouncedSearch,
      dateFrom,
      dateTo,
      sourceFilter,
      eimsFilter,
      selectedCompanyId,
      sortField,
      sortDir,
    ],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await invoicesApi.stats(selectedCompanyId);
      setStatusCounts({
        DRAFT: res?.draftCount ?? 0,
        PENDING: res?.pendingCount ?? 0,
        PAID: res?.paidCount ?? 0,
        OVERDUE: res?.overdueCount ?? 0,
      });
    } catch {
      toast.error('Failed to load stats');
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      const dueDays = Number(settings?.invoice_due_days) || DEFAULT_DUE_DAYS;
      setNewInvoice(blankInvoice(dueDays));
      setShowAddModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
  }, [blankInvoice, settings]);

  useEffect(() => {
    fetchSettings();
    fetchInvoices(1);
    fetchStats();
  }, [fetchSettings, fetchInvoices, fetchStats]);

  useEffect(() => {
    fetchCustomersAndItems();
  }, [fetchCustomersAndItems]);

  useEffect(() => {
    if (mainTab === 'ESTIMATES') fetchEstimates();
  }, [mainTab, fetchEstimates]);

  useInterval(() => {
    fetchInvoices(currentPage);
    fetchStats();
  }, 60000);

  // -- Handlers --------------------------------------------------------------
  const handlePageChange = useCallback(
    (page: number) => fetchInvoices(page),
    [fetchInvoices],
  );
  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      fetchInvoices(1, size); // pass size directly — avoids stale-closure on pageSize state
    },
    [fetchInvoices],
  );
  const handleToggleAll = useCallback(() => {
    if (invoices.length > 0 && invoices.every((i) => selected.has(i.id)))
      setSelected(new Set());
    else setSelected(new Set(invoices.map((i) => i.id)));
  }, [invoices, selected]);
  const handleToggleSelect = useCallback(
    (id: string) => {
      const newSelected = new Set(selected);
      if (selected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      setSelected(newSelected);
    },
    [selected],
  );
  const handleRefresh = useCallback(() => {
    fetchInvoices(currentPage);
    fetchStats();
  }, [currentPage, fetchInvoices, fetchStats]);
  const handleExportCSV = useCallback(() => {
    if (!invoices.length) return;
    const headers = [
      'Invoice #',
      'Customer',
      'Date',
      'Due Date',
      'Status',
      'Total',
    ];
    const rows = invoices.map((i) => [
      i.invoiceNumber,
      i.customer,
      i.date,
      i.dueDate ?? '',
      i.status,
      i.totalAmount,
    ]);
    const csvEscape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [invoices]);

  const handleBulkSend = async () => {
    if (selected.size === 0) return toast.error(t('common.select_items'));
    if (
      !(await confirm({
        title: `Send ${selected.size} invoice(s)?`,
        variant: 'info',
      }))
    )
      return;
    try {
      const res = await invoicesApi.bulkSend(Array.from(selected));
      const sent = (res as any)?.sent ?? selected.size;
      toast.success(`${sent} sent`);
      fetchInvoices(currentPage);
    } catch {
      toast.error('Bulk send failed');
    }
  };

  const handleBulkEimsRegister = async () => {
    if (selected.size === 0) return toast.error(t('common.select_items'));
    const eligible = invoices.filter(
      (i) => selected.has(i.id) && i.status !== 'DRAFT' && i.status !== 'CANCELLED' && !(i as any).eimsIrn,
    );
    if (eligible.length === 0) {
      return toast.error('No eligible invoices selected (must be sent and not yet EIMS-registered)');
    }
    if (
      !(await confirm({
        title: `Register ${eligible.length} invoice(s) with EIMS?`,
        variant: 'info',
      }))
    )
      return;
    try {
      if (eligible.length === 1) {
        await eimsApi.invoices.register(eligible[0].id);
        toast.success('Invoice registered with EIMS');
      } else {
        const res = await eimsApi.bulk.register(eligible.map((i) => i.id));
        toast.success(`Bulk registration submitted — job ${(res as any)?.conversationId?.slice(0, 12) ?? ''}`);
      }
      setSelected(new Set());
      fetchInvoices(currentPage);
    } catch {
      toast.error('EIMS bulk registration failed');
    }
  };

  const handleNewInvoice = useCallback(() => {
    const dueDays = Number(settings?.invoice_due_days) || DEFAULT_DUE_DAYS;
    setNewInvoice(blankInvoice(dueDays));
    setShowAddModal(true);
  }, [blankInvoice, settings]);

  // -- Keyboard shortcuts (Ovds SaaS style) ------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '');
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewInvoice();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(v => !v);
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleNewInvoice]);

  const handleSubmitInvoice = useCallback(
    async (e: React.FormEvent, forcedStatus?: string) => {
      e.preventDefault();
      if (!selectedCompanyId) return toast.error('Select a company first');
      const customerName = (newInvoice.customer || '').trim();
      if (!customerName) return toast.error('Customer name is required');
      const hasItems = (newInvoice.items ?? []).some(
        (li: { price: number }) => Number(li.price) > 0,
      );
      if (!hasItems) return toast.error('Add at least one item');

      // Compute totals
      const items = newInvoice.items ?? [];
      let subtotal = 0;
      let totalVat = 0;
      items.forEach((li: { price: number; quantity: number; discountValue: number; showDiscount: boolean; discountType: string; taxRate: number | null; showTax?: boolean }) => {
        const price = Number(li.price || 0);
        const qty = Number(li.quantity || 0);
        const discVal = Number(li.discountValue || 0);
        const net =
          price * qty -
          (li.showDiscount
            ? li.discountType === 'PERCENT'
              ? (price * qty * discVal) / 100
              : discVal
            : 0);
        subtotal += net;
        const vatRate =
          li.taxRate != null
            ? Number(li.taxRate)
            : Number(settings?.ovds_default_vat_rate || DEFAULT_VAT_RATE);
        totalVat += li.showTax !== false ? calcLineTax(net, vatRate) : 0;
      });
      // GAP-1 FIX: DRRF (1%) must be included in the stored totalAmount so it
      // matches the live-preview and the backend's calculateInvoiceTotals().
      // The old formula (subtotal + totalVat) was ~1% lower than displayed.
      // Ovds SaaS always stores the full amount the customer owes.
      const invoiceDiscVal   = Number(newInvoice.discountValue || 0);
      const invoiceDiscType  = (newInvoice.discountType || 'FIXED') as 'PERCENT' | 'FIXED';
      const invoiceDiscAmt   = invoiceDiscType === 'PERCENT'
        ? subtotal * (invoiceDiscVal / 100)
        : invoiceDiscVal;
      const subtotalAfterDisc = Math.max(0, subtotal - invoiceDiscAmt);
      const drrfAmount  = Math.round(subtotalAfterDisc * 0.01 * 100) / 100;
      const grandTotal  = Math.round((subtotalAfterDisc + totalVat + drrfAmount) * 100) / 100;

      try {
        const isSend = forcedStatus === 'PENDING';
        const payload: any = {
          ...newInvoice,
          companyId: selectedCompanyId,
          totalAmount: grandTotal,
          subtotal,
          vatAmount: totalVat,
          status: isSend ? 'DRAFT' : (forcedStatus || newInvoice.status || 'DRAFT'),
          // Map frontend field aliases to backend/DTO field names
          customerName: (newInvoice.customerName || newInvoice.customer || '').trim(),
          currencyCode: newInvoice.invoiceCurrency || newInvoice.currencyCode || 'ETB',
          // Strip frontend-only display/UI fields the backend doesn't know about
          customer: undefined,
          invoiceCurrency: undefined,
          companyTitle: undefined,
          invoiceTemplate: undefined,
          invoiceColor: undefined,
          terms: undefined,
          interactionType: undefined,
          archType: undefined,
          processType: undefined,
          ccEmails: undefined,
          bccEmails: undefined,
          _convertedFromEstimate: undefined,
        };

        // Build buyerDetails for B2B transactions from structured address fields
        const buyerTin = (newInvoice.customerTin || '').trim();
        if (buyerTin) {
          payload.buyerDetails = {
            tin: buyerTin,
            legalName: newInvoice.customer || undefined,
            email: newInvoice.customerEmail || undefined,
            phone: newInvoice.customerPhone || undefined,
            region: newInvoice.buyerRegion || undefined,
            zone: newInvoice.buyerZone || undefined,
            kebele: newInvoice.buyerKebele || undefined,
            wereda: newInvoice.buyerWereda || undefined,
            city: newInvoice.buyerCity || undefined,
            houseNumber: newInvoice.buyerHouseNumber || undefined,
            country: 'ET',
          };
        }

        // Auto-generate invoice number when empty (matches estimate behaviour)
        if (!payload.invoiceNumber && !payload.id) {
          try {
            const n = await invoicesApi.nextNumber(selectedCompanyId);
            payload.invoiceNumber = n.nextNumber;
          } catch {
            // Fall through — backend will generate a number server-side
          }
        }

        const saved: any = payload.id
          ? await invoicesApi.update(payload.id, payload)
          : await invoicesApi.create(payload);
        const savedId = payload.id || saved?.id;

        if (isSend) {
          try {
            await invoicesApi.send(savedId);
            toast.success('Invoice sent to customer');
          } catch {
            toast.error('Saved as draft — send failed');
          }
        } else {
          toast.success('Invoice saved');
        }
        setShowAddModal(false);
        fetchInvoices(currentPage);
        fetchStats();
      } catch (err) {
        toast.error(`Failed to save invoice: ${(err as Error)?.message ?? 'Unknown error'}`);
      }
    },
    [newInvoice, selectedCompanyId, currentPage, fetchInvoices, fetchStats, settings],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!(await confirm({ title: 'Delete this invoice?', variant: 'danger' })))
        return;
      try {
        await invoicesApi.remove(id);
        toast.success('Deleted');
        fetchInvoices(currentPage);
        fetchStats();
      } catch {
        toast.error('Delete failed');
      }
    },
    [currentPage, fetchInvoices, fetchStats],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSend = async (id: string) => {
    try {
      await invoicesApi.send(id);
      toast.success('Sent');
      fetchInvoices(currentPage);
    } catch {
      toast.error('Send failed');
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handlePrint = (id: string) =>
    window.open(`${api.defaults.baseURL || '/api'}/ovds/invoices/${id}/pdf`, '_blank');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDuplicate = async (id: string) => {
    try {
      await invoicesApi.duplicate(id);
      toast.success('Duplicated');
      fetchInvoices(currentPage);
    } catch {
      toast.error('Duplicate failed');
    }
  };
  const handleCreditNote = async (id: string) => {
    try {
      await invoicesApi.creditNote(id);
      toast.success('Credit note created — register with EIMS from drawer if auto-register is off');
      fetchInvoices(currentPage);
    } catch {
      toast.error('Credit note failed');
    }
  };
  const handleDebitNote = async (id: string, amount: number) => {
    try {
      await invoicesApi.debitNote(id, amount);
      toast.success('Debit note created (DBN) — register with EIMS from drawer if auto-register is off');
      fetchInvoices(currentPage);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Debit note failed');
    }
  };
  const handleVoidInvoice = async (id: string) => {
    const reason = await (prompt as any)({
      title: 'Void invoice',
      message: 'Enter a reason for voiding this invoice (required for audit trail)',
      placeholder: 'e.g. Issued in error',
    });
    if (!reason?.trim()) return;
    try {
      await invoicesApi.void(id, reason.trim(), 'CANCELLED');
      toast.success('Invoice voided');
      fetchInvoices(currentPage);
      fetchStats();
    } catch {
      toast.error('Void invoice failed');
    }
  };
  const handleSendReminder = async (id: string) => {
    try {
      await invoicesApi.sendReminder(id);
      toast.success('Reminder sent');
    } catch {
      toast.error('Send reminder failed');
    }
  };
  const handleBulkDuplicate = async () => {
    if (selected.size === 0) return;
    try {
      await Promise.all(
        Array.from(selected).map((id) => invoicesApi.duplicate(id)),
      );
      toast.success(`${selected.size} invoice(s) duplicated`);
      setSelected(new Set());
      fetchInvoices(currentPage);
    } catch {
      toast.error('Failed to duplicate');
    }
  };
  const handleBulkDelete = async () => {
    if (selected.size === 0) return toast.error(t('common.select_items'));
    if (
      !(await confirm({
        title: `Delete ${selected.size} invoice(s)?`,
        variant: 'danger',
      }))
    )
      return;
    try {
    const results = await Promise.allSettled(
      Array.from(selected).map((id) => invoicesApi.remove(id)),
    );
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed    = results.filter(r => r.status === 'rejected').length;
    if (succeeded > 0) toast.success(`${succeeded} invoice(s) deleted`);
    if (failed    > 0) toast.error(`${failed} invoice(s) could not be deleted`);
    setSelected(new Set());
    fetchInvoices(currentPage);
    fetchStats();
  } catch {
    toast.error('Bulk delete failed');
  }
};

  const handleBulkArchive = async () => {
    if (selected.size === 0) return toast.error(t('common.select_items'));
    if (
      !(await confirm({
        title: `Archive ${selected.size} invoice(s)?`,
        message: 'Archived invoices are hidden from the active view but remain in reports.',
        variant: 'info',
      }))
    )
      return;
    try {
      // Archive = set status to a hidden ARCHIVED state via bulk-cancel alias
      // Backend stores CANCELLED; a future /bulk-archive endpoint can refine this.
      await Promise.all(
        Array.from(selected).map((id) =>
          invoicesApi.update(id, { status: 'CANCELLED', archivedAt: new Date().toISOString() }),
        ),
      );
      toast.success(`${selected.size} invoice(s) archived`);
      setSelected(new Set());
      fetchInvoices(currentPage);
      fetchStats();
    } catch {
      toast.error('Bulk archive failed');
    }
  };

  // -- Estimates Handlers ---------------------------------------------------
  const handleSubmitEstimate = async (e: React.FormEvent, status?: string) => {
    e.preventDefault();
    if (!selectedCompanyId) return toast.error('Select a company first');

    // Calculate totals for estimate
    let subtotal = 0;
    let totalVat = 0;
    const items = newEstimate.items ?? [];
    items.forEach((li: { price: number; quantity: number; discount: number }) => {
      const price = Number(li.price || 0);
      const qty = Number(li.quantity || 0);
      const disc = Number(li.discount || 0);
      const net = price * qty - (price * qty * disc) / 100;
      subtotal += net;
      const vatRate = Number(settings?.ovds_default_vat_rate || DEFAULT_VAT_RATE);
      totalVat += net * (vatRate / 100);
    });
    const invoiceDiscountAmt =
      subtotal * (Number(newEstimate.invoiceDiscount || 0) / 100);
    const totalAmount = subtotal - invoiceDiscountAmt + totalVat;

    try {
      const isSend = status === 'SENT';
      const payload = {
        ...newEstimate,
        companyId: selectedCompanyId,
        status: isSend ? 'DRAFT' : (status || 'DRAFT'),
        totalAmount,
        vatAmount: totalVat,
        subtotal,
      };
      let saved: any;
      if (editingEstimate) {
        saved = await estimatesApi.update(editingEstimate.id, payload);
      } else {
        // Auto-generate estimate number if missing
        if (!payload.estimateNumber) {
          try {
            const n = await estimatesApi.nextNumber(selectedCompanyId);
            payload.estimateNumber = n.nextNumber;
          } catch {
            // fall through — backend will generate one
          }
        }
        saved = await estimatesApi.create(payload);
      }
      const savedId = editingEstimate ? editingEstimate.id : saved?.id;

      if (isSend) {
        try {
          await estimatesApi.send(savedId);
          toast.success('Estimate sent to customer');
        } catch {
          toast.error('Saved as draft — send failed');
        }
      } else {
        toast.success('Estimate saved');
      }
      setShowEstimateModal(false);
      fetchEstimates(editingEstimate ? estimatePage : 1);
    } catch {
      toast.error('Save estimate failed');
    }
  };

  const modalProps = {
    showAddModal,
    setShowAddModal,
    showCaptureModal,
    setShowCaptureModal,
    showIngestionHub,
    setShowIngestionHub,
    showPreview,
    setShowPreview,
    showReceiptViewer,
    setShowReceiptViewer,
    receiptViewerRef,
    setReceiptViewerRef,
    evidenceInvoice,
    setEvidenceInvoice,
    editingInvoice,
    setEditingInvoice,
    paymentInvoice,
    setPaymentInvoice,
    showCustomerRegistry,
    setShowCustomerRegistry,
    showBatchModal,
    setShowBatchModal,
    drawerInvoice,
    setDrawerInvoice,
    customers: sortedCustomers,
    itemsList,
    newInvoice,
    setNewInvoice,
    onSubmit: handleSubmitInvoice,
    onSave: fetchInvoices,
    settings,
    companyId: selectedCompanyId,
    currency: 'ETB',
    onCaptureApply: (data: any) => {
      setNewInvoice((prev: any) => ({
        ...prev,
        customer: data.customerName || prev.customer,
        customerEmail: data.customerEmail || prev.customerEmail,
        totalAmount: data.totalAmount ?? prev.totalAmount,
        vatAmount: data.vatAmount ?? prev.vatAmount,
        subtotal: data.subtotal ?? prev.subtotal,
        notes: data.notes || prev.notes,
        items: data.items?.length
          ? data.items.map((it: any) => ({
              id: Math.random().toString(36).slice(2, 11),
              itemId: '',
              quantity: it.quantity,
              price: it.unitPrice,
              discount: it.discount,
              description: it.description,
              showDiscount: false,
              showTax: true,
              showTaxPanel: false,
              taxRate: null,
            }))
          : prev.items,
      }));
      setShowCaptureModal(false);
      setShowAddModal(true);
    },
    onSaveEvidence: async (id: string, evidence: any) => {
      try {
        await invoicesApi.update(id, {
          telecomReceiptRef: evidence.telecomRef,
          bankName: evidence.bankName,
          bankAccountNo: evidence.bankAccountNo,
          paymentSource: evidence.paymentSource,
        });
        fetchInvoices(currentPage);
      } catch {
          toast.error('Save evidence failed');
        }
    },
    onSubmitInvoice: handleSubmitInvoice,
    onRefresh: handleRefresh,
    onDuplicate: handleDuplicate,
    onCreditNote: handleCreditNote,
    onDebitNote: handleDebitNote,
  };

  // ── Computed for new layout ───────────────────────────────────────────────
  const kanbanColDefs = useMemo(() => [
    { key: 'DRAFT' as const,    label: 'Draft',    color: 'text-slate-600 dark:text-slate-300',      headerCls: 'bg-white dark:bg-slate-800',          dotCls: 'bg-slate-400' },
    { key: 'PENDING' as const,  label: 'Sent',     color: 'text-amber-700 dark:text-amber-400',      headerCls: 'bg-amber-50 dark:bg-amber-950/30',    dotCls: 'bg-amber-500' },
    { key: 'OVERDUE' as const,  label: 'Overdue',  color: 'text-rose-700 dark:text-rose-400',        headerCls: 'bg-rose-50 dark:bg-rose-950/30',      dotCls: 'bg-rose-500' },
    { key: 'PAID' as const,     label: 'Paid',     color: 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',  headerCls: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30', dotCls: 'bg-[var(--pro-azure-50)]0' },
  ].map(col => ({
    ...col,
    invoices: invoices.filter(i => i.status === col.key),
    total: invoices.filter(i => i.status === col.key).reduce((s, i) => s + Number(i.totalAmount), 0),
    count: invoices.filter(i => i.status === col.key).length,
  })), [invoices]);

  // ── Grid-over-Card: column schema ─────────────────────────────────────────
  const gridColumns = useMemo((): GridColumn<Invoice>[] => [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      required: true,
      sortable: true,
      width: 'w-36',
      render: (_, inv) => (
        <button
          type="button"
          onClick={() => setDrawerInvoice(inv)}
          className="font-mono text-[11px] font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] hover:underline focus-visible:outline-none"
        >
          {inv.invoiceNumber || `INV-${inv.id.slice(-6)}`}
        </button>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      required: true,
      sortable: true,
      render: (_, inv) => (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">{inv.customer}</p>
          {inv.customerEmail && (
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{inv.customerEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      width: 'w-28',
      render: (v) => (
        <span className="text-[11px] text-slate-500">
          {v ? new Date(v as string).toLocaleDateString('en-GB', FULL_DATE_OPTS) : '—'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      width: 'w-28',
      render: (v, inv) => {
        if (!v) return <span className="text-slate-300 text-[11px]">—</span>;
        return (
          <span className={`text-[11px] ${inv.status === 'OVERDUE' ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
            {new Date(v as string).toLocaleDateString('en-GB', FULL_DATE_OPTS)}
          </span>
        );
      },
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      width: 'w-32',
      render: (v, inv) => (
        <div className="text-right">
          <span className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-100">{fmt(Number(v))}</span>
          {inv.vatAmount ? (
            <p className="text-[9px] text-slate-400">+{fmt(Number(inv.vatAmount))} VAT</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-28',
      render: (v) => <GridStatusBadge status={String(v)} />,
    },
  ], [setDrawerInvoice]);

  // ── Grid-over-Card: row actions ────────────────────────────────────────────
  const gridRowActions = useMemo((): GridRowAction<Invoice>[] => [
    {
      key: 'view',
      label: 'View details',
      icon: <Eye size={13} />,
      onClick: (inv) => setDrawerInvoice(inv),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit2 size={13} />,
      onClick: (inv) => { setEditingInvoice(inv); setShowAddModal(true); },
    },
    {
      key: 'send',
      label: 'Send to customer',
      icon: <Send size={13} />,
      visible: (inv) => inv.status === 'DRAFT',
      onClick: (inv) => handleSend(inv.id),
    },
    {
      key: 'record-payment',
      label: 'Record payment',
      icon: <CheckCircle2 size={13} />,
      visible: (inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE',
      onClick: (inv) => setPaymentInvoice(inv),
    },
    {
      key: 'download',
      label: 'Print / PDF',
      icon: <Download size={13} />,
      onClick: (inv) => handlePrint(inv.id),
    },
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: <Copy size={13} />,
      onClick: (inv) => handleDuplicate(inv.id),
    },
    {
      key: 'send-reminder',
      label: 'Send payment reminder',
      icon: <BellRing size={13} />,
      visible: (inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE',
      onClick: (inv) => handleSendReminder(inv.id),
    },
    {
      key: 'void',
      label: 'Void invoice',
      icon: <Ban size={13} />,
      visible: (inv) => inv.status === 'PENDING' || inv.status === 'SENT' || inv.status === 'OVERDUE',
      destructive: true,
      onClick: (inv) => handleVoidInvoice(inv.id),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={13} />,
      visible: (inv) => inv.status === 'DRAFT',
      destructive: true,
      onClick: (inv) => handleDelete(inv.id),
    },
  ], [setDrawerInvoice, setEditingInvoice, setShowAddModal, setPaymentInvoice, handleSend, handlePrint, handleDuplicate, handleDelete, handleVoidInvoice, handleSendReminder]);

  // ── Grid-over-Card: metrics strip ─────────────────────────────────────────
  const metricsItems = useMemo((): MetricItem[] => [
    {
      key: 'total-invoiced',
      label: t('invoices.kpiTotalInvoiced', 'Total Invoiced'),
      value: fmt(totalBilled),
      sub: `${totalInvoices} invoice${totalInvoices !== 1 ? 's' : ''}`,
      icon: <FileText size={16} />,
      accent: 'slate',
      loading,
      trend: billedTrend
        ? { label: billedTrend.val, direction: billedTrend.pos ? 'positive' : 'negative', period: 'vs last month' }
        : null,
    },
    {
      key: 'collection-rate',
      label: t('invoices.kpiCollected', 'Collection Rate'),
      value: `${collectionRate}%`,
      sub: 'Paid ÷ Total invoiced',
      icon: <CheckCircle2 size={16} />,
      accent: collectionRate >= 80 ? 'indigo' : collectionRate >= 50 ? 'amber' : 'rose',
      loading,
    },
    {
      key: 'overdue',
      label: t('invoices.kpiOverdue', 'Overdue'),
      value: overdueCount,
      sub: overdueCount > 0 ? 'Action required' : 'All current',
      icon: <AlertTriangle size={16} />,
      accent: overdueCount > 0 ? 'rose' : 'indigo',
      loading,
    },
    {
      key: 'dso',
      label: t('invoices.kpiDso', 'Days Sales Outstanding'),
      value: `${dso}d`,
      sub: dso <= 30 ? 'Excellent' : dso <= 45 ? 'On track' : dso <= 60 ? 'Watch' : 'Critical',
      icon: <TrendingUp size={16} />,
      accent: dso <= 30 ? 'slate' : dso <= 45 ? 'sky' : dso <= 60 ? 'amber' : 'rose',
      loading,
    },
  ], [totalBilled, totalInvoices, loading, billedTrend, collectionRate, overdueCount, dso, t]);

  // ── Grid-over-Card: main tab definitions ──────────────────────────────────
  const mainTabs = useMemo((): GridTab[] => [
    {
      key: 'INVOICES',
      label: t('invoices.title', 'Invoices'),
      icon: <FileText size={14} />,
      count: totalInvoices,
      active: mainTab === 'INVOICES',
      onClick: () => setMainTab('INVOICES'),
    },
    {
      key: 'ESTIMATES',
      label: t('invoices.estimates', 'Estimates'),
      icon: <ClipboardList size={14} />,
      count: estimateTotalCount,
      active: mainTab === 'ESTIMATES',
      onClick: () => setMainTab('ESTIMATES'),
    },
    {
      key: 'RECURRING',
      label: t('invoices.recurring', 'Recurring'),
      icon: <Repeat2 size={14} />,
      active: mainTab === 'RECURRING',
      onClick: () => setMainTab('RECURRING'),
    },
  ], [mainTab, totalInvoices, estimateTotalCount, t]);

  return (
    <InvoiceModalsProvider {...modalProps}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <GridPageLayout
          title={t('invoices.title', 'Invoices')}
          description={t('invoices.subtitle', 'Create and send ERCA-compliant invoices, track payments, and manage estimates.')}
          tabs={mainTabs}
          onRefresh={handleRefresh}
          refreshing={loading}
          headerActions={
            <div className="flex items-center gap-2">
              {(!isOnline || queueCount > 0) && (
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${!isOnline ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {!isOnline ? 'Offline' : `${queueCount} queued`}
                  {isOnline && queueCount > 0 && (
                    <button type="button" onClick={syncNow} disabled={isSyncing} className="ml-1 font-bold underline disabled:opacity-60">
                      {isSyncing ? 'Syncing…' : 'Sync'}
                    </button>
                  )}
                </span>
              )}
              {overdueCount > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-bold">
                  <AlertTriangle size={11} />
                  {overdueCount} overdue
                </span>
              )}
              <ActionsIconBtn
                label="Export CSV"
                icon={<Download size={14} />}
                onClick={handleExportCSV}
              />
              <ActionsIconBtn
                label="Analytics"
                icon={<BarChart2 size={14} />}
                onClick={() => setShowAnalytics(v => !v)}
                active={showAnalytics}
              />
            </div>
          }
          actionsRow={
            mainTab === 'INVOICES' ? (
              <div className="flex flex-col gap-2.5">
                <ActionsRow
                  searchValue={searchTerm}
                  onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
                  searchPlaceholder="Search invoice # or customer…"
                  filterOptions={[
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'PENDING', label: 'Sent' },
                    { value: 'PAID', label: 'Paid' },
                    { value: 'OVERDUE', label: 'Overdue' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                  ]}
                  filterValue={statusTab}
                  onFilterChange={(v) => { setStatusTab(v as StatusTab); setCurrentPage(1); fetchInvoices(1); }}
                  filterLabel="All Statuses"
                  primaryAction={{
                    label: 'New Invoice',
                    icon: <Plus size={14} />,
                    onClick: handleNewInvoice,
                  }}
                  secondaryActions={
                    <>
                      <ActionsIconBtn
                        label={showFilters ? 'Hide date filters' : 'Date filters'}
                        icon={<Filter size={14} />}
                        onClick={() => setShowFilters(f => !f)}
                        active={showFilters}
                      />
                      <ActionsIconBtn
                        label={invoiceViewMode === 'list' ? 'Kanban view' : 'List view'}
                        icon={invoiceViewMode === 'list' ? <LayoutGrid size={14} /> : <List size={14} />}
                        onClick={() => setInvoiceViewMode(m => m === 'list' ? 'kanban' : 'list')}
                      />
                    </>
                  }
                  resultCount={totalInvoices}
                  loading={loading}
                />

                {/* Date range + advanced filters — shown when expanded */}
                {showFilters && (
                  <div className="flex flex-wrap items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">

                    {/* Date range */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all"
                        aria-label="From date"
                      />
                      <span className="text-slate-300 text-sm">—</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all"
                        aria-label="To date"
                      />
                    </div>

                    {/* Source filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</span>
                      <select
                        value={sourceFilter}
                        onChange={e => setSourceFilter(e.target.value as typeof sourceFilter)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all cursor-pointer"
                      >
                        <option value="ALL">All sources</option>
                        <option value="MANUAL">Manual entry</option>
                        <option value="BANK_TRANSFER">Bank transfer</option>
                        <option value="CASH">Cash</option>
                        <option value="TELECOM">Telebirr / Telecom</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="MOBILE_BANKING">Mobile banking</option>
                      </select>
                    </div>

                    {/* EIMS registration status filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EIMS</span>
                      <select
                        value={eimsFilter}
                        onChange={e => setEimsFilter(e.target.value as typeof eimsFilter)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all cursor-pointer"
                      >
                        <option value="ALL">All EIMS statuses</option>
                        <option value="NEEDS_REGISTRATION">Needs registration</option>
                        <option value="REGISTERED">Registered ✓</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed ✗</option>
                      </select>
                    </div>

                    {/* Active filter indicator + clear */}
                    {(dateFrom || dateTo || sourceFilter !== 'ALL' || eimsFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setDateFrom('');
                          setDateTo('');
                          setSourceFilter('ALL');
                          setEimsFilter('ALL');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-rose-200 dark:border-rose-800 ml-auto"
                      >
                        <X size={11} /> Clear all filters
                      </button>
                    )}
                  </div>
                )}

                {/* Bulk action bar */}
                {selected.size > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[var(--pro-azure-50)] dark:bg-green-950/30 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl flex-wrap">

                    {/* Select-all toggle */}
                    <button
                      type="button"
                      onClick={handleToggleAll}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/40 transition-all"
                      title={invoices.length > 0 && invoices.every(i => selected.has(i.id)) ? 'Deselect all' : 'Select all on page'}
                    >
                      {invoices.length > 0 && invoices.every(i => selected.has(i.id))
                        ? <><Minus size={11} /> Deselect all</>
                        : <><CheckCircle2 size={11} /> Select all ({invoices.length})</>}
                    </button>

                    <span className="text-[var(--pro-azure-100)] dark:text-green-800 select-none">|</span>
                    <span className="text-xs font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
                      {selected.size} selected
                    </span>

                    <div className="flex items-center gap-1.5 ml-1 flex-wrap">
                      {/* Send */}
                      <button onClick={handleBulkSend} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 hover:bg-sky-200 transition-all border border-sky-200 dark:border-sky-800">
                        <Send size={11} /> Send All
                      </button>
                      {/* Duplicate */}
                      <button onClick={handleBulkDuplicate} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700">
                        <Copy size={11} /> Duplicate
                      </button>
                      {/* EIMS Register */}
                      <button
                        onClick={handleBulkEimsRegister}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 transition-all border border-teal-200 dark:border-teal-800"
                        title="Register selected invoices with MoR EIMS"
                      >
                        <ShieldCheck size={11} /> EIMS Register
                      </button>
                      {/* Archive */}
                      <button
                        onClick={handleBulkArchive}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-all border border-amber-200 dark:border-amber-800"
                        title="Archive selected invoices (hidden from active view)"
                      >
                        <Archive size={11} /> Archive
                      </button>
                      {/* Delete */}
                      <button onClick={handleBulkDelete} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all border border-rose-200 dark:border-rose-800">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>

                    <button onClick={() => setSelected(new Set())} className="ml-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all" title="Clear selection">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : undefined
          }
          metricsGrid={
            mainTab === 'INVOICES' ? (
              <MetricsOverviewGrid metrics={metricsItems} cols={4} />
            ) : undefined
          }
          dataGrid={
            mainTab === 'INVOICES' ? (
              invoiceViewMode === 'kanban' ? (
                /* ── Kanban view (preserved) ──────────────────────── */
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
                  {kanbanColDefs.map(col => (
                    <InvKanbanCol
                      key={col.key}
                      label={col.label}
                      count={col.count}
                      total={col.total}
                      color={col.color}
                      headerCls={col.headerCls}
                      dotCls={col.dotCls}
                      invoices={col.invoices}
                      onEdit={inv => { setEditingInvoice(inv); setShowAddModal(true); }}
                      onSend={inv => handleSend(inv.id)}
                      onDelete={inv => handleDelete(inv.id)}
                      onRecordPayment={inv => setPaymentInvoice(inv)}
                      onRowClick={inv => setDrawerInvoice(inv)}
                    />
                  ))}
                </div>
              ) : (
                /* ── Grid-over-Card list view ─────────────────────── */
                <DataGrid<Invoice>
                  columns={gridColumns}
                  rows={invoices}
                  rowActions={gridRowActions}
                  onRowClick={(inv) => setDrawerInvoice(inv)}
                  sortState={{ key: sortField, dir: sortDir }}
                  onSortChange={(s) => { setSortField(s.key as SortField); setSortDir(s.dir); fetchInvoices(currentPage); }}
                  loading={loading}
                  emptyMessage="No invoices found"
                  emptySubMessage="Create your first invoice or adjust the filters."
                  emptyAction={
                    <button
                      type="button"
                      onClick={handleNewInvoice}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white transition-all shadow-sm"
                    >
                      <Plus size={14} /> New Invoice
                    </button>
                  }
                  highlightRow={(inv) => inv.status === 'OVERDUE' ? 'danger' : false}
                />
              )
            ) : mainTab === 'ESTIMATES' ? (
              <EstimatesPanel
                estimates={estimates}
                loading={estimatesLoading}
                statusTab={estimateStatusTab}
                search={estimateSearch}
                page={estimatePage}
                totalPages={estimateTotalPages}
                totalCount={estimateTotalCount}
                onPageChange={(p: number) => { setEstimatePage(p); fetchEstimates(p); }}
                onStatusTabChange={(s: EstimateStatusTab) => { setEstimateStatusTab(s); fetchEstimates(1); }}
                onSearchChange={(v: string) => setEstimateSearch(v)}
                onNew={() => { setNewEstimate(blankEstimate()); setShowEstimateModal(true); }}
                onEdit={(est: Estimate) => { setEditingEstimate(est); setNewEstimate(est); setShowEstimateModal(true); }}
                onDelete={async (id: string) => {
                  if (!(await confirm({ title: 'Delete estimate?', variant: 'danger' }))) return;
                  try { await estimatesApi.delete(id); toast.success('Estimate deleted'); fetchEstimates(estimatePage); } catch { toast.error('Delete failed'); }
                }}
                onSend={async (id: string) => {
                  try { await estimatesApi.send(id); toast.success('Estimate sent'); fetchEstimates(estimatePage); } catch { toast.error('Send failed'); }
                }}
                onConvert={async (id: string) => {
                  try { await estimatesApi.convert(id); toast.success('Converted to invoice'); fetchInvoices(1); setMainTab('INVOICES'); } catch { toast.error('Convert failed'); }
                }}
                selectedEstimates={selectedEstimates}
                setSelectedEstimates={setSelectedEstimates}
                onRefresh={() => fetchEstimates(estimatePage)}
              />
            ) : (
              /* ── Recurring tab ────────────────────────────────────── */
              <RecurringPanel
                companyId={selectedCompanyId ?? undefined}
                onNewInvoice={handleNewInvoice}
                invoices={[]}
                onTrigger={() => {}}
                fmt={fmt}
              />
            )
          }
          pagination={
            mainTab === 'INVOICES' && invoiceViewMode === 'list'
              ? {
                  page: currentPage,
                  limit: pageSize,
                  total: totalInvoices,
                  totalPages,
                  onPageChange: handlePageChange,
                  onLimitChange: handlePageSizeChange,
                }
              : undefined
          }
        />

        {/* ── Preserved modals ────────────────────────────────────────────── */}
        <InvoiceModals {...modalProps} />

        {showEstimateModal && (
          <EstimateModal
            show={showEstimateModal}
            estimate={newEstimate}
            setEstimate={setNewEstimate}
            onClose={() => {
              setShowEstimateModal(false);
              setEditingEstimate(null);
              setNewEstimate(blankEstimate(Number(settings?.invoice_due_days) || DEFAULT_DUE_DAYS));
            }}
            onSubmit={handleSubmitEstimate}
            itemsList={itemsList}
            currency="ETB"
            customers={customers}
            settings={settings}
          />
        )}

        {showCustomerRegistryStandalone && (
          <CustomerRegistryModal
            customers={registryCustomers}
            onClose={() => setShowCustomerRegistryStandalone(false)}
            onRefresh={fetchRegistryCustomers}
            companyId={selectedCompanyId ?? undefined}
            onSelect={() => setShowCustomerRegistryStandalone(false)}
          />
        )}

        <InvoiceModuleModal
          show={showInvoiceModuleModal}
          onClose={() => setShowInvoiceModuleModal(false)}
        />
      </div>
    </InvoiceModalsProvider>
  );
}

// -- Estimates Panel ----------------------------------------------------------
const ESTIMATE_STATUS_TABS: {
  id: EstimateStatusTab;
  label: string;
  icon: any;
  color: string;
  dot: string;
}[] = [
  {
    id: 'ALL',
    label: 'All',
    icon: ClipboardList,
    color: 'text-slate-500',
    dot: 'bg-slate-400',
  },
  {
    id: 'DRAFT',
    label: 'Draft',
    icon: Clock,
    color: 'text-slate-500',
    dot: 'bg-slate-400',
  },
  {
    id: 'SENT',
    label: 'Sent',
    icon: Send,
    color: 'text-[var(--pro-azure)]',
    dot: 'bg-[var(--pro-azure-50)]0',
  },
  {
    id: 'ACCEPTED',
    label: 'Accepted',
    icon: CheckCircle2,
    color: 'text-[var(--pro-azure)]',
    dot: 'bg-[var(--pro-azure-50)]0',
  },
  {
    id: 'DECLINED',
    label: 'Declined',
    icon: XCircle,
    color: 'text-rose-500',
    dot: 'bg-rose-500',
  },
  {
    id: 'CONVERTED',
    label: 'Converted',
    icon: FileCheck2,
    color: 'text-teal-600',
    dot: 'bg-teal-500',
  },
];

const EstimatesPanel: React.FC<any> = ({
  estimates,
  loading,
  statusTab,
  search,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onStatusTabChange,
  onSearchChange,
  onNew,
  onEdit,
  onDelete,
  onSend,
  onConvert,
  onBulkDelete,
  selectedEstimates = new Set(),
  setSelectedEstimates,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const safeEstimates = Array.isArray(estimates) ? estimates : [];
  const selectedArr = Array.from(selectedEstimates);
  const allSelected = safeEstimates.length > 0 && safeEstimates.every(e => selectedEstimates.has(e.id));
  const handleCheckbox = (id: string) => {
    const next = new Set(selectedEstimates);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEstimates?.(next);
  };
  const handleSelectAll = () => {
    if (allSelected) setSelectedEstimates?.(new Set());
    else setSelectedEstimates?.(new Set(safeEstimates.map(e => e.id)));
  };
  const totalValue = safeEstimates.reduce(
    (s: number, e: Estimate) => s + Number(e.totalAmount || 0),
    0,
  );
  const acceptedCount = safeEstimates.filter(
    (e: Estimate) => e.status === 'ACCEPTED',
  ).length;

  return (
    <div className="space-y-4">
      {/* ── Estimate KPI strip (flat Ovds SaaS style) ── */}
      <div
        className="ovds-stat-row"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}
      >
        {[
          {
            label: t('invoices.pageValue', 'Page Value'),
            value: fmt(totalValue),
            icon: <Wallet size={14} />,
            accent: '#8B5CF6',
          },
          {
            label: t('invoices.acceptedPage', 'Accepted (Page)'),
            value: acceptedCount.toString(),
            icon: <CheckCircle2 size={14} />,
            accent: '#10B981',
          },
          {
            label: t('invoices.totalEstimates', 'Total Estimates'),
            value: totalCount.toString(),
            icon: <ClipboardList size={14} />,
            accent: 'var(--aki-blue)',
          },
        ].map((k) => (
          <div key={k.label} className="ovds-kpi-cell">
            <div className="flex items-center gap-1.5 mb-2">
              <span style={{ color: k.accent }}>{k.icon}</span>
              <p className="ovds-label">{k.label}</p>
            </div>
            <p className="ovds-value">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="aki-input-group flex-1 w-full">
          <Search size={13} className="aki-input-icon" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('invoices.searchEstimates', 'Search by estimate # or customer…')}
            className="aki-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-alt)' }}>
            {ESTIMATE_STATUS_TABS.map((st) => (
              <button
                key={st.id}
                type="button"
                 onClick={() => {
                   setSelectedEstimates?.(new Set());
                   onStatusTabChange(st.id);
                 }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  statusTab === st.id
                    ? 'bg-white shadow-sm'
                    : 'text-[color:var(--text-4)] hover:text-[color:var(--text-2)]'
                }`}
                style={statusTab === st.id ? { color: 'var(--aki-blue)', borderColor: 'var(--border)' } : {}}
              >
                {st.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            title="Refresh"
            onClick={onRefresh}
            className="aki-btn aki-btn-secondary sm icon-only"
            aria-label="Refresh estimates"
          >
            <RefreshCw size={13} />
          </button>
          <button
            type="button"
            onClick={onNew}
            className="aki-btn aki-btn-primary sm"
          >
            <Plus size={13} /> New Estimate
          </button>
          {selectedArr.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onBulkDelete();
                setTimeout(() => setSelectedEstimates?.(new Set()), 300);
              }}
              className="aki-btn aki-btn-danger sm"
              title={`Delete ${selectedArr.length} selected`}
            >
              <Trash2 size={13} /> Delete {selectedArr.length}
            </button>
          )}
        </div>
      </div>

      {/* ── Estimates Table ── */}
      <div className="ovds-doc-shell">
        <table className="ovds-table w-full text-left">
          <thead>
            <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-alt)' }}>
              <th className="px-5 py-3 ovds-label w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all estimates"
                />
              </th>
              <th className="px-5 py-3 ovds-label">{t('invoices.estimate', 'Estimate')}</th>
              <th className="px-5 py-3 ovds-label">{t('common.customer', 'Customer')}</th>
              <th className="px-5 py-3 ovds-label">{t('common.date', 'Date')}</th>
              <th className="px-5 py-3 ovds-label">{t('invoices.validUntil', 'Valid Until')}</th>
              <th className="px-5 py-3 ovds-label text-right">{t('common.amount', 'Amount')}</th>
              <th className="px-5 py-3 ovds-label text-center">{t('common.status', 'Status')}</th>
              <th className="px-5 py-3 ovds-label text-right">{t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="aki-skeleton h-4 rounded" style={{ width: j === 5 ? '80px' : '100%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : safeEstimates.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="ovds-empty">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: 'var(--surface-alt)', color: 'var(--text-4)' }}
                    >
                      <ClipboardList size={22} />
                    </div>
                    <p className="ovds-label mb-1">{t('invoices.noEstimates', 'No estimates found')}</p>
                    <p className="ovds-caption">{t('invoices.noEstimatesDesc', 'Create your first estimate to get started')}</p>
                    <button
                      type="button"
                      onClick={onNew}
                      className="aki-btn aki-btn-primary sm mt-4"
                    >
                      <Plus size={13} /> {t('invoices.createEstimate', 'Create Estimate')}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              safeEstimates.map((e: Estimate) => (
                <tr
                  key={e.id}
                  className="group"
                  style={{ borderBottom: '1px solid var(--border-alt)', cursor: 'default' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                 >
                   <td className="px-2 py-3.5 text-center">
                     <input
                       type="checkbox"
                       checked={selectedEstimates.has(e.id)}
                       onChange={() => handleCheckbox(e.id)}
                       aria-label={`Select estimate ${e.estimateNumber || ''}`}
                     />
                   </td>
                   <td className="px-5 py-3.5">
                     <div className="flex items-center gap-2.5">
                       <div className="ovds-doc-icon" style={{ width: 28, height: 28, borderRadius: 6, background: '#EDE9FE', color: '#5B21B6' }}>
                         <ClipboardList size={13} />
                       </div>
                       <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                         {String(e.estimateNumber || e.invoiceNumber || '—')}
                       </span>
                     </div>
                   </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{e.customer}</p>
                    {e.customerEmail && <p className="ovds-caption mt-0.5">{e.customerEmail}</p>}
                  </td>
                  <td className="px-5 py-3.5 ovds-body">
                    {e.date ? new Date(e.date).toLocaleDateString('en-ET', FULL_DATE_OPTS) : '—'}
                  </td>
                  <td className="px-5 py-3.5 ovds-body">
                    {e.dueDate ? new Date(e.dueDate).toLocaleDateString('en-ET', FULL_DATE_OPTS) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="ovds-number text-[13px]" style={{ color: 'var(--text)' }}>
                      {fmt(e.totalAmount)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`aki-badge sm ${
                      e.status === 'ACCEPTED'  ? 'solid-success' :
                      e.status === 'SENT'      ? 'solid-info'    :
                      e.status === 'DECLINED'  ? 'solid-danger'  :
                      e.status === 'CONVERTED' ? 'solid-purple'  : 'solid-default'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => onEdit(e)} className="ovds-doc-action-btn" title="Edit" aria-label="Edit estimate"><Edit2 size={13} /></button>
                      {(e.status === 'DRAFT' || e.status === 'SENT') && (
                        <button type="button" onClick={() => onSend(e.id)} className="ovds-doc-action-btn" title="Send" aria-label="Send estimate"><Send size={13} /></button>
                      )}
                      {e.status === 'ACCEPTED' && (
                        <button type="button" onClick={() => onConvert(e)} className="ovds-doc-action-btn" title="Convert to Invoice" aria-label="Convert to invoice"><ArrowRight size={13} /></button>
                      )}
                      <button type="button" onClick={() => onDelete(e.id)} className="ovds-doc-action-btn danger" title="Delete" aria-label="Delete estimate"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {!loading && safeEstimates.length > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}
          >
            <p className="ovds-caption">
              {t('invoices.showingRange', {
                defaultValue: 'Showing {{start}}–{{end}} of {{total}}',
                start: (page - 1) * 25 + 1,
                end: Math.min(page * 25, totalCount),
                total: totalCount,
              })}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
                className="aki-btn aki-btn-secondary xs icon-only"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-2.5 text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="aki-btn aki-btn-secondary xs icon-only"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -- Recurring Panel ----------------------------------------------------------
const INTERVAL_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  DAILY: {
    label: 'Daily',
    color: '#5B21B6',
    bg: '#EDE9FE',
  },
  WEEKLY: {
    label: 'Weekly',
    color: 'var(--aki-success-text, #166534)',
    bg: 'var(--aki-success-bg, #F0FDF4)',
  },
  MONTHLY: {
    label: 'Monthly',
    color: 'var(--aki-success-text, #166534)',
    bg: 'var(--aki-success-bg, #F0FDF4)',
  },
  QUARTERLY: {
    label: 'Quarterly',
    color: 'var(--aki-warning-text, #B45309)',
    bg: 'var(--aki-warning-bg, #FFFBEB)',
  },
  YEARLY: {
    label: 'Yearly',
    color: 'var(--aki-danger-text, #9F1239)',
    bg: 'var(--aki-danger-bg, #FFF1F2)',
  },
};

const RecurringPanel: React.FC<{
  invoices: Invoice[];
  onNewInvoice: () => void;
  onTrigger: (inv: Invoice) => void;
  fmt: (n: number) => string;
  companyId?: string;
}> = ({ invoices, onNewInvoice, onTrigger, fmt, companyId }) => {
  const { t } = useTranslation();
  const [recurringList, setRecurringList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    recurringInvoicesApi.list({ companyId, limit: 100 })
      .then((res: any) => {
        const data = res?.data?.data ?? res?.data ?? [];
        setRecurringList(Array.isArray(data) ? data : []);
      })
      .catch(() => setRecurringList([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const displayInvoices = recurringList.length > 0 ? recurringList : invoices;

  const totalMonthly = displayInvoices.reduce((s, i) => {
    const amt = Number(i.totalAmount);
    const interval = (i.recurringInterval ?? 'MONTHLY').toUpperCase();
    if (interval === 'DAILY') return s + amt * INTERVAL_DAILY_FACTOR;
    if (interval === 'WEEKLY') return s + amt * INTERVAL_WEEKLY_FACTOR;
    if (interval === 'QUARTERLY') return s + amt / INTERVAL_QUARTERLY_FACTOR;
    if (interval === 'YEARLY') return s + amt / INTERVAL_YEARLY_FACTOR;
    return s + amt; // MONTHLY
  }, 0);

  // Compute upcoming due within 7 days
  const upcomingSoon = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * MS_PER_DAY;
    return displayInvoices
      .filter(i => {
        if (!i.dueDate) return false;
        const due = new Date(i.dueDate).getTime();
        return due >= now && due <= now + sevenDays;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [displayInvoices]);

  if (displayInvoices.length === 0 && !loading) {
    return (
      <div className="ovds-empty">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{ background: 'var(--surface-alt)', color: 'var(--text-4)' }}
        >
          <History size={22} />
        </div>
        <p className="ovds-label mb-1">{t('invoices.noRecurring', 'No Recurring Invoices')}</p>
        <p className="ovds-caption max-w-xs leading-relaxed">
          {t('invoices.noRecurringDesc', 'Set up recurring invoices to automatically bill customers on a schedule.')}
        </p>
        <button
          type="button"
          onClick={onNewInvoice}
          className="aki-btn aki-btn-primary sm mt-4"
        >
          <Plus size={13} /> {t('invoices.createRecurring', 'Create Recurring Invoice')}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2.5">
        <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--aki-blue)' }} />
        <span className="ovds-label">Loading recurring schedules…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Recurring KPI strip ── */}
      <div
        className="ovds-stat-row"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}
      >
        {[
          {
            label: 'Active Schedules',
            value: displayInvoices.length.toString(),
            icon: <Repeat2 size={14} />,
            accent: '#10B981',
          },
          {
            label: t('invoices.estMonthlyRevenue', 'Est. Monthly Revenue'),
            value: fmt(totalMonthly),
            icon: <TrendingUp size={14} />,
            accent: 'var(--aki-blue)',
          },
          {
            label: t('common.customers', 'Customers'),
            value: new Set(displayInvoices.map((i) => i.customer)).size.toString(),
            icon: <Building2 size={14} />,
            accent: '#8B5CF6',
          },
        ].map((k) => (
          <div key={k.label} className="ovds-kpi-cell">
            <div className="flex items-center gap-1.5 mb-2">
              <span style={{ color: k.accent }}>{k.icon}</span>
              <p className="ovds-label">{k.label}</p>
            </div>
            <p className="ovds-value">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Upcoming in 7 days alert ── */}
      {upcomingSoon.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border animate-in fade-in duration-200" style={{ background: '#EDE9FE', borderColor: '#DDD6FE' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#EDE9FE', color: '#5B21B6' }}>
            <Calendar size={13} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold leading-none" style={{ color: '#5B21B6' }}>
              {upcomingSoon.length} recurring invoice{upcomingSoon.length !== 1 ? 's' : ''} due within 7 days
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {upcomingSoon.slice(0, 4).map(inv => {
                const daysLeft = Math.ceil((new Date(inv.dueDate!).getTime() - Date.now()) / MS_PER_DAY);
                return (
                  <div key={inv.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border-alt)' }}>
                    <span className="text-[10px] font-bold truncate max-w-[100px]" style={{ color: 'var(--text-2)' }}>
                      {inv.customer}
                    </span>
                    <span className="text-[9px] font-bold shrink-0" style={{ color: '#5B21B6' }}>
                      {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                    </span>
                    <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: 'var(--text-3)' }}>
                      {fmt(Number(inv.totalAmount))}
                    </span>
                  </div>
                );
              })}
              {upcomingSoon.length > 4 && (
                <span className="text-[10px] flex items-center" style={{ color: '#5B21B6' }}>
                  +{upcomingSoon.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="ovds-doc-shell">
        <table className="ovds-table w-full text-left">
          <thead>
            <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-alt)' }}>
              {[
                t('invoices.invoice', 'Invoice'),
                t('common.customer', 'Customer'),
                t('invoices.schedule', 'Schedule'),
                t('common.amount', 'Amount'),
                t('common.status', 'Status'),
                t('invoices.nextDue', 'Next Due'),
                '',
              ].map((h, idx) => (
                <th key={idx} className="px-5 py-3 ovds-label">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayInvoices.map((inv) => {
              const interval = (inv.recurringInterval ?? 'MONTHLY').toUpperCase();
              const meta = INTERVAL_META[interval] ?? INTERVAL_META.MONTHLY;
              return (
                <tr
                  key={inv.id}
                  className="group"
                  style={{ borderBottom: '1px solid var(--border-alt)' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="ovds-doc-icon" style={{ width: 28, height: 28, borderRadius: 6 }}>
                        <Repeat2 size={13} />
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                        {inv.invoiceNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{inv.customer}</p>
                    {inv.customerEmail && <p className="ovds-caption mt-0.5">{inv.customerEmail}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`aki-badge sm ${
                      interval === 'MONTHLY'   ? 'solid-success' :
                      interval === 'WEEKLY'    ? 'solid-info'    :
                      interval === 'QUARTERLY' ? 'solid-warning' : 'solid-danger'
                    }`}>
                      <Repeat2 size={9} /> {meta.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="ovds-number text-[13px]" style={{ color: 'var(--text)' }}>{fmt(Number(inv.totalAmount))}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`aki-badge sm ${
                      inv.status === 'PAID'    ? 'solid-success' :
                      inv.status === 'OVERDUE' ? 'solid-danger'  : 'solid-warning'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 ovds-body">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-ET', FULL_DATE_OPTS) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onTrigger(inv)}
                      title="Send invoice now"
                      className="aki-btn aki-btn-success xs"
                    >
                      <Send size={10} /> Send Now
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}
        >
          <p className="ovds-caption">
            {displayInvoices.length} {t('invoices.recurringSchedule', 'recurring schedule')}{displayInvoices.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={onNewInvoice}
            className="aki-btn aki-btn-secondary xs"
          >
            <Plus size={11} strokeWidth={2.5} /> {t('invoices.addSchedule', 'Add Schedule')}
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Wrapper: redirects CLIENT users to the Client Portal ---------------------
const Invoices: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'CLIENT') {
    return <Navigate to="/customers/portal" replace />;
  }
  return <InvoicesInner />;
};

export default Invoices;

