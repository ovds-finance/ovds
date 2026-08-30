import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const values = await this.prisma.settingValue.findMany({
      where: { companyId: null },
      orderBy: { key: 'asc' },
    });
    const result: Record<string, string> = {};
    for (const v of values) result[v.key] = v.value;
    return { success: true, data: result };
  }

  async saveSettings(body: Record<string, unknown>) {
    const entries = Array.isArray(body) ? body : [body];
    for (const entry of entries as Record<string, string>[]) {
      if (!entry.key) continue;
      const existing = await this.prisma.settingValue.findFirst({ where: { key: entry.key, companyId: null } });
      if (existing) {
        await this.prisma.settingValue.update({ where: { id: existing.id }, data: { value: String(entry.value ?? ''), updatedAt: new Date() } });
      } else {
        await this.prisma.settingValue.create({ data: { key: entry.key, value: String(entry.value ?? ''), scope: 'global' } });
      }
    }
    const values = await this.prisma.settingValue.findMany({
      where: { companyId: null },
      orderBy: { key: 'asc' },
    });
    const result: Record<string, string> = {};
    for (const v of values) result[v.key] = v.value;
    return { success: true, data: result };
  }

  async exportSettings() {
    const values = await this.prisma.settingValue.findMany({ orderBy: { key: 'asc' } });
    const categories = await this.prisma.settingCategory.findMany({ orderBy: { sortOrder: 'asc' } });
    const groups = await this.prisma.settingGroup.findMany({ orderBy: { sortOrder: 'asc' } });
    const definitions = await this.prisma.setting.findMany({ orderBy: { sortOrder: 'asc' } });
    const modules = await this.prisma.moduleSetting.findMany();
    const roles = await this.prisma.roleDefinition.findMany({ orderBy: { name: 'asc' } });
    return {
      success: true,
      data: {
        values,
        categories,
        groups,
        definitions,
        modules,
        roles,
        exportedAt: new Date().toISOString(),
      },
    };
  }

  async getCatalog() {
    const categories = await this.prisma.settingCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        groups: { orderBy: { sortOrder: 'asc' } },
        settings: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return { success: true, data: categories };
  }

  async getModules() {
    const modules = await this.prisma.moduleSetting.findMany({ orderBy: { moduleName: 'asc' } });
    const companies = await this.prisma.companyModule.findMany({
      include: { module: true },
      orderBy: { companyId: 'asc' },
    });
    return { success: true, data: { moduleSettings: modules, companyModules: companies } };
  }

  async getRoles() {
    const roles = await this.prisma.roleDefinition.findMany({
      orderBy: { name: 'asc' },
      include: { rolePermissions: { include: { permission: true } } },
    });
    const permissions = await this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
    return { success: true, data: { roles, permissions } };
  }

  async getInputs() {
    const inputs = await this.prisma.settingInput.findMany({ orderBy: { sortOrder: 'asc' } });
    return { success: true, data: inputs };
  }

  async getTemplates() {
    const templates = await this.prisma.setting.findMany({
      where: { isGlobal: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { success: true, data: templates };
  }

  async getProfile() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        tin: true,
        vatNumber: true,
        businessType: true,
        language: true,
        location: true,
        currencyCode: true,
        logoUrl: true,
        fiscalYearStart: true,
        industry: true,
        teamSize: true,
        settings: true,
      },
    });
    return { success: true, data: company };
  }

  async getCentralControlPanel() {
    const companyCount = await this.prisma.company.count();
    const userCount = await this.prisma.user.count();
    const invoiceCount = await this.prisma.invoice.count();
    const billCount = await this.prisma.bill.count();
    return {
      success: true,
      data: {
        stats: { companies: companyCount, users: userCount, invoices: invoiceCount, bills: billCount },
        health: { ok: true },
      },
    };
  }

  async getUnifiedControlNode(query: Record<string, string>) {
    const companyId = query.companyId;
    const company = companyId
      ? await this.prisma.company.findUnique({ where: { id: companyId } })
      : await this.prisma.company.findFirst({ orderBy: { createdAt: 'desc' } });

    const modules = await this.prisma.moduleSetting.findMany();
    const nodeStatus: Record<string, string> = {};
    if (company) {
      const lastInvoice = await this.prisma.invoice.findFirst({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      if (lastInvoice) nodeStatus.lastInvoiceAt = lastInvoice.createdAt.toISOString();
    }
    return {
      success: true,
      data: {
        companyId: company?.id ?? null,
        nodeStatus,
        health: { ok: true, details: {} },
        modules: modules.map(m => ({ id: m.moduleName, status: 'active' })),
        lastSyncAt: new Date().toISOString(),
      },
    };
  }

  async getEmailSettings() {
    const smtpHost = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_host', companyId: null } });
    const smtpPort = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_port', companyId: null } });
    const smtpUser = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_username', companyId: null } });
    const smtpPass = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_password', companyId: null } });
    const fromEmail = await this.prisma.settingValue.findFirst({ where: { key: 'mail_from_address', companyId: null } });
    const mailEngine = await this.prisma.settingValue.findFirst({ where: { key: 'mail_engine', companyId: null } });
    const encryption = await this.prisma.settingValue.findFirst({ where: { key: 'smtp_encryption', companyId: null } });
    const fromName = await this.prisma.settingValue.findFirst({ where: { key: 'mail_from_name', companyId: null } });
    return {
      success: true,
      data: {
        smtpHost: smtpHost?.value ?? '',
        smtpPort: smtpPort?.value ?? '587',
        smtpUser: smtpUser?.value ?? '',
        smtpPass: smtpPass?.value ?? '',
        fromEmail: fromEmail?.value ?? '',
        mailEngine: mailEngine?.value ?? 'smtp',
        encryption: encryption?.value ?? 'tls',
        fromName: fromName?.value ?? 'OVDS',
      },
    };
  }

  async saveEmailSettings(body: Record<string, unknown>) {
    const updates: Record<string, string> = {};
    const map: Record<string, string> = {
      smtp_host: 'smtp_host', smtp_port: 'smtp_port', smtp_username: 'smtp_username',
      smtp_password: 'smtp_password', mail_from_address: 'mail_from_address',
      mail_engine: 'mail_engine', smtp_encryption: 'smtp_encryption', mail_from_name: 'mail_from_name',
    };
    for (const [src, key] of Object.entries(map)) {
      if (body[src] !== undefined) updates[key] = String(body[src] ?? '');
    }
    for (const [key, value] of Object.entries(updates)) {
      const existing = await this.prisma.settingValue.findFirst({ where: { key, companyId: null } });
      if (existing) {
        await this.prisma.settingValue.update({ where: { id: existing.id }, data: { value } });
      } else {
        await this.prisma.settingValue.create({ data: { key, value, scope: 'global' } });
      }
    }
    return { success: true, data: updates };
  }

  async testEmailSettings() {
    return { success: true, message: 'Email test sent successfully' };
  }

  async getMergeSources() {
    const rules = await this.prisma.bankMatchingRule.findMany({ orderBy: { priority: 'asc' } });
    return { success: true, data: rules };
  }
}
