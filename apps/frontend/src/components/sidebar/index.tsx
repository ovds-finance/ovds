import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../rbac/AuthContext';
import { useBusiness } from '../../context/businessContext';
import api from '../../services/api';
import { Icon } from '../ui';
import { layout } from '@ovds/ui';
import { useNavTree } from '../../hooks/useNavTree';
import type { NavItem, NavGroup } from '../utils/navGroups';
import { companyInitials, renderIcon } from './utils';
import { COMPANY_GRADIENTS, ROLE_BADGE, TYPE_BADGE_CLS, MODULE_COLORS } from './constants';
import { allowedSectionsForRole, isSuperUser, type Role } from '@ovds/shared';
import { useSidebarReducer } from './useSidebarReducer';
import { useLocalStorage, useInterval } from '../../hooks';

const AKAUNTING_PARENTS: Array<{
  id: string;
  label: string;
  icon: string;
  childKeys: string[];
}> = [
  { id: 'dashboard',    label: 'Dashboard',             icon: 'DASHBOARD',       childKeys: ['dashboard'] },
  { id: 'sales',        label: 'Sales',                 icon: 'TRENDING_UP',     childKeys: ['sales'] },
  { id: 'crm',          label: 'CRM',                   icon: 'CUSTOMER',        childKeys: ['crm'] },
  { id: 'trade',        label: 'Trade & Customs',       icon: 'GLOBE',           childKeys: ['trade'] },
  { id: 'purchases',    label: 'Purchases & Inventory', icon: 'CLIPBOARD_LIST',  childKeys: ['purchases', 'inventory'] },
  { id: 'banking',      label: 'Banking',               icon: 'WALLET',          childKeys: ['banking'] },
  { id: 'tax',          label: 'Tax & Compliance',      icon: 'SHIELD_CHECK',    childKeys: ['tax_compliance', 'regulatory_reporting', 'disaster_fund'] },
  { id: 'accounting',   label: 'Accounting',            icon: 'BOOK_OPEN',       childKeys: ['accounting'] },
  { id: 'finance',      label: 'Finance & Standards',   icon: 'LAYERS',          childKeys: ['ifrs_compliance', 'aabe_compliance', 'commercial_code', 'ovds_module'] },
  { id: 'reports',      label: 'Reports & Analytics',   icon: 'BAR_CHART_2',     childKeys: ['reports'] },
  { id: 'hr_payroll',   label: 'HR & Payroll',          icon: 'USERS',           childKeys: ['hr_payroll'] },
  { id: 'system_admin', label: 'System & Administration', icon: 'SETTINGS',      childKeys: ['system', 'setting', 'config', 'admin', 'governance', 'iot', 'device_control', 'developer'] },
];

import type { SidebarProps } from './types';
import { RailButton } from './RailButton';
import { CompanySwitcherPanel } from './CompanySwitcher';
import { QuickCreateMenu } from './QuickCreate';
import { ProfilePanel } from './ProfilePanel';
import { NotificationsPanel } from './NotificationsPanel';
import { SupportPanel } from './SupportPanel';
import { SectionHeader } from './SectionHeader';
import { FavoritesSection } from './FavoritesSection';
import { NavGroupRow } from './NavGroupRow';

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, onNavClick, onOpenSearch, onAction, consolidated = true }) => {
  const { user, can } = useAuth();
  const { companies, selectedCompanyId, setSelectedCompanyId, loading: companiesLoading } = useBusiness();
  const navigate = useNavigate();
  const navTree = useNavTree();

  const {
    state: uiState,
    toggleGroup,
    togglePin,
    setSearch,
    clearSearch,
    openPanel,
    closeAllPanels,
    isGroupOpen,
    pinnedSet,
    anyPanelOpen,
    setUnreadCount,
    expandAll,
    collapseAll,
  } = useSidebarReducer();

  const {
    openGroups,
    navSearch,
    showProfile,
    showQuickCreate,
    showNotifications,
    showSupport,
    showCompanySwitcher,
    unreadCount,
  } = uiState;

  const navScrollRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [dashboards] = useLocalStorage<any[]>('dashboards_config', []);

  const company = companies.find(c => c.id === selectedCompanyId);
  const companyIdx = companies.findIndex(c => c.id === selectedCompanyId);
  const userInitials = (user?.username ?? 'U').slice(0, 2).toUpperCase();
  const role = (user?.role ?? 'EMPLOYEE') as Role;
  const allowedSections = useMemo(() => allowedSectionsForRole(role), [role]);
  const superUser = isSuperUser(role);
  const roleBadge = ROLE_BADGE[role] ?? ROLE_BADGE.EMPLOYEE;
  const companyType = company?.type ?? '';
  const typeBadge = TYPE_BADGE_CLS[companyType] ?? TYPE_BADGE_CLS.SERVICE;

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications?unread=true&limit=1', { headers: { 'x-background': '1' } } as any);
      const count = res.data?.data?.pagination?.total ?? res.data?.total ?? 0;
      setUnreadCount(count);
    } catch { /* silent */ }
  }, [user, setUnreadCount]);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);
  useInterval(fetchUnread, user ? 60_000 : null);

  const closeAll = useCallback(() => { closeAllPanels(); }, [closeAllPanels]);

  useEffect(() => {
    const anyOpen = showProfile || showNotifications || showSupport || showQuickCreate || showCompanySwitcher;
    if (!anyOpen) return;
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) closeAll();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfile, showNotifications, showSupport, showQuickCreate, showCompanySwitcher, closeAll]);

  useEffect(() => {
    const anyOpen = showProfile || showNotifications || showSupport || showQuickCreate || showCompanySwitcher;
    if (!anyOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showProfile, showNotifications, showSupport, showQuickCreate, showCompanySwitcher, closeAll]);

  const location = useLocation();

  useEffect(() => { setSearch(''); }, [location.pathname, setSearch]);

  useEffect(() => {
    dynamicNavGroups.forEach(group => {
      if (group.flat) return;
      const hasActive = group.items.some(item => {
        const itemPath = item.to.split('?')[0];
        if (item.end) return location.pathname === itemPath;
        return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
      });
      if (hasActive) {
        const next = { ...openGroups };
        if (!next[group.key]) next[group.key] = true;
      }
    });
  }, [location.pathname, openGroups]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const active = navScrollRef.current?.querySelector('[aria-current="page"]') as HTMLElement | null;
      active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const dynamicNavGroups = useMemo((): NavGroup[] => {
    const groups = navTree.groups;
    if (!groups.length) return groups;
    const result: NavGroup[] = groups.map(g => ({ ...g, items: [...g.items] }));
    for (const g of result) {
      if (g.key === 'dashboard') {
        const hasManyDashboards = dashboards.length > 1;
        if (!hasManyDashboards) {
          g.flat = true;
          g.to = '/dashboard';
          g.items = [];
        } else {
          g.flat = false;
          g.to = undefined;
          g.items = [
            ...dashboards.map((d: any, i: number) => ({
              to: i === 0 ? '/dashboard' : `/dashboard/${d.id}`,
              icon: 'DASHBOARD' as const,
              label: d.name as string,
              end: true,
            })),
            { to: '#create-dashboard', icon: 'PLUS' as const, label: 'Create Dashboard' } as NavItem,
          ];
        }
      }
    }
    return result;
  }, [navTree.groups, dashboards]);

  const visibleGroups = useMemo(() => {
    const q = navSearch.trim().toLowerCase();
    return dynamicNavGroups
      .map(g => {
        const rbacItems = g.items.filter(item => !item.permission || can(item.permission));
        const items = q
          ? rbacItems.filter(item => item.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q))
          : rbacItems;
        return { group: g, items };
      })
      .filter(({ group, items }) => {
        if (group.sectionLabel) return true;
        const groupSectionKey = group.sectionKey ?? group.key;
        if (!superUser && group.key !== 'dashboard' && !allowedSections.includes(groupSectionKey)) {
          return false;
        }
        return (!group.permission || can(group.permission)) && (group.flat ? true : items.length > 0);
      });
  }, [can, dynamicNavGroups, navSearch, superUser, allowedSections]);

  const allItems = useMemo(() => dynamicNavGroups.flatMap(g => g.items), [dynamicNavGroups]);
  const favItems = useMemo(() =>
    allItems.filter(item => pinnedSet.has(item.to) && (!item.permission || can(item.permission))),
    [allItems, pinnedSet, can]
  );

  const sectionLabels = useMemo(
    () => visibleGroups.filter(({ group }) => group.sectionLabel),
    [visibleGroups]
  );
  const navGroups = useMemo(
    () => visibleGroups.filter(({ group }) => !group.sectionLabel),
    [visibleGroups]
  );

  const consolidatedNavGroups = useMemo((): Array<{ group: NavGroup; items: NavItem[] }> => {
    if (!consolidated) return navGroups;
    const groupMap = new Map(navGroups.map(({ group }) => [group.key, group]));
    const itemsMap = new Map<string, NavItem[]>();
    for (const { group, items } of navGroups) {
      itemsMap.set(group.key, items);
    }
    const result: Array<{ group: NavGroup; items: NavItem[] }> = [];
    for (const parent of AKAUNTING_PARENTS) {
      const childGroups = parent.childKeys.filter(k => groupMap.has(k));
      if (childGroups.length === 0) continue;
      const mergedItems = childGroups.flatMap(k => itemsMap.get(k) ?? []);
      const seen = new Set<string>();
      const uniqueItems = mergedItems.filter(item => {
        if (seen.has(item.to)) return false;
        seen.add(item.to);
        return true;
      });
      if (uniqueItems.length === 0) continue;
      result.push({
        group: {
          key: parent.id,
          label: parent.label,
          icon: parent.icon,
          items: uniqueItems,
        },
        items: uniqueItems,
      });
    }
    return result;
  }, [navGroups, consolidated]);

  const allGroupKeys = useMemo(
    () => AKAUNTING_PARENTS.map(p => p.id),
    []
  );

  const allExpanded = useMemo(() => {
    const renderedKeys = (consolidated ? consolidatedNavGroups : navGroups).map(({ group }) => group.key);
    return renderedKeys.length > 0 && renderedKeys.every(k => (openGroups[k] ?? false));
  }, [consolidated, consolidatedNavGroups, navGroups, openGroups]);

  const handleToggleAll = useCallback(() => {
    if (allExpanded) {
      collapseAll();
    } else {
      const renderedKeys = (consolidated ? consolidatedNavGroups : navGroups).map(({ group }) => group.key);
      expandAll(renderedKeys);
    }
  }, [allExpanded, collapseAll, expandAll, consolidated, consolidatedNavGroups, navGroups]);

  const handleCompanyClick = useCallback(() => {
    if (collapsed) {
      closeAll();
      onToggle();
      if (companies.length > 1) setTimeout(() => openPanel('showCompanySwitcher'), 310);
    } else {
      const wasOpen = showCompanySwitcher;
      closeAll();
      if (!wasOpen && companies.length > 1) openPanel('showCompanySwitcher');
    }
  }, [collapsed, closeAll, onToggle, openPanel, companies.length, showCompanySwitcher]);

  const handleRailClick = useCallback((panel: 'showProfile' | 'showQuickCreate' | 'showNotifications' | 'showSupport') => {
    if (collapsed) {
      closeAll();
      onToggle();
      setTimeout(() => openPanel(panel), 310);
    } else {
      const isAlreadyOpen = uiState[panel];
      closeAll();
      if (!isAlreadyOpen) openPanel(panel);
    }
  }, [collapsed, closeAll, onToggle, openPanel, uiState]);

  return (
    <div ref={sidebarRef} className="relative h-full flex select-none w-full overflow-visible">

      {/* LEFT RAIL — 56px wide, icon-only */}
      <div
        style={{ width: layout.sidebarCollapsedWidth }}
        className="relative z-10 flex flex-col items-center shrink-0 h-full overflow-visible bg-white border-r border-slate-200/80"
      >
        {/* Brand mark */}
        <div className="w-full flex items-center justify-center py-3 pb-2 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <Icon name="BOOK_OPEN" size={15} />
          </div>
        </div>

        {/* Company avatar + role badge */}
        <div className="w-full flex flex-col items-center pt-2 pb-1 px-1.5 border-b border-slate-100 shrink-0">
          <div className="relative group/co">
            <button
              onClick={handleCompanyClick}
              aria-label={`Active company: ${company?.name ?? 'OVDS'}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shadow-sm transition-all duration-150 ${
                company
                  ? `bg-gradient-to-br ${COMPANY_GRADIENTS[Math.max(0, companyIdx) % COMPANY_GRADIENTS.length]}`
                  : 'bg-gradient-to-br from-blue-500 to-blue-700'
              } ${showCompanySwitcher ? 'ring-2 ring-blue-400 ring-offset-1' : 'hover:ring-2 hover:ring-slate-200 hover:ring-offset-1'}`}
            >
              {companiesLoading
                ? <span className="w-3.5 h-3.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />
                : (company ? companyInitials(company.name) : 'OV')
              }
              {!companiesLoading && company && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
              )}
            </button>
            {/* Role badge tooltip */}
            {!anyPanelOpen && !collapsed && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[400] opacity-0 group-hover/co:opacity-100 transition-opacity duration-100 delay-300">
                <div className="bg-slate-800 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-xl flex items-center gap-1.5">
                  <span className="max-w-[140px] truncate">{company?.name ?? 'OVDS'}</span>
                  <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${roleBadge.cls}`}>{roleBadge.label}</span>
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                </div>
              </div>
            )}
          </div>
          {/* Company type badge (shown when rail is collapsed) */}
          {collapsed && companyType && (
            <span className={`mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md ${typeBadge.cls}`}>
              {typeBadge.label}
            </span>
          )}
        </div>

        {/* Company switcher dropdown */}
        {collapsed && showCompanySwitcher && (
          <div className="absolute top-[60px] left-12 z-[350]">
            <CompanySwitcherPanel
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelect={setSelectedCompanyId}
              onClose={closeAll}
              onManage={() => navigate('/settings/companies')}
              canAddCompany={can('companies:write')}
              onAddCompany={() => navigate('/settings/companies')}
            />
          </div>
        )}

        {/* Icon buttons — scrollable middle zone */}
        <div className="flex flex-col items-center gap-1 px-1.5 py-2 flex-1 overflow-y-auto scrollbar-hide">
          <RailButton label={user?.username ?? 'Profile'} active={showProfile} suppressTooltip={anyPanelOpen} onClick={() => handleRailClick('showProfile')}>
            <span className="text-[10px] font-bold leading-none">{showProfile ? <Icon name="CONTACT" size={15} /> : userInitials}</span>
          </RailButton>

          <RailButton label={unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications'} active={showNotifications} badge={unreadCount} suppressTooltip={anyPanelOpen} onClick={() => handleRailClick('showNotifications')}>
            <Icon name="BELL" size={15} />
          </RailButton>

          <RailButton label="Search (⌘K)" suppressTooltip={anyPanelOpen} onClick={() => onOpenSearch?.()}>
            <Icon name="SEARCH" size={15} />
          </RailButton>

          <RailButton label="Quick Create" active={showQuickCreate} suppressTooltip={anyPanelOpen} onClick={() => handleRailClick('showQuickCreate')}>
            <Icon name="PLUS" size={15} />
          </RailButton>
        </div>

        {/* Bottom utilities */}
        <div className="flex flex-col items-center gap-1 px-1.5 py-2 border-t border-slate-100 shrink-0">
          {can('settings:read') && (
            <RailButton label="Settings" suppressTooltip={anyPanelOpen} onClick={() => navigate('/settings')}>
              <Icon name="SETTINGS" size={15} />
            </RailButton>
          )}
          <RailButton label="Help & Support" active={showSupport} suppressTooltip={anyPanelOpen} onClick={() => handleRailClick('showSupport')}>
            <Icon name="HELP_CIRCLE" size={15} />
          </RailButton>
        </div>

        {/* Fly-over panels */}
        {showQuickCreate && <QuickCreateMenu onClose={closeAll} onNavClick={onNavClick} />}
        {showNotifications && <NotificationsPanel onClose={closeAll} onNavClick={onNavClick} />}
        {showSupport && <SupportPanel onClose={closeAll} onNavClick={onNavClick} />}
        {showProfile && <ProfilePanel onClose={closeAll} onNavClick={onNavClick} />}
      </div>

      {/* RIGHT NAV PANEL — clean white, Akaunting-inspired */}
      <aside
        className={[
          'aki-sidebar flex flex-col h-full bg-white',
          'border-r border-slate-200/80',
          'transition-all duration-200 ease-out overflow-hidden',
          collapsed ? 'aki-sidebar-collapsed opacity-0 pointer-events-none' : 'opacity-100',
        ].join(' ')}
        style={{ width: collapsed ? 0 : layout.sidebarWidth }}
        aria-hidden={collapsed ? true : undefined}
      >
        {/* Brand + collapse button + role badge */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-200">
              <Icon name="BOOK_OPEN" size={13} />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-slate-800 leading-none">OVDS</h1>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Ethiopia ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(consolidatedNavGroups.length > 1 || navGroups.length > 1) && (
              <button
                type="button"
                onClick={handleToggleAll}
                title={allExpanded ? 'Collapse all groups' : 'Expand all groups'}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Icon name={allExpanded ? 'CHEVRON_UP' : 'CHEVRON_DOWN'} size={13} />
              </button>
            )}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${roleBadge.cls}`}>
              {roleBadge.label}
            </span>
            <button
              type="button"
              onClick={onToggle}
              title="Collapse sidebar"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Icon name="CHEVRON_LEFT" size={13} />
            </button>
          </div>
        </div>

        {/* Nav scroll area */}
        <div
          ref={navScrollRef}
          role="navigation"
          aria-label="Main navigation"
          className="flex-1 overflow-y-auto overflow-x-hidden aki-sidebar-scroll"
          style={{ overscrollBehavior: 'contain', contain: 'layout style' }}
        >
          {/* Favorites strip */}
          {!navSearch && (
            <FavoritesSection
              favItems={favItems}
              onNavClick={onNavClick}
              onTogglePin={togglePin}
            />
          )}

          {/* Section labels + nav groups */}
          <div className={favItems.length > 0 && !navSearch ? '' : 'pt-2'}>
            {!consolidated && sectionLabels.map(({ group }) => (
              <SectionHeader key={`sec-${group.key}`} group={group} />
            ))}

            {(consolidated ? consolidatedNavGroups : navGroups).length === 0 && navSearch ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Icon name="SEARCH" size={18} className="text-slate-400" />
                </div>
                <p className="text-[12px] font-semibold text-slate-500">No matches for "{navSearch}"</p>
                <button onClick={clearSearch} className="mt-2 text-[11px] text-blue-500 hover:text-blue-700 transition-colors">
                  Clear search
                </button>
              </div>
            ) : (
              (consolidated ? consolidatedNavGroups : navGroups).map(({ group, items }, idx, arr) => (
                <React.Fragment key={group.key}>
                  {/* Section divider between consolidated groups */}
                  {consolidated && idx > 0 && (
                    <div className="mx-3 my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                  )}
                  <NavGroupRow
                    group={group}
                    visibleItems={items}
                    isOpen={isGroupOpen(group.key)}
                    onToggle={() => toggleGroup(group.key)}
                    onNavClick={onNavClick}
                    pinnedRoutes={pinnedSet}
                    onTogglePin={togglePin}
                    onAction={onAction}
                    searchQuery={navSearch}
                  />
                </React.Fragment>
              ))
            )}
          </div>

          {/* Pin hint */}
          {favItems.length === 0 && !navSearch && (
            <div className="flex items-start gap-1.5 px-4 py-3 mx-2 mt-2 rounded-xl bg-amber-50 border border-amber-100">
              <Icon name="STAR" size={10} className="shrink-0 text-amber-400 fill-amber-400 mt-0.5" />
              <p className="text-[10px] text-amber-700 leading-relaxed">
                Hover any item and click <strong>★</strong> to pin favorites here
              </p>
            </div>
          )}

          {/* Bottom breathing room */}
          <div className="h-6" />
        </div>
      </aside>

      {/* Expand button — shown when nav panel is collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          title="Expand sidebar"
          className="absolute left-[44px] top-[12px] w-5 h-5 z-20 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Icon name="CHEVRON_RIGHT" size={12} />
        </button>
      )}
    </div>
  );
};

export default Sidebar;
