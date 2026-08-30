import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { TaxFilingType, TaxPeriod, IAS12Treatment } from '@ovds/shared/ovds/tax.types';

export type { TaxFilingType, TaxPeriod, IAS12Treatment } from '@ovds/shared/ovds/tax.types';

export class FxDifferenceDto {
  @IsString()
  intercompanyTxId!: string;

  @IsString()
  period!: string;
}

export class NonIncomeTaxDto {
  @IsString()
  journalLineId!: string;
}

export class VatReconciliationDto {
  @IsString()
  period!: string;

  @IsNumber()
  @Min(0)
  taxableAmount!: number;

  @IsNumber()
  @Min(0)
  outputVat!: number;

  @IsNumber()
  @Min(0)
  inputVat!: number;

  @IsNumber()
  netPayable!: number;
}

export class IncomeTaxDto {
  @IsNumber()
  year!: number;

  @IsNumber()
  @IsOptional()
  annualRevenue?: number;

  @IsNumber()
  netProfit!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rate?: number; // default 0.30

  @IsNumber()
  taxPayable!: number;
}

export class ETaxPayloadDto {
  /** Optional override when generating payloads from background jobs/admin tools. */
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  tin!: string;

  @IsString()
  period!: string;

  @IsEnum(TaxFilingType)
  type!: TaxFilingType;

  @IsNumber()
  @IsOptional()
  taxableAmount?: number;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  paymentRef?: string;

  @IsDateString()
  submittedAt!: string;
}

export class TaxReportDto {
  @IsString()
  period!: string;

  @IsEnum(TaxFilingType)
  type!: TaxFilingType;

  @IsNumber()
  @IsOptional()
  outputVat?: number;

  @IsNumber()
  @IsOptional()
  inputVat?: number;

  @IsNumber()
  @IsOptional()
  netVat?: number;

  @IsNumber()
  @IsOptional()
  incomeTax?: number;

  @IsNumber()
  @IsOptional()
  drrfLevies?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];

  @IsString()
  status!: 'DRAFT' | 'SUBMITTED' | 'PAID' | 'FILED';

  @IsOptional()
  @IsString()
  eTaxReference?: string;
}

export class CreateTaxFilingDto {
  @IsString()
  period!: string;

  @IsString() // Use IsString instead of IsEnum to accept BIT alias
  type!: TaxFilingType | string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  grossIncome?: number;

  @IsOptional()
  @IsNumber()
  taxableIncome?: number;

  @IsOptional()
  @IsNumber()
  matAmount?: number;

  @IsOptional()
  @IsString()
  taxpayerType?: string;

  @IsOptional()
  @IsNumber()
  whtCredits?: number;

  @IsOptional()
  @IsNumber()
  provisionalPaid?: number;

  // ── Phase 5 — Withholding Tax ─────────────────────────────────────────────
  /** WHT transaction type — required when type is WITHHOLDING or WHT */
  @IsOptional()
  @IsEnum(['GOODS', 'SERVICES', 'SERVICES_NR', 'RENT', 'DIVIDEND', 'INTEREST',
           'ROYALTY_ARTISTIC', 'ROYALTY_TECHNICAL', 'CAPITAL_GAINS', 'IMPORT'])
  whtType?: 'GOODS' | 'SERVICES' | 'SERVICES_NR' | 'RENT' | 'DIVIDEND' |
            'INTEREST' | 'ROYALTY_ARTISTIC' | 'ROYALTY_TECHNICAL' |
            'CAPITAL_GAINS' | 'IMPORT';

  // ── Phase 8 — Excise Tax ──────────────────────────────────────────────────
  @IsOptional()
  @IsEnum(['ALCOHOL', 'TOBACCO', 'AUTOMOBILE_GT_1800CC', 'AUTOMOBILE_LT_1800CC',
           'AUTOMOBILE_ELECTRIC', 'JEWELRY', 'YACHT', 'PRIVATE_AIRCRAFT', 'FIREARMS',
           'SUGAR_SWEETENED', 'ENERGY_DRINK', 'PLASTIC', 'OTHER'])
  exciseCategory?: 'ALCOHOL' | 'TOBACCO' | 'AUTOMOBILE_GT_1800CC' |
                   'AUTOMOBILE_LT_1800CC' | 'AUTOMOBILE_ELECTRIC' | 'JEWELRY' |
                   'YACHT' | 'PRIVATE_AIRCRAFT' | 'FIREARMS' | 'SUGAR_SWEETENED' |
                   'ENERGY_DRINK' | 'PLASTIC' | 'OTHER';

  // ── Phase 6 — DRRF Levy ───────────────────────────────────────────────────
  @IsOptional()
  @IsEnum(['LOAN_VALUE', 'INSURANCE_PREMIUM', 'SERVICE_FEES', 'AIRTIME_SALES',
           'TICKET_SALES', 'ANNUAL_SALES_REVENUE', 'FUEL_SALES', 'TOBACCO_ALCOHOL',
           'GOVERNMENT_SERVICES', 'SALARY_CONTRIBUTION', 'TELECOM_DIGITAL',
           'DIVIDEND', 'OTHER'])
  drrfCategory?: 'LOAN_VALUE' | 'INSURANCE_PREMIUM' | 'SERVICE_FEES' | 'AIRTIME_SALES' |
                 'TICKET_SALES' | 'ANNUAL_SALES_REVENUE' | 'FUEL_SALES' | 'TOBACCO_ALCOHOL' |
                 'GOVERNMENT_SERVICES' | 'SALARY_CONTRIBUTION' | 'TELECOM_DIGITAL' |
                 'DIVIDEND' | 'OTHER';

  // ── Phase 7 — Pension ─────────────────────────────────────────────────────
  @IsOptional()
  @IsEnum(['EMPLOYEE', 'EMPLOYER', 'COMBINED'])
  pensionType?: 'EMPLOYEE' | 'EMPLOYER' | 'COMBINED';

  // ── Phase 9 — Import ──────────────────────────────────────────────────────
  @IsOptional()
  @IsNumber()
  cifValue?: number;

  @IsOptional()
  @IsNumber()
  customsDuty?: number;

  // ── Phase 10 — Stamp Duty ─────────────────────────────────────────────────
  @IsOptional()
  @IsBoolean()
  isContract?: boolean;

  @IsOptional()
  @IsNumber()
  contractValue?: number;

  // ── IAS 12 — Deferred Tax ─────────────────────────────────────────────────
  /** IAS 12 treatment classification for this filing */
  @IsOptional()
  @IsEnum(['EXPENSE', 'ASSET', 'LIABILITY', 'COGS', 'NOT_INCOME_TAX'])
  ias12Treatment?: 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'COGS' | 'NOT_INCOME_TAX';
}

export class IncomeTaxFilingDto {
  @IsNumber()
  fiscalYear!: number;

  @IsNumber()
  netProfit!: number;

  @IsNumber()
  @IsOptional()
  adjustments?: number;

  @IsNumber()
  taxableIncome!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @IsNumber()
  taxPayable!: number;

  @IsNumber()
  @IsOptional()
  paid?: number;

  @IsNumber()
  balanceDue!: number;

  @IsEnum(['PENDING', 'FILED', 'PAID'])
  status!: 'PENDING' | 'FILED' | 'PAID';

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  etaxRef?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
