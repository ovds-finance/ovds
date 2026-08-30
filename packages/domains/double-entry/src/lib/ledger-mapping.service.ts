export interface LedgerMappingRule {
  id: string;
  companyId: string;
  sourceType: string;
  targetAccountId: string;
  conditions: Record<string, unknown>;
  priority: number;
}

export interface MappingResult {
  success: boolean;
  accountId: string;
  confidence: number;
}

export interface AutoMapInvoiceInput {
  invoiceId: string;
  companyId: string;
}

export interface AutoMapBillInput {
  billId: string;
  companyId: string;
}

export interface AutoMapBankTransferInput {
  transactionId: string;
  companyId: string;
}

export class LedgerMappingService {
  constructor(private readonly repo: unknown) {}

  async getMappingRules(companyId?: string): Promise<LedgerMappingRule[]> { return []; }
  async autoMapInvoice(input: AutoMapInvoiceInput): Promise<MappingResult> {
    return { success: false, accountId: '', confidence: 0 };
  }
  async autoMapBill(input: AutoMapBillInput): Promise<MappingResult> {
    return { success: false, accountId: '', confidence: 0 };
  }
  async autoMapBankTransfer(input: AutoMapBankTransferInput): Promise<MappingResult> {
    return { success: false, accountId: '', confidence: 0 };
  }
}