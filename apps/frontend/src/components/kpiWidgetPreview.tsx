import { Banknote, Clock, Users } from 'lucide-react';
import React from 'react';

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
        <div className="w-32 p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/30 rounded-xl border border-[var(--pro-azure-100)] dark:border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <Banknote size={12} className="text-[var(--pro-azure)]" />
            <span className="text-[10px] font-bold text-[var(--pro-azure)] uppercase">Net Pay</span>
          </div>
          <p className="text-lg font-semibold text-[var(--pro-azure-dark)] dark:text-green-300">
            ETB {Math.round(data?.totalNet ?? 0 / 1000)}K
          </p>
          <p className="text-[9px] text-[var(--pro-azure)]">{data?.configured ?? 0} configured</p>
        </div>
      );

    case 'attendance':
      return (
        <div className="w-32 p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/30 rounded-xl border border-[var(--pro-azure-100)] dark:border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={12} className="text-[var(--pro-azure)]" />
            <span className="text-[10px] font-bold text-[var(--pro-azure)] uppercase">Today</span>
          </div>
          <p className="text-lg font-semibold text-[var(--pro-azure-dark)] dark:text-green-300">
            {data?.today ?? 0}
          </p>
          <p className="text-[9px] text-[var(--pro-azure)]">{data?.in ?? 0} in office</p>
        </div>
      );

    case 'whoIsIn':
      return (
        <div className="w-32 p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/30 rounded-xl border border-[var(--pro-azure-100)] dark:border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <Users size={12} className="text-[var(--pro-azure)]" />
            <span className="text-[10px] font-bold text-[var(--pro-azure)] uppercase">Live</span>
          </div>
          <p className="text-lg font-semibold text-[var(--pro-azure-dark)] dark:text-green-300">
            {data?.length ?? 0}
          </p>
          <p className="text-[9px] text-[var(--pro-azure)]">Who is in</p>
        </div>
      );

    default:
      return null;
  }
};

export default KPIWidgetPreview;




