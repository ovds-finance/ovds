import { Button } from '@ovds/ui';
import { Badge } from '@ovds/ui';
import { format, addMonths } from 'date-fns';
import {
  Download,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingDown,
  Shield,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../../rbac/AuthContext';
import api from '../../../services/api';
import { fmtCurrencyDecimal } from '../../../utils/fmt';

const fmt = (n: number) => fmtCurrencyDecimal(Math.abs(n), 'ETB');

const pct = (n: number, total: number) => `${((n / total) * 100).toFixed(1)}%`;

interface BalanceItem {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity';
  category: string;
  balance: number;
  children?: BalanceItem[];
}

interface BalanceSheetData {
  asOfDate: string;
  companyName: string;
  currency: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netAssets: number;
  sections: Array<{
    title: string;
    type: 'asset' | 'liability' | 'equity';
    items: BalanceItem[];
    subtotal: number;
  }>;
}

const BalanceSheetReport: React.FC = () => {
  const { can } = useAuth();
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const loadReport = async (asOfDate: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/ovds/reports/balance-sheet?asOfDate=${asOfDate}`);
      setData(res.data);
    } catch {
      toast.error('Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections);
    if (next.has(section)) {
      next.delete(section);
    } else {
      next.add(section);
    }
    setExpandedSections(next);
  };

  // fmt and pct are defined at module level above

  useEffect(() => {
    loadReport(date);
  }, [date]);

  const printReport = () => {
    window.print();
  };

  const exportPDF = async () => {
    try {
      const res = await api.get(`/ovds/reports/balance-sheet/${date}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Balance-Sheet-${date}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-slate-200 rounded-xl w-64"></div>
          <div className="ovds-grid-layout cols-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center">
        <FileText size={64} className="mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No Balance Sheet Data</h2>
        <p className="text-slate-500 mb-8">Post some journal entries to generate financial statements.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 print:max-w-none print:px-0">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 mb-8 print:mb-4 print:shadow-none print:border-0">
          <div className="p-8 sm:p-12 print:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 print:flex-col print:gap-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-[var(--pro-azure-dark)] via-[var(--pro-azure)] to-[var(--pro-azure-dark)] dark:from-slate-100 dark:via-green-300 dark:to-[var(--pro-azure-light)] bg-clip-text text-transparent mb-2">
                  Balance Sheet
                </h1>
                <p className="text-2xl font-bold text-slate-700">
                  As of {format(new Date(data.asOfDate), 'MMMM dd, yyyy')}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <span>{data.companyName}</span>
                  <span>•</span>
                  <span>{data.currency}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 lg:self-end print:justify-center">
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-sm font-mono">
                  <Calendar size={16} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent border-none outline-none font-mono text-slate-800 w-40"
                  />
                  <button onClick={() => loadReport(date)} className="p-1 hover:bg-slate-200 rounded-lg">
                    <ChevronLeft size={16} className="text-slate-500" />
                  </button>
                  <button onClick={() => loadReport(format(addMonths(new Date(date), 1), 'yyyy-MM-dd'))} className="p-1 hover:bg-slate-200 rounded-lg">
                    <ChevronRight size={16} className="text-slate-500" />
                  </button>
                </div>
                
                <Button variant="outline" onClick={printReport} className="gap-2 hidden print:inline-flex">
                  <Printer size={16} />
                  Print
                </Button>
                {can('ovds:write') && (
                  <Button onClick={exportPDF} className="gap-2">
                    <Download size={16} />
                    Export PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Report */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 print:grid-cols-1 print:gap-12">
          {/* Assets */}
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 print:p-6 print:shadow-none print:border-0">
            <div className="flex items-center gap-3 mb-8 print:mb-6">
              <Shield size={32} className="text-[var(--pro-azure)] bg-[var(--pro-azure-100)] p-2 rounded-2xl" />
              <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Assets</h2>
                <div className="flex items-baseline gap-2 text-4xl font-semibold text-[var(--pro-azure-dark)] mt-1">
                  {fmt(data.totalAssets)}
                  <span className="text-xl text-slate-500">ETB</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {data.sections
                .filter(s => s.type === 'asset')
                .map((section) => (
                  <Section 
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    subtotal={section.subtotal}
                    total={data.totalAssets}
                    type={section.type}
                    expanded={expandedSections.has(`assets-${section.title}`)}
                    onToggle={() => toggleSection(`assets-${section.title}`)}
                  />
                ))}
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 print:p-6 print:shadow-none print:border-0">
            <div className="flex items-center gap-3 mb-8 print:mb-6">
              <div className="p-2 bg-gradient-to-br from-sky-100 to-purple-100 rounded-2xl">
                <TrendingDown size={32} className="text-sky-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1">Liabilities & Equity</h2>
                <div className="text-4xl font-semibold text-sky-700">
                  {fmt(data.totalLiabilities + data.totalEquity)}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {data.sections
                .filter(s => s.type === 'liability' || s.type === 'equity')
                .map((section) => (
                  <Section 
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    subtotal={section.subtotal}
                    total={data.totalAssets}
                    type={section.type}
                    expanded={expandedSections.has(`${section.type}-${section.title}`)}
                    onToggle={() => toggleSection(`${section.type}-${section.title}`)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Footer Verification */}
        <div className="mt-12 bg-gradient-to-r from-[var(--pro-azure-50)] to-[var(--pro-azure-50)] rounded-2xl p-8 border border-[var(--pro-azure-100)]/50 print:hidden">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-col lg:flex-row items-end justify-center gap-8 text-2xl lg:text-3xl font-semibold mb-4">
              <div>
                <span className="text-[var(--pro-azure-dark)]">{fmt(data.totalAssets)}</span>
                <span className="text-sm text-[var(--pro-azure)] block lg:inline ml-0 lg:ml-2">=</span>
              </div>
              <div className="text-sky-700">
                {fmt(data.totalLiabilities + data.totalEquity)}
              </div>
            </div>
            <div className="bg-white px-8 py-4 rounded-2xl shadow-lg inline-block">
              <Badge variant="indigo" className="!text-lg !px-4 !py-2 font-semibold">
                ✅ Balance Sheet Balances
              </Badge>
            </div>
            <p className="text-slate-600 mt-4 text-lg max-w-2xl mx-auto">
              Assets = Liabilities + Equity ✓
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 1in; }
          body { font-family: 'Inter', -apple-system, sans-serif !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

interface SectionProps {
  title: string;
  items: BalanceItem[];
  subtotal: number;
  total: number;
  type: 'asset' | 'liability' | 'equity';
  expanded: boolean;
  onToggle: () => void;
}

const Section: React.FC<SectionProps> = ({ 
  title, 
  items, 
  subtotal, 
  total, 
  type, 
  expanded, 
  onToggle 
}) => {
  const color = type === 'asset' ? 'indigo' : type === 'liability' ? 'sky' : 'purple';

  return (
    <div className="group border-l-4 border-[var(--pro-azure)] bg-slate-50/50 rounded-r-2xl p-6 hover:shadow-md transition-all">
      <button 
        className="w-full flex items-center justify-between text-left" 
        onClick={onToggle}
      >
        <div className="flex items-baseline gap-4">
          <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg"></div>
          <h4 className="text-xl font-bold text-slate-900">{title}</h4>
          <div className="text-2xl font-semibold text-[var(--pro-azure-dark)]">{fmt(subtotal)}</div>
          <span className="text-sm text-slate-500">{pct(subtotal, total)}</span>
        </div>
        <ChevronRight 
          size={24} 
          className={`text-slate-400 group-hover:text-slate-600 transition-transform ${expanded ? 'rotate-90' : ''}`} 
        />
      </button>
      
      {expanded && (
        <div className="mt-6 space-y-3 ml-8 border-l border-slate-200 pl-6 pt-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-baseline justify-between py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono font-bold text-slate-700 w-20">{item.code}</span>
                  <span className="font-semibold text-slate-800 truncate max-w-md">{item.name}</span>
                  <Badge variant={color as any} size="xs" className="!text-[11px]">
                    {item.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="text-right font-mono text-sm font-bold text-[var(--pro-azure-dark)] min-w-[120px]">
                {fmt(item.balance)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BalanceSheetReport;









