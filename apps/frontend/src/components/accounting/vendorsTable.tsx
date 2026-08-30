import React, { useState, useEffect } from 'react';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Download,
  Edit3,
  Trash2,
  DollarSign,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@ovds/ui';
import { Badge } from '@ovds/ui';
import { fmtCurrencyDecimal } from '../../utils/fmt';

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalOwed: number;
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  lastPaymentDate?: string;
  paymentTerms: string;
  creditLimit: number;
  riskScore: number;
}

const VendorsTable: React.FC = () => {
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    overdue: 'all' as 'all' | 'current' | 'overdue',
    risk: 'all' as 'all' | 'low' | 'high',
  });

  const loadVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.overdue !== 'all' && { overdue: filters.overdue }),
        ...(filters.risk !== 'all' && { risk: filters.risk }),
      });
      const res = await api.get(`/ovds/vendors?${params}`);
      // Unwrap NestJS envelope: { data: [...], statusCode, message, success }
      const raw = res.data?.data ?? res.data;
      setVendors(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fmt = (n: number) => fmtCurrencyDecimal(Math.abs(n), 'ETB');

  const riskColor = (score: number) => {
    if (score < 30) return 'emerald';
    if (score < 60) return 'amber';
    return 'rose';
  };

  if (loading) {
    return <div>Loading vendors...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="ovds-widget-card p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <DollarSign size={36} />
              Vendors & Accounts Payable
            </h1>
            <p className="text-slate-600 mt-2">Total owed: <span className="font-semibold text-2xl text-orange-600">{fmt(vendors.reduce((sum, v) => sum + v.totalOwed, 0))}</span></p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search vendors..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            
            <select
              value={filters.overdue}
              onChange={(e) => setFilters({ ...filters, overdue: e.target.value as any })}
              className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Status</option>
              <option value="current">Current</option>
              <option value="overdue">Overdue</option>
            </select>
            
            {canWrite && <Button><Plus size={16} className="ml-1" /> New Vendor</Button>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ovds-widget-card shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ovds-table w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-semibold uppercase text-slate-500">Vendor</th>
                <th className="px-6 py-5 text-left text-xs font-semibold uppercase text-slate-500">Terms</th>
                <th className="px-8 py-5 text-right text-xs font-semibold uppercase text-slate-500">Total Owed</th>
                <th className="px-8 py-5 text-right text-xs font-semibold uppercase text-slate-500">Current</th>
                <th className="px-8 py-5 text-right text-xs font-semibold uppercase text-slate-500">30-60</th>
                <th className="px-8 py-5 text-right text-xs font-semibold uppercase text-slate-500">60-90</th>
                <th className="px-8 py-5 text-right text-xs font-semibold uppercase text-slate-500">90+</th>
                <th className="px-6 py-5 text-center text-xs font-semibold uppercase text-slate-500">Risk</th>
                <th className="px-4 py-5 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${riskColor(vendor.riskScore) === 'emerald' ? 'from-emerald-500 to-emerald-600' : riskColor(vendor.riskScore) === 'amber' ? 'from-amber-500 to-amber-600' : 'from-rose-500 to-rose-600'} flex items-center justify-center shadow-lg`}>
                        <span className="font-bold text-white text-sm uppercase">{vendor.name.slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-lg">{vendor.name}</div>
                        {vendor.email && <div className="text-sm text-slate-500">{vendor.email}</div>}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5">
                    <div className="text-sm font-mono">{vendor.paymentTerms}</div>
                    {vendor.lastPaymentDate && (
                      <div className="ovds-caption">{format(new Date(vendor.lastPaymentDate), 'MMM dd')}</div>
                    )}
                  </td>
                  
                  <td className="px-8 py-5 text-right">
                    <div className="text-xl font-semibold text-orange-600">{fmt(vendor.totalOwed)}</div>
                  </td>
                  
                  <td className="px-8 py-5 text-right font-mono text-emerald-700 font-semibold">
                    {fmt(vendor.current)}
                  </td>
                  
                  <td className="px-8 py-5 text-right font-mono text-amber-600 font-semibold">
                    {fmt(vendor.overdue30)}
                  </td>
                  
                  <td className="px-8 py-5 text-right font-mono text-amber-600 font-semibold">
                    {fmt(vendor.overdue60)}
                  </td>
                  
                  <td className="px-8 py-5 text-right">
                    <div className="text-xl font-semibold text-rose-600">{fmt(vendor.overdue90)}</div>
                    {vendor.overdue90 > 0 && (
                      <Clock size={14} className="ml-1 text-rose-500 inline" aria-label="Critically overdue" />
                    )}
                  </td>
                  
                  <td className="px-6 py-5 text-center">
                    <Badge variant={riskColor(vendor.riskScore)} className="!font-semibold !px-4 !py-2">
                      {vendor.riskScore}%
                    </Badge>
                  </td>
                  
                  <td className="px-4 py-5 text-right">
                    <div className="flex items-center gap-2">
                      {canWrite && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <Edit3 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600">
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                      <Button size="sm" className="gap-1.5">
                        Pay Now
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            
            {vendors.length === 0 && (
              <tfoot>
                <tr>
                  <td colSpan={9} className="p-24 text-center">
                    <DollarSign size={64} className="mx-auto mb-6 text-slate-300" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Vendors</h3>
                    <p className="text-slate-500 mb-8 max-w-lg mx-auto">
                      Track your suppliers to manage accounts payable, aging, and cash flow.
                    </p>
                    {canWrite && <Button size="lg"><Plus size={18} /> Add First Vendor</Button>}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        
        {vendors.length > 0 && (
          <div className="px-8 py-6 bg-gradient-to-r from-orange-50 to-rose-50 border-t border-orange-200">
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center lg:justify-between">
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div>
                  <div className="font-semibold text-2xl text-orange-600">Total AP: {fmt(vendors.reduce((sum, v) => sum + v.totalOwed, 0))}</div>
                  <div className="text-xs uppercase tracking-wider">Accounts Payable</div>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <div className="font-semibold text-xl text-rose-600">{vendors.filter(v => v.overdue90 > 0).length}</div>
                  <div className="text-xs uppercase tracking-wider">Critically Overdue</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline"><Download size={16} className="mr-1" /> Export</Button>
                {canWrite && <Button><DollarSign size={16} className="mr-1" /> Bulk Payment</Button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsTable;










