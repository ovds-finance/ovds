import { Injectable } from '@nestjs/common';
import { PrismaClient, ModuleCode } from '@ovds/database';
import { PrismaClientToken } from '../../prisma/prisma.module';
import { Inject } from '@nestjs/common';

@Injectable()
export class TenantService {
  constructor(@Inject(PrismaClientToken) private prisma: PrismaClient) {}

  async getCurrentTenant(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        databaseProvider: true,
        licenseExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getActiveModules(tenantId: string) {
    return this.prisma.tenantModule.findMany({
      where: { tenantId, enabled: true },
      select: {
        id: true,
        tenantId: true,
        moduleCode: true,
        enabled: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateModule(tenantId: string, moduleCode: ModuleCode, enabled: boolean, config?: any) {
    return this.prisma.tenantModule.upsert({
      where: {
        tenantId_moduleCode: { tenantId, moduleCode },
      },
      update: { enabled, config },
      create: { tenantId, moduleCode, enabled, config },
    });
  }
}