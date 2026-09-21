/**
 * ComplianceStatusBar — sticky compliance status strip.
 * Shows VAT deadline, DRRF status, and payroll approval status.
 * Appears at the top of ovds/accounting pages when deadlines are near.
 * Subscribes to real-time payroll updates via WebSocket.
 */
import {
  AlertTriangle, X, Globe,
  Shield, Banknote, ChevronRight, ShieldCheck,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

interface StatusItem {
  id: string;
  label: string;
  detail: string;
  severity: 'critical' | 'warning' | 'ok';
  to: string;
  icon: React.ReactNode;
}

interface ComplianceStatusBarProps {
  /** Only show when there are warnings/critical items */
  onlyWhenUrgent?: boolean;
}

const SEVERITY_STYLES = {
  critical: 'bg-rose-600 text-white',
  warning:  'bg-amber-500 text-white',
  ok:       'bg-[var(--pro-azure)] text-white',
};

const ComplianceStatusBar: React.FC<ComplianceStatusBarProps> = ({ onlyWhenUrgent = true }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<StatusItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [pendingPayroll, setPendingPayroll] = useState(0);

  const fetchPayrollPending = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
    const _now = new Date();
    const res = await api.get(`/payroll/dashboard-stats`, {
        headers: { 'x-background': '1' },
      } as any);
      const d = res.data?.data ?? res.data;
      setPendingPayroll(d?.pending ?? 0);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  // Real-time payroll updates
  useWebSocket({
    enabled: isAuthenticated,
    rooms: ['dashboard'],
    events: {
      payrollUpdate: () => fetchPayrollPending(),
    },
  });

  useEffect(() => {
    fetchPayrollPending();
  }, [fetchPayrollPending]);

  useEffect(() => {
    const now = new Date();
    const vatDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 30);
    const vatDays = Math.ceil((vatDeadline.getTime() - now.getTime()) / 86_400_000);
    const isQEnd = [3, 6, 9, 12].includes(now.getMonth() + 1);
    const dayOfMonth = now.getDate();

    const newItems: StatusItem[] = [];

    if (vatDays <= 7) {
      newItems.push({
        id: 'vat',
        label: t('compliance.vat_due', { days: vatDays }),
        detail: `${vatDeadline.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })} · ${t('compliance.vat_penalty')}`,
        severity: vatDays <= 3 ? 'critical' : 'warning',
        to: '/tax/vat',
        icon: <Globe size={12} />,
      });
    }

    if (isQEnd && dayOfMonth >= 20) {
      newItems.push({
        id: 'drrf',
        label: t('compliance.drrf_due'),
        detail: t('compliance.drrf_detail'),
        severity: dayOfMonth >= 28 ? 'critical' : 'warning',
        to: '/disaster-fund',
        icon: <Shield size={12} />,
      });
    }

    // Ethiopian FY end (July 7)
    if (now.getMonth() + 1 === 7 && dayOfMonth <= 7) {
      newItems.push({
        id: 'fy-end',
        label: t('compliance.fy_ending'),
        detail: t('compliance.fy_detail'),
        severity: 'warning',
        to: '/accounting',
        icon: <ShieldCheck size={12} />,
      });
    }

    // BIT deadline: November 7
    const isBitMonth = now.getMonth() + 1 === 11;
    if (isBitMonth && dayOfMonth >= 1 && dayOfMonth <= 7) {
      const bitDays = 7 - dayOfMonth;
      newItems.push({
        id: 'bit',
        label: t('compliance.bit_due', { days: bitDays }),
        detail: t('compliance.bit_detail'),
        severity: bitDays <= 2 ? 'critical' : 'warning',
        to: '/tax/business-income',
        icon: <Banknote size={12} />,
      });
      // MAT is assessed alongside BIT — warn if in BIT month
      newItems.push({
        id: 'mat',
        label: 'MAT Assessment Due (2.5% of turnover)',
        detail: 'Minimum Alternative Tax — pay whichever is higher: BIT (30%) or MAT (2.5% of turnover) · Proc. 1395/2025',
        severity: bitDays <= 2 ? 'critical' : 'warning',
        to: '/tax/business-income',
        icon: <Banknote size={12} />,
      });
    }

    // TOT deadline: 30th of following month (same as VAT, for Category B taxpayers)
    if (vatDays <= 7) {
      newItems.push({
        id: 'tot',
        label: `TOT Return Due in ${vatDays} day${vatDays !== 1 ? 's' : ''} (Category B)`,
        detail: `Turnover Tax: 2% on goods / 10% on services · For businesses with annual turnover < ETB 2M · ${vatDeadline.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })}`,
        severity: vatDays <= 3 ? 'critical' : 'warning',
        to: '/tax/vat',
        icon: <Globe size={12} />,
      });
    }

    setItems(newItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // t is stable — intentionally omitted to avoid re-running on lang change mid-session

  // Merge payroll pending into items
  const allItems: StatusItem[] = [
    ...items,
    ...(pendingPayroll > 0 ? [{
      id: 'payroll',
      label: t('compliance.payroll_pending', { count: pendingPayroll }),
      detail: t('compliance.payroll_detail'),
      severity: 'warning' as const,
      to: '/hr/payroll',
      icon: <Banknote size={12} />,
    }] : []),
  ];

  if (dismissed || allItems.length === 0) return null;
  if (onlyWhenUrgent && !allItems.some(i => i.severity === 'critical' || i.severity === 'warning')) return null;

  const topSeverity = allItems.some(i => i.severity === 'critical') ? 'critical'
    : allItems.some(i => i.severity === 'warning') ? 'warning' : 'ok';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`${SEVERITY_STYLES[topSeverity]} px-3 py-1.5 flex items-center gap-2 animate-in slide-in-from-top duration-200`}
    >
      <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
      <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-none">
        {allItems.map(item => (
          <Link
            key={item.id}
            to={item.to}
            className="flex items-center gap-1 text-[10px] font-bold whitespace-nowrap hover:underline shrink-0"
          >
            {item.icon}
            {item.label}
            <span className="opacity-70 font-normal hidden sm:inline">— {item.detail}</span>
            <ChevronRight size={9} />
          </Link>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded"
        aria-label={t('a11y.dismiss')}
      >
        <X size={11} />
      </button>
    </div>
  );
};

export default ComplianceStatusBar;

