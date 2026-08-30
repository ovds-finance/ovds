export interface IIfrsDeps {}
export interface IIfrs15Deps {}
export interface IIfrs16Deps {}
export interface IIfrs38Deps {}
export interface IIfrsScheduleDeps {}
export interface IDashboardDeps {}

export interface Lease {
  id: string;
  companyId: string;
  assetDescription: string;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  status: string;
}

export interface FixedAsset {
  id: string;
  companyId: string;
  description: string;
  acquisitionCost: number;
  usefulLife: number;
  status: string;
}

export interface ImpairmentTest {
  id: string;
  assetId: string;
  companyId: string;
  recoverableAmount: number;
  carryingAmount: number;
  status: string;
}

export interface DisclosureNote {
  id: string;
  companyId: string;
  period: string;
  content: unknown;
  status: string;
}

export class IfrsService {
  constructor(private readonly deps: unknown) {}

  async listLeases(companyId?: string): Promise<Lease[]> { return []; }
  async getFixedAssets(companyId?: string): Promise<FixedAsset[]> { return []; }
  async getImpairment(companyId?: string): Promise<ImpairmentTest | null> { return null; }
  async getDisclosureNotes(companyId?: string): Promise<DisclosureNote[]> { return []; }
}