import { MenuGroup, MenuBuilderInterface } from './menu.interface';
import type { MenuItem } from '../kernel/module.interface';
export declare class MenuBuilder implements MenuBuilderInterface {
    private groups;
    addItem(item: MenuItem): MenuBuilderInterface;
    addGroup(group: MenuGroup): MenuBuilderInterface;
    build(): MenuGroup[];
    clear(): void;
}
//# sourceMappingURL=menu.builder.d.ts.map