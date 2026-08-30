export class SubLedgerService {
  constructor(private readonly repo: unknown) {}

  async findByCompany(companyId?: string): Promise<unknown[]> { return []; }
  async getById(id: string): Promise<unknown> { return null; }
  async create(data: unknown): Promise<unknown> { return data; }
  async update(id: string, data: unknown): Promise<unknown> { return data; }
  async remove(id: string): Promise<void> {}
}