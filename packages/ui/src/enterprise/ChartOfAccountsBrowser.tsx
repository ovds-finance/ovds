/**
 * @ovds/ui — ChartOfAccountsBrowser
 *
 * Hierarchical global chart of accounts browser with:
 *   - Tree navigation with expand/collapse
 *   - Account type/category filtering
 *   - Search across codes and names
 *   - Entity-specific account mappings
 *   - Inline account details
 *   - Quick-add new accounts
 *   - IFRS classification display
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Info, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import type { GLAccount, AccountMapping, AccountNature } from './types';

export interface ChartOfAccountsBrowserProps {
  accounts: GLAccount[];
  mappings?: AccountMapping[];
  entityId?: string;
  onSelect?: (account: GLAccount) => void;
  onCreateAccount?: () => void;
  onEditAccount?: (account: GLAccount) => void;
  selectedCode?: string;
  showMappingBadge?: boolean;
  height?: number | string;
  className?: string;
}

type AccountFilter = 'ALL' | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export function ChartOfAccountsBrowser({
  accounts,
  mappings = [],
  entityId,
  onSelect,
  onCreateAccount,
  onEditAccount,
  selectedCode,
  showMappingBadge = true,
  height = 500,
  className,
}: ChartOfAccountsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<AccountFilter>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<GLAccount | null>(null);

  const lookup = useMemo(() => {
    const map = new Map<string, GLAccount>();
    for (const acc of accounts) map.set(acc.code, acc);
    return map;
  }, [accounts]);

  const rootAccounts = useMemo(() => {
    let result = accounts.filter((a) => !a.parentCode || a.level === 1);
    if (filter !== 'ALL') {
      result = result.filter((a) => a.type === filter);
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.code.toLowerCase().includes(lower) ||
          a.name.toLowerCase().includes(lower) ||
          a.tags?.some((t) => t.toLowerCase().includes(lower)),
      );
    }
    return result.sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, filter, searchQuery]);

  const getChildren = useCallback(
    (parentCode: string): GLAccount[] => {
      let children = accounts.filter((a) => a.parentCode === parentCode);
      if (filter !== 'ALL') {
        children = children.filter((a) => a.type === filter);
      }
      return children.sort((a, b) => a.code.localeCompare(b.code));
    },
    [accounts, filter],
  );

  const hasMapping = useCallback(
    (accountId: string) => mappings.some((m) => m.accountId === accountId && m.entityId === entityId),
    [mappings, entityId],
  );

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSelect = (account: GLAccount) => {
    setSelectedAccount(account);
    onSelect?.(account);
  };

  const renderAccount = (account: GLAccount, depth = 0) => {
    const children = getChildren(account.code);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCodes.has(account.code);
    const isSelected = selectedCode === account.code;
    const mapped = showMappingBadge && hasMapping(account.id);
    const indent = depth * 16;

    return (
      <div key={account.code}>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all group',
            isSelected
              ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]-950/30 text-[var(--pro-azure)] dark:text-blue-400'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
          )}
          style={{ paddingLeft: indent + 8 }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(account.code)}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <span
            className={cn(
              'text-[11px] font-mono font-bold shrink-0',
              isSelected && 'text-[var(--pro-azure)] dark:text-blue-400',
            )}
          >
            {account.code}
          </span>

          <span className="flex-1 text-[12px] font-medium truncate">{account.name}</span>

          <NatureBadge nature={account.nature} />

          {mapped && (
            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] border border-[var(--pro-azure-100)] dark:border-green-800">
              Mapped
            </span>
          )}

          {!account.isActive && (
            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
              Inactive
            </span>
          )}

          {onEditAccount && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditAccount(account);
              }}
              className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Info size={12} />
            </button>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {children.map((child) => renderAccount(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts..."
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as AccountFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                filter === f
                  ? 'bg-[var(--pro-azure)] text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              {f === 'ALL' ? 'All' : f.slice(0, 1)}
            </button>
          ))}
        </div>

        {onCreateAccount && (
          <button
            onClick={onCreateAccount}
            className="w-8 h-8 rounded-xl bg-[var(--pro-azure)] text-white flex items-center justify-center hover:bg-[var(--pro-azure-dark)] transition-all shrink-0"
            title="Add account"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2" style={{ height }}>
        {rootAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-3">
              <FileText size={16} className="text-slate-300" />
            </div>
            <p className="text-[12px] font-semibold text-slate-500">No accounts found</p>
          </div>
        ) : (
          rootAccounts.map((account) => renderAccount(account))
        )}
      </div>

      {/* Detail panel */}
      {selectedAccount && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500">{selectedAccount.code}</p>
              <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{selectedAccount.name}</p>
            </div>
            <NatureBadge nature={selectedAccount.nature} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-slate-400">Type</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedAccount.type}</p>
            </div>
            <div>
              <p className="text-slate-400">Category</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedAccount.category}</p>
            </div>
            <div>
              <p className="text-slate-400">Level</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedAccount.level}</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className={cn(
                'font-semibold',
                selectedAccount.isActive ? 'text-[var(--pro-azure-dark)]' : 'text-slate-400',
              )}>
                {selectedAccount.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          {selectedAccount.tags && selectedAccount.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedAccount.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NatureBadge({ nature }: { nature: AccountNature }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
        nature === 'DEBIT'
          ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      )}
    >
      {nature}
    </span>
  );
}
