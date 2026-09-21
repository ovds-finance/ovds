import {
  Skeleton, StatusBadge, GridStatBar, GridSection,
  WidgetCard, DocStackLayout, type DocStackItem,
} from '@ovds/ui';
import {
  Bell, CheckCircle2, Zap, CalendarDays, ArrowRight,
  UserCheck, AlertCircle, Palmtree, ChevronRight,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useRelativeTime } from '../../hooks';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';



interface EmployeeDashboardProps {
  user: { username?: string; employeeId?: string };
}

const NotifTime: React.FC<{ date: string }> = ({ date }) => {
  const label = useRelativeTime(date);
  return <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>;
};

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  usePageTitle('My Dashboard');
  const [balance, setBalance] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.username?.split(' ')[0] ?? user.username ?? 'there';

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          user.employeeId
            ? api.get(`/notifications?employeeId=${user.employeeId}`)
            : Promise.resolve({ data: { data: [] } }),
          api.get('/hr/leaves/my-leaves'),
          user.employeeId
            ? api.get(`/hr/leaves/balance/${user.employeeId}`)
            : Promise.resolve({ data: { data: null } }),
          user.employeeId
            ? api.get(`/hr/attendance/employee/${user.employeeId}`)
            : Promise.resolve({ data: { data: [] } }),
          user.employeeId
            ? api.get(`/payroll?employeeId=${user.employeeId}&take=3`)
            : Promise.resolve({ data: { data: { data: [] } } }),
          user.employeeId
            ? api.get(`/ovds/expenses?submittedBy=${user.username ?? ''}&take=3`).catch(() => ({ data: { data: [] } }))
            : Promise.resolve({ data: { data: [] } }),
        ]);
        if (results[0].status === 'fulfilled') setNotifications(results[0].value.data.data || []);
        if (results[1].status === 'fulfilled') setMyLeaves(results[1].value.data.data || []);
        if (results[2].status === 'fulfilled') setBalance(results[2].value.data.data);
        if (results[3].status === 'fulfilled') {
          const logs = results[3].value.data.data || [];
          const today = new Date().toDateString();
          const todayLog = logs.find((l: any) => new Date(l.checkIn).toDateString() === today);
          setAttendance(todayLog || null);
        }
        if (results[4].status === 'fulfilled') {
          const raw = results[4].value.data?.data?.data ?? results[4].value.data?.data ?? [];
          setPayslips(Array.isArray(raw) ? raw.slice(0, 3) : []);
        }
        if (results[5].status === 'fulfilled') {
          const raw = results[5].value.data?.data?.data ?? results[5].value.data?.data ?? [];
          setExpenses(Array.isArray(raw) ? raw.slice(0, 3) : []);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [user.employeeId, user.username]);

  const unread = notifications.filter((n) => !n.isRead).length;
  const pendingLeaves = myLeaves.filter((l) => l.status === 'PENDING').length;
  const approvedLeaves = myLeaves.filter((l) => l.status === 'APPROVED').length;
  const recentNotifs = notifications.slice(0, 5);
  const leaveUsedPct = balance?.entitlement > 0
    ? Math.min(100, Math.round((balance.used / balance.entitlement) * 100))
    : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-[var(--pro-azure)] via-[var(--pro-azure)] to-[var(--pro-azure-dark)] rounded-xl p-5 text-white overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-0.5">
              {greeting}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">{firstName}</h2>
            <p className="text-xs text-white/50 mt-1">
              Employee Self-Service · ovds · {monthName}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Today's attendance status */}
            {!loading && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
                attendance
                  ? attendance.checkOut
                    ? 'bg-slate-500/20 border-slate-400/30 text-slate-200'
                    : 'bg-[var(--pro-azure-50)]0/20 border-[var(--pro-azure)]/30 text-green-200'
                  : 'bg-amber-500/20 border-amber-400/30 text-amber-200'
              }`}>
                {attendance ? (
                  attendance.checkOut ? (
                    <><UserCheck size={13} /> Checked out</>
                  ) : (
                    <><span className="w-1.5 h-1.5 bg-[var(--pro-azure-light)] rounded-full animate-pulse" /> Checked in</>
                  )
                ) : (
                  <><AlertCircle size={13} /> Not checked in</>
                )}
              </div>
            )}
            {unread > 0 && (
              <Link
                to="/notifications"
                className="flex items-center gap-2 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold transition-all"
              >
                <Bell size={13} />
                {unread} unread
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI stat bar — borderless, shares one card background */}
      <GridStatBar
        cells={[
          {
            label: 'Unread Notifications',
            value: loading ? '…' : unread.toString(),
            sub: unread > 0 ? `${unread} new` : 'All caught up',
            accentCls: unread > 0 ? 'bg-sky-500' : 'bg-slate-200',
            onClick: () => window.location.assign('/notifications'),
          },
          {
            label: 'Leave Balance',
            value: loading ? '…' : (balance ? `${balance.remaining}d` : 'N/A'),
            sub: balance ? `of ${balance.entitlement}d entitlement` : 'No data',
            accentCls: leaveUsedPct > 80 ? 'bg-rose-500' : 'bg-[var(--pro-azure-50)]0',
            onClick: () => window.location.assign('/hr/leaves'),
          },
          {
            label: 'Pending Leaves',
            value: loading ? '…' : pendingLeaves.toString(),
            sub: 'awaiting approval',
            accentCls: pendingLeaves > 0 ? 'bg-amber-400' : 'bg-slate-200',
            onClick: () => window.location.assign('/hr/leaves'),
          },
          {
            label: 'Approved Leaves',
            value: loading ? '…' : approvedLeaves.toString(),
            sub: 'this period',
            accentCls: 'bg-violet-500',
            onClick: () => window.location.assign('/hr/leaves'),
          },
        ]}
      />

      <GridSection
        title="My Workspace"
        icon={<Zap size={14} className="text-amber-500" />}
        spacing="sm"
      >
        <div className="ovds-grid-layout cols-2">
          {/* Quick actions + leave balance */}
          <WidgetCard
            header={
              <span className="flex items-center gap-2 ovds-card-title">
                <Zap size={14} className="text-amber-500" /> Quick Actions
              </span>
            }
          >
            <div className="space-y-2">
              {[
                { label: 'Request Leave',       to: '/hr/leaves',        icon: <Palmtree size={15} />,    color: 'bg-[var(--pro-azure-50)]0' },
                { label: 'View Notifications',  to: '/notifications', icon: <Bell size={15} />,        color: 'bg-violet-600' },
                { label: 'Public Holidays',     to: '/hr/holidays',      icon: <CalendarDays size={15} />, color: 'bg-[var(--pro-azure-50)]0' },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[var(--pro-azure-100)] dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                >
                  <div className={`w-8 h-8 ${a.color} text-white rounded-lg flex items-center justify-center shrink-0`}>
                    {a.icon}
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 flex-1">{a.label}</span>
                  <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-[var(--pro-azure)] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>

            {/* Leave balance mini-stat */}
            {balance && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Leave Balance — {monthName}</p>
                <div className="ovds-stat-row" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
                  {[
                    { label: 'Entitlement', value: balance.entitlement ?? 0 },
                    { label: 'Used',        value: balance.used ?? 0 },
                    { label: 'Remaining',   value: balance.remaining ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="ovds-kpi-cell text-center">
                      <p className="ovds-label mb-1">{item.label}</p>
                      <p className="text-[18px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between ovds-caption mb-1">
                    <span>Leave used</span>
                    <span className={leaveUsedPct > 80 ? 'text-rose-500 font-bold' : ''}>{leaveUsedPct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${leaveUsedPct > 80 ? 'bg-rose-500' : leaveUsedPct > 50 ? 'bg-amber-500' : 'bg-gradient-to-r from-green-500 to-green-600'}`}
                      style={{ width: `${leaveUsedPct}%` }}
                    />
                  </div>
                  {leaveUsedPct > 80 && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle size={10} /> Low balance — use wisely
                    </p>
                  )}
                </div>
              </div>
            )}
          </WidgetCard>

          {/* Recent notifications */}
          <WidgetCard
            header={
              <div className="flex items-center gap-2 w-full">
                <span className="flex items-center gap-2 ovds-card-title flex-1">
                  <Bell size={14} className="text-[var(--pro-azure)]" /> Recent Notifications
                </span>
                {unread > 0 && (
                  <span className="px-2 py-0.5 bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] text-[10px] font-bold rounded-full">
                    {unread} new
                  </span>
                )}
              </div>
            }
          >
            {loading ? (
              <div className="space-y-2 py-1"><Skeleton.Text lines={4} /></div>
            ) : recentNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300 dark:text-slate-600">
                <Bell size={28} className="mb-2 opacity-30" />
                <p className="text-[12px] text-slate-400">No notifications yet.</p>
              </div>
            ) : (
              <div>
                {recentNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 ${!n.isRead ? '' : 'opacity-60'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${!n.isRead ? 'bg-[var(--pro-azure-50)]0 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">{n.title}</p>
                      {n.message && <p className="ovds-caption mt-0.5 line-clamp-1">{n.message}</p>}
                      <NotifTime date={n.createdAt} />
                    </div>
                  </div>
                ))}
                {notifications.length > 5 && (
                  <Link to="/notifications" className="flex items-center gap-1 mt-2 text-[11px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
                    View all {notifications.length} <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            )}
          </WidgetCard>
        </div>
      </GridSection>

      {/* My leave requests — doc-stack layout */}
      {myLeaves.length > 0 && (
        <GridSection
          title="My Leave Requests"
          icon={<CalendarDays size={14} className="text-[var(--pro-azure)]" />}
          action={
            <Link to="/hr/leaves" className="text-[11px] font-bold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          }
          spacing="sm"
        >
          <DocStackLayout
            items={myLeaves.slice(0, 5).map((l: any): DocStackItem => ({
              id: l.id,
              title: (l.type ?? 'Leave').toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase()),
              subtitle: `${new Date(l.startDate).toLocaleDateString()} – ${new Date(l.endDate).toLocaleDateString()}`,
              status: (l.status ?? 'pending').toLowerCase(),
              badge: l.status,
              badgeCls: l.status === 'APPROVED'
                ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'
                : l.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700',
            }))}
            emptyLabel="No leave requests"
          />
        </GridSection>
      )}

      {/* Recent payslips + expense claims */}
      <GridSection
        title="Payslips & Expenses"
        icon={<CheckCircle2 size={14} className="text-[var(--pro-azure)]" />}
        spacing="sm"
      >
        <div className="ovds-grid-layout cols-2">
          {/* Payslips */}
          <WidgetCard
            header={
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-2 ovds-card-title">
                  <CheckCircle2 size={14} className="text-[var(--pro-azure)]" /> Recent Payslips
                </span>
                <Link to="/hr/payroll" className="text-[11px] font-bold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
                  View all <ArrowRight size={11} />
                </Link>
              </div>
            }
          >
            {loading ? (
              <div className="space-y-2"><Skeleton.Text lines={3} /></div>
            ) : payslips.length === 0 ? (
              <p className="ovds-body text-center py-6">No payslips yet</p>
            ) : (
              <div className="space-y-2">
                {payslips.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                        {new Date(p.year ?? Date.now(), (p.month ?? 1) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="ovds-caption mt-0.5">{p.status ?? 'Generated'}</p>
                    </div>
                    <p className="text-[12px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] tabular-nums">
                      ETB {Number(p.netPay ?? p.calculatedSalary ?? 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </WidgetCard>

          {/* Expense claims */}
          <WidgetCard
            header={
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-2 ovds-card-title">
                  <AlertCircle size={14} className="text-amber-500" /> Expense Claims
                </span>
                <Link to="/purchases/expenses?action=new" className="text-[11px] font-bold text-[var(--pro-azure)] hover:underline flex items-center gap-1">
                  New claim <ArrowRight size={11} />
                </Link>
              </div>
            }
          >
            {loading ? (
              <div className="space-y-2"><Skeleton.Text lines={3} /></div>
            ) : expenses.length === 0 ? (
              <div className="ovds-empty !py-8">
                <p className="ovds-body mb-3">No expense claims yet</p>
                <Link to="/purchases/expenses?action=new" className="ovds-btn-primary">
                  Submit a claim
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="min-w-0 mr-3">
                      <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 truncate">{e.title ?? e.description ?? 'Expense'}</p>
                      <p className="ovds-caption mt-0.5">{e.category?.replace(/_/g, ' ') ?? ''} · {new Date(e.submittedAt ?? e.createdAt ?? Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 tabular-nums">ETB {Number(e.amount ?? 0).toLocaleString()}</p>
                      <StatusBadge status={e.status ?? 'PENDING'} dot size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WidgetCard>
        </div>
      </GridSection>
    </div>
  );
};

export default EmployeeDashboard;









