export interface QuickCheck {
  pass: boolean;
  rate?: number;
  cap?: number;
  tin?: string;
  entries?: number;
  expected?: number;
  actual?: number;
  details?: Record<string, boolean>;
}

export interface VandvReport {
  vat: {
    pass: boolean;
    checks: {
      StandardRate?: QuickCheck;
      TinLength?: QuickCheck;
      OutputVatLedger?: QuickCheck;
      InputVatLedger?: QuickCheck;
    };
  };
  paye: {
    pass: boolean;
    checks: {
      PitBrackets?: QuickCheck;
      TaxFreeThreshold?: QuickCheck;
      EmployeePension?: QuickCheck;
      EmployerPension?: QuickCheck;
    };
  };
  wht: {
    pass: boolean;
    compliant: boolean;
    checks: {
      ServicesThreshold?: QuickCheck;
      GoodsThreshold?: QuickCheck;
      TotalWithheld?: QuickCheck;
    };
  };
  reconciliation: {
    balanced: boolean;
    difference: number;
    TotalDebits: number;
    TotalCredits: number;
    JournalEntriesCount: number;
    LastEntryDate?: string;
  };
  PeriodLocked: boolean;
  OverallScore: number;
  issues?: string[];
  QuickChecks?: {
    vat: QuickCheck;
    paye: QuickCheck;
    wht: QuickCheck;
    reconciliation: QuickCheck;
    PeriodLock: QuickCheck;
    OverallPass: boolean;
  };
}