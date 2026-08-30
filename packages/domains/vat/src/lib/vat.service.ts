import { SubmitVatDeclarationDto, TaxDeclarationStatus, TransactionItemDto } from '../dto';

export interface VatDeclarationEntity {
  id: string;
  taxpayerTin: string;
  declarationPeriod: string;
  salesItems: TransactionItemDto[];
  purchaseItems: TransactionItemDto[];
  status: TaxDeclarationStatus;
  totalSalesCents: number;
  totalPurchaseCents: number;
  payableCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface VatRepository {
  persistDeclaration(dto: SubmitVatDeclarationDto): Promise<VatDeclarationEntity>;
  findById(id: string): Promise<VatDeclarationEntity | null>;
  findByPeriod(companyId: string, taxPeriod: string): Promise<VatDeclarationEntity[]>;
  updateStatus(id: string, status: TaxDeclarationStatus): Promise<VatDeclarationEntity | null>;
}

export class VatService {
  constructor(private readonly repo: VatRepository) {}

  async processAndPersistDeclaration(dto: SubmitVatDeclarationDto): Promise<VatDeclarationEntity> {
    const totalSalesCents = dto.salesItems.reduce((sum, item) => sum + (item.itemTotalCents || 0), 0);
    const totalPurchaseCents = dto.purchaseItems.reduce((sum, item) => sum + (item.itemTotalCents || 0), 0);
    const payableCents = Math.max(0, totalSalesCents - totalPurchaseCents);

    const entity = {
      ...dto,
      status: TaxDeclarationStatus.DRAFT,
      totalSalesCents,
      totalPurchaseCents,
      payableCents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.repo.persistDeclaration(entity as any);
  }

  async getDeclarationWithDetails(id: string): Promise<VatDeclarationEntity | null> {
    return this.repo.findById(id);
  }

  async getDeclarationsByPeriod(companyId: string, taxPeriod: string): Promise<VatDeclarationEntity[]> {
    return this.repo.findByPeriod(companyId, taxPeriod);
  }

  async amendDeclaration(id: string, dto: Partial<SubmitVatDeclarationDto>): Promise<VatDeclarationEntity | null> {
    const existing = await this.repo.findById(id);
    if (!existing || existing.status === TaxDeclarationStatus.SUBMITTED) {
      return null;
    }
    return this.repo.updateStatus(id, TaxDeclarationStatus.AMENDED);
  }

  computeVatPayable(salesCents: number, purchasesCents: number): number {
    return Math.max(0, salesCents - purchasesCents);
  }
}
