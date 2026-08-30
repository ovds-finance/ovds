import type React from 'react';
import type { IconType } from '@ovds/ui';
import type { Permission } from '../../rbac/rbac';

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
  onOpenSearch?: () => void;
  onAction?: (action: string) => void;
  /** Akaunting-style semantic clustering (default true). */
  consolidated?: boolean;
}

export interface QuickCreateAction {
  label: string;
  sub: string;
  icon: IconType;
  to: string;
  permission: Permission;
  color: string;
  iconColor: string;
}

export interface SidebarNotification {
  id: string;
  title: string;
  body: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

export interface CompanySwitcherPanelProps {
  companies: Array<{ id: string; name: string; type: string; tin?: string }>;
  selectedCompanyId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onManage: () => void;
  canAddCompany?: boolean;
  onAddCompany?: () => void;
}

export interface NavGroupRowProps {
  group: NavGroup;
  visibleItems: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
  pinnedRoutes: Set<string>;
  onTogglePin: (to: string) => void;
  onAction?: (action: string) => void;
  searchQuery?: string;
}

export interface NavItem {
  to: string;
  icon: IconType | React.ReactNode;
  label: string;
  i18nKey?: string;
  permission?: Permission;
  isNew?: boolean;
  badge?: number;
  pinnable?: boolean;
  end?: boolean;
  keywords?: string[];
  priority?: number;
  source?: 'static' | 'dynamic' | 'admin';
}

export interface NavGroup {
  key: string;
  label: string;
  i18nKey?: string;
  icon: IconType | React.ReactNode;
  permission?: Permission;
  items: NavItem[];
  flat?: boolean;
  to?: string;
  sectionLabel?: boolean;
  sectionKey?: string;
  source?: 'static' | 'dynamic' | 'admin';
}

export interface RailButtonProps {
  label: string;
  active?: boolean;
  badge?: number;
  suppressTooltip?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export interface PanelRowProps {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  badge?: string;
  badgeCls?: string;
  onClick: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}
