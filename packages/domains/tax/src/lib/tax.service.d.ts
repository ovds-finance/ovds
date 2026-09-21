export declare class TaxService {
    private readonly repo;
    constructor(repo: unknown);
    list(companyId?: string): Promise<unknown[]>;
    get(id: string): Promise<unknown>;
    create(data: unknown): Promise<unknown>;
    update(id: string, data: unknown): Promise<unknown>;
    remove(id: string): Promise<void>;
}
//# sourceMappingURL=tax.service.d.ts.map