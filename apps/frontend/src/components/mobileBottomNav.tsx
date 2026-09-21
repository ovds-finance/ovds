/**
 * MobileBottomNav — iOS/Android-style bottom navigation bar.
 * Only visible on mobile (hidden on lg+).
 * Shows 4 role-based routes + a centre "New" FAB with quick-create options.
 * All icons use the project's <Icon> component (no lucide-react direct imports).
 * Roles aligned with the four-phase OVDS ovds sidebar structure.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useInterval } from '../hooks';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

import { Icon } from './ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BottomNavItem {
  to: string;
  /** IconType key from @ovds/ui */
  icon: string;
  labelKey: string;
  badge?: boolean;
}

interface QuickCreateItem {
  labelKey: string;
  icon: string;
  to: string;
}

// ---------------------------------------------------------------------------
// Phase-aligned role nav — 4 items per role (centre slot = FAB)
// Ordered by the four phases: Setup → Operations → Analysis → MoR
// ---------------------------------------------------------------------------
const ROLE_NAV: Record<string, BottomNavItem[]> = {
  // Phase 2 dominant roles
  EMPLOYEE: [
    { to: '/dashboard',     icon: 'DASHBOARD',     labelKey: 'mobile_nav.home' },
    { to: '/hr/leaves',        icon: 'CALENDAR',      labelKey: 'mobile_nav.leaves' },
    { to: '/hr/attendance',    icon: 'CLOCK',         labelKey: 'mobile_nav.attend' },
    { to: '/notifications', icon: 'BELL',          labelKey: 'mobile_nav.alerts', badge: true },
  ],
  HR: [
    { to: '/dashboard',  icon: 'DASHBOARD', labelKey: 'mobile_nav.home' },
    { to: '/hr/employees',  icon: 'EMPLOYEE',  labelKey: 'mobile_nav.staff' },
    { to: '/hr/payroll',    icon: 'BANKNOTE',  labelKey: 'mobile_nav.payroll' },
    { to: '/hr/attendance', icon: 'CLOCK',     labelKey: 'mobile_nav.attend' },
  ],
  // ovds: Operations → Analysis → MoR
  ovds: [
    { to: '/dashboard', icon: 'DASHBOARD',    labelKey: 'mobile_nav.home' },
    { to: '/sales/invoices',  icon: 'INVOICE',      labelKey: 'mobile_nav.invoices' },
    { to: '/tax/vat',       icon: 'SHIELD_CHECK', labelKey: 'mobile_nav.vat' },
    { to: '/reports',   icon: 'BAR_CHART_2',  labelKey: 'mobile_nav.reports' },
  ],
  ACCOUNTING: [
    { to: '/dashboard',        icon: 'DASHBOARD',  labelKey: 'mobile_nav.home' },
    { to: '/sales/invoices',         icon: 'INVOICE',    labelKey: 'mobile_nav.invoices' },
    { to: '/ovds/accounts',     icon: 'BOOK_OPEN',  labelKey: 'mobile_nav.ledger' },
    { to: '/banking/accounts', icon: 'BANK',       labelKey: 'mobile_nav.banks' },
  ],
  // Phase 3 + 4 roles
  AUDITOR: [
    { to: '/dashboard',          icon: 'DASHBOARD',    labelKey: 'mobile_nav.home' },
    { to: '/settings/audit-logs',         icon: 'HISTORY',      labelKey: 'mobile_nav.audit' },
    { to: '/compliance/auditor', icon: 'SHIELD_CHECK', labelKey: 'mobile_nav.comply' },
    { to: '/reports',            icon: 'BAR_CHART_2',  labelKey: 'mobile_nav.reports' },
  ],
  EXTERNAL_AUDITOR: [
    { to: '/dashboard',          icon: 'DASHBOARD',     labelKey: 'mobile_nav.home' },
    { to: '/settings/audit-logs',         icon: 'HISTORY',       labelKey: 'mobile_nav.audit' },
    { to: '/compliance/audit-outsourcing',  icon: 'EXTERNAL_LINK', labelKey: 'mobile_nav.comply' },
    { to: '/reports',            icon: 'BAR_CHART_2',   labelKey: 'mobile_nav.reports' },
  ],
  // IFRS officer: Analysis-focused
  IFRS_OFFICER: [
    { to: '/dashboard',   icon: 'DASHBOARD',     labelKey: 'mobile_nav.home' },
    { to: '/ifrs',        icon: 'CLIPBOARD_LIST', labelKey: 'mobile_nav.ifrs' },
    { to: '/accounting/fixed-assets',icon: 'COMPANY',       labelKey: 'mobile_nav.analysis' },
    { to: '/reports',     icon: 'BAR_CHART_2',   labelKey: 'mobile_nav.reports' },
  ],
  // Banking liaison: Cash & Banking phase
  BANK_LIAISON: [
    { to: '/dashboard',          icon: 'DASHBOARD',        labelKey: 'mobile_nav.home' },
    { to: '/banking/accounts',   icon: 'BANK',             labelKey: 'mobile_nav.banking' },
    { to: '/banking/reconciliation',icon: 'REFRESH_CW',       labelKey: 'mobile_nav.banking' },
    { to: '/banking/transactions',       icon: 'ARROW_LEFT_RIGHT', labelKey: 'mobile_nav.orders' },
  ],
  // Admin: cross-phase
  ADMIN: [
    { to: '/dashboard',     icon: 'DASHBOARD',  labelKey: 'mobile_nav.home' },
    { to: '/hr/employees',     icon: 'EMPLOYEE',   labelKey: 'mobile_nav.hr' },
    { to: '/sales/invoices',      icon: 'INVOICE',    labelKey: 'mobile_nav.invoices' },
    { to: '/notifications', icon: 'BELL',       labelKey: 'mobile_nav.alerts', badge: true },
  ],
  SPURADMIN: [
    { to: '/dashboard',     icon: 'DASHBOARD',    labelKey: 'mobile_nav.home' },
    { to: '/settings/users',         icon: 'USERS',        labelKey: 'mobile_nav.users' },
    { to: '/settings/audit-logs',    icon: 'SHIELD_CHECK', labelKey: 'mobile_nav.audit' },
    { to: '/notifications', icon: 'BELL',         labelKey: 'mobile_nav.alerts', badge: true },
  ],
  SUPERADMIN: [
    { to: '/dashboard',     icon: 'DASHBOARD',  labelKey: 'mobile_nav.home' },
    { to: '/settings',       icon: 'SETTINGS',   labelKey: 'mobile_nav.config' },
    { to: '/settings/users', icon: 'USERS',      labelKey: 'mobile_nav.users' },
    { to: '/settings/releases', icon: 'ZAP',    labelKey: 'mobile_nav.updates' },
  ],
  DEVELOPER: [
    { to: '/dashboard',  icon: 'DASHBOARD',     labelKey: 'mobile_nav.home' },
    { to: '/settings/api-docs',   icon: 'BOOK_OPEN',     labelKey: 'mobile_nav.api' },
    { to: '/settings/audit-logs', icon: 'SHIELD_CHECK',  labelKey: 'mobile_nav.audit' },
    { to: '/settings/app-store',  icon: 'BAR_CHART_2',   labelKey: 'mobile_nav.apps' },
  ],
  PROJECT_MANAGER: [
    { to: '/dashboard',         icon: 'DASHBOARD',  labelKey: 'mobile_nav.home' },
    { to: '/hr/employees',         icon: 'USERS',      labelKey: 'mobile_nav.team' },
    { to: '/reports',           icon: 'BAR_CHART_2',labelKey: 'mobile_nav.reports' },
    { to: '/reports/insights', icon: 'LIGHTBULB',  labelKey: 'mobile_nav.insights' },
  ],
  CRM: [
    { to: '/dashboard',        icon: 'DASHBOARD',  labelKey: 'mobile_nav.home' },
    { to: '/crm/contacts',     icon: 'CUSTOMER',   labelKey: 'mobile_nav.crm' },
    { to: '/customers/summary', icon: 'COMPANY',    labelKey: 'mobile_nav.clients' },
    { to: '/crm/pipeline',     icon: 'TREND_UP',   labelKey: 'mobile_nav.pipeline' },
  ],
  CLIENT: [
    { to: '/customers/portal', icon: 'CONTACT',    labelKey: 'mobile_nav.portal' },
    { to: '/sales/invoices',      icon: 'INVOICE',    labelKey: 'mobile_nav.invoices' },
    { to: '/notifications', icon: 'BELL',       labelKey: 'mobile_nav.alerts', badge: true },
    { to: '/dashboard',     icon: 'DASHBOARD',  labelKey: 'mobile_nav.home' },
  ],
  PARTNER: [
    { to: '/purchases/orders', icon: 'CLIPBOARD_LIST', labelKey: 'mobile_nav.orders' },
    { to: '/purchases/bills',           icon: 'INVOICE',         labelKey: 'mobile_nav.bills' },
    { to: '/notifications',   icon: 'BELL',            labelKey: 'mobile_nav.alerts', badge: true },
    { to: '/dashboard',       icon: 'DASHBOARD',       labelKey: 'mobile_nav.home' },
  ],
  DATA_CLERK: [
    { to: '/dashboard',     icon: 'DASHBOARD',  labelKey: 'mobile_nav.home' },
    { to: '/sales/invoices',  icon: 'INVOICE',    labelKey: 'mobile_nav.invoices' },
    { to: '/purchases/bills', icon: 'VENDOR',     labelKey: 'mobile_nav.bills' },
    { to: '/items', icon: 'ITEM',       labelKey: 'mobile_nav.items' },
  ],
};

const DEFAULT_NAV: BottomNavItem[] = [
  { to: '/dashboard',     icon: 'DASHBOARD', labelKey: 'mobile_nav.home' },
  { to: '/hr/employees',     icon: 'EMPLOYEE',  labelKey: 'mobile_nav.hr' },
  { to: '/sales/invoices',      icon: 'INVOICE',   labelKey: 'mobile_nav.invoices' },
  { to: '/notifications', icon: 'BELL',      labelKey: 'mobile_nav.alerts', badge: true },
];

// ---------------------------------------------------------------------------
// Quick-create FAB items — phase-aligned per role
// ---------------------------------------------------------------------------
const QUICK_CREATE: Record<string, QuickCreateItem[]> = {
  ovds: [
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',          to: '/sales/invoices?action=new' },
    { labelKey: 'mobile_nav.qc_bill',     icon: 'VENDOR',           to: '/purchases/bills?action=new' },
    { labelKey: 'mobile_nav.qc_vat',      icon: 'SHIELD_CHECK',     to: '/tax/vat' },
    { labelKey: 'mobile_nav.qc_transfer', icon: 'ARROW_LEFT_RIGHT', to: '/banking/transfers?action=new' },
  ],
  ACCOUNTING: [
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',          to: '/sales/invoices?action=new' },
    { labelKey: 'mobile_nav.qc_journal',  icon: 'BOOK_OPEN',        to: '/accounting?action=journal' },
    { labelKey: 'mobile_nav.qc_bill',     icon: 'VENDOR',           to: '/purchases/bills?action=new' },
    { labelKey: 'mobile_nav.qc_transfer', icon: 'ARROW_LEFT_RIGHT', to: '/banking/transfers?action=new' },
  ],
  HR: [
    { labelKey: 'mobile_nav.qc_leave',    icon: 'CALENDAR', to: '/hr/leaves?action=apply' },
    { labelKey: 'mobile_nav.qc_expense',  icon: 'RECEIPT',  to: '/purchases/expenses?action=new' },
    { labelKey: 'mobile_nav.qc_employee', icon: 'EMPLOYEE', to: '/hr/employees?action=add' },
  ],
  ADMIN: [
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',  to: '/sales/invoices?action=new' },
    { labelKey: 'mobile_nav.qc_employee', icon: 'EMPLOYEE', to: '/hr/employees?action=add' },
    { labelKey: 'mobile_nav.qc_expense',  icon: 'RECEIPT',  to: '/purchases/expenses?action=new' },
    { labelKey: 'mobile_nav.qc_journal',  icon: 'BOOK_OPEN',to: '/accounting?action=journal' },
  ],
  EMPLOYEE: [
    { labelKey: 'mobile_nav.qc_leave',   icon: 'CALENDAR', to: '/hr/leaves?action=apply' },
    { labelKey: 'mobile_nav.qc_expense', icon: 'RECEIPT',  to: '/purchases/expenses?action=new' },
  ],
  CRM: [
    { labelKey: 'mobile_nav.qc_customer', icon: 'CUSTOMER', to: '/crm/contacts' },
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',  to: '/sales/invoices?action=new' },
  ],
  AUDITOR: [
    { labelKey: 'mobile_nav.qc_journal', icon: 'BOOK_OPEN',    to: '/accounting?action=journal' },
    { labelKey: 'mobile_nav.qc_etax',    icon: 'SEND',         to: '/tax/etax-declaration' },
  ],
  IFRS_OFFICER: [
    { labelKey: 'mobile_nav.qc_journal', icon: 'BOOK_OPEN',     to: '/accounting?action=journal' },
    { labelKey: 'mobile_nav.qc_etax',    icon: 'SEND',          to: '/tax/etax-declaration' },
  ],
  BANK_LIAISON: [
    { labelKey: 'mobile_nav.qc_transfer', icon: 'ARROW_LEFT_RIGHT', to: '/banking/transfers?action=new' },
    { labelKey: 'mobile_nav.qc_bill',     icon: 'VENDOR',            to: '/purchases/bills?action=new' },
  ],
  SPURADMIN: [
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',  to: '/sales/invoices?action=new' },
    { labelKey: 'mobile_nav.qc_employee', icon: 'EMPLOYEE', to: '/hr/employees?action=add' },
  ],
  SUPERADMIN: [
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',  to: '/sales/invoices?action=new' },
    { labelKey: 'mobile_nav.qc_employee', icon: 'EMPLOYEE', to: '/hr/employees?action=add' },
    { labelKey: 'mobile_nav.qc_journal',  icon: 'BOOK_OPEN',to: '/accounting?action=journal' },
  ],
  PROJECT_MANAGER: [
    { labelKey: 'mobile_nav.qc_project', icon: 'PROJECT', to: '/ovds/projects?action=new' },
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',  to: '/sales/invoices?action=new' },
  ],
  EXTERNAL_AUDITOR: [
    { labelKey: 'mobile_nav.qc_journal', icon: 'BOOK_OPEN',    to: '/accounting?action=journal' },
    { labelKey: 'mobile_nav.qc_etax',    icon: 'SEND',         to: '/tax/etax-declaration' },
  ],
  DATA_CLERK: [
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',  to: '/sales/invoices?action=new' },
    { labelKey: 'mobile_nav.qc_expense',  icon: 'RECEIPT',  to: '/purchases/expenses?action=new' },
  ],
  CLIENT: [
    { labelKey: 'mobile_nav.qc_invoice',  icon: 'INVOICE',  to: '/sales/invoices?action=new' },
  ],
  PARTNER: [
    { labelKey: 'mobile_nav.qc_bill',     icon: 'VENDOR',   to: '/purchases/bills?action=new' },
  ],
};

const DEFAULT_QUICK: QuickCreateItem[] = [
  { labelKey: 'mobile_nav.qc_invoice', icon: 'INVOICE', to: '/sales/invoices?action=new' },
  { labelKey: 'mobile_nav.qc_expense', icon: 'RECEIPT', to: '/purchases/expenses?action=new' },
  { labelKey: 'mobile_nav.qc_bill',    icon: 'VENDOR',  to: '/purchases/bills?action=new' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MobileBottomNav: React.FC = () => {
  const { user, canAccessRoute } = useAuth();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const role = user?.role ?? 'EMPLOYEE';
  const items = (ROLE_NAV[role] ?? DEFAULT_NAV).filter(item => canAccessRoute(item.to));
  const quickItems = (QUICK_CREATE[role] ?? DEFAULT_QUICK).filter(item => canAccessRoute(item.to));
  const [unread, setUnread] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (!user?.employeeId && !user?.companyId) return;
    try {
      const params = new URLSearchParams();
      if (user.employeeId) params.set('employeeId', user.employeeId);
      if (user.companyId)  params.set('companyId',  user.companyId);
      params.set('limit', '20');
      const res = await api.get(`/notifications?${params.toString()}`, {
        headers: { 'x-background': '1' },
      } as any);
      const list: any[] = res.data?.data ?? res.data ?? [];
      setUnread(Array.isArray(list) ? list.filter((n: any) => !n.read && !n.isRead).length : 0);
    } catch { /* silent */ }
  }, [user?.employeeId, user?.companyId]);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);
  useInterval(fetchUnread, user ? 30_000 : null);

  // Close FAB on route change
  useEffect(() => { setFabOpen(false); }, [pathname]);

  const leftItems  = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  return (
    <>
      {/* FAB backdrop */}
      {fabOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[75]"
          style={{ background: 'rgba(5,10,20,0.6)', backdropFilter: 'blur(3px)' }}
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Quick-create stack */}
      {fabOpen && (
        <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-[78] flex flex-col items-center gap-2.5 pb-2">
          {quickItems.map((item, i) => (
            <button
              key={item.labelKey}
              onClick={() => { navigate(item.to); setFabOpen(false); }}
              className="ovds-action-chip text-sm font-semibold active:scale-95 transition-all"
              style={{ animation: `fabItemIn 200ms ${i * 40}ms ease-out both` }}
            >
              <span style={{ color: 'var(--pro-azure-light)' }}>
                <Icon name={item.icon as any} size={16} />
              </span>
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      )}

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[80]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        }}
        aria-label={t('a11y.main_nav')}
      >
        <div className="flex items-stretch h-14 relative">
          {/* Left 2 items */}
          {leftItems.map(item => (
            <NavItem key={item.to + item.labelKey} item={item} pathname={pathname} unread={unread} />
          ))}

          {/* Centre FAB */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setFabOpen(v => !v)}
              aria-label={t('a11y.quick_create')}
              aria-expanded={fabOpen}
              style={{
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 6,
                background: fabOpen
                  ? 'var(--pro-rose)'
                  : 'var(--pro-azure)',
                color: '#fff',
                border: 'none', cursor: 'pointer',
                boxShadow: fabOpen
                  ? '0 4px 14px rgba(231,76,60,0.35)'
                  : '0 4px 14px rgba(79,186,111,0.35)',
                transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), background 160ms, box-shadow 160ms',
              }}
            >
              <Icon name={fabOpen ? 'CLOSE' : 'PLUS'} size={fabOpen ? 18 : 20} />
            </button>
          </div>

          {/* Right 2 items */}
          {rightItems.map(item => (
            <NavItem key={item.to + item.labelKey} item={item} pathname={pathname} unread={unread} />
          ))}
        </div>
      </nav>
    </>
  );
};

// ---------------------------------------------------------------------------
// NavItem sub-component
// ---------------------------------------------------------------------------

const NavItem: React.FC<{
  item: BottomNavItem;
  pathname: string;
  unread: number;
}> = ({ item, pathname, unread }) => {
  const { t } = useTranslation();
  const itemPath = item.to.split('?')[0];
  const isDashboardItem = itemPath === '/dashboard';
  const showBadge = item.badge && unread > 0;

  const cls = ({ isActive }: { isActive: boolean }) =>
    `relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 select-none ${
      isActive ? 'text-pro-azure' : 'text-[var(--text-4)]'
    }`;

  const inner = ({ isActive }: { isActive: boolean }) => (
    <>
      {/* Top active bar */}
      {isActive && (
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 rounded-b-full"
          style={{ height: 2.5, background: 'var(--pro-azure)' }}
        />
      )}

      {/* Icon */}
      <span
        className="relative transition-transform duration-150"
        style={{ transform: isActive ? 'scale(1.12)' : 'scale(1)' }}
      >
        <Icon name={item.icon as any} size={19} />
        {showBadge && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center leading-none"
            style={{
              minWidth: 13, height: 13, padding: '0 2px',
              background: 'var(--pro-rose)', color: '#fff',
              fontSize: 7, fontWeight: 700,
              borderRadius: 99,
              border: '1.5px solid var(--surface)',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: 8, lineHeight: 1, letterSpacing: '0.01em',
          fontWeight: isActive ? 700 : 500,
          color: isActive ? 'var(--pro-azure)' : 'var(--text-4)',
        }}
      >
        {t(item.labelKey)}
      </span>
    </>
  );

  if (isDashboardItem) {
    const isActive = pathname === '/dashboard';
    return (
      <NavLink to={item.to} end className={cls} aria-current={isActive ? 'page' : undefined}>
        {inner}
      </NavLink>
    );
  }

  return (
    <NavLink to={item.to} end className={cls}>
      {inner}
    </NavLink>
  );
};

export default MobileBottomNav;
