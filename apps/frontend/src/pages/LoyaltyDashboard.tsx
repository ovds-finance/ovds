/**
 * LoyaltyDashboard — ovds-style customer loyalty program
 * AppPage · AppKpi · AppTable · useApiCrud
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Gift, Star, TrendingUp, Users2, RefreshCw, Award,
  Crown, Zap, ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtETB } from '../utils/ethiopianTax';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, SearchBar, EmptyState, Card, IconBox,
} from '../components/ui';

interface LoyaltyMember {
  id: string;
  customerId: string;
  customerName?: string;
  tier: string;
  points: number;
  totalSpend?: number;
  joinedAt?: string;
  lastActivity?: string;
}

interface LoyaltyTier {
  name: string;
  minPoints: number;
  color: string;
  icon: React.ReactNode;
  benefits: string[];
}

const TIERS: LoyaltyTier[] = [
  { name: 'Bronze',   minPoints: 0,     color: 'text-amber-700 bg-amber-50 border-amber-200',    icon: <Star size={12} />,  benefits: ['5% discount', 'Birthday bonus'] },
  { name: 'Silver',   minPoints: 1000,  color: 'text-slate-600 bg-slate-100 border-slate-300',   icon: <Award size={12} />, benefits: ['10% discount', 'Priority support', 'Free delivery'] },
  { name: 'Gold',     minPoints: 5000,  color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: <Crown size={12} />, benefits: ['15% discount', 'Dedicated manager', 'Early access'] },
  { name: 'Platinum', minPoints: 10000, color: 'text-violet-700 bg-violet-50 border-violet-200', icon: <Zap size={12} />,   benefits: ['20% discount', 'VIP events', 'Custom pricing'] },
];

const LoyaltyDashboard: React.FC = () => {
  usePageTitle('Loyalty Program');
  const navigate  = useNavigate();
  const { selectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['loyalty', selectedCompanyId],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '100' });
      if (selectedCompanyId) params.set('companyId', selectedCompanyId);
      return api.get(`/loyalty/members?${params}`).then((r: any) => {
        const d = r.data?.data ?? r.data;
        return Array.isArray(d) ? d : (d?.data ?? []);
      }).catch(() => [] as any[]);
    },
    staleTime: 60_000,
  });

  const members: LoyaltyMember[] = Array.isArray(raw) ? raw : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m => String(m.customerName ?? m.customerId ?? '').toLowerCase().includes(q));
  }, [members, search]);

  const kpiCells = useMemo(() => {
    const totalPoints = members.reduce((s, m) => s + (m.points ?? 0), 0);
    const totalSpend  = members.reduce((s, m) => s + (m.totalSpend ?? 0), 0);
    return [
      { label: 'Members',      value: members.length,                                                    color: 'emerald' as const },
      { label: 'Gold+',        value: members.filter(m => ['GOLD', 'PLATINUM'].includes(m.tier?.toUpperCase())).length, color: 'amber' as const },
      { label: 'Total Points', value: totalPoints.toLocaleString(),                                      color: 'violet' as const },
      { label: 'Total Spend',  value: fmtETB(totalSpend),                                                color: 'sky' as const },
    ];
  }, [members]);

  const getTierConfig = (tier: string) => TIERS.find(t => t.name.toUpperCase() === tier?.toUpperCase()) ?? TIERS[0];

  return (
    <AppPage
      title="Loyalty Program"
      subtitle="Customer rewards · Points · Tier management"
      icon={<Gift size={18} />}
      crumbs={[{ label: 'Loyalty' }]}
      actions={
        <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* Tier overview */}
      <div className="ovds-grid-layout cols-4 gap-sm mb-4">
        {TIERS.map(tier => {
          const count = members.filter(m => m.tier?.toUpperCase() === tier.name.toUpperCase()).length;
          return (
            <Card key={tier.name} padding="p-3" hover>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tier.color}`}>
                  {tier.icon} {tier.name}
                </span>
              </div>
              <p className="text-[20px] font-bold text-slate-800 tabular-nums">{count}</p>
              <p className="ovds-caption mt-0.5">{tier.minPoints.toLocaleString()}+ pts</p>
              <div className="mt-2 space-y-0.5">
                {tier.benefits.slice(0, 2).map(b => (
                  <p key={b} className="text-[9px] text-slate-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />{b}
                  </p>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Members table */}
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search members…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} members</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Customer</AppTh>
          <AppTh>Tier</AppTh>
          <AppTh align="right">Points</AppTh>
          <AppTh align="right">Total Spend</AppTh>
          <AppTh>Last Activity</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={6} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={6}><EmptyState icon={<Gift size={18} />} title="No loyalty members" desc="Customers will appear here when they join the loyalty program" /></td></tr>
          ) : filtered.map(m => {
            const tierCfg = getTierConfig(m.tier);
            return (
              <AppTr key={m.id}>
                <AppTd>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {String(m.customerName ?? m.customerId ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[12px] font-semibold text-slate-800">{m.customerName ?? m.customerId}</span>
                  </div>
                </AppTd>
                <AppTd>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${tierCfg.color}`}>
                    {tierCfg.icon} {m.tier ?? 'BRONZE'}
                  </span>
                </AppTd>
                <AppTd align="right">
                  <span className="text-[11px] font-bold text-violet-600 tabular-nums">{(m.points ?? 0).toLocaleString()}</span>
                </AppTd>
                <AppTd align="right">
                  {m.totalSpend ? <span className="text-[11px] font-bold text-emerald-600 tabular-nums">{fmtETB(m.totalSpend)}</span> : <span className="text-[10px] text-slate-300">—</span>}
                </AppTd>
                <AppTd>
                  {m.lastActivity
                    ? <span className="text-[10px] text-slate-500">{new Date(m.lastActivity).toLocaleDateString()}</span>
                    : <span className="text-[10px] text-slate-300">—</span>
                  }
                </AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/customer-summary/${m.customerId}`)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                      title="View customer"
                    >
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>
    </AppPage>
  );
};

export default LoyaltyDashboard;

