import { Skeleton } from '@ovds/ui';
import {
  Users,
  Search,
  Download,
  FileDown,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { getLocale } from '../../lib/locale';

interface RecentAttendanceLogsProps {
  filteredLogs: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  exportData: (type: 'csv' | 'pdf') => void;
  handleVerify: (id: string) => void;
  loading: boolean;
}

const RecentAttendanceLogs: React.FC<RecentAttendanceLogsProps> = ({
  filteredLogs: filteredLogsProp,
  searchTerm,
  setSearchTerm,
  exportData,
  handleVerify,
  loading,
}) => {
  const { t, i18n } = useTranslation();
  // Guard: ensure filteredLogs is always an array even if parent passes wrong type
  const filteredLogs = Array.isArray(filteredLogsProp) ? filteredLogsProp : [];

  return (
    <div className="lg:col-span-2 ovds-widget-card shadow-sm overflow-hidden flex flex-col transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30 dark:bg-slate-800/30">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('admin.recent_logs')}
          </h3>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
            {filteredLogs.length} {t('admin.records')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={t('admin.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
            />
          </div>
          <button
            onClick={() => exportData('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-bold"
          >
            <Download size={14} />
            <span className="hidden sm:inline">{t('admin.export_csv')}</span>
          </button>
          <button
            onClick={() => exportData('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl hover:bg-[var(--pro-azure-dark)] transition-all text-xs font-bold shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">{t('admin.export_pdf')}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                {t('admin.table.employee')}
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                {t('admin.table.check_in')}
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                {t('admin.table.status')}
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                {t('admin.table.verification')}
              </th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {loading ? (
              <Skeleton.TableRows cols={5} />
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm font-medium italic"
                >
                  {t('admin.no_logs')}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:scale-110 transition-all">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {log.employee.firstName} {log.employee.lastName}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">
                          {log.employee.employeeId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {new Date(log.checkIn).toLocaleTimeString(
                        getLocale(i18n.language),
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        },
                      )}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      {new Date(log.checkIn).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        log.status === 'LATE'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] border border-[var(--pro-azure-100)]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${log.status === 'LATE' ? 'bg-amber-400' : 'bg-[var(--pro-azure-light)]'}`}
                      ></span>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.verified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--pro-azure-50)] text-[var(--pro-azure)] border border-[var(--pro-azure-100)] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                        <CheckCircle2 size={12} />
                        {t('admin.table.verified')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleVerify(log.id)}
                        className="px-4 py-1.5 bg-[var(--pro-azure-50)]0 dark:bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-[var(--pro-azure-dark)] dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-md shadow-green-200 dark:shadow-slate-200"
                      >
                        {t('admin.table.verify_now')}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentAttendanceLogs;





