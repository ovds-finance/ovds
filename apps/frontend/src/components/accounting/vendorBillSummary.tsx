import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, ChevronDown } from 'lucide-react';
import { fmtDecimal } from '../../utils/fmt';

const fmt = fmtDecimal;

interface VendorBillSummaryProps {
  vendorId: string;
}

const VendorBillSummary: React.FC<VendorBillSummaryProps> = ({ vendorId }) => {
  const [data, setData] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (data) {
      setExpanded((e) => !e);
      return;
    }
    setLoading(true);
    setExpanded(true);
    try {
      const res = await api.get(`/ovds/vendors/${vendorId}/bills`);
      setData(res.data.data || res.data);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-slate-100 pt-3 mt-1">
      <button
        onClick={load}
        className="flex items-center justify-between w-full text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <FileText size={11} />
          {data
            ? `${data.summary.count} bill(s) · ${fmt(data.summary.total)}`
            : 'View Bills'}
        </span>
        <ChevronDown
          size={12}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          {loading && (
            <p className="text-[10px] text-slate-400 animate-pulse">
              Loading...
            </p>
          )}
          {!loading && data?.bills?.length === 0 && (
            <p className="text-[10px] text-slate-400 italic">No bills yet.</p>
          )}
          {!loading &&
            data?.bills?.slice(0, 5).map((b: any) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-700">
                    {b.billNumber}
                  </p>
                  <p className="ovds-caption">
                    {new Date(b.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-700">
                    {fmt(Number(b.total))}
                  </p>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${b.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : b.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          {!loading && data?.summary && (
            <div className="flex justify-between pt-1 text-[10px] font-semibold text-slate-500">
              <span>Paid: {fmt(data.summary.paid)}</span>
              <span className="text-amber-600">
                Pending: {fmt(data.summary.pending)}
              </span>
            </div>
          )}
          {!loading && data?.summary?.count > 5 && (
            <Link
              to="/purchases/bills"
              className="block text-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
            >
              View all {data.summary.count} bills →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorBillSummary;



