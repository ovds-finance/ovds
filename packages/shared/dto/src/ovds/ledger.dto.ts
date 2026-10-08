export interface JournalLineDTO {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

export interface CreateLedgerEntryDTO {
  companyId: string;
  description: string;
  reference?: string;
  postedAt?: string;
  lines: JournalLineDTO[];
}

export interface AccountResponseDTO {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}
