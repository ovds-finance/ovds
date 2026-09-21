import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '../ui';

interface QuickAction {
  label: string;
  icon: string;
  to: string;
  color: string;
  description?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'New Invoice', icon: 'INVOICE', to: '/sales/invoices', color: 'bg-sky-500 hover:bg-sky-600', description: 'Create a new invoice' },
  { label: 'New Bill', icon: 'VENDOR', to: '/purchases/bills', color: 'bg-violet-500 hover:bg-violet-600', description: 'Record a new bill' },
  { label: 'New Expense', icon: 'MONEY', to: '/purchases/expenses', color: 'bg-amber-500 hover:bg-amber-600', description: 'Log an expense' },
  { label: 'New Customer', icon: 'CUSTOMER', to: '/customers', color: 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)]', description: 'Add a customer' },
  { label: 'New Vendor', icon: 'COMPANY', to: '/purchases/vendors', color: 'bg-rose-500 hover:bg-rose-600', description: 'Add a vendor' },
  { label: 'Journal Entry', icon: 'FILE_TEXT', to: '/double-entry/journals', color: 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)]', description: 'Record a journal entry' },
];

const QuickActionFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAction = (to: string) => {
    setIsOpen(false);
    navigate(to);
  };

  return (
    <div ref={fabRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Action Menu */}
      {isOpen && (
        <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {QUICK_ACTIONS.map((action, index) => (
            <button
              key={action.label}
              onClick={() => handleAction(action.to)}
              className="group flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{action.label}</p>
                {action.description && (
                  <p className="text-[10px] text-slate-400">{action.description}</p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110`}>
                <Icon name={action.icon as any} size={18} className="text-white" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-2xl transition-all duration-300 hover:shadow-green-500/25 hover:scale-105 active:scale-95 ${
          isOpen ? 'rotate-45 bg-slate-800 dark:bg-slate-200' : ''
        }`}
      >
        <Icon name="PLUS" size={24} className="transition-transform duration-300" />
      </button>
    </div>
  );
};

export default QuickActionFAB;
