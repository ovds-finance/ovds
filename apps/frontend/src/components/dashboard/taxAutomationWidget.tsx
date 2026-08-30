import React from 'react';
import { useTaxAutomationStatus } from '../../services/taxApi';
import { submitToETax } from '@ovds/features/tax';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Card, Btn, Icon, StatusBadge } from '../ui';
import toast from 'react-hot-toast';

export const TaxAutomationWidget: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const { status, loading, refetch } = useTaxAutomationStatus(companyId);

  // Real-time synchronization
  useWebSocket({
    rooms: companyId ? [`company_${companyId}`] : ['dashboard'],
    events: {
      taxUpdate: (data) => {
        refetch(); // Trigger re-fetch when automation happens in backend
        if (data.type === 'VAT_AUTO_SUBMITTED') {
          toast.success(`VAT for ${data.period} auto-submitted to eTax portal!`);
        }
      }
    }
  });

  const handleSubmit = async () => {
    if (!status?.period) return;
    try {
      const filingId = 'current'; // Backend handles finding current for the company if 'current' is passed or use actual ID
      await submitToETax(filingId);
      toast.success('Submitted to eTax Portal successfully');
      refetch();
    } catch (err: any) {
      toast.error('Submission failed: ' + err.message);
    }
  };

  if (loading) return <div>Loading tax automation status...</div>;
  if (!status) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="ZAP" size={16} className="text-violet-500" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tax Automation</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="ovds-caption">Period</span>
          <span className="text-sm font-semibold">{status.period}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="ovds-caption">VAT Status</span>
          <StatusBadge status={status.vatFilingStatus} />
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">VAT Threshold</span>
             <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{status.vatThresholdPct}%</span>
           </div>
           <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
             <div 
               className="bg-emerald-500 h-full transition-all duration-1000" 
               style={{ width: `${status.vatThresholdPct}%` }}
             />
           </div>
           <p className="text-[9px] text-emerald-600 dark:text-emerald-500 mt-1.5">
             Approaching ETB 2M annual revenue limit for mandatory VAT registration.
           </p>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Next Deadlines</p>
          {status.nextDeadlines.slice(0, 2).map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">{d.label}</span>
              <span className={`font-medium ${d.isOverdue ? 'text-rose-500' : 'text-slate-500'}`}>
                {d.isOverdue ? 'OVERDUE' : `${d.daysLeft} days`}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Btn 
            variant="primary" 
            className="w-full" 
            onClick={handleSubmit}
            disabled={status.vatFilingStatus === 'SUBMITTED' || status.vatFilingStatus === 'PAID'}
          >
            <Icon name="SEND" size={14} className="mr-2" />
            Submit to eTax Portal
          </Btn>
        </div>
      </div>
    </Card>
  );
};
