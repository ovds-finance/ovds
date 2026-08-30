/**
 * EmailTemplates — ovds-style email template management
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Mail, Plus, Edit2, Trash2, RefreshCw, Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EmptyState, Pagination,
} from '../components/ui';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  isActive?: boolean;
  language?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'INVOICE' | 'PAYROLL' | 'TAX' | 'SYSTEM';

const TEMPLATE_TYPES = ['INVOICE', 'PAYMENT_REMINDER', 'PAYROLL', 'TAX_FILING', 'WELCOME', 'PASSWORD_RESET', 'SYSTEM', 'OTHER'];

const TEMPLATE_VARIABLES: Record<string, string[]> = {
  INVOICE:          ['{{customer_name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}', '{{company_name}}'],
  PAYMENT_REMINDER: ['{{customer_name}}', '{{invoice_number}}', '{{overdue_days}}', '{{amount}}'],
  PAYROLL:          ['{{employee_name}}', '{{month}}', '{{net_salary}}', '{{company_name}}'],
  TAX_FILING:       ['{{company_name}}', '{{period}}', '{{vat_amount}}', '{{due_date}}'],
  WELCOME:          ['{{user_name}}', '{{company_name}}', '{{login_url}}'],
  PASSWORD_RESET:   ['{{user_name}}', '{{reset_link}}', '{{expiry_time}}'],
};

const TemplateForm: React.FC<{ data: Partial<EmailTemplate>; onChange: (d: Partial<EmailTemplate>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof EmailTemplate, v: any) => onChange({ ...data, [k]: v });
  const vars = TEMPLATE_VARIABLES[data.type ?? 'INVOICE'] ?? [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Template Name" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Invoice Notification" />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'INVOICE'} onChange={e => set('type', e)}>
            {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Language">
          <Select value={data.language ?? 'en'} onChange={e => set('language', e)}>
            <option value="en">English</option>
            <option value="am">Amharic</option>
            <option value="om">Oromiffa</option>
          </Select>
        </FormField>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={data.isActive !== false} onChange={e => set('isActive', e.target.checked)} className="accent-emerald-600" />
            <span className="text-[12px] font-semibold text-slate-700">Active</span>
          </label>
        </div>
      </div>
      <FormField label="Subject" required>
        <Input value={data.subject ?? ''} onChange={e => set('subject', e.target.value)} placeholder="Email subject line" />
      </FormField>
      {/* Variable chips */}
      {vars.length > 0 && (
        <div className="p-2.5 bg-white rounded-lg border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Available Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {vars.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => set('body', (data.body ?? '') + v)}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
      <FormField label="Body" required hint="Use variables above to personalise">
        <Textarea value={data.body ?? ''} onChange={e => set('body', e.target.value)} rows={6} placeholder="Email body content…" className="font-mono text-[11px]" />
      </FormField>
    </div>
  );
};

const EmailTemplates: React.FC = () => {
  usePageTitle('Email Templates');
  const { can } = useAuth();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<EmailTemplate> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<EmailTemplate>({
    endpoint: '/notifications/template',
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'INVOICE') list = list.filter(t => ['INVOICE', 'PAYMENT_REMINDER'].includes(t.type));
    if (tab === 'PAYROLL') list = list.filter(t => t.type === 'PAYROLL');
    if (tab === 'TAX')     list = list.filter(t => t.type === 'TAX_FILING');
    if (tab === 'SYSTEM')  list = list.filter(t => ['WELCOME', 'PASSWORD_RESET', 'SYSTEM'].includes(t.type));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => [t.name, t.subject, t.type].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',    value: rows.length,                                          color: 'emerald' as const },
    { label: 'Active',   value: rows.filter(t => t.isActive !== false).length,        color: 'sky' as const },
    { label: 'Invoice',  value: rows.filter(t => ['INVOICE','PAYMENT_REMINDER'].includes(t.type)).length, color: 'violet' as const },
    { label: 'Payroll',  value: rows.filter(t => t.type === 'PAYROLL').length,        color: 'amber' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim() || !modal.data.subject?.trim()) {
      toast.error('Name and subject are required'); return;
    }
    const result = await save(modal.data as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleDuplicate = async (t: EmailTemplate) => {
    await save({ ...t, id: undefined, name: `${t.name} (Copy)` } as any);
    toast.success('Template duplicated');
  };

  const TYPE_CLS: Record<string, string> = {
    INVOICE:          'bg-emerald-50 text-emerald-700 border-emerald-100',
    PAYMENT_REMINDER: 'bg-amber-50 text-amber-700 border-amber-100',
    PAYROLL:          'bg-violet-50 text-violet-700 border-violet-100',
    TAX_FILING:       'bg-sky-50 text-sky-700 border-sky-100',
    WELCOME:          'bg-teal-50 text-teal-700 border-teal-100',
    PASSWORD_RESET:   'bg-rose-50 text-rose-700 border-rose-100',
    SYSTEM:           'bg-white text-slate-600 border-slate-200',
  };

  return (
    <AppPage
      title="Email Templates"
      subtitle="Notification templates · Invoice, payroll, tax, system emails"
      icon={<Mail size={18} />}
      crumbs={[{ label: 'Email Templates' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',     label: 'All',     count: rows.length },
            { key: 'INVOICE', label: 'Invoice', count: rows.filter(t => ['INVOICE','PAYMENT_REMINDER'].includes(t.type)).length },
            { key: 'PAYROLL', label: 'Payroll', count: rows.filter(t => t.type === 'PAYROLL').length },
            { key: 'TAX',     label: 'Tax',     count: rows.filter(t => t.type === 'TAX_FILING').length },
            { key: 'SYSTEM',  label: 'System',  count: rows.filter(t => ['WELCOME','PASSWORD_RESET','SYSTEM'].includes(t.type)).length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          {can('notifications:config') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'INVOICE', language: 'en', isActive: true } })}>
              New Template
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search templates…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} templates</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Template</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>Subject</AppTh>
          <AppTh>Language</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="100px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<Mail size={18} />} title="No email templates" desc="Create notification templates for invoices, payroll, and tax" action={can('notifications:config') ? { label: 'New Template', onClick: () => setModal({ open: true, data: { type: 'INVOICE', language: 'en', isActive: true } }) } : undefined} /></td></tr>
          ) : filtered.map(t => (
            <AppTr key={t.id}>
              <AppTd>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0"><Mail size={12} className="text-sky-600" /></div>
                  <span className="text-[12px] font-semibold text-slate-800">{t.name}</span>
                </div>
              </AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${TYPE_CLS[t.type] ?? TYPE_CLS.SYSTEM}`}>
                  {t.type.replace(/_/g, ' ')}
                </span>
              </AppTd>
              <AppTd><span className="text-[11px] text-slate-600 truncate block max-w-[200px]">{t.subject}</span></AppTd>
              <AppTd>
                <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100 uppercase">
                  {t.language ?? 'en'}
                </span>
              </AppTd>
              <AppTd><StatusBadge status={t.isActive !== false ? 'ACTIVE' : 'INACTIVE'} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDuplicate(t)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Duplicate"><Copy size={11} /></button>
                  {can('notifications:config') && (
                    <>
                      <button onClick={() => setModal({ open: true, data: { ...t } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Edit"><Edit2 size={11} /></button>
                      <button onClick={async () => { if (await confirm({ title: `Delete "${t.name}"?`, variant: 'danger' })) remove(t.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Email Template'} subtitle="Notification template · Amharic/English/Oromiffa" width="max-w-2xl"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Template'}</Btn></>}>
        <TemplateForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default EmailTemplates;


