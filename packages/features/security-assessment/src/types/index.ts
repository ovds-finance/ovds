export interface SecurityAssessment {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  currentPhase?: string;
  startedAt?: string;
  completedAt?: string;
  conductedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityScan {
  id: string;
  assessmentId: string;
  phase: string;
  scanType: string;
  target?: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED';
  result?: string;
  evidence?: string;
  severity?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityFinding {
  id: string;
  assessmentId: string;
  scanId?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  title: string;
  description: string;
  affectedResource?: string;
  remediation?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK' | 'FALSE_POSITIVE';
  assignedTo?: string;
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecuritySummary {
  totalAssessments: number;
  activeAssessments: number;
  totalFindings: number;
  openFindings: number;
  criticalFindings: number;
  findingsBySeverity: Array<{ severity: string; count: number }>;
  findingsByCategory: Array<{ category: string; count: number }>;
}
