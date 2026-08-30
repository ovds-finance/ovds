// Pure TypeScript types — no framework deps (class-validator DTOs live in @ovds/dto)

export enum AuditFirmStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum EngagementStatus {
  CONSULTATION = 'CONSULTATION',
  PLANNING = 'PLANNING',
  FIELDWORK = 'FIELDWORK',
  REPORTING = 'REPORTING',
  FOLLOWUP = 'FOLLOWUP',
  COMPLETED = 'COMPLETED',
}

export enum AuditType {
  FINANCIAL_STATEMENT = 'FINANCIAL_STATEMENT',
  COMPLIANCE = 'COMPLIANCE',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  INTERNAL_CONTROL = 'INTERNAL_CONTROL',
  TAX_COMPLIANCE = 'TAX_COMPLIANCE',
  INTERNAL = 'INTERNAL',
  OTHER = 'OTHER',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum FindingSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface CreateAuditFirmDto {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  industry?: string;
  notes?: string;
  /** integer 0–5 */
  rating?: number;
}

export interface UpdateAuditFirmDto {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  industry?: string;
  notes?: string;
  rating?: number;
  status?: AuditFirmStatus;
}

export interface CreateEngagementDto {
  firmId?: string;
  title: string;
  auditType?: AuditType;
  riskLevel?: RiskLevel;
  scope?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  budget?: number;
  actualCost?: number;
  referenceDocUrl?: string;
}

export interface UpdateEngagementDto {
  title?: string;
  auditType?: AuditType;
  riskLevel?: RiskLevel;
  scope?: string;
  status?: EngagementStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
  reportSummary?: string;
  budget?: number;
  actualCost?: number;
  referenceDocUrl?: string;
}

export interface CreateCommentDto {
  engagementId: string;
  content: string;
  authorName?: string;
}

export interface CreateFindingDto {
  engagementId: string;
  title: string;
  description?: string;
  severity?: FindingSeverity;
  recommendation?: string;
  dueDate?: string;
  assignedTo?: string;
  referenceDocUrl?: string;
}

export interface UpdateFindingDto {
  title?: string;
  description?: string;
  severity?: FindingSeverity;
  recommendation?: string;
  resolution?: string;
  status?: string;
  dueDate?: string;
  assignedTo?: string;
  referenceDocUrl?: string;
}
