import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../rbac/AuthContext';
import { useLocalStorage } from '../../hooks';
import type { Permission } from '../../rbac/rbac';
import { Icon } from '../ui';
import { IconType } from '@ovds/ui';

interface QuickAction {
  label: string;
  icon: IconType;
  to: string;
  color: string;
  permission?: Permission;
  category: string;
}

const ALL_ACTIONS: QuickAction[] = [
  // ovds
  { label: 'New Invoice',      icon: 'FILE_TEXT',       to: '/sales/invoices?action=new',         color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'invoices:write',       category: 'ovds' },
  { label: 'New Bill',         icon: 'RECEIPT',         to: '/purchases/bills?action=new',            color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'bills:write',          category: 'ovds' },
  { label: 'New Estimate',     icon: 'CLIPBOARD_LIST',  to: '/sales/estimates?action=new',        color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'invoices:write',       category: 'Sales' },
  { label: 'Credit Note',      icon: 'FILE_TEXT',       to: '/sales/credit-notes?action=new',     color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'invoices:write',       category: 'Sales' },
  { label: 'Sales DBN',        icon: 'FILE_TEXT',       to: '/sales/debit-notes?action=new',      color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'invoices:write',       category: 'Sales' },
  { label: 'Sales Order',      icon: 'INVOICE',         to: '/sales/orders?action=new',     color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'invoices:read',        category: 'Sales' },
  { label: 'New Customer',     icon: 'CUSTOMER',        to: '/crm/contacts?action=new',     color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'crm:read',             category: 'Sales' },
  { label: 'Debit Note',       icon: 'FILE_TEXT',       to: '/purchases/debit-notes?action=new',      color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'bills:write',          category: 'Purchase' },
  { label: 'Purchase Order',   icon: 'PROJECT',         to: '/purchases/orders?action=new',  color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'purchase_orders:read', category: 'Purchase' },
  { label: 'New Vendor',       icon: 'CONTACT',         to: '/purchases/vendors?action=new',          color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'bills:write',          category: 'Purchase' },
  { label: 'Expense Claim',    icon: 'CLIPBOARD_LIST',  to: '/purchases/expenses?action=new',         color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'expenses:write',       category: 'ovds' },
  { label: 'New Item',         icon: 'ITEM',            to: '/items?action=new',            color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'items:write',          category: 'ovds' },
  { label: 'ovds Hub',      icon: 'WALLET',          to: '/ovds',                     color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', category: 'ovds' },
  { label: 'Journal Entry',    icon: 'BOOK_OPEN',       to: '/accounting?action=journal',   color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'ovds:write',        category: 'ovds' },
  { label: 'Inventory',        icon: 'ITEM',            to: '/inventory',                   color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'inventory:read',       category: 'ovds' },
  // Banking
  { label: 'Fund Transfer',    icon: 'ARROW_LEFT_RIGHT', to: '/banking/transfers',             color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'ovds:write',        category: 'Banking' },
  { label: 'Bank Accounts',    icon: 'BANK',             to: '/banking/accounts',           color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'ovds:read',         category: 'Banking' },
  { label: 'Transactions',     icon: 'REFRESH',          to: '/banking/transactions',               color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'ovds:read',         category: 'Banking' },
  { label: 'Reconciliation',   icon: 'REFRESH_CW',       to: '/banking/reconciliation',        color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'bank_reconciliation:read', category: 'Banking' },
  // Payroll & HR
  { label: 'Generate Payroll', icon: 'BANKNOTE',        to: '/hr/payroll?action=generate',     color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'payroll:generate',     category: 'Payroll' },
  { label: 'Add Employee',     icon: 'USERS',           to: '/hr/employees?action=add',        color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'employees:write',      category: 'HR' },
  // Tax & Compliance
  { label: 'VAT Filing',       icon: 'SHIELD_CHECK',    to: '/tax/vat',                         color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'vat:write',            category: 'Compliance' },
  { label: 'Tax Dashboard',    icon: 'CALCULATOR',      to: '/tax/dashboard',               color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'vat:read',             category: 'Compliance' },
  { label: 'Disaster Fund',    icon: 'SHIELD',          to: '/disaster-fund',               color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'disaster_fund:read',   category: 'Compliance' },
  { label: 'eTax Portal',      icon: 'GLOBE',           to: 'https://etax.erca.gov.et',     color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'vat:read',             category: 'Compliance' },
  // Reports & Business
  { label: 'Reports',          icon: 'CHART',           to: '/reports',                     color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', category: 'Reports' },
  { label: 'P&L Report',       icon: 'TREND_UP',        to: '/reports?type=pl',             color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'reports:read',         category: 'Reports' },
  { label: 'Companies',        icon: 'COMPANY',         to: '/companies',                   color: 'bg-white text-slate-800 border-slate-100 hover:border-emerald-500 hover:shadow-sm', permission: 'companies:read',       category: 'Business' },
];

const CATEGORIES_ORDER = ['All', 'ovds', 'Sales', 'Purchase', 'Banking', 'Payroll', 'HR', 'Compliance', 'Reports', 'Business'];

interface QuickActionsBarProps {
  noCard?: boolean;
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ noCard = false }) => {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [expanded, setExpanded] = useLocalStorage<boolean>('quick_actions_expanded', true);
  const [activeCategory, setActiveCategory] = useLocalStorage<string>('quick_actions_category', 'All');
  const [pinnedKeys, setPinnedKeys] = useLocalStorage<string[]>('quick_actions_pinned', []);

  const visible = ALL_ACTIONS.filter(a => !a.permission || can(a.permission));
  const filtered = activeCategory === 'All' ? visible : visible.filter(a => a.category === activeCategory);
  const availableCategories = CATEGORIES_ORDER.filter(c => c === 'All' || visible.some(a => a.category === c));

  const togglePin = (key: string) => {
    setPinnedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const pinnedActions = visible.filter(a => pinnedKeys.includes(a.to));
  const showPinned = pinnedActions.length > 0 && activeCategory === 'All';

  return (
    <div className={noCard ? 'overflow-hidden' : 'bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden'}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Icon name="ZAP" size={13} className="text-emerald-600" />
        </div>
        <span className="text-[13px] font-semibold text-slate-700 flex-1 text-left">
          Quick Actions
        </span>
        {pinnedActions.length > 0 && (
          <span className="text-[10px] font-medium text-amber-500 flex items-center gap-0.5">
            <Icon name="STAR" size={9} className="fill-amber-400 text-amber-400" /> {pinnedActions.length}
          </span>
        )}
        <span className="ovds-caption">{visible.length} actions</span>
        {expanded
          ? <Icon name="CHEVRON_UP" size={13} className="text-slate-400" />
          : <Icon name="CHEVRON_DOWN" size={13} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Pinned row */}
          {showPinned && (
            <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-100">
              <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider self-center flex items-center gap-0.5 mr-1">
                <Icon name="STAR" size={8} className="fill-amber-400 text-amber-400" /> Pinned
              </span>
              {pinnedActions.map(action => (
                <button
                  key={action.label + '_pinned'}
                  onClick={() => action.to.startsWith('http') ? window.open(action.to, '_blank') : navigate(action.to)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95"
                >
                  <Icon name={action.icon} size={13} />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Actions grid */}
          <div className="flex flex-wrap gap-2">
            {filtered.map(action => {
              const isPinned = pinnedKeys.includes(action.to);
              return (
                <div key={action.label} className="relative group/action">
                  <button
                    onClick={() => action.to.startsWith('http') ? window.open(action.to, '_blank') : navigate(action.to)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95 shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon name={action.icon} size={12} className="text-slate-500" />
                    </div>
                    {action.label}
                  </button>
                  <button
                    onClick={() => togglePin(action.to)}
                    title={isPinned ? 'Unpin' : 'Pin to top'}
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/action:opacity-100 ${
                      isPinned ? 'bg-amber-400 text-white opacity-100' : 'bg-slate-200 text-slate-500 hover:bg-amber-400 hover:text-white'
                    }`}
                  >
                    <Icon name="STAR" size={8} className={isPinned ? 'fill-white' : ''} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActionsBar;




