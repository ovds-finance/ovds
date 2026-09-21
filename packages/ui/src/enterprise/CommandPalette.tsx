/**
 * @ovds/ui — CommandPalette
 *
 * Global command palette (CMD+K / Ctrl+K) for enterprise applications.
 * Provides instant access to navigation, actions, and search across the entire system.
 *
 * Enterprise UX rule: A clerk with a specific customer ID doesn't want to scroll
 * through a three-level sidebar tree. They want CMD+K that returns the record
 * in three keystrokes.
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import type { CommandPaletteAction } from './types';

export interface CommandPaletteProps {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  actions: CommandPaletteAction[];
  recentActions: string[];
  onQueryChange: (query: string) => void;
  onSelect: (index: number) => void;
  onExecute: (action: CommandPaletteAction) => void;
  onClose: () => void;
  placeholder?: string;
  title?: string;
}

export function CommandPalette({
  isOpen,
  query,
  selectedIndex,
  actions,
  recentActions,
  onQueryChange,
  onSelect,
  onExecute,
  onClose,
  placeholder = 'Search commands, records, actions...',
  title = 'Command Palette',
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      onQueryChange('');
    }
  }, [isOpen, onQueryChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onSelect(Math.min(selectedIndex + 1, actions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSelect(Math.max(selectedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (actions[selectedIndex]) onExecute(actions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, actions, onSelect, onExecute, onClose]);

  useEffect(() => {
    const selected = listRef.current?.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const recentActionsList = useMemo(() => {
    return actions.filter((a) => recentActions.includes(a.id));
  }, [actions, recentActions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Body */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {!query && recentActionsList.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent</p>
              {recentActionsList.map((action, i) => (
                <CommandPaletteItem
                  key={action.id}
                  action={action}
                  index={i}
                  selected={selectedIndex === i}
                  onSelect={onSelect}
                  onExecute={onExecute}
                />
              ))}
            </div>
          )}

          {query && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {actions.length} result{actions.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-3">
                <Search size={16} className="text-slate-300" />
              </div>
              <p className="text-[12px] font-semibold text-slate-500">No results found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            actions.map((action, i) => (
              <CommandPaletteItem
                key={action.id}
                action={action}
                index={query ? i : i + recentActionsList.length}
                selected={selectedIndex === (query ? i : i + recentActionsList.length)}
                onSelect={onSelect}
                onExecute={onExecute}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold">ESC</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandPaletteItem({
  action,
  index,
  selected,
  onSelect,
  onExecute,
}: {
  action: CommandPaletteAction;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
  onExecute: (action: CommandPaletteAction) => void;
}) {
  return (
    <button
      data-selected={selected}
      onClick={() => onExecute(action)}
      onMouseEnter={() => onSelect(index)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
        selected
          ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]-950/30 text-[var(--pro-azure)] dark:text-blue-400'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
        selected
          ? 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure)]-900/50 text-[var(--pro-azure)] dark:text-blue-400'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
      )}>
        {action.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate">{action.label}</p>
        {action.keywords && action.keywords.length > 0 && (
          <p className="text-[10px] text-slate-400 truncate">{action.keywords.join(', ')}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action.badge && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {action.badge}
          </span>
        )}
        {action.shortcut && (
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
            {action.shortcut}
          </kbd>
        )}
      </div>
    </button>
  );
}
