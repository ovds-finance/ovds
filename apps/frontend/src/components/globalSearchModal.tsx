/**
 * GlobalSearchModal — enhanced Ctrl+K command palette.
 * Searches nav pages, recent documents (invoices, bills, employees),
 * and quick actions. Replaces the basic palette in Header.tsx.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Fuse from 'fuse.js';
import api from '../services/api';
import { useAuth } from '../rbac/AuthContext';
import { useNavTree } from '../hooks/useNavTree';
import { useLocalStorage } from '../hooks';
import { Icon } from './ui';

// -- Types ---------------------------------------------------------------------

interface SearchResult {
  id: string;
  type: 'page' | 'invoice' | 'bill' | 'employee' | 'action' | 'recent';
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  to?: string;
  action?: () => void;
  badge?: string;
  badgeColor?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// -- Section label -------------------------------------------------------------

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-4 py-1.5 mt-1">
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
  </div>
);

// -- Result row ----------------------------------------------------------------

const ResultRow: React.FC<{
  result: SearchResult;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}> = ({ result, active, onSelect, onHover }) => (
  <button
    onClick={onSelect}
    onMouseEnter={onHover}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
      active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
    }`}
  >
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
      active ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'
    }`}>
      {result.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold truncate ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
        {result.label}
      </p>
      {result.sublabel && (
        <p className="text-[10px] text-slate-400 truncate">{result.sublabel}</p>
      )}
    </div>
    {result.badge && (
      <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ${result.badgeColor ?? 'bg-slate-100 text-slate-500'}`}>
        {result.badge}
      </span>
    )}
    {active && <Icon name="CHEVRON_RIGHT" size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
  </button>
);

// -- Main component ------------------------------------------------------------

const GlobalSearchModal: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccessRoute, can } = useAuth();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [docResults, setDocResults] = useState<SearchResult[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('global_search_recent', []);

  const navTree = useNavTree();

  // Nav items filtered by RBAC
  const navItems = useMemo(() =>
    navTree.allItems.filter(i => canAccessRoute(i.to)),
  [canAccessRoute, navTree.allItems]);

  // Quick actions
  const quickActions: SearchResult[] = useMemo(() => ([
    { id: 'qa-invoice', type: 'action' as const, label: 'New Invoice',        sublabel: 'Create a new sales invoice',             icon: <Icon name="INVOICE"      size={14} className="text-teal-500" />,             to: '/sales/invoices?action=new',        badge: 'New', badgeColor: 'bg-teal-100 text-teal-700' },
    { id: 'qa-estimate', type: 'action' as const, label: 'New Estimate',      sublabel: 'Create a new quote or estimate',         icon: <Icon name="CLIPBOARD_LIST" size={14} className="text-sky-500" />,          to: '/sales/estimates?action=new',       badge: 'New', badgeColor: 'bg-sky-100 text-sky-700' },
    { id: 'qa-bill',    type: 'action' as const, label: 'New Bill',           sublabel: 'Record a purchase bill',                 icon: <Icon name="VENDOR"       size={14} className="text-rose-500" />,             to: '/purchases/bills?action=new',           badge: 'New', badgeColor: 'bg-rose-100 text-rose-700' },
    { id: 'qa-po',      type: 'action' as const, label: 'New Purchase Order', sublabel: 'Create a new PO',                        icon: <Icon name="SHOPPING_CART" size={14} className="text-amber-500" />,         to: '/purchases/orders?action=new',      badge: 'New', badgeColor: 'bg-amber-100 text-amber-700' },
    { id: 'qa-emp',     type: 'action' as const, label: 'Add Employee',       sublabel: 'Register a new employee',                icon: <Icon name="EMPLOYEE"     size={14} className="text-emerald-600" />,         to: '/hr/employees?action=add',       badge: 'New', badgeColor: 'bg-emerald-100 text-emerald-700' },
    { id: 'qa-payroll', type: 'action' as const, label: 'Generate Payroll',   sublabel: 'Run payroll for this month',             icon: <Icon name="BANKNOTE"     size={14} className="text-emerald-500" />,         to: '/hr/payroll?action=generate' },
    { id: 'qa-vat',     type: 'action' as const, label: 'File VAT Return',    sublabel: 'Submit monthly VAT to ERCA',             icon: <Icon name="SHIELD_CHECK" size={14} className="text-violet-500" />,         to: '/tax/filing?action=file' },
    { id: 'qa-report',  type: 'action' as const, label: 'P&L Report',         sublabel: 'View profit & loss statement',           icon: <Icon name="BAR_CHART_2"  size={14} className="text-indigo-500" />,         to: '/reports/financial-statements?tab=pl' },
    { id: 'qa-coa',     type: 'action' as const, label: 'Chart of Accounts',  sublabel: 'Manage GL accounts',                     icon: <Icon name="BOOK_OPEN"    size={14} className="text-slate-500" />,          to: '/ovds/accounts' },
  ] as SearchResult[]).filter(a => a.to ? canAccessRoute(a.to.split('?')[0]) : true), [canAccessRoute]);

  // Auto-focus on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setDocResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  // Search documents when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setDocResults([]); return; }
    const timer = setTimeout(async () => {
      setDocLoading(true);
      try {
        const [invRes, billRes, empRes, vendorRes, customerRes, itemsRes] = await Promise.allSettled([
          can('invoices:read')  ? api.get(`/ovds/invoices?search=${encodeURIComponent(query)}&limit=4`, { headers: { 'x-background': '1' } } as any) : Promise.reject(),
          can('bills:read')     ? api.get(`/ovds/bills?search=${encodeURIComponent(query)}&limit=3`, { headers: { 'x-background': '1' } } as any)    : Promise.reject(),
          can('employees:read') ? api.get(`/hr/employees?search=${encodeURIComponent(query)}&take=3`, { headers: { 'x-background': '1' } } as any) : Promise.reject(),
          can('bills:read')     ? api.get(`/ovds/vendors?search=${encodeURIComponent(query)}&limit=3`, { headers: { 'x-background': '1' } } as any)   : Promise.reject(),
          can('crm:read')       ? api.get(`/ovds/customers?search=${encodeURIComponent(query)}&limit=3`, { headers: { 'x-background': '1' } } as any) : Promise.reject(),
          can('items:read')     ? api.get(`/ovds/inventory/items?search=${encodeURIComponent(query)}&limit=3`, { headers: { 'x-background': '1' } } as any)     : Promise.reject(),
        ]);

        const results: SearchResult[] = [];

        if (invRes.status === 'fulfilled') {
          const invs = invRes.value.data?.data?.invoices ?? invRes.value.data?.data ?? [];
          (Array.isArray(invs) ? invs : []).slice(0, 4).forEach((inv: any) => {
            results.push({
              id: `inv-${inv.id}`,
              type: 'invoice',
              label: inv.invoiceNumber,
              sublabel: `${inv.customerName ?? inv.customer} · ETB ${Number(inv.totalAmount).toLocaleString()}`,
              icon: <Icon name="INVOICE" size={14} className="text-teal-500" />,
              to: '/sales/invoices',
              badge: inv.status,
              badgeColor: inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700',
            });
          });
        }

        if (billRes.status === 'fulfilled') {
          const bills = billRes.value.data?.data?.bills ?? billRes.value.data?.data ?? [];
          (Array.isArray(bills) ? bills : []).slice(0, 3).forEach((bill: any) => {
            results.push({
              id: `bill-${bill.id}`,
              type: 'bill',
              label: bill.billNumber ?? bill.reference ?? `Bill #${bill.id.slice(0, 8)}`,
              sublabel: `${bill.vendorName ?? bill.vendor} · ETB ${Number(bill.total ?? bill.amount).toLocaleString()}`,
              icon: <Icon name="VENDOR" size={14} className="text-rose-500" />,
              to: '/purchases/bills',
              badge: bill.status,
              badgeColor: bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
            });
          });
        }

        if (empRes.status === 'fulfilled') {
          const emps = empRes.value.data?.data?.data ?? empRes.value.data?.data ?? [];
          (Array.isArray(emps) ? emps : []).slice(0, 3).forEach((emp: any) => {
            results.push({
              id: `emp-${emp.id}`,
              type: 'employee',
              label: `${emp.firstName} ${emp.lastName}`,
              sublabel: `${emp.employeeId} · ${emp.department?.name ?? emp.designation ?? ''}`,
              icon: <Icon name="EMPLOYEE" size={14} className="text-emerald-600" />,
              to: '/hr/employees',
            });
          });
        }

        if (vendorRes.status === 'fulfilled') {
          const vendors = vendorRes.value.data?.data ?? [];
          (Array.isArray(vendors) ? vendors : []).slice(0, 3).forEach((v: any) => {
            results.push({
              id: `vendor-${v.id}`,
              type: 'bill' as const,
              label: v.name,
              sublabel: `Vendor · ${v.email ?? v.phone ?? ''}`,
              icon: <Icon name="COMPANY" size={14} className="text-slate-500" />,
              to: '/purchases/vendors',
              badge: 'Vendor',
              badgeColor: 'bg-slate-100 text-slate-600',
            });
          });
        }

        if (customerRes.status === 'fulfilled') {
          const customers = customerRes.value.data?.data ?? [];
          (Array.isArray(customers) ? customers : []).slice(0, 3).forEach((c: any) => {
            results.push({
              id: `cust-${c.id}`,
              type: 'invoice' as const,
              label: c.name,
              sublabel: `Customer · ${c.email ?? c.phone ?? ''}`,
              icon: <Icon name="CUSTOMER" size={14} className="text-teal-500" />,
              to: `/customer-summary/${c.id}`,
              badge: c.loyaltyTier ?? 'Customer',
              badgeColor: c.loyaltyTier === 'PLATINUM' ? 'bg-violet-100 text-violet-700' : c.loyaltyTier === 'GOLD' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600',
            });
          });
        }

        if (itemsRes.status === 'fulfilled') {
          const items = itemsRes.value.data?.data?.data ?? itemsRes.value.data?.data ?? [];
          (Array.isArray(items) ? items : []).slice(0, 3).forEach((item: any) => {
            results.push({
              id: `item-${item.id}`,
              type: 'action' as const,
              label: item.name,
              sublabel: `${item.code ?? ''} · ${item.category ?? 'Item'} · ETB ${Number(item.price ?? 0).toLocaleString()}`,
              icon: <Icon name="ITEM" size={14} className="text-amber-500" />,
               to: '/items',
              badge: item.stock != null ? (item.stock <= 0 ? 'Out of stock' : `${item.stock} in stock`) : undefined,
              badgeColor: item.stock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
            });
          });
        }

        setDocResults(results);
      } catch { /* silent */ }
      finally { setDocLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, can]);

  // Build filtered nav results — fuzzy search via Fuse.js (keywords + label + path)
  const navResults: SearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    const fuse = new Fuse(navItems, {
      keys: [
        { name: 'label',    weight: 0.6 },
        { name: 'keywords', weight: 0.35 },
        { name: 'to',       weight: 0.05 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      includeScore: true,
    });
    return fuse.search(query)
      .slice(0, 8)
      .map((r: any) => ({
        id: `nav-${r.item.to}`,
        type: 'page' as const,
        label: r.item.i18nKey ? t(r.item.i18nKey, { defaultValue: r.item.label }) : r.item.label,
        sublabel: r.item.to,
        icon: (r.item.icon as any) ?? <Icon name="SEARCH" size={14} className="text-slate-400" />,
        to: r.item.to,
        badge: location.pathname === r.item.to ? 'Current' : undefined,
        badgeColor: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
      }));
  }, [query, navItems, location.pathname, t]);

  // All results combined
  const allResults = useMemo(() => {
    if (!query.trim()) return quickActions;
    return [...navResults, ...docResults];
  }, [query, navResults, docResults, quickActions]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && allResults[activeIdx]) {
      handleSelect(allResults[activeIdx]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResults, activeIdx]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.action) { result.action(); onClose(); return; }
    if (result.to) {
      navigate(result.to);
      // Save to recent searches
      if (query.trim()) {
        setRecentSearches(prev => [query.trim(), ...prev.filter(s => s !== query.trim())].slice(0, 5));
      }
      onClose();
    }
  }, [navigate, onClose, query, setRecentSearches]);

  if (!open) return null;

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showQuickActions = !query.trim();

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[500] flex items-start justify-center pt-[12vh] px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Icon name="SEARCH" size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, invoices, employees, actions…"
            className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none bg-transparent"
          />
          {docLoading && (
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {query && (
            <button onClick={() => { setQuery(''); setActiveIdx(0); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <Icon name="CLOSE" size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded text-[9px] font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
          {/* Recent searches */}
          {showRecent && (
            <>
              <SectionLabel label="Recent Searches" />
              {recentSearches.map((s, i) => (
                <button key={i} onClick={() => setQuery(s)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon name="CLOCK" size={13} className="text-slate-400" />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{s}</span>
                  <button
                    className="text-slate-300 hover:text-slate-500 transition-colors"
                    onClick={e => { e.stopPropagation(); setRecentSearches(prev => prev.filter(x => x !== s)); }}
                  >
                    <Icon name="CLOSE" size={11} />
                  </button>
                </button>
              ))}
            </>
          )}

          {/* Quick actions (empty query) */}
          {showQuickActions && (
            <>
              <SectionLabel label="Quick Actions" />
              {quickActions.map((r, i) => (
                <div key={r.id} data-idx={i}>
                  <ResultRow result={r} active={i === activeIdx} onSelect={() => handleSelect(r)} onHover={() => setActiveIdx(i)} />
                </div>
              ))}
            </>
          )}

          {/* Nav results */}
          {query.trim() && navResults.length > 0 && (
            <>
              <SectionLabel label="Pages" />
              {navResults.map((r, i) => (
                <div key={r.id} data-idx={i}>
                  <ResultRow result={r} active={i === activeIdx} onSelect={() => handleSelect(r)} onHover={() => setActiveIdx(i)} />
                </div>
              ))}
            </>
          )}

          {/* Document results */}
          {query.trim() && docResults.length > 0 && (
            <>
              <SectionLabel label="Documents & Records" />
              {docResults.map((r, i) => {
                const idx = navResults.length + i;
                return (
                  <div key={r.id} data-idx={idx}>
                    <ResultRow result={r} active={idx === activeIdx} onSelect={() => handleSelect(r)} onHover={() => setActiveIdx(idx)} />
                  </div>
                );
              })}
            </>
          )}

          {/* No results */}
          {query.trim() && !docLoading && allResults.length === 0 && (
            <div className="py-10 text-center text-slate-400">
              <Icon name="SEARCH" size={24} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-semibold">No results for "{query}"</p>
              <p className="text-xs mt-1">Try searching for an invoice number, employee name, or page</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['invoices', 'payroll', 'vat', 'employees', 'reports'].map(tip => (
                  <button key={tip} onClick={() => setQuery(tip)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-emerald-50 dark:bg-emerald-950/20 hover:text-emerald-600 dark:text-emerald-400 transition-colors">
                    {tip}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium">ESC</kbd> close</span>
          {query.trim() && allResults.length > 0 && (
            <span className="ml-auto flex items-center gap-2">
              {navResults.length > 0 && <span className="text-slate-400">{navResults.length} page{navResults.length !== 1 ? 's' : ''}</span>}
              {docResults.length > 0 && <span className="text-slate-400">{docResults.length} record{docResults.length !== 1 ? 's' : ''}</span>}
            </span>
          )}
          {!query.trim() && <span className="ml-auto">{quickActions.length} quick actions</span>}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;





