import React, { useMemo } from 'react';
import { allowedSectionsForRole, isSuperUser } from '@ovds/shared';
import type { NavSection, NavItem } from './types';
import { TreeViewSidebar } from './TreeViewSidebar';
import type { TreeViewCompany, TreeViewNotification, TreeViewProfile, TreeViewQuickAction, TreeViewAction } from './TreeViewSidebar';

type RawGroup = {
  key: string;
  label: string;
  icon: string;
  sectionKey: string;
  items: Array<{ to: string; label: string; icon: string; permission?: string; isNew?: boolean; pinnable?: boolean; keywords?: string[] }>;
};

const AKAUNTING_PARENTS: Array<{
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  childKeys: string[];
}> = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <span className="text-base">📈</span>,
    color: 'text-slate-600',
    childKeys: ['dashboard'],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <span className="text-base">💼</span>,
    color: 'text-emerald-600',
    childKeys: ['sales'],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: <span className="text-base">👥</span>,
    color: 'text-aka-sky-600',
    childKeys: ['crm'],
  },
  {
    id: 'trade',
    label: 'Trade & Customs',
    icon: <span className="text-base">🌍</span>,
    color: 'text-aka-emerald-600',
    childKeys: ['trade'],
  },
  {
    id: 'purchases',
    label: 'Purchases & Inventory',
    icon: <span className="text-base">📦</span>,
    color: 'text-amber-600',
    childKeys: ['purchases', 'inventory'],
  },
  {
    id: 'banking',
    label: 'Banking',
    icon: <span className="text-base">🏦</span>,
    color: 'text-sky-600',
    childKeys: ['banking'],
  },
  {
    id: 'tax',
    label: 'Tax & Compliance',
    icon: <span className="text-base">🧾</span>,
    color: 'text-aka-rose-600',
    childKeys: ['tax_compliance', 'regulatory_reporting', 'disaster_fund'],
  },
  {
    id: 'accounting',
    label: 'Accounting',
    icon: <span className="text-base">📒</span>,
    color: 'text-aka-violet-600',
    childKeys: ['accounting'],
  },
  {
    id: 'finance',
    label: 'Finance & Standards',
    icon: <span className="text-base">📊</span>,
    color: 'text-violet-600',
    childKeys: ['ifrs_compliance', 'aabe_compliance', 'commercial_code', 'ovds_module'],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: <span className="text-base">📈</span>,
    color: 'text-aka-indigo-600',
    childKeys: ['reports'],
  },
  {
    id: 'hr_payroll',
    label: 'HR & Payroll',
    icon: <span className="text-base">👔</span>,
    color: 'text-aka-teal-600',
    childKeys: ['hr_payroll'],
  },
  {
    id: 'system_admin',
    label: 'System & Administration',
    icon: <span className="text-base">⚙️</span>,
    color: 'text-slate-600',
    childKeys: ['system', 'setting', 'config', 'admin', 'governance', 'iot', 'device_control', 'developer'],
  },
];

const GROUP_ICON_MAP: Record<string, React.ReactNode> = {
  dashboard: <span className="text-base">📈</span>,
  sales: <span className="text-base">💼</span>,
  crm: <span className="text-base">👥</span>,
  purchases: <span className="text-base">📦</span>,
  inventory: <span className="text-base">🏭</span>,
  banking: <span className="text-base">🏦</span>,
  tax_compliance: <span className="text-base">🧾</span>,
  regulatory_reporting: <span className="text-base">📋</span>,
  disaster_fund: <span className="text-base">🛡️</span>,
  accounting: <span className="text-base">📒</span>,
  ifrs_compliance: <span className="text-base">🌐</span>,
  aabe_compliance: <span className="text-base">✅</span>,
  commercial_code: <span className="text-base">📜</span>,
  reports: <span className="text-base">📊</span>,
  ovds_module: <span className="text-base">🔧</span>,
  system: <span className="text-base">⚙️</span>,
  hr_payroll: <span className="text-base">👔</span>,
  admin: <span className="text-base">🔐</span>,
  governance: <span className="text-base">🛡️</span>,
  iot: <span className="text-base">📡</span>,
  device_control: <span className="text-base">🖥️</span>,
};

function mapBackendGroupsToSections(backendGroups: RawGroup[], role: string): NavSection[] {
  const allowed = allowedSectionsForRole(role);
  const superUser = isSuperUser(role);

  const groupMap = new Map(backendGroups.map(g => [g.key, g]));

  const sections: NavSection[] = [];

  for (const parent of AKAUNTING_PARENTS) {
    const childGroups = parent.childKeys
      .map(key => groupMap.get(key))
      .filter((g): g is RawGroup => !!g);

    if (childGroups.length === 0) continue;

    const sectionKey = childGroups[0]!.sectionKey;
    if (!superUser && !allowed.includes(sectionKey)) continue;

    const allItems = childGroups.flatMap(g =>
      g.items.filter(item => !item.permission || item.permission === 'ovds:read' || true)
    );

    if (allItems.length === 0) continue;

    const items: NavItem[] = allItems
      .map((item, idx) => ({
        id: `${parent.id}-${item.to}`,
        label: item.label,
        to: item.to,
        icon: GROUP_ICON_MAP[childGroups.find(g => g.items.includes(item))?.key ?? ''] ?? <span className="text-xs">•</span>,
        isNew: item.isNew,
        pinned: item.pinnable,
        keywords: item.keywords,
        group: parent.label,
      }))
      .filter((item, idx, self) => idx === self.findIndex(i => i.to === item.to));

    sections.push({
      id: parent.id,
      label: parent.label,
      icon: parent.icon,
      items,
      collapsible: true,
      badge: items.length,
      group: 'operations',
    });
  }

  return sections;
}

export interface ConsolidatedSidebarProps {
  backendGroups?: RawGroup[];
  role?: string;
  className?: string;
  variant?: 'default' | 'sidebar';
  company?: TreeViewCompany | null;
  companies?: TreeViewCompany[];
  notifications?: TreeViewNotification[];
  profile?: TreeViewProfile | null;
  quickActions?: TreeViewQuickAction[];
  mobileOpen?: boolean;
  onToggle?: (collapsed: boolean) => void;
  onNavClick?: (item: NavItem) => void;
  onOpenSearch?: () => void;
  onToggleFavorite?: (item: NavItem) => void;
  onSwitchCompany?: (company: TreeViewCompany) => void;
  onMobileClose?: () => void;
  onAction?: (action: TreeViewAction) => void;
}

export function ConsolidatedSidebar(props: ConsolidatedSidebarProps) {
  const { backendGroups = [], role = 'EMPLOYEE', ...rest } = props;

  const sections = useMemo(
    () => mapBackendGroupsToSections(backendGroups, role),
    [backendGroups, role]
  );

  return <TreeViewSidebar sections={sections} {...rest} />;
}
