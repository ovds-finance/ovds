/**
 * ovdsQuickActions — ovds-style quick action tiles
 * Large, icon-forward tiles that non-accountants can understand at a glance
 * Each tile has a plain-language description of what it does
 */
import {
  FileText, Receipt, CreditCard, Users, Building2,
  ArrowLeftRight, BarChart3, Package, ShieldCheck,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../rbac/AuthContext';
import type { Permission } from '../../rbac/rbac';

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color: string;       // bg color class
  textColor: string;   // text color class
  permission?: Permission;
  isNew?: boolean;
}

const ACTIONS: QuickAction[] = [
  {
    label: 'New Invoice',
    description: 'Bill a customer',
    icon: <FileText size={20} />,
    to: '/sales/invoices',
    color: 'bg-[var(--pro-azure-50)]0',
    textColor: 'text-white',
    permission: 'invoices:write',
  },
  {
    label: 'Record Bill',
    description: 'Log a vendor bill',
    icon: <Receipt size={20} />,
    to: '/purchases/bills',
    color: 'bg-sky-500',
    textColor: 'text-white',
    permission: 'bills:write',
  },
  {
    label: 'Log Expense',
    description: 'Track a business cost',
    icon: <CreditCard size={20} />,
    to: '/purchases/expenses',
    color: 'bg-amber-500',
    textColor: 'text-white',
    permission: 'expenses:write',
  },
  {
    label: 'Add Customer',
    description: 'Create a new client',
    icon: <Users size={20} />,
    to: '/accounting/hub?tab=CUSTOMERS',
    color: 'bg-violet-500',
    textColor: 'text-white',
    permission: 'ovds:read',
  },
  {
    label: 'Add Vendor',
    description: 'Register a supplier',
    icon: <Building2 size={20} />,
    to: '/accounting/hub?tab=VENDORS',
    color: 'bg-rose-500',
    textColor: 'text-white',
    permission: 'bills:write',
  },
  {
    label: 'Transfer Funds',
    description: 'Move between accounts',
    icon: <ArrowLeftRight size={20} />,
    to: '/banking/transfers',
    color: 'bg-[var(--pro-azure-50)]0',
    textColor: 'text-white',
    permission: 'fund_transfers:write',
  },
  {
    label: 'View Reports',
    description: 'Financial statements',
    icon: <BarChart3 size={20} />,
    to: '/reports',
    color: 'bg-teal-500',
    textColor: 'text-white',
    permission: 'reports:read',
  },
  {
    label: 'Manage Items',
    description: 'Products & services',
    icon: <Package size={20} />,
    to: '/items',
    color: 'bg-orange-500',
    textColor: 'text-white',
    permission: 'items:read',
  },
  {
    label: 'Tax Dashboard',
    description: 'VAT & compliance',
    icon: <ShieldCheck size={20} />,
    to: '/tax/dashboard',
    color: 'bg-slate-700',
    textColor: 'text-white',
    permission: 'vat:read',
  },
];

interface ovdsQuickActionsProps {
  compact?: boolean;
}

export const ovdsQuickActions: React.FC<ovdsQuickActionsProps> = ({ compact }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = useNavigate();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { can } = useAuth();

  const visible = ACTIONS.filter(a => !a.permission || can(a.permission));

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {visible.slice(0, 6).map(action => (
          <button
            key={action.to}
            onClick={() => navigate(action.to)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl ${action.color} ${action.textColor}
                        text-[12px] font-semibold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]
                        shadow-sm`}
          >
            {React.cloneElement(action.icon as React.ReactElement<any>, { size: 14 })}
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {visible.map(action => (
        <button
          key={action.to}
          onClick={() => navigate(action.to)}
          className="group relative flex flex-col items-center gap-2.5 p-4 ovds-widget-card
                     hover:border-[var(--pro-azure-100)] dark:hover:border-green-800
                     hover:-translate-y-0.5 transition-all duration-150
                     text-center focus:outline-none focus:ring-2 focus:ring-teal-400/30"
        >
          {action.isNew && (
            <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full
                             bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] uppercase tracking-wide">
              New
            </span>
          )}
          <div className={`w-11 h-11 rounded-2xl ${action.color} ${action.textColor}
                           flex items-center justify-center
                           group-hover:scale-110 transition-transform duration-150`}>
            {action.icon}
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-800 leading-tight">{action.label}</p>
            <p className="ovds-caption mt-0.5 leading-tight">{action.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ovdsQuickActions;

