import { ovdsSummary } from './ovds/ovds.types';

export interface HealthScoreComponent {
  label: string;
  score: number;
  detail: string;
}

export interface HealthScore {
  overall: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'N/A';
  components: HealthScoreComponent[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp?: string | Date;
  apiVersion?: string;
  dbConnection?: 'OK' | 'ERROR';
  lastCheck?: string | Date | null; // Frontend uses this
  cleanupStats?: {
    pendingExpiredCache: number;
    recentAttendance: number;
    auditLogsCount: number;
  };
  ovdsSummary?: ovdsSummary;
  healthScore?: HealthScore;
  services?: Record<string, 'OK' | 'DEGRADED' | 'ERROR'>;
  uptime?: number;
  error?: string;
  statusCode?: number; // HTTP status code of the last failed check
}

export interface NetworkEvent {
  url: string;
  method: string;
  status: number | null;
  duration: number;
  timestamp: string | Date;
  isError: boolean;
}
