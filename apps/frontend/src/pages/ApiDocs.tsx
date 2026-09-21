import {
  Book,
  ExternalLink,
  Code,
  Database,
  Shield,
  Zap,
  ChevronDown,
  ChevronRight,
  Lock,
  Copy,
  CheckCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { usePageTitle } from '../hooks/usePageTitle';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)]',
  POST: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] border border-[var(--pro-azure-100)]',
  PATCH: 'bg-amber-50 text-amber-700 border border-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 border border-rose-200',
};
const endpointGroups = [
  {
    group: 'Authentication',
    icon: <Lock size={16} />,
    color: 'text-violet-600',
    items: [
      {
        method: 'POST',
        path: '/api/auth/login',
        desc: 'Login and receive JWT access token',
      },
      {
        method: 'POST',
        path: '/api/auth/register',
        desc: 'Register a new system user',
      },
      {
        method: 'POST',
        path: '/api/auth/change-password',
        desc: 'Change authenticated user password',
      },
    ],
  },
  {
    group: 'Employees',
    icon: <Shield size={16} />,
    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    items: [
      {
        method: 'GET',
        path: '/api/employees',
        desc: 'List all employees (paginated, filter by departmentId)',
      },
      { method: 'POST', path: '/api/employees', desc: 'Create a new employee' },
      {
        method: 'GET',
        path: '/api/employees/payroll-status-summary',
        desc: 'Payroll config status: active, not-configured, due-for-increment',
      },
      { method: 'GET', path: '/api/employees/:id', desc: 'Get employee by ID' },
      {
        method: 'PATCH',
        path: '/api/employees/:id',
        desc: 'Update employee details',
      },
      {
        method: 'DELETE',
        path: '/api/employees/:id',
        desc: 'Delete employee record',
      },
    ],
  },
  {
    group: 'Attendance',
    icon: <Zap size={16} />,
    color: 'text-[var(--pro-azure)]',
    items: [
      {
        method: 'POST',
        path: '/api/attendance/check-in',
        desc: 'Biometric check-in',
      },
      {
        method: 'POST',
        path: '/api/attendance/check-out',
        desc: 'Biometric check-out',
      },
      {
        method: 'GET',
        path: '/api/attendance',
        desc: 'List attendance records (paginated)',
      },
      {
        method: 'GET',
        path: '/api/attendance/report',
        desc: 'Daily attendance report',
      },
      {
        method: 'GET',
        path: '/api/attendance/who-is-in',
        desc: 'Currently checked-in employees',
      },
      {
        method: 'GET',
        path: '/api/attendance/reports-summary',
        desc: '7-day attendance stats',
      },
      {
        method: 'PATCH',
        path: '/api/attendance/verify/:id',
        desc: 'Verify an attendance record',
      },
      {
        method: 'DELETE',
        path: '/api/attendance/:id',
        desc: 'Delete attendance record',
      },
    ],
  },
  {
    group: 'Payroll',
    icon: <Database size={16} />,
    color: 'text-amber-600',
    items: [
      {
        method: 'GET',
        path: '/api/payroll',
        desc: 'Payroll summaries (paginated, filter by year/month/dept)',
      },
      {
        method: 'GET',
        path: '/api/payroll/export-csv/:year/:month',
        desc: 'Export payroll as CSV',
      },
      {
        method: 'GET',
        path: '/api/payroll/export-pdf/:year/:month',
        desc: 'Export payroll as PDF',
      },
      {
        method: 'GET',
        path: '/api/payroll/workflow-status',
        desc: 'Get persisted workflow statuses for a month/type',
      },
      {
        method: 'GET',
        path: '/api/payroll/overtime-summary',
        desc: 'Overtime summary for a month (hours, pay, days)',
      },
      {
        method: 'GET',
        path: '/api/payroll/employee-history/:employeeId',
        desc: '12-month payroll history for an employee',
      },
      {
        method: 'GET',
        path: '/api/payroll/dashboard-stats',
        desc: 'Payroll dashboard stats (current/prev month totals)',
      },
      {
        method: 'PATCH',
        path: '/api/payroll/:type/:employeeId',
        desc: 'Advance payroll workflow status for a single employee (type: salary|increment|arrear)',
      },
      {
        method: 'POST',
        path: '/api/payroll/bulk-workflow',
        desc: 'Bulk advance payroll workflow for multiple employees',
      },
      {
        method: 'PATCH',
        path: '/api/payroll/bulk-workflow',
        desc: 'Bulk advance workflow for multiple employees',
      },
      {
        method: 'PATCH',
        path: '/api/payroll/increment/:employeeId',
        desc: 'Advance increment workflow status',
      },
      {
        method: 'PATCH',
        path: '/api/payroll/arrear/:employeeId',
        desc: 'Advance arrear workflow status',
      },
      {
        method: 'GET',
        path: '/api/attendance/reimbursement/rates',
        desc: 'Get per-diem rates for all tiers from system settings',
      },
      {
        method: 'GET',
        path: '/api/attendance/reimbursement/stats',
        desc: 'Reimbursement claim statistics (total, pending, approved, ETB)',
      },
      {
        method: 'GET',
        path: '/api/attendance/reimbursement',
        desc: 'List reimbursement claims (filter by employeeId, status)',
      },
      {
        method: 'POST',
        path: '/api/attendance/reimbursement',
        desc: 'Submit a new field reimbursement claim',
      },
      {
        method: 'GET',
        path: '/api/attendance/reimbursement/:id',
        desc: 'Get a single reimbursement claim',
      },
      {
        method: 'PATCH',
        path: '/api/attendance/reimbursement/:id/status',
        desc: 'Approve or reject a reimbursement claim',
      },
      {
        method: 'PATCH',
        path: '/api/attendance/reimbursement/bulk-status',
        desc: 'Bulk approve or reject multiple claims',
      },
      {
        method: 'DELETE',
        path: '/api/attendance/reimbursement/:id',
        desc: 'Delete a reimbursement claim',
      },
    ],
  },
  {
    group: 'Leaves',
    icon: <Book size={16} />,
    color: 'text-teal-600',
    items: [
      {
        method: 'GET',
        path: '/api/leaves',
        desc: 'List all leave requests (admin)',
      },
      {
        method: 'GET',
        path: '/api/leaves/my-leaves',
        desc: 'Get current user leave requests',
      },
      {
        method: 'GET',
        path: '/api/leaves/balance/:id',
        desc: 'Get leave balance for employee',
      },
      {
        method: 'POST',
        path: '/api/leaves/apply',
        desc: 'Submit a leave request',
      },
      {
        method: 'PATCH',
        path: '/api/leaves/:id/approve',
        desc: 'Approve a leave request',
      },
      {
        method: 'PATCH',
        path: '/api/leaves/:id/reject',
        desc: 'Reject a leave request',
      },
    ],
  },
  {
    group: 'Departments',
    icon: <Code size={16} />,
    color: 'text-[var(--pro-azure)]',
    items: [
      { method: 'GET', path: '/api/departments', desc: 'List all departments' },
      { method: 'POST', path: '/api/departments', desc: 'Create department' },
      {
        method: 'PATCH',
        path: '/api/departments/:id',
        desc: 'Update department',
      },
      {
        method: 'DELETE',
        path: '/api/departments/:id',
        desc: 'Delete department',
      },
    ],
  },
  {
    group: 'Shifts',
    icon: <Zap size={16} />,
    color: 'text-orange-600',
    items: [
      { method: 'GET', path: '/api/shifts', desc: 'List all shifts' },
      { method: 'POST', path: '/api/shifts', desc: 'Create shift' },
      { method: 'PATCH', path: '/api/shifts/:id', desc: 'Update shift' },
      { method: 'DELETE', path: '/api/shifts/:id', desc: 'Delete shift' },
    ],
  },
  {
    group: 'Holidays',
    icon: <Book size={16} />,
    color: 'text-pink-600',
    items: [
      { method: 'GET', path: '/api/holidays', desc: 'List all holidays' },
      { method: 'POST', path: '/api/holidays', desc: 'Create holiday' },
      { method: 'PATCH', path: '/api/holidays/:id', desc: 'Update holiday' },
      { method: 'DELETE', path: '/api/holidays/:id', desc: 'Delete holiday' },
    ],
  },
  {
    group: 'Biometrics',
    icon: <Shield size={16} />,
    color: 'text-cyan-600',
    items: [
      {
        method: 'POST',
        path: '/api/biometrics/register',
        desc: 'Register biometric template',
      },
      {
        method: 'GET',
        path: '/api/biometrics/employee/:id',
        desc: 'Get biometrics for employee',
      },
      {
        method: 'PATCH',
        path: '/api/biometrics/:id',
        desc: 'Update biometric template',
      },
      {
        method: 'DELETE',
        path: '/api/biometrics/:id',
        desc: 'Delete biometric record',
      },
      {
        method: 'POST',
        path: '/api/biometrics/verify',
        desc: 'Verify biometric template',
      },
    ],
  },
  {
    group: 'Notifications',
    icon: <Zap size={16} />,
    color: 'text-rose-600',
    items: [
      {
        method: 'GET',
        path: '/api/notifications',
        desc: 'Get notifications for employee',
      },
      {
        method: 'PUT',
        path: '/api/notifications/:id/read',
        desc: 'Mark notification as read',
      },
      {
        method: 'PUT',
        path: '/api/notifications/mark-all-read/:empId',
        desc: 'Mark all notifications as read for employee',
      },
      {
        method: 'DELETE',
        path: '/api/notifications/:id',
        desc: 'Delete a notification',
      },
      {
        method: 'DELETE',
        path: '/api/notifications/clear/:employeeId',
        desc: 'Clear all notifications for employee',
      },
    ],
  },
  {
    group: 'Settings & Audit',
    icon: <Database size={16} />,
    color: 'text-slate-600',
    items: [
      { method: 'GET', path: '/api/settings', desc: 'Get system settings' },
      { method: 'POST', path: '/api/settings', desc: 'Save system settings' },
      {
        method: 'GET',
        path: '/api/settings/export',
        desc: 'Export full system backup (JSON)',
      },
      {
        method: 'GET',
        path: '/api/dashboard/audit-logs',
        desc: 'Get audit logs (paginated)',
      },
      {
        method: 'GET',
        path: '/api/dashboard/audit-logs/export-csv',
        desc: 'Export audit logs as CSV',
      },
      {
        method: 'GET',
        path: '/api/dashboard/reports-summary',
        desc: 'Dashboard reports summary',
      },
    ],
  },
  {
    group: 'ovds — Invoices & Bills',
    icon: <Code size={16} />,
    color: 'text-[var(--pro-azure)]',
    items: [
      {
        method: 'GET',
        path: '/api/ovds/invoices',
        desc: 'List invoices (paginated, filter by status/date/source)',
      },
      {
        method: 'POST',
        path: '/api/ovds/invoices',
        desc: 'Create an invoice',
      },
      {
        method: 'PATCH',
        path: '/api/ovds/invoices/:id',
        desc: 'Update an invoice',
      },
      {
        method: 'DELETE',
        path: '/api/ovds/invoices/:id',
        desc: 'Delete an invoice (restores stock)',
      },
      {
        method: 'GET',
        path: '/api/ovds/invoices/stats',
        desc: 'Invoice stats with month-over-month trends',
      },
      {
        method: 'POST',
        path: '/api/ovds/invoices/:id/send',
        desc: 'Send a draft invoice (DRAFT → PENDING)',
      },
      {
        method: 'POST',
        path: '/api/ovds/invoices/:id/payments',
        desc: 'Record a payment against an invoice',
      },
      {
        method: 'GET',
        path: '/api/ovds/invoices/:id/payments',
        desc: 'Get payments for an invoice',
      },
      {
        method: 'POST',
        path: '/api/ovds/invoices/:id/credit-note',
        desc: 'Create a credit note for an invoice',
      },
      {
        method: 'POST',
        path: '/api/ovds/invoices/:id/duplicate',
        desc: 'Duplicate an invoice',
      },
      { method: 'GET', path: '/api/ovds/bills', desc: 'List all bills' },
      { method: 'POST', path: '/api/ovds/bills', desc: 'Create a bill' },
      {
        method: 'PATCH',
        path: '/api/ovds/bills/:id',
        desc: 'Update a bill (mark paid/overdue)',
      },
      {
        method: 'DELETE',
        path: '/api/ovds/bills/:id',
        desc: 'Delete a bill',
      },
      { method: 'GET', path: '/api/ovds/items', desc: 'List all items' },
      { method: 'POST', path: '/api/ovds/items', desc: 'Create an item' },
      {
        method: 'PATCH',
        path: '/api/ovds/items/:id',
        desc: 'Update an item (including stock)',
      },
      {
        method: 'DELETE',
        path: '/api/ovds/items/:id',
        desc: 'Delete an item',
      },
      {
        method: 'GET',
        path: '/api/ovds/inventory',
        desc: 'Inventory valuation (FIFO/LIFO/WA)',
      },
    ],
  },
  {
    group: 'ovds — Customers & Vendors',
    icon: <Shield size={16} />,
    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    items: [
      {
        method: 'GET',
        path: '/api/ovds/customers/registry',
        desc: 'List customer registry',
      },
      {
        method: 'POST',
        path: '/api/ovds/customers/registry',
        desc: 'Create customer',
      },
      {
        method: 'PATCH',
        path: '/api/ovds/customers/registry/:id',
        desc: 'Update customer',
      },
      {
        method: 'DELETE',
        path: '/api/ovds/customers/registry/:id',
        desc: 'Delete customer',
      },
      { method: 'GET', path: '/api/ovds/vendors', desc: 'List all vendors' },
      { method: 'POST', path: '/api/ovds/vendors', desc: 'Create a vendor' },
      {
        method: 'PATCH',
        path: '/api/ovds/vendors/:id',
        desc: 'Update a vendor',
      },
      {
        method: 'DELETE',
        path: '/api/ovds/vendors/:id',
        desc: 'Delete a vendor',
      },
      {
        method: 'GET',
        path: '/api/ovds/vendors/:id/bills',
        desc: 'Get bill history for a vendor',
      },
      {
        method: 'GET',
        path: '/api/ovds/companies',
        desc: 'List all companies',
      },
      {
        method: 'POST',
        path: '/api/ovds/companies',
        desc: 'Create a company',
      },
      {
        method: 'PATCH',
        path: '/api/ovds/companies/:id',
        desc: 'Update a company',
      },
      {
        method: 'DELETE',
        path: '/api/ovds/companies/:id',
        desc: 'Delete a company',
      },
    ],
  },
  {
    group: 'ovds — Accounting (GL)',
    icon: <Database size={16} />,
    color: 'text-violet-600',
    items: [
      {
        method: 'GET',
        path: '/api/ovds/accounts',
        desc: 'List all GL accounts',
      },
      {
        method: 'GET',
        path: '/api/ovds/accounts/balances',
        desc: 'All accounts with current GL balance + totals by type',
      },
      {
        method: 'POST',
        path: '/api/ovds/accounts',
        desc: 'Create a GL account',
      },
      {
        method: 'PATCH',
        path: '/api/ovds/accounts/:id',
        desc: 'Update a GL account',
      },
      {
        method: 'POST',
        path: '/api/ovds/accounts/seed',
        desc: 'Seed default Ethiopian chart of accounts (34 accounts)',
      },
      {
        method: 'GET',
        path: '/api/ovds/accounts/:id/ledger',
        desc: 'Account ledger with running balance (filter by date)',
      },
      {
        method: 'GET',
        path: '/api/ovds/journal-entries',
        desc: 'List journal entries (filter by date/search)',
      },
      {
        method: 'POST',
        path: '/api/ovds/journal-entries',
        desc: 'Create a journal entry (checks period lock)',
      },
      {
        method: 'DELETE',
        path: '/api/ovds/journal-entries/:id',
        desc: 'Delete a journal entry',
      },
      {
        method: 'GET',
        path: '/api/ovds/journal-entries/recurring',
        desc: 'List recurring journal entry templates',
      },
      {
        method: 'POST',
        path: '/api/ovds/journal-entries/recurring',
        desc: 'Create a recurring template',
      },
      {
        method: 'POST',
        path: '/api/ovds/journal-entries/recurring/:id/post',
        desc: 'Post a recurring template as a new dated entry',
      },
      {
        method: 'GET',
        path: '/api/ovds/bank-accounts',
        desc: 'List bank accounts',
      },
      {
        method: 'POST',
        path: '/api/ovds/bank-accounts',
        desc: 'Create a bank account',
      },
      {
        method: 'POST',
        path: '/api/ovds/bank-accounts/:id/transactions',
        desc: 'Record a bank transaction',
      },
      {
        method: 'GET',
        path: '/api/ovds/bank-accounts/:id/transactions',
        desc: 'List transactions for a bank account',
      },
      {
        method: 'PATCH',
        path: '/api/ovds/bank-transactions/:id/reconcile',
        desc: 'Mark a bank transaction as reconciled',
      },
      {
        method: 'GET',
        path: '/api/ovds/reconciliation/summary',
        desc: 'Bank reconciliation summary (pending vs reconciled)',
      },
      {
        method: 'GET',
        path: '/api/ovds/periods/locked',
        desc: 'Get list of locked accounting periods',
      },
      {
        method: 'POST',
        path: '/api/ovds/periods/lock',
        desc: 'Lock an accounting period (YYYY-MM)',
      },
      {
        method: 'POST',
        path: '/api/ovds/periods/unlock',
        desc: 'Unlock an accounting period (Admin only)',
      },
    ],
  },
  {
    group: 'ovds — Reports',
    icon: <Zap size={16} />,
    color: 'text-amber-600',
    items: [
      {
        method: 'GET',
        path: '/api/ovds/reports/balance-sheet',
        desc: 'Balance Sheet (assets, liabilities, equity)',
      },
      {
        method: 'GET',
        path: '/api/ovds/reports/profit-loss',
        desc: 'Profit & Loss Statement (income vs expenses)',
      },
      {
        method: 'GET',
        path: '/api/ovds/reports/trial-balance',
        desc: 'Trial Balance (debit/credit totals per account)',
      },
      {
        method: 'GET',
        path: '/api/ovds/reports/ar-aging',
        desc: 'Accounts Receivable Aging (0/30/60/90/90+ days)',
      },
      {
        method: 'GET',
        path: '/api/ovds/reports/ap-aging',
        desc: 'Accounts Payable Aging (0/30/60/90/90+ days)',
      },
      {
        method: 'GET',
        path: '/api/ovds/reports/cash-flow',
        desc: 'Cash Flow Statement (operating/investing/financing)',
      },
      {
        method: 'GET',
        path: '/api/ovds/reports/expense-summary',
        desc: 'Expense summary by category from bills',
      },
      {
        method: 'GET',
        path: '/api/ovds/reports/financial-summary',
        desc: 'Financial health summary (AR, AP, cash, P&L)',
      },
      {
        method: 'GET',
        path: '/api/ovds/reports/health-score',
        desc: 'Financial health score A-F with component breakdown',
      },
    ],
  },
  {
    group: 'ovds — VAT & Disaster Fund',
    icon: <Shield size={16} />,
    color: 'text-rose-600',
    items: [
      {
        method: 'GET',
        path: '/api/vat/filings',
        desc: 'List VAT filings',
      },
      {
        method: 'POST',
        path: '/api/vat/filings/calculate',
        desc: 'Calculate VAT filing for a period (auto-posts GL)',
      },
      {
        method: 'GET',
        path: '/api/vat/summary',
        desc: 'Current month VAT summary',
      },
      {
        method: 'DELETE',
        path: '/api/vat/filings/:id',
        desc: 'Delete a VAT filing',
      },
      {
        method: 'GET',
        path: '/api/disaster-fund/summary',
        desc: 'Fund contribution summary',
      },
      {
        method: 'GET',
        path: '/api/disaster-fund/trends',
        desc: 'Levy totals grouped by period',
      },
      {
        method: 'POST',
        path: '/api/disaster-fund/bulk-remit',
        desc: 'Bulk remit contributions (auto-posts GL)',
      },
      {
        method: 'GET',
        path: '/api/disaster-fund/export-csv',
        desc: 'Export contributions as CSV',
      },
    ],
  },
];
const ApiDocs: React.FC = () => {
  usePageTitle('API Docs');
const { t } = useTranslation();
const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Authentication: true,
    Attendance: true,
  });
const [copiedPath, setCopiedPath] = useState<string | null>(null);
const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };
const expandAll = () => {
    const all: Record<string, boolean> = {};
    endpointGroups.forEach((g) => {
      all[g.group] = true;
    });
    setOpenGroups(all);
  };
const collapseAll = () => setOpenGroups({});
const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
toast.success(t('msg.copied'));
    setTimeout(() => setCopiedPath(null), 2000);
  };
return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Feature cards */}
      <div className="ovds-grid-layout cols-3">
        {[
          {
            icon: <Shield size={24} />,
            title: t('api_docs_page.secure_auth'),
            desc: t('api_docs_page.secure_auth_desc'),
            color: 'bg-violet-50 text-violet-600 border-violet-100',
          },
          {
            icon: <Zap size={24} />,
            title: t('api_docs_page.real_time'),
            desc: t('api_docs_page.real_time_desc'),
            color: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] border-[var(--pro-azure-100)]',
          },
          {
            icon: <Database size={24} />,
            title: t('api_docs_page.prisma_orm'),
            desc: t('api_docs_page.prisma_orm_desc'),
            color: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] border-[var(--pro-azure-100)]',
          },
        ].map((card, i) => (
          <div
            key={i}
            className="dash-stat-cell group p-6"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${card.color} group-hover:scale-110 transition-transform`}
            >
              {card.icon}
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              {card.title}
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Swagger link */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <Book size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t('api_docs_page.title')}</h3>
            <p className="text-white/60 text-sm">
              {t('api_docs_page.subtitle')}
            </p>
          </div>
        </div>
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[var(--pro-azure)] text-white px-5 py-2.5 rounded-xl hover:bg-[var(--pro-azure-dark)] transition-all text-sm font-bold shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30 shrink-0"
        >
          <ExternalLink size={16} />
          {t('api_docs_page.open_swagger')}
        </a>
      </div>

      {/* Endpoint groups */}
      <div className="ovds-widget-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
          <Code size={18} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          <h2 className="text-lg font-bold text-slate-900">
            {t('api_docs_page.core_endpoints')}
          </h2>
          <span className="ml-auto text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {endpointGroups.reduce((a, g) => a + g.items.length, 0)} endpoints
          </span>
          <div className="flex gap-1 ml-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {endpointGroups.map((group) => (
            <div key={group.group}>
              <button
                onClick={() => toggleGroup(group.group)}
                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <span className={group.color}>{group.icon}</span>
                <span className="font-bold text-slate-800 text-sm flex-1">
                  {group.group}
                </span>
                <span className="text-[10px] font-bold text-slate-400 mr-3">
                  {group.items.length} routes
                </span>
                {openGroups[group.group] ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
              </button>

              {openGroups[group.group] && (
                <div className="px-6 pb-4 space-y-2">
                  {group.items.map((item, j) => (
                    <div
                      key={j}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold w-16 text-center shrink-0 ${METHOD_COLORS[item.method] || ''}`}
                      >
                        {item.method}
                      </span>
                      <code className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-mono text-xs flex-1 truncate">
                        {item.path}
                      </code>
                      <span className="text-slate-500 text-xs">
                        {item.desc}
                      </span>
                      <button
                        onClick={() => copyPath(item.path)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy path"
                      >
                        {copiedPath === item.path ? (
                          <CheckCheck size={13} className="text-[var(--pro-azure)]" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );}
export default ApiDocs;













