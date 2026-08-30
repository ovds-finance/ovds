import type { MenuItem } from '../kernel/module.interface';

export interface MenuGroup {
  key: string;
  label: string;
  items: MenuItem[];
  order: number;
  collapsed?: boolean;
  requiredPermission?: string;
}

export interface MenuBuilderInterface {
  addItem(item: MenuItem): MenuBuilderInterface;
  addGroup(group: MenuGroup): MenuBuilderInterface;
  build(): MenuGroup[];
}
