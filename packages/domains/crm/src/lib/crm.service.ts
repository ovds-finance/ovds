/**
 * CrmService — CRM domain logic (contacts, companies, deals, activities, pipelines).
 * Migrated from apps/backend/src/crm/crm.service.ts into @ovds/domains-crm.
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CRM_STAGES } from '@ovds/shared';
import {
  BaseService,
  IAuditLogger,
  IPrismaClient,
} from '@ovds/domains-infrastructure';

/** Injected at the app level — avoids direct import of app services in the lib */
export interface ICrmDeps {
  eventEmitter: { emit: (event: string, payload: any) => void };
  customFields: {
    enrichEntity: (entity: any, feature: string, companyId?: string | null) => Promise<any>;
    enrichEntities: (entities: any[], feature: string, companyId?: string | null) => Promise<any[]>;
    saveValues: (args: { entityId: string; feature: string; companyId?: string | null; values: Record<string, any> }, userId: string) => Promise<void>;
  };
}

@Injectable()
export class CrmService extends BaseService {

  constructor(
    prisma: IPrismaClient,
    audit: IAuditLogger,
    private readonly deps: ICrmDeps,
  ) {
    super(prisma, audit, 'CrmService');
  }

  // ── Contacts ───────────────────────────────────────────────────────────────

  async getContacts(query: {
    companyId?: string;
    search?: string;
    status?: string;
    type?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { tin: { contains: query.search } },
        { companyName: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.crmContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(500, query.take ?? 200),
        skip: query.skip ?? 0,
      }),
      this.prisma.crmContact.count({ where }),
    ]);
    const enriched = await this.deps.customFields.enrichEntities(data, 'customer', query.companyId);
    return { data: enriched, total };
  }

  async getContact(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const contact = await this.prisma.crmContact.findFirst({ where });
    if (!contact) throw new NotFoundException('Contact not found');
    return this.deps.customFields.enrichEntity(contact, 'customer', companyId);
  }

  async createContact(data: any, userId: string) {
    const { customFields, ...rest } = data;
    const contact = await this.prisma.crmContact.create({
      data: {
        companyId: rest.companyId,
        name: rest.name,
        email: rest.email || null,
        phone: rest.phone || null,
        address: rest.address || null,
        tin: rest.tin || null,
        vatNumber: rest.vatNumber || null,
        website: rest.website || null,
        paymentTerms: rest.paymentTerms ?? 'NET30',
        notes: rest.notes || null,
        creditLimit: rest.creditLimit ? Number(rest.creditLimit) : null,
        riskLevel: rest.riskLevel ?? 'MEDIUM',
        status: rest.status ?? 'ACTIVE',
        type: rest.type ?? 'PERSON',
        jobTitle: rest.jobTitle || null,
        companyName: rest.companyName || null,
        assignedTo: rest.assignedTo || null,
        preferredInteractionType: rest.preferredInteractionType ?? 'EMAIL',
        createdBy: userId,
      },
    });
    if (customFields && Object.keys(customFields).length > 0) {
      await this.deps.customFields
        .saveValues({ entityId: contact.id, feature: 'customer', companyId: rest.companyId, values: customFields }, userId)
        .catch((err: any) => this.logger.warn(`Custom field save failed: ${err?.message}`));
    }
    this.audit(userId, 'CRM_CONTACT_CREATED', `Contact created: ${contact.name}`);
    return this.deps.customFields.enrichEntity(contact, 'customer', rest.companyId);
  }

  async updateContact(id: string, data: any, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmContact.findFirst({ where });
    if (!existing) throw new NotFoundException('Contact not found');

    const { customFields, ...rest } = data;
    const updateData: any = {};
    const fields = [
      'name', 'email', 'phone', 'address', 'tin', 'vatNumber', 'website',
      'paymentTerms', 'notes', 'riskLevel', 'status', 'type', 'jobTitle',
      'companyName', 'assignedTo', 'preferredInteractionType', 'pipelineStage',
    ];
    for (const f of fields) {
      if (rest[f] !== undefined) updateData[f] = rest[f] || null;
    }
    if (rest.creditLimit !== undefined)
      updateData.creditLimit = rest.creditLimit ? Number(rest.creditLimit) : null;
    if (rest.lastContactedAt !== undefined)
      updateData.lastContactedAt = rest.lastContactedAt ? new Date(rest.lastContactedAt) : null;

    const contact = await this.prisma.crmContact.update({ where: { id }, data: updateData });
    this.audit(userId, 'CRM_CONTACT_UPDATED', `Contact updated: ${contact.name}`);

    if (customFields && Object.keys(customFields).length > 0) {
      await this.deps.customFields
        .saveValues({ entityId: contact.id, feature: 'customer', companyId: contact.companyId ?? companyId, values: customFields }, userId)
        .catch((err: any) => this.logger.warn(`Custom field save failed: ${err?.message}`));
    }

    const changedFields = Object.keys(updateData).filter((k) => k !== 'updatedAt');
    if (changedFields.length > 0) {
      this.deps.eventEmitter.emit('crm.contact.updated', {
        contactId: id, companyId: contact.companyId, userId,
        changes: changedFields.reduce((acc, key) => ({ ...acc, [key]: updateData[key] }), {}),
      });
    }

    return this.deps.customFields.enrichEntity(contact, 'customer', companyId ?? contact.companyId ?? undefined);
  }

  async deleteContact(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmContact.findFirst({ where });
    if (!existing) throw new NotFoundException('Contact not found');
    await this.prisma.crmContact.delete({ where: { id } });
    this.audit(userId, 'CRM_CONTACT_DELETED', `Contact deleted: ${existing.name}`);
    return { success: true };
  }

  // ── CRM Companies ──────────────────────────────────────────────────────────

  async getCrmCompanies(query: { companyId?: string; search?: string; status?: string; take?: number; skip?: number }) {
    const where: any = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { industry: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.crmCompany.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(500, query.take ?? 200), skip: query.skip ?? 0 }),
      this.prisma.crmCompany.count({ where }),
    ]);
    const enriched = await this.deps.customFields.enrichEntities(data, 'company', query.companyId);
    return { data: enriched, total };
  }

  async getCrmCompany(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const company = await this.prisma.crmCompany.findFirst({ where });
    if (!company) throw new NotFoundException('Company not found');
    return this.deps.customFields.enrichEntity(company, 'company', companyId);
  }

  async createCrmCompany(data: any, userId: string) {
    const { customFields, ...rest } = data;
    const company = await this.prisma.crmCompany.create({
      data: {
        companyId: rest.companyId,
        name: rest.name,
        email: rest.email || null,
        phone: rest.phone || null,
        address: rest.address || null,
        website: rest.website || null,
        industry: rest.industry || null,
        size: rest.size ?? 'SMALL',
        tin: rest.tin || null,
        vatNumber: rest.vatNumber || null,
        notes: rest.notes || null,
        status: rest.status ?? 'ACTIVE',
        createdBy: userId,
      },
    });
    if (customFields && Object.keys(customFields).length > 0) {
      await this.deps.customFields
        .saveValues({ entityId: company.id, feature: 'company', companyId: rest.companyId, values: customFields }, userId)
        .catch((err: any) => this.logger.warn(`Custom field save failed: ${err?.message}`));
    }
    this.audit(userId, 'CRM_COMPANY_CREATED', `CRM company created: ${company.name}`);
    return this.deps.customFields.enrichEntity(company, 'company', rest.companyId);
  }

  async updateCrmCompany(id: string, data: any, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmCompany.findFirst({ where });
    if (!existing) throw new NotFoundException('Company not found');

    const { customFields, ...rest } = data;
    const updateData: any = {};
    for (const f of ['name', 'email', 'phone', 'address', 'website', 'industry', 'size', 'tin', 'vatNumber', 'notes', 'status']) {
      if (rest[f] !== undefined) updateData[f] = rest[f] || null;
    }

    const company = await this.prisma.crmCompany.update({ where: { id }, data: updateData });
    this.audit(userId, 'CRM_COMPANY_UPDATED', `CRM company updated: ${company.name}`);

    if (customFields && Object.keys(customFields).length > 0) {
      await this.deps.customFields
        .saveValues({ entityId: company.id, feature: 'company', companyId: company.companyId ?? companyId, values: customFields }, userId)
        .catch((err: any) => this.logger.warn(`Custom field save failed: ${err?.message}`));
    }

    return this.deps.customFields.enrichEntity(company, 'company', companyId ?? company.companyId ?? undefined);
  }

  async deleteCrmCompany(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmCompany.findFirst({ where });
    if (!existing) throw new NotFoundException('Company not found');
    await this.prisma.crmCompany.delete({ where: { id } });
    this.audit(userId, 'CRM_COMPANY_DELETED', `CRM company deleted: ${existing.name}`);
    return { success: true };
  }

  // ── Deals ──────────────────────────────────────────────────────────────────

  async getDeals(query: { companyId?: string; stage?: string; search?: string; take?: number; skip?: number }) {
    const where: any = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.stage) where.stage = query.stage;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { customerName: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.crmDeal.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(500, query.take ?? 200), skip: query.skip ?? 0 }),
      this.prisma.crmDeal.count({ where }),
    ]);
    const enriched = await this.deps.customFields.enrichEntities(data, 'deal', query.companyId);
    return { data: enriched, total };
  }

  async getDeal(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const deal = await this.prisma.crmDeal.findFirst({ where });
    if (!deal) throw new NotFoundException('Deal not found');
    return this.deps.customFields.enrichEntity(deal, 'deal', companyId);
  }

  async createDeal(data: any, userId: string) {
    const { customFields, ...rest } = data;
    const deal = await this.prisma.crmDeal.create({
      data: {
        title: rest.title,
        customerName: rest.customerName,
        value: rest.value ?? 0,
        stage: rest.stage ?? 'LEAD',
        probability: rest.probability ?? 10,
        expectedCloseDate: rest.expectedCloseDate ? new Date(rest.expectedCloseDate) : null,
        assignedTo: rest.assignedTo || null,
        notes: rest.notes || null,
        companyId: rest.companyId,
        contactId: rest.contactId || null,
        crmCompanyId: rest.crmCompanyId || null,
        pipelineId: rest.pipelineId || null,
        tags: rest.tags ? JSON.stringify(rest.tags) : null,
        createdBy: userId,
      },
    });
    if (customFields && Object.keys(customFields).length > 0) {
      await this.deps.customFields
        .saveValues({ entityId: deal.id, feature: 'deal', companyId: rest.companyId, values: customFields }, userId)
        .catch((err: any) => this.logger.warn(`Custom field save failed: ${err?.message}`));
    }
    this.audit(userId, 'CRM_DEAL_CREATED', `Deal created: ${deal.title}`);
    return this.deps.customFields.enrichEntity(deal, 'deal', rest.companyId);
  }

  async updateDeal(id: string, data: any, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmDeal.findFirst({ where });
    if (!existing) throw new NotFoundException('Deal not found');

    const { customFields, ...rest } = data;
    const updateData: any = {};
    if (rest.title !== undefined) updateData.title = rest.title;
    if (rest.customerName !== undefined) updateData.customerName = rest.customerName;
    if (rest.value !== undefined) updateData.value = Number(rest.value);
    if (rest.stage !== undefined) updateData.stage = rest.stage;
    if (rest.probability !== undefined) updateData.probability = Number(rest.probability);
    if (rest.expectedCloseDate !== undefined)
      updateData.expectedCloseDate = rest.expectedCloseDate ? new Date(rest.expectedCloseDate) : null;
    if (rest.assignedTo !== undefined) updateData.assignedTo = rest.assignedTo || null;
    if (rest.notes !== undefined) updateData.notes = rest.notes || null;
    if (rest.pipelineId !== undefined) updateData.pipelineId = rest.pipelineId || null;
    if (rest.tags !== undefined) updateData.tags = rest.tags ? JSON.stringify(rest.tags) : null;

    const deal = await this.prisma.crmDeal.update({ where: { id }, data: updateData });
    this.audit(userId, 'CRM_DEAL_UPDATED', `Deal updated: ${deal.title} → ${deal.stage}`);

    if (customFields && Object.keys(customFields).length > 0) {
      await this.deps.customFields
        .saveValues({ entityId: deal.id, feature: 'deal', companyId: deal.companyId ?? companyId, values: customFields }, userId)
        .catch((err: any) => this.logger.warn(`Custom field save failed: ${err?.message}`));
    }

    return this.deps.customFields.enrichEntity(deal, 'deal', companyId ?? deal.companyId ?? undefined);
  }

  async deleteDeal(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmDeal.findFirst({ where });
    if (!existing) throw new NotFoundException('Deal not found');
    await this.prisma.crmDeal.delete({ where: { id } });
    this.audit(userId, 'CRM_DEAL_DELETED', `Deal deleted: ${existing.title}`);
    return { success: true };
  }

  async getPipelineStats(companyId?: string) {
    const where: any = companyId ? { companyId } : {};
    const grouped = await this.prisma.crmDeal.groupBy({
      by: ['stage'],
      where,
      _count: { id: true },
      _sum: { value: true },
    });
    const stats: Record<string, { count: number; value: number }> = {};
    for (const g of grouped) {
      stats[g.stage] = { count: g._count.id, value: Number(g._sum.value ?? 0) };
    }
    const totalPipeline = Object.entries(stats)
      .filter(([s]) => ![CRM_STAGES.CLOSED_WON.key, CRM_STAGES.CLOSED_LOST.key].includes(s))
      .reduce((sum, [, v]) => sum + v.value, 0);
    const wonValue = stats[CRM_STAGES.CLOSED_WON.key]?.value ?? 0;
    const closedCount =
      (stats[CRM_STAGES.CLOSED_WON.key]?.count ?? 0) +
      (stats[CRM_STAGES.CLOSED_LOST.key]?.count ?? 0);
    const winRate =
      closedCount > 0
        ? Math.round(((stats[CRM_STAGES.CLOSED_WON.key]?.count ?? 0) / closedCount) * 100)
        : 0;
    return { byStage: stats, totalPipeline, wonValue, winRate };
  }

  // ── Activities ─────────────────────────────────────────────────────────────

  async getActivities(query: { companyId?: string; type?: string; status?: string; contactId?: string; dealId?: string; take?: number; skip?: number }) {
    const where: any = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.contactId) where.contactId = query.contactId;
    if (query.dealId) where.dealId = query.dealId;

    const [data, total] = await Promise.all([
      this.prisma.crmActivity.findMany({ where, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }], take: Math.min(500, query.take ?? 100), skip: query.skip ?? 0 }),
      this.prisma.crmActivity.count({ where }),
    ]);
    return { data, total };
  }

  async getActivity(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const activity = await this.prisma.crmActivity.findFirst({ where });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async createActivity(data: any, userId: string) {
    const activity = await this.prisma.crmActivity.create({
      data: {
        companyId: data.companyId,
        type: data.type ?? 'CALL',
        title: data.title,
        description: data.description || null,
        status: data.status ?? 'PENDING',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        contactId: data.contactId || null,
        contactName: data.contactName || null,
        dealId: data.dealId || null,
        dealTitle: data.dealTitle || null,
        assignedTo: data.assignedTo || null,
        createdBy: userId,
      },
    });
    this.audit(userId, 'CRM_ACTIVITY_CREATED', `Activity logged: ${activity.title}`);
    return activity;
  }

  async updateActivity(id: string, data: any, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmActivity.findFirst({ where });
    if (!existing) throw new NotFoundException('Activity not found');

    const updateData: any = {};
    for (const f of ['type', 'title', 'description', 'status', 'contactId', 'contactName', 'dealId', 'dealTitle', 'assignedTo']) {
      if (data[f] !== undefined) updateData[f] = data[f] || null;
    }
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    if (data.status === 'DONE' && !existing.completedAt && !data.completedAt)
      updateData.completedAt = new Date();

    const activity = await this.prisma.crmActivity.update({ where: { id }, data: updateData });
    this.audit(userId, 'CRM_ACTIVITY_UPDATED', `Activity updated: ${activity.title} → ${activity.status}`);
    return activity;
  }

  async deleteActivity(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmActivity.findFirst({ where });
    if (!existing) throw new NotFoundException('Activity not found');
    await this.prisma.crmActivity.delete({ where: { id } });
    this.audit(userId, 'CRM_ACTIVITY_DELETED', `Activity deleted: ${existing.title}`);
    return { success: true };
  }

  async getActivityStats(companyId?: string) {
    const where: any = companyId ? { companyId } : {};
    const now = new Date();
    const [total, pending, done, overdue] = await Promise.all([
      this.prisma.crmActivity.count({ where }),
      this.prisma.crmActivity.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.crmActivity.count({ where: { ...where, status: 'DONE' } }),
      this.prisma.crmActivity.count({ where: { ...where, status: 'PENDING', dueDate: { lt: now } } }),
    ]);
    return { total, pending, done, overdue };
  }

  // ── Pipelines ──────────────────────────────────────────────────────────────

  async getPipelines(companyId?: string) {
    const where: any = companyId ? { companyId } : {};
    const pipelines = await this.prisma.crmPipeline.findMany({ where, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] });
    return pipelines.map((p: any) => ({ ...p, stages: this._parseStages(p.stagesJson) }));
  }

  async getPipeline(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const pipeline = await this.prisma.crmPipeline.findFirst({ where });
    if (!pipeline) throw new NotFoundException('Pipeline not found');
    return { ...pipeline, stages: this._parseStages(pipeline.stagesJson) };
  }

  async createPipeline(data: any, userId: string) {
    if (!data.name?.trim()) throw new BadRequestException('Pipeline name is required');
    if (!Array.isArray(data.stages) || data.stages.length < 2)
      throw new BadRequestException('Pipeline needs at least 2 stages');
    if (data.isDefault && data.companyId) {
      await this.prisma.crmPipeline.updateMany({ where: { companyId: data.companyId, isDefault: true }, data: { isDefault: false } });
    }
    const pipeline = await this.prisma.crmPipeline.create({
      data: { companyId: data.companyId, name: data.name, description: data.description || null, isDefault: data.isDefault ?? false, stagesJson: JSON.stringify(data.stages), createdBy: userId },
    });
    this.audit(userId, 'CRM_PIPELINE_CREATED', `Pipeline created: ${pipeline.name}`);
    return { ...pipeline, stages: data.stages };
  }

  async updatePipeline(id: string, data: any, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmPipeline.findFirst({ where });
    if (!existing) throw new NotFoundException('Pipeline not found');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.isDefault !== undefined) {
      updateData.isDefault = data.isDefault;
      if (data.isDefault && existing.companyId) {
        await this.prisma.crmPipeline.updateMany({ where: { companyId: existing.companyId, isDefault: true, id: { not: id } }, data: { isDefault: false } });
      }
    }
    if (Array.isArray(data.stages)) {
      if (data.stages.length < 2) throw new BadRequestException('Pipeline needs at least 2 stages');
      updateData.stagesJson = JSON.stringify(data.stages);
    }
    const pipeline = await this.prisma.crmPipeline.update({ where: { id }, data: updateData });
    this.audit(userId, 'CRM_PIPELINE_UPDATED', `Pipeline updated: ${pipeline.name}`);
    return { ...pipeline, stages: this._parseStages(pipeline.stagesJson) };
  }

  async deletePipeline(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.crmPipeline.findFirst({ where });
    if (!existing) throw new NotFoundException('Pipeline not found');
    await this.prisma.crmDeal.updateMany({ where: { pipelineId: id }, data: { pipelineId: null } });
    await this.prisma.crmPipeline.delete({ where: { id } });
    this.audit(userId, 'CRM_PIPELINE_DELETED', `Pipeline deleted: ${existing.name}`);
    return { success: true };
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getCrmStats(companyId?: string) {
    const where: any = companyId ? { companyId } : {};
    const [contactCount, companyCount, dealStats, activityStats] = await Promise.all([
      this.prisma.crmContact.count({ where }),
      this.prisma.crmCompany.count({ where }),
      this.getPipelineStats(companyId),
      this.getActivityStats(companyId),
    ]);
    return { contacts: contactCount, companies: companyCount, deals: dealStats, activities: activityStats };
  }

  private _parseStages(json: string): any[] {
    try { return JSON.parse(json); } catch { return []; }
  }
}
