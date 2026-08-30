import React, { useState } from 'react';
import {
  X, Calendar, Download, Clock, Mail, CheckCircle, Trash2,
  Plus, RefreshCw, FileText, Banknote, BarChart3, ShieldCheck,
} from 'lucide-react';
import { useLocalStorage } from '../hooks';
import toast from 'react-hot-toast';

interface ScheduledExport {
  id: string;
  name: string;
  reportType: string;
  format: 'csv' | 'pdf';
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  email: string;
  active: boolean;
  lastRun?: string;
  nextRun?: string;
}

const REPORT_TYPES = [
  { key: 'payroll', label: 'Payroll Summary', icon: <Banknote size={14} /> },
  { key: 'invoices', label: 'Invoice Register', icon: <FileText size={14} /> },
  { key: 'bills', label: 'Bills & Expenses', icon: <FileText size={14} /> },
  { key: 'attendance', label: 'Attendance Report', icon: <BarChart3 size={14} /> },
  { key: 'vat', label: 'ERCA VAT Register', icon: <ShieldCheck size={14} /> },
  { key: 'pnl', label: 'P&L Statement', icon: <BarChart3 size={14} /> },
];

function nextRunLabel(s: ScheduledExport): string {
  const now = new Date();
  if (s.frequency === 'daily') {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
    return next.toLocaleDateString();
  }
  if (s.frequency === 'weekly') {
    const next = new Date(now);
    const daysUntil = ((s.dayOfWeek ?? 1) - now.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil);
    return next.toLocaleDateString();
  }
  // monthly
  const next = new Date(now.getFullYear(), now.getMonth() + (now.getDate() >= (s.dayOfMonth ?? 1) ? 1 : 0), s.dayOfMonth ?? 1);
  return next.toLocaleDateString();
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  onClose: () => void;
}

const ScheduledExportModal: React.FC<Props> = ({ onClose }) => {
  const [schedules, setSchedules] = useLocalStorage<ScheduledExport[]>('scheduled_exports', []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<ScheduledExport>>({
    reportType: 'payroll',
    format: 'csv',
    frequency: 'monthly',
    dayOfMonth: 1,
    dayOfWeek: 1,
    email: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.email?.trim()) { toast.error('Email is required'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const report = REPORT_TYPES.find(r => r.key === form.reportType);
    const newSchedule: ScheduledExport = {
      id: `sch_${Date.now()}`,
      name: `${report?.label ?? form.reportType} — ${form.frequency}`,
      reportType: form.reportType!,
      format: form.format!,
      frequency: form.frequency!,
      dayOfMonth: form.dayOfMonth,
      dayOfWeek: form.dayOfWeek,
      email: form.email!,
      active: true,
    };
    setSchedules(prev => [...prev, newSchedule]);
    setShowForm(false);
    setSaving(false);
    toast.success('Export schedule created');
  };

  const toggleActive = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast('Schedule removed');
  };

  const runNow = (s: ScheduledExport) => {
    toast.success(`${s.name} export triggered — will be sent to ${s.email}`);
    setSchedules(prev => prev.map(x => x.id === s.id ? { ...x, lastRun: new Date().toISOString() } : x));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <Calendar size={18} className="text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white flex-1">Scheduled Exports</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Existing schedules */}
          {schedules.length === 0 && !showForm && (
            <div className="py-10 text-center text-slate-400">
              <Calendar size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-semibold">No scheduled exports yet</p>
              <p className="text-xs mt-1">Set up automatic report delivery to your email</p>
            </div>
          )}

          {schedules.map(s => (
            <div key={s.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${s.active ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60'}`}>
              <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                {REPORT_TYPES.find(r => r.key === s.reportType)?.icon ?? <FileText size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Mail size={9} /> {s.email}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={9} /> Next: {nextRunLabel(s)}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ${s.format === 'csv' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {s.format.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => runNow(s)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors" title="Run now">
                  <RefreshCw size={13} />
                </button>
                <button onClick={() => toggleActive(s.id)} className={`p-1.5 rounded-lg transition-colors ${s.active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`} title={s.active ? 'Pause' : 'Resume'}>
                  <CheckCircle size={13} />
                </button>
                <button onClick={() => deleteSchedule(s.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Add form */}
          {showForm && (
            <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-5 space-y-4 animate-in fade-in duration-150">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">New Scheduled Export</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Report Type</label>
                  <select value={form.reportType} onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                    {REPORT_TYPES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Format</label>
                  <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF (Print)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                {form.frequency === 'monthly' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Day of Month</label>
                    <input type="number" min={1} max={28} value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
                  </div>
                )}
                {form.frequency === 'weekly' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Day of Week</label>
                    <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                      {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Delivery Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="ovds@company.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-all disabled:opacity-60">
                  <Download size={13} /> {saving ? 'Saving…' : 'Create Schedule'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="ovds-caption">{schedules.filter(s => s.active).length} active schedules</p>
          <button onClick={() => setShowForm(true)} disabled={showForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-all disabled:opacity-50">
            <Plus size={13} /> New Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduledExportModal;









