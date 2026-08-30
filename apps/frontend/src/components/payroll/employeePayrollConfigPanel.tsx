import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, CheckCircle, AlertTriangle, Clock, UserX, ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../rbac/AuthContext';

type PayrollStatus = 'ACTIVE' | 'FLAGGED' | 'NOT_CONFIGURED' | 'RETIRED';

const STATUS_CONFIG: Record<PayrollStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE:          { label: 'Payroll Active',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: <CheckCircle size={12} /> },
  FLAGGED:         { label: 'Flagged/Debarred',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   icon: <AlertTriangle size={12} /> },
  NOT_CONFIGURED:  { label: 'Not Configured',      color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',       icon: <Clock size={12} /> },
  RETIRED:         { label: 'Retired',             color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',        icon: <UserX size={12} /> },
};

interface EmployeePayrollRecord {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department?: string;
  designation?: string;
  payrollStatus: PayrollStatus;
  basicSalary?: number;
  payCommission?: string;
  salaryStructured: boolean;
  pensionExempt?: boolean;
  flagReason?: string;
}

const EmployeePayrollConfigPanel: React.FC = () => {
  const { can } = useAuth();
  const canWrite = can('payroll:admin');

  const [activeTab, setActiveTab] = useState<PayrollStatus>('ACTIVE');
  const [employees, setEmployees] = useState<EmployeePayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<EmployeePayrollRecord | null>(null);
  const [empEntries, setEmpEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/employee-config', { params: { status: activeTab } });
      const _emp = res.data?.data; setEmployees(Array.isArray(_emp) ? _emp : []);
    } catch { setEmployees([]); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const fetchEntries = async (emp: EmployeePayrollRecord) => {
    setSelectedEmp(emp);
    setLoadingEntries(true);
    try {
      const res = await api.get(`/payroll/employee-config/${emp.id}/entries`);
      const _entries = res.data?.data; setEmpEntries(Array.isArray(_entries) ? _entries : []);
    } catch { setEmpEntries([]); }
    finally { setLoadingEntries(false); }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.patch(`/payroll/employee-config/${id}/activate`);
      toast.success('Employee payroll activated');
      fetchEmployees();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const handleTogglePensionExempt = async (emp: EmployeePayrollRecord) => {
    try {
      await api.patch(`/payroll/employee-config/${emp.id}/pension-exempt`, {
        pensionExempt: !emp.pensionExempt,
      });
      toast.success(
        emp.pensionExempt
          ? 'Employee re-enrolled in pension scheme'
          : 'Marked as pension-exempt (non-local / expatriate)',
      );
      fetchEmployees();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return !q || `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(q) || (e.department ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit flex-wrap">
        {(Object.keys(STATUS_CONFIG) as PayrollStatus[]).map(status => {
          const cfg = STATUS_CONFIG[status];
          return (
            <button key={status} onClick={() => { setActiveTab(status); setSelectedEmp(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === status ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {cfg.icon} {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-5">
        {/* Employee list */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…"
              className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400" />
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {['Employee', 'Dept', 'Basic Salary', 'Pay Commission', 'Structured', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-3 py-2.5"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No employees in this category</td></tr>
                ) : (
                  filtered.map(emp => (
                    <tr key={emp.id}
                      className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${selectedEmp?.id === emp.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                      onClick={() => fetchEntries(emp)}>
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-800 dark:text-white">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{emp.employeeId}</p>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{emp.department ?? '—'}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        {emp.basicSalary ? `ETB ${emp.basicSalary.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{emp.payCommission ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        {emp.salaryStructured
                          ? <CheckCircle size={13} className="text-emerald-500" />
                          : <AlertTriangle size={13} className="text-amber-400" />}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          {activeTab === 'FLAGGED' && canWrite && (
                            <button onClick={e => { e.stopPropagation(); handleActivate(emp.id); }}
                              className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-emerald-200 transition-colors">
                              Activate
                            </button>
                          )}
                          <ChevronRight size={13} className="text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee detail panel */}
        {selectedEmp && (
          <div className="w-72 shrink-0 space-y-3">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payroll Entries</p>
                <p className="text-[10px] text-slate-400 font-mono">{selectedEmp.employeeId}</p>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">{selectedEmp.firstName} {selectedEmp.lastName}</p>
              <p className="text-xs text-slate-400 mb-3">{selectedEmp.department} · {selectedEmp.designation}</p>

              {/* Pension (non-local / expatriate) exemption */}
              <div className="mb-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Pension Scheme</p>
                    <p className={`text-xs font-semibold ${selectedEmp.pensionExempt ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {selectedEmp.pensionExempt ? 'Exempt — Non-local / Expatriate' : 'Enrolled (7% / 11%)'}
                    </p>
                  </div>
                  {canWrite && (
                    <button
                      onClick={() => handleTogglePensionExempt(selectedEmp)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${selectedEmp.pensionExempt ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200'}`}>
                      {selectedEmp.pensionExempt ? 'Re-enroll' : 'Mark Exempt'}
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Non-resident workers are not enrolled in the Ethiopian private pension scheme (Proc. 1268/2023).</p>
              </div>

              {selectedEmp.flagReason && (
                <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Flag Reason</p>
                  <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">{selectedEmp.flagReason}</p>
                </div>
              )}

              {loadingEntries ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}
                </div>
              ) : empEntries.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No payroll entries configured</p>
              ) : (
                <div className="space-y-1.5">
                  {empEntries.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                      <div>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{entry.name ?? entry.headName}</p>
                        <p className="ovds-caption">{entry.type ?? entry.entryType}</p>
                      </div>
                      <p className={`text-[11px] font-semibold ${entry.type === 'DEDUCTION' ? 'text-rose-500' : 'text-emerald-600'}`}>
                        ETB {Number(entry.amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePayrollConfigPanel;








