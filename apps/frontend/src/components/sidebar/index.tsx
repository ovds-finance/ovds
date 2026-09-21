import { allowedSectionsForRole, isSuperUser, type Role } from '@ovds/shared';
import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import { useLocalStorage, useInterval } from '../../hooks';
import { useEnrichedNavTree } from '../../hooks/useEnrichedNavTree';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';
import { Icon } from '../ui';
import type { NavItem, NavGroup } from '../utils/navGroups';

import { CompanySwitcherPanel } from './CompanySwitcher';
import { ROLE_BADGE, TYPE_BADGE_CLS } from './constants';
import { companyInitials } from './utils';
import { useSidebarReducer } from './useSidebarReducer';


const OVDS_NAV_PARENTS: Array<{
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
  { id: 'system_admin', label: 'System & Administration', icon: 'SETTINGS',      childKeys: ['system', 'administration', 'governance', 'iot', 'device_control', 'developer'] },
];

import { FavoritesSection } from './FavoritesSection';
import { NavGroupRow } from './NavGroupRow';
import { NotificationsPanel } from './NotificationsPanel';
import { ProfilePanel } from './ProfilePanel';
import { QuickCreateMenu } from './QuickCreate';
import { RailButton } from './RailButton';
import { SectionHeader } from './SectionHeader';
import { SupportPanel } from './SupportPanel';
import type { SidebarProps } from './types';

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, onNavClick, onOpenSearch, onAction, consolidated = true }) => {
  const { user, can } = useAuth();
  const { companies, selectedCompanyId, setSelectedCompanyId, loading: companiesLoading } = useBusiness();
  const navigate = useNavigate();
  const navTree = useEnrichedNavTree();

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
  const _companyIdx = companies.findIndex(c => c.id === selectedCompanyId);
  const userInitials = (user?.username ?? 'U').slice(0, 2).toUpperCase();
  const role = (user?.role ?? 'EMPLOYEE') as Role;
  const allowedSections = useMemo(() => allowedSectionsForRole(role), [role]);
  const superUser = isSuperUser(role);
  const roleBadge = ROLE_BADGE[role] ?? ROLE_BADGE.EMPLOYEE;
  const companyType = company?.type ?? '';
  const _typeBadge = TYPE_BADGE_CLS[companyType] ?? TYPE_BADGE_CLS.SERVICE;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    for (const parent of OVDS_NAV_PARENTS) {
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

  const _allGroupKeys = useMemo(
    () => OVDS_NAV_PARENTS.map(p => p.id),
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
    <div
      ref={sidebarRef}
      style={{ position: 'relative', height: '100%', display: 'flex', userSelect: 'none', width: '100%', overflow: 'visible' }}
    >

      {/* ════════════════════════════════════════════════════════════════
          LEFT RAIL — 56px, icon-only, Ovds SaaS white rail
          ════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: 56, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          height: '100%', overflow: 'visible',
          background: 'var(--sidebar-rail-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          position: 'relative', zIndex: 10,
        }}
      >
        {/* ── Brand mark ──────────────────────────────────────────────── */}
        <div
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '14px 0 12px',
            borderBottom: '1px solid var(--sidebar-border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--pro-gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79,186,111,0.35)',
            }}
          >
            <Icon name="BOOK_OPEN" size={14} style={{ color: '#fff' }} />
          </div>
        </div>

        {/* ── Company avatar ───────────────────────────────────────────── */}
        <div
          style={{
            width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0 8px',
            borderBottom: '1px solid var(--sidebar-border)',
            flexShrink: 0,
          }}
        >
          <div className="relative group/co">
            <button
              onClick={handleCompanyClick}
              aria-label={`Active company: ${company?.name ?? 'OVDS'}`}
              style={{
                width: 36, height: 36, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff',
                background: 'var(--pro-gradient-primary)',
                boxShadow: showCompanySwitcher
                  ? '0 0 0 2px var(--pro-azure), 0 4px 12px rgba(79,186,111,0.35)'
                  : '0 2px 8px rgba(79,186,111,0.25)',
                border: 'none', cursor: 'pointer',
                transition: 'box-shadow 150ms',
                position: 'relative',
              }}
            >
              {companiesLoading
                ? <span style={{ width: 14, height: 14, border: '1.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'aki-spin 0.8s linear infinite', display: 'block' }} />
                : (company ? companyInitials(company.name) : 'OV')
              }
              {/* Online dot */}
              {!companiesLoading && company && (
                <span
                  style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#34D399',
                    border: '2px solid var(--sidebar-rail-bg)',
                  }}
                />
              )}
            </button>

            {/* Tooltip */}
            {!anyPanelOpen && (
              <div
                style={{
                  pointerEvents: 'none',
                  position: 'absolute', left: 'calc(100% + 12px)', top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 400,
                  opacity: 0, transition: 'opacity 120ms 300ms',
                  whiteSpace: 'nowrap',
                }}
                className="group-hover/co:opacity-100"
              >
                <div
                  style={{
                    background: '#1F2937', color: '#F9FAFB',
                    fontSize: 11, fontWeight: 600,
                    padding: '5px 11px', borderRadius: 6,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
                  }}
                >
                  <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {company?.name ?? 'OVDS'}
                  </span>
                  <span
                    style={{
                      fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                      background: 'rgba(79,186,111,0.20)', color: 'var(--pro-azure)',
                    }}
                  >
                    {roleBadge.label}
                  </span>
                  <span style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', borderWidth: 5, borderStyle: 'solid', borderColor: 'transparent #1F2937 transparent transparent' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company switcher flyout */}
        {collapsed && showCompanySwitcher && (
          <div style={{ position: 'absolute', top: 60, left: 68, zIndex: 350 }}>
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

        {/* ── Rail icon buttons — middle zone ─────────────────────────── */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '8px 0', flex: 1,
            overflowY: 'auto', overflowX: 'hidden',
          }}
          className="sidebar-scroll"
        >
          {/* Profile */}
          <RailButton
            label={user?.username ?? 'Profile'}
            active={showProfile}
            suppressTooltip={anyPanelOpen}
            onClick={() => handleRailClick('showProfile')}
          >
            <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {showProfile ? <Icon name="CONTACT" size={15} /> : userInitials}
            </span>
          </RailButton>

          {/* Notifications */}
          <RailButton
            label={unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications'}
            active={showNotifications}
            badge={unreadCount}
            suppressTooltip={anyPanelOpen}
            onClick={() => handleRailClick('showNotifications')}
          >
            <Icon name="BELL" size={15} />
          </RailButton>

          {/* Search */}
          <RailButton label="Search (⌘K)" suppressTooltip={anyPanelOpen} onClick={() => onOpenSearch?.()}>
            <Icon name="SEARCH" size={15} />
          </RailButton>

          {/* Quick Create */}
          <RailButton
            label="Quick Create"
            active={showQuickCreate}
            suppressTooltip={anyPanelOpen}
            onClick={() => handleRailClick('showQuickCreate')}
          >
            <Icon name="PLUS" size={15} />
          </RailButton>

          {/* Expand / collapse toggle */}
          <div style={{ marginTop: 4 }}>
            <RailButton label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} suppressTooltip={anyPanelOpen} onClick={onToggle}>
              <Icon name={collapsed ? 'CHEVRON_RIGHT' : 'CHEVRON_LEFT'} size={14} />
            </RailButton>
          </div>
        </div>

        {/* ── Bottom rail buttons ──────────────────────────────────────── */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '8px 0',
            borderTop: '1px solid var(--sidebar-border)',
            flexShrink: 0,
          }}
        >
          {can('settings:read') && (
            <RailButton label="Settings" suppressTooltip={anyPanelOpen} onClick={() => navigate('/settings')}>
              <Icon name="SETTINGS" size={15} />
            </RailButton>
          )}
          <RailButton
            label="Help & Support"
            active={showSupport}
            suppressTooltip={anyPanelOpen}
            onClick={() => handleRailClick('showSupport')}
          >
            <Icon name="HELP_CIRCLE" size={15} />
          </RailButton>
        </div>

        {/* Fly-over panels */}
        {showQuickCreate    && <QuickCreateMenu      onClose={closeAll} onNavClick={onNavClick} />}
        {showNotifications  && <NotificationsPanel   onClose={closeAll} onNavClick={onNavClick} />}
        {showSupport        && <SupportPanel         onClose={closeAll} onNavClick={onNavClick} />}
        {showProfile        && <ProfilePanel         onClose={closeAll} onNavClick={onNavClick} />}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          RIGHT NAV PANEL — white, 220px, Ovds SaaS style collapsible
          ════════════════════════════════════════════════════════════════ */}
      <aside
        aria-hidden={collapsed ? true : undefined}
        style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          width: collapsed ? 0 : 220,
          overflow: 'hidden',
          transition: 'width 200ms cubic-bezier(0.4,0,0.2,1)',
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? 'none' : 'auto',
          flexShrink: 0,
        }}
      >
        {/* ── Panel header ────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid var(--sidebar-border)',
            background: 'var(--sidebar-bg)',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: 'var(--pro-gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(79,186,111,0.30)',
              }}
            >
              <Icon name="BOOK_OPEN" size={12} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                OVDS
              </h1>
              <p style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                Ethiopia ERP
              </p>
            </div>
          </div>

          {/* Actions row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Expand/collapse all groups */}
            {(consolidatedNavGroups.length > 1 || navGroups.length > 1) && (
              <button
                type="button"
                onClick={handleToggleAll}
                title={allExpanded ? 'Collapse all' : 'Expand all'}
                style={{
                  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-4)', transition: 'background 100ms, color 100ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)'; }}
              >
                <Icon name={allExpanded ? 'CHEVRON_UP' : 'CHEVRON_DOWN'} size={12} />
              </button>
            )}
            {/* Role badge — Ovds SaaS style green pill */}
            <span
              style={{
                fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                background: 'var(--sidebar-new-badge-bg)', color: 'var(--sidebar-new-badge-fg)',
                letterSpacing: '0.03em',
              }}
            >
              {roleBadge.label}
            </span>
          </div>
        </div>

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div
          style={{
            padding: '8px 10px',
            borderBottom: '1px solid var(--sidebar-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative' }}>
            <Icon
              name="SEARCH"
              size={12}
              style={{
                position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-4)', pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              placeholder="Filter navigation…"
              value={navSearch}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px 6px 28px',
                background: 'var(--sys-bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 11, fontWeight: 500,
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 130ms, background 130ms',
              }}
              onFocus={e => {
                (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--pro-azure)';
                (e.currentTarget as HTMLInputElement).style.background = '#fff';
              }}
              onBlur={e => {
                (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLInputElement).style.background = 'var(--sys-bg-subtle)';
              }}
              aria-label="Filter navigation"
            />
            {navSearch && (
              <button
                onClick={clearSearch}
                style={{
                  position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-4)', display: 'flex', alignItems: 'center',
                  padding: 2, borderRadius: 4,
                }}
                aria-label="Clear search"
              >
                <Icon name="CLOSE" size={10} />
              </button>
            )}
          </div>
        </div>

        {/* ── Nav scroll area ─────────────────────────────────────────── */}
        <div
          ref={navScrollRef}
          role="navigation"
          aria-label="Main navigation"
          className="sidebar-scroll"
          style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            overscrollBehavior: 'contain',
          }}
        >
          {/* Favorites */}
          {!navSearch && (
            <FavoritesSection
              favItems={favItems}
              onNavClick={onNavClick}
              onTogglePin={togglePin}
            />
          )}

          {/* Nav groups */}
          <div style={{ paddingTop: favItems.length > 0 && !navSearch ? 0 : 8 }}>
            {!consolidated && sectionLabels.map(({ group }) => (
              <SectionHeader key={`sec-${group.key}`} group={group} />
            ))}

            {(consolidated ? consolidatedNavGroups : navGroups).length === 0 && navSearch ? (
              /* Empty state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--sys-bg-subtle)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Icon name="SEARCH" size={17} style={{ color: 'var(--text-4)' }} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: 6 }}>
                  No matches for "{navSearch}"
                </p>
                <button
                  onClick={clearSearch}
                  style={{
                    fontSize: 11, color: 'var(--pro-azure)', background: 'none',
                    border: 'none', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              (consolidated ? consolidatedNavGroups : navGroups).map(({ group, items }, idx) => (
                <React.Fragment key={group.key}>
                  {consolidated && idx > 0 && (
                    <div
                      style={{
                        height: 1, margin: '4px 12px',
                        background: 'var(--border-alt)',
                      }}
                    />
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
            <div
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                margin: '8px 10px',
                padding: '10px 12px',
                borderRadius: 7,
                background: 'var(--sys-bg-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              <Icon name="STAR" size={10} style={{ color: 'var(--pro-azure)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 10, color: 'var(--text-4)', lineHeight: 1.5 }}>
                Hover any item and click <strong style={{ color: 'var(--pro-azure)' }}>★</strong> to pin favorites
              </p>
            </div>
          )}

          {/* Bottom breathing room */}
          <div style={{ height: 24 }} />
        </div>

        {/* ── Footer strip ────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 12px',
            borderTop: '1px solid var(--sidebar-border)',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--sidebar-bg)',
          }}
        >
          {/* Company info */}
          {company && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {company.name}
              </p>
              {company.tin && (
                <p style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 1 }}>
                  TIN {company.tin}
                </p>
              )}
            </div>
          )}
          {/* Settings shortcut */}
          {can('settings:read') && (
            <button
              onClick={() => navigate('/settings')}
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, background: 'transparent', border: 'none',
                color: 'var(--text-4)', cursor: 'pointer',
                transition: 'background 100ms, color 100ms', flexShrink: 0,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--pro-azure)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)'; }}
              title="Settings"
            >
              <Icon name="SETTINGS" size={13} />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
