/**
 * @ovds/ui — SavedViews
 *
 * Saved view management system for enterprise tables:
 *   - Create, update, delete saved views
 *   - Default/system view support
 *   - LocalStorage persistence
 *   - Server-sync placeholder
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Star, MoreVertical, Trash2, Copy, Edit2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { SavedView } from './types';

export interface SavedViewSelectorProps {
  views: SavedView[];
  activeViewId: string | null;
  onChange: (view: SavedView) => void;
  onCreate?: (name: string) => void;
  onUpdate?: (view: SavedView) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (view: SavedView) => void;
  storageKey: string;
  allowCreate?: boolean;
  allowDelete?: boolean;
  allowDuplicate?: boolean;
}

export function SavedViewSelector({
  views,
  activeViewId,
  onChange,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  storageKey,
  allowCreate = true,
  allowDelete = true,
  allowDuplicate = true,
}: SavedViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);
  const [editName, setEditName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const activeView = views.find((v) => v.id === activeViewId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setEditingView(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = () => {
    const name = `View ${views.length + 1}`;
    onCreate?.(name);
    setIsOpen(false);
  };

  const startEditing = (view: SavedView) => {
    setEditingView(view);
    setEditName(view.name);
  };

  const saveEdit = () => {
    if (editingView && editName.trim()) {
      onUpdate?.({ ...editingView, name: editName.trim() });
    }
    setEditingView(null);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all min-w-[140px]',
          activeView
            ? 'bg-aki-blue-50 dark:bg-aki-blue-950/30 border-aki-blue-200 dark:border-aki-blue-800 text-aki-blue dark:text-blue-400'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
        )}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
        <span className="truncate">{activeView?.name ?? 'All Records'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saved Views</p>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            {views.map((view) => (
              <div
                key={view.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all',
                  view.id === activeViewId
                    ? 'bg-aki-blue-50 dark:bg-aki-blue-950/30 text-aki-blue dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
                )}
                onClick={() => {
                  onChange(view);
                  setIsOpen(false);
                }}
              >
                <Star
                  size={12}
                  className={cn(
                    'shrink-0',
                    view.isDefault
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-600',
                  )}
                />
                <span className="flex-1 text-[12px] font-medium truncate">{view.name}</span>
                {view.isSystem && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase">System</span>
                )}

                {/* Action menu */}
                <div className="relative group/actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover/actions:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <MoreVertical size={12} />
                  </button>

                  <div
                    className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden opacity-0 group-hover/actions:opacity-100 invisible group-hover/actions:visible transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allowCreate && (
                      <button
                        onClick={() => startEditing(view)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <Edit2 size={12} /> Rename
                      </button>
                    )}
                    {allowDuplicate && onDuplicate && (
                      <button
                        onClick={() => {
                          onDuplicate(view);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                    )}
                    {allowDelete && onDelete && !view.isSystem && (
                      <button
                        onClick={() => {
                          onDelete(view.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allowCreate && onCreate && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCreate}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-aki-blue dark:text-blue-400 hover:bg-aki-blue-50 dark:hover:bg-aki-blue-950/20 transition-all"
              >
                <Plus size={12} /> Create new view
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CreateViewDialog
// ============================================================================

export interface CreateViewDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => void;
}

export function CreateViewDialog({ open, onClose, onCreate }: CreateViewDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Create Saved View</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              View Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Overdue Invoices"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aki-blue/20 focus:border-aki-blue"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aki-blue/20 focus:border-aki-blue resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 bg-aki-blue text-white rounded-xl text-[12px] font-semibold hover:bg-aki-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-aki-blue/20"
          >
            Create View
          </button>
        </div>
      </div>
    </div>
  );
}
