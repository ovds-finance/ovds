import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CompanySetupProgress,
  SetupStatus,
  SetupStepDefinition,
  SetupStepStatus,
  SetupWizardCompleteResponse,
} from '@ovds/shared';

import { PrismaService } from '../../common/prisma.service';

const PROGRESS_KEY_PREFIX = 'setup:progress:';

/** Built-in step catalogue. Extend as the product grows. */
const STEP_CATALOGUE: SetupStepDefinition[] = [
  {
    key: 'sign_up',
    label: 'Sign up to OVDS',
    description: 'Create your secure account',
    category: 'company',
    sortOrder: 1,
    isRequired: true,
    scope: 'company',
  },
  {
    key: 'create_company',
    label: 'Create your company',
    description: 'Add core business details',
    category: 'company',
    sortOrder: 2,
    isRequired: true,
    scope: 'company',
  },
  {
    key: 'configure_apps',
    label: 'Configure apps',
    description: 'Activate essential modules',
    category: 'modules',
    sortOrder: 3,
    isRequired: false,
    scope: 'modules',
  },
  {
    key: 'send_first_invoice',
    label: 'Send first invoice',
    description: 'Generate LRCA ready document',
    category: 'financial',
    sortOrder: 4,
    isRequired: false,
    scope: 'company',
  },
  {
    key: 'security_baseline',
    label: 'Security baseline',
    description: 'Seed roles, permissions and segregation-of-duties guardrails',
    category: 'security',
    sortOrder: 5,
    isRequired: true,
    scope: 'company',
  },
  {
    key: 'roles_permissions',
    label: 'Roles & permissions',
    description: 'Review high-risk roles and resolve SoD conflicts',
    category: 'security',
    sortOrder: 6,
    isRequired: true,
    scope: 'company',
  },
];

@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  // ── helpers ──────────────────────────────────────────────────────────────

  private progressKey(companyId: string) {
    return `${PROGRESS_KEY_PREFIX}${companyId}`;
  }

  private async loadProgress(companyId: string): Promise<CompanySetupProgress | null> {
    const row = await this.prisma.settingValue.findFirst({
      where: { key: this.progressKey(companyId), companyId },
    });
    if (!row) return null;
    try {
      return JSON.parse(row.value) as CompanySetupProgress;
    } catch {
      return null;
    }
  }

  private async saveProgress(progress: CompanySetupProgress): Promise<void> {
    const key = this.progressKey(progress.companyId);
    const value = JSON.stringify(progress);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key, companyId: progress.companyId },
    });
    if (existing) {
      await this.prisma.settingValue.update({
        where: { id: existing.id },
        data: { value, updatedAt: new Date() },
      });
    } else {
      await this.prisma.settingValue.create({
        data: { key, value, scope: 'company', companyId: progress.companyId },
      });
    }
  }

  private buildInitialProgress(companyId: string): CompanySetupProgress {
    const steps: SetupStepStatus[] = STEP_CATALOGUE.map((s) => ({
      stepKey: s.key,
      status: 'pending',
      scope: s.scope,
    }));
    return {
      companyId,
      overallProgress: 0,
      steps,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: steps[0]?.stepKey,
    };
  }

  private mergeMissingSteps(progress: CompanySetupProgress): CompanySetupProgress {
    const existingKeys = new Set(progress.steps.map((s) => s.stepKey));
    const missing: SetupStepStatus[] = STEP_CATALOGUE
      .filter((s) => !existingKeys.has(s.key))
      .map((s) => ({
        stepKey: s.key,
        status: 'pending' as SetupStatus,
        scope: s.scope,
      }));
    if (missing.length === 0) return progress;
    return {
      ...progress,
      steps: [...progress.steps, ...missing],
      overallProgress: this.calcOverall([...progress.steps, ...missing]),
      updatedAt: new Date().toISOString(),
    };
  }

  private calcOverall(steps: SetupStepStatus[]): number {
    if (!steps.length) return 0;
    const done = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
    return Math.round((done / steps.length) * 100);
  }

  // ── public API ────────────────────────────────────────────────────────────

  listSteps(): SetupStepDefinition[] {
    return STEP_CATALOGUE;
  }

  listStepsByCategory(): Record<string, SetupStepDefinition[]> {
    return STEP_CATALOGUE.reduce<Record<string, SetupStepDefinition[]>>((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {});
  }

  async getProgress(companyId: string): Promise<CompanySetupProgress> {
    await this.assertCompanyExists(companyId);
    const existing = await this.loadProgress(companyId);
    if (!existing) {
      const fresh = this.buildInitialProgress(companyId);
      await this.saveProgress(fresh);
      return fresh;
    }

    const merged = this.mergeMissingSteps(existing);
    if (merged !== existing) {
      await this.saveProgress(merged);
    }
    return merged;
  }

  async startWizard(
    companyId: string,
  ): Promise<{ companyId: string; steps: SetupStepDefinition[]; progress: CompanySetupProgress }> {
    await this.assertCompanyExists(companyId);
    const existing = await this.loadProgress(companyId);
    const base = existing ?? this.buildInitialProgress(companyId);
    const progress = this.mergeMissingSteps(base);
    await this.saveProgress(progress);
    return { companyId, steps: STEP_CATALOGUE, progress };
  }

  async completeStep(
    companyId: string,
    stepKey: string,
    data?: Record<string, string>,
    completedBy?: string,
  ): Promise<CompanySetupProgress> {
    const progress = await this.getProgress(companyId);
    const stepIdx = progress.steps.findIndex((s) => s.stepKey === stepKey);
    if (stepIdx === -1) throw new NotFoundException(`Step "${stepKey}" not found`);

    progress.steps[stepIdx] = {
      ...progress.steps[stepIdx],
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy,
      data,
    };
    progress.overallProgress = this.calcOverall(progress.steps);
    progress.updatedAt = new Date().toISOString();
    // Advance currentStep to next pending
    const nextPending = progress.steps.find((s) => s.status === 'pending');
    progress.currentStep = nextPending?.stepKey;
    if (!nextPending) progress.completedAt = new Date().toISOString();

    await this.saveProgress(progress);
    return progress;
  }

  async skipStep(companyId: string, stepKey: string): Promise<CompanySetupProgress> {
    const progress = await this.getProgress(companyId);
    const stepIdx = progress.steps.findIndex((s) => s.stepKey === stepKey);
    if (stepIdx === -1) throw new NotFoundException(`Step "${stepKey}" not found`);

    progress.steps[stepIdx].status = 'skipped';
    progress.overallProgress = this.calcOverall(progress.steps);
    progress.updatedAt = new Date().toISOString();
    const nextPending = progress.steps.find((s) => s.status === 'pending');
    progress.currentStep = nextPending?.stepKey;

    await this.saveProgress(progress);
    return progress;
  }

  async undoStep(companyId: string, stepKey: string): Promise<CompanySetupProgress> {
    const progress = await this.getProgress(companyId);
    const stepIdx = progress.steps.findIndex((s) => s.stepKey === stepKey);
    if (stepIdx === -1) throw new NotFoundException(`Step "${stepKey}" not found`);

    progress.steps[stepIdx] = {
      stepKey,
      status: 'pending',
      scope: progress.steps[stepIdx].scope,
    };
    progress.overallProgress = this.calcOverall(progress.steps);
    progress.updatedAt = new Date().toISOString();
    progress.currentStep = stepKey;
    delete progress.completedAt;

    await this.saveProgress(progress);
    return progress;
  }

  async getSummary(companyId: string): Promise<SetupWizardCompleteResponse> {
    const progress = await this.getProgress(companyId);
    const completedSteps = progress.steps
      .filter((s) => s.status === 'completed')
      .map((s) => s.stepKey);
    const remainingSteps = progress.steps
      .filter((s) => s.status === 'pending')
      .map((s) => s.stepKey);

    return {
      companyId,
      completedSteps,
      overallProgress: progress.overallProgress,
      isFullyConfigured: remainingSteps.length === 0,
      remainingSteps,
      scopeSummary: progress.scopeSummary ?? {},
      moduleActivities: progress.moduleActivities ?? [],
    };
  }

  async resetProgress(companyId: string): Promise<{ success: boolean; progress: CompanySetupProgress }> {
    await this.assertCompanyExists(companyId);
    const fresh = this.buildInitialProgress(companyId);
    await this.saveProgress(fresh);
    return { success: true, progress: fresh };
  }

  async syncComplianceSteps(
    companyId: string,
    opts?: { eimsReady?: boolean; securityScore?: number },
  ): Promise<{ progress: CompanySetupProgress; synced: string[] }> {
    const progress = await this.getProgress(companyId);
    const synced: string[] = [];

    if (opts?.eimsReady) {
      const step = progress.steps.find((s) => s.stepKey === 'configure_apps' && s.status === 'pending');
      if (step) {
        step.status = 'completed';
        step.completedAt = new Date().toISOString();
        synced.push('configure_apps');
      }
    }

    if (synced.length) {
      progress.overallProgress = this.calcOverall(progress.steps);
      progress.updatedAt = new Date().toISOString();
      await this.saveProgress(progress);
    }

    return { progress, synced };
  }

  // ── private helpers ───────────────────────────────────────────────────────

  private async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!company) throw new NotFoundException(`Company "${companyId}" not found`);
  }
}
