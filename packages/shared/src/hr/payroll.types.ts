export interface PayrollSummary {
  count: number;
  configured: number;
  totalGross: number;
  totalPension: number;
  totalTax: number;
  totalDrrf: number;
  totalNet: number;
}

export interface EmployeePayrollSummary {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeIdCode: string;
  departmentName: string;
  subsidiary: string | null;
  presentDays: number;
  absentDays: number;
  otHours: number;
  workingDays: number;
  grossPay: number;
  otPay: number;
  grossTotal: number;
  employeePension: number;
  employerPension: number;
  incomeTax: number;
  drrf: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  calculatedSalary: number;
  baseSalary: number;
  payrollStatus: string;
  employmentNature: string;
  cadre: string;
  designation: string | null;
  dateOfNextIncrement: Date | string | null;
  bankName: string | null;
  accountNumber: string | null;
  pfAccountNumber: string | null;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  grossSalary: number;
  pensionEmployee: number;
  pensionEmployer: number;
  incomeTax: number;
  netSalary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  createdAt: string | Date;
}

export interface Arrear {
  id: string;
  employeeId: string;
  employeeName: string;
  description: string;
  amount: number;
  month: string;
  status: 'PENDING' | 'APPLIED';
}

export interface OtherPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  amount: number;
  month: string;
  description: string;
}

export interface LoanRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  monthlyDeduction: number;
  remainingBalance: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  requestedAt: string | Date;
}

export interface ReimbursementClaim {
  id: string;
  employeeId: string;
  employeeName?: string;
  destination: string;
  purpose: string;
  locationTier: number | string;
  startDate: string | Date;
  endDate: string | Date;
  transportCost: number;
  perDiemAmount: number;
  totalAmount: number;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  approvedBy?: string;
  approvedAt?: string | Date;
  companyId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type PayrollBracketSet = 'PROCLAMATION_979_2016' | 'PROCLAMATION_1395_2025';

export interface PayrollTaxBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}

export interface PayrollSettings {
  bracketSet: PayrollBracketSet;
  customBrackets?: PayrollTaxBracket[];
  pensionEmployeeRate: number;
  pensionEmployerRate: number;
  pensionCapEtb: number;
  drrfRate: number;
}

export interface TaxDeclarationForm {
  period: string;
  companyId: string;
  tin: string;
  companyName: string;
  employeeCount: number;
  totalGrossSalary: number;
  totalPit: number;
  totalEmpPension: number;
  totalEmpRPension: number;
  totalDrrf: number;
  netPayableMor: number;
  netPayablePfsa: number;
  submittedAt?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PAID';
}
