/**
 * SinglePageAccounting — Unified ovds-style Accounting Hub
 * Full CRUD: Items, Customers, Vendors, Banks, Tax Types, Companies, Partners, Integrations
 * White bg · indigo text · White-blue icons · Ethiopian Tax (VAT 15%, WHT 3%) · IFRS
 */
import {
  Package, Users2, Building2, Landmark, Plus, RefreshCw,
  Edit2, Trash2, ChevronRight, Activity, Truck,
  Percent, Briefcase, Cpu, HeartHandshake as Handshake,
  Tag, AlertCircle, ExternalLink, ShieldCheck,
  History as HistoryIcon, FileText, LayoutGrid, Target,
  Receipt, ClipboardList, BarChart3, PieChart, Settings,
  ArrowUpRight, ArrowDownRight, Wallet, Clock,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

import { OvdsPageHeader } from '../components/ovds';
import {
  AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Input, Select, FormField, SearchBar, Textarea,
  StatusBadge, Amount, EthTaxBadge, Modal, BlueIcon,
  Banner, Card, Sticker, IFRSBadge, EmptyState, confirm,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
type Tab = 'DASHBOARD' | 'PIPELINE' | 'INVOICES' | 'BILLS' | 'CRM_DEALS' | 'ITEMS' | 'CUSTOMERS' | 'VENDORS' | 'BANKS' | 'HR' | 'REPORTS' | 'ADMINISTRATION' | 'COMPANIES' | 'TAX_TYPES' | 'CRM_CONTACTS' | 'CRM_ACTIVITIES' | 'COMPLIANCE' | 'INTEGRATIONS' | 'PARTNERS';

interface ModalState { open: boolean; type: 'CREATE' | 'EDIT'; data: Record<string, any> }

// -----------------------------------------------------------------------------
// Helper: field updater
// -----------------------------------------------------------------------------
const _upd = (
  setModal: React.Dispatch<React.SetStateAction<ModalState>>,
  field: string,
  value: any,
) => setModal(prev => ({ ...prev, data: { ...prev.data, [field]: value } }));

// -----------------------------------------------------------------------------
// Pipeline View
// -----------------------------------------------------------------------------
const PipelineView: React.FC<{ refetch: () => void; companyId?: string | null; onTab: (t: Tab) => void }> = ({
  refetch, companyId, onTab,
}) => {
  const [running, setRunning] = useState(false);
  const { can } = useAuth();

  const runAutomation = async () => {
    if (!companyId) return toast.error('Select a company first');
    setRunning(true);
    try {
      await api.post('/ovds/reconciliation/run', { applyAutoReconcile: true });
      toast.success('Pipeline complete — transactions reconciled.');
      refetch();
    } catch { /* api.ts shows toast */ } finally { setRunning(false); }
  };

  return (
    <div className="space-y-4">
      <Banner
        variant="info"
        title="Automated Accounting Pipeline"
        message="Reconcile bank statements, auto-post journal entries, and generate IFRS-compliant reports in one click."
        action={can('ovds:write') ? { label: running ? 'Running…' : 'Run Pipeline', onClick: runAutomation } : undefined}
        compact
      />

      <div className="ovds-grid-layout cols-3">
        {/* Bank Reconciliation */}
        <Card hover padding="p-4" className="border-l-4 border-l-blue-600 relative">
          <div className="absolute top-3 right-3"><Sticker label="Pending" variant="blue" pulse /></div>
          <div className="flex items-center gap-3 mb-2">
            <BlueIcon icon={<HistoryIcon size={15} />} size="sm" />
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">Bank Reconciliation</h4>
          </div>
          <p className="text-[10px] text-[var(--pro-azure)]/70 mb-3 leading-relaxed">
            Unmatched transactions waiting for automated bank statement matching.
          </p>
          <Btn variant="secondary" size="sm" className="w-full" onClick={() => window.location.assign('/banking/accounts')}>
            Review Now
          </Btn>
        </Card>

        {/* IFRS Compliance */}
        <Card hover padding="p-4" className="border-l-4 border-l-indigo-500 relative">
          <div className="absolute top-3 right-3"><IFRSBadge standard="15" /></div>
          <div className="flex items-center gap-3 mb-2">
            <BlueIcon icon={<ShieldCheck size={15} />} size="sm" />
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">IFRS Compliance</h4>
          </div>
          <p className="text-[10px] text-[var(--pro-azure)]/70 mb-3 leading-relaxed">
            Revenue recognition per IFRS 15 five-step model. All entries auto-posted.
          </p>
          <Btn variant="secondary" size="sm" className="w-full" onClick={() => window.location.assign('/ifrs')}>
            Audit Log
          </Btn>
        </Card>

        {/* Tax Pipeline */}
        <Card hover padding="p-4" className="border-l-4 border-l-blue-600 relative">
          <div className="absolute top-3 right-3"><Sticker label="VAT Due" variant="indigo" /></div>
          <div className="flex items-center gap-3 mb-2">
            <BlueIcon icon={<Landmark size={15} />} size="sm" />
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">Tax Pipeline (ERCA)</h4>
          </div>
          <p className="text-[10px] text-[var(--pro-azure)]/70 mb-3 leading-relaxed">
            VAT/WHT returns per Proclamation No. 1341/2024. Filing deadline: 30th.
          </p>
          <Btn variant="primary" size="sm" className="w-full" onClick={() => window.location.assign('/tax/vat')}>
            Submit Return
          </Btn>
        </Card>

        {/* Customers pipeline */}
        <Card hover padding="p-4" className="border-l-4 border-l-blue-600 relative">
          <div className="flex items-center gap-3 mb-2">
            <BlueIcon icon={<Users2 size={15} />} size="sm" />
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">Customer Pipeline</h4>
          </div>
          <p className="text-[10px] text-[var(--pro-azure)]/70 mb-3 leading-relaxed">
            Track AR aging, overdue invoices, and collection cases in one view.
          </p>
          <Btn variant="secondary" size="sm" className="w-full" onClick={() => window.location.assign('/accounting/collections')}>
            View Collections
          </Btn>
        </Card>

        {/* Vendor pipeline */}
        <Card hover padding="p-4" className="border-l-4 border-l-blue-600 relative">
          <div className="flex items-center gap-3 mb-2">
            <BlueIcon icon={<Truck size={15} />} size="sm" />
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">Vendor Pipeline</h4>
          </div>
          <p className="text-[10px] text-[var(--pro-azure)]/70 mb-3 leading-relaxed">
            AP aging, WHT deductions, and purchase order approvals.
          </p>
          <Btn variant="secondary" size="sm" className="w-full" onClick={() => window.location.assign('/purchases/vendors')}>
            View Vendors
          </Btn>
        </Card>

        {/* Integration hub */}
        <Card hover padding="p-4" className="border-l-4 border-l-blue-600 relative">
          <div className="flex items-center gap-3 mb-2">
            <BlueIcon icon={<Cpu size={15} />} size="sm" />
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">Integration Hub</h4>
          </div>
          <p className="text-[10px] text-[var(--pro-azure)]/70 mb-3 leading-relaxed">
            Telebirr, CBE, Awash Bank, and third-party app connections.
          </p>
          <Btn variant="secondary" size="sm" className="w-full" onClick={() => window.location.assign('/settings/app-store')}>
            Manage Apps
          </Btn>
        </Card>

        {/* CRM Pipeline */}
        <Card hover padding="p-4" className="border-l-4 border-l-blue-600 relative">
          <div className="absolute top-3 right-3"><Sticker label="Active" variant="indigo" /></div>
          <div className="flex items-center gap-3 mb-2">
            <BlueIcon icon={<Target size={15} />} size="sm" />
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">CRM & Sales</h4>
          </div>
          <p className="text-[10px] text-[var(--pro-azure)]/70 mb-3 leading-relaxed">
            Lead tracking, deal pipeline, and automated follow-ups.
          </p>
          <Btn variant="primary" size="sm" className="w-full" onClick={() => onTab('CRM_DEALS')}>
            View Pipeline
          </Btn>
        </Card>

        {/* Billing automation */}
        <Card hover padding="p-4" className="border-l-4 border-l-blue-600 relative">
          <div className="flex items-center gap-3 mb-2">
            <BlueIcon icon={<Receipt size={15} />} size="sm" />
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">Billing & AP</h4>
          </div>
          <p className="text-[10px] text-[var(--pro-azure)]/70 mb-3 leading-relaxed">
            Automated bill extraction and recurring invoice generation.
          </p>
          <Btn variant="secondary" size="sm" className="w-full" onClick={() => onTab('BILLS')}>
            Manage Bills
          </Btn>
        </Card>
      </div>

      {/* Ethiopian tax compliance strip */}
      <div className="bg-[var(--pro-azure-50)]/60 border border-[var(--pro-azure-100)] rounded-xl p-3 flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-bold text-[var(--pro-azure-dark)] uppercase tracking-wider">Active Tax Rules:</span>
        <EthTaxBadge type="VAT" />
        <EthTaxBadge type="WHT" />
        <EthTaxBadge type="BIT" />
        <EthTaxBadge type="DRRF" />
        <span className="ml-auto text-[10px] text-[var(--pro-azure)]">Proclamation No. 1395/2025 · Regulation No. 570/2025</span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Dashboard View
// -----------------------------------------------------------------------------
const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="ovds-grid-layout cols-3 gap-lg">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="ovds-card-title text-[var(--pro-azure-dark)]">Financial Overview (P&L)</h3>
            <div className="flex items-center gap-2">
              <StatusBadge status="REVIEWED" />
              <IFRSBadge standard="15" />
            </div>
          </div>
          <div className="h-[240px] flex items-end gap-3 pb-6 border-b border-[var(--pro-azure-50)]">
            {[45, 62, 58, 81, 95, 76, 88, 105, 92, 110, 125, 142].map((v, i) => (
              <div key={i} className="flex-1 group relative">
                <div className="bg-[var(--pro-azure-100)] group-hover:bg-[var(--pro-azure-200)] transition-colors rounded-t-sm" style={{ height: `${v}%` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--pro-azure-dark)] text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                    {v}k
                  </div>
                </div>
                <div className="text-[9px] text-[var(--pro-azure-light)] mt-2 text-center font-bold">
                  {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                </div>
              </div>
            ))}
          </div>
          <div className="ovds-grid-layout cols-3 pt-4">
            <div>
              <p className="text-[10px] text-[var(--pro-azure)] font-bold uppercase">Total Revenue</p>
              <p className="text-[16px] font-bold text-[var(--pro-azure-dark)]">ETB 2,450,000</p>
            </div>
            <div>
              <p className="text-[10px] text-rose-500 font-bold uppercase">Total Expenses</p>
              <p className="text-[16px] font-bold text-rose-600">ETB 1,120,000</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--pro-azure)] font-bold uppercase">Net Profit</p>
              <p className="text-[16px] font-bold text-[var(--pro-azure)]">ETB 1,330,000</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h4 className="ovds-card-title text-[var(--pro-azure-dark)] mb-4 flex items-center gap-2">
              <PieChart size={14} className="text-[var(--pro-azure)]" />
              Tax Liability Distribution
            </h4>
            <div className="space-y-3">
              {[
                { label: 'VAT (15%)', val: '450k', pct: 60, col: 'bg-[var(--pro-azure-50)]0' },
                { label: 'WHT (3%)', val: '120k', pct: 25, col: 'bg-[var(--pro-azure)]' },
                { label: 'DRRF (1%)', val: '30k', pct: 10, col: 'bg-amber-500' },
                { label: 'Other', val: '15k', pct: 5, col: 'bg-slate-300' },
              ].map(t => (
                <div key={t.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="font-bold text-[var(--pro-azure-dark)]">{t.label}</span>
                    <span className="text-[var(--pro-azure)] font-mono">{t.val}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`${t.col} h-full`} style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[var(--pro-azure-dark)] border-[var(--pro-azure-dark)]">
            <h4 className="ovds-card-title text-green-50 mb-4">Quick Insights</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--pro-azure)] flex items-center justify-center text-green-300">
                  <ArrowUpRight size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-green-50">+12% growth</p>
                  <p className="text-[10px] text-[var(--pro-azure-light)]">Compared to last quarter</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--pro-azure)] flex items-center justify-center text-rose-400">
                  <ArrowDownRight size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-green-50">-5% expenses</p>
                  <p className="text-[10px] text-[var(--pro-azure-light)]">Optimized vendor pipeline</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="flex items-center gap-3">
          <BlueIcon icon={<Wallet size={16} />} />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Cash on Hand</p>
            <p className="text-[14px] font-bold text-[var(--pro-azure-dark)]">ETB 1.2M</p>
          </div>
        </Card>
        <Card hover className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Pending AR</p>
            <p className="text-[14px] font-bold text-[var(--pro-azure-dark)]">ETB 450k</p>
          </div>
        </Card>
        <Card hover className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <Receipt size={16} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Pending AP</p>
            <p className="text-[14px] font-bold text-[var(--pro-azure-dark)]">ETB 210k</p>
          </div>
        </Card>
        <Card hover className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
            <Percent size={16} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Effective Tax Rate</p>
            <p className="text-[14px] font-bold text-[var(--pro-azure-dark)]">18.4%</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Reports View
// -----------------------------------------------------------------------------
const ReportsView: React.FC = () => {
  const reports = [
    { id: 'PL', title: 'Profit & Loss Statement', desc: 'IFRS-compliant revenue and expense summary.', icon: <BarChart3 /> },
    { id: 'BS', title: 'Balance Sheet', desc: 'Financial position as per IAS 1 requirements.', icon: <LayoutGrid /> },
    { id: 'VAT', title: 'VAT Return (ERCA)', desc: 'Automated filing report for Proclamation No. 1341/2024.', icon: <Percent /> },
    { id: 'WHT', title: 'Withholding Tax Summary', desc: 'Detail of all taxes withheld at source.', icon: <ShieldCheck /> },
    { id: 'CF', title: 'Cash Flow Statement', desc: 'Operating, investing, and financing activities.', icon: <RefreshCw /> },
    { id: 'DRRF', title: 'DRRF Contribution Report', desc: 'Disaster Risk Reduction Fund tracking (1%).', icon: <Landmark /> },
    { id: 'BIT', title: 'Business Income Tax', desc: 'Annual tax calculation and reconciliation.', icon: <Tag /> },
    { id: 'Audit', title: 'Audit Trail', desc: 'Complete history of all financial adjustments.', icon: <ClipboardList /> },
  ];

  return (
    <div className="space-y-4">
      <Banner
        variant="info"
        title="Automated Reporting Engine"
        message="All reports are generated in real-time based on posted journal entries and harmonized with IFRS principles."
        compact
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map(r => (
          <Card key={r.id} hover padding="p-4" className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <BlueIcon icon={React.cloneElement(r.icon as React.ReactElement<{ size?: number }>, { size: 14 })} size="sm" />
              <h4 className="ovds-card-title text-[var(--pro-azure-dark)]">{r.title}</h4>
            </div>
            <p className="text-[10px] text-[var(--pro-azure)]/70 mb-4 flex-1 leading-relaxed">
              {r.desc}
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <Btn variant="secondary" size="sm" className="flex-1">Preview</Btn>
              <Btn variant="primary" size="sm" icon={<ExternalLink size={12} />}>Export</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Administration View
// -----------------------------------------------------------------------------
const AdministrationView: React.FC<{ onTab: (t: Tab) => void }> = ({ onTab }) => {
  const sections = [
    { title: 'Corporate Structure', icon: <Building2 />, tabs: ['COMPANIES', 'PARTNERS'] as Tab[], desc: 'Manage legal entities, departments, and strategic partnerships.' },
    { title: 'Tax & Compliance', icon: <Percent />, tabs: ['TAX_TYPES', 'COMPLIANCE'] as Tab[], desc: 'Configure VAT/WHT rates, DRRF rules, and review audit logs.' },
    { title: 'Ecosystem & Apps', icon: <Cpu />, tabs: ['INTEGRATIONS'] as Tab[], desc: 'Connect with Telebirr, CBE Birr, and other external services.' },
    { title: 'Human Capital', icon: <Users2 />, tabs: ['HR'] as Tab[], desc: 'Employee master data, payroll settings, and organizational chart.' },
  ];

  return (
    <div className="ovds-grid-layout cols-2">
      {sections.map(s => (
        <Card key={s.title} padding="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--pro-azure-50)] text-[var(--pro-azure)] flex items-center justify-center border border-[var(--pro-azure-100)]">
              {React.cloneElement(s.icon as React.ReactElement<{ size?: number }>, { size: 18 })}
            </div>
            <div>
              <h3 className="ovds-card-title text-[var(--pro-azure-dark)]">{s.title}</h3>
              <p className="text-[10px] text-[var(--pro-azure)]/60">{s.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {s.tabs.map(t => (
              <button
                key={t}
                onClick={() => onTab(t)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--pro-azure-50)] bg-[var(--pro-azure-50)]/20 hover:bg-[var(--pro-azure-50)] hover:border-[var(--pro-azure-100)] transition-all group"
              >
                <span className="text-[11px] font-bold text-[var(--pro-azure-dark)] uppercase tracking-tight">{t.replace('_', ' ')}</span>
                <ChevronRight size={12} className="text-[var(--pro-azure-light)] group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </Card>
      ))}
      <Card className="md:col-span-2 bg-teal-500 border-blue-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
              <Settings size={24} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white">Advanced System Administration Settings</h3>
              <p className="text-[11px] text-blue-100">Backup and restore, security protocols, and system-wide configurations.</p>
            </div>
          </div>
          <Btn variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            Configure System
          </Btn>
        </div>
      </Card>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Company expanded detail panel
// -----------------------------------------------------------------------------
const CompanyDetail: React.FC<{ company: any }> = ({ company }) => {
  const [sub, setSub] = useState<'INFO' | 'TAX' | 'BANKS' | 'USERS'>('INFO');
  const tabs = ['INFO', 'TAX', 'BANKS', 'USERS'] as const;
  return (
    <div className="bg-white rounded-xl border border-[var(--pro-azure-100)] overflow-hidden shadow-sm">
      <div className="flex gap-0 border-b border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)]/40 px-4">
        {tabs.map(t => (
          <button key={t} onClick={() => setSub(t)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
              sub === t ? 'border-[var(--pro-azure)] text-[var(--pro-azure-dark)]' : 'border-transparent text-[var(--pro-azure-light)] hover:text-[var(--pro-azure)]'
            }`}>{t}</button>
        ))}
      </div>
      <div className="p-4">
        {sub === 'INFO' && (
          <div className="ovds-grid-layout cols-3">
            {[
              { label: 'Company Name', value: company.name },
              { label: 'TIN / Tax ID', value: company.tin || company.taxId || '—' },
              { label: 'Type', value: company.type || '—' },
              { label: 'Environment', value: company.environment || 'PRODUCTION' },
              { label: 'Employees', value: company._count?.employee ?? '—' },
              { label: 'Departments', value: company._count?.department ?? '—' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] font-bold text-[var(--pro-azure)] uppercase tracking-wider mb-0.5">{f.label}</p>
                <p className="text-[12px] font-semibold text-[var(--pro-azure-dark)]">{f.value}</p>
              </div>
            ))}
          </div>
        )}
        {sub === 'TAX' && (
          <div className="space-y-3">
            <p className="text-[11px] text-[var(--pro-azure)]">Ethiopian tax obligations for this entity:</p>
            <div className="flex flex-wrap gap-2">
              <EthTaxBadge type="VAT" /><EthTaxBadge type="WHT" /><EthTaxBadge type="BIT" /><EthTaxBadge type="DRRF" />
            </div>
            <p className="ovds-caption">VAT threshold: ETB 2,000,000/year · Filing: 30th of following month</p>
          </div>
        )}
        {sub === 'BANKS' && (
          <EmptyState message="No bank accounts linked" desc="Link a bank account from the Banks tab." compact />
        )}
        {sub === 'USERS' && (
          <EmptyState message="No users assigned" desc="Assign users to this company from Settings → Users." compact />
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Per-tab modal form content
// -----------------------------------------------------------------------------
interface FormProps {
  data: Record<string, any>;
  set: (field: string, value: any) => void;
}

const ItemForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Item Name" required>
        <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Office Chair" />
      </FormField>
      <FormField label="Item Code / SKU">
        <Input value={data.code || ''} onChange={e => set('code', e.target.value)} placeholder="Auto-generated if blank" />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Sale Price (ETB)" required>
        <Input type="number" min="0" step="0.01" value={data.salePrice ?? ''} onChange={e => set('salePrice', parseFloat(e.target.value) || 0)} />
      </FormField>
      <FormField label="Cost Price (ETB)">
        <Input type="number" min="0" step="0.01" value={data.costPrice ?? ''} onChange={e => set('costPrice', parseFloat(e.target.value) || 0)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Item Type">
        <Select value={data.itemType || 'PRODUCT'} onChange={e => set('itemType', e)}>
          <option value="PRODUCT">Product</option>
          <option value="SERVICE">Service</option>
          <option value="DIGITAL">Digital</option>
          <option value="BUNDLE">Bundle</option>
        </Select>
      </FormField>
      <FormField label="VAT Rate (%)">
        <Input type="number" min="0" max="100" step="0.5" value={data.vatRate ?? 15} onChange={e => set('vatRate', parseFloat(e.target.value) || 0)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Stock Quantity">
        <Input type="number" min="0" value={data.stock ?? 0} onChange={e => set('stock', parseInt(e.target.value) || 0)} />
      </FormField>
      <FormField label="Unit">
        <Select value={data.unit || 'UNIT'} onChange={e => set('unit', e)}>
          <option value="UNIT">Unit</option>
          <option value="KG">Kilogram</option>
          <option value="LITRE">Litre</option>
          <option value="METRE">Metre</option>
          <option value="BOX">Box</option>
          <option value="HOUR">Hour</option>
        </Select>
      </FormField>
    </div>
    <FormField label="Category">
      <Input value={data.category || ''} onChange={e => set('category', e)} placeholder="e.g. Electronics, Furniture" />
    </FormField>
    <FormField label="Description">
      <Textarea value={data.description || ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Optional item description" />
    </FormField>
  </>
);

const ContactForm: React.FC<FormProps & { isVendor?: boolean }> = ({ data, set, isVendor }) => (
  <>
    <FormField label={isVendor ? 'Vendor / Supplier Name' : 'Customer Name'} required>
      <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder={isVendor ? 'e.g. Addis Supplies PLC' : 'e.g. Abebe Kebede'} />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Email">
        <Input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} placeholder="contact@example.com" />
      </FormField>
      <FormField label="Phone">
        <Input type="tel" value={data.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+251 9XX XXX XXX" />
      </FormField>
    </div>
    <FormField label="Address">
      <Input value={data.address || ''} onChange={e => set('address', e.target.value)} placeholder="Addis Ababa, Ethiopia" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="TIN (10 digits)">
        <Input value={data.tin || ''} onChange={e => set('tin', e.target.value)} placeholder="0000000000" maxLength={10} />
      </FormField>
      <FormField label="VAT Number">
        <Input value={data.vatNumber || ''} onChange={e => set('vatNumber', e.target.value)} placeholder="0000000000VAT" />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Payment Terms">
        <Select value={data.paymentTerms || 'NET_30'} onChange={e => set('paymentTerms', e)}>
          <option value="IMMEDIATE">Immediate</option>
          <option value="NET_7">Net 7</option>
          <option value="NET_15">Net 15</option>
          <option value="NET_30">Net 30</option>
          <option value="NET_60">Net 60</option>
          <option value="NET_90">Net 90</option>
        </Select>
      </FormField>
      <FormField label="Currency">
        <Select value={data.paymentCurrency || 'ETB'} onChange={e => set('paymentCurrency', e)}>
          <option value="ETB">ETB — Ethiopian Birr</option>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
        </Select>
      </FormField>
    </div>
    {!isVendor && (
      <>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="KYC Status">
            <Select value={data.kycStatus || 'PENDING'} onChange={e => set('kycStatus', e)}>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </FormField>
          <FormField label="Risk Level">
            <Select value={data.riskLevel || 'LOW'} onChange={e => set('riskLevel', e)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Credit Limit (ETB)">
          <Input type="number" min="0" value={data.creditLimit ?? ''} onChange={e => set('creditLimit', parseFloat(e.target.value) || 0)} placeholder="0 = unlimited" />
        </FormField>
      </>
    )}
    <FormField label="Notes">
      <Textarea value={data.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Internal notes…" />
    </FormField>
  </>
);

const BankForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <FormField label="Account Name" required>
      <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. CBE Operating Account" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Bank Name" required>
        <Select value={data.bankName || ''} onChange={e => set('bankName', e)}>
          <option value="">Select bank…</option>
          <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
          <option value="Awash Bank">Awash Bank</option>
          <option value="Dashen Bank">Dashen Bank</option>
          <option value="Bank of Abyssinia">Bank of Abyssinia</option>
          <option value="Telebirr">Telebirr (Ethio Telecom)</option>
          <option value="Amhara Bank">Amhara Bank</option>
          <option value="Wegagen Bank">Wegagen Bank</option>
          <option value="NIB Bank">NIB International Bank</option>
          <option value="Oromia Bank">Oromia Bank</option>
          <option value="Zemen Bank">Zemen Bank</option>
          <option value="Berhan Bank">Berhan Bank</option>
          <option value="Bunna Bank">Bunna International Bank</option>
          <option value="Enat Bank">Enat Bank</option>
          <option value="Lion Bank">Lion International Bank</option>
          <option value="Tsedey Bank">Tsedey Bank</option>
          <option value="Other">Other</option>
        </Select>
      </FormField>
      <FormField label="Account Number" required>
        <Input value={data.accountNumber || ''} onChange={e => set('accountNumber', e.target.value)} placeholder="1000XXXXXXXXXX" />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Opening Balance (ETB)">
        <Input type="number" min="0" step="0.01" value={data.openingBalance ?? 0} onChange={e => set('openingBalance', parseFloat(e.target.value) || 0)} />
      </FormField>
      <FormField label="Currency">
        <Select value={data.currency || 'ETB'} onChange={e => set('currency', e)}>
          <option value="ETB">ETB</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </Select>
      </FormField>
    </div>
    <FormField label="SWIFT / BIC Code">
      <Input value={data.swiftCode || ''} onChange={e => set('swiftCode', e.target.value)} placeholder="e.g. CBETETAA" />
    </FormField>
    <FormField label="Branch">
      <Input value={data.branch || ''} onChange={e => set('branch', e.target.value)} placeholder="e.g. Bole Branch" />
    </FormField>
  </>
);

const TaxTypeForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <FormField label="Tax Name" required>
      <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard VAT" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Tax Type" required>
        <Select value={data.type || 'VAT'} onChange={e => set('type', e)}>
          <option value="VAT">VAT (Value Added Tax)</option>
          <option value="WHT">WHT (Withholding Tax)</option>
          <option value="BIT">BIT (Business Income Tax)</option>
          <option value="TOT">TOT (Turnover Tax)</option>
          <option value="DRRF">DRRF (Disaster Risk Reduction Fund)</option>
          <option value="PENSION">Pension Contribution</option>
          <option value="CUSTOM">Custom</option>
        </Select>
      </FormField>
      <FormField label="Rate (%)" required>
        <Input type="number" min="0" max="100" step="0.01" value={data.rate != null ? (Number(data.rate) > 1 ? data.rate : Number(data.rate) * 100) : ''} onChange={e => set('rate', parseFloat(e.target.value) / 100)} placeholder="e.g. 15 for 15%" />
      </FormField>
    </div>
    <FormField label="Description">
      <Textarea value={data.description || ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Proclamation reference or notes…" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Applies To">
        <Select value={data.appliesTo || 'ALL'} onChange={e => set('appliesTo', e)}>
          <option value="ALL">All Transactions</option>
          <option value="GOODS">Goods Only</option>
          <option value="SERVICES">Services Only</option>
          <option value="IMPORTS">Imports</option>
        </Select>
      </FormField>
      <FormField label="Compound Tax">
        <Select value={data.isCompound ? 'true' : 'false'} onChange={e => set('isCompound', e === 'true')}>
          <option value="false">No</option>
          <option value="true">Yes (applied on top of other taxes)</option>
        </Select>
      </FormField>
    </div>
  </>
);

const CompanyForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <FormField label="Company Name" required>
      <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Addis Trading PLC" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Company Type" required>
        <Select value={data.type || 'SMALL_BUSINESS'} onChange={e => set('type', e)}>
          <option value="SMALL_BUSINESS">Small Business</option>
          <option value="MEDIUM_ENTERPRISE">Medium Enterprise</option>
          <option value="LARGE_ENTERPRISE">Large Enterprise</option>
          <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
          <option value="PARTNERSHIP">Partnership</option>
          <option value="NGO">NGO / Non-Profit</option>
          <option value="GOVERNMENT">Government Entity</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="MANUFACTURING">Manufacturing</option>
          <option value="RETAIL">Retail</option>
          <option value="HOSPITALITY">Hospitality</option>
          <option value="HEALTHCARE">Healthcare</option>
          <option value="EDUCATION">Education</option>
          <option value="CONSTRUCTION">Construction</option>
          <option value="AGRICULTURE">Agriculture</option>
          <option value="TECHNOLOGY">Technology</option>
          <option value="FINANCIAL_SERVICES">Financial Services</option>
          <option value="TRANSPORT">Transport & Logistics</option>
        </Select>
      </FormField>
      <FormField label="Environment">
        <Select value={data.environment || 'PRODUCTION'} onChange={e => set('environment', e)}>
          <option value="PRODUCTION">Production</option>
          <option value="SANDBOX">Sandbox / Test</option>
        </Select>
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="TIN (10 digits)">
        <Input value={data.tin || ''} onChange={e => set('tin', e.target.value)} placeholder="0000000000" maxLength={10} />
      </FormField>
      <FormField label="VAT Number">
        <Input value={data.vatNumber || ''} onChange={e => set('vatNumber', e.target.value)} placeholder="0000000000VAT" />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Phone">
        <Input type="tel" value={data.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+251 11 XXX XXXX" />
      </FormField>
      <FormField label="Email">
        <Input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} placeholder="info@company.et" />
      </FormField>
    </div>
    <FormField label="Address">
      <Input value={data.address || ''} onChange={e => set('address', e.target.value)} placeholder="Addis Ababa, Ethiopia" />
    </FormField>
    <FormField label="Auto-Update Settings">
      <Select value={data.autoUpdate ? 'true' : 'false'} onChange={e => set('autoUpdate', e === 'true')}>
        <option value="false">Manual</option>
        <option value="true">Auto-sync enabled</option>
      </Select>
    </FormField>
  </>
);

const PartnerForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <FormField label="Partner / Organization Name" required>
      <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Ethio Telecom" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Partnership Type">
        <Select value={data.partnershipType || 'JOINT_VENTURE'} onChange={e => set('partnershipType', e)}>
          <option value="JOINT_VENTURE">Joint Venture</option>
          <option value="CONSORTIUM">Consortium</option>
          <option value="FRANCHISE">Franchise</option>
          <option value="DISTRIBUTION">Distribution</option>
          <option value="REFERRAL">Referral</option>
          <option value="STRATEGIC">Strategic Alliance</option>
          <option value="SUPPLIER">Supplier Partnership</option>
        </Select>
      </FormField>
      <FormField label="Status">
        <Select value={data.status || 'ACTIVE'} onChange={e => set('status', e)}>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TERMINATED">Terminated</option>
        </Select>
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="TIN Number">
        <Input value={data.tinNumber || ''} onChange={e => set('tinNumber', e.target.value)} placeholder="0000000000" maxLength={10} />
      </FormField>
      <FormField label="License Number">
        <Input value={data.licenseNumber || ''} onChange={e => set('licenseNumber', e.target.value)} placeholder="Trade license #" />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Email">
        <Input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} />
      </FormField>
      <FormField label="Phone">
        <Input type="tel" value={data.phone || ''} onChange={e => set('phone', e.target.value)} />
      </FormField>
    </div>
    <FormField label="Revenue Share (%)">
      <Input type="number" min="0" max="100" step="0.1" value={data.revenueSharePct ?? ''} onChange={e => set('revenueSharePct', parseFloat(e.target.value) || 0)} placeholder="e.g. 30" />
    </FormField>
    <FormField label="Notes">
      <Textarea value={data.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
    </FormField>
  </>
);

const IntegrationForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <FormField label="App / Integration Name" required>
      <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Telebirr Payment Gateway" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Provider">
        <Select value={data.provider || ''} onChange={e => set('provider', e)}>
          <option value="">Select provider…</option>
          <option value="Telebirr">Telebirr</option>
          <option value="CBE">CBE Birr</option>
          <option value="Awash Bank">Awash Bank</option>
          <option value="Dashen Bank">Dashen Bank</option>
          <option value="Zoho">Zoho Books</option>
          <option value="QuickBooks">QuickBooks</option>
          <option value="Xero">Xero</option>
          <option value="Stripe">Stripe</option>
          <option value="MoR e-Tax">MoR e-Tax Portal</option>
          <option value="NBE">NBE Payment Gateway</option>
          <option value="Custom">Custom / Other</option>
        </Select>
      </FormField>
      <FormField label="Status">
        <Select value={data.status || 'ACTIVE'} onChange={e => set('status', e)}>
          <option value="ACTIVE">Active / Connected</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending Setup</option>
          <option value="ERROR">Error</option>
        </Select>
      </FormField>
    </div>
    <FormField label="Webhook / Callback URL">
      <Input type="url" value={data.webhookUrl || ''} onChange={e => set('webhookUrl', e.target.value)} placeholder="https://…" />
    </FormField>
    <FormField label="API Key / Client ID">
      <Input value={data.apiKey || ''} onChange={e => set('apiKey', e.target.value)} placeholder="Stored encrypted" />
    </FormField>
    <FormField label="Description">
      <Textarea value={data.description || ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="What this integration does…" />
    </FormField>
  </>
);

const CrmContactForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <FormField label="Contact Name" required>
      <Input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Dawit Lema" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Type">
        <Select value={data.type || 'PERSON'} onChange={e => set('type', e)}>
          <option value="PERSON">Person</option>
          <option value="COMPANY">Company</option>
        </Select>
      </FormField>
      <FormField label="Email">
        <Input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Phone">
        <Input type="tel" value={data.phone || ''} onChange={e => set('phone', e.target.value)} />
      </FormField>
      <FormField label="Job Title">
        <Input value={data.jobTitle || ''} onChange={e => set('jobTitle', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Risk Level">
        <Select value={data.riskLevel || 'MEDIUM'} onChange={e => set('riskLevel', e)}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
      </FormField>
      <FormField label="Status">
        <Select value={data.status || 'ACTIVE'} onChange={e => set('status', e)}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BLOCKED">Blocked</option>
        </Select>
      </FormField>
    </div>
  </>
);

const CrmDealForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <FormField label="Deal Title" required>
      <Input value={data.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. ERP Implementation Project" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Customer Name" required>
        <Input value={data.customerName || ''} onChange={e => set('customerName', e.target.value)} />
      </FormField>
      <FormField label="Value (ETB)">
        <Input type="number" value={data.value ?? 0} onChange={e => set('value', parseFloat(e.target.value))} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Stage">
        <Select value={data.stage || 'LEAD'} onChange={e => set('stage', e)}>
          <option value="LEAD">Lead</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="PROPOSAL">Proposal</option>
          <option value="NEGOTIATION">Negotiation</option>
          <option value="CLOSED_WON">Closed Won</option>
          <option value="CLOSED_LOST">Closed Lost</option>
        </Select>
      </FormField>
      <FormField label="Probability (%)">
        <Input type="number" min="0" max="100" value={data.probability ?? 10} onChange={e => set('probability', parseInt(e.target.value))} />
      </FormField>
    </div>
    <FormField label="Expected Close Date">
      <Input type="date" value={data.expectedCloseDate ? new Date(data.expectedCloseDate).toISOString().split('T')[0] : ''} onChange={e => set('expectedCloseDate', e.target.value)} />
    </FormField>
  </>
);

const ActivityForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <FormField label="Activity Summary" required>
      <Input value={data.summary || data.description || ''} onChange={e => set('description', e.target.value)} placeholder="e.g. Follow-up call" />
    </FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Type">
        <Select value={data.type || 'CALL'} onChange={e => set('type', e)}>
          <option value="CALL">Call</option>
          <option value="EMAIL">Email</option>
          <option value="MEETING">Meeting</option>
          <option value="TASK">Task</option>
          <option value="NOTE">Note</option>
        </Select>
      </FormField>
      <FormField label="Status">
        <Select value={data.status || 'PENDING'} onChange={e => set('status', e)}>
          <option value="PENDING">Pending</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </FormField>
    </div>
    <FormField label="Due Date">
      <Input type="datetime-local" value={data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : ''} onChange={e => set('dueDate', e.target.value)} />
    </FormField>
  </>
);

const InvoiceForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Invoice Number" required>
        <Input value={data.invoiceNumber || ''} onChange={e => set('invoiceNumber', e.target.value)} placeholder="INV-0001" />
      </FormField>
      <FormField label="Customer Name" required>
        <Input value={data.customerName || ''} onChange={e => set('customerName', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Invoice Date" required>
        <Input type="date" value={data.invoiceDate ? new Date(data.invoiceDate).toISOString().split('T')[0] : ''} onChange={e => set('invoiceDate', e.target.value)} />
      </FormField>
      <FormField label="Due Date">
        <Input type="date" value={data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : ''} onChange={e => set('dueDate', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Total Amount (ETB)" required>
        <Input type="number" step="0.01" value={data.totalAmount ?? 0} onChange={e => set('totalAmount', parseFloat(e.target.value))} />
      </FormField>
      <FormField label="Status">
        <Select value={data.status || 'DRAFT'} onChange={e => set('status', e)}>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </FormField>
    </div>
    <FormField label="Notes">
      <Textarea value={data.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
    </FormField>
  </>
);

const BillForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Bill Number" required>
        <Input value={data.billNumber || ''} onChange={e => set('billNumber', e.target.value)} placeholder="BILL-0001" />
      </FormField>
      <FormField label="Vendor Name" required>
        <Input value={data.vendorName || ''} onChange={e => set('vendorName', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Bill Date" required>
        <Input type="date" value={data.billDate ? new Date(data.billDate).toISOString().split('T')[0] : ''} onChange={e => set('billDate', e.target.value)} />
      </FormField>
      <FormField label="Due Date">
        <Input type="date" value={data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : ''} onChange={e => set('dueDate', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Total Amount (ETB)" required>
        <Input type="number" step="0.01" value={data.totalAmount ?? 0} onChange={e => set('totalAmount', parseFloat(e.target.value))} />
      </FormField>
      <FormField label="Status">
        <Select value={data.status || 'DRAFT'} onChange={e => set('status', e)}>
          <option value="DRAFT">Draft</option>
          <option value="RECEIVED">Received</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </Select>
      </FormField>
    </div>
    <FormField label="Notes">
      <Textarea value={data.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
    </FormField>
  </>
);

const EmployeeForm: React.FC<FormProps> = ({ data, set }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="First Name" required>
        <Input value={data.firstName || ''} onChange={e => set('firstName', e.target.value)} />
      </FormField>
      <FormField label="Last Name" required>
        <Input value={data.lastName || ''} onChange={e => set('lastName', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Employee ID" required>
        <Input value={data.employeeId || ''} onChange={e => set('employeeId', e.target.value)} />
      </FormField>
      <FormField label="Email">
        <Input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Basic Salary (ETB)">
        <Input type="number" value={data.baseSalary || ''} onChange={e => set('baseSalary', parseFloat(e.target.value))} />
      </FormField>
      <FormField label="Department ID">
        <Input value={data.departmentId || ''} onChange={e => set('departmentId', e.target.value)} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Bank Name">
        <Input value={data.bankName || ''} onChange={e => set('bankName', e)} />
      </FormField>
      <FormField label="Account Number">
        <Input value={data.accountNumber || ''} onChange={e => set('accountNumber', e.target.value)} />
      </FormField>
    </div>
  </>
);

// -----------------------------------------------------------------------------
// Column definitions per tab
// -----------------------------------------------------------------------------
const COLUMNS: Record<string, any[]> = {
  ITEMS: [
    { key: 'name',      label: 'Item Name', render: (r: any) => (
      <div className="flex items-center gap-2">
        <BlueIcon icon={<Package size={11} />} size="sm" />
        <span className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.name}</span>
      </div>
    )},
    { key: 'code',      label: 'Code / SKU', render: (r: any) => <span className="font-mono text-[11px] text-slate-500">{r.code || '—'}</span> },
    { key: 'itemType',  label: 'Type',    render: (r: any) => <StatusBadge status={r.itemType || 'PRODUCT'} /> },
    { key: 'salePrice', label: 'Sale Price', align: 'right' as const, render: (r: any) => <Amount value={r.salePrice} /> },
    { key: 'stock',     label: 'Stock',   align: 'right' as const, render: (r: any) => (
      <span className={`font-bold text-[12px] ${(r.stock ?? 0) <= (r.reorderLevel ?? 5) ? 'text-rose-600' : 'text-[var(--pro-azure-dark)]'}`}>
        {r.stock ?? 0}
      </span>
    )},
    { key: 'vatRate',   label: 'VAT',     render: (_r: any) => <EthTaxBadge type="VAT" /> },
  ],
  CUSTOMERS: [
    { key: 'name',  label: 'Customer', render: (r: any) => (
      <div>
        <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.name}</p>
        {r.email && <p className="ovds-caption">{r.email}</p>}
      </div>
    )},
    { key: 'phone',      label: 'Phone',  render: (r: any) => <span className="text-[11px]">{r.phone || '—'}</span> },
    { key: 'tin',        label: 'TIN',    render: (r: any) => <span className="font-mono text-[11px] text-slate-500">{r.tin || '—'}</span> },
    { key: 'kycStatus',  label: 'KYC',    render: (r: any) => <StatusBadge status={r.kycStatus || 'PENDING'} /> },
    { key: 'riskLevel',  label: 'Risk',   render: (r: any) => {
      const v = r.riskLevel || 'LOW';
      const cls = v === 'HIGH' ? 'text-rose-600 bg-rose-50' : v === 'MEDIUM' ? 'text-amber-600 bg-amber-50' : 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]';
      return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{v}</span>;
    }},
    { key: 'paymentTerms', label: 'Terms', render: (r: any) => <span className="text-[11px] text-slate-500">{r.paymentTerms || '—'}</span> },
  ],
  VENDORS: [
    { key: 'name',  label: 'Vendor', render: (r: any) => (
      <div>
        <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.name}</p>
        {r.email && <p className="ovds-caption">{r.email}</p>}
      </div>
    )},
    { key: 'phone',      label: 'Phone',  render: (r: any) => <span className="text-[11px]">{r.phone || '—'}</span> },
    { key: 'tin',        label: 'TIN',    render: (r: any) => <span className="font-mono text-[11px] text-slate-500">{r.tin || '—'}</span> },
    { key: 'paymentTerms', label: 'Terms', render: (r: any) => <span className="text-[11px] text-slate-500">{r.paymentTerms || '—'}</span> },
    { key: 'totalBilled', label: 'Total Billed', align: 'right' as const, render: (r: any) => <Amount value={r.totalBilled ?? 0} /> },
  ],
  BANKS: [
    { key: 'name', label: 'Account Name', render: (r: any) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] flex items-center justify-center text-[var(--pro-azure)] shrink-0">
          <Landmark size={11} />
        </div>
        <div>
          <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.name}</p>
          <p className="ovds-caption">{r.bankName || '—'}</p>
        </div>
      </div>
    )},
    { key: 'accountNumber', label: 'Account #', render: (r: any) => <span className="font-mono text-[11px] text-slate-500">{r.accountNumber}</span> },
    { key: 'currency',      label: 'Currency',  render: (r: any) => <span className="text-[11px] font-bold text-[var(--pro-azure-dark)]">{r.currency || r.currencyCode || 'ETB'}</span> },
    { key: 'balance',       label: 'Balance',   align: 'right' as const, render: (r: any) => <Amount value={r.balance ?? r.computedBalance ?? 0} /> },
  ],
  TAX_TYPES: [
    { key: 'name', label: 'Tax Name', render: (r: any) => (
      <div>
        <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.name}</p>
        {r.description && <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{r.description}</p>}
      </div>
    )},
    { key: 'type', label: 'Type', render: (r: any) => <EthTaxBadge type={r.type || 'VAT'} /> },
    { key: 'rate', label: 'Rate', align: 'right' as const, render: (r: any) => {
      const pct = Number(r.rate) <= 1 ? Number(r.rate) * 100 : Number(r.rate);
      return <span className="font-bold text-[var(--pro-azure-dark)] text-[12px]">{pct.toFixed(1)}%</span>;
    }},
    { key: 'appliesTo', label: 'Applies To', render: (r: any) => <span className="text-[11px] text-slate-500">{r.appliesTo || 'ALL'}</span> },
    { key: 'isActive',  label: 'Active',     render: (r: any) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} /> },
  ],
  PARTNERS: [
    { key: 'name', label: 'Partner', render: (r: any) => (
      <div>
        <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.name}</p>
        {r.partnershipType && <p className="ovds-caption">{r.partnershipType}</p>}
      </div>
    )},
    { key: 'tinNumber',    label: 'TIN',     render: (r: any) => <span className="font-mono text-[11px] text-slate-500">{r.tinNumber || '—'}</span> },
    { key: 'licenseNumber',label: 'License', render: (r: any) => <span className="text-[11px] text-slate-500">{r.licenseNumber || '—'}</span> },
    { key: 'revenueSharePct', label: 'Rev Share', align: 'right' as const, render: (r: any) => r.revenueSharePct ? <span className="font-bold text-[var(--pro-azure-dark)]">{r.revenueSharePct}%</span> : <span className="text-slate-400">—</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'ACTIVE'} /> },
  ],
  INTEGRATIONS: [
    { key: 'name', label: 'App / Integration', render: (r: any) => (
      <div className="flex items-center gap-2">
        <BlueIcon icon={<Cpu size={11} />} size="sm" />
        <div>
          <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.name}</p>
          {r.provider && <p className="ovds-caption">{r.provider}</p>}
        </div>
      </div>
    )},
    { key: 'provider',   label: 'Provider', render: (r: any) => <span className="text-[11px] text-slate-500">{r.provider || '—'}</span> },
    { key: 'status',     label: 'Status',   render: (r: any) => <StatusBadge status={r.status || 'ACTIVE'} /> },
    { key: 'webhookUrl', label: 'Webhook',  render: (r: any) => r.webhookUrl
      ? <a href={r.webhookUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[var(--pro-azure)] hover:underline flex items-center gap-1"><ExternalLink size={10} />Configured</a>
      : <span className="text-[11px] text-slate-400">—</span>
    },
  ],
  HR: [
    { key: 'name', label: 'Employee', render: (r: any) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
          {(r.firstName?.[0] || '') + (r.lastName?.[0] || '')}
        </div>
        <div>
          <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.firstName} {r.lastName}</p>
          <p className="ovds-caption">{r.employeeId || '—'}</p>
        </div>
      </div>
    )},
    { key: 'department', label: 'Department', render: (r: any) => <span className="text-[11px]">{r.department?.name || '—'}</span> },
    { key: 'designation', label: 'Designation', render: (r: any) => <span className="text-[11px] text-slate-500">{r.designation || '—'}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'ACTIVE'} /> },
    { key: 'salary', label: 'Basic Salary', align: 'right' as const, render: (r: any) => <Amount value={r.baseSalary || 0} /> },
  ],
  COMPLIANCE: [
    { key: 'action', label: 'Action', render: (r: any) => (
      <div className="flex items-center gap-2">
        <BlueIcon icon={<ShieldCheck size={11} />} size="sm" />
        <span className="font-semibold text-[var(--pro-azure-dark)] text-[11px] uppercase tracking-tight">{r.action}</span>
      </div>
    )},
    { key: 'user', label: 'User', render: (r: any) => <span className="text-[11px]">{r.user?.name || r.userId}</span> },
    { key: 'details', label: 'Details', render: (r: any) => <span className="text-[11px] text-slate-500 truncate max-w-[300px]">{r.details || '—'}</span> },
    { key: 'createdAt', label: 'Timestamp', render: (r: any) => <span className="ovds-caption">{new Date(r.createdAt).toLocaleString()}</span> },
  ],
  CRM_CONTACTS: [
    { key: 'name', label: 'Contact', render: (r: any) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--pro-azure-50)] flex items-center justify-center text-[var(--pro-azure)] font-bold text-[10px]">
          {r.name?.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div>
          <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.name}</p>
          <p className="ovds-caption">{r.email}</p>
        </div>
      </div>
    )},
    { key: 'type', label: 'Type', render: (r: any) => <span className="text-[11px] uppercase">{r.type}</span> },
    { key: 'phone', label: 'Phone', render: (r: any) => <span className="text-[11px] text-slate-500">{r.phone || '—'}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'ACTIVE'} /> },
  ],
  CRM_DEALS: [
    { key: 'title', label: 'Deal / Project', render: (r: any) => (
      <div className="flex items-center gap-2">
        <BlueIcon icon={<Target size={12} />} size="sm" />
        <div>
          <p className="font-semibold text-[var(--pro-azure-dark)] text-[12px]">{r.title}</p>
          <p className="ovds-caption">{r.customerName}</p>
        </div>
      </div>
    )},
    { key: 'value', label: 'Value', align: 'right' as const, render: (r: any) => <Amount value={r.value || 0} /> },
    { key: 'stage', label: 'Stage', render: (r: any) => <StatusBadge status={r.stage || 'LEAD'} /> },
    { key: 'probability', label: 'Prob.', render: (r: any) => <span className="text-[11px] font-bold">{r.probability}%</span> },
  ],
  CRM_ACTIVITIES: [
    { key: 'description', label: 'Activity', render: (r: any) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-500">
          <ClipboardList size={11} />
        </div>
        <span className="text-[11px] font-medium text-[var(--pro-azure-dark)]">{r.description || r.summary}</span>
      </div>
    )},
    { key: 'type', label: 'Type', render: (r: any) => <span className="text-[10px] font-bold uppercase text-slate-400">{r.type}</span> },
    { key: 'dueDate', label: 'Due Date', render: (r: any) => <span className="ovds-caption">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'PENDING'} /> },
  ],
  INVOICES: [
    { key: 'invoiceNumber', label: 'Invoice', render: (r: any) => (
      <div className="flex items-center gap-2">
        <BlueIcon icon={<FileText size={12} />} size="sm" />
        <div>
          <p className="font-bold text-[var(--pro-azure-dark)] text-[11px]">{r.invoiceNumber}</p>
          <p className="ovds-caption">{r.customerName}</p>
        </div>
      </div>
    )},
    { key: 'invoiceDate', label: 'Date', render: (r: any) => <span className="text-[11px] text-slate-500">{new Date(r.invoiceDate).toLocaleDateString()}</span> },
    { key: 'totalAmount', label: 'Amount', align: 'right' as const, render: (r: any) => <Amount value={r.totalAmount || 0} /> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'DRAFT'} /> },
  ],
  BILLS: [
    { key: 'billNumber', label: 'Bill', render: (r: any) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
          <Receipt size={12} />
        </div>
        <div>
          <p className="font-bold text-[var(--pro-azure-dark)] text-[11px]">{r.billNumber}</p>
          <p className="ovds-caption">{r.vendorName}</p>
        </div>
      </div>
    )},
    { key: 'billDate', label: 'Date', render: (r: any) => <span className="text-[11px] text-slate-500">{new Date(r.billDate).toLocaleDateString()}</span> },
    { key: 'totalAmount', label: 'Amount', align: 'right' as const, render: (r: any) => <Amount value={r.totalAmount || 0} /> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'DRAFT'} /> },
  ],
};

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
const SinglePageAccounting: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'PIPELINE',
  );
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>({ open: false, type: 'CREATE', data: {} });
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  // Sync URL <-> tab
  useEffect(() => {
    const t = searchParams.get('tab') as Tab;
    if (t && t !== activeTab) setActiveTab(t);
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (searchParams.get('tab') !== activeTab)
      setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // -- CRUD hooks --------------------------------------------------------------
  const items        = useApiCrud<any>({ endpoint: '/ovds/items',        companyId: selectedCompanyId });
  const customers    = useApiCrud<any>({ endpoint: '/ovds/customers',    companyId: selectedCompanyId });
  const vendors      = useApiCrud<any>({ endpoint: '/ovds/vendors',      companyId: selectedCompanyId });
  const banks        = useApiCrud<any>({ endpoint: '/ovds/bank-accounts',companyId: selectedCompanyId });
  const taxRates     = useApiCrud<any>({ endpoint: '/ovds/tax-rates' });
  const companies    = useApiCrud<any>({ endpoint: '/ovds/companies' });
  const partnerships = useApiCrud<any>({ endpoint: '/ovds/partnerships', companyId: selectedCompanyId });
  const integrations = useApiCrud<any>({ endpoint: '/apps' });
  const employees    = useApiCrud<any>({ endpoint: '/hr/employees',         companyId: selectedCompanyId });
  const auditLogs    = useApiCrud<any>({ endpoint: '/dashboard/audit-logs',        companyId: selectedCompanyId });

  // CRM & ovds
  const crmContacts   = useApiCrud<any>({ endpoint: '/crm/contacts',      companyId: selectedCompanyId });
  const crmDeals      = useApiCrud<any>({ endpoint: '/crm/deals',         companyId: selectedCompanyId });
  const crmActivities = useApiCrud<any>({ endpoint: '/crm/activities',    companyId: selectedCompanyId });
  const invoices      = useApiCrud<any>({ endpoint: '/ovds/invoices',  companyId: selectedCompanyId });
  const bills         = useApiCrud<any>({ endpoint: '/ovds/bills',     companyId: selectedCompanyId });

  const moduleMap: Record<Tab, any> = {
    DASHBOARD:      null,
    PIPELINE:       null,
    REPORTS:        null,
    ADMINISTRATION: null,
    ITEMS:        items,
    CUSTOMERS:    customers,
    VENDORS:      vendors,
    BANKS:        banks,
    TAX_TYPES:    taxRates,
    COMPANIES:    companies,
    PARTNERS:     partnerships,
    INTEGRATIONS: integrations,
    HR:           employees,
    COMPLIANCE:   auditLogs,
    CRM_CONTACTS:   crmContacts,
    CRM_DEALS:      crmDeals,
    CRM_ACTIVITIES: crmActivities,
    INVOICES:       invoices,
    BILLS:          bills,
  };
  const current = moduleMap[activeTab];

  const refetchAll = () => {
    [items, customers, vendors, banks, taxRates, companies, partnerships, integrations, employees, auditLogs, crmContacts, crmDeals, crmActivities, invoices, bills]
      .forEach(m => m.refetch());
  };

  // -- Handlers ----------------------------------------------------------------
  const setField = (field: string, value: any) =>
    setModal(prev => ({ ...prev, data: { ...prev.data, [field]: value } }));

  const openCreate = () => setModal({ open: true, type: 'CREATE', data: { companyId: selectedCompanyId } });
  const openEdit   = (row: any) => setModal({ open: true, type: 'EDIT', data: { ...row } });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    const saved = await current.save(modal.data);
    if (saved) setModal(prev => ({ ...prev, open: false }));
  };

  const handleDelete = async (id: string) => {
    if (!current) return;
    const ok = await confirm({ title: 'Delete this record?', message: 'This cannot be undone.', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    await current.remove(id);
  };

  // -- Filtered rows ------------------------------------------------------------
  const filteredRows = useMemo(() => {
    if (!current) return [];
    const q = search.toLowerCase();
    return current.rows.filter((r: any) =>
      !q ||
      (r.name || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.tin || '').toLowerCase().includes(q) ||
      (r.code || '').toLowerCase().includes(q) ||
      (r.accountNumber || '').toLowerCase().includes(q) ||
      (r.provider || '').toLowerCase().includes(q),
    );
  }, [current, search]);

  // -- KPI strip data -----------------------------------------------------------
  const kpiItems = useMemo(() => {
    const fmt = (n: number) => n >= 1_000_000
      ? `ETB ${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000 ? `ETB ${(n / 1_000).toFixed(0)}K` : `ETB ${n.toFixed(0)}`;

    switch (activeTab) {
      case 'DASHBOARD':
        return [
          { label: 'Total Revenue', value: 'ETB 2.45M', icon: <ArrowUpRight size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]', trend: 'up' as any, trendVal: '12%' },
          { label: 'Net Profit',    value: 'ETB 1.33M', icon: <Wallet size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]', color: 'green' as any },
          { label: 'Tax Liability', value: 'ETB 615k',  icon: <Percent size={12} />, iconCls: 'bg-amber-50 text-amber-600', color: 'amber' as any },
          { label: 'Compliance',    value: '100%',      icon: <ShieldCheck size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
        ];
      case 'REPORTS':
        return [
          { label: 'Available',    value: '8 Reports',  icon: <BarChart3 size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Last Export',  value: '2h ago',    icon: <ExternalLink size={12} />, color: 'green' as any },
          { label: 'IFRS Ready',   value: 'Yes',       color: 'green' as any },
          { label: 'Tax Compliant',value: 'Yes',       color: 'green' as any },
        ];
      case 'ADMINISTRATION':
        return [
          { label: 'Active Apps',  value: integrations.total, icon: <Cpu size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Audit Alerts', value: auditLogs.total, color: 'rose' as any },
          { label: 'Companies',    value: companies.total, color: 'green' as any },
          { label: 'Partners',     value: partnerships.total, color: 'blue' as any },
        ];
      case 'ITEMS':
        return [
          { label: 'Total Items',    value: items.total,  icon: <Package size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Low Stock',      value: items.rows.filter((r: any) => (r.stock ?? 0) <= (r.reorderLevel ?? 5)).length, color: 'rose' as const, icon: <AlertCircle size={12} />, iconCls: 'bg-rose-50 text-rose-600' },
          { label: 'Services',       value: items.rows.filter((r: any) => r.itemType === 'SERVICE').length, icon: <Tag size={12} />, iconCls: 'bg-violet-50 text-violet-600' },
          { label: 'Inventory Value',value: fmt(items.rows.reduce((s: number, r: any) => s + (Number(r.salePrice) * (r.stock ?? 0)), 0)), color: 'green' as const },
        ];
      case 'CUSTOMERS':
        return [
          { label: 'Total Customers', value: customers.total, icon: <Users2 size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'KYC Verified',    value: customers.rows.filter((r: any) => r.kycStatus === 'VERIFIED').length, color: 'green' as const },
          { label: 'High Risk',       value: customers.rows.filter((r: any) => r.riskLevel === 'HIGH').length, color: 'rose' as const },
          { label: 'With TIN',        value: customers.rows.filter((r: any) => r.tin).length },
        ];
      case 'VENDORS':
        return [
          { label: 'Total Vendors',  value: vendors.total, icon: <Truck size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'With TIN',       value: vendors.rows.filter((r: any) => r.tin).length, color: 'green' as const },
          { label: 'Total Billed',   value: fmt(vendors.rows.reduce((s: number, r: any) => s + (Number(r.totalBilled) || 0), 0)), color: 'rose' as const },
          { label: 'WHT Applicable', value: vendors.rows.filter((r: any) => r.whtApplicable).length },
        ];
      case 'BANKS':
        return [
          { label: 'Accounts',     value: banks.total, icon: <Landmark size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Total Balance',value: fmt(banks.rows.reduce((s: number, r: any) => s + (Number(r.balance) || 0), 0)), color: 'green' as const },
          { label: 'ETB Accounts', value: banks.rows.filter((r: any) => (r.currency || r.currencyCode || 'ETB') === 'ETB').length },
          { label: 'USD Accounts', value: banks.rows.filter((r: any) => (r.currency || r.currencyCode) === 'USD').length },
        ];
      case 'TAX_TYPES':
        return [
          { label: 'Tax Rules',  value: taxRates.total, icon: <Percent size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'VAT Rules',  value: taxRates.rows.filter((r: any) => r.type === 'VAT').length, color: 'green' as const },
          { label: 'WHT Rules',  value: taxRates.rows.filter((r: any) => r.type === 'WHT').length },
          { label: 'Active',     value: taxRates.rows.filter((r: any) => r.isActive !== false).length, color: 'green' as const },
        ];
      case 'COMPANIES':
        return [
          { label: 'Companies',  value: companies.total, icon: <Building2 size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Production', value: companies.rows.filter((r: any) => r.environment !== 'SANDBOX').length, color: 'green' as const },
          { label: 'Sandbox',    value: companies.rows.filter((r: any) => r.environment === 'SANDBOX').length },
          { label: 'Employees',  value: companies.rows.reduce((s: number, r: any) => s + (r._count?.employee ?? 0), 0) },
        ];
      case 'PARTNERS':
        return [
          { label: 'Partners',  value: partnerships.total, icon: <Handshake size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Active',    value: partnerships.rows.filter((r: any) => r.status === 'ACTIVE').length, color: 'green' as const },
          { label: 'Pending',   value: partnerships.rows.filter((r: any) => r.status === 'PENDING').length, color: 'amber' as const },
          { label: 'With TIN',  value: partnerships.rows.filter((r: any) => r.tinNumber).length },
        ];
      case 'INTEGRATIONS':
        return [
          { label: 'Apps',       value: integrations.total, icon: <Cpu size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Connected',  value: integrations.rows.filter((r: any) => r.status === 'ACTIVE').length, color: 'green' as const },
          { label: 'Errors',     value: integrations.rows.filter((r: any) => r.status === 'ERROR').length, color: 'rose' as const },
          { label: 'Pending',    value: integrations.rows.filter((r: any) => r.status === 'PENDING').length },
        ];
      case 'HR':
        return [
          { label: 'Employees',  value: employees.total, icon: <Users2 size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Active',     value: employees.rows.filter((r: any) => r.status === 'ACTIVE').length, color: 'green' as const },
          { label: 'Departments',value: [...new Set(employees.rows.map((r: any) => r.departmentId))].length },
          { label: 'On Leave',   value: employees.rows.filter((r: any) => r.onLeave).length, color: 'amber' as const },
        ];
      case 'COMPLIANCE':
        return [
          { label: 'Audit Logs', value: auditLogs.total, icon: <ShieldCheck size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Security',   value: auditLogs.rows.filter((r: any) => r.action?.includes('AUTH')).length, color: 'green' as const },
          { label: 'Warnings',   value: auditLogs.rows.filter((r: any) => r.details?.includes('FAIL')).length, color: 'rose' as const },
          { label: 'Last 24h',   value: auditLogs.rows.filter((r: any) => new Date(r.createdAt) > new Date(Date.now() - 86400000)).length },
        ];
      case 'CRM_CONTACTS':
        return [
          { label: 'Total Contacts', value: crmContacts.total, icon: <Users2 size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Verified',       value: crmContacts.rows.filter((r: any) => r.status === 'ACTIVE').length, color: 'green' as const },
          { label: 'High Risk',      value: crmContacts.rows.filter((r: any) => r.riskLevel === 'HIGH').length, color: 'rose' as const },
          { label: 'Recent',         value: crmContacts.rows.filter((r: any) => new Date(r.createdAt) > new Date(Date.now() - 7 * 86400000)).length },
        ];
      case 'CRM_DEALS':
        return [
          { label: 'Total Deals', value: crmDeals.total, icon: <Target size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Pipeline Val',value: fmt(crmDeals.rows.filter((r: any) => !['CLOSED_WON', 'CLOSED_LOST'].includes(r.stage)).reduce((s: number, r: any) => s + (Number(r.value) || 0), 0)), color: 'green' as const },
          { label: 'Won Value',   value: fmt(crmDeals.rows.filter((r: any) => r.stage === 'CLOSED_WON').reduce((s: number, r: any) => s + (Number(r.value) || 0), 0)), color: 'green' as const },
          { label: 'Win Rate',    value: `${Math.round((crmDeals.rows.filter((r: any) => r.stage === 'CLOSED_WON').length / (crmDeals.rows.filter((r: any) => ['CLOSED_WON', 'CLOSED_LOST'].includes(r.stage)).length || 1)) * 100)}%` },
        ];
      case 'CRM_ACTIVITIES':
        return [
          { label: 'Total Activities', value: crmActivities.total, icon: <ClipboardList size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Pending',         value: crmActivities.rows.filter((r: any) => r.status === 'PENDING').length, color: 'amber' as const },
          { label: 'Done',            value: crmActivities.rows.filter((r: any) => r.status === 'DONE').length, color: 'green' as const },
          { label: 'Overdue',         value: crmActivities.rows.filter((r: any) => r.status === 'PENDING' && new Date(r.dueDate) < new Date()).length, color: 'rose' as const },
        ];
      case 'INVOICES':
        return [
          { label: 'Total Invoices', value: invoices.total, icon: <FileText size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Unpaid Amount',  value: fmt(invoices.rows.filter((r: any) => r.status !== 'PAID').reduce((s: number, r: any) => s + (Number(r.totalAmount) || 0), 0)), color: 'amber' as const },
          { label: 'Paid This Month',value: fmt(invoices.rows.filter((r: any) => r.status === 'PAID' && new Date(r.invoiceDate) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((s: number, r: any) => s + (Number(r.totalAmount) || 0), 0)), color: 'green' as const },
          { label: 'Overdue Count',  value: invoices.rows.filter((r: any) => r.status === 'OVERDUE').length, color: 'rose' as const },
        ];
      case 'BILLS':
        return [
          { label: 'Total Bills',    value: bills.total, icon: <Receipt size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Accounts Payable',value: fmt(bills.rows.filter((r: any) => r.status !== 'PAID').reduce((s: number, r: any) => s + (Number(r.totalAmount) || 0), 0)), color: 'rose' as const },
          { label: 'Paid This Month',value: fmt(bills.rows.filter((r: any) => r.status === 'PAID' && new Date(r.billDate) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((s: number, r: any) => s + (Number(r.totalAmount) || 0), 0)), color: 'green' as const },
          { label: 'Received',       value: bills.rows.filter((r: any) => r.status === 'RECEIVED').length },
        ];
      default:
        return [
          { label: 'Items',     value: items.total,        icon: <Package size={12} />,  iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
          { label: 'Customers', value: customers.total,    icon: <Users2 size={12} />,   iconCls: 'bg-violet-50 text-violet-600' },
          { label: 'Vendors',   value: vendors.total,      icon: <Truck size={12} />,    iconCls: 'bg-rose-50 text-rose-600' },
          { label: 'Banks',     value: banks.total,        icon: <Landmark size={12} />, iconCls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' },
        ];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, items, customers, vendors, banks, taxRates, companies, partnerships, integrations]);

  // -- Tab label for modal title ------------------------------------------------
  const tabLabel: Record<Tab, string> = {
    DASHBOARD: 'Dashboard', PIPELINE: 'Pipeline', ITEMS: 'Item', CUSTOMERS: 'Customer',
    VENDORS: 'Vendor', BANKS: 'Bank Account', TAX_TYPES: 'Tax Type',
    COMPANIES: 'Company', PARTNERS: 'Partner', INTEGRATIONS: 'Integration',
    HR: 'Employee', COMPLIANCE: 'Compliance Log',
    CRM_CONTACTS: 'CRM Contact', CRM_DEALS: 'CRM Deal', CRM_ACTIVITIES: 'Activity',
    INVOICES: 'Invoice', BILLS: 'Bill', REPORTS: 'Report', ADMINISTRATION: 'Administration',
  };

  // -- Render form by tab -------------------------------------------------------
  const renderForm = () => {
    switch (activeTab) {
      case 'ITEMS':        return <ItemForm        data={modal.data} set={setField} />;
      case 'CUSTOMERS':    return <ContactForm     data={modal.data} set={setField} />;
      case 'VENDORS':      return <ContactForm     data={modal.data} set={setField} isVendor />;
      case 'BANKS':        return <BankForm        data={modal.data} set={setField} />;
      case 'TAX_TYPES':    return <TaxTypeForm     data={modal.data} set={setField} />;
      case 'COMPANIES':    return <CompanyForm     data={modal.data} set={setField} />;
      case 'PARTNERS':     return <PartnerForm     data={modal.data} set={setField} />;
      case 'INTEGRATIONS': return <IntegrationForm data={modal.data} set={setField} />;
      case 'HR':           return <EmployeeForm    data={modal.data} set={setField} />;
      case 'CRM_CONTACTS': return <CrmContactForm  data={modal.data} set={setField} />;
      case 'CRM_DEALS':    return <CrmDealForm     data={modal.data} set={setField} />;
      case 'CRM_ACTIVITIES': return <ActivityForm  data={modal.data} set={setField} />;
      case 'INVOICES':     return <InvoiceForm     data={modal.data} set={setField} />;
      case 'BILLS':        return <BillForm        data={modal.data} set={setField} />;
      default: return null;
    }
  };

  const canWrite = can('ovds:write') || can('companies:write');

  return (
    <div className="min-h-full bg-white dark:bg-slate-950">
      <OvdsPageHeader
        title="Accounting Hub"
        subtitle="Master data · IFRS & Ethiopian Tax · All business types · ERP · Accounting & ovds Software · Banking & ovds · Healthcare & Pharmaceuticals · Manufacturing & Logistics"
        icon={<Activity size={16} />}
        iconBg="bg-[var(--pro-azure)]"
        badge={<IFRSBadge compliant />}
        onRefresh={refetchAll}
        tabs={[
          { id: 'DASHBOARD',    label: 'Dashboard',   icon: <LayoutGrid size={11} /> },
          { id: 'PIPELINE',     label: 'Pipeline',    icon: <RefreshCw size={11} /> },
          { id: 'INVOICES',     label: 'Invoices',    icon: <FileText size={11} />,      count: invoices.total },
          { id: 'BILLS',        label: 'Bills',       icon: <Receipt size={11} />,       count: bills.total },
          { id: 'CRM_DEALS',    label: 'Sales',       icon: <Target size={11} />,        count: crmDeals.total },
          { id: 'REPORTS',      label: 'Reports',     icon: <BarChart3 size={11} /> },
          { id: 'ITEMS',        label: 'Items',       icon: <Package size={11} />,       count: items.total },
          { id: 'CUSTOMERS',    label: 'Customers',   icon: <Users2 size={11} />,        count: customers.total },
          { id: 'VENDORS',      label: 'Vendors',     icon: <Truck size={11} />,         count: vendors.total },
          { id: 'BANKS',        label: 'Banks',       icon: <Landmark size={11} />,      count: banks.total },
          { id: 'HR',           label: 'HR',          icon: <Briefcase size={11} />,     count: employees.total },
          { id: 'ADMINISTRATION', label: 'Admin',     icon: <Settings size={11} /> },
          { id: 'COMPANIES',    label: 'Companies',   icon: <Building2 size={11} />,     count: companies.total },
          { id: 'TAX_TYPES',    label: 'Tax Rules',   icon: <Percent size={11} />,       count: taxRates.total },
          { id: 'CRM_CONTACTS', label: 'CRM',         icon: <LayoutGrid size={11} />,    count: crmContacts.total },
          { id: 'CRM_ACTIVITIES', label: 'Activities',icon: <ClipboardList size={11} />, count: crmActivities.total },
          { id: 'COMPLIANCE',   label: 'Compliance',  icon: <ShieldCheck size={11} />,   count: auditLogs.total },
          { id: 'INTEGRATIONS', label: 'Apps',        icon: <Cpu size={11} />,           count: integrations.total },
          { id: 'PARTNERS',     label: 'Partners',    icon: <Handshake size={11} />,     count: partnerships.total },
        ]}
        activeTab={activeTab}
        onTabChange={k => { setActiveTab(k as Tab); setSearch(''); }}
        actions={
          !['PIPELINE', 'DASHBOARD', 'REPORTS', 'ADMINISTRATION'].includes(activeTab) && canWrite ? (
            <Btn variant="primary" size="sm" icon={<Plus size={13} />} onClick={openCreate}>
              New {tabLabel[activeTab]}
            </Btn>
          ) : undefined
        }
      />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Quick Actions Bar */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'New Invoice', icon: <FileText size={13} />, color: 'bg-sky-500',     tab: 'INVOICES' as Tab },
            { label: 'New Bill',    icon: <Receipt size={13} />,  color: 'bg-amber-500',   tab: 'BILLS' as Tab },
            { label: 'New Deal',    icon: <Target size={13} />,   color: 'bg-[var(--pro-azure-50)]0', tab: 'CRM_DEALS' as Tab },
            { label: 'New Item',    icon: <Package size={13} />,  color: 'bg-violet-500',  tab: 'ITEMS' as Tab },
            { label: 'Add Staff',   icon: <Users2 size={13} />,   color: 'bg-rose-500',    tab: 'HR' as Tab },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => { setActiveTab(a.tab); setTimeout(openCreate, 10); }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl
                         hover:border-slate-200 hover:shadow-sm transition-all group
                         shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${a.color} group-hover:scale-110 transition-transform shrink-0`}>
                {a.icon}
              </div>
              <span className="text-[12px] font-semibold text-slate-700">{a.label}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Sticker label="System Healthy" variant="blue" />
            <Sticker label="VAT Ready" variant="indigo" />
          </div>
        </div>

        {/* IFRS compliance banner */}
        <Banner
          variant="info"
          title="IFRS & Ethiopian Tax Compliance"
          message="All master data is harmonized for IFRS 15 revenue recognition and Proclamation No. 1341/2024 VAT standards. VAT threshold: ETB 2,000,000/year."
          compact
        />

        {/* KPI strip — dynamic per tab */}
        <AppKpi cells={kpiItems.map((k: any) => ({ label: k.label, value: k.value, color: k.color, icon: k.icon }))} />

        {/* Dashboard tab */}
        {activeTab === 'DASHBOARD' && <DashboardView />}

        {/* Pipeline tab */}
        {activeTab === 'PIPELINE' && (
          <PipelineView refetch={refetchAll} companyId={selectedCompanyId} onTab={setActiveTab} />
        )}

        {/* Reports tab */}
        {activeTab === 'REPORTS' && <ReportsView />}

        {/* Administration tab */}
        {activeTab === 'ADMINISTRATION' && <AdministrationView onTab={setActiveTab} />}

        {/* All other tabs */}
        {!['PIPELINE', 'DASHBOARD', 'REPORTS', 'ADMINISTRATION'].includes(activeTab) && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder={`Search ${tabLabel[activeTab].toLowerCase()}s…`}
                className="flex-1 max-w-xs"
              />
              <span className="text-[11px] text-slate-400 ml-auto">
                {filteredRows.length} of {current?.total ?? 0} records
              </span>
            </div>

          {/* Companies — expandable card list */}
          {activeTab === 'COMPANIES' ? (
            <div className="space-y-2">
              {companies.loading && (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw size={18} className="animate-spin text-[var(--pro-azure-light)]" />
                </div>
              )}
              {!companies.loading && filteredRows.length === 0 && (
                <EmptyState
                  message="No companies found"
                  desc="Create your first company to get started."
                  action={canWrite ? { label: 'New Company', onClick: openCreate } : undefined}
                />
              )}
              {filteredRows.map((company: any) => (
                <div key={company.id}>
                  <div
                    className={`bg-white border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all hover:shadow-sm ${
                      expandedCompany === company.id
                        ? 'border-[var(--pro-azure)] ring-2 ring-[var(--pro-azure)]/10'
                        : 'border-[var(--pro-azure-100)] hover:border-[var(--pro-azure)]/40'
                    }`}
                    onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BlueIcon icon={<Building2 size={16} />} size="md" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[var(--pro-azure-dark)] truncate">{company.name}</p>
                        <p className="text-[10px] text-[var(--pro-azure)] font-mono">
                          TIN: {company.tin || company.taxId || '—'} · {company.type || 'SMALL_BUSINESS'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={company.environment === 'SANDBOX' ? 'DRAFT' : 'ACTIVE'} label={company.environment || 'PRODUCTION'} />
                      {canWrite && (
                        <div className="flex gap-1">
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(company); }}
                            className="p-1.5 rounded hover:bg-[var(--pro-azure-50)] text-[var(--pro-azure-light)] hover:text-[var(--pro-azure)] transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(company.id); }}
                            className="p-1.5 rounded hover:bg-rose-50 text-rose-300 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                      <ChevronRight
                        size={15}
                        className={`text-green-300 transition-transform duration-200 ${expandedCompany === company.id ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>
                  {expandedCompany === company.id && (
                    <div className="ml-12 mt-1 animate-in slide-in-from-top-1 duration-150">
                      <CompanyDetail company={company} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* All other tabs — standard table */
            <AppTable loading={current?.loading}>
              <thead><tr>
                {(COLUMNS[activeTab] ?? []).map((c: any) => (
                  <AppTh key={c.key} align={c.align}>{c.label}</AppTh>
                ))}
                {canWrite && <AppTh align="right" width="80px">Actions</AppTh>}
              </tr></thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={(COLUMNS[activeTab] ?? []).length + 1} className="py-10 text-center text-[12px] text-slate-400">
                    No {tabLabel[activeTab].toLowerCase()}s found
                  </td></tr>
                ) : filteredRows.map((row: any) => (
                  <AppTr key={row.id}>
                    {(COLUMNS[activeTab] ?? []).map((c: any) => (
                      <AppTd key={c.key} align={c.align}>
                        {c.render ? c.render(row) : row[c.key]}
                      </AppTd>
                    ))}
                    {canWrite && (
                      <AppTd align="right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-950/30 text-[var(--pro-azure-light)] hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-300 dark:text-rose-600/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </AppTd>
                    )}
                  </AppTr>
                ))}
              </tbody>
            </AppTable>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal(prev => ({ ...prev, open: false }))}
        title={`${modal.type === 'CREATE' ? 'New' : 'Edit'} ${tabLabel[activeTab]}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(prev => ({ ...prev, open: false }))}>Cancel</Btn>
            <Btn variant="primary" loading={current?.saving} onClick={handleSave}>
              {modal.type === 'CREATE' ? `Create ${tabLabel[activeTab]}` : 'Save Changes'}
            </Btn>
          </>
        }
      >
        {renderForm()}
      </Modal>
      </div>
    </div>
  );
};

export default SinglePageAccounting;

