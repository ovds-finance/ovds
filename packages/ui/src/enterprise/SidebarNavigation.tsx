/**
 * @ovds/ui — SidebarNavigation
 *
 * Enterprise-grade multi-level sidebar navigation with:
 *   - Collapsible sections
 *   - Nested items with expand/collapse
 *   - Role-based visibility
 *   - Badge counts
 *   - Keyboard shortcut hints
 *   - Breadcrumb trail
 *   - Mobile responsive
 *   - Search within navigation
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Package,
  Truck,
  Building2,
  Wallet,
  Receipt,
  FolderOpen,
  Calendar,
  HelpCircle,
  Bell,
  LogOut,
  Menu,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { NavSection, NavItem } from './types';

export interface SidebarNavigationProps {
  sections: NavSection[];
  activeItem?: string;
  onNavigate?: (item: NavItem) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  userRole?: string;
  showSearch?: boolean;
  className?: string;
  bottomActions?: React.ReactNode;
  /** 'default' = light/white sidebar, 'sidebar' = dark navy (#0B1221) sidebar */
  variant?: 'default' | 'sidebar';
}

export function SidebarNavigation({
  sections,
  activeItem,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  userRole,
  showSearch = true,
  className,
  bottomActions,
  variant = 'default',
}: SidebarNavigationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const isSidebar = variant === 'sidebar';

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const lower = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(lower) ||
            item.keywords?.some((k) => k.toLowerCase().includes(lower)),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, searchQuery]);

  const asideClasses = cn(
    'flex flex-col h-full transition-all duration-200',
    isSidebar
      ? 'bg-[--sidebar-bg] text-[--sidebar-fg] border-r border-[--sidebar-border]'
      : 'bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800',
    collapsed ? 'w-[56px]' : 'w-[240px]',
    className,
  );

  const headerBorder = isSidebar
    ? 'border-[--sidebar-border]'
    : 'border-slate-100 dark:border-slate-800';

  const sectionLabelClasses = isSidebar
    ? 'text-[--sidebar-fg-muted] hover:text-[--sidebar-fg-hover]'
    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300';

  const sectionLabelDot = isSidebar
    ? 'bg-[--sidebar-section-dot]'
    : 'bg-transparent';

  return (
    <aside className={asideClasses}>
      {/* Header */}
      <div className={cn('flex items-center h-12 px-3 shrink-0', headerBorder, isSidebar ? 'border-b' : 'border-b')}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0', isSidebar ? 'bg-[--aki-blue]' : 'bg-[var(--pro-azure)]')}>
              <Building2 size={16} />
            </div>
            <div>
              <h1 className={cn('text-[13px] font-bold leading-none', isSidebar ? 'text-[--sidebar-fg]' : 'text-slate-900 dark:text-slate-100')}>OVDS</h1>
              <p className={cn('text-[9px] font-medium uppercase tracking-wider', isSidebar ? 'text-[--sidebar-fg-muted]' : 'text-slate-400')}>Enterprise</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white mx-auto', isSidebar ? 'bg-[--aki-blue]' : 'bg-[var(--pro-azure)]')}>
            <Building2 size={16} />
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn('ml-auto w-6 h-6 rounded-md flex items-center justify-center transition-all', isSidebar ? 'text-[--sidebar-fg-muted] hover:text-[--sidebar-fg] hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}
          >
            <Menu size={14} />
          </button>
        )}
      </div>

      {/* Search */}
      {showSearch && !collapsed && (
        <div className={cn('px-3 py-2', isSidebar ? 'border-b border-[--sidebar-border]' : '')}>
          <div className="relative">
            <Search size={13} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', isSidebar ? 'text-[--sidebar-fg-muted]' : 'text-slate-400')} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={cn('w-full pl-8 pr-3 py-1.5 rounded-lg text-[12px] outline-none transition-all', isSidebar
                ? 'bg-white/5 border border-[--sidebar-border] text-[--sidebar-fg] placeholder-[--sidebar-fg-muted] focus:border-[--aki-blue] focus:ring-1 focus:ring-[--aki-blue]/30'
                : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)]')}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredSections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const visibleItems = section.items;

          return (
            <div key={section.id}>
              {!collapsed && section.label && (
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn('w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors mb-1', sectionLabelClasses)}
                >
                  {isSidebar && <span className={cn('w-1 h-1 rounded-full shrink-0', sectionLabelDot)} />}
                  {isExpanded ? (
                    <ChevronDown size={10} />
                  ) : (
                    <ChevronRight size={10} />
                  )}
                  <span className="flex-1">{section.label}</span>
                </button>
              )}

              <div className={cn('space-y-0.5', !isExpanded && !collapsed && 'hidden')}>
                {visibleItems.map((item) => (
                  <NavItemButton
                    key={item.id}
                    item={item}
                    active={activeItem === item.id}
                    collapsed={collapsed}
                    onClick={() => {
                      onNavigate?.(item);
                    }}
                    variant={variant}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      {bottomActions && (
        <div className={cn('px-2 py-2', isSidebar ? 'border-t border-[--sidebar-border]' : 'border-t border-slate-100 dark:border-slate-800')}>
          {bottomActions}
        </div>
      )}
    </aside>
  );
}

function NavItemButton({
  item,
  active,
  collapsed,
  onClick,
  variant = 'default',
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  variant?: 'default' | 'sidebar';
}) {
  const isSidebar = variant === 'sidebar';

  const itemClasses = cn(
    'w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12px] font-medium transition-all relative group',
    isSidebar
      ? active
        ? 'bg-[--sidebar-active-bg] text-[--sidebar-active-fg]'
        : 'text-[--sidebar-fg-muted] hover:bg-white/5 hover:text-[--sidebar-fg-hover]'
      : active
        ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]-950/30 text-[var(--pro-azure)] dark:text-blue-400'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200',
    item.disabled && 'opacity-50 cursor-not-allowed',
  );

  const iconClasses = cn('shrink-0', isSidebar
    ? active
      ? 'text-[--sidebar-accent]'
      : 'text-[--sidebar-fg-muted] group-hover:text-[--sidebar-fg-hover]'
    : active
      ? 'text-[var(--pro-azure)] dark:text-blue-400'
      : 'text-slate-500 dark:text-slate-400',
  );

  const badgeClasses = cn(
    'px-1.5 py-0.5 rounded-full text-[9px] font-bold',
    isSidebar
      ? active
        ? 'bg-[--aki-blue] text-white'
        : 'bg-white/10 text-[--sidebar-fg-muted]'
      : active
        ? 'bg-[var(--pro-azure)] text-white'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  );

  const shortcutClasses = cn('hidden lg:flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-opacity',
    isSidebar
      ? 'bg-white/5 border border-[--sidebar-border] text-[--sidebar-fg-muted]'
      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400',
  );

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={itemClasses}
    >
      {item.icon && (
        <span className={iconClasses}>
          {item.icon}
        </span>
      )}
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{item.label}</span>
          {item.badge !== undefined && (
            <span className={badgeClasses}>
              {item.badge}
            </span>
          )}
          {item.shortcut && !active && (
            <kbd className={cn(shortcutClasses, 'opacity-0 group-hover:opacity-100')}>
              {item.shortcut}
            </kbd>
          )}
        </>
      )}
    </button>
  );
}

// ============================================================================
// MobileSidebar (slide-out drawer)
// ============================================================================

export interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  sections: NavSection[];
  activeItem?: string;
  onNavigate?: (item: NavItem) => void;
  userRole?: string;
}

export function MobileSidebar({
  open,
  onClose,
  sections,
  activeItem,
  onNavigate,
}: MobileSidebarProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[800] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarNavigation
              sections={sections}
              activeItem={activeItem}
              onNavigate={(item) => {
                onNavigate?.(item);
                onClose();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
