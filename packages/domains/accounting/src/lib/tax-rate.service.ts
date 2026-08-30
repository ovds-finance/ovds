export interface CreateTaxRateDto {
  name: string;
  rate: number;
  type?: string;
  isActive?: boolean;
  companyId?: string | null;
}

export interface BulkToggleDto {
  ids: string[];
  active: boolean;
}

export interface BulkDeleteDto {
  ids: string[];
}

export interface TaxRatePrisma {}
export interface TaxRateAuditLogger {}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type?: string;
  isActive?: boolean;
  companyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export class TaxRateService {
  constructor(private readonly repo: unknown) {}

  async findAll(activeOnly = false): Promise<TaxRate[]> { return []; }
  async findById(id: string): Promise<TaxRate | null> { return null; }
  async create(data: CreateTaxRateDto): Promise<TaxRate> { return data as TaxRate; }
  async update(id: string, data: Partial<TaxRate>): Promise<TaxRate> { return data as TaxRate; }
  async remove(id: string): Promise<void> {}
  async bulkToggle(dto: BulkToggleDto): Promise<void> {}
  async bulkDelete(dto: BulkDeleteDto): Promise<void> {}
}