export enum AttendanceMethod {
  MANUAL = 'MANUAL',
  BIOMETRIC = 'BIOMETRIC',
  KIOSK = 'KIOSK',
  MOBILE = 'MOBILE',
  QR_CODE = 'QR_CODE',
  SYSTEM = 'SYSTEM',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
}

export enum BiometricType {
  FINGERPRINT = 'FINGERPRINT',
  FACE = 'FACE',
  IRIS = 'IRIS',
  VOICE = 'VOICE',
  CARD = 'CARD',
}

export enum EmployeeBusinessType {
  MANUFACTURING = 'MANUFACTURING',
  LARGE_ENTERPRISE = 'LARGE_ENTERPRISE',
  MEDIUM_ENTERPRISE = 'MEDIUM_ENTERPRISE',
  SMALL_BUSINESS = 'SMALL_BUSINESS',
  FREELANCER = 'FREELANCER',
  GOVERNMENT = 'GOVERNMENT',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export enum ContributionCategory {
  LOAN_VALUE = 'LOAN_VALUE',
  INSURANCE_PREMIUM = 'INSURANCE_PREMIUM',
  SERVICE_FEES = 'SERVICE_FEES',
  AIRTIME_SALES = 'AIRTIME_SALES',
  TICKET_SALES = 'TICKET_SALES',
  ANNUAL_SALES_REVENUE = 'ANNUAL_SALES_REVENUE',
  FUEL_SALES = 'FUEL_SALES',
  TOBACCO_ALCOHOL = 'TOBACCO_ALCOHOL',
  GOVERNMENT_SERVICES = 'GOVERNMENT_SERVICES',
  GOVERNMENT_BUDGET = 'GOVERNMENT_BUDGET',
  TELECOM_DIGITAL = 'TELECOM_DIGITAL',
  DIVIDEND = 'DIVIDEND',
  OTHER = 'OTHER',
}

export enum ContributionStatus {
  PENDING = 'PENDING',
  REMITTED = 'REMITTED',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID',
  ARCHIVED = 'ARCHIVED',
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  departmentId?: string;
  position?: string;
  salary: number;
  status: 'ACTIVE' | 'INACTIVE';
}
