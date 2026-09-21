import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma.service';

interface ModuleRow {
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  installType: string | null;
  sortOrder: number | null;
  isCore: boolean | null;
  version: string | null;
  category: string | null;
}

interface CompanyModuleRow {
  id: string;
  companyId: string;
  moduleKey: string;
  isEnabled: boolean;
  settings: string | null;
  activatedAt: Date | null;
  name?: string;
  description?: string | null;
  icon?: string | null;
  version?: string | null;
  category?: string | null;
}

export const modulesProcedure = {
  list: async (): Promise<ModuleRow[]> => {
    return PrismaService.prototype.$queryRaw<ModuleRow[]>`
      SELECT key, name, description, icon, "installType", "sortOrder", "isCore", version, category
      FROM module
      ORDER BY "sortOrder" ASC
    `;
  },

  get: async (input: { key: string }): Promise<ModuleRow | null> => {
    const rows = await PrismaService.prototype.$queryRaw<ModuleRow[]>`
      SELECT * FROM module WHERE key = ${input.key} LIMIT 1
    `;
    return rows[0] || null;
  },

  company: {
    list: async (input: { companyId: string }): Promise<CompanyModuleRow[]> => {
      return PrismaService.prototype.$queryRaw<CompanyModuleRow[]>`
        SELECT cm.*, m.name, m.description, m.icon, m.version, m.category
        FROM "CompanyModule" cm
        JOIN module m ON cm."moduleKey" = m.key
        WHERE cm."companyId" = ${input.companyId}
        ORDER BY m."sortOrder" ASC
      `;
    },

    enable: async (input: { companyId: string; moduleKey: string }): Promise<CompanyModuleRow> => {
      const rows = await PrismaService.prototype.$queryRaw<CompanyModuleRow[]>`
        INSERT INTO "CompanyModule" ("companyId", "moduleKey", "isEnabled", "activatedAt")
        VALUES (${input.companyId}, ${input.moduleKey}, true, NOW())
        ON CONFLICT ("companyId", "moduleKey") DO UPDATE SET "isEnabled" = true, "activatedAt" = NOW()
        RETURNING *
      `;
      return rows[0];
    },

    disable: async (input: { companyId: string; moduleKey: string }): Promise<{ success: boolean }> => {
      await PrismaService.prototype.$executeRaw`
        UPDATE "CompanyModule" SET "isEnabled" = false
        WHERE "companyId" = ${input.companyId} AND "moduleKey" = ${input.moduleKey}
      `;
      return { success: true };
    },

    updateSettings: async (input: { companyId: string; moduleKey: string; settings: Record<string, string> }): Promise<CompanyModuleRow> => {
      const rows = await PrismaService.prototype.$queryRaw<CompanyModuleRow[]>`
        UPDATE "CompanyModule"
        SET settings = ${JSON.stringify(input.settings)}
        WHERE "companyId" = ${input.companyId} AND "moduleKey" = ${input.moduleKey}
        RETURNING *
      `;
      return rows[0];
    },

    getConfiguration: async (input: { companyId: string }): Promise<CompanyModuleRow[]> => {
      return PrismaService.prototype.$queryRaw<CompanyModuleRow[]>`
        SELECT m.*, cm."isEnabled", cm."activatedAt", cm.settings
        FROM module m
        LEFT JOIN "CompanyModule" cm ON m.key = cm."moduleKey" AND cm."companyId" = ${input.companyId}
        ORDER BY m."sortOrder" ASC
      `;
    },
  },
};
