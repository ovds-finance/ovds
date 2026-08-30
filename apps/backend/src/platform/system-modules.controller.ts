import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-id.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';

const MODULE_META: Record<string, {
  name: string;
  displayName: string;
  version: string;
  description: string;
  category: string;
  icon: string;
  installType: string;
  dependsOn?: string[];
  subscriptionTiers?: string[];
}> = {
  sales: { name: 'sales', displayName: 'Sales', version: '1.0.0', description: 'Sales & Invoicing', category: 'finance', icon: 'ShoppingCart', installType: 'app' },
  purchases: { name: 'purchases', displayName: 'Purchases', version: '1.0.0', description: 'Purchases & Procurement', category: 'finance', icon: 'ShoppingBag', installType: 'app' },
  banking: { name: 'banking', displayName: 'Banking', version: '1.0.0', description: 'Banking & Treasury', category: 'finance', icon: 'Landmark', installType: 'app' },
  items: { name: 'items', displayName: 'Items', version: '1.0.0', description: 'Items & Inventory', category: 'operations', icon: 'Package', installType: 'app' },
  'double-entry': { name: 'double-entry', displayName: 'Double Entry', version: '1.0.0', description: 'General Ledger & Double Entry', category: 'finance', icon: 'BookOpen', installType: 'app' },
  tax: { name: 'tax', displayName: 'Tax', version: '1.0.0', description: 'Tax & VAT', category: 'compliance', icon: 'Receipt', installType: 'app' },
  hr: { name: 'hr', displayName: 'HR', version: '1.0.0', description: 'Human Resources', category: 'hr', icon: 'Users', installType: 'app' },
  compliance: { name: 'compliance', displayName: 'Compliance', version: '1.0.0', description: 'Compliance & Audit', category: 'compliance', icon: 'Shield', installType: 'app' },
  appstore: { name: 'appstore', displayName: 'App Store', version: '1.0.0', description: 'App Store', category: 'platform', icon: 'Store', installType: 'app' },
  'white-label': { name: 'white-label', displayName: 'White Label', version: '1.0.0', description: 'White Label', category: 'platform', icon: 'Tag', installType: 'app' },
  'import-pro': { name: 'import-pro', displayName: 'Import Pro', version: '1.0.0', description: 'Import Pro', category: 'operations', icon: 'Download', installType: 'app' },
  crm: { name: 'crm', displayName: 'CRM', version: '1.0.0', description: 'Customer Relationship Management', category: 'sales', icon: 'UserCheck', installType: 'app' },
  employees: { name: 'employees', displayName: 'Employees', version: '1.0.0', description: 'Employee Management', category: 'hr', icon: 'User', installType: 'app' },
  payroll: { name: 'payroll', displayName: 'Payroll', version: '1.0.0', description: 'Payroll Management', category: 'hr', icon: 'DollarSign', installType: 'app' },
  assets: { name: 'assets', displayName: 'Assets', version: '1.0.0', description: 'Asset Management', category: 'operations', icon: 'Truck', installType: 'app' },
  'maintaining-technology': { name: 'maintaining-technology', displayName: 'Maintaining Technology', version: '1.0.0', description: 'Maintaining Technology', category: 'operations', icon: 'Settings', installType: 'app' },
  'security-assessment': { name: 'security-assessment', displayName: 'Security Assessment', version: '1.0.0', description: 'Security Assessment', category: 'security', icon: 'Lock', installType: 'app' },
};

@ApiTags('system-modules')
@Controller('system/modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemModulesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all system modules with per-company enabled state' })
  @ApiQuery({ name: 'companyId', required: false })
  async list(@CompanyId() companyId: string | null) {
    const names = Object.keys(MODULE_META);
    const modules = await this.prisma.module.findMany({ orderBy: { sortOrder: 'asc' } });
    const moduleMap = new Map(modules.map((m: any) => [m.key, m]));

    for (const name of names) {
      if (!moduleMap.has(name)) {
        const mod = MODULE_META[name];
        if (mod) {
          const created = await this.prisma.module.create({
            data: {
              key: mod.name,
              name: mod.displayName,
              description: mod.description ?? null,
              icon: mod.icon ?? null,
              isCore: mod.installType === 'core',
            },
          });
          moduleMap.set(name, created);
        }
      }
    }

    const companyModules: Map<string, { isEnabled: boolean; settings: Record<string, string> | null; activatedAt: Date | null }> = new Map();
    if (companyId) {
      const rows = await this.prisma.companyModule.findMany({
        where: { companyId },
        include: { module: true },
      });
      for (const row of rows) {
        let settings: Record<string, string> = {};
        try { settings = JSON.parse(row.settings || '{}'); } catch { settings = {}; }
        companyModules.set(row.moduleKey, { isEnabled: row.isEnabled, settings, activatedAt: row.activatedAt });
      }
    }

    const result = names.map(name => {
      const mod = MODULE_META[name];
      if (!mod) return null;
      const dbRecord = moduleMap.get(name);
      const companyState = companyModules.get(name);
      return {
        name: mod.name,
        displayName: mod.displayName,
        version: mod.version,
        description: mod.description,
        category: mod.category,
        icon: mod.icon,
        installType: mod.installType,
        isCore: (dbRecord as any)?.isCore ?? mod.installType === 'core',
        isEnabled: companyState?.isEnabled ?? false,
        activatedAt: companyState?.activatedAt ?? null,
        settings: [],
        permissions: [],
        dependsOn: mod.dependsOn ?? [],
        subscriptionTiers: mod.subscriptionTiers ?? [],
      };
    }).filter(Boolean);

    return { success: true, data: result };
  }

  @Get(':name')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single module manifest + company state' })
  @ApiParam({ name: 'name', description: 'Module key' })
  @ApiQuery({ name: 'companyId', required: false })
  async get(@Param('name') name: string, @CompanyId() companyId: string | null) {
    const mod = MODULE_META[name];
    if (!mod) {
      return { success: false, message: `Module [${name}] not found` };
    }

    const dbRecord = await this.prisma.module.findUnique({ where: { key: name } });
    let companyState: { isEnabled: boolean; settings: Record<string, string>; activatedAt: Date | null } | null = null;
    if (companyId) {
      const row = await this.prisma.companyModule.findFirst({
        where: { companyId, moduleKey: name },
        include: { module: true },
      });
      if (row) {
        let settings: Record<string, string> = {};
        try { settings = JSON.parse(row.settings || '{}'); } catch { settings = {}; }
        companyState = { isEnabled: row.isEnabled, settings, activatedAt: row.activatedAt };
      }
    }

    return {
      success: true,
      data: {
        name: mod.name,
        displayName: mod.displayName,
        version: mod.version,
        description: mod.description,
        category: mod.category,
        icon: mod.icon,
        installType: mod.installType,
        isCore: (dbRecord as any)?.isCore ?? mod.installType === 'core',
        isEnabled: companyState?.isEnabled ?? false,
        activatedAt: companyState?.activatedAt ?? null,
        settings: [],
        permissions: [],
        dependsOn: mod.dependsOn ?? [],
        subscriptionTiers: mod.subscriptionTiers ?? [],
        currentSettings: companyState?.settings ?? {},
      },
    };
  }

  @Post('toggle')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable a module for the current company' })
  async toggle(
    @CompanyId() companyId: string | null,
    @Body() body: { moduleName: string; enabled: boolean; settings?: Record<string, string> },
  ) {
    const { moduleName, enabled, settings } = body;
    if (!companyId) {
      return { success: false, message: 'companyId is required' };
    }

    const mod = MODULE_META[moduleName];
    if (!mod) {
      return { success: false, message: `Module [${moduleName}] not found` };
    }

    let dbRecord = await this.prisma.module.findUnique({ where: { key: moduleName } });
    if (!dbRecord) {
      dbRecord = await this.prisma.module.create({
        data: {
          key: mod.name,
          name: mod.displayName,
          description: mod.description ?? null,
          icon: mod.icon ?? null,
          isCore: mod.installType === 'core',
        },
      });
    }

    if (enabled) {
      const mergedSettings = { ...(settings ?? {}) };
      const row = await this.prisma.companyModule.upsert({
        where: { companyId_moduleKey: { companyId, moduleKey: moduleName } },
        create: {
          companyId,
          moduleKey: moduleName,
          isEnabled: true,
          settings: JSON.stringify(mergedSettings),
          activatedAt: new Date(),
        },
        update: {
          isEnabled: true,
          settings: JSON.stringify(mergedSettings),
          activatedAt: new Date(),
        },
      });
      return { success: true, data: row };
    } else {
      const row = await this.prisma.companyModule.update({
        where: { companyId_moduleKey: { companyId, moduleKey: moduleName } },
        data: { isEnabled: false, settings: null, activatedAt: null },
      });
      return { success: true, data: row };
    }
  }

  @Get('company/:companyId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all modules for a specific company' })
  @ApiParam({ name: 'companyId' })
  async forCompany(@Param('companyId') companyId: string) {
    const names = Object.keys(MODULE_META);
    const modules = await this.prisma.module.findMany({ orderBy: { sortOrder: 'asc' } });
    const moduleMap = new Map(modules.map((m: any) => [m.key, m]));

    const rows = await this.prisma.companyModule.findMany({
      where: { companyId },
      include: { module: true },
    });

    const result = names.map(name => {
      const mod = MODULE_META[name];
      if (!mod) return null;
      const dbRecord = moduleMap.get(name);
      const row = rows.find((r: any) => r.moduleKey === name);
      let settings: Record<string, string> = {};
      if (row?.settings) {
        try { settings = JSON.parse(row.settings); } catch { settings = {}; }
      }
      return {
        name: mod.name,
        displayName: mod.displayName,
        version: mod.version,
        description: mod.description,
        category: mod.category,
        icon: mod.icon,
        installType: mod.installType,
        isCore: (dbRecord as any)?.isCore ?? mod.installType === 'core',
        isEnabled: row?.isEnabled ?? false,
        activatedAt: row?.activatedAt ?? null,
        settings: [],
        permissions: [],
        dependsOn: mod.dependsOn ?? [],
        subscriptionTiers: mod.subscriptionTiers ?? [],
        currentSettings: settings,
      };
    }).filter(Boolean);

    return { success: true, data: result };
  }

  @Post(':name/configure')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update settings for an enabled module' })
  @ApiParam({ name: 'name', description: 'Module key' })
  async configure(@CompanyId() companyId: string | null, @Param('name') name: string, @Body() body: { settings: Record<string, string> }) {
    const mod = MODULE_META[name];
    if (!mod) {
      return { success: false, message: `Module [${name}] not found` };
    }
    if (!companyId) {
      return { success: false, message: 'companyId is required' };
    }

    const row = await this.prisma.companyModule.findFirst({
      where: { companyId, moduleKey: name },
    });

    if (!row) {
      return { success: false, message: `Module [${name}] is not enabled for this company` };
    }

    const updated = await this.prisma.companyModule.update({
      where: { id: row.id },
      data: { settings: JSON.stringify(body.settings) },
    });

    return { success: true, data: updated };
  }
}

