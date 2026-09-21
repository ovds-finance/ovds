/**
 * TabManager — Browser-like persistent multi-tab navigation
 *
 * Allows users to keep multiple pages open simultaneously (e.g., an invoice
 * and a device telemetry stream side by side).
 *
 * Features:
 *   - Up to 12 simultaneous tabs
 *   - Drag-and-drop reordering (@dnd-kit)
 *   - Pinned tabs (persist across sessions)
 *   - Middle-click or × to close
 *   - Cmd+T / Ctrl+T opens current route in new tab
 *   - Tab state persisted to localStorage
 */
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Icon } from '../ui';

export interface Tab {
  id: string;
  path: string;
  title: string;
  icon?: string;
  pinned?: boolean;
  closeable?: boolean;
}

interface TabManagerContextValue {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (path: string, title: string, icon?: string) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  pinTab: (id: string) => void;
  reorderTabs: (oldIndex: number, newIndex: number) => void;
}

const TabManagerContext = createContext<TabManagerContextValue | null>(null);

const MAX_TABS = 12;
const STORAGE_KEY = 'ovds_tabs_v2';

function generateTabId() {
  return Math.random().toString(36).slice(2, 10);
}

// Map route prefixes to display icons
const ROUTE_ICONS: [RegExp, string][] = [
  [/^\/dashboard/, 'DASHBOARD'],
  [/^\/invoices/, 'INVOICE'],
  [/^\/bills/, 'INVOICE'],
  [/^\/iot/, 'MONITOR'],
  [/^\/vat/, 'SHIELD_CHECK'],
  [/^\/tax/, 'PERCENT'],
  [/^\/reports/, 'BAR_CHART_2'],
  [/^\/employees/, 'EMPLOYEE'],
  [/^\/payroll/, 'BANKNOTE'],
  [/^\/accounting/, 'CHART'],
  [/^\/crm/, 'CONTACT'],
  [/^\/settings/, 'SETTINGS'],
  [/^\/projects/, 'PROJECT'],
  [/^\/customers/, 'CUSTOMER'],
  [/^\/vendors/, 'VENDOR'],
  [/^\/inventory/, 'INVENTORY'],
];

function iconForPath(path: string): string {
  for (const [pattern, icon] of ROUTE_ICONS) {
    if (pattern.test(path)) return icon;
  }
  return 'FILE_TEXT';
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const TabManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState<Tab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTabId, setActiveTabId] = useState<string | null>(
    tabs[0]?.id ?? null,
  );

  // Persist tabs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch { /* storage full */ }
  }, [tabs]);

  // Keep active tab in sync with current route
  useEffect(() => {
    const match = tabs.find(t => t.path === location.pathname + location.search);
    if (match) {
      setActiveTabId(match.id);
    } else if (tabs.length === 0) {
      // Auto-create a tab for the current route if none exist
      const newTab: Tab = {
        id: generateTabId(),
        path: location.pathname + location.search,
        title: document.title.replace(' · Ovds', '') || location.pathname,
        icon: iconForPath(location.pathname),
        closeable: true,
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const openTab = useCallback((path: string, title: string, icon?: string) => {
    setTabs(prev => {
      const existing = prev.find(t => t.path === path);
      if (existing) {
        setActiveTabId(existing.id);
        navigate(path);
        return prev;
      }
      if (prev.length >= MAX_TABS) return prev; // max tabs reached
      const newTab: Tab = {
        id: generateTabId(),
        path,
        title,
        icon: icon ?? iconForPath(path),
        closeable: true,
      };
      setActiveTabId(newTab.id);
      navigate(path);
      return [...prev, newTab];
    });
  }, [navigate]);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const tab = prev[idx];
      if (tab.pinned) return prev; // pinned tabs cannot be closed

      const next = prev.filter(t => t.id !== id);

      // Navigate to adjacent tab if closing the active one
      if (id === activeTabId) {
        const nextTab = next[Math.min(idx, next.length - 1)];
        if (nextTab) {
          setActiveTabId(nextTab.id);
          navigate(nextTab.path);
        } else {
          setActiveTabId(null);
          navigate('/dashboard');
        }
      }

      return next;
    });
  }, [activeTabId, navigate]);

  const activateTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTabId(id);
      navigate(tab.path);
    }
  }, [tabs, navigate]);

  const pinTab = useCallback((id: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
  }, []);

  const reorderTabs = useCallback((oldIndex: number, newIndex: number) => {
    setTabs(prev => arrayMove(prev, oldIndex, newIndex));
  }, []);

  // Keyboard shortcut: Ctrl/Cmd+T opens current route in new tab
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        openTab(
          location.pathname + location.search,
          document.title.replace(' · Ovds', '') || location.pathname,
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [location, openTab]);

  return (
    <TabManagerContext.Provider value={{ tabs, activeTabId, openTab, closeTab, activateTab, pinTab, reorderTabs }}>
      {children}
    </TabManagerContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useTabManager() {
  const ctx = useContext(TabManagerContext);
  if (!ctx) throw new Error('useTabManager must be used inside TabManagerProvider');
  return ctx;
}

// ── Sortable Tab ──────────────────────────────────────────────────────────────

const SortableTab: React.FC<{
  tab: Tab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  onPin: () => void;
}> = ({ tab, isActive, onActivate, onClose, onPin }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="tab"
      aria-selected={isActive}
      onClick={onActivate}
      onMouseDown={e => e.button === 1 && onClose()}
      className="group/tab relative flex items-center gap-1.5 px-3 py-0 text-[11px] font-medium max-w-[180px] min-w-[80px] shrink-0 cursor-pointer select-none transition-colors"
      style={{
        ...style,
        height: '100%',
        borderRight: '1px solid var(--border)',
        background: isActive ? 'var(--surface)' : 'transparent',
        color: isActive ? 'var(--text)' : 'var(--text-4)',
        marginBottom: isActive ? 0 : undefined,
        boxShadow: isActive
          ? 'inset 0 -2px 0 var(--pro-azure)'
          : undefined,
        fontWeight: isActive ? 600 : 500,
      }}
      onMouseEnter={e => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-alt)';
      }}
      onMouseLeave={e => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      {/* Pin indicator */}
      {tab.pinned && (
        <span className="shrink-0" style={{ color: 'var(--pro-amber)' }}>
          <Icon name="STAR" size={9} className="fill-current" />
        </span>
      )}

      {/* Icon */}
      {tab.icon && (
        <span
          className="shrink-0 transition-colors"
          style={{ color: isActive ? 'var(--pro-azure)' : 'var(--text-5)' }}
        >
          <Icon name={tab.icon as any} size={11} />
        </span>
      )}

      {/* Title */}
      <span className="truncate flex-1 leading-none">{tab.title}</span>

      {/* Close button */}
      {tab.closeable !== false && !tab.pinned && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onClose(); }}
          className="shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover/tab:opacity-100 transition-opacity"
          style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)')}
          aria-label={`Close ${tab.title}`}
        >
          <Icon name="CLOSE" size={9} />
        </button>
      )}

      {/* Pin toggle */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onPin(); }}
        title={tab.pinned ? 'Unpin tab' : 'Pin tab'}
        className="shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover/tab:opacity-100 transition-opacity"
        style={{ color: tab.pinned ? 'var(--pro-amber)' : 'var(--text-4)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--pro-amber)')}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = tab.pinned ? 'var(--pro-amber)' : 'var(--text-4)')}
      >
        <Icon name="STAR" size={9} className={tab.pinned ? 'fill-current' : ''} />
      </button>
    </div>
  );
};

// ── Tab Bar ───────────────────────────────────────────────────────────────────

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, closeTab, activateTab, pinTab, reorderTabs, openTab } = useTabManager();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Scroll active tab into view
  useEffect(() => {
    const active = scrollRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null;
    active?.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
  }, [activeTabId]);

  if (tabs.length === 0) return null;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = tabs.findIndex(t => t.id === active.id);
    const newIdx = tabs.findIndex(t => t.id === over.id);
    reorderTabs(oldIdx, newIdx);
  };

  const canAddMore = tabs.length < MAX_TABS;

  return (
    <div
      role="tablist"
      aria-label="Open pages"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        height: 36,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Tabs scroll container */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-stretch overflow-x-auto overflow-y-hidden scrollbar-hide"
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
            {tabs.map(tab => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                onActivate={() => activateTab(tab.id)}
                onClose={() => closeTab(tab.id)}
                onPin={() => pinTab(tab.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* New tab button */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => openTab(location.pathname, document.title.replace(' · Ovds', '') || location.pathname)}
          title="Open current page in new tab (Ctrl+T)"
          aria-label="New tab"
          className="shrink-0 w-8 flex items-center justify-center transition-colors"
          style={{
            color: 'var(--text-5)',
            borderLeft: '1px solid var(--border)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color    = 'var(--pro-azure)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color    = 'var(--text-5)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <Icon name="PLUS" size={13} />
        </button>
      )}

      {/* Tab count badge when close to limit */}
      {tabs.length >= MAX_TABS - 2 && (
        <div
          className="shrink-0 flex items-center px-2"
          style={{
            fontSize: 9, fontWeight: 700,
            color: 'var(--text-5)',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          {tabs.length}/{MAX_TABS}
        </div>
      )}
    </div>
  );
};
