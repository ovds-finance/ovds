import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { DocStackLayout, type DocStackItem } from '@ovds/ui';
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
  Calendar,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  History,
  Repeat2,
  Send,
  Upload,
  BarChart2,
  Archive,
} from 'lucide-react';
import { Icon } from '../components/ui';
import {
  PipelineStageHeader,
  PipelineViewToggle,
  PipelineCard,
  KanbanBoard,
  PipelineFunnel,
  type PipelineView,
  type KanbanColumnDef,
} from '../components/pipelineComponents';
import { useTranslation } from 'react-i18next';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import {
  useAuditLog,
  useInterval,
  usePageTitle,
  useDebounce,
} from '../hooks';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import api from '../services/api';
import { invoicesApi, estimatesApi } from '../services/ovdsApi';
import { recurringInvoicesApi } from '@ovds/features/invoice';
import toast from 'react-hot-toast';
import { InvoicesTable, DEFAULT_INVOICE_COLUMN_KEYS } from '../components/invoicesTable';
import { eimsApi } from '@ovds/features/eims';
import { eimsBadgeLabel, eimsBadgeClass, matchesEimsFilter, type EimsFilter } from '../utils/eimsBadge';
import { InvoiceAnalytics } from '../components/invoiceAnalytics';
import {
  InvoiceModalsProvider,
  InvoiceModals,
} from '../components/invoiceModals';
import EstimateModal from '../components/invoice/estimateModal';
import CustomerRegistryModal from '../components/invoice/customerRegistryModal';
import { IngestionHubModal } from '../components/invoice/ingestionHubModal';
import InvoiceModuleModal from '../components/invoice/InvoiceModuleModal';
import { confirm, prompt } from '../utils/confirm';
import { fmtCurrency, fmtDecimal } from '../utils/fmt';
import { calcLineTax } from '../utils/ethiopianTax';

// -- Design tokens -------------------------------------------------------------
const fmt = (n: number) => fmtCurrency(n, 'ETB');

// -- Named constants (replaces magic numbers) ----------------------------------
const MS_PER_DAY = 86_400_000;
const DEFAULT_DUE_DAYS = 30;
const DEFAULT_INVOICE_PREFIX = 'INV';
const DEFAULT_VAT_RATE = 15;
const ECL_HIGH_RISK_RATE = 5;
const ECL_MEDIUM_RISK_RATE = 2;
const TOP_CUSTOMERS_LIMIT = 5;
const MONTHLY_CHART_MONTHS = 6;
const INTERVAL_DAILY_FACTOR = 30;
const INTERVAL_WEEKLY_FACTOR = 4.33;
const INTERVAL_QUARTERLY_FACTOR = 3;
const INTERVAL_YEARLY_FACTOR = 12;
const FULL_DATE_OPTS: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
const SHORT_DATE_OPTS: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };

// -- Local Invoice type --------------------------------------------------------
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerEmail?: string | null;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
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

// -- Main Component ----------------------------------------------------------
const InvoicesInner: React.FC = () => {
  usePageTitle('Invoices & Estimates');
  const { t } = useTranslation();
  const { selectedCompanyId, companies } = useBusiness();
  const activeCompanyName = companies.find(
    (c) => c.id === selectedCompanyId,
  )?.name;
  const { log } = useAuditLog();
  const navigate = useNavigate();
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
  const [showShortcuts, setShowShortcuts] = useState(false);
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
  const [pipelineView, setPipelineView] = useState<PipelineView>('list');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
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
    if (!paid.length) return null;
    const totalDays = paid.reduce((s, i) => {
      const created = new Date(i.date).getTime();
      let pAt = i.paidAt ? new Date(i.paidAt as string).getTime() : 0;
      if (!pAt && i.payments && i.payments.length > 0) {
        pAt = Math.max(...i.payments.map((p) => new Date(p.paidAt).getTime()));
      }
      if (!pAt) return s; // Skip if no payment date found
      return s + Math.max(0, (pAt - created) / MS_PER_DAY);
    }, 0);
    const count = paid.filter(
      (i) => i.paidAt || (i.payments && i.payments.length > 0),
    ).length;
    return count > 0 ? Math.round(totalDays / count) : null;
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
  const aging = useMemo(() => {
    const unpaid = invoices.filter(
      (i) => !['PAID', 'CANCELLED'].includes(i.status),
    );
    return [
      {
        label: 'Current',
        min: 0,
        max: 30,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        bg: 'bg-emerald-50',
      },
      {
        label: '31–60 days',
        min: 31,
        max: 60,
        color: 'bg-amber-400',
        textColor: 'text-amber-700',
        bg: 'bg-amber-50',
      },
      {
        label: '61–90 days',
        min: 61,
        max: 90,
        color: 'bg-orange-500',
        textColor: 'text-orange-700',
        bg: 'bg-orange-50',
      },
      {
        label: '90+ days',
        min: 91,
        max: Infinity,
        color: 'bg-rose-500',
        textColor: 'text-rose-700',
        bg: 'bg-rose-50',
      },
    ].map((b) => {
      const items = unpaid.filter((i) => {
        const age = Math.floor(
          (today.getTime() - new Date(i.date).getTime()) / MS_PER_DAY,
        );
        return age >= b.min && age <= b.max;
      });
      return {
        ...b,
        count: items.length,
        amount: items.reduce((s, i) => s + Number(i.totalAmount), 0),
      };
    });
  }, [invoices, today]);
  const topCustomers = useMemo(() => {
    const map: Record<
      string,
      { revenue: number; count: number; paid: number }
    > = {};
    invoices.forEach((inv) => {
      if (!map[inv.customer])
        map[inv.customer] = { revenue: 0, count: 0, paid: 0 };
      map[inv.customer].revenue += Number(inv.totalAmount);
      map[inv.customer].count += 1;
      if (inv.status === 'PAID')
        map[inv.customer].paid += Number(inv.totalAmount);
    });
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        ...d,
        payRate: d.revenue > 0 ? Math.round((d.paid / d.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, TOP_CUSTOMERS_LIMIT);
  }, [invoices]);
  const invoiceGaps = useMemo(() => {
    const prefix = settings.ovds_invoice_prefix || DEFAULT_INVOICE_PREFIX;
    const nums = invoices
      .map((i) => {
        const m = i.invoiceNumber?.match(new RegExp(`^${prefix}-(\\d+)$`));
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] - nums[i - 1] > 1) gaps.push(nums[i - 1] + 1);
    }
    return gaps.slice(0, 3);
  }, [invoices, settings]);
  const arHealthScore = useMemo(() => {
    if (!invoices.length) return null;
    const activeInvoices = invoices.filter((i) => i.status !== 'CANCELLED');
    const total = activeInvoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    if (total === 0) return null;
    const paidAmt = activeInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((s, i) => s + Number(i.totalAmount), 0);
    const overdueAmt = activeInvoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((s, i) => s + Number(i.totalAmount), 0);
    const score = Math.round(
      (paidAmt / total) * 60 + Math.max(0, 1 - overdueAmt / total) * 40,
    );
    const grade =
      score >= 85
        ? 'A'
        : score >= 70
          ? 'B'
          : score >= 55
            ? 'C'
            : score >= 40
              ? 'D'
              : 'F';
    const color =
      score >= 85
        ? 'emerald'
        : score >= 70
          ? 'blue'
          : score >= 55
            ? 'amber'
            : 'red';
    return { score, grade, color };
  }, [invoices]);

  const invoiceMap = useMemo(() => {
    const map = new Map<string, Invoice>();
    invoices.forEach((inv) => map.set(inv.id, inv));
    return map;
  }, [invoices]);

  const maxMonthly = useMemo(
    () => Math.max(...monthlyData.map((m) => m.invoiced), 1),
    [monthlyData],
  );

  const ifrsAnalytics = useMemo(() => {
    const withIfrs = invoices.filter(
      (i: Invoice) =>
        i.ifrsPerformanceObligation || i.ifrsContractRef || i.ifrsCreditRisk,
    );
    const stage3 = invoices.filter(
      (i: Invoice) => i.ifrsCreditRisk === 'HIGH' && i.status !== 'PAID',
    );
    const stage2 = invoices.filter(
      (i: Invoice) => i.ifrsCreditRisk === 'MEDIUM' && i.status !== 'PAID',
    );
    const nonCurrent = invoices.filter(
      (i: Invoice) =>
        i.ifrsReceivableClass === 'NON_CURRENT' && i.status !== 'PAID',
    );
    const eclExposure =
      stage3.reduce(
        (s: number, i: Invoice) =>
          s + Number(i.totalAmount) * (Number(i.ifrsEclProvision || ECL_HIGH_RISK_RATE) / 100),
        0,
      ) +
      stage2.reduce(
        (s: number, i: Invoice) =>
          s + Number(i.totalAmount) * (Number(i.ifrsEclProvision || ECL_MEDIUM_RISK_RATE) / 100),
        0,
      );
    const withWarranty = invoices.filter((i: Invoice) => i.ifrsHasWarranty);
    const warrantyProvision = withWarranty.reduce(
      (s: number, i: Invoice) =>
        s +
        Number(i.totalAmount) * (Number(i.ifrsWarrantyProvision || 0) / 100),
      0,
    );
    const contractRefs = invoices.filter((i: Invoice) => i.ifrsContractRef).length;
    return {
      withIfrs: withIfrs.length,
      stage3: stage3.length,
      stage2: stage2.length,
      nonCurrent: nonCurrent.length,
      eclExposure,
      warrantyProvision,
      contractRefs,
    };
  }, [invoices]);

  const displayInvoices = useMemo(() => {
    if (eimsFilter === 'ALL' || pipelineView === 'list') return invoices;
    return invoices.filter((inv) => matchesEimsFilter(inv as any, eimsFilter));
  }, [invoices, eimsFilter, pipelineView]);

  const eimsKpi = useMemo(() => ({
    registered: invoices.filter((i) => !!(i as any).eimsIrn).length,
    pending: invoices.filter((i) => (i as any).eimsStatus === 'PENDING').length,
    needs: invoices.filter((i) => matchesEimsFilter(i as any, 'NEEDS_REGISTRATION')).length,
    failed: invoices.filter((i) => (i as any).eimsStatus === 'FAILED').length,
  }), [invoices]);

  // -- Kanban columns --------------------------------------------------------
  const kanbanColumns = useMemo((): KanbanColumnDef<Invoice>[] => {
    const COLS: Array<{
      key: Invoice['status'];
      label: string;
      color: string;
      headerBg: string;
      accentColor: string;
      dotColor: string;
    }> = [
      {
        key: 'DRAFT',
        label: 'Draft',
        color: 'text-slate-500 dark:text-slate-400',
        headerBg: 'bg-white dark:bg-slate-800',
        accentColor: '#94a3b8',
        dotColor: 'bg-slate-400',
      },
      {
        key: 'PENDING',
        label: 'Sent',
        color: 'text-amber-600 dark:text-amber-400',
        headerBg: 'bg-amber-50 dark:bg-amber-950/30',
        accentColor: '#f59e0b',
        dotColor: 'bg-amber-400',
      },
      {
        key: 'OVERDUE',
        label: 'Overdue',
        color: 'text-rose-600 dark:text-rose-400',
        headerBg: 'bg-rose-50 dark:bg-rose-950/30',
        accentColor: '#ef4444',
        dotColor: 'bg-rose-500',
      },
      {
        key: 'PAID',
        label: 'Paid',
        color: 'text-emerald-600 dark:text-emerald-400',
        headerBg: 'bg-emerald-50 dark:bg-emerald-950/30',
        accentColor: '#00E784',
        dotColor: 'bg-emerald-500',
      },
    ];
    return COLS.map((col) => {
      const items = displayInvoices.filter((i) => i.status === col.key);
      const total = items.reduce((s, i) => s + Number(i.totalAmount), 0);
      return {
        ...col,
        items,
        totalAmount: total > 0 ? fmt(total) : undefined,
      };
    });
  }, [displayInvoices]);

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
  }, [selectedCompanyId]);

  const fetchCustomersAndItems = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const [custRes, itemsRes] = await Promise.all([
        api.get(`/ovds/customers/registry?companyId=${selectedCompanyId}`),
        api.get(`/ovds/inventory/items?companyId=${selectedCompanyId}&take=200`),
      ]);
      const custData: unknown = custRes.data.data ?? custRes.data;
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
      const raw = r.data?.data ?? r.data ?? [];
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
      setStats(res);
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
  const handleToggleCol = useCallback(
    (col: string) => {
      const newCols = new Set(visibleCols);
      if (visibleCols.has(col)) newCols.delete(col);
      else newCols.add(col);
      setVisibleCols(newCols);
      localStorage.setItem(
        'col_vis_invoice_columns',
        JSON.stringify(Array.from(newCols)),
      );
    },
    [visibleCols],
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

  const handleBulkStatusUpdate = async (status: string) => {
    if (selected.size === 0) return toast.error(t('common.select_items'));
    if (
      !(await confirm({
        title: `Update ${selected.size} invoice(s) to ${status}?`,
        variant: 'info',
      }))
    )
      return;
    try {
      if (status === 'CANCELLED') {
        await invoicesApi.bulkCancel(Array.from(selected));
      } else {
        await Promise.all(
          Array.from(selected).map((id) =>
            invoicesApi.update(id, { status }),
          ),
        );
      }
      toast.success('Bulk update completed');
      setSelected(new Set());
      fetchInvoices(currentPage);
      fetchStats();
    } catch {
      toast.error('Bulk status update failed');
    }
  };

  const handleNewInvoice = useCallback(() => {
    const dueDays = Number(settings?.invoice_due_days) || DEFAULT_DUE_DAYS;
    setNewInvoice(blankInvoice(dueDays));
    setShowAddModal(true);
  }, [blankInvoice, settings]);

  // -- Keyboard shortcuts (Akaunting-style) ------------------------------------
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
      const grandTotal = subtotal + totalVat;

      try {
        const isSend = forcedStatus === 'PENDING';
        const payload: any = {
          ...newInvoice,
          companyId: selectedCompanyId,
          totalAmount: grandTotal,
          subtotal,
          vatAmount: totalVat,
          status: isSend ? 'DRAFT' : (forcedStatus || newInvoice.status || 'DRAFT'),
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
      } catch {
        toast.error('Failed to save invoice');
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

  const handleSend = async (id: string) => {
    try {
      await invoicesApi.send(id);
      toast.success('Sent');
      fetchInvoices(currentPage);
    } catch {
      toast.error('Send failed');
    }
  };
  const handlePrint = (id: string) =>
    window.open(`${(api as any).defaults?.baseURL || '/api'}/ovds/invoices/${id}/pdf`, '_blank');
  const handleFlagOverdue = async (_id: string) => {
    try {
      await invoicesApi.flagOverdue(selectedCompanyId ?? undefined);
      fetchInvoices(currentPage);
    } catch {
      toast.error('Flag overdue failed');
    }
  };
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
      await Promise.all(
        Array.from(selected).map((id) => invoicesApi.remove(id)),
      );
      toast.success(`${selected.size} invoice(s) deleted`);
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
  const handleNewEstimate = () => {
    const dueDays = Number(settings?.invoice_due_days) || DEFAULT_DUE_DAYS;
    setNewEstimate(blankEstimate(dueDays));
    setShowEstimateModal(true);
  };
  const handleEditEstimate = (e: Estimate) => {
    setEditingEstimate(e);
    setNewEstimate(e);
    setShowEstimateModal(true);
  };
   const handleDeleteEstimate = async (id: string) => {
     if (await confirm({ title: 'Delete estimate?', variant: 'danger' })) {
       try {
         await estimatesApi.remove(id);
         setSelectedEstimates(new Set());
         fetchEstimates(estimatePage);
       } catch {
           toast.error('Delete estimate failed');
         }
     }
   };
   const handleBulkDeleteEstimates = async () => {
     if (!selectedEstimates.size) return;
     if (await confirm({
       title: `Delete ${selectedEstimates.size} estimate${selectedEstimates.size !== 1 ? 's' : ''}?`,
       message: 'This cannot be undone.',
       variant: 'danger',
       confirmLabel: 'Delete',
     })) {
       try {
         await Promise.all(
           [...selectedEstimates].map(id => estimatesApi.remove(id))
         );
         setSelectedEstimates(new Set());
         fetchEstimates(estimatePage);
       } catch {
         toast.error('Bulk delete failed');
       }
     }
   };
  const handleSendEstimate = async (id: string) => {
    try {
      await estimatesApi.send(id);
      toast.success('Sent');
      fetchEstimates(estimatePage);
    } catch {
      toast.error('Send estimate failed');
    }
  };
  const handleConvertToInvoice = async (e: Estimate) => {
    if (await confirm({ title: 'Convert to invoice?', variant: 'info' })) {
      try {
        const result = await estimatesApi.convertToInvoice(e.id);
        toast.success('Converted to invoice');

        // Pre-populate the invoice form with the converted data and open it
        const convertedInvoice = result?.data?.data ?? result?.data ?? null;
        if (convertedInvoice) {
          setNewInvoice({
            ...convertedInvoice,
            customer: convertedInvoice.customerName ?? convertedInvoice.customer ?? e.customer,
            customerEmail: convertedInvoice.customerEmail ?? e.customerEmail ?? '',
            customerPhone: convertedInvoice.customerPhone ?? e.customerPhone ?? '',
            items: ((convertedInvoice.items as any[]) || e.items || []).map((li: any) => ({
              ...li,
              id: li.id || Math.random().toString(36).slice(2, 11),
              showDiscount: Number(li.discount ?? li.discountValue ?? 0) > 0,
              discountValue: Number(li.discountValue ?? li.discount ?? 0),
              discountType: li.discountType || 'FIXED',
              taxRate: li.taxRate !== undefined ? li.taxRate : null,
              showTax: true,
              showTaxPanel: false,
            })),
            _convertedFromEstimate: e.estimateNumber,
          });
          setShowAddModal(true);
          setMainTab('INVOICES');
        } else {
          // Fallback: just refresh invoices list
          fetchInvoices(1);
          setMainTab('INVOICES');
        }
      } catch {
          toast.error('Convert to invoice failed');
        }
    }
  };
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

  const pipelineStages = useMemo(() => [
    {
      key: 'DRAFT',
      label: t('invoices.pipelineDraft', 'Draft'),
      count: statusCounts.DRAFT ?? 0,
      color: '#94a3b8',
      amount: fmt(
        invoices
          .filter((i) => i.status === 'DRAFT')
          .reduce((s, i) => s + Number(i.totalAmount), 0),
      ),
    },
    {
      key: 'PENDING',
      label: t('invoices.pipelineSent', 'Sent'),
      count: statusCounts.PENDING ?? 0,
      color: '#f59e0b',
      active: statusTab === 'PENDING',
      amount: fmt(
        invoices
          .filter((i) => i.status === 'PENDING')
          .reduce((s, i) => s + Number(i.totalAmount), 0),
      ),
    },
    {
      key: 'OVERDUE',
      label: t('invoices.pipelineOverdue', 'Overdue'),
      count: statusCounts.OVERDUE ?? 0,
      color: '#ef4444',
      active: statusTab === 'OVERDUE',
      amount: fmt(
        invoices
          .filter((i) => i.status === 'OVERDUE')
          .reduce((s, i) => s + Number(i.totalAmount), 0),
      ),
    },
    {
      key: 'PAID',
      label: t('invoices.pipelineSettled', 'Settled'),
      count: statusCounts.PAID ?? 0,
      color: '#00E784',
      active: statusTab === 'PAID',
      amount: fmt(
        invoices
          .filter((i) => i.status === 'PAID')
          .reduce((s, i) => s + Number(i.totalAmount), 0),
      ),
    },
  ], [invoices, statusCounts, statusTab, fmt, t]);

  return (
    <InvoiceModalsProvider {...modalProps}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">

        {/* ── Page Hero (Akaunting-style flat) ───────────────────────────── */}
        <div className="ovds-page-hero">
          {/* Breadcrumb */}
          <nav className="ovds-breadcrumb relative" aria-label="Breadcrumb">
            <span>{t('nav.sales', 'Sales')}</span>
            <span className="sep">/</span>
            <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>
              {mainTab === 'ESTIMATES' ? 'Estimates' : mainTab === 'RECURRING' ? 'Recurring' : 'Invoices'}
            </span>
          </nav>

          {/* Hero body */}
          <div className="ovds-page-hero-body pt-2 pb-1">
            <div className="flex items-center gap-3 min-w-0">
              {/* Module icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--aki-blue)', color: '#fff' }}
                aria-hidden="true"
              >
                <FileText size={17} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="ovds-module-title">
                  {t('invoices.title', 'Invoices & Estimates')}
                </h1>
                <p className="ovds-caption mt-0.5 hidden sm:block">
                  {t('invoices.subtitle', 'Create and send ERCA-compliant invoices, track payments, and manage estimates.')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="ovds-page-hero-actions flex-wrap gap-2">
              {/* Offline/queue pill */}
              {(!isOnline || queueCount > 0) && (
                <span className={`ovds-context-pill ${!isOnline ? 'alert' : 'warning'}`}>
                  <span className="live-dot" />
                  {!isOnline ? 'Offline' : `${queueCount} queued`}
                  {isOnline && queueCount > 0 && (
                    <button
                      type="button"
                      onClick={syncNow}
                      disabled={isSyncing}
                      className="ml-1 font-bold underline text-[10px] disabled:opacity-60"
                    >
                      {isSyncing ? 'Syncing…' : 'Sync'}
                    </button>
                  )}
                </span>
              )}

              <button type="button" onClick={() => { fetchRegistryCustomers(); setShowCustomerRegistryStandalone(true); }} className="aki-btn aki-btn-secondary sm">
                <Building2 size={13} /> Customers
              </button>

              <button type="button" onClick={handleExportCSV} className="aki-btn aki-btn-secondary sm">
                <Download size={13} /> Export
              </button>

              <button
                type="button"
                onClick={() => setShowAnalytics(v => !v)}
                className={`aki-btn sm ${showAnalytics ? 'aki-btn-soft-blue' : 'aki-btn-secondary'}`}
              >
                <BarChart2 size={13} /> Analytics
              </button>

              <div className="w-px h-5 mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />

              {mainTab === 'ESTIMATES' ? (
                <button type="button" onClick={handleNewEstimate} className="aki-btn aki-btn-primary sm">
                  <Plus size={14} /> New Estimate
                </button>
              ) : (
                <button type="button" onClick={handleNewInvoice} className="aki-btn aki-btn-primary sm">
                  <Plus size={14} /> New Invoice
                </button>
              )}
            </div>
          </div>
        </div>

         {/* -- Pipeline Stage Header — clickable to filter ──────────── */}
         <div className="ovds-widget-card overflow-hidden" onClick={(e) => {
           const cell = (e.target as HTMLElement).closest('[data-stage]');
           if (cell) {
             const key = cell.getAttribute('data-stage');
             const validKeys: StatusTab[] = ['ALL', 'DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
             if (key && (validKeys as string[]).includes(key)) {
               setStatusTab(key as StatusTab);
               setPipelineView('list');
             }
           }
         }}>
          <PipelineStageHeader stages={pipelineStages.map(s => ({
            ...s,
            active: statusTab === s.key,
          }))} />
        </div>

         {/* ── KPI Stats Strip (Akaunting-style compact grid) ───────────── */}
         <div
           className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
           role="list"
           aria-label="Invoice KPIs"
         >
            {/* Total Invoiced */}
            <div className="aki-kpi-card" role="listitem">
              <p className="aki-kpi-label">{t('invoices.kpiTotalInvoiced', 'Total Invoiced')}</p>
              <p className="aki-kpi-value mt-1">{fmt(totalBilled)}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {billedTrend.pos
                  ? <ArrowUpRight size={11} className="aki-kpi-trend-up" />
                  : <ArrowDownRight size={11} className="aki-kpi-trend-down" />
                }
                <span className={`text-[11px] font-bold ${billedTrend.pos ? 'aki-kpi-trend-up' : 'aki-kpi-trend-down'}`}>{billedTrend.val}</span>
                <span className="aki-caption">vs last month</span>
              </div>
            </div>

            {/* Collection Rate */}
            <div className={`aki-kpi-card ${collectionRate >= 80 ? 'highlight-success' : collectionRate >= 50 ? 'highlight-warning' : 'highlight-danger'}`} role="listitem">
              <p className="aki-kpi-label">{t('invoices.kpiCollected', 'Collection Rate')}</p>
              <p className="aki-kpi-value mt-1">{collectionRate}%</p>
              <div className="aki-progress mt-2">
                <div className="aki-progress-bar" style={{ width: `${collectionRate}%`, background: collectionRate >= 80 ? '#10B981' : collectionRate >= 50 ? '#F59E0B' : '#F43F5E' }} />
              </div>
              <div className="mt-2">
                <span className={`aki-badge sm ${
                  collectionRate >= 80 ? 'solid-success' : collectionRate >= 50 ? 'solid-warning' : 'solid-danger'
                }`}>
                  {collectionRate >= 80 ? 'On target' : collectionRate >= 50 ? 'At risk' : 'Below target'}
                </span>
              </div>
            </div>

            {/* Overdue */}
            <div className="aki-kpi-card highlight-rose" role="listitem">
              <p className="aki-kpi-label">{t('invoices.kpiOverdue', 'Overdue')}</p>
              <p className="aki-kpi-value mt-1" style={{ color: overdueCount > 0 ? 'var(--aki-danger-text)' : 'var(--text)' }}>{overdueCount}</p>
              <div className="mt-1.5">
                {overdueCount > 0 ? (
                  <span className="aki-badge sm solid-danger">
                    <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                    Action required
                  </span>
                ) : (
                  <span className="aki-badge sm solid-success">
                    <CheckCircle2 size={10} />
                    All current
                  </span>
                )}
              </div>
            </div>

            {/* DSO */}
            <div className="aki-kpi-card highlight-indigo" role="listitem">
              <p className="aki-kpi-label">{t('invoices.kpiDso', 'Days Sales Outstanding')}</p>
              <p className="aki-kpi-value mt-1">{dso != null ? `${dso}d` : '—'}</p>
              <div className="mt-1.5">
                {dso == null ? (
                  <span className="aki-badge sm solid-default">No paid invoices</span>
                ) : dso <= 30 ? (
                  <span className="aki-badge sm solid-success">
                    <ShieldCheck size={10} /> Excellent
                  </span>
                ) : dso <= 45 ? (
                  <span className="aki-badge sm solid-info">On track</span>
                ) : dso <= 60 ? (
                  <span className="aki-badge sm solid-warning">
                    <TrendingUp size={10} /> Watch
                  </span>
                ) : (
                  <span className="aki-badge sm solid-danger">Critical</span>
                )}
              </div>
            </div>

            {/* AR Health Score */}
            <div className="aki-kpi-card highlight-purple" role="listitem">
              <p className="aki-kpi-label">{t('invoices.kpiArHealth', 'AR Health Score')}</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="relative w-10 h-10 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3.5" stroke="var(--border)" />
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3.5"
                      stroke={
                        (arHealthScore?.score ?? 100) >= 85 ? '#10B981' :
                        (arHealthScore?.score ?? 100) >= 70 ? '#3B82F6' :
                        (arHealthScore?.score ?? 100) >= 55 ? '#F59E0B' : '#F43F5E'
                      }
                      strokeLinecap="round"
                      strokeDasharray={`${((arHealthScore?.score ?? 100) / 100) * 87.96} 87.96`}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-black" style={{ color: 'var(--text)' }}>
                      {arHealthScore?.grade ?? 'A'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold leading-none" style={{ color: 'var(--text)' }}>{arHealthScore?.score ?? 100}</p>
                  <p className="aki-caption mt-0.5">/ 100</p>
                </div>
              </div>
            </div>
         </div>

        {/* ── Analytics panel (collapsible, slides in) ──────────────── */}
        {showAnalytics && (
          <div className="page-transition">
            <InvoiceAnalytics
              stats={stats}
              invoices={invoices as any}
              statusCounts={statusCounts}
              monthlyData={monthlyData}
              aging={aging}
              ifrsAnalytics={ifrsAnalytics}
              arHealthScore={arHealthScore?.score ?? null}
              topCustomers={topCustomers}
              invoiceGaps={invoiceGaps}
              collectionRate={collectionRate}
              overdueCount={overdueCount}
              dso={dso}
              currency="ETB"
              settings={settings}
              maxMonthly={maxMonthly}
              showAnalytics={showAnalytics}
            />
          </div>
        )}

         {/* ── Main Content Panel ─────────────────────────────────────── */}
         <div className="aki-card" style={{ marginTop: showAnalytics ? undefined : '4px' }}>

          {/* ── Tab bar ── */}
          <div
            className="flex items-center"
            style={{
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border-alt)',
              padding: '0 4px',
            }}
          >
            <div className="ovds-tab-nav flex-1 border-b-0">
              {(
                [
                  { id: 'INVOICES',  label: 'Invoices',  count: totalInvoices,                          icon: FileText    },
                  { id: 'ESTIMATES', label: 'Estimates', count: estimates.length,                       icon: ClipboardList },
                  { id: 'RECURRING', label: 'Recurring', count: invoices.filter(i => i.isRecurring).length, icon: History },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMainTab(tab.id)}
                  className={`ovds-tab${mainTab === tab.id ? ' active' : ''}`}
                >
                  <tab.icon size={13} strokeWidth={2} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`aki-badge sm pill ${
                        mainTab === tab.id ? 'solid-info' : 'solid-default'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 pr-3">
              {mainTab === 'INVOICES' && (
                <PipelineViewToggle
                  value={pipelineView}
                  onChange={setPipelineView}
                  options={['list', 'stack', 'kanban', 'funnel']}
                />
              )}
              {mainTab === 'INVOICES' && pipelineView !== 'list' && (
                <div className="flex items-center gap-1 flex-wrap">
                  {([
                    ['ALL', 'All'],
                    ['REGISTERED', 'Registered'],
                    ['NEEDS_REGISTRATION', 'Needs EIMS'],
                    ['PENDING', 'Pending'],
                    ['FAILED', 'Failed'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEimsFilter(key)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        eimsFilter === key
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      {label}
                      {key === 'REGISTERED' && eimsKpi.registered > 0 && (
                        <span className="ml-1 opacity-80">({eimsKpi.registered})</span>
                      )}
                      {key === 'NEEDS_REGISTRATION' && eimsKpi.needs > 0 && (
                        <span className="ml-1 opacity-80">({eimsKpi.needs})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {mainTab === 'ESTIMATES' && (
                <button
                  type="button"
                  onClick={() => {
                    fetchRegistryCustomers();
                    setShowCustomerRegistryStandalone(true);
                  }}
                  className="aki-btn aki-btn-secondary xs"
                >
                  <Building2 size={11} />
                  {t('common.manageCustomers', 'Customers')}
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {mainTab === 'INVOICES' && (
              <div className="space-y-5">
                {/* ── Kanban board view ── */}
                {pipelineView === 'kanban' && (
                  <div>
                    {loading ? (
                      <div className="flex items-center justify-center h-64 gap-2.5">
                        <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--aki-blue)' }} />
                        <span className="ovds-label">
                          {t('invoices.loadingPipeline', 'Loading pipeline…')}
                        </span>
                      </div>
                    ) : (
                      <KanbanBoard
                        columns={kanbanColumns}
                        emptyLabel={t('invoices.noInvoices', 'No invoices')}
                        renderCard={(invoice) => (
                          <PipelineCard
                            title={
                              invoice.invoiceNumber ||
                              `Invoice #${invoice.id.slice(-6)}`
                            }
                            subtitle={invoice.customer}
                            amount={fmt(Number(invoice.totalAmount))}
                            status={invoice.status}
                            accentColor={
                              invoice.status === 'PAID'
                                ? '#10B981'
                                : invoice.status === 'OVERDUE'
                                  ? '#F43F5E'
                                  : invoice.status === 'PENDING'
                                    ? '#F59E0B'
                                    : '#94a3b8'
                            }
                            meta={[
                               {
                                 icon: <Calendar size={10} />,
                                 label: invoice.dueDate
                                   ? new Date(invoice.dueDate).toLocaleDateString('en-ET', SHORT_DATE_OPTS)
                                   : t('invoices.noDueDate', 'No due date'),
                               },
                               ...(eimsBadgeLabel(invoice as any) ? [{
                                 icon: <ShieldCheck size={10} />,
                                 label: `EIMS ${eimsBadgeLabel(invoice as any)}`,
                               }] : []),
                            ]}
                            actions={
                              <div className="flex gap-1 items-center">
                                {eimsBadgeLabel(invoice as any) && (
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-bold ${eimsBadgeClass(eimsBadgeLabel(invoice as any)!)}`}>
                                    EIMS
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingInvoice(invoice);
                                    setShowAddModal(true);
                                  }}
                                  className="ovds-doc-action-btn"
                                  aria-label="Edit invoice"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            }
                            onClick={() => setDrawerInvoice(invoice)}
                          />
                        )}
                      />
                    )}
                  </div>
                )}

                {/* -- Funnel view -- */}
                {pipelineView === 'funnel' && (
                  <div className="ovds-grid-layout cols-2 gap-lg">
                    <PipelineFunnel
                      title={t('invoices.funnelTitle', 'Invoice Pipeline Funnel')}
                      stages={[
                        {
                          label: 'Draft',
                          count: statusCounts.DRAFT ?? 0,
                          color: '#94a3b8',
                          pct: 100,
                          amount: fmt(
                            invoices
                              .filter((i) => i.status === 'DRAFT')
                              .reduce((s, i) => s + Number(i.totalAmount), 0),
                          ),
                        },
                        {
                          label: 'Sent',
                          count: statusCounts.PENDING ?? 0,
                          color: '#f59e0b',
                          pct: 80,
                          amount: fmt(
                            invoices
                              .filter((i) => i.status === 'PENDING')
                              .reduce((s, i) => s + Number(i.totalAmount), 0),
                          ),
                        },
                        {
                          label: 'Overdue',
                          count: statusCounts.OVERDUE ?? 0,
                          color: '#ef4444',
                          pct: 40,
                          amount: fmt(
                            invoices
                              .filter((i) => i.status === 'OVERDUE')
                              .reduce((s, i) => s + Number(i.totalAmount), 0),
                          ),
                        },
                        {
                          label: 'Settled',
                          count: statusCounts.PAID ?? 0,
                          color: '#00E784',
                          pct: 60,
                          amount: fmt(
                            invoices
                              .filter((i) => i.status === 'PAID')
                              .reduce((s, i) => s + Number(i.totalAmount), 0),
                          ),
                        },
                      ]}
                    />
                    {/* Aging breakdown */}
                    <div className="ovds-widget-card overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                          <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
                            {t('invoices.agingBreakdown', 'Aging Breakdown')}
                          </h3>
                        </div>
                      <div className="p-5 space-y-1">
                        {aging.map((b) => (
                          <div key={b.label} className="funnel-bar">
                            <div className="w-24 shrink-0">
                              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {b.label}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 tabular-nums mt-0.5">
                                {fmt(b.amount)}
                              </p>
                            </div>
                            <div className="funnel-track">
                              <div
                                className={`funnel-fill ${b.color}`}
                                style={{
                                  width: `${totalBilled > 0 ? Math.round((b.amount / totalBilled) * 100) : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums w-8 text-right">
                              {b.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* -- Document Stack view -- */}
                {pipelineView === 'stack' && (
                  <DocStackLayout
                    items={displayInvoices.map((inv): DocStackItem => ({
                      id: inv.id,
                      title: inv.invoiceNumber || `Invoice #${inv.id.slice(-6)}`,
                      subtitle: inv.customer,
                      amount: fmt(Number(inv.totalAmount)),
                      status: inv.status?.toLowerCase(),
                      date: inv.date ?? undefined,
                      dueDate: inv.dueDate ?? undefined,
                      badge: eimsBadgeLabel(inv as any)
                        ? `EIMS ${eimsBadgeLabel(inv as any)}`
                        : (inv.isRecurring ? 'RECURRING' : undefined),
                      badgeCls: eimsBadgeLabel(inv as any)
                        ? eimsBadgeClass(eimsBadgeLabel(inv as any)!)
                        : 'bg-violet-100 text-violet-700',
                    }))}
                    loading={loading}
                    emptyLabel={t('invoices.noInvoices', 'No invoices')}
                    emptyDescription={t('invoices.noInvoicesFilter', 'No invoices match the current filter.')}
                    selected={selected}
                    onSelect={handleToggleSelect}
                    showCheckbox
                    onOpen={(item) => setDrawerInvoice(invoiceMap.get(item.id) ?? null)}
                    rowIcon={(item) => {
                      const inv = invoiceMap.get(item.id);
                      const status = inv?.status;
                      const iconColor =
                        status === 'PAID' ? 'text-emerald-500' :
                        status === 'OVERDUE' ? 'text-rose-500' :
                        status === 'PENDING' ? 'text-amber-500' : 'text-slate-400';
                      const iconBg =
                        status === 'PAID' ? 'bg-emerald-50' :
                        status === 'OVERDUE' ? 'bg-rose-50' :
                        status === 'PENDING' ? 'bg-amber-50' : 'bg-white';
                      return (
                        <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
                          <Receipt size={15} />
                        </div>
                      );
                    }}
                    renderRowActions={(item) => {
                      const inv = invoiceMap.get(item.id);
                      if (!inv) return null;
                      return (
                        <>
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingInvoice(inv); setShowAddModal(true); }}
                            className="ovds-doc-action-btn" title="Edit" aria-label="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); handleSend(inv.id); }}
                            className="ovds-doc-action-btn" title="Send" aria-label="Send">
                            <Send size={13} />
                          </button>
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); handlePrint(inv.id); }}
                            className="ovds-doc-action-btn" title="Print / PDF" aria-label="Print or download PDF">
                            <Download size={13} />
                          </button>
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setPaymentInvoice(inv); }}
                            className="ovds-doc-action-btn success" title="Record Payment" aria-label="Record payment">
                            <CheckCircle2 size={13} />
                          </button>
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(inv.id); }}
                            className="ovds-doc-action-btn danger" title="Delete" aria-label="Delete">
                            <Trash2 size={13} />
                          </button>
                        </>
                      );
                    }}
                  />
                )}

                {/* -- List view (default) -- */}
                {pipelineView === 'list' && (
                  <InvoicesTable
                    invoices={invoices as any}
                    stats={stats}
                    statusCounts={statusCounts}
                    loading={loading}
                    totalInvoices={totalInvoices}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    statusTab={statusTab}
                    sourceFilter={sourceFilter}
                    eimsFilter={eimsFilter}
                    searchTerm={searchTerm}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    sortField={sortField}
                    sortDir={sortDir}
                    visibleCols={visibleCols}
                    selected={selected}
                    settings={settings}
                    currency="ETB"
                    onStatusTabChange={setStatusTab}
                    onSourceFilterChange={setSourceFilter}
                    onEimsFilterChange={setEimsFilter}
                    onSearchChange={setSearchTerm}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onSortChange={(field) => setSortField(field)}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onToggleCol={handleToggleCol}
                    onToggleAll={handleToggleAll}
                    onToggleSelect={handleToggleSelect}
                    onDelete={handleDelete}
                    onSend={handleSend}
                    onPrint={(inv) => handlePrint(inv.id)}
                    onBulkSend={handleBulkSend}
                    onBulkEimsRegister={handleBulkEimsRegister}
                    onBulkStatusUpdate={handleBulkStatusUpdate}
                    onBulkDelete={handleBulkDelete}
                    onBulkDuplicate={handleBulkDuplicate}
                    onBulkArchive={handleBulkArchive}
                    onExportCSV={handleExportCSV}
                    onRefresh={handleRefresh}
                    onNewInvoice={handleNewInvoice}
                    onIngestionHub={() => setShowIngestionHub(true)}
                    onFlagOverdue={() => handleFlagOverdue('')}
                    onDuplicate={handleDuplicate}
                    onCreditNote={handleCreditNote}
                    onVoid={handleVoidInvoice}
                    onRecordPayment={(inv) => setPaymentInvoice(inv)}
                    onSendReminder={handleSendReminder}
                    onRowClick={(inv) => setDrawerInvoice(inv)}
                  />
                )}
              </div>
            )}

            {mainTab === 'ESTIMATES' && (
              <EstimatesPanel
                estimates={estimates}
                loading={estimatesLoading}
                statusTab={estimateStatusTab}
                search={estimateSearch}
                page={estimatePage}
                totalPages={estimateTotalPages}
                totalCount={estimateTotalCount}
                onPageChange={fetchEstimates}
                onStatusTabChange={setEstimateStatusTab}
                onSearchChange={setEstimateSearch}
                onNew={handleNewEstimate}
                onEdit={handleEditEstimate}
                onDelete={handleDeleteEstimate}
                 onSend={handleSendEstimate}
                 onConvert={handleConvertToInvoice}
                 onBulkDelete={handleBulkDeleteEstimates}
                 selectedEstimates={selectedEstimates}
                 setSelectedEstimates={setSelectedEstimates}
                 onManageCustomers={() => {
                  fetchRegistryCustomers();
                  setShowCustomerRegistryStandalone(true);
                }}
                onRefresh={() => fetchEstimates(1)}
              />
            )}

            {mainTab === 'RECURRING' && (
              <RecurringPanel
                invoices={invoices.filter((i) => i.isRecurring)}
                onNewInvoice={handleNewInvoice}
                onTrigger={(inv) => {
                  // Manually send the next occurrence of a recurring invoice
                  handleSend(inv.id);
                }}
                fmt={fmt}
                companyId={selectedCompanyId}
              />
            )}
          </div>
        </div>

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
    color: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  {
    id: 'ACCEPTED',
    label: 'Accepted',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    dot: 'bg-emerald-500',
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

const EST_STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  SENT: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ACCEPTED:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DECLINED: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  CONVERTED:
    'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

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
      {/* ── Estimate KPI strip (flat Akaunting style) ── */}
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

