import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Plus, X, ChevronLeft, ChevronRight, GripVertical, LayoutGrid,
  Layers, BarChart3, Wallet, Users, Banknote, TrendingUp, Bell,
  CheckCircle, Edit2, Trash2, Eye, EyeOff, Globe, Search,
  Star, Zap, Shield, PieChart, Activity, Calendar, Package,
  FileText, CreditCard, Building2, Check, Info, Sparkles,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks';
import toast from 'react-hot-toast';
import KPIWidgetPreview from '../kpiWidgetPreview';

// -- Types ---------------------------------------------------------------------

interface DashboardWidget {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  span?: 1 | 2;
}

interface DashboardConfig {
  id: string;
  name: string;
  widgets: DashboardWidget[];
}

// -- Available widget catalog --------------------------------------------------

const WIDGET_CATALOG: Omit<DashboardWidget, 'visible'>[] = [
  { id: 'cash-flow',            type: 'cash_flow',            label: 'Cash Flow',                 icon: <Wallet size={14} />,       span: 2 },
  { id: 'revenue',              type: 'revenue',              label: 'Revenue & Expenses',        icon: <BarChart3 size={14} />,    span: 2 },
  { id: 'payroll',              type: 'payroll',              label: 'Payroll Summary',           icon: <Banknote size={14} />,     span: 1 },
  { id: 'employees',            type: 'employees',            label: 'Employee Stats',            icon: <Users size={14} />,        span: 1 },
  { id: 'invoices',             type: 'invoices',             label: 'Invoice Overview',          icon: <Layers size={14} />,       span: 1 },
  { id: 'insights',             type: 'insights',             label: 'Strategic Insights',        icon: <TrendingUp size={14} />,   span: 2 },
  { id: 'alerts',               type: 'alerts',               label: 'Smart Alerts',              icon: <Bell size={14} />,         span: 1 },
  { id: 'attendance',           type: 'attendance',           label: 'Attendance Heatmap',        icon: <CheckCircle size={14} />,  span: 2 },
  { id: 'inventory',            type: 'inventory',            label: 'Inventory Summary',         icon: <Package size={14} />,      span: 1 },
  { id: 'banking',              type: 'banking',              label: 'Bank Accounts',             icon: <Wallet size={14} />,       span: 1 },
  { id: 'expenses',             type: 'expenses',             label: 'Expenses & Bills',          icon: <CreditCard size={14} />,   span: 1 },
  { id: 'tax-calendar',         type: 'tax_calendar',         label: 'Tax Calendar',              icon: <Calendar size={14} />,     span: 2 },
  { id: 'ifrs-readiness',       type: 'ifrs_readiness',       label: 'IFRS Readiness',            icon: <Globe size={14} />,        span: 1 },
  { id: 'financial-health',     type: 'financial_health',     label: 'Financial Health',          icon: <Activity size={14} />,     span: 1 },
  { id: 'vat-status',           type: 'vat_status',           label: 'VAT Status',                icon: <Shield size={14} />,       span: 1 },
  { id: 'credibility',          type: 'credibility',          label: 'Business Credibility',      icon: <Star size={14} />,         span: 1 },
  { id: 'quick-actions',        type: 'quick_actions',        label: 'Quick Actions',             icon: <Zap size={14} />,          span: 2 },
  { id: 'recent-invoices',      type: 'recent_invoices',      label: 'Recent Invoices',           icon: <FileText size={14} />,     span: 1 },
  { id: 'companies',            type: 'companies',            label: 'Company Overview',          icon: <Building2 size={14} />,    span: 1 },
  { id: 'pie-breakdown',        type: 'pie_breakdown',        label: 'Expense Breakdown',         icon: <PieChart size={14} />,     span: 1 },
  { id: 'continuous-close',     type: 'continuous_close',     label: 'Continuous Close',          icon: <Zap size={14} />,          span: 1 },
  // ── Ovds-style summary widgets ───────────────────────────────────────
  { id: 'receivables-payables', type: 'receivables_payables', label: 'Receivables & Payables',   icon: <Layers size={14} />,       span: 2 },
  { id: 'cash-flow-summary',    type: 'cash_flow_summary',    label: 'Cash Flow + Expenses',     icon: <BarChart3 size={14} />,    span: 1 },
  { id: 'account-balance',      type: 'account_balance',      label: 'Account Balance',           icon: <Wallet size={14} />,       span: 1 },
  { id: 'module-quick-access',  type: 'module_quick_access',  label: 'Module Quick Access',       icon: <Zap size={14} />,          span: 2 },
  // ── IoT & Smart Management ─────────────────────────────────────────────────
  { id: 'iot-overview',         type: 'iot_overview',         label: 'IoT Device Status',         icon: <Activity size={14} />,     span: 2 },
  { id: 'iot-alerts',           type: 'iot_alerts',           label: 'Live Device Alerts',        icon: <Bell size={14} />,         span: 1 },
  { id: 'iot-telemetry',        type: 'iot_telemetry',        label: 'Energy / Sensor KPIs',      icon: <Zap size={14} />,          span: 1 },
  { id: 'iot-billing',          type: 'iot_billing',          label: 'Smart Billing Queue',       icon: <CreditCard size={14} />,   span: 1 },
  { id: 'etax-status',          type: 'etax_status',          label: 'e-Tax Submissions',         icon: <Shield size={14} />,       span: 1 },
];

// Widget category groupings for the catalog
const WIDGET_CATEGORIES: { label: string; color: string; ids: string[] }[] = [
  { label: 'Summary',    color: 'emerald', ids: ['receivables-payables', 'cash-flow-summary', 'account-balance', 'module-quick-access'] },
  { label: 'ovds',    color: 'emerald', ids: ['cash-flow', 'revenue', 'invoices', 'banking', 'expenses', 'recent-invoices', 'pie-breakdown', 'continuous-close'] },
  { label: 'HR',         color: 'blue',    ids: ['employees', 'payroll', 'attendance'] },
  { label: 'Compliance', color: 'amber',   ids: ['tax-calendar', 'ifrs-readiness', 'vat-status', 'credibility', 'etax-status'] },
  { label: 'Insights',   color: 'violet',  ids: ['insights', 'alerts', 'financial-health', 'quick-actions'] },
  { label: 'Business',   color: 'rose',    ids: ['inventory', 'companies'] },
  { label: 'IoT',        color: 'sky',     ids: ['iot-overview', 'iot-alerts', 'iot-telemetry', 'iot-billing'] },
];

const DEFAULT_DASHBOARD: DashboardConfig = {
  id: 'default',
  name: 'Main Dashboard',
  widgets: WIDGET_CATALOG.map(w => ({ ...w, visible: true })),
};

// -- DashboardManager ----------------------------------------------------------

interface DashboardManagerProps {
  onClose: () => void;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({ onClose }) => {
  const [dashboards, setDashboards] = useLocalStorage<DashboardConfig[]>('dashboards_config', [DEFAULT_DASHBOARD]);
  const [activeIdx, setActiveIdx] = useLocalStorage<number>('dashboard_active_idx', 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboards' | 'widgets' | 'catalog'>('dashboards');
  const [widgetSearch, setWidgetSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const activeDash = dashboards[activeIdx] ?? dashboards[0];

  // Filtered catalog for the Add Widget tab
  const filteredCatalog = useMemo(() => {
    const q = widgetSearch.toLowerCase();
    return WIDGET_CATALOG.filter(w => {
      const matchSearch = !q || w.label.toLowerCase().includes(q) || w.type.includes(q);
      const matchCat = !activeCategory ||
        WIDGET_CATEGORIES.find(c => c.label === activeCategory)?.ids.includes(w.id);
      return matchSearch && matchCat;
    });
  }, [widgetSearch, activeCategory]);

  const addDashboard = () => {
    const newDash: DashboardConfig = {
      id: `dash_${Date.now()}`,
      name: `Dashboard ${dashboards.length + 1}`,
      widgets: WIDGET_CATALOG.map(w => ({ ...w, visible: false })),
    };
    setDashboards(prev => [...prev, newDash]);
    setActiveIdx(dashboards.length);
    toast.success('New dashboard created');
  };

  const removeDashboard = (id: string) => {
    if (dashboards.length <= 1) { toast.error('Cannot remove the last dashboard'); return; }
    setDashboards(prev => prev.filter(d => d.id !== id));
    setActiveIdx(0);
    toast('Dashboard removed');
  };

  const startEdit = (dash: DashboardConfig) => {
    setEditingId(dash.id);
    setEditName(dash.name);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    setDashboards(prev => prev.map(d => d.id === editingId ? { ...d, name: editName.trim() } : d));
    setEditingId(null);
  };

  const toggleWidget = (widgetId: string) => {
    setDashboards(prev => prev.map(d =>
      d.id === activeDash.id
        ? { ...d, widgets: d.widgets.map(w => w.id === widgetId ? { ...w, visible: !w.visible } : w) }
        : d
    ));
  };

  const handleWidgetDrop = useCallback((targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setDashboards(prev => prev.map(d => {
      if (d.id !== activeDash.id) return d;
      const widgets = [...d.widgets];
      const from = widgets.findIndex(w => w.id === dragId);
      const to = widgets.findIndex(w => w.id === targetId);
      if (from === -1 || to === -1) return d;
      const [item] = widgets.splice(from, 1);
      widgets.splice(to, 0, item);
      return { ...d, widgets };
    }));
    setDragId(null);
    setDragOverId(null);
  }, [dragId, activeDash.id, setDashboards]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-aki-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden animate-aki-scale-in">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
          <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-center">
            <LayoutGrid size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900 dark:text-white text-[13px] leading-none">Dashboard Manager</h2>
            <p className="text-[9px] text-slate-400 mt-0.5">{dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''} · {activeDash?.widgets.filter(w => w.visible).length ?? 0} active widgets</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
            {([{ key: 'dashboards' as const, label: 'Dashboards', icon: <LayoutGrid size={10} /> }, { key: 'widgets' as const, label: 'Arrange', icon: <GripVertical size={10} /> }, { key: 'catalog' as const, label: 'Add Widget', icon: <Plus size={10} /> }]).map(tab => (
              <button key={tab.key} onClick={() => setView(tab.key)} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${view === tab.key ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{tab.icon}{tab.label}</button>
            ))}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {view === 'dashboards' && (
            <div className="p-4 space-y-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={10} className="text-emerald-600 dark:text-emerald-400" /> Dashboard Slider</p>
                  <span className="ovds-caption">{activeIdx + 1} / {dashboards.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveIdx(i => Math.max(0, i - 1))} disabled={activeIdx === 0} className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"><ChevronLeft size={13} /></button>
                  <div className="flex-1 flex gap-1.5 overflow-x-auto pb-0.5">
                    {dashboards.map((d, i) => (
                      <button key={d.id} onClick={() => setActiveIdx(i)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${i === activeIdx ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20 dark:shadow-emerald-500/10/30' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-500/40 dark:border-emerald-700 hover:text-emerald-600 dark:text-emerald-400'}`}>{d.name}</button>
                    ))}
                  </div>
                  <button onClick={() => setActiveIdx(i => Math.min(dashboards.length - 1, i + 1))} disabled={activeIdx === dashboards.length - 1} className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"><ChevronRight size={13} /></button>
                </div>
                <div className="flex justify-center gap-1 mt-3">
                  {dashboards.map((_, i) => (<button key={i} onClick={() => setActiveIdx(i)} className={`rounded-full transition-all ${i === activeIdx ? 'w-4 h-1.5 bg-emerald-500' : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-emerald-50/50 dark:bg-emerald-950/100'}`} />))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Your Dashboards</p>
                {dashboards.map((d, i) => (
                  <div key={d.id} className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all ${i === activeIdx ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10 dark:bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 ${i === activeIdx ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 dark:shadow-emerald-500/10/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{i + 1}</div>
                    <button onClick={() => setActiveIdx(i)} className="flex-1 text-left min-w-0">
                      {editingId === d.id ? (
                        <input ref={nameInputRef} value={editName} onChange={e => setEditName(e.target.value)} onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }} className="w-full text-sm font-bold bg-transparent border-b-2 border-emerald-600 outline-none text-slate-900 dark:text-white pb-0.5" onClick={e => e.stopPropagation()} />
                      ) : (
                        <div><p className="text-sm font-bold text-slate-900 dark:text-white truncate">{d.name}</p><p className="ovds-caption">{d.widgets.filter(w => w.visible).length} widgets active</p></div>
                      )}
                    </button>
                    {i === activeIdx && <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">ACTIVE</span>}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(d)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-emerald-400"><Edit2 size={12} /></button>
                      <button onClick={() => removeDashboard(d.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors text-slate-400 hover:text-rose-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addDashboard} className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-400 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:bg-emerald-950/10 transition-all group">
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center transition-colors"><Plus size={14} className="group-hover:text-emerald-600 dark:text-emerald-400 transition-colors" /></div>
                Create New Dashboard
              </button>
              <div className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                <Info size={13} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-300 leading-relaxed">Use the <strong>slider</strong> to switch between dashboards. Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-[9px] font-mono">D</kbd> anywhere to open this manager.</p>
              </div>
            </div>
          )}
          {view === 'widgets' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-semibold text-slate-900 dark:text-white">{activeDash?.name}</p><p className="ovds-caption">Drag to reorder · click eye to show/hide</p></div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setDashboards(prev => prev.map(d => d.id === activeDash.id ? { ...d, widgets: d.widgets.map(w => ({ ...w, visible: true })) } : d))} className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors">Show All</button>
                  <button onClick={() => setDashboards(prev => prev.map(d => d.id === activeDash.id ? { ...d, widgets: d.widgets.map(w => ({ ...w, visible: false })) } : d))} className="px-2.5 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 transition-colors">Hide All</button>
                </div>
              </div>
              <div className="space-y-1.5">
                {activeDash?.widgets.map((widget, idx) => (
                  <div key={widget.id} draggable onDragStart={() => setDragId(widget.id)} onDragOver={e => { e.preventDefault(); setDragOverId(widget.id); }} onDragLeave={() => setDragOverId(null)} onDrop={() => handleWidgetDrop(widget.id)} onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                    className={['flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none', dragId === widget.id ? 'opacity-30 scale-95' : '', dragOverId === widget.id && dragId !== widget.id ? 'ring-2 ring-emerald-500/30 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10' : widget.visible ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'].join(' ')}>
                    <GripVertical size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${widget.visible ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{widget.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${widget.visible ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{widget.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${widget.span === 2 ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{widget.span === 2 ? 'Full width' : 'Half width'}</span>
                        <span className="text-[9px] text-slate-300 dark:text-slate-600">#{idx + 1}</span>
                      </div>
                    </div>
                    <button onClick={() => toggleWidget(widget.id)} className={`p-2 rounded-xl transition-all ${widget.visible ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:bg-emerald-900/30' : 'text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {view === 'catalog' && (
            <div className="p-5 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={widgetSearch} onChange={e => setWidgetSearch(e.target.value)} placeholder="Search widgets..." className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[12px] font-medium dark:text-slate-200 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setActiveCategory(null)} className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all border ${!activeCategory ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}>All ({WIDGET_CATALOG.length})</button>
                {WIDGET_CATEGORIES.map(cat => {
                  const active = activeCategory === cat.label;
                  const ca: Record<string,string> = { emerald:'bg-emerald-500 text-white border-emerald-500', blue:'bg-emerald-500 text-white border-emerald-500', amber:'bg-amber-500 text-white border-amber-500', violet:'bg-violet-500 text-white border-violet-500', rose:'bg-rose-500 text-white border-rose-500' };
                  const ci: Record<string,string> = { emerald:'text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50', blue:'text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50', amber:'text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50', violet:'text-violet-600 border-violet-200 dark:border-violet-800 hover:bg-violet-50', rose:'text-rose-600 border-rose-200 dark:border-rose-800 hover:bg-rose-50' };
                  return (<button key={cat.label} onClick={() => setActiveCategory(active ? null : cat.label)} className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all border ${active ? ca[cat.color] : `bg-white dark:bg-slate-800 ${ci[cat.color]}`}`}>{cat.label} ({cat.ids.length})</button>);
                })}
              </div>
              {/* Widget catalog — OVDS auto-fill grid */}
              <div className="ovds-grid-layout cols-2 gap-sm">
                {filteredCatalog.map(widget => {
                  const isVisible = activeDash?.widgets.some(w => w.id === widget.id && w.visible);
                  const isInDash = activeDash?.widgets.some(w => w.id === widget.id);
                  return (
                    <div
                      key={widget.id}
                      className={[
                        'relative p-3.5 rounded-xl border transition-all cursor-pointer group',
                        isVisible
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800',
                      ].join(' ')}
                      onClick={() => {
                        if (!isInDash) {
                          setDashboards(prev => prev.map(d => d.id === activeDash.id ? { ...d, widgets: [...d.widgets, { ...widget, visible: true }] } : d));
                          toast.success(`${widget.label} added`);
                        } else {
                          toggleWidget(widget.id);
                        }
                      }}
                    >
                      {/* Active check badge */}
                      {isVisible && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check size={9} className="text-white" />
                        </div>
                      )}
                      {/* KPI preview for supported widget types */}
                      {['payroll','attendance','employees'].includes(widget.type) ? (
                        <div className="mb-2.5">
                          <KPIWidgetPreview
                            type={widget.type === 'employees' ? 'whoIsIn' : widget.type as 'payroll' | 'attendance'}
                            data={null}
                            loading={false}
                          />
                        </div>
                      ) : (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${isVisible ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                          {widget.icon}
                        </div>
                      )}
                      <p className="ovds-card-title leading-tight truncate">{widget.label}</p>
                      <p className="ovds-caption mt-0.5">{widget.span === 2 ? 'Full width' : 'Half width'}</p>
                      <div className={`mt-2.5 w-full py-1.5 rounded-lg text-[10px] font-semibold text-center transition-all ${isVisible ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`}>
                        {isVisible ? '✓ Visible' : isInDash ? '+ Show' : '+ Add'}
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredCatalog.length === 0 && (
                <div className="ovds-empty !py-10">
                  <div className="ovds-empty-icon"><Search size={20} /></div>
                  <p className="ovds-card-title">No widgets match</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">{dashboards.map((_, i) => (<button key={i} onClick={() => setActiveIdx(i)} className={`rounded-full transition-all ${i === activeIdx ? 'w-3 h-1 bg-emerald-500' : 'w-1 h-1 bg-slate-300 dark:bg-slate-600'}`} />))}</div>
            <span className="ovds-caption">{activeDash?.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="ovds-caption">{activeDash?.widgets.filter(w => w.visible).length ?? 0} widgets</span>
            <button onClick={onClose} className="px-3 py-1.5 bg-emerald-500 text-white rounded text-[11px] font-semibold hover:bg-emerald-600 transition-all">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardManager;









