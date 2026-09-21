import {CreateBankAccountDto} from '@ovds/dto';
import type { BankTransaction } from '@ovds/features/banking';
import {
  Account,
  BankAccount,
  Vendor,
  JournalEntry,
  JournalLine,
  AccountBalancesResponse,
} from '@ovds/shared';

export type {
  Account,
  BankAccount,
  BankTransaction,
  Vendor,
  JournalEntry,
  JournalLine,
  CreateBankAccountDto,
  AccountBalancesResponse,
};

export type TaxReport = import('./tax').TaxReport;
export type VatReconciliation = import('./tax').VatReconciliation;
export type IncomeTaxReport = import('./tax').IncomeTaxReport;
export type TaxDashboard = import('./tax').TaxDashboard;
