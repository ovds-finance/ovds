/**
 * @ovds/shared — integration types
 * Third-party integration status and configuration types.
 */

export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING';

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: IntegrationStatus;
  config?: Record<string, unknown>;
  companyId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AppSettings {
  [key: string]: unknown;
}
