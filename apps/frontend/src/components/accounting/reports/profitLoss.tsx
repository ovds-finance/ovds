import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../rbac/AuthContext';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import {
  Download,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@ovds/ui';
import { Badge } from '@ovds/ui';
import { fmtCurrencyDecimal } from '../../../utils/fmt';

const fmt = (n: number) => fmtCurrencyDecimal(Math.abs(n), 'ETB');

interface PLItem {
  id: string;
  code: string;
  name: string;
  type: 'revenue' | 'cogs' | 'expense' | 'other';
  category: string;
  amount: number;
  children?: PLItem[];
  variance?: number;
  variancePct?: number;
}

interface ProfitLossData {
  periodStart: string;
  periodEnd: string;
  companyName: string;
  currency: string;
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  profitMargin: number;
  sections: Array<{
    title: string;
    type: 'revenue' | 'cogs' | 'expense' | 'other';
    items: PLItem[];
    subtotal: number;
  }>;
  monthlyBreakdown?: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }>;
}

const ProfitLossReport: React.FC = () => {
  const { can } = useAuth();
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') });

  const loadReport = async (start: string, end: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/ovds/reports/profit-loss?startDate=${start}&endDate=${end}`);
      setData(res.data);
    } catch {
      toast.error('Failed to load profit & loss statement');
    } finally {
      setLoading(false);
    }
  };

  const prevPeriod = () => {
    const start = startOfMonth(subMonths(new Date(period.start), 1));
    const end = endOfMonth(start);
    setPeriod({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') });
  };

  const nextPeriod = () => {
    const start = startOfMonth(addMonths(new Date(period.start), 1));
    const end = endOfMonth(start);
    setPeriod({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') });
  };

  const fmt = (n: number) => fmtCurrencyDecimal(Math.abs(n), 'ETB');

  const pct = (n: number, total: number) => total ? `${((n / total) * 100).toFixed(1)}%` : '0.0%';

  useEffect(() => {
    loadReport(period.start, period.end);
  }, [period]);

  const printReport = () => window.print();

  const exportCSV = () => {
    if (!data) return;
    const rows: string[][] = [
      ['IFRS Statement of Comprehensive Income (IAS 1.81A)'],
      [`Period: ${format(new Date(data.periodStart), 'MMM yyyy')} — ${format(new Date(data.periodEnd), 'MMM yyyy')}`],
      [`Company: ${data.companyName}  |  Currency: ${data.currency}`],
      [],
      ['Section', 'Account Code', 'Account Name', 'Amount (ETB)'],
    ];
    data.sections.forEach(section => {
      rows.push([section.title.toUpperCase(), '', '', '']);
      section.items.forEach(item => {
        rows.push(['', item.code, item.name, item.amount.toFixed(2)]);
      });
      rows.push(['', '', `Total ${section.title}`, section.subtotal.toFixed(2)]);
      rows.push([]);
    });
    rows.push(['', '', 'Gross Profit', data.grossProfit.toFixed(2)]);
    rows.push(['', '', 'Operating Expenses', `(${data.operatingExpenses.toFixed(2)})`]);
    rows.push(['', '', 'Profit Before Tax', data.netProfit.toFixed(2)]);
    rows.push(['', '', 'Income Tax (IAS 12 · 30%)', `(${(Math.max(0, data.netProfit) * 0.30).toFixed(2)})`]);
    rows.push(['', '', 'PROFIT FOR THE PERIOD', (data.netProfit - Math.max(0, data.netProfit) * 0.30).toFixed(2)]);
    rows.push([]);
    rows.push([`Profit Margin: ${data.profitMargin.toFixed(1)}%`, '', `Generated: ${new Date().toLocaleString()}`, 'Full IFRS · IAS 1.81A']);
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `P&L_${format(new Date(data.periodStart), 'yyyy-MM')}_to_${format(new Date(data.periodEnd), 'yyyy-MM')}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast.success('P&L exported as CSV');
  };

  if (loading) {
    return <div className="p-12"><div className="animate-pulse h-96 bg-slate-200 rounded-2xl" /></div>;
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center">
        <TrendingUp size={72} className="mx-auto mb-6 text-slate-300" />
        <h2 className="text-3xl font-semibold mb-2 text-slate-900">No P&L Data</h2>
        <p className="text-slate-500 mb-8 max-w-lg mx-auto">
          Record revenue and expense transactions to generate profit & loss statements.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 mb-12 p-10 print:shadow-none print:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12">
            <div>
              <h1 className="text-5xl font-semibold bg-gradient-to-r from-emerald-900 to-green-900 bg-clip-text text-transparent mb-4">
                Profit & Loss Statement
              </h1>
              <p className="text-2xl font-bold text-slate-800">
                {format(new Date(data.periodStart), 'MMM yyyy')} — {format(new Date(data.periodEnd), 'MMM yyyy')}
              </p>
              <div className="mt-4 flex items-center gap-6 text-sm text-slate-600 bg-slate-50/50 px-6 py-3 rounded-2xl">
                <span>{data.companyName}</span>
                <span>{data.currency}</span>
                <Badge variant="emerald" className="!px-4 !py-2 !font-semibold text-sm">
                  {data.profitMargin >= 0 ? `+${data.profitMargin.toFixed(1)}%` : `${data.profitMargin.toFixed(1)}%`} Margin
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 self-start lg:self-end lg:ml-auto">
              <div className="flex items-center bg-slate-100/70 px-6 py-3 rounded-2xl border font-mono text-lg gap-3">
                <Calendar size={20} />
                <input
                  type="month"
                  value={format(new Date(period.start), 'yyyy-MM')}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-');
                    setPeriod({
                      start: format(startOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'yyyy-MM-dd'),
                      end: format(endOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'yyyy-MM-dd')
                    });
                  }}
                  className="bg-transparent border-none outline-none w-32 text-slate-900 font-bold"
                />
                <button onClick={prevPeriod} className="p-2 hover:bg-slate-200/50 rounded-xl transition-all">
                  <ChevronLeft size={20} className="text-slate-500" />
                </button>
                <button onClick={nextPeriod} className="p-2 hover:bg-slate-200/50 rounded-xl transition-all">
                  <ChevronRight size={20} className="text-slate-500" />
                </button>
              </div>
              
              <Button onClick={printReport} variant="outline" size="lg" className="gap-2 px-6 hidden print:inline-flex">
                <Printer size={18} />
                Print
              </Button>
              {can('ovds:write') && (
                  <Button onClick={exportCSV} size="lg" className="gap-2 px-6">
                    <Download size={18} />
                    Export CSV
                  </Button>
                )}
            </div>
          </div>
        </div>

        {/* P&L Statement */}
        <div className="space-y-8">
          {/* Revenue & Gross Profit */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-xl p-8 border border-emerald-200/50">
              <PLSection 
                title="Revenue" 
                type="revenue" 
                amount={data.totalRevenue} 
                sections={data.sections.filter(s => s.type === 'revenue')} 
                color="emerald"
              />
              <PLSection 
                title="Gross Profit" 
                amount={data.grossProfit} 
                sections={data.sections.filter(s => s.type === 'cogs')} 
                color="green"
                subtitle={`Gross Margin: ${pct(data.grossProfit, data.totalRevenue)}`}
              />
            </div>
          </div>

          {/* Expenses & Net Profit */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-slate-200/30">
            <div className="grid lg:grid-cols-2 gap-12">
              <PLSection 
                title="Operating Expenses" 
                type="expense" 
                amount={data.operatingExpenses} 
                sections={data.sections.filter(s => s.type === 'expense')} 
                color="orange"
              />
              
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-8 border-4 border-emerald-200/50 shadow-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-end gap-8 text-center lg:text-left">
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Net Profit</h3>
                      <div className={`text-5xl lg:text-6xl font-semibold ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {fmt(data.netProfit)}
                      </div>
                      <div className="text-2xl font-bold mt-2 text-slate-600">
                        {data.profitMargin >= 0 ? `+${data.profitMargin.toFixed(1)}%` : `${data.profitMargin.toFixed(1)}%`} Margin
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 lg:ml-auto">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-emerald-700">{fmt(data.totalRevenue)}</div>
                        <div className="text-xs uppercase tracking-wider">Revenue</div>
                      </div>
                      <div className="w-24 h-px bg-gradient-to-r from-slate-200 to-slate-300"></div>
                      <div className="text-center">
                        <div className={`text-2xl font-semibold ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmt(data.operatingExpenses)}</div>
                        <div className="text-xs uppercase tracking-wider">Expenses</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          {data.monthlyBreakdown && data.monthlyBreakdown.length > 1 && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl p-8 border border-slate-200/30">
              <h3 className="text-xl font-semibold text-slate-900 mb-8 flex items-center gap-3">
                <BarChart3 size={32} />
                Monthly Performance Trend
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.monthlyBreakdown.slice(-4).map((month) => (
                  <div key={month.month} className="group hover:scale-[1.02] transition-all">
                    <div className="bg-white rounded-xl p-5 shadow-lg border border-slate-200 hover:shadow-xl hover:border-slate-300">
                      <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">{month.month}</div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-baseline justify-between text-sm">
                          <span>Revenue</span>
                          <span className="font-semibold text-emerald-700">{fmt(month.revenue)}</span>
                        </div>
                        <div className="flex items-baseline justify-between text-sm">
                          <span>Expenses</span>
                          <span className="font-semibold text-rose-600">{fmt(month.expenses)}</span>
                        </div>
                      </div>
                      <div className={`text-xl font-semibold px-4 py-2 rounded-xl text-center w-full ${month.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300' : 'bg-rose-100 text-rose-800 border-2 border-rose-300'}`}>
                        {fmt(month.netProfit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 1in; }
          body { font-family: 'Inter', sans-serif !important; }
        }
      `}</style>
    </div>
  );
};

interface PLSectionProps {
  title: string;
  amount: number;
  sections: ProfitLossData['sections'];
  color: 'emerald' | 'green' | 'orange' | 'rose';
  subtitle?: string;
  type?: string;
}

const PLSection: React.FC<PLSectionProps> = ({ 
  title, 
  amount, 
  sections, 
  color, 
  subtitle,
  type 
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl p-8 border-4 ${color === 'emerald' ? 'border-emerald-200 bg-emerald-50/50' : color === 'green' ? 'border-green-200 bg-green-50/50' : color === 'orange' ? 'border-orange-200 bg-orange-50/50' : 'border-rose-200 bg-rose-50/50'} shadow-lg group hover:shadow-xl transition-all`}>
      <div className="flex items-start justify-between mb-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-baseline gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-xl ${color === 'emerald' ? 'bg-emerald-500 text-white' : color === 'green' ? 'bg-green-500 text-white' : color === 'orange' ? 'bg-orange-500 text-white' : 'bg-rose-500 text-white'}`}>
            {type?.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <h4 className="text-xl font-semibold text-slate-900">{title}</h4>
            {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
          </div>
          <div className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {fmt(amount)}
          </div>
        </div>
        <ChevronRight size={28} className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>
      
      {expanded && (
        <div className="space-y-4 ml-4 pl-8 border-l-4 border-slate-200 pt-6 -mt-2">
          {sections.map(section => (
            <div key={section.title} className="flex items-baseline justify-between py-3 px-4 bg-white/60 rounded-xl backdrop-blur-sm hover:bg-white/80 transition-all">
              <div className="flex items-center gap-3">
                <span className="w-8 font-mono font-bold text-emerald-700">{section.title}</span>
                {section.items.map(item => (
                  <span key={item.id} className="text-sm truncate max-w-xs">{item.name}</span>
                ))}
              </div>
              <span className="text-lg font-semibold text-slate-900">{fmt(section.subtotal)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;









