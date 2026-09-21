/**
 * ovdsEmptyState — ovds-style empty state for ovds list pages
 * Plain-language messaging with a clear call-to-action
 * Used by: Bills, Invoices, Expenses, Vendors, Customers, Items
 */
import React from 'react';
import { Plus, FileText, Receipt, CreditCard, Users, Building2, Package } from 'lucide-react';

type EntityType = 'invoice' | 'bill' | 'expense' | 'customer' | 'vendor' | 'item' | 'generic';

const ENTITY_CONFIG: Record<EntityType, {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
}> = {
  invoice: {
    icon: <FileText size={28} />,
    title: 'No invoices yet',
    description: 'Create your first invoice to start billing customers and tracking payments.',
    actionLabel: 'Create Invoice',
  },
  bill: {
    icon: <Receipt size={28} />,
    title: 'No bills recorded',
    description: 'Add vendor bills to track what you owe and manage your accounts payable.',
    actionLabel: 'Add Bill',
  },
  expense: {
    icon: <CreditCard size={28} />,
    title: 'No expenses logged',
    description: 'Log business expenses to track spending and prepare for tax time.',
    actionLabel: 'Log Expense',
  },
  customer: {
    icon: <Users size={28} />,
    title: 'No customers added',
    description: 'Add your first customer to start creating invoices and tracking payments.',
    actionLabel: 'Add Customer',
  },
  vendor: {
    icon: <Building2 size={28} />,
    title: 'No vendors registered',
    description: 'Register your suppliers to manage bills and track accounts payable.',
    actionLabel: 'Add Vendor',
  },
  item: {
    icon: <Package size={28} />,
    title: 'No items created',
    description: 'Add products or services to quickly add them to invoices and bills.',
    actionLabel: 'Add Item',
  },
  generic: {
    icon: <FileText size={28} />,
    title: 'Nothing here yet',
    description: 'Get started by creating your first record.',
    actionLabel: 'Get Started',
  },
};

interface ovdsEmptyStateProps {
  type?: EntityType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Show when search/filter returns no results */
  isFiltered?: boolean;
  onClearFilters?: () => void;
  icon?: React.ReactNode;
}

export const OvdsEmptyState: React.FC<ovdsEmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
  isFiltered,
  onClearFilters,
  icon,
}) => {
  const cfg = ENTITY_CONFIG[type];

  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
          <FileText size={22} />
        </div>
        <p className="text-[13px] font-bold text-slate-600 mb-1">No results found</p>
        <p className="text-[11px] text-slate-400 mb-4 max-w-[260px] leading-relaxed">
          Try adjusting your search or filters to find what you're looking for.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[12px] font-semibold transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-3xl bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] flex items-center justify-center text-[var(--pro-azure-light)] mb-5 shadow-sm">
        {icon ?? cfg.icon}
      </div>

      {/* Text */}
      <p className="text-[14px] font-bold text-slate-700 mb-2">{title ?? cfg.title}</p>
      <p className="text-[12px] text-slate-400 mb-6 max-w-[280px] leading-relaxed">
        {description ?? cfg.description}
      </p>

      {/* CTA */}
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-[12px] font-bold transition-all shadow-sm shadow-green-500/20 hover:shadow-md hover:shadow-green-500/25"
        >
          <Plus size={14} />
          {actionLabel ?? cfg.actionLabel}
        </button>
      )}
    </div>
  );
};

export default OvdsEmptyState;

