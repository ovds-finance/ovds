import { Injectable } from '@nestjs/common';
import { BaseService, IAuditLogger, IPrismaClient } from '@ovds/domains/infrastructure';

export interface CreateJournalEntryInput {
  date?: string;
  reference?: string;
  description: string;
  companyId?: string;
  lines: Array<{
    accountId: string;
    description?: string;
    debit?: number;
    credit?: number;
    costCenterId?: string;
  }>;
}

export interface UpdateJournalEntryInput {
  date?: string;
  reference?: string;
  description?: string;
  status?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  companyId: string;
  status: string;
  createdAt: string;
}

@Injectable()
export class DoubleEntryService extends BaseService {
  constructor(prisma: IPrismaClient, audit: IAuditLogger) {
    super(prisma, audit, 'DoubleEntryService');
  }

  async createJournalEntry(data: CreateJournalEntryInput, userId: string): Promise<JournalEntry> {
    return data as unknown as JournalEntry;
  }

  async updateJournalEntry(id: string, data: UpdateJournalEntryInput, userId: string, companyId?: string): Promise<JournalEntry> {
    return data as unknown as JournalEntry;
  }

  async deleteJournalEntry(id: string, userId: string, companyId?: string): Promise<{ success: boolean; id: string }> {
    return { success: true, id };
  }

  async getJournalEntries(params: { companyId?: string; from?: string; to?: string }): Promise<JournalEntry[]> {
    return [];
  }

  async postJournalEntry(id: string): Promise<JournalEntry> {
    return {} as JournalEntry;
  }

  async reverseJournalEntry(id: string, date?: string): Promise<JournalEntry> {
    return {} as JournalEntry;
  }
}
