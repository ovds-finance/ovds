export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  hireDate?: string;
  salary?: number;
  companyId: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  salary?: number;
}

export interface EmployeeDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  hireDate?: string;
  salary?: number;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceDto {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  companyId: string;
}

export interface CreateLeaveDto {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  companyId: string;
}

// -- Pay Calendar --------------------------------------------------------------

export interface CreatePayCalendarDto {
  name: string;
  frequency: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  startDate: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  companyId: string;
}

export interface UpdatePayCalendarDto {
  name?: string;
  frequency?: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  startDate?: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  isActive?: boolean;
}

export interface PayCalendarDto {
  id: string;
  name: string;
  frequency: string;
  startDate: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// -- Pay Run --------------------------------------------------------------------

export interface CreatePayRunDto {
  calendarId: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  companyId: string;
}

export interface UpdatePayRunDto {
  status?: 'DRAFT' | 'GENERATED' | 'VERIFIED' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paymentDate?: string;
  notes?: string;
}

export interface PayRunDto {
  id: string;
  calendarId: string;
  calendarName?: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  status: string;
  notes?: string;
  employeeCount?: number;
  totalAmount?: number;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayRunEmployeeDto {
  id: string;
  payRunId: string;
  employeeId: string;
  employeeName?: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  variableAdjustments: number;
  grossSalary: number;
  netSalary: number;
  status: string;
  notes?: string;
}

// -- Asset Allocation ----------------------------------------------------------

export interface CreateAssetAllocationDto {
  employeeId: string;
  assetName: string;
  assetType: string;
  serialNumber?: string;
  assignedDate: string;
  returnDate?: string;
  conditionNotes?: string;
  companyId: string;
}

export interface UpdateAssetAllocationDto {
  returnDate?: string;
  conditionNotes?: string;
  status?: 'ASSIGNED' | 'RETURNED' | 'DAMAGED' | 'LOST';
}

export interface AssetAllocationDto {
  id: string;
  employeeId: string;
  employeeName?: string;
  assetName: string;
  assetType: string;
  serialNumber?: string;
  assignedDate: string;
  returnDate?: string;
  conditionNotes?: string;
  status: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}
