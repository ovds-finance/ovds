import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { fmtCurrencyDecimal, fmtDecimal } from '../utils/fmt';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  AlertCircle,
  Banknote,
  Check,
  CheckCircle,
  ChevronRight,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  Link2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User,
  X,
  CalendarDays,
  QrCode,
} from 'lucide-react';
import { Button } from '../components/ui';
// -----------------------------------------------------------------------------// Types// -----------------------------------------------------------------------------
interface InvoicePayment {  id: string;  amount: number;  method: string;  reference?: string;  paidAt: string;}
interface InvoiceItem {  description: string;  quantity: number;  price: number;  discount: number;  Item: { name: string };}
interface SharedInvoiceData {  id: string;  invoiceNumber: string;  customerName: string;  customer: string;  date: string;  dueDate: string;  totalAmount: number;  vatAmount: number;  subtotal: number;  discountAmount?: number;  status: string;  notes?: string;  customerNotes?: string;  customerEmail: string;  customerPhone?: string;  customerAddress?: string;  customerTin?: string;  paymentTerms?: string;  totalPaid: number;  remaining: number;  fullyPaid: boolean;  shareToken?: string;  InvoiceItem: InvoiceItem[];  InvoicePayment?: InvoicePayment[];}
// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const statusColor = (s: string) =>  s === 'PAID'    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :  s === 'OVERDUE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :  s === 'DRAFT'   ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
const statusDot = (s: string) =>  s === 'PAID'    ? 'bg-emerald-500' :  s === 'OVERDUE' ? 'bg-rose-500' :  s === 'DRAFT'   ? 'bg-slate-300' : 'bg-amber-400';
const daysOverdueFor = (dueDate: string) =>  dueDate && new Date(dueDate) < new Date()    ? Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)    : 0;
// -----------------------------------------------------------------------------
// Email Share Modal
// -----------------------------------------------------------------------------
const EmailShareModal: React.FC<{  inv: any;  link: string;  onClose: () => void;}> = ({ inv, link, onClose }) => {  const [email, setEmail] = useState(inv.customerEmail || '');
const [sending, setSending] = useState(false);
const handleSend = async () => {    if (!email.trim()) return;    setSending(true);
try {      await api.post(`/ovds/invoices/${inv.id}/send`, { shareLink: link, to: email });
toast.success(`Share link sent to ${email}`);      onClose();    }
catch (err: any) {      toast.error(err.response?.data?.message || 'Failed to send email');    }
finally {      setSending(false);    }  };
return (    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>        <div className="flex items-center justify-between">          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
<Mail size={16} className="text-teal-600" /> Send Share Link          </p>          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
<X size={16} />          </button>        </div>        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-xs font-mono text-slate-500 break-all">{link}</div>        <div>          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Recipient Email</label>          <input           
  value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" type="email" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"          />        </div>        <div className="flex gap-2 pt-1">
<Button variant="secondary" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
<Button size="sm" onClick={handleSend} loading={sending} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
  <Send size={14} className="mr-1.5 inline-block" /> Send Email
</Button>        </div>      </div>    </div>  );}
// -----------------------------------------------------------------------------
// Management View
// -----------------------------------------------------------------------------
type TabFilter = 'ALL' | 'SHARED' | 'UNSHARED';
type StatusFilter = 'ALL' | 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE';
const ManagementView: React.FC = () => {  usePageTitle('Client Portal');
const [invoices, setInvoices] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [tab, setTab] = useState<TabFilter>('ALL');
const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
const [sharing, setSharing] = useState<string | null>(null);
const [copied, setCopied] = useState<string | null>(null);
const [emailModal, setEmailModal] = useState<{ inv: any; link: string } | null>(null);
const [openMenu, setOpenMenu] = useState<string | null>(null);
const menuRef = useRef<HTMLDivElement>(null);
const fetchInvoices = useCallback(async () => {    try {      setLoading(true);
const res = await api.get('/ovds/invoices', { params: { limit: 200 } });      setInvoices(res.data?.data?.invoices ?? []);    }
catch {      toast.error('Failed to load invoices');    }
finally {      setLoading(false);    }  }, []);
useEffect(() => { fetchInvoices(); }, [fetchInvoices]);  // Close menu on outside click  
useEffect(() => {    
const handler = (e: MouseEvent) => {      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);    };    document.addEventListener('mousedown', handler);
return () => document.removeEventListener('mousedown', handler);  }, []);
const handleShare = async (inv: any) => {    setSharing(inv.id);
try {      const res = await api.post(`/ovds/invoices/${inv.id}/share`);
const token = res.data?.data?.token ?? res.data?.data?.shareToken ?? res.data?.token ?? res.data?.shareToken;
if (token) {        setInvoices((prev) => prev.map((item) => item.id === inv.id ? { ...item, shareToken: token } : item));
const link = `${window.location.origin}/client-portal/${token}`;        await navigator.clipboard.writeText(link).catch(() => {});
toast.success('Share link generated & copied');      }    }
catch (err: any) {      toast.error(err.response?.data?.message || 'Failed to generate share link');    }
finally {      setSharing(null);    }  };
const handleRevoke = async (inv: any) => {    try {      await api.patch(`/ovds/invoices/${inv.id}`, { shareToken: null });      setInvoices((prev) => prev.map((item) => item.id === inv.id ? { ...item, shareToken: null } : item));
toast.success('Share link revoked');    }
catch {      toast.error('Failed to revoke link');    }    setOpenMenu(null);  };
const copyLink = async (token: string, id: string) => {    const link = `${window.location.origin}/client-portal/${token}`;    await navigator.clipboard.writeText(link).catch(() => {});    setCopied(id);
toast.success('Link copied');    setTimeout(() => setCopied(null), 2000);  };
const sharedInvoices = invoices.filter((i) => i.shareToken);
const paidViaPortal = sharedInvoices.filter((i) => i.status === 'PAID');
const pendingShared = sharedInvoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
const totalOutstanding = pendingShared.reduce((s, i) => s + Number(i.totalAmount), 0);
const filtered = invoices.filter((i) => {    const q = search.toLowerCase();
const matchSearch = !q || i.invoiceNumber?.toLowerCase().includes(q) || i.customer?.toLowerCase().includes(q) || i.customerEmail?.toLowerCase().includes(q);
const matchTab = tab === 'ALL' || (tab === 'SHARED' ? !!i.shareToken : !i.shareToken);
const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
return matchSearch && matchTab && matchStatus;  });
const stats = [    { label: 'Total Invoices', value: invoices.length, icon: <FileText size={16} />, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },    { label: 'Shared Links', value: sharedInvoices.length, icon: <Link2 size={16} />, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },    { label: 'Paid via Portal', value: paidViaPortal.length, icon: <CheckCircle size={16} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },    { label: 'Outstanding', value: fmtCurrencyDecimal(totalOutstanding, 'ETB'), icon: <TrendingUp size={16} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },  ];
const TABS: { key: TabFilter; label: string }[] = [    { key: 'ALL', label: 'All' },    { key: 'SHARED', label: `Shared (${sharedInvoices.length})` },    { key: 'UNSHARED', label: 'Not Shared' },  ];
const STATUS_FILTERS: StatusFilter[] = ['ALL', 'DRAFT', 'PENDING', 'PAID', 'OVERDUE'];
return (    <div className="space-y-5">      {emailModal && (        <EmailShareModal inv={emailModal.inv} link={emailModal.link} onClose={() => setEmailModal(null)} />      )}      {/* Header */}      <div className="flex items-start justify-between gap-4 flex-wrap">        <div className="flex items-center gap-3">          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
<Globe size={20} className="text-teal-700 dark:text-teal-400" />          </div>          <div>            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Client Portal</h1>            <p className="text-slate-500 text-sm">Share invoices — customers view & pay without logging in</p>          </div>        </div>        <div className="flex items-center gap-2">          <button onClick={fetchInvoices} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-all" title="Refresh">
<RefreshCw size={15} />          </button>
<Link to="/sales/invoices">
<Button size="sm" variant="secondary">
  <ExternalLink size={14} className="mr-1.5 inline-block" /> Manage Invoices
</Button>          </Link>        </div>      </div>      {/* Stats */}      <div className="ovds-grid-layout cols-4">        {stats.map((s, i) => (          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>            <div className="min-w-0">              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">{loading ? '—' : s.value}</p>              <p className="ovds-caption">{s.label}</p>            </div>          </div>        ))}      </div>      {/* How it works banner */}      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-5 text-white relative overflow-hidden">        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
<Globe size={80} />        </div>        <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-3 flex items-center gap-2">
<Share2 size={12} /> How it works        </p>        <div className="ovds-grid-layout cols-4 relative z-10">          {[            { n: '1', t: 'Find an invoice below' },            { n: '2', t: 'Click Share to get a secure link' },            { n: '3', t: 'Send the link to your customer' },            { n: '4', t: 'They view & pay — no login needed' },          ].map((s, i) => (            <div key={s.n} className="flex items-start gap-2">              <div className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>              <p className="text-sm font-medium opacity-90">{s.t}</p>            </div>          ))}        </div>      </div>      {/* Filters + table */}      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">        {/* Toolbar */}        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">          {/* Tabs */}          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">            {TABS.map((t, i) => (              <button               
  key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${tab === t.key ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}              >                {t.label}              </button>            ))}          </div>          {/* Status filter */}          <div className="flex items-center gap-1 flex-wrap">
<Filter size={12} className="text-slate-400" />            {STATUS_FILTERS.map((s, i) => (              <button               
  key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${statusFilter === s ? statusColor(s) + ' ring-1 ring-current/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}              >                {s}              </button>            ))}          </div>          {/* Search */}          <div className="relative ml-auto">
<Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />            <input             
  value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-44"            />          </div>        </div>        {/* List */}        {loading ? (          <div className="p-5 space-y-3">            {[1, 2, 3, 4].map((_, i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}          </div>        ) : filtered.length === 0 ? (          <div className="py-16 text-center">
<FileText size={32} className="mx-auto text-slate-300 mb-3" />            <p className="text-slate-500 text-sm font-medium">No invoices match your filters</p>            <button onClick={() => { setTab('ALL'); setStatusFilter('ALL'); setSearch(''); }} className="text-teal-600 text-xs font-bold hover:underline mt-1">              Clear filters            </button>          </div>        ) : (          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">            {filtered.map((inv, i) => {              const hasToken = !!inv.shareToken;
const link = hasToken ? `${window.location.origin}/client-portal/${inv.shareToken}` : null;
const overdue = daysOverdueFor(inv.dueDate);
const isMenuOpen = openMenu === inv.id;
return (                <div key={inv.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot(inv.status)}`} />                  <div className="min-w-0 flex-1">                    <div className="flex items-center gap-2 flex-wrap">                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">#{inv.invoiceNumber}</span>                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(inv.status)}`}>                        {inv.status}{overdue > 0 && inv.status !== 'PAID' ? ` +${overdue}d` : ''}                      </span>                      {hasToken && (                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 flex items-center gap-1">
<Globe size={9} /> Shared                        </span>                      )}                    </div>                    <p className="text-xs text-slate-500 truncate mt-0.5">                      {inv.customer}{inv.customerEmail ? ` · ${inv.customerEmail}` : ''}                    </p>                  </div>                  <div className="text-right shrink-0 hidden sm:block">                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">ETB {fmtDecimal(inv.totalAmount)}</p>                    <p className="ovds-caption">{new Date(inv.date).toLocaleDateString()}</p>                  </div>                  <div className="flex items-center gap-1 shrink-0">                    {hasToken && link && (                      <>                        <a href={link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-600 transition-colors" title="Preview">
<Eye size={14} />                        </a>                        <button onClick={() => copyLink(inv.shareToken, inv.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Copy link">                          {copied === inv.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}                        </button>                        <button onClick={() => setEmailModal({ inv, link })} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors" title="Send via email">
<Mail size={14} />                        </button>                      </>                    )}                    <button                     
  onClick={() => handleShare(inv)} disabled={sharing === inv.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${                        hasToken                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-500/20'                      }`}                    >                      {sharing === inv.id ? <RefreshCw size={12} className="animate-spin" /> : <Share2 size={12} />}                      {hasToken ? 'Reshare' : 'Share'}                    </button>                    {/* Overflow menu */}                    {hasToken && (                      <div className="relative" ref={isMenuOpen ? menuRef : undefined}>                        <button onClick={() => setOpenMenu(isMenuOpen ? null : inv.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
<MoreHorizontal size={14} />                        </button>                        {isMenuOpen && (                          <div className="absolute right-0 top-5 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-40 py-1 text-xs">                            <button                             
  onClick={() => handleRevoke(inv)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 font-bold"                            >
<Trash2 size={12} /> Revoke Link                            </button>                          </div>                        )}                      </div>                    )}                  </div>                </div>              );            })}          </div>        )}        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">          <p className="text-xs text-slate-400">{filtered.length} shown · {sharedInvoices.length} shared</p>
<Link to="/sales/invoices" className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1">            All Invoices <ChevronRight size={12} />          </Link>        </div>      </div>    </div>  );};
// -----------------------------------------------------------------------------
// Customer Invoice View (public, token-based)
// -----------------------------------------------------------------------------
const InvoiceView: React.FC<{ token: string }> = ({ token }) => {  usePageTitle('Invoice Portal');
const [invoice, setInvoice] = useState<SharedInvoiceData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [printed, setPrinted] = useState(false);
useEffect(() => {    api.get(`/ovds/invoices/share/${token}`)      .then((res: any) => setInvoice(res.data.invoice))      .catch((err: any) => setError(err.response?.data?.message || 'Invoice not found or expired'))      .finally(() => setLoading(false));  }, [token]);
const handlePrint = () => {    setPrinted(true);    window.print();    setTimeout(() => setPrinted(false), 2000);  };
if (loading) {    return (      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">        <div className="flex flex-col items-center gap-3">          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading invoice...</p>        </div>      </div>    );  }
if (error || !invoice) {    return (      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">        <div className="max-w-md w-full text-center space-y-4">          <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
<AlertCircle size={36} className="text-rose-500" />          </div>          <h1 className="text-2xl font-semibold text-slate-900">Invoice Not Found</h1>          <p className="text-slate-500">This share link is invalid or has expired. Contact the sender for a new link.</p>
<Button onClick={() => window.history.back()} variant="secondary">Go Back</Button>        </div>      </div>    );  }
const { totalPaid, remaining, fullyPaid, InvoicePayment: payments = [] } = invoice;
const overdue = daysOverdueFor(invoice.dueDate);
const paidPct = invoice.totalAmount > 0 ? Math.min(100, Math.round((totalPaid / invoice.totalAmount) * 100)) : 0;
const displayName = invoice.customerName || invoice.customer;
return (    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 print:bg-white">      <div className="max-w-3xl mx-auto p-4 md:p-5">        {/* Branding header */}        <div className="text-center mb-6 print:hidden">          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 mb-4">
<ShieldCheck size={14} className="text-teal-600" />            <span className="text-xs font-semibold text-slate-600">Secured by ovds ovds</span>          </div>          <h1 className="text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">            Invoice Portal          </h1>          <p className="text-slate-500 mt-1">View and pay your invoice securely</p>        </div>        {/* Paid banner */}        {fullyPaid && (          <div className="mb-6 bg-emerald-500 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-emerald-500/20">
<CheckCircle size={24} className="shrink-0" />            <div>              <p className="font-semibold text-lg">Payment Complete</p>              <p className="text-sm opacity-90">This invoice has been paid in full. Thank you!</p>            </div>          </div>        )}        {/* Overdue banner */}        {!fullyPaid && overdue > 0 && (          <div className="mb-6 bg-rose-500 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-rose-500/20">
<AlertCircle size={24} className="shrink-0" />            <div>              <p className="font-semibold">Payment Overdue by {overdue} day{overdue !== 1 ? 's' : ''}</p>              <p className="text-sm opacity-90">Please settle this invoice as soon as possible.</p>            </div>          </div>        )}        {/* Main invoice card */}        <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden mb-6 print:shadow-none print:border print:rounded-none">          {/* Gradient top bar */}          <div className={`p-6 text-white ${fullyPaid ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : overdue > 0 ? 'bg-gradient-to-r from-rose-600 to-orange-500' : 'bg-gradient-to-r from-emerald-600 to-violet-500'}`}>            <div className="flex flex-wrap items-start justify-between gap-4">              <div>                <p className="text-xs opacity-80 font-bold uppercase tracking-wider mb-1">Tax Invoice</p>                <p className="text-3xl font-semibold">#{invoice.invoiceNumber}</p>                <p className="text-sm opacity-80 mt-1">Issued {new Date(invoice.date).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</p>              </div>              <div className="text-right">                <p className="text-xs opacity-80 font-bold uppercase tracking-wider mb-1">Total Amount</p>                <p className="text-2xl font-semibold">ETB {fmtDecimal(invoice.totalAmount)}</p>                {invoice.dueDate && (                  <p className="text-sm opacity-80 mt-1 flex items-center gap-1 justify-end">
<CalendarDays size={12} />                    Due {new Date(invoice.dueDate).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })}                  </p>                )}              </div>            </div>          </div>          {/* Payment progress bar */}          {totalPaid > 0 && (            <div className="px-6 py-4 bg-white border-b border-slate-100">              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">                <span>Payment Progress</span>                <span>{paidPct}% paid</span>              </div>              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">                <div                 
  className={`h-full rounded-full transition-all duration-700 ${fullyPaid ? 'bg-emerald-500' : 'bg-emerald-500'}`} style={{ width: `${paidPct}%` }}                />              </div>              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">                <span>ETB {fmtDecimal(totalPaid)} paid</span>                <span>ETB {fmtDecimal(remaining)} remaining</span>              </div>            </div>          )}          {/* Customer + summary grid */}          <div className="p-5 ovds-grid-layout cols-2 border-b border-slate-100">            <div>              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Bill To</p>              <div className="space-y-1.5">                <div className="flex items-center gap-2">
<User size={13} className="text-slate-400 shrink-0" />                  <p className="font-semibold text-slate-900">{displayName}</p>                </div>                {invoice.customerEmail && (                  <div className="flex items-center gap-2">
<Mail size={13} className="text-slate-400 shrink-0" />                    <p className="text-sm text-slate-600">{invoice.customerEmail}</p>                  </div>                )}                {invoice.customerPhone && (                  <div className="flex items-center gap-2">
<Phone size={13} className="text-slate-400 shrink-0" />                    <p className="text-sm text-slate-600">{invoice.customerPhone}</p>                  </div>                )}                {invoice.customerAddress && (                  <div className="flex items-center gap-2">
<MapPin size={13} className="text-slate-400 shrink-0" />                    <p className="text-sm text-slate-600">{invoice.customerAddress}</p>                  </div>                )}                {invoice.customerTin && (                  <p className="text-xs text-slate-400 mt-1">TIN: {invoice.customerTin}</p>                )}              </div>            </div>            <div>              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Payment Summary</p>              <div className="space-y-2 text-sm">                <div className="flex justify-between text-slate-600">                  <span>Subtotal</span>                  <span className="font-mono">ETB {fmtDecimal(invoice.subtotal)}</span>                </div>                {(invoice.discountAmount ?? 0) > 0 && (                  <div className="flex justify-between text-rose-600">                    <span>Discount</span>                    <span className="font-mono">- ETB {fmtDecimal(invoice.discountAmount!)}</span>                  </div>                )}                <div className="flex justify-between text-slate-600">                  <span>VAT (15%)</span>                  <span className="font-mono">ETB {fmtDecimal(invoice.vatAmount)}</span>                </div>                <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-100 pt-2">                  <span>Total</span>                  <span className="font-mono">ETB {fmtDecimal(invoice.totalAmount)}</span>                </div>                {totalPaid > 0 && (                  <div className="flex justify-between text-emerald-600 font-bold">                    <span>Paid</span>                    <span className="font-mono">- ETB {fmtDecimal(totalPaid)}</span>                  </div>                )}                <div className={`flex justify-between font-semibold text-base border-t border-slate-100 pt-2 ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>                  <span>Balance Due</span>                  <span className="font-mono">ETB {fmtDecimal(remaining)}</span>                </div>              </div>            </div>          </div>          {/* Line items */}          <div className="overflow-x-auto">            <table className="w-full text-sm ovds-table">              <thead>                <tr className="bg-white border-b border-slate-200">                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item / Service</th>                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price</th>                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">VAT</th>                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>                </tr>              </thead>              <tbody className="divide-y divide-slate-50">                {invoice.InvoiceItem.map((item, i) => {                  const gross = item.price * item.quantity;
const disc = gross * ((item.discount || 0) / 100);
const net = gross - disc;
const vat = net * 0.15;
return (                    <tr key={i} className="hover:bg-slate-50/50">                      <td className="px-5 py-4">                        <p className="font-medium text-slate-900">{item.Item?.name || item.description || '—'}</p>                        {item.discount > 0 && <p className="text-xs text-rose-500 mt-0.5">-{item.discount}% discount</p>}                      </td>                      <td className="px-4 py-4 text-right font-mono text-slate-700">{item.quantity}</td>                      <td className="px-4 py-4 text-right font-mono text-slate-700">ETB {fmtDecimal(item.price)}</td>                      <td className="px-4 py-4 text-right font-mono text-slate-500">ETB {fmtDecimal(vat)}</td>                      <td className="px-4 py-4 text-right font-semibold text-slate-900">ETB {fmtDecimal(net + vat)}</td>                    </tr>                  );                })}              </tbody>            </table>          </div>        </div>        {/* Payment history */}        {payments.length > 0 && (          <div className="ovds-widget-card shadow-sm overflow-hidden mb-6">            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
<Banknote size={15} className="text-emerald-600" />              <p className="text-sm font-semibold text-slate-700">Payment History</p>              <span className="ml-auto text-xs text-slate-400">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>            </div>            <div className="divide-y divide-slate-50">              {payments.map((p, i) => (                <div key={p.id ?? i} className="px-5 py-3.5 flex items-center gap-3">                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
<CheckCircle size={14} className="text-emerald-600" />                  </div>                  <div className="flex-1 min-w-0">                    <p className="text-sm font-bold text-slate-800">{p.method}</p>                    {p.reference && <p className="text-xs text-slate-400 font-mono truncate">{p.reference}</p>}                  </div>                  <div className="text-right shrink-0">                    <p className="text-sm font-semibold text-emerald-600">ETB {fmtDecimal(p.amount)}</p>                    <p className="ovds-caption">{new Date(p.paidAt).toLocaleDateString()}</p>                  </div>                </div>              ))}            </div>          </div>        )}        {/* Notes */}        {(invoice.customerNotes || invoice.notes) && (          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
<FileText size={13} /> Notes            </p>            <p className="text-sm text-amber-900 whitespace-pre-wrap">{invoice.customerNotes || invoice.notes}</p>          </div>        )}        {/* Action buttons */}        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 print:hidden">          <button           
  onClick={handlePrint} className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"          >            {printed ? <Check size={18} className="text-emerald-500" /> : <Printer size={18} />}            {printed ? 'Sent to Printer' : 'Print Invoice'}          </button>          {remaining > 0 ? (            <button className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]">
<CreditCard size={18} />              Pay Now — ETB {fmtDecimal(remaining)}            </button>          ) : (            <button disabled
  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-100 text-emerald-700 font-semibold text-sm cursor-default">
<CheckCircle size={18} /> Paid in Full            </button>          )}        </div>        {/* Trust footer */}        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 print:hidden">          <span className="flex items-center gap-1">
<ShieldCheck size={12} className="text-teal-500" /> Secured</span>          <span>·</span>          <span className="flex items-center gap-1">
<QrCode size={12} /> NBE Compliant</span>          <span>·</span>          <span>ERCA Ready</span>        </div>      </div>    </div>  );};
// -----------------------------------------------------------------------------
// Root
// -----------------------------------------------------------------------------
const ClientPortal: React.FC = () => {  const { t } = useTranslation();
const { token } = useParams<{ token?: string }>();
return token ? <InvoiceView token={token} /> : <ManagementView />;}
export default ClientPortal;












