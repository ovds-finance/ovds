import { MenuGroup, MenuBuilderInterface } from './menu.interface';
import type { MenuItem } from '../kernel/module.interface';

export class MenuBuilder implements MenuBuilderInterface {
  private groups: Map<string, MenuGroup> = new Map();

  addItem(item: MenuItem): MenuBuilderInterface {
    const groupKey = item.group ?? 'general';
    const group = this.groups.get(groupKey) ?? {
      key: groupKey,
      label: groupKey,
      items: [],
      order: 99,
    };
    group.items.push(item);
    group.items.sort((a, b) => a.order - b.order);
    this.groups.set(groupKey, group);
    return this;
  }

  addGroup(group: MenuGroup): MenuBuilderInterface {
    group.items.sort((a, b) => a.order - b.order);
    this.groups.set(group.key, group);
    return this;
  }

  build(): MenuGroup[] {
    return Array.from(this.groups.values()).sort((a, b) => a.order - b.order);
  }

  clear(): void {
    this.groups.clear();
  }
}
