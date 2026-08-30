/**
 * useAuditLog — client-side audit event emitter.
 *
 * Sends structured audit events to the backend /audit-logs endpoint.
 * Fire-and-forget: failures are silently swallowed so they never block UI.
 *
 * Usage:
 *   const { log } = useAuditLog();
 *
 *   // Log a user action
 *   log('INVOICE_DELETED', { invoiceId: id, amount: 5000 });
 *
 *   // Log with explicit entity
 *   log('ROLE_CHANGED', { userId, from: 'EMPLOYEE', to: 'ovds' }, 'User');
 *
 *   // Log a failed access attempt
 *   logDenied('payroll:approve', '/hr/payroll-administration');
 */
import { useCallback } from 'react';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

export type AuditAction =
  // Auth
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'ROLE_CHANGED'
  | 'MFA_ENROLLED' | 'SSO_LINKED' | 'SSO_UNLINKED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED'
  // Access control
  | 'ACCESS_DENIED' | 'PERMISSION_ESCALATION_ATTEMPT'
  // HR
  | 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_DELETED'
  | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_SUBMITTED'
  | 'ATTENDANCE_VERIFIED' | 'ENROLLMENT_COMPLETED'
  // Payroll
  | 'PAYROLL_GENERATED' | 'PAYROLL_APPROVED' | 'PAYROLL_FINALIZED' | 'PAYROLL_EXPORTED'
  // ovds
  | 'INVOICE_CREATED' | 'INVOICE_SENT' | 'INVOICE_DELETED' | 'PAYMENT_RECORDED'
  | 'BILL_CREATED' | 'BILL_PAID' | 'JOURNAL_ENTRY_POSTED' | 'PERIOD_CLOSED'
  | 'BANK_RECONCILED' | 'FUND_TRANSFER_APPROVED'
  // Tax
  | 'VAT_FILED' | 'VAT_CALCULATED' | 'BIT_FILED' | 'DISASTER_FUND_SUBMITTED'
  // System
  | 'SETTINGS_CHANGED' | 'USER_CREATED' | 'USER_DELETED' | 'COMPANY_CREATED'
  | 'REPORT_EXPORTED' | 'DATA_EXPORTED'
  // Generic
  | string;

export interface AuditEvent {
  action: AuditAction;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  /** Override the route — defaults to window.location.pathname */
  route?: string;
}

export interface UseAuditLogReturn {
  /**
   * Fire-and-forget audit log.
   * @param action  — what happened (e.g. 'INVOICE_DELETED')
   * @param metadata — arbitrary key/value context
   * @param entity  — entity type (e.g. 'Invoice', 'User')
   * @param entityId — entity primary key
   */
  log(
    action: AuditAction,
    metadata?: Record<string, unknown>,
    entity?: string,
    entityId?: string,
  ): void;

  /** Convenience: log an access-denied event with the attempted permission + route */
  logDenied(permission: string, route?: string): void;

  /** Convenience: log a data export event */
  logExport(entity: string, format: 'csv' | 'pdf' | 'xlsx', count?: number): void;
}

export function useAuditLog(): UseAuditLogReturn {
  const { user } = useAuth();

  const log = useCallback(
    (
      action: AuditAction,
      metadata?: Record<string, unknown>,
      entity?: string,
      entityId?: string,
    ) => {
      if (!user) return;
      const payload: AuditEvent = {
        action,
        entity,
        entityId,
        metadata: {
          ...metadata,
          _role: user.role,
          _companyId: user.companyId,
          _route: window.location.pathname,
        },
        route: window.location.pathname,
      };
      // Fire-and-forget — never await, never block the UI
      api
        .post('/dashboard/audit-logs/client', payload, { headers: { 'x-background': '1' } } as any)
        .catch((err: any) => {
          // Log to console in dev so audit gaps are visible during development
          if (import.meta.env.DEV) {
            console.warn('[audit] Failed to write audit log:', action, err?.message);
          }
        });
    },
    [user],
  );

  const logDenied = useCallback(
    (permission: string, route?: string) => {
      log('ACCESS_DENIED', { permission, attemptedRoute: route ?? window.location.pathname });
    },
    [log],
  );

  const logExport = useCallback(
    (entity: string, format: 'csv' | 'pdf' | 'xlsx', count?: number) => {
      log('DATA_EXPORTED', { format, count }, entity);
    },
    [log],
  );

  return { log, logDenied, logExport };
}
