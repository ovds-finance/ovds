import { Scale, X } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { confirm } from '../../utils/confirm';

const PeriodManager: React.FC = () => {
  const [locked, setLocked] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLocked = useCallback(async () => {
    try {
      const res = await api.get('/ovds/periods/locked');
      setLocked(res.data.data || res.data || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchLocked();
  }, [fetchLocked]);

  const lock = async () => {
    if (!input.match(/^\d{4}-\d{2}$/)) {
      toast.error('Format: YYYY-MM (e.g. 2026-03)');
      return;
    }
    setLoading(true);
    try {
      await api.post('/ovds/periods/lock', { period: input });
      toast.success(`Period ${input} locked`);
      setInput('');
      fetchLocked();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const unlock = async (period: string) => {
    if (
      !(await confirm({
        title: `Unlock ${period}?`,
        message: 'Entries can be posted to this period again.',
        variant: 'info',
        confirmLabel: 'Unlock',
      }))
    )
      return;
    try {
      await api.post('/ovds/periods/unlock', { period });
      toast.success(`Period ${period} unlocked`);
      fetchLocked();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // Generate last 12 months for quick-lock
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  return (
    <div className="ovds-widget-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-800 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
          <Scale size={16} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">Period Management</p>
          <p className="ovds-caption">
            Lock closed periods to prevent accidental journal entries
          </p>
        </div>
      </div>

      {/* Lock a period */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Period (YYYY-MM)
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 2026-03"
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>
        <button
          onClick={lock}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 dark:bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-teal-500-dark dark:hover:bg-slate-700 disabled:opacity-50"
        >
          Lock Period
        </button>
      </div>

      {/* Quick lock buttons */}
      <div className="flex flex-wrap gap-2">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setInput(m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${locked.includes(m) ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {locked.includes(m) ? '🔒 ' : ''}
            {m}
          </button>
        ))}
      </div>

      {/* Locked periods list */}
      {locked.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Locked Periods ({locked.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {locked.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl"
              >
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">🔒 {p}</span>
                <button
                  onClick={() => unlock(p)}
                  className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {locked.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          No periods locked. Lock completed months to protect historical data.
        </p>
      )}
    </div>
  );
};

export default PeriodManager;






