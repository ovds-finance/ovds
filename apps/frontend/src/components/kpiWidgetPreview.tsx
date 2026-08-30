import React from 'react';
import { Banknote, Clock, Users } from 'lucide-react';

interface KPIPreviewProps {
  type: 'payroll' | 'attendance' | 'whoIsIn';
  data: any;
  loading?: boolean;
}

const KPIWidgetPreview: React.FC<KPIPreviewProps> = ({ type, data, loading }) => {
  if (loading) {
    return (
      <div className="w-32 h-20 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
    );
  }

  switch (type) {
    case 'payroll':
      return (
        <div className="w-32 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
          <div className="flex items-center gap-2 mb-1">
            <Banknote size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Net Pay</span>
          </div>
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
            ETB {Math.round(data?.totalNet ?? 0 / 1000)}K
          </p>
          <p className="text-[9px] text-emerald-500">{data?.configured ?? 0} configured</p>
        </div>
      );

    case 'attendance':
      return (
        <div className="w-32 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Today</span>
          </div>
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
            {data?.today ?? 0}
          </p>
          <p className="text-[9px] text-emerald-500">{data?.in ?? 0} in office</p>
        </div>
      );

    case 'whoIsIn':
      return (
        <div className="w-32 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900">
          <div className="flex items-center gap-2 mb-1">
            <Users size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
          </div>
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
            {data?.length ?? 0}
          </p>
          <p className="text-[9px] text-emerald-500">Who is in</p>
        </div>
      );

    default:
      return null;
  }
};

export default KPIWidgetPreview;




