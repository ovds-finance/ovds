import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async findLeads(query: { page?: number; limit?: number; status?: string; assignedTo?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.assignedTo) where.assignedTo = query.assignedTo;

    const [data, total] = await Promise.all([
      this.prisma.crmContact.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.crmContact.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLead(id: string) {
    const lead = await this.prisma.crmContact.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async createLead(data: Record<string, unknown>) {
    return this.prisma.crmContact.create({ data: data as any });
  }

  async updateLead(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.crmContact.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Lead not found');
    }
  }

  async removeLead(id: string) {
    try {
      return await this.prisma.crmContact.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Lead not found');
    }
  }

  async convertLead(id: string, customerId: string) {
    const lead = await this.findLead(id);
    return this.prisma.crmDeal.create({
      data: {
        title: `${lead.name}`,
        customerName: lead.companyName ?? lead.name,
        value: 0,
        stage: 'LEAD',
        contactId: id,
        assignedTo: lead.assignedTo,
      },
    });
  }

  async findOpportunities(query: { page?: number; limit?: number; stage?: string; assignedTo?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.stage) where.stage = query.stage;
    if (query.assignedTo) where.assignedTo = query.assignedTo;

    const [data, total] = await Promise.all([
      this.prisma.crmDeal.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.crmDeal.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOpportunity(id: string) {
    const opportunity = await this.prisma.crmDeal.findUnique({ where: { id } });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    return opportunity;
  }

  async createOpportunity(data: Record<string, unknown>) {
    return this.prisma.crmDeal.create({ data: data as any });
  }

  async updateOpportunity(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.crmDeal.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Opportunity not found');
    }
  }

  async removeOpportunity(id: string) {
    try {
      return await this.prisma.crmDeal.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Opportunity not found');
    }
  }

  async convertOpportunityToInvoice(id: string) {
    const opportunity = await this.findOpportunity(id);
    const invoice = await this.prisma.invoice.create({
      data: {
        customerId: opportunity.contactId,
        customerName: opportunity.customerName,
        status: 'DRAFT',
        date: new Date(),
        totalAmount: opportunity.value,
        items: '[]',
      },
    });
    return { success: true, invoiceId: invoice.id };
  }

  async findActivities(query: { page?: number; limit?: number; relatedId?: string; type?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.relatedId) where.contactId = query.relatedId;
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      this.prisma.crmActivity.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.crmActivity.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createActivity(data: Record<string, unknown>) {
    return this.prisma.crmActivity.create({ data: data as any });
  }

  async completeActivity(id: string) {
    return this.prisma.crmActivity.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date() } });
  }

  async findContacts(query: { page?: number; limit?: number; companyId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (query.companyId) where.companyId = query.companyId;
    const [data, total] = await Promise.all([
      this.prisma.crmContact.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.crmContact.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createContact(data: Record<string, unknown>) {
    return this.prisma.crmContact.create({ data: data as any });
  }

  async updateContact(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.crmContact.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Contact not found');
    }
  }

  async deleteContact(id: string) {
    try {
      return await this.prisma.crmContact.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Contact not found');
    }
  }

  async findCompanies(query: { page?: number; limit?: number; companyId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (query.companyId) where.id = query.companyId;
    const [data, total] = await Promise.all([
      this.prisma.company.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.company.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createCompany(data: Record<string, unknown>) {
    return this.prisma.company.create({ data: data as any });
  }

  async updateCompany(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.company.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Company not found');
    }
  }

  async deleteCompany(id: string) {
    try {
      return await this.prisma.company.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Company not found');
    }
  }

  async findDeals(query: { page?: number; limit?: number; stage?: string; companyId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (query.stage) where.stage = query.stage;
    if (query.companyId) where.companyId = query.companyId;
    const [data, total] = await Promise.all([
      this.prisma.crmDeal.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.crmDeal.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDealStats() {
    const total = await this.prisma.crmDeal.count();
    const won = await this.prisma.crmDeal.count({ where: { stage: 'WON' } });
    const lost = await this.prisma.crmDeal.count({ where: { stage: 'LOST' } });
    return { total, won, lost, pipeline: total - won - lost };
  }

  async createDeal(data: Record<string, unknown>) {
    return this.prisma.crmDeal.create({ data: data as any });
  }

  async updateDeal(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.crmDeal.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Deal not found');
    }
  }

  async deleteDeal(id: string) {
    try {
      return await this.prisma.crmDeal.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Deal not found');
    }
  }

  async findPipelines(query: { page?: number; limit?: number; companyId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (query.companyId) where.companyId = query.companyId;
    const [data, total] = await Promise.all([
      this.prisma.crmPipeline.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.crmPipeline.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createPipeline(data: Record<string, unknown>) {
    return this.prisma.crmPipeline.create({ data: data as any });
  }

  async updatePipeline(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.crmPipeline.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Pipeline not found');
    }
  }

  async deletePipeline(id: string) {
    try {
      return await this.prisma.crmPipeline.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Pipeline not found');
    }
  }

  async findCustomerRegistry(query: { page?: number; limit?: number; companyId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (query.companyId) where.companyId = query.companyId;
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findCustomerByUserId(userId?: string) {
    if (!userId) return null;
    return this.prisma.customer.findFirst({ where: { userId } });
  }
}
