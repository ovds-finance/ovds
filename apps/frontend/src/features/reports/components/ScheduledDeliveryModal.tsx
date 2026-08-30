import React, { useState } from 'react';
import { AppPage, Btn } from '@ovds/ui';
import {
  Calendar, Mail, Plus, Trash2, CheckCircle, PauseCircle, PlayCircle,
} from 'lucide-react';
import { useLocalStorage } from '../../../hooks';
import { ALL_TEMPLATES } from '../reportRegistry';
import type { ScheduleEntry, ExportFormat, ScheduleFrequency } from '../types';
import toast from 'react-hot-toast';

interface Props {
  onBack: () => void;
}

const REPORT_OPTIONS: { value: string; label: string; icon: React.ReactNode }[] = ALL_TEMPLATES.map((t) => ({
  value: t.id,
  label: t.title,
  icon: <Calendar size={14} />,
}));

function nextRun(s: ScheduleEntry): string | undefined {
  if (!s.frequency) return undefined;
  const now = new Date();
  let next: Date;
  if (s.frequency === 'weekly') {
    next = new Date(now);
    const daysUntil = ((s.dayOfWeek ?? 1) - now.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil);
  } else if (s.frequency === 'yearly') {
    next = new Date(now.getFullYear() + 1, (s.dayOfMonth ?? 1) - 1, 1);
  } else {
    next = new Date(now.getFullYear(), now.getMonth() + (now.getDate() >= (s.dayOfMonth ?? 1) ? 1 : 0), s.dayOfMonth ?? 1);
  }
  return next.toISOString();
}

const FREQ_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function ScheduledDeliveryModal({ onBack }: Props) {
  const [schedules, setSchedules] = useLocalStorage<ScheduleEntry[]>('reports_module_schedules', []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<ScheduleEntry>>({
    reportId: ALL_TEMPLATES[0].id,
    format: 'pdf',
    frequency: 'monthly',
    dayOfMonth: 1,
    active: true,
  });

  const toggleActive = (id: string) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  };
  const remove = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast('Schedule removed');
  };
  const runNow = (s: ScheduleEntry) => {
    toast.success(`${labelFor(s.reportId)} export triggered — sent to ${s.email}`);
    setSchedules((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, lastRun: new Date().toISOString() } : x)),
    );
  };

  function labelFor(id: string): string {
    return REPORT_OPTIONS.find((r) => r.value === id)?.label ?? id;
  }

  const save = () => {
    if (!form.email || !form.reportId) {
      toast.error('Report and email are required');
      return;
    }
    const entry: ScheduleEntry = {
      id: `sch_${Date.now()}`,
      name: labelFor(form.reportId!),
      reportId: form.reportId!,
      format: form.format!,
      frequency: form.frequency!,
      dayOfMonth: form.dayOfMonth,
      dayOfWeek: form.dayOfWeek,
      email: form.email!,
      active: form.active ?? true,
    };
    setSchedules((prev) => [entry, ...prev]);
    setShowForm(false);
    toast.success('Schedule created');
  };

  return (
    <AppPage
      title="Scheduled Exports"
      subtitle="Schedule reports to be generated and emailed automatically on a recurring basis."
      icon={<Calendar size={16} className="text-white" />}
      iconBg="bg-emerald-600"
      crumbs={[
        { label: 'Reports', to: '/reports-dashboard' },
        { label: 'Scheduled Exports' },
      ]}
      actions={
        <>
          <Btn size="xs" variant="ghost" onClick={onBack}>← Back</Btn>
          <Btn size="xs" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : <><Plus size={13} className="mr-1" /> New schedule</>}
          </Btn>
        </>
      }
    >
      <div className="max-w-3xl mx-auto">
        {showForm && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">New schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Report</label>
                <select
                  value={form.reportId}
                  onChange={(e) => setForm({ ...form, reportId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                >
                  {REPORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Format</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value as ExportFormat })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">XLSX</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value as ScheduleFrequency })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                >
                  {FREQ_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Day of month</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.dayOfMonth ?? 1}
                  onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Recipient email</label>
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="accountant@example.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Btn size="xs" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn size="xs" onClick={save}>Save schedule</Btn>
            </div>
          </div>
        )}

        {schedules.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No scheduled exports</p>
            <p className="text-xs mt-1">Create a schedule to automatically email reports.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => {
              const nr = nextRun(s);
              const nrDate = nr ? new Date(nr).toLocaleDateString() : '—';
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle size={16} className={s.active ? 'text-emerald-500' : 'text-slate-400'} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {s.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {REPORT_OPTIONS.find((r) => r.value === s.reportId)?.label} · {s.format.toUpperCase()} · {s.frequency}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        <Mail size={10} className="inline mr-1" />{s.email} | Next: {nrDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Btn size="xs" variant="ghost" onClick={() => runNow(s)}>Run now</Btn>
                    <Btn size="xs" variant="ghost" onClick={() => toggleActive(s.id)}>
                      {s.active ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                    </Btn>
                    <Btn size="xs" variant="ghost" onClick={() => remove(s.id)}>
                      <Trash2 size={14} className="text-rose-500" />
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppPage>
  );
}
