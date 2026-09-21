import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma.service';

export interface ModuleDefinition {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  isCore?: boolean;
  isPremium?: boolean;
  dependsOn?: string[];
}

const DEFAULT_MODULES: ModuleDefinition[] = [
  { key: 'sales',        name: 'Sales',             description: 'Sales & Invoicing',         icon: 'ShoppingCart',  isCore: true },
  { key: 'purchases',    name: 'Purchases',         description: 'Purchases & Procurement',   icon: 'ShoppingBag',   isCore: true },
  { key: 'banking',      name: 'Banking',           description: 'Banking & Treasury',        icon: 'Landmark',      isCore: true },
  { key: 'items',        name: 'Items',             description: 'Items & Inventory',         icon: 'Package',       isCore: true },
  { key: 'double-entry', name: 'Double Entry',      description: 'General Ledger & Double Entry', icon: 'BookOpen',  isCore: true, dependsOn: ['items', 'sales'] },
  { key: 'tax',          name: 'Tax',               description: 'Tax & VAT',                 icon: 'Receipt',       isCore: true, dependsOn: ['sales', 'purchases'] },
  { key: 'hr',           name: 'HR',                description: 'Human Resources',           icon: 'Users',         isCore: false },
  { key: 'compliance',   name: 'Compliance',        description: 'Compliance & Audit',        icon: 'Shield',        isCore: false, dependsOn: ['tax', 'double-entry'] },
  { key: 'appstore',     name: 'App Store',         description: 'App Store',                 icon: 'Store',         isCore: false },
  { key: 'crm',          name: 'CRM',               description: 'Customer Relationship Management', icon: 'UserCheck', isCore: false, dependsOn: ['sales'] },
  { key: 'payroll',      name: 'Payroll',           description: 'Payroll Management',        icon: 'DollarSign',    isCore: false, dependsOn: ['hr', 'double-entry'] },
  { key: 'inventory',    name: 'Inventory',         description: 'Advanced Inventory',        icon: 'Warehouse',     isCore: false, dependsOn: ['items'] },
];

@Injectable()
export class ModuleBootstrapService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure every company has the default module catalog installed.
   *
   * Called automatically after company creation and can be re-run
   * safely for existing companies (idempotent upsert).
   */
  async seedDefaultModules(companyId: string): Promise<void> {
    const existing = new Set(
      (await this.prisma.companyModule.findMany({
        where: { companyId },
        select: { moduleKey: true },
      })).map((m) => m.moduleKey),
    );

    const toCreate = DEFAULT_MODULES.filter((m) => !existing.has(m.key));

    if (toCreate.length === 0) {
      return;
    }

    await this.prisma.companyModule.createMany({
      data: toCreate.map((m) => ({
        companyId,
        moduleKey: m.key,
        isEnabled: m.isCore ?? false,
        settings: JSON.stringify({
          isPremium: m.isPremium ?? false,
          description: m.description ?? null,
          icon: m.icon ?? null,
          dependsOn: m.dependsOn ?? [],
        }),
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Return the full module catalog with per-company activation state.
   */
  async getModuleCatalog(companyId?: string | null) {
    const [modules, companyModules] = await Promise.all([
      this.prisma.module.findMany({ orderBy: { sortOrder: 'asc' } }),
      companyId
        ? this.prisma.companyModule.findMany({ where: { companyId } })
        : Promise.resolve([]),
    ]);

    const moduleMap = new Map(modules.map((m) => [m.key, m]));
    const companyMap = new Map(companyModules.map((m) => [m.moduleKey, m]));

    return DEFAULT_MODULES.map((m) => {
      const dbRecord = moduleMap.get(m.key);
      const companyState = companyMap.get(m.key);

      return {
        key: m.key,
        name: m.name,
        description: m.description,
        icon: m.icon,
        isCore: m.isCore ?? dbRecord?.isCore ?? false,
        isEnabled: companyState?.isEnabled ?? (m.isCore ?? false),
        activatedAt: companyState?.activatedAt ?? null,
        dependsOn: m.dependsOn ?? [],
        settings: companyState?.settings ? JSON.parse(companyState.settings) : {},
      };
    });
  }

  /**
   * Validate that enabling a module won't violate its dependencies.
   *
   * Returns the list of missing dependencies if any, or an empty array
   * when the module can be safely enabled.
   */
  async validateModuleDependencies(companyId: string, moduleKey: string): Promise<string[]> {
    const moduleDef = DEFAULT_MODULES.find((m) => m.key === moduleKey);
    if (!moduleDef?.dependsOn?.length) {
      return [];
    }

    const enabledModules = new Set(
      (await this.prisma.companyModule.findMany({
        where: { companyId, isEnabled: true },
        select: { moduleKey: true },
      })).map((m) => m.moduleKey),
    );

    return moduleDef.dependsOn.filter((dep) => !enabledModules.has(dep));
  }
}
