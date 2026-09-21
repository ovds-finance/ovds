/**
 * CompanyNew — create a new company profile.
 * First page shown after account creation.
 * Ovds-style: white card, green accents, clean forms.
 */
import {
  Building2, ArrowLeft, Check, CheckCircle2,
  Globe, Phone, Mail, MapPin, Zap,
  Users, Landmark, AlertCircle,
  Sparkles, ShieldCheck, LayoutGrid, FileText,
  RefreshCw, Hash,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';

type BusinessType =
  | 'MANUFACTURING'
  | 'LARGE_ENTERPRISE'
  | 'MEDIUM_ENTERPRISE'
  | 'SMALL_BUSINESS'
  | 'FREELANCER'
  | 'GOVERNMENT';

const BUSINESS_TYPES: {
  value: BusinessType;
  label: string;
  icon: React.ElementType;
  desc: string;
  ifrs: string;
}[] = [
  { value: 'SMALL_BUSINESS',    label: 'Small Business',    icon: Building2,  desc: 'Partnership, PLC, Coop', ifrs: 'Tier 2 (SMEs)' },
  { value: 'MEDIUM_ENTERPRISE', label: 'Medium Enterprise', icon: Building2,  desc: 'Growing 20–200 employees', ifrs: 'Full IFRS' },
  { value: 'MANUFACTURING',     label: 'Manufacturing',     icon: Zap,        desc: 'Textiles, Food, Metal', ifrs: 'Full IFRS' },
  { value: 'LARGE_ENTERPRISE',  label: 'Large Enterprise',  icon: Building2,  desc: 'Banks, Insurers, 200+', ifrs: 'Full IFRS' },
  { value: 'FREELANCER',        label: 'Individual',        icon: Users,      desc: 'Sole proprietorship', ifrs: 'Tier 3 (Micro)' },
  { value: 'GOVERNMENT',        label: 'Government',        icon: Landmark,   desc: 'Public sector entities', ifrs: 'Full IFRS' },
];

/* ---------- helpers -------------------------------------------------------- */
const inpCls = (err?: string, focused?: boolean) =>
  'w-full px-4 py-2.5 rounded-xl border text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-150 bg-white ' +
  (err
    ? 'border-red-300 ring-2 ring-red-100 bg-red-50/40'
    : focused
      ? 'border-[var(--pro-azure)] ring-2 ring-[var(--pro-azure-100)] shadow-sm'
      : 'border-gray-200 hover:border-gray-300');

const labelCls = 'block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5';

const SectionNumber: React.FC<{ n: string }> = ({ n }) => (
  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-extrabold text-white" style={{ background: '#55bc7e' }}>
    {n}
  </div>
);

function FieldWrap({ label, required, hint, error, focused, children }: {
  label: string; required?: boolean; hint?: string; error?: string;
  focused?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelCls}>
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[10px] text-gray-400 font-medium">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="mt-1.5 text-[11px] text-red-600 font-semibold flex items-center gap-1.5">
          <AlertCircle size={11} className="shrink-0"/>{error}
        </p>
      )}
    </div>
  );
}

const CompanyNew: React.FC = () => {
  usePageTitle('Add New Company');
  const navigate = useNavigate();
  const { refreshCompanies } = useBusiness();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'SMALL_BUSINESS' as BusinessType,
    tin: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    fiscalYearStart: '7',
    currency: 'ETB',
    vatRegistered: false,
    vatNumber: '',
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Company name is required';
    if (form.tin && form.tin.replace(/\D/g, '').length !== 15) e.tin = 'TIN must be 15 digits';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (form.vatRegistered && !form.vatNumber.trim()) e.vatNumber = 'VAT number is required when VAT registered';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/ovds/companies', {
        name: form.name.trim(),
        type: form.type,
        settings: {
          tin: form.tin,
          email: form.email,
          phone: form.phone,
          address: form.address,
          website: form.website,
          fiscal_year_start: form.fiscalYearStart,
          currency: form.currency,
          vat_registered: form.vatRegistered,
          vat_number: form.vatNumber,
        },
      });
      await refreshCompanies();
      toast.success('Company created successfully');
      navigate('/companies');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-3.5 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="group flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform"/>
            Back
          </button>
          <div className="h-4 w-px bg-gray-200"/>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#55bc7e' }}>
              <Building2 size={13} className="text-white"/>
            </div>
            <span className="text-[13px] font-extrabold text-gray-800">New Company</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8">

        {/* Hero banner */}
        <div className="rounded-2xl overflow-hidden mb-8 border border-gray-100 shadow-sm">
          <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#3db77a,#55bc7e,#7dd8a0)' }}/>
          <div className="bg-white px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{ background: '#55bc7e' }}>
              <Building2 size={28} className="text-white"/>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white px-2.5 py-0.5 rounded-full" style={{ background: '#55bc7e' }}>
                  <Sparkles size={9}/> New Company
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Create Company Profile</h1>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                Add your business details to start managing ovdss. Each company has fully isolated accounting, payroll and compliance records.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

            {/* ── Left / main column ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Section 1: Business Identity */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <SectionNumber n="01"/>
                  <div>
                    <p className="text-[14px] font-extrabold text-gray-900">Business Identity</p>
                    <p className="text-[11px] text-gray-400">Name, TIN and business type</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">

                  {/* Name + TIN row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldWrap label="Company Name" required error={errors.name} focused={focused==='name'}>
                      <div className="relative">
                        <Building2 size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${focused==='name'?'text-[var(--pro-azure)]':'text-gray-400'}`}/>
                        <input value={form.name} onChange={set('name')}
                          onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                          placeholder="e.g. Selam Trading PLC" autoFocus
                          className={inpCls(errors.name, focused==='name') + ' pl-10'}/>
                      </div>
                    </FieldWrap>
                    <FieldWrap label="TIN Number" hint="15 digits" error={errors.tin} focused={focused==='tin'}>
                      <div className="relative">
                        <Hash size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${focused==='tin'?'text-[var(--pro-azure)]':'text-gray-400'}`}/>
                        <input value={form.tin} onChange={set('tin')}
                          onFocus={() => setFocused('tin')} onBlur={() => setFocused(null)}
                          placeholder="000000000000000" maxLength={15}
                          className={inpCls(errors.tin, focused==='tin') + ' pl-10 font-mono tracking-widest'}/>
                      </div>
                    </FieldWrap>
                  </div>

                  {/* Business type grid */}
                  <div>
                    <p className={labelCls}>Business Type</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {BUSINESS_TYPES.map(bt => {
                        const BtIcon = bt.icon;
                        const selected = form.type === bt.value;
                        return (
                          <button key={bt.value} type="button"
                            onClick={() => setForm(f => ({ ...f, type: bt.value }))}
                            className={`relative flex flex-col items-start gap-2.5 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                              selected
                                ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]'
                                : 'border-gray-200 bg-white hover:border-[var(--pro-azure-light)] hover:shadow-sm'
                            }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${selected ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}
                              style={selected ? { background:'#55bc7e' } : {}}>
                              <BtIcon size={15}/>
                            </div>
                            <div>
                              <p className={`text-[12px] font-extrabold leading-none ${selected ? 'text-[var(--pro-azure-dark)]' : 'text-gray-800'}`}>{bt.label}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{bt.desc}</p>
                              <p className={`text-[9px] font-bold mt-1 ${selected ? 'text-[var(--pro-azure)]' : 'text-gray-300'}`}>{bt.ifrs}</p>
                            </div>
                            <div className={`absolute top-2.5 right-2.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-[var(--pro-azure)]' : 'border-gray-200'}`}
                              style={selected ? { background:'#55bc7e' } : {}}>
                              {selected && <Check size={8} className="text-white"/>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <SectionNumber n="02"/>
                  <div>
                    <p className="text-[14px] font-extrabold text-gray-900">Contact Information</p>
                    <p className="text-[11px] text-gray-400">Email, phone, address & website</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldWrap label="Official Email" error={errors.email} focused={focused==='email'}>
                      <div className="relative">
                        <Mail size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${focused==='email'?'text-[var(--pro-azure)]':'text-gray-400'}`}/>
                        <input type="email" value={form.email} onChange={set('email')}
                          onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                          placeholder="office@company.com"
                          className={inpCls(errors.email, focused==='email') + ' pl-10'}/>
                      </div>
                    </FieldWrap>
                    <FieldWrap label="Phone Number" focused={focused==='phone'}>
                      <div className="relative">
                        <Phone size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${focused==='phone'?'text-[var(--pro-azure)]':'text-gray-400'}`}/>
                        <input value={form.phone} onChange={set('phone')}
                          onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                          placeholder="+251 9XX XXX XXX"
                          className={inpCls(undefined, focused==='phone') + ' pl-10'}/>
                      </div>
                    </FieldWrap>
                    <FieldWrap label="Business Address" focused={focused==='address'}>
                      <div className="relative">
                        <MapPin size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${focused==='address'?'text-[var(--pro-azure)]':'text-gray-400'}`}/>
                        <input value={form.address} onChange={set('address')}
                          onFocus={() => setFocused('address')} onBlur={() => setFocused(null)}
                          placeholder="Addis Ababa, Ethiopia"
                          className={inpCls(undefined, focused==='address') + ' pl-10'}/>
                      </div>
                    </FieldWrap>
                    <FieldWrap label="Corporate Website" focused={focused==='website'}>
                      <div className="relative">
                        <Globe size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${focused==='website'?'text-[var(--pro-azure)]':'text-gray-400'}`}/>
                        <input value={form.website} onChange={set('website')}
                          onFocus={() => setFocused('website')} onBlur={() => setFocused(null)}
                          placeholder="www.yourcompany.com"
                          className={inpCls(undefined, focused==='website') + ' pl-10'}/>
                      </div>
                    </FieldWrap>
                  </div>
                </div>
              </div>

              {/* Section 3: Financial Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <SectionNumber n="03"/>
                  <div>
                    <p className="text-[14px] font-extrabold text-gray-900">Financial Settings</p>
                    <p className="text-[11px] text-gray-400">Currency, fiscal year & VAT</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldWrap label="Operating Currency" focused={focused==='currency'}>
                      <select value={form.currency} onChange={set('currency')}
                        onFocus={() => setFocused('currency')} onBlur={() => setFocused(null)}
                        className={inpCls(undefined, focused==='currency')}>
                        <option value="ETB">Ethiopian Birr (ETB)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </FieldWrap>
                    <FieldWrap label="Fiscal Year Start" focused={focused==='fy'}>
                      <select value={form.fiscalYearStart} onChange={set('fiscalYearStart')}
                        onFocus={() => setFocused('fy')} onBlur={() => setFocused(null)}
                        className={inpCls(undefined, focused==='fy')}>
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                          <option key={i} value={String(i+1)}>{m} (Month {i+1})</option>
                        ))}
                      </select>
                    </FieldWrap>
                  </div>

                  {/* VAT toggle */}
                  <div className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${form.vatRegistered ? 'border-[var(--pro-azure-light)] bg-[var(--pro-azure-50)]' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${form.vatRegistered ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}
                          style={form.vatRegistered ? { background:'#55bc7e' } : {}}>
                          <ShieldCheck size={16}/>
                        </div>
                        <div>
                          <p className={`text-[13px] font-extrabold ${form.vatRegistered ? 'text-[var(--pro-azure-dark)]' : 'text-gray-800'}`}>VAT Registered</p>
                          <p className="text-[11px] text-gray-400">Mandatory for turnover ≥ ETB 2M</p>
                        </div>
                      </div>
                      {/* Toggle switch */}
                      <button type="button" onClick={() => setForm(f => ({ ...f, vatRegistered: !f.vatRegistered }))}
                        className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/50 ${form.vatRegistered ? '' : 'bg-gray-200'}`}
                        style={form.vatRegistered ? { background:'#55bc7e' } : {}}
                        role="switch" aria-checked={form.vatRegistered}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${form.vatRegistered ? 'left-[calc(100%-21px)]' : 'left-0.5'}`}/>
                      </button>
                    </div>
                    {form.vatRegistered && (
                      <div className="px-5 pb-4 border-t border-[var(--pro-azure-100)]">
                        <FieldWrap label="VAT Number" required error={errors.vatNumber} focused={focused==='vatNumber'}>
                          <input value={form.vatNumber} onChange={set('vatNumber')}
                            onFocus={() => setFocused('vatNumber')} onBlur={() => setFocused(null)}
                            placeholder="VAT-XXXXXXX"
                            className={inpCls(errors.vatNumber, focused==='vatNumber')}/>
                        </FieldWrap>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* ── Right sidebar ── */}
            <div className="space-y-5">
              <div className="sticky top-20">

                {/* Next steps card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                  <div className="h-[3px]" style={{ background: '#55bc7e' }}/>
                  <div className="p-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Next Steps</p>
                    <div className="space-y-3.5">
                      {[
                        { icon: LayoutGrid, title: 'Seed Chart of Accounts', desc: 'Get the Ethiopian COA defaults' },
                        { icon: Users,      title: 'Import Staff',           desc: 'Bulk employee setup via CSV' },
                        { icon: FileText,   title: 'Config Invoices',        desc: 'Set your branding & terms' },
                      ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 text-[var(--pro-azure)]">
                            <Icon size={14}/>
                          </div>
                          <div>
                            <p className="text-[12px] font-extrabold text-gray-800 leading-none">{title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Help card */}
                <div className="rounded-2xl overflow-hidden mb-5 border border-gray-100 shadow-sm relative">
                  <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ backgroundImage:'radial-gradient(circle at 2px 2px,#55bc7e 1px,transparent 0)', backgroundSize:'20px 20px' }}/>
                  <div className="relative bg-white p-5">
                    <p className="text-[10px] font-bold text-[var(--pro-azure)] uppercase tracking-widest mb-2">Need Help?</p>
                    <p className="text-[12px] text-gray-500 leading-relaxed mb-4">
                      Our migration specialists can help move your legacy data into OVDS Cloud.
                    </p>
                    <button type="button"
                      className="w-full py-2 border border-gray-200 hover:border-[var(--pro-azure-light)] hover:bg-[var(--pro-azure-50)] rounded-xl text-[12px] font-semibold text-gray-600 hover:text-[var(--pro-azure-dark)] transition-all">
                      View Setup Guide
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  style={{ background: '#55bc7e' }}>
                  {saving
                    ? <><RefreshCw size={15} className="animate-spin"/> Creating…</>
                    : <><CheckCircle2 size={15}/> Create Company</>}
                </button>

                {/* Trust row */}
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-gray-400">
                  {['ERCA compliant','IFRS ready','Multi-currency'].map(t => (
                    <span key={t} className="flex items-center gap-1">
                      <Check size={9} className="text-[var(--pro-azure-light)]"/>{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyNew;
