export class InventoryService {
  constructor(private readonly repo: unknown) {}
  async list(companyId?: string): Promise<unknown[]> { return []; }
  async get(id: string): Promise<unknown> { return null; }
  async create(data: unknown): Promise<unknown> { return data; }
  async update(id: string, data: unknown): Promise<unknown> { return data; }
  async remove(id: string): Promise<void> {}
}