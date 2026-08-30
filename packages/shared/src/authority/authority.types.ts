export type AuthorityCode = 'MOR' | 'ECC';

export interface AuthorityMeta {
  code: AuthorityCode;
  label: string;
}

export const AUTHORITY: Record<AuthorityCode, AuthorityMeta> = {
  MOR: { code: 'MOR', label: 'Ministry of Revenues (MoR)' },
  ECC: { code: 'ECC', label: 'Ethiopian Customs Commission (ECC)' },
};

