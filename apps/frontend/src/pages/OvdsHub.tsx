/**
 * ovdsHub — ovds-inspired financial command centre
 * Full UI/UX overhaul: modern dashboard, fluid navigation, responsive grid
 * Designed for non-accountants: plain-language labels, visual indicators
 * Tailwind CSS powered · Emerald brand · White cards
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  TrendingDown,
  FileText,
  Receipt,
  Landmark,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  BookOpen,
  CreditCard,
  Users2,
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Zap,
  Globe,
  PieChart,
  Target,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtETB, getEthFiscalYear } from '../utils/ethiopianTax';
import { Card, StatusBadge, Btn, IconBox, PipelineBar } from '../components/ui';
import { IFRSBadge } from '../components/ui';
import { PipelineFlow } from '../components/ui';
import type { FlowStage } from '../components/ui';
import {
  ovdsKpiCard,
  ovdsSummaryBar,
  ovdsHealthScore,
} from '@ovds/ui';
import {
  ovdsQuickActions,
  ovdsRecentActivity,
} from '../components/ovds';

// -- Chart tooltip -------------------------------------------------------------
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-[11px]">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {fmtETB(p.value)}
        </p>
      ))}
    </div>
  );
};

// -- Section header with action link ------------------------------------------
const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, subtitle, action, icon }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      {icon && (
        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500">
          {icon}
        </div>
      )}
      <div>
        <h2 className="ovds-module-title tracking-tight">{title}</h2>
        {subtitle && <p className="ovds-caption mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// -- Compliance row item -------------------------------------------------------
const ComplianceRow: React.FC<{
  std: string;
  label: string;
  status: boolean;
  onClick?: () => void;
}> = ({ std, label, status, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 ${onClick ? 'cursor-pointer hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors' : ''}`}
  >
    <div className="flex items-center gap-2.5">
      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
        {std}
      </span>
      <span className="text-[12px] text-slate-600 font-medium">{label}</span>
    </div>
    <span
      className={`text-[10px] font-bold flex items-center gap-1 ${status ? 'text-emerald-600' : 'text-rose-500'}`}
    >
      {status ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
      {status ? 'Active' : 'Inactive'}
    </span>
  </div>
);

// -- Tax position cell ---------------------------------------------------------
const TaxCell: React.FC<{
  label: string;
  value: number;
  color: string;
  bg: string;
  onClick?: () => void;
}> = ({ label, value, color, bg, onClick }) => (
  <div
    onClick={onClick}
    className={`${bg} rounded-xl p-3 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
  >
    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
      {label}
    </p>
    <p className={`text-[14px] font-bold tabular-nums ${color}`}>
      {fmtETB(value)}
    </p>
  </div>
);

// -- Main ovdsHub Component -------------------------------------------------
const ovdsHub: React.FC = () => {
  usePageTitle('ovds Hub');
  const navigate = useNavigate();
  const { selectedCompanyId } = useBusiness();
  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
  const [activeTab, setActiveTab] = useState<
    'overview' | 'invoices' | 'expenses' | 'tax'
  >('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // -- Data queries ----------------------------------------------------------
  const {
    data: summary,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['ovds-hub-summary', selectedCompanyId],
    queryFn: () =>
      api
        .get(`/ovds/summary${cq}`)
        .then((r: any) => r.data?.data ?? r.data)
        .catch(() => null),
    staleTime: 60_000,
  });

  const { data: trend } = useQuery({
    queryKey: ['ovds-hub-trend', selectedCompanyId],
    queryFn: () =>
      api
        .get(`/ovds/revenue-trend${cq}`)
        .then((r: any) => {
          const d = r.data?.data ?? r.data;
          return Array.isArray(d) ? d : [];
        })
        .catch(() => [] as any[]),
    staleTime: 120_000,
  });

  const { data: recentInvoices } = useQuery({
    queryKey: ['ovds-hub-invoices', selectedCompanyId],
    queryFn: () =>
      api
        .get(
          `/ovds/invoices?limit=8${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ''}`,
        )
        .then((r: any) => {
          const d = r.data?.data ?? r.data;
          return Array.isArray(d) ? d : (d?.invoices ?? []);
        })
        .catch(() => [] as any[]),
    staleTime: 30_000,
  });

  const { data: recentBills } = useQuery({
    queryKey: ['ovds-hub-bills', selectedCompanyId],
    queryFn: () =>
      api
        .get(
          `/ovds/bills?limit=8${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ''}`,
        )
        .then((r: any) => {
          const d = r.data?.data ?? r.data;
          return Array.isArray(d) ? d : [];
        })
        .catch(() => [] as any[]),
    staleTime: 30_000,
  });

  // -- Derived values --------------------------------------------------------
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;
  const netProfit = totalRevenue - totalExpenses;
  const cashBalance = summary?.cashBalance ?? 0;
  const outstandingAR = summary?.outstandingAR ?? 0;
  const outstandingAP = summary?.outstandingAP ?? 0;
  const collectionRate = summary?.collectionRate ?? 0;
  const grossMargin = summary?.grossMargin ?? 0;
  const vatPayable = summary?.vatPayable ?? 0;
  const whtDeducted = summary?.whtDeducted ?? 0;
  const dso = summary?.dso ?? 0;
  const overdueCount = summary?.invoiceOverdue ?? 0;

  // Spark data from trend
  const sparkRevenue = useMemo(
    () => (trend ?? []).slice(-7).map((d: any) => ({ value: d.revenue ?? 0 })),
    [trend],
  );
  const sparkExpenses = useMemo(
    () => (trend ?? []).slice(-7).map((d: any) => ({ value: d.expenses ?? 0 })),
    [trend],
  );

  // Pipeline stages
  const flowStages: FlowStage[] = useMemo(
    () => [
      {
        key: 'sales',
        label: 'Sales',
        sublabel: fmtETB(totalRevenue),
        status: 'completed',
        icon: 'FILE_TEXT',
        onClick: () => navigate('/sales/invoices'),
      },
      {
        key: 'collection',
        label: 'Collection',
        sublabel: `${collectionRate}%`,
        status: collectionRate >= 80 ? 'completed' : 'active',
        onClick: () => navigate('/accounting/collections'),
      },
      {
        key: 'banking',
        label: 'Banking',
        sublabel: fmtETB(cashBalance),
        status: 'active',
        icon: 'LANDMARK',
        onClick: () => navigate('/banking/accounts'),
      },
      {
        key: 'tax',
        label: 'Tax',
        sublabel: fmtETB(vatPayable),
        status: vatPayable > 0 ? 'warning' : 'completed',
        icon: 'SHIELD_CHECK',
        onClick: () => navigate('/tax/dashboard'),
      },
      {
        key: 'reporting',
        label: 'Reports',
        sublabel: 'IFRS',
        status: 'pending',
        icon: 'CHART',
        onClick: () => navigate('/reports'),
      },
    ],
    [summary, navigate, totalRevenue, collectionRate, cashBalance, vatPayable],
  );

  const pipelineStages = useMemo(
    () => [
      {
        key: 'draft',
        label: 'Draft',
        count: summary?.invoiceDraft ?? 0,
        color: 'bg-slate-400',
      },
      {
        key: 'sent',
        label: 'Sent',
        count: summary?.invoiceSent ?? 0,
        color: 'bg-sky-500',
      },
      {
        key: 'partial',
        label: 'Partial',
        count: summary?.invoicePartial ?? 0,
        color: 'bg-amber-500',
      },
      {
        key: 'paid',
        label: 'Paid',
        count: summary?.invoicePaid ?? 0,
        color: 'bg-emerald-500',
      },
      {
        key: 'overdue',
        label: 'Overdue',
        count: summary?.invoiceOverdue ?? 0,
        color: 'bg-rose-500',
      },
    ],
    [summary],
  );

  const tabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: <LayoutGrid size={13} />,
    },
    {
      id: 'invoices' as const,
      label: 'Invoices',
      icon: <FileText size={13} />,
    },
    {
      id: 'expenses' as const,
      label: 'Expenses',
      icon: <CreditCard size={13} />,
    },
    { id: 'tax' as const, label: 'Tax', icon: <ShieldCheck size={13} /> },
  ];

  return (
    <div className="min-h-full bg-white dark:bg-slate-950">
      {/* -- Page header -- */}
      <div className="ovds-page-hero">
        <div className="ovds-page-hero-body">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 shadow-sm shadow-emerald-500/30 flex items-center justify-center text-white shrink-0">
              <Wallet size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="ovds-module-title tracking-tight leading-tight">
                ovds Hub
              </h1>
              <p className="ovds-caption mt-0.5">
                Financial command centre · {getEthFiscalYear()}
              </p>
            </div>
          </div>
          <div className="ovds-page-hero-actions">
            <IFRSBadge compliant />
            {/* View toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid view"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                title="List view"
              >
                <List size={13} />
              </button>
            </div>
            <Btn
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={11} />}
              onClick={() => refetch()}
            >
              Refresh
            </Btn>
          </div>
        </div>

        {/* Tab bar */}
        <div className="ovds-tab-nav mt-3 border-t border-slate-100/70 pt-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ovds-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* -- Content -- */}
      <div className="p-4 sm:p-5 space-y-5 max-w-[1440px] mx-auto">
        {/* -- OVERVIEW TAB -- */}
        {activeTab === 'overview' && (
          <>
            {/* Summary bar — money in vs out */}
            <ovdsSummaryBar
              moneyIn={totalRevenue}
              moneyOut={totalExpenses}
              netProfit={netProfit}
              cashBalance={cashBalance}
              currency="ETB"
              loading={isLoading}
              period={getEthFiscalYear()}
            />

            {/* KPI grid — 4 cards */}
            <div
              className={
                viewMode === 'grid'
                  ? 'ovds-grid-layout cols-4'
                  : 'ovds-grid-layout cols-1'
              }
            >
              <ovdsKpiCard
                label="Accounts Receivable"
                tooltip="Money customers owe you — invoices not yet paid"
                value={fmtETB(outstandingAR)}
                subValue={`${overdueCount} overdue`}
                trend={summary?.arTrend}
                icon={<FileText size={16} />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                accentColor="border-emerald-500"
                sparkData={sparkRevenue}
                loading={isLoading}
                onClick={() => navigate('/sales/invoices')}
              />
              <ovdsKpiCard
                label="Accounts Payable"
                tooltip="Money you owe vendors — bills not yet paid"
                value={fmtETB(outstandingAP)}
                subValue="Unpaid bills"
                trend={summary?.apTrend}
                icon={<Receipt size={16} />}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                accentColor="border-amber-500"
                sparkData={sparkExpenses}
                loading={isLoading}
                onClick={() => navigate('/purchases/bills')}
              />
              <ovdsKpiCard
                label="Cash & Bank"
                tooltip="Total money available across all your bank accounts"
                value={fmtETB(cashBalance)}
                subValue="All accounts"
                icon={<Landmark size={16} />}
                iconBg="bg-sky-50"
                iconColor="text-sky-600"
                accentColor="border-sky-500"
                loading={isLoading}
                onClick={() => navigate('/banking/accounts')}
              />
              <ovdsKpiCard
                label="Collection Rate"
                tooltip="Percentage of invoiced amounts that have been collected"
                value={`${collectionRate.toFixed(0)}%`}
                subValue={`${grossMargin.toFixed(1)}% gross margin`}
                trend={summary?.collectionTrend}
                icon={<Target size={16} />}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                accentColor="border-violet-500"
                loading={isLoading}
                onClick={() => navigate('/accounting/collections')}
              />
            </div>

            {/* Quick actions */}
            <div>
              <SectionHeader
                title="Quick Actions"
                subtitle="Common tasks — click to get started"
                icon={<Zap size={14} />}
              />
              <ovdsQuickActions />
            </div>

            {/* ovds pipeline */}
            <div>
              <SectionHeader
                title="ovds Pipeline"
                subtitle="Your money's journey from invoice to tax"
                icon={<Activity size={14} />}
              />
              <Card className="mb-0">
                <PipelineFlow stages={flowStages} />
              </Card>
            </div>

            {/* Invoice status bar */}
            <div>
              <SectionHeader
                title="Invoice Status"
                subtitle="Where your invoices stand right now"
                icon={<FileText size={14} />}
                action={
                  <button
                    onClick={() => navigate('/sales/invoices')}
                    className="flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    View all <ArrowRight size={10} />
                  </button>
                }
              />
              <PipelineBar stages={pipelineStages} />
            </div>

            {/* Chart + Health score */}
            <div className="ovds-grid-layout cols-3">
              {/* Revenue vs Expenses chart */}
              <Card className="lg:col-span-2" padding="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IconBox
                      icon={<BarChart3 size={13} />}
                      color="emerald"
                      size="sm"
                    />
                    <div>
                      <p className="text-[13px] font-bold text-slate-700">
                        Revenue vs Expenses
                      </p>
                      <p className="ovds-caption">Last 6 months</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-semibold">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Revenue
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                      Expenses
                    </span>
                  </div>
                </div>
                {(trend ?? []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                      data={trend}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#00E784"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="95%"
                            stopColor="#00E784"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#f43f5e"
                            stopOpacity={0.12}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f43f5e"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<ChartTip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#00E784"
                        strokeWidth={2}
                        fill="url(#rev)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fill="url(#exp)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <BarChart3 size={32} />
                    <p className="text-[11px] text-slate-400">
                      No trend data yet
                    </p>
                  </div>
                )}
              </Card>

              {/* Financial health score */}
              <ovdsHealthScore
                collectionRate={collectionRate}
                overdueCount={overdueCount}
                cashBalance={cashBalance}
                grossMargin={grossMargin}
                dso={dso}
                currency="ETB"
                loading={isLoading}
              />
            </div>

            {/* Recent activity + Tax position */}
            <div className="ovds-grid-layout cols-2">
              <ovdsRecentActivity
                invoices={recentInvoices ?? []}
                bills={recentBills ?? []}
                loading={isLoading}
                currency="ETB"
              />

              {/* Tax position */}
              <Card padding="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IconBox
                      icon={<ShieldCheck size={13} />}
                      color="violet"
                      size="sm"
                    />
                    <div>
                      <p className="text-[13px] font-bold text-slate-700">
                        Ethiopian Tax Position
                      </p>
                      <p className="ovds-caption">Current obligations</p>
                    </div>
                  </div>
                  <IFRSBadge compliant />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <TaxCell
                    label="VAT Payable"
                    value={vatPayable}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    onClick={() => navigate('/tax/vat')}
                  />
                  <TaxCell
                    label="WHT Deducted"
                    value={whtDeducted}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    onClick={() => navigate('/tax/dashboard')}
                  />
                  <TaxCell
                    label="Pension (Emp.)"
                    value={summary?.pensionEmployee ?? 0}
                    color="text-violet-600"
                    bg="bg-violet-50"
                  />
                  <TaxCell
                    label="DRRF Levy"
                    value={summary?.drrfLevy ?? 0}
                    color="text-rose-600"
                    bg="bg-rose-50"
                    onClick={() => navigate('/disaster-fund')}
                  />
                </div>
                <button
                  onClick={() => navigate('/tax/dashboard')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-50 text-violet-700 rounded-xl text-[11px] font-semibold hover:bg-violet-100 transition-all border border-violet-100"
                >
                  View Tax Dashboard <ArrowRight size={10} />
                </button>
              </Card>
            </div>

            {/* IFRS compliance */}
            <Card padding="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IconBox
                    icon={<BookOpen size={13} />}
                    color="sky"
                    size="sm"
                  />
                  <div>
                    <p className="text-[13px] font-bold text-slate-700">
                      IFRS Compliance
                    </p>
                    <p className="ovds-caption">
                      International Financial Reporting Standards
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/ifrs')}
                  className="flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-semibold"
                >
                  IFRS Dashboard <ArrowRight size={10} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                {[
                  {
                    std: 'IFRS 15',
                    label: 'Revenue Recognition',
                    status: true,
                  },
                  { std: 'IFRS 16', label: 'Lease Accounting', status: true },
                  {
                    std: 'IFRS 9',
                    label: 'Financial Instruments',
                    status: true,
                  },
                  {
                    std: 'IAS 21',
                    label: 'Foreign Currency (ETB)',
                    status: true,
                  },
                  { std: 'IAS 12', label: 'Income Taxes', status: true },
                  {
                    std: 'IAS 37',
                    label: 'Provisions & Contingencies',
                    status: true,
                  },
                ].map((item) => (
                  <ComplianceRow
                    key={item.std}
                    {...item}
                    onClick={() => navigate('/ifrs')}
                  />
                ))}
              </div>
            </Card>
          </>
        )}

        {/* -- INVOICES TAB -- */}
        {activeTab === 'invoices' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <ovdsKpiCard
                label="Total Invoiced"
                tooltip="Total amount billed to customers this period"
                value={fmtETB(totalRevenue)}
                icon={<FileText size={16} />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                accentColor="border-emerald-500"
                loading={isLoading}
                onClick={() => navigate('/sales/invoices')}
              />
              <ovdsKpiCard
                label="Collected"
                tooltip="Amount already paid by customers"
                value={fmtETB(summary?.paidRevenue ?? 0)}
                icon={<CheckCircle2 size={16} />}
                iconBg="bg-sky-50"
                iconColor="text-sky-600"
                accentColor="border-sky-500"
                loading={isLoading}
              />
              <ovdsKpiCard
                label="Outstanding"
                tooltip="Amount still owed by customers"
                value={fmtETB(outstandingAR)}
                icon={<Clock size={16} />}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                accentColor="border-amber-500"
                loading={isLoading}
              />
              <ovdsKpiCard
                label="Overdue"
                tooltip="Invoices past their payment due date"
                value={overdueCount.toString()}
                subValue="invoices"
                icon={<AlertCircle size={16} />}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                accentColor="border-rose-500"
                loading={isLoading}
                onClick={() => navigate('/sales/invoices')}
              />
            </div>
            <SectionHeader
              title="Invoice Pipeline"
              subtitle="Track where each invoice stands"
              icon={<FileText size={14} />}
            />
            <PipelineBar stages={pipelineStages} />
            <ovdsRecentActivity
              invoices={recentInvoices ?? []}
              bills={[]}
              loading={isLoading}
              currency="ETB"
            />
          </>
        )}

        {/* -- EXPENSES TAB -- */}
        {activeTab === 'expenses' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <ovdsKpiCard
                label="Total Expenses"
                tooltip="All money spent this period"
                value={fmtETB(totalExpenses)}
                icon={<TrendingDown size={16} />}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                accentColor="border-rose-500"
                loading={isLoading}
                onClick={() => navigate('/purchases/expenses')}
              />
              <ovdsKpiCard
                label="Bills Payable"
                tooltip="Vendor bills you still need to pay"
                value={fmtETB(outstandingAP)}
                icon={<Receipt size={16} />}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                accentColor="border-amber-500"
                loading={isLoading}
                onClick={() => navigate('/purchases/bills')}
              />
              <ovdsKpiCard
                label="Gross Margin"
                tooltip="Percentage of revenue kept after direct costs"
                value={`${grossMargin.toFixed(1)}%`}
                icon={<PieChart size={16} />}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                accentColor="border-violet-500"
                loading={isLoading}
              />
              <ovdsKpiCard
                label="Days to Pay"
                tooltip="Average days to pay vendor bills (lower is better)"
                value={`${dso}d`}
                icon={<Clock size={16} />}
                iconBg="bg-sky-50"
                iconColor="text-sky-600"
                accentColor="border-sky-500"
                loading={isLoading}
              />
            </div>
            <ovdsRecentActivity
              invoices={[]}
              bills={recentBills ?? []}
              loading={isLoading}
              currency="ETB"
            />
          </>
        )}

        {/* -- TAX TAB -- */}
        {activeTab === 'tax' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <ovdsKpiCard
                label="VAT Payable"
                tooltip="Value Added Tax owed to MoR"
                value={fmtETB(vatPayable)}
                icon={<ShieldCheck size={16} />}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                accentColor="border-violet-500"
                loading={isLoading}
                onClick={() => navigate('/tax/vat')}
              />
              <ovdsKpiCard
                label="WHT Deducted"
                tooltip="Withholding Tax deducted from vendor payments"
                value={fmtETB(whtDeducted)}
                icon={<Globe size={16} />}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                accentColor="border-amber-500"
                loading={isLoading}
                onClick={() => navigate('/tax/dashboard')}
              />
              <ovdsKpiCard
                label="DRRF Levy"
                tooltip="Disaster Risk Reduction Fund levy (5%)"
                value={fmtETB(summary?.drrfLevy ?? 0)}
                icon={<AlertCircle size={16} />}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                accentColor="border-rose-500"
                loading={isLoading}
                onClick={() => navigate('/disaster-fund')}
              />
              <ovdsKpiCard
                label="Pension (Emp.)"
                tooltip="Employee pension contributions"
                value={fmtETB(summary?.pensionEmployee ?? 0)}
                icon={<Users2 size={16} />}
                iconBg="bg-sky-50"
                iconColor="text-sky-600"
                accentColor="border-sky-500"
                loading={isLoading}
              />
            </div>
            <Card padding="p-4">
              <div className="flex items-center gap-2 mb-4">
                <IconBox
                  icon={<ShieldCheck size={13} />}
                  color="violet"
                  size="sm"
                />
                <p className="text-[13px] font-bold text-slate-700">
                  IFRS Compliance Status
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                {[
                  {
                    std: 'IFRS 15',
                    label: 'Revenue Recognition',
                    status: true,
                  },
                  { std: 'IFRS 16', label: 'Lease Accounting', status: true },
                  {
                    std: 'IFRS 9',
                    label: 'Financial Instruments',
                    status: true,
                  },
                  {
                    std: 'IAS 21',
                    label: 'Foreign Currency (ETB)',
                    status: true,
                  },
                  { std: 'IAS 12', label: 'Income Taxes', status: true },
                  { std: 'IAS 37', label: 'Provisions', status: true },
                ].map((item) => (
                  <ComplianceRow
                    key={item.std}
                    {...item}
                    onClick={() => navigate('/ifrs')}
                  />
                ))}
              </div>
              <button
                onClick={() => navigate('/tax/dashboard')}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-violet-50 text-violet-700 rounded-xl text-[12px] font-semibold hover:bg-violet-100 transition-all border border-violet-100"
              >
                Open Tax Dashboard <ArrowRight size={11} />
              </button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ovdsHub;

