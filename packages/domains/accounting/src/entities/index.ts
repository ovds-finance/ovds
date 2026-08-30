export interface AccountEntity {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  description?: string | null;
  parentId?: string | null;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntryEntity {
  id: string;
  companyId: string;
  date: Date;
  reference?: string | null;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalLineEntity {
  id: string;
  journalEntryId: string;
  accountId: string;
  description?: string | null;
  debit: number;
  credit: number;
  createdAt: Date;
}
