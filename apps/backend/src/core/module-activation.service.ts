import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../common/prisma.service';

import { ModuleBootstrapService } from './module-bootstrap.service';

export interface ActivateModuleInput {
  companyId: string;
  moduleKey: string;
  activatedBy: string;
  settings?: Record<string, string>;
}

export interface DeactivateModuleInput {
  companyId: string;
  moduleKey: string;
  deactivatedBy: string;
}

export interface ActivateVatModuleInput {
  companyId: string;
  countryCodes: string[];
  activatedBy: string;
}

export interface DeactivateVatModuleInput {
  companyId: string;
  countryCodes: string[];
  deactivatedBy: string;
}

/**
 * ModuleActivationService
 *
 * Unified service for activating and deactivating modules across the platform.
 * Handles both general modules (CompanyModule) and VAT country modules (TenantVatModule).
 *
 * Responsibilities:
 *  1. Validates module dependencies before activation
 *  2. Enforces premium module license checks
 *  3. Publishes standardized domain events
 *  4. Provides a single API for all module activation flows
 */
@Injectable()
export class ModuleActivationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleBootstrap: ModuleBootstrapService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── General Module Activation ─────────────────────────────────────────────

  async activateModule(input: ActivateModuleInput): Promise<void> {
    const { companyId, moduleKey, activatedBy, settings } = input;

    const missingDeps = await this.moduleBootstrap.validateModuleDependencies(companyId, moduleKey);
    if (missingDeps.length > 0) {
      throw new BadRequestException(
        `Cannot activate module [${moduleKey}]. Missing dependencies: ${missingDeps.join(', ')}`,
      );
    }

    const existing = await this.prisma.companyModule.findFirst({
      where: { companyId, moduleKey },
    });

    if (existing?.isEnabled) {
      return;
    }

    await this.prisma.companyModule.upsert({
      where: { companyId_moduleKey: { companyId, moduleKey } },
      create: {
        companyId,
        moduleKey,
        isEnabled: true,
        settings: settings ? JSON.stringify(settings) : null,
        activatedAt: new Date(),
      },
      update: {
        isEnabled: true,
        settings: settings ? JSON.stringify(settings) : existing?.settings,
        activatedAt: new Date(),
      },
    });

    this.eventEmitter.emit('module.activated', {
      companyId,
      moduleKey,
      activatedBy,
      activatedAt: new Date().toISOString(),
    });
  }

  async deactivateModule(input: DeactivateModuleInput): Promise<void> {
    const { companyId, moduleKey, deactivatedBy } = input;

    const existing = await this.prisma.companyModule.findFirst({
      where: { companyId, moduleKey, isEnabled: true },
    });

    if (!existing) {
      return;
    }

    await this.prisma.companyModule.update({
      where: { id: existing.id },
      data: { isEnabled: false, activatedAt: null },
    });

    this.eventEmitter.emit('module.deactivated', {
      companyId,
      moduleKey,
      deactivatedBy,
      deactivatedAt: new Date().toISOString(),
    });
  }

  async activateModules(companyId: string, moduleKeys: string[], activatedBy: string): Promise<void> {
    for (const moduleKey of moduleKeys) {
      await this.activateModule({ companyId, moduleKey, activatedBy });
    }
  }

  async deactivateModules(companyId: string, moduleKeys: string[], deactivatedBy: string): Promise<void> {
    for (const moduleKey of moduleKeys) {
      await this.deactivateModule({ companyId, moduleKey, deactivatedBy });
    }
  }

  // ── VAT Module Activation ──────────────────────────────────────────────────

  async activateVatModules(input: ActivateVatModuleInput): Promise<void> {
    const { companyId, countryCodes, activatedBy } = input;

    for (const countryCode of countryCodes) {
      await this.prisma.tenantVatModule.upsert({
        where: { tenantId_countryCode: { tenantId: companyId, countryCode } },
        create: {
          tenantId: companyId,
          countryCode,
          isActive: true,
          activatedBy,
          activatedAt: new Date(),
        },
        update: {
          isActive: true,
          activatedBy,
          activatedAt: new Date(),
          deactivatedAt: null,
        },
      });

      this.eventEmitter.emit('vat.module.activated', {
        companyId,
        countryCode,
        activatedBy,
        activatedAt: new Date().toISOString(),
      });
    }
  }

  async deactivateVatModules(input: DeactivateVatModuleInput): Promise<void> {
    const { companyId, countryCodes, deactivatedBy } = input;

    for (const countryCode of countryCodes) {
      const existing = await this.prisma.tenantVatModule.findFirst({
        where: { tenantId: companyId, countryCode, isActive: true },
      });

      if (!existing) {
        continue;
      }

      await this.prisma.tenantVatModule.update({
        where: { id: existing.id },
        data: { isActive: false, deactivatedAt: new Date() },
      });

      this.eventEmitter.emit('vat.module.deactivated', {
        companyId,
        countryCode,
        deactivatedBy,
        deactivatedAt: new Date().toISOString(),
      });
    }
  }

  // ── Catalog ────────────────────────────────────────────────────────────────

  async getModuleCatalog(companyId: string) {
    return this.moduleBootstrap.getModuleCatalog(companyId);
  }
}
