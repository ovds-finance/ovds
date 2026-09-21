/**
 * Calendar — Business activity calendar
 * Shows invoices, bills, payroll runs, project deadlines, leaves, and holidays
 * in a monthly grid view with a day-detail side panel.
 * Inspired by ovds's Calendar app logic.
 */
import { AppPage } from '@ovds/ui';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  FileText, Receipt, Users, FolderKanban, CalendarDays,
  Star, DollarSign, RefreshCw, Filter, X, Clock,
  CheckCircle2, AlertTriangle, Circle,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { fmtCurrency } from '../utils/fmt';


const fmt = (n: number) => fmtCurrency(n, 'ETB');

// -- Types ---------------------------------------------------------------------
type EventType = 'invoice' | 'bill' | 'payroll' | 'project' | 'leave' | 'holiday' | 'payment';

interface CalEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;       // YYYY-MM-DD
  amount?: number;
  status?: string;
  color: string;
  icon: React.ReactNode;
}

// -- Event type config ---------------------------------------------------------
const EVENT_CONFIG: Record<EventType, { color: string; bg: string; dot: string; icon: React.ReactNode }> = {
  invoice:  { color: 'text-[var(--pro-azure-dark)] dark:text-green-300',   bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/40 border-[var(--pro-azure-100)] dark:border-green-800',   dot: 'bg-[var(--pro-azure-50)]0',    icon: <FileText size={11} /> },
  bill:     { color: 'text-rose-700 dark:text-rose-300',   bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',   dot: 'bg-rose-500',    icon: <Receipt size={11} /> },
  payroll:  { color: 'text-[var(--pro-azure-dark)] dark:text-green-300', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/40 border-[var(--pro-azure-100)] dark:border-green-800', dot: 'bg-[var(--pro-azure-50)]0', icon: <DollarSign size={11} /> },
  project:  { color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800', dot: 'bg-violet-500', icon: <FolderKanban size={11} /> },
  leave:    { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500',   icon: <Users size={11} /> },
  holiday:  { color: 'text-teal-700 dark:text-teal-300',   bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',   dot: 'bg-teal-500',    icon: <Star size={11} /> },
  payment:  { color: 'text-[var(--pro-azure-dark)] dark:text-green-300', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/40 border-[var(--pro-azure-100)] dark:border-green-800', dot: 'bg-[var(--pro-azure-50)]0', icon: <CheckCircle2 size={11} /> },
};

const FILTER_TYPES: { key: EventType; label: string }[] = [
  { key: 'invoice',  label: 'Invoices' },
  { key: 'bill',     label: 'Bills' },
  { key: 'payroll',  label: 'Payroll' },
  { key: 'project',  label: 'Projects' },
  { key: 'leave',    label: 'Leaves' },
  { key: 'holiday',  label: 'Holidays' },
  { key: 'payment',  label: 'Payments' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// -- Helpers -------------------------------------------------------------------
function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// -- Main Component ------------------------------------------------------------
const Calendar: React.FC = () => {
  usePageTitle('Calendar');
  const { selectedCompanyId } = useBusiness();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(
    new Set(['invoice', 'bill', 'payroll', 'project', 'leave', 'holiday', 'payment'])
  );

  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
  const sep = selectedCompanyId ? '&' : '?';

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const collected: CalEvent[] = [];

    await Promise.allSettled([
      // Invoices due this month
      api.get(`/ovds/invoices${cq}${sep}limit=200`).then((r: any) => {
        const items = r.data?.data?.data ?? r.data?.data ?? r.data ?? [];
        (Array.isArray(items) ? items : []).forEach((inv: any) => {
          const date = inv.dueDate?.slice(0, 10) ?? inv.date?.slice(0, 10);
          if (date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
            collected.push({
              id: `inv-${inv.id}`,
              type: 'invoice',
              title: `Invoice ${inv.invoiceNumber ?? inv.number ?? ''}`,
              date,
              amount: inv.totalAmount ?? inv.amount,
              status: inv.status,
              color: EVENT_CONFIG.invoice.color,
              icon: EVENT_CONFIG.invoice.icon,
            });
          }
        });
      }),

      // Bills due this month
      api.get(`/ovds/bills${cq}${sep}limit=200`).then((r: any) => {
        const items = r.data?.data?.data ?? r.data?.data ?? r.data ?? [];
        (Array.isArray(items) ? items : []).forEach((bill: any) => {
          const date = bill.dueDate?.slice(0, 10) ?? bill.date?.slice(0, 10);
          if (date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
            collected.push({
              id: `bill-${bill.id}`,
              type: 'bill',
              title: `Bill ${bill.billNumber ?? bill.number ?? ''}`,
              date,
              amount: bill.totalAmount ?? bill.amount,
              status: bill.status,
              color: EVENT_CONFIG.bill.color,
              icon: EVENT_CONFIG.bill.icon,
            });
          }
        });
      }),

      // Payroll records (use main payroll list — no /runs endpoint)
      api.get(`/payroll${cq}${sep}limit=50`).then((r: any) => {
        const items = r.data?.data ?? r.data ?? [];
        (Array.isArray(items) ? items : []).forEach((run: any) => {
          const date = run.payDate?.slice(0, 10) ?? run.periodEnd?.slice(0, 10);
          if (date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
            collected.push({
              id: `payroll-${run.id}`,
              type: 'payroll',
              title: `Payroll — ${run.period ?? run.name ?? 'Run'}`,
              date,
              amount: run.totalNet ?? run.totalAmount,
              status: run.status,
              color: EVENT_CONFIG.payroll.color,
              icon: EVENT_CONFIG.payroll.icon,
            });
          }
        });
      }),

      // Projects with deadlines
      api.get(`/projects${cq}${sep}limit=100`).then((r: any) => {
        const items = r.data?.data ?? r.data ?? [];
        (Array.isArray(items) ? items : []).forEach((proj: any) => {
          const date = proj.endDate?.slice(0, 10);
          if (date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
            collected.push({
              id: `proj-${proj.id}`,
              type: 'project',
              title: `📁 ${proj.name}`,
              date,
              status: proj.status,
              color: EVENT_CONFIG.project.color,
              icon: EVENT_CONFIG.project.icon,
            });
          }
        });
      }),

      // Leaves
      api.get(`/leaves${cq}${sep}limit=200`).then((r: any) => {
        const items = r.data?.data ?? r.data ?? [];
        (Array.isArray(items) ? items : []).forEach((leave: any) => {
          const date = leave.startDate?.slice(0, 10);
          if (date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
            collected.push({
              id: `leave-${leave.id}`,
              type: 'leave',
              title: `${leave.employeeName ?? 'Employee'} — ${leave.leaveType ?? 'Leave'}`,
              date,
              status: leave.status,
              color: EVENT_CONFIG.leave.color,
              icon: EVENT_CONFIG.leave.icon,
            });
          }
        });
      }),

      // Holidays
      api.get(`/holidays${cq}${sep}limit=50`).then((r: any) => {
        const items = r.data?.data ?? r.data ?? [];
        (Array.isArray(items) ? items : []).forEach((h: any) => {
          const date = h.date?.slice(0, 10);
          if (date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
            collected.push({
              id: `holiday-${h.id}`,
              type: 'holiday',
              title: h.name ?? 'Holiday',
              date,
              color: EVENT_CONFIG.holiday.color,
              icon: EVENT_CONFIG.holiday.icon,
            });
          }
        });
      }),
    ]);

    setEvents(collected);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, selectedCompanyId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const _goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(toYMD(today));
  };

  const toggleFilter = (type: EventType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredEvents = useMemo(
    () => events.filter(e => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    filteredEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [filteredEvents]);

  const selectedDayEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  // Build calendar grid
  const firstDay = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = toYMD(today);

  return (
    <AppPage
      title={"Calendar"}
      subtitle={"HR leaves · CRM activities · invoices · payroll · tax deadlines · holidays"}
      icon={<CalendarIcon size={18} />}
      iconBg={"bg-sky-500"}
      crumbs={[{ label: 'HR' }, { label: 'Calendar' }]}
    >
      <div className={"space-y-5 pb-10"}>

      {/* -- Calendar content starts here --------------------------------------- */}

      <div className="flex gap-5 items-start">
        {/* -- Main calendar -- */}
        <div className="flex-1 min-w-0 ovds-widget-card overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center ovds-label">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[90px] border-b border-r border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/10" />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDay[dateStr] ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={`min-h-[90px] border-b border-r border-slate-100 dark:border-slate-800 p-1.5 cursor-pointer transition-all ${
                    isSelected ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 ring-2 ring-inset ring-[var(--pro-azure)]' :
                    isToday ? 'bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20' :
                    isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/20' :
                    'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${
                    isToday ? 'bg-[var(--pro-azure-50)]0 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => {
                      const cfg = EVENT_CONFIG[ev.type];
                      return (
                        <div key={ev.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold truncate border ${cfg.bg} ${cfg.color}`}>
                          {ev.icon}
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] font-bold text-slate-400 pl-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* -- Right panel: filters + day detail -- */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Filter legend */}
          <div className="ovds-widget-card p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Filter size={11} /> Filter Events
            </p>
            <div className="space-y-1.5">
              {FILTER_TYPES.map(({ key, label }) => {
                const cfg = EVENT_CONFIG[key];
                const active = activeFilters.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleFilter(key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      active ? `${cfg.bg} ${cfg.color} border` : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${active ? cfg.dot : 'bg-slate-300 dark:bg-slate-600'}`} />
                    {label}
                    {active && (
                      <span className="ml-auto text-[10px]">
                        {events.filter(e => e.type === key).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day detail */}
          {selectedDay && (
            <div className="ovds-widget-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' })}
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <X size={13} />
                </button>
              </div>
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-6 text-center">
                    <CalendarIcon size={24} className="text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No events this day</p>
                  </div>
                ) : (
                  selectedDayEvents.map(ev => {
                    const cfg = EVENT_CONFIG[ev.type];
                    return (
                      <div key={ev.id} className={`p-3 rounded-xl border ${cfg.bg}`}>
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${cfg.color} mb-1`}>
                          {ev.icon}
                          <span className="uppercase tracking-wider text-[10px]">{ev.type}</span>
                        </div>
                        <p className={`text-sm font-bold ${cfg.color} truncate`}>{ev.title}</p>
                        {ev.amount != null && (
                          <p className={`text-xs font-bold mt-0.5 ${cfg.color}`}>{fmt(ev.amount)}</p>
                        )}
                        {ev.status && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase">
                            {ev.status}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Monthly summary */}
          <div className="ovds-widget-card p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">This Month</p>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}</div>
            ) : (
              <div className="space-y-2">
                {FILTER_TYPES.map(({ key, label }) => {
                  const count = events.filter(e => e.type === key).length;
                  if (count === 0) return null;
                  const cfg = EVENT_CONFIG[key];
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {label}
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{count}</span>
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No events this month</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AppPage>
  );
};
export default Calendar;

