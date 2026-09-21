/**
 * @ovds/ui — TreeViewSidebar
 *
 * Ovds SaaS enterprise tree-view sidebar.
 *
 * Layout:  a 56px icon rail (always visible)  +  a 240px navigation panel (expands
 * to the right of the rail).  The rail hosts module/section icons, the company
 * switcher, global search, quick-create, notifications, support and profile.  The
 * panel renders a scannable, IFRS/AABE-friendly tree: a pinned/favorites strip at
 * the top, then regulatory section labels and expandable/collapsible sub-menus.
 *
 * Variants:
 *   - 'default' : clean white nav panel (Ovds SaaS light chrome)
 *   - 'sidebar' : dark navy (#0B1221) surface using --sidebar-* tokens
 *
 * Fully responsive: collapses to a 56px rail on demand, and renders as a
 * slide-out drawer on mobile (< lg) when `mobileOpen` is set.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Bell,
  HelpCircle,
  User,
  Settings,
  Building2,
  Star,
  Pin,
  PanelLeftClose,
  PanelLeft,
  Command,
  Check,
  CircleDot,
  Layers,
  ShieldCheck,
  Gavel,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { NavSection, NavItem } from './types';

export interface TreeViewCompany {
  id: string;
  name: string;
  code?: string;
  currency?: string;
  logoUrl?: string;
  isDefault?: boolean;
}

export interface TreeViewNotification {
  id: string;
  title: string;
  body?: string;
  time?: string;
  read?: boolean;
  icon?: React.ReactNode;
  priority?: 'low' | 'normal' | 'high';
}

export interface TreeViewProfile {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  initials?: string;
}

export interface TreeViewQuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
}

export type TreeViewActionType =
  | 'nav'
  | 'search'
  | 'quick-create'
  | 'notification'
  | 'profile'
  | 'support'
  | 'company'
  | 'toggle'
  | 'favorite'
  | 'mobile-close';

export interface TreeViewAction {
  type: TreeViewActionType;
  payload?: unknown;
}

export interface TreeViewSidebarProps {
  /** Tree sections (one per rail icon). */
  sections: NavSection[];
  /** Currently active item id (leaf). */
  activeItem?: string;
  /** Controlled collapse: only the 56px rail is shown. */
  collapsed?: boolean;
  /** Section id whose panel is shown; defaults to the section containing activeItem. */
  activeSection?: string;
  /** Favourite / pinned items rendered in the top strip. */
  favorites?: NavItem[];
  /** Company switcher state. */
  company?: TreeViewCompany | null;
  companies?: TreeViewCompany[];
  notifications?: TreeViewNotification[];
  profile?: TreeViewProfile | null;
  quickActions?: TreeViewQuickAction[];
  /** Mobile drawer open state. */
  mobileOpen?: boolean;

  onToggle?: (collapsed: boolean) => void;
  onNavClick?: (item: NavItem) => void;
  onOpenSearch?: () => void;
  onToggleFavorite?: (item: NavItem) => void;
  onSwitchCompany?: (company: TreeViewCompany) => void;
  onMobileClose?: () => void;
  onAction?: (action: TreeViewAction) => void;

  /** 'default' = white chrome, 'sidebar' = dark navy. */
  variant?: 'default' | 'sidebar';
  className?: string;
}

// ============================================================================
// LOCAL HOOKS / HELPERS
// ============================================================================

/** Close a popover when clicking outside or pressing Escape. */
function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

const BADGE_STYLES: Record<NonNullable<NavItem['badgeColor']>, string> = {
  blue: 'bg-[var(--pro-azure)] text-white',
  green: 'bg-[var(--pro-azure)] text-white',
  amber: 'bg-amber-500 text-white',
  red: 'bg-rose-500 text-white',
  slate: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
};

function NavBadge({ value, color = 'slate' }: { value: number | string; color?: NavItem['badgeColor'] }) {
  return (
    <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none', BADGE_STYLES[color ?? 'slate'])}>
      {value}
    </span>
  );
}

function NewPill() {
  return (
    <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide bg-[var(--pro-azure)]/15 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] ring-1 ring-[var(--pro-azure)]/30">
      New
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TreeViewSidebar(props: TreeViewSidebarProps) {
  const { mobileOpen = false, onMobileClose, className } = props;

  const body = <SidebarBody {...props} />;

  return (
    <>
      {/* Desktop / tablet: docked two-column shell */}
      <div className={cn('hidden lg:flex h-full', className)}>{body}</div>

      {/* Mobile: slide-out drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[800]">
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm animate-aki-fade-in"
            onClick={() => {
              onMobileClose?.();
              props.onAction?.({ type: 'mobile-close' });
            }}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[296px] max-w-[88vw] shadow-2xl animate-aki-slide-in-left aki-sidebar">
            {body}
          </div>
        </div>
      )}
    </>
  );
}

function SidebarBody({
  sections,
  activeItem,
  collapsed = false,
  activeSection,
  favorites,
  company,
  companies = [],
  notifications = [],
  profile,
  quickActions = [],
  onToggle,
  onNavClick,
  onOpenSearch,
  onToggleFavorite,
  onSwitchCompany,
  onAction,
  variant = 'default',
  className,
}: TreeViewSidebarProps) {
  const isSidebar = variant === 'sidebar';

  // Resolve which section's panel is visible.
  const resolvedSection =
    activeSection ??
    sections.find((s) => s.items.some((i) => findItem(i, activeItem ?? '')?.id === activeItem))?.id ??
    sections[0]?.id ??
    null;

  const [currentSection, setCurrentSection] = useState<string | null>(resolvedSection);
  useEffect(() => {
    if (resolvedSection) setCurrentSection(resolvedSection);
  }, [resolvedSection]);

  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Popover state
  const [companyOpen, setCompanyOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // Dismiss refs (hoisted so hooks always run in the same order).
  const companyRef = useDismiss(companyOpen, () => setCompanyOpen(false));
  const quickRef = useDismiss(quickOpen, () => setQuickOpen(false));
  const notifRef = useDismiss(notifOpen, () => setNotifOpen(false));
  const profileRef = useDismiss(profileOpen, () => setProfileOpen(false));
  const supportRef = useDismiss(supportOpen, () => setSupportOpen(false));

  const active = sections.find((s) => s.id === currentSection) ?? null;

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleNav = (item: NavItem) => {
    onNavClick?.(item);
    onAction?.({ type: 'nav', payload: item });
  };

  const favItems = useMemo(() => {
    if (favorites && favorites.length) return favorites;
    return sections.flatMap((s) => s.items).filter((i) => i.pinned);
  }, [favorites, sections]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const out: NavItem[] = [];
    sections.forEach((s) =>
      s.items.forEach((i) => {
        if (matchItem(i, q)) out.push(i);
      }),
    );
    return out;
  }, [search, sections]);

  const railBg = isSidebar
    ? 'bg-[--sidebar-bg] text-[--sidebar-fg] border-r border-[--sidebar-border]'
    : 'bg-slate-50 border-r border-slate-200';
  const panelBg = isSidebar
    ? 'bg-[--sidebar-bg] text-[--sidebar-fg] border-r border-[--sidebar-border]'
    : 'bg-white border-r border-slate-200';

  return (
    <div className={cn('aki-shell-sidebar flex h-full', isSidebar && 'aki-sidebar', className)}>
      {/* ── LEFT ICON RAIL (56px) ─────────────────────────────────────────── */}
      <div className={cn('w-14 shrink-0 flex flex-col h-full', railBg)}>
        {/* Brand / company */}
        <div className="h-14 flex items-center justify-center border-b border-[--sidebar-border] border-slate-200/70 relative">
          <button
            onClick={() => (company ? (setCompanyOpen((v) => !v), onAction?.({ type: 'company', payload: company })) : undefined)}
            title={company?.name ?? 'Company'}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all',
              isSidebar ? 'bg-[--aki-blue]' : 'bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)]',
            )}
          >
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <Building2 size={18} />
            )}
          </button>
          {companyOpen && (
            <CompanyPopover
              ref={companyRef}
              companies={companies}
              current={company}
              onSwitch={(c) => {
                onSwitchCompany?.(c);
                onAction?.({ type: 'company', payload: c });
                setCompanyOpen(false);
              }}
            />
          )}
        </div>

        {/* Section rail icons */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5 space-y-1 aki-nav-scroll">
          {sections.map((section) => {
            const selected = section.id === currentSection && !collapsed;
            return (
              <div key={section.id} className="aki-rail-btn relative group">
                <button
                  onClick={() => {
                    if (collapsed) {
                      onToggle?.(false);
                    }
                    setCurrentSection(section.id);
                  }}
                  title={section.label}
                  className={cn(
                    'w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all relative',
                    selected
                      ? isSidebar
                        ? 'bg-[--sidebar-active-bg] text-[--sidebar-active-fg]'
                        : 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]'
                      : isSidebar
                        ? 'text-[--sidebar-fg-muted] hover:bg-white/5 hover:text-[--sidebar-fg-hover]'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                  )}
                >
                  {section.icon ?? <Layers size={18} />}
                  {section.badge != null && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-rose-500 text-white ring-2 ring-white">
                      {section.badge}
                    </span>
                  )}
                </button>
                {/* Rail tooltip when collapsed */}
                {collapsed && (
                  <span className="rail-tooltip">{section.label}</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Rail footer utilities */}
        <div className="border-t border-[--sidebar-border] border-slate-200/70 p-1.5 space-y-1">
          <RailIcon
            label="Search"
            onClick={() => {
              onOpenSearch?.();
              onAction?.({ type: 'search' });
            }}
            isSidebar={isSidebar}
          >
            <Search size={18} />
          </RailIcon>

          <div className="aki-rail-btn relative group">
            <RailIcon
              label="Quick create"
              onClick={() => {
                setQuickOpen((v) => !v);
                onAction?.({ type: 'quick-create' });
              }}
              isSidebar={isSidebar}
              active={quickOpen}
            >
              <Plus size={18} />
            </RailIcon>
            {quickOpen && quickActions.length > 0 && (
              <QuickCreatePopover
                ref={useDismiss(quickOpen, () => setQuickOpen(false))}
                actions={quickActions}
                onSelect={(a) => {
                  a.onClick?.();
                  onAction?.({ type: 'quick-create', payload: a });
                  setQuickOpen(false);
                }}
              />
            )}
          </div>

          <div className="aki-rail-btn relative group">
            <RailIcon
              label="Notifications"
              onClick={() => {
                setNotifOpen((v) => !v);
                onAction?.({ type: 'notification' });
              }}
              isSidebar={isSidebar}
              active={notifOpen}
            >
              <Bell size={18} />
              {notifications.some((n) => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </RailIcon>
            {notifOpen && (
              <NotificationsPopover
                ref={useDismiss(notifOpen, () => setNotifOpen(false))}
                items={notifications}
                onSelect={(n) => onAction?.({ type: 'notification', payload: n })}
              />
            )}
          </div>

          <div className="aki-rail-btn relative group">
            <RailIcon
              label="Support"
              onClick={() => {
                setSupportOpen((v) => !v);
                onAction?.({ type: 'support' });
              }}
              isSidebar={isSidebar}
              active={supportOpen}
            >
              <HelpCircle size={18} />
            </RailIcon>
            {supportOpen && (
              <SupportPopover
                ref={useDismiss(supportOpen, () => setSupportOpen(false))}
                onAction={(a) => onAction?.(a)}
              />
            )}
          </div>

          <div className="aki-rail-btn relative group">
            <button
              onClick={() => {
                setProfileOpen((v) => !v);
                onAction?.({ type: 'profile' });
              }}
              title={profile?.name ?? 'Profile'}
              className={cn(
                'w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all overflow-hidden',
                profileOpen
                  ? isSidebar
                    ? 'bg-[--sidebar-active-bg] text-[--sidebar-active-fg]'
                    : 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]'
                  : isSidebar
                    ? 'text-[--sidebar-fg-muted] hover:bg-white/5 hover:text-[--sidebar-fg-hover]'
                    : 'text-slate-500 hover:bg-slate-100',
              )}
            >
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : profile?.initials ? (
                <span className="w-8 h-8 rounded-full bg-[var(--pro-azure)]/15 text-[var(--pro-azure)] text-[12px] font-bold flex items-center justify-center">
                  {profile.initials}
                </span>
              ) : (
                <User size={18} />
              )}
            </button>
            {profileOpen && (
              <ProfilePopover
                ref={useDismiss(profileOpen, () => setProfileOpen(false))}
                profile={profile}
                onAction={(a) => onAction?.(a)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT NAV PANEL (240px) ───────────────────────────────────────── */}
      {!collapsed && (
        <NavPanel
          isSidebar={isSidebar}
          section={active}
          search={search}
          onSearch={setSearch}
          onOpenSearch={() => {
            onOpenSearch?.();
            onAction?.({ type: 'search' });
          }}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          activeItem={activeItem}
          onNavClick={handleNav}
          onToggleFavorite={(i) => {
            onToggleFavorite?.(i);
            onAction?.({ type: 'favorite', payload: i });
          }}
          favorites={favItems}
          filtered={filtered}
          onCollapse={() => {
            onToggle?.(true);
            onAction?.({ type: 'toggle' });
          }}
          panelBg={panelBg}
        />
      )}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function findItem(item: NavItem, id: string): NavItem | null {
  if (item.id === id) return item;
  if (item.children) {
    for (const c of item.children) {
      const found = findItem(c, id);
      if (found) return found;
    }
  }
  return null;
}

function matchItem(item: NavItem, q: string): boolean {
  const hay = [item.label, item.group, ...(item.keywords ?? [])].join(' ').toLowerCase();
  if (hay.includes(q)) return true;
  if (item.children) return item.children.some((c) => matchItem(c, q));
  return false;
}

// ============================================================================
// RAIL PRIMITIVES
// ============================================================================

function RailIcon({
  label,
  onClick,
  isSidebar,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  isSidebar: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all',
        active
          ? isSidebar
            ? 'bg-[--sidebar-active-bg] text-[--sidebar-active-fg]'
            : 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]'
          : isSidebar
            ? 'text-[--sidebar-fg-muted] hover:bg-white/5 hover:text-[--sidebar-fg-hover]'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
      )}
    >
      {children}
    </button>
  );
}

// ============================================================================
// NAV PANEL (240px)
// ============================================================================

interface NavPanelProps {
  isSidebar: boolean;
  section: NavSection | null;
  search: string;
  onSearch: (v: string) => void;
  onOpenSearch: () => void;
  expandedGroups: Set<string>;
  onToggleGroup: (key: string) => void;
  activeItem?: string;
  onNavClick: (item: NavItem) => void;
  onToggleFavorite: (item: NavItem) => void;
  favorites: NavItem[];
  filtered: NavItem[] | null;
  onCollapse: () => void;
  panelBg: string;
}

function NavPanel({
  isSidebar,
  section,
  search,
  onSearch,
  onOpenSearch,
  expandedGroups,
  onToggleGroup,
  activeItem,
  onNavClick,
  onToggleFavorite,
  favorites,
  filtered,
  onCollapse,
  panelBg,
}: NavPanelProps) {
  const labelCls = isSidebar
    ? 'text-[--sidebar-fg-muted]'
    : 'text-slate-400';
  const borderCls = isSidebar ? 'border-[--sidebar-border]' : 'border-slate-200';

  return (
    <div className={cn('w-60 shrink-0 flex flex-col h-full sidebar-nav-panel', panelBg)}>
      {/* Header */}
      <div className={cn('h-14 flex items-center gap-2 px-3 border-b', borderCls)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--pro-azure)]/10 text-[var(--pro-azure)]">
          {section?.icon ?? <Layers size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-[13px] font-bold leading-none truncate', isSidebar ? 'text-[--sidebar-fg]' : 'text-slate-800')}>
            {section?.label ?? 'Menu'}
          </p>
          {section?.group && (
            <p className={cn('text-[9px] font-semibold uppercase tracking-wider mt-0.5 flex items-center gap-1', labelCls)}>
              <ShieldCheck size={9} /> {section.group}
            </p>
          )}
        </div>
        <button
          onClick={onCollapse}
          title="Collapse"
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
            isSidebar ? 'text-[--sidebar-fg-muted] hover:bg-white/5 hover:text-[--sidebar-fg-hover]' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
          )}
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search */}
      <div className={cn('px-3 py-2.5 border-b', borderCls)}>
        <div className="relative">
          <Search size={13} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', labelCls)} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={onOpenSearch}
            placeholder="Search…"
            className={cn(
              'w-full pl-8 pr-3 py-1.5 rounded-lg text-[12px] outline-none transition-all',
              isSidebar
                ? 'bg-white/5 border border-[--sidebar-border] text-[--sidebar-fg] placeholder-[--sidebar-fg-muted] focus:border-[--aki-blue] focus:ring-1 focus:ring-[--aki-blue]/30'
                : 'bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:border-[var(--pro-azure)] focus:ring-2 focus:ring-[var(--pro-azure)]/20',
            )}
          />
          <kbd className={cn('absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center px-1 py-0.5 rounded text-[9px] font-mono font-bold border', isSidebar ? 'border-[--sidebar-border] text-[--sidebar-fg-muted]' : 'border-slate-200 text-slate-400')}>
            <Command size={9} />
          </kbd>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 aki-nav-scroll">
        {/* Favourites / pinned strip */}
        {favorites.length > 0 && (
          <div className="mb-2">
            <p className={cn('sidebar-fav-heading', isSidebar && '!text-[--sidebar-fg-muted]')}>
              <Star size={10} className="text-amber-400" /> Favourites
            </p>
            <div className="space-y-0.5">
              {favorites.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onNavClick(f)}
                  className={cn(
                    'ovds-nav-fav',
                    isSidebar && '!text-[--sidebar-fg-muted] hover:!bg-white/5 hover:!text-[--sidebar-fg-hover]',
                    activeItem === f.id && 'active',
                  )}
                >
                  <span className="shrink-0">{f.icon}</span>
                  <span className="flex-1 text-left truncate">{f.label}</span>
                  <Pin
                    size={12}
                    className="ovds-fav-pin opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onToggleFavorite(f);
                    }}
                  />
                </button>
              ))}
            </div>
            <div className={cn('border-t my-2', borderCls)} />
          </div>
        )}

        {/* Filtered results */}
        {filtered ? (
          <>
            <p className={cn('px-2 py-1 text-[10px] font-bold uppercase tracking-wider', labelCls)}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-0.5">
              {filtered.map((item) => (
                <NavTreeItem
                  key={item.id}
                  item={item}
                  depth={0}
                  isSidebar={isSidebar}
                  activeItem={activeItem}
                  expandedGroups={expandedGroups}
                  onToggleGroup={onToggleGroup}
                  onNavClick={onNavClick}
                  onToggleFavorite={onToggleFavorite}
                  showChildren
                />
              ))}
            </div>
          </>
        ) : (
          // Tree view for the active section
          section?.items.map((item) => (
            <NavTreeItem
              key={item.id}
              item={item}
              depth={0}
              isSidebar={isSidebar}
              activeItem={activeItem}
              expandedGroups={expandedGroups}
              onToggleGroup={onToggleGroup}
              onNavClick={onNavClick}
              onToggleFavorite={onToggleFavorite}
              defaultOpen={section.collapsible === false}
            />
          ))
        )}
      </div>

      {/* Footer regulatory hint */}
      <div className={cn('px-3 py-2 border-t flex items-center gap-1.5 text-[10px]', borderCls, labelCls)}>
        <Gavel size={11} />
        <span>IFRS · AABE compliant</span>
      </div>
    </div>
  );
}

// ============================================================================
// NAV TREE ITEM (recursive)
// ============================================================================

function NavTreeItem({
  item,
  depth,
  isSidebar,
  activeItem,
  expandedGroups,
  onToggleGroup,
  onNavClick,
  onToggleFavorite,
  defaultOpen = false,
  showChildren = false,
}: {
  item: NavItem;
  depth: number;
  isSidebar: boolean;
  activeItem?: string;
  expandedGroups: Set<string>;
  onToggleGroup: (key: string) => void;
  onNavClick: (item: NavItem) => void;
  onToggleFavorite: (item: NavItem) => void;
  defaultOpen?: boolean;
  showChildren?: boolean;
}) {
  const groupKey = `${depth}:${item.id}`;
  const hasChildren = !!item.children?.length;
  const open = showChildren || expandedGroups.has(groupKey) || defaultOpen;
  const isActive = activeItem === item.id;
  const childActive = hasChildren && item.children?.some((c) => findItem(c, activeItem ?? '')?.id === activeItem);

  const indent = { paddingLeft: `${8 + depth * 14}px` };

  const itemClasses = cn(
    'aki-nav-item group w-full flex items-center gap-2 rounded-md text-[12.5px] font-medium transition-all relative',
    isSidebar
      ? isActive
        ? '!bg-[--sidebar-active-bg] !text-[--sidebar-active-fg]'
        : '!text-[--sidebar-fg-muted] hover:!bg-white/5 hover:!text-[--sidebar-fg-hover]'
      : isActive
        ? '!bg-[var(--pro-azure-50)] !text-[var(--pro-azure)]'
        : '!text-slate-600 hover:!bg-slate-50 hover:!text-slate-800',
    item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
  );

  const iconClasses = cn(
    'shrink-0',
    isSidebar
      ? isActive
        ? '!text-[--sidebar-accent]'
        : '!text-[--sidebar-fg-muted] group-hover:!text-[--sidebar-fg-hover]'
      : isActive
        ? '!text-[var(--pro-azure)]'
        : 'text-slate-400',
  );

  const content = (
    <>
      {item.icon && <span className={iconClasses}>{item.icon}</span>}
      <span className={cn('flex-1 truncate text-left', depth > 0 && 'text-[12px]')}>{item.label}</span>
      {item.isNew && <NewPill />}
      {item.badge != null && item.badge !== '' && (
        <NavBadge value={item.badge} color={item.badgeColor} />
      )}
      {!isActive && item.shortcut && (
        <kbd
          className={cn(
            'hidden lg:flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity',
            isSidebar ? 'bg-white/5 border border-[--sidebar-border] text-[--sidebar-fg-muted]' : 'bg-white border border-slate-200 text-slate-400',
          )}
        >
          {item.shortcut}
        </kbd>
      )}
      {item.pinned !== undefined && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item);
          }}
          title={item.pinned ? 'Unpin' : 'Pin to favourites'}
          className={cn(
            'opacity-0 group-hover:opacity-100 transition-opacity shrink-0',
            item.pinned ? 'text-amber-400 opacity-100' : isSidebar ? 'text-[--sidebar-fg-muted] hover:text-amber-400' : 'text-slate-400 hover:text-amber-400',
          )}
        >
          <Pin size={12} className={item.pinned ? 'fill-amber-400' : ''} />
        </button>
      )}
    </>
  );

  const inner = item.to ? <Link to={item.to} className={cn(itemClasses)} style={indent}>{content}</Link> : <button className={itemClasses} style={indent}>{content}</button>;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) onToggleGroup(groupKey);
          else if (!item.disabled) onNavClick(item);
        }}
        className={cn('flex items-center', hasChildren && 'cursor-pointer')}
      >
        {inner}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleGroup(groupKey);
            }}
            className={cn('mr-1.5 w-5 h-5 flex items-center justify-center rounded shrink-0 transition-transform', open && 'rotate-90', isSidebar ? 'text-[--sidebar-fg-muted]' : 'text-slate-400')}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {hasChildren && (
        <div
          className={cn('grid transition-all duration-200 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
        >
          <div className="overflow-hidden">
            <div className="space-y-0.5 mt-0.5">
              {item.children!.map((child) => (
                <NavTreeItem
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  isSidebar={isSidebar}
                  activeItem={activeItem}
                  expandedGroups={expandedGroups}
                  onToggleGroup={onToggleGroup}
                  onNavClick={onNavClick}
                  onToggleFavorite={onToggleFavorite}
                  defaultOpen={open || !!childActive}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// POPOVERS (company / quick-create / notifications / profile / support)
// ============================================================================

const POPOVER_CLS =
  'absolute left-14 z-[60] w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-aki-enter';

const CompanyPopover = React.forwardRef<
  HTMLDivElement,
  { companies: TreeViewCompany[]; current?: TreeViewCompany | null; onSwitch: (c: TreeViewCompany) => void }
>(function CompanyPopover({ companies, current, onSwitch }, ref) {
  return (
    <div ref={ref} className={cn(POPOVER_CLS, 'top-2')}>
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Switch Company</p>
      </div>
      <div className="p-2 max-h-[360px] overflow-y-auto">
        {companies.length === 0 && current && (
          <CompanyRow company={current} selected onSwitch={onSwitch} />
        )}
        {companies.map((c) => (
          <CompanyRow key={c.id} company={c} selected={current?.id === c.id} onSwitch={onSwitch} />
        ))}
        {companies.length === 0 && !current && (
          <p className="px-3 py-6 text-center text-[12px] text-slate-400">No companies</p>
        )}
      </div>
    </div>
  );
});

function CompanyRow({ company, selected, onSwitch }: { company: TreeViewCompany; selected: boolean; onSwitch: (c: TreeViewCompany) => void }) {
  return (
    <button
      onClick={() => onSwitch(company)}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all',
        selected ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]-950/30 text-[var(--pro-azure)] dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
      )}
    >
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', selected ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
        <Building2 size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold truncate">{company.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {company.code && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">{company.code}</span>}
          {company.currency && <span className="text-[10px] font-mono text-slate-400">{company.currency}</span>}
        </div>
      </div>
      {company.isDefault && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
      {selected && <span className="w-2 h-2 rounded-full bg-[var(--pro-azure)] shrink-0" />}
    </button>
  );
}

const QuickCreatePopover = React.forwardRef<
  HTMLDivElement,
  { actions: TreeViewQuickAction[]; onSelect: (a: TreeViewQuickAction) => void }
>(function QuickCreatePopover({ actions, onSelect }, ref) {
  return (
    <div ref={ref} className={cn(POPOVER_CLS, 'bottom-14')}>
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Create</p>
      </div>
      <div className="p-2 grid grid-cols-2 gap-1.5">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className="flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <span className="w-8 h-8 rounded-xl bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]-950/30 text-[var(--pro-azure)] dark:text-blue-400 flex items-center justify-center">
              {a.icon ?? <Plus size={15} />}
            </span>
            <span className="text-[12px] font-semibold leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

const NotificationsPopover = React.forwardRef<
  HTMLDivElement,
  { items: TreeViewNotification[]; onSelect: (n: TreeViewNotification) => void }
>(function NotificationsPopover({ items, onSelect }, ref) {
  const unread = items.filter((n) => !n.read).length;
  return (
    <div ref={ref} className={cn(POPOVER_CLS, 'bottom-14')}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notifications</p>
        {unread > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white">{unread}</span>}
      </div>
      <div className="p-1.5 max-h-[360px] overflow-y-auto">
        {items.length === 0 && <p className="px-3 py-6 text-center text-[12px] text-slate-400">You're all caught up</p>}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(n)}
            className={cn(
              'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800',
              !n.read && 'bg-[var(--pro-azure-50)]/40 dark:bg-[var(--pro-azure)]-950/20',
            )}
          >
            <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', n.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
              {n.icon ?? <Bell size={14} />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{n.title}</p>
              {n.body && <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{n.body}</p>}
              {n.time && <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>}
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--pro-azure)] shrink-0 mt-1.5" />}
          </button>
        ))}
      </div>
    </div>
  );
});

const ProfilePopover = React.forwardRef<
  HTMLDivElement,
  { profile?: TreeViewProfile | null; onAction: (a: TreeViewAction) => void }
>(function ProfilePopover({ profile, onAction }, ref) {
  return (
    <div ref={ref} className={cn(POPOVER_CLS, 'bottom-2')}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-full bg-[var(--pro-azure)]/15 text-[var(--pro-azure)] flex items-center justify-center text-[14px] font-bold">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" /> : profile?.initials ?? <User size={18} />}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{profile?.name ?? 'Guest'}</p>
          {profile?.email && <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>}
          {profile?.role && <p className="text-[10px] text-slate-400 mt-0.5">{profile.role}</p>}
        </div>
      </div>
      <div className="p-1.5">
        {[
          { label: 'Profile settings', icon: <User size={14} />, type: 'profile' as const },
          { label: 'Preferences', icon: <Settings size={14} />, type: 'profile' as const },
          { label: 'Support', icon: <HelpCircle size={14} />, type: 'support' as const },
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => onAction({ type: m.type, payload: m.label })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <span className="text-slate-400">{m.icon}</span>
            {m.label}
          </button>
        ))}
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />
        <button
          onClick={() => onAction({ type: 'profile', payload: 'signout' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
        >
          <CircleDot size={14} /> Sign out
        </button>
      </div>
    </div>
  );
});

const SupportPopover = React.forwardRef<HTMLDivElement, { onAction: (a: TreeViewAction) => void }>(
  function SupportPopover({ onAction }, ref) {
    const links = [
      { label: 'Documentation', desc: 'Guides & API reference' },
      { label: 'Community', desc: 'Ask questions, share tips' },
      { label: 'Contact support', desc: 'example@ovds.et' },
      { label: 'Status', desc: 'System health & incidents' },
    ];
    return (
      <div ref={ref} className={cn(POPOVER_CLS, 'bottom-14')}>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Help & Support</p>
        </div>
        <div className="p-1.5">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => onAction({ type: 'support', payload: l.label })}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <span className="w-8 h-8 rounded-xl bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]-950/30 text-[var(--pro-azure)] dark:text-blue-400 flex items-center justify-center shrink-0">
                <HelpCircle size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">{l.label}</p>
                <p className="text-[10.5px] text-slate-400 truncate">{l.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  },
);

// __APPEND_HERE__
