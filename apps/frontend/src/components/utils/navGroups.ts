import type React from 'react';
import type { IconType } from '@ovds/ui';
import type { Permission } from '../../rbac/rbac';

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
