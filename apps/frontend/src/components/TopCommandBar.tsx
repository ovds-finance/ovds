import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../rbac/AuthContext';

import { Icon } from './ui';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface TopCommandBarProps {
  onOpenSearch?: () => void;
}

const QUICK_ACTIONS: { label: string; icon: IconName; to: string; shortcut: string; color: string }[] = [
  { label: 'Invoice',  icon: 'INVOICE',   to: '/sales/invoices',        shortcut: 'N', color: 'bg-[var(--pro-azure)]' },
  { label: 'Bill',     icon: 'VENDOR',    to: '/purchases/bills',        shortcut: 'B', color: 'bg-sky-600' },
  { label: 'Expense',  icon: 'MONEY',     to: '/purchases/expenses',     shortcut: 'E', color: 'bg-amber-600' },
  { label: 'Customer', icon: 'CUSTOMER',  to: '/crm/contacts',           shortcut: 'C', color: 'bg-violet-600' },
  { label: 'Vendor',   icon: 'COMPANY',   to: '/purchases/vendors',      shortcut: 'V', color: 'bg-rose-600' },
];

const TopCommandBar: React.FC<TopCommandBarProps> = ({ onOpenSearch }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setShowQuickAdd(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement === document.body) {
        e.preventDefault();
        navigate('/sales/invoices');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onOpenSearch]);

  return (
    <header className="sticky top-0 z-50 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left: Brand + Search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--pro-azure)] to-[var(--pro-azure-dark)] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="hidden sm:block text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              OVDS
            </span>
          </div>

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all w-full max-w-xs"
          >
            <Icon name="SEARCH" size={13} />
            <span>Search...</span>
            <kbd className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Add */}
          <div className="relative" ref={quickRef}>
            <button
              onClick={() => setShowQuickAdd(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pro-azure)] text-white text-xs font-bold hover:bg-[var(--pro-azure-dark)] active:scale-[0.98] transition-all shadow-sm shadow-green-200 dark:shadow-green-900/30"
            >
              <Icon name="PLUS" size={13} />
              <span className="hidden sm:inline">Quick Add</span>
            </button>

            {showQuickAdd && (
              <>
                <div className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[1px] animate-aki-fade-in" onClick={() => setShowQuickAdd(false)} />
                <div className="fixed top-14 right-4 z-[100] w-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-aki-enter">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Create</p>
                  </div>
                  <div className="py-1">
                    {QUICK_ACTIONS.map(action => (
                      <button
                        key={action.to}
                        onClick={() => { navigate(action.to); setShowQuickAdd(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${action.color} text-white`}>
                          <Icon name={action.icon} size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{action.label}</p>
                        </div>
                        <kbd className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                          {action.shortcut}
                        </kbd>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(v => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--pro-azure)] to-[var(--pro-azure-dark)] flex items-center justify-center text-white text-xs font-bold">
                {(user?.username?.[0] ?? 'U').toUpperCase()}
              </div>
              <span className="hidden lg:block text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-[100px] truncate">
                {user?.username}
              </span>
              <Icon name="CHEVRON_DOWN" size={12} className="text-slate-400 hidden lg:block" />
            </button>

            {showProfile && (
              <>
                <div className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[1px] animate-aki-fade-in" onClick={() => setShowProfile(false)} />
                <div className="fixed top-14 right-4 z-[100] w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-aki-enter">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{user?.username}</p>
                    <p className="text-[10px] text-slate-400">{user?.role}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { navigate('/settings/users'); setShowProfile(false); }} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      Profile & Settings
                    </button>
                    <button onClick={() => { logout(); setShowProfile(false); }} className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopCommandBar;
