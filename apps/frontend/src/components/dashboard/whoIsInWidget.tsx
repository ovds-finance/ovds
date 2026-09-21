import { Search, RefreshCw, Users, Building2, Clock, Wifi, WifiOff } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useWebSocket } from '../../hooks/useWebSocket';
import { getLocale } from '../../lib/locale';
import { useAuth } from '../../rbac/AuthContext';

interface WhoIsInWidgetProps {
  whoIsIn: any[];
  fetchData: () => void;
}

/** Deterministic color from a string — keeps avatars visually distinct */
function avatarColor(name: string): string {
  const colors = [
    'bg-[var(--pro-azure-50)]0', 'bg-violet-500', 'bg-[var(--pro-azure-50)]0', 'bg-amber-500',
    'bg-rose-500', 'bg-teal-500', 'bg-[var(--pro-azure-50)]0', 'bg-orange-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

/** Live elapsed time that ticks every minute */
function useElapsed(checkIn: string): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const calc = () => {
      const mins = Math.floor((Date.now() - new Date(checkIn).getTime()) / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [checkIn]);
  return label;
}

const EmployeeCard: React.FC<{ item: any; groupByDept: boolean; locale: string }> = ({
  item, groupByDept, locale,
}) => {
  const elapsed = useElapsed(item.checkIn);
  const fullName = `${item.employee.firstName} ${item.employee.lastName}`;
  const initials = `${item.employee.firstName[0]}${item.employee.lastName[0]}`;
  const bgColor = avatarColor(fullName);
  const checkInTime = new Date(item.checkIn).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 hover:border-slate-200 dark:hover:border-slate-600 transition-all group">
      {/* Avatar with presence dot */}
      <div className="relative shrink-0">
        <div className={`w-9 h-9 ${bgColor} rounded-xl flex items-center justify-center text-white font-semibold text-xs shadow-sm group-hover:scale-105 transition-transform`}>
          {initials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--pro-azure-light)] border-2 border-white dark:border-slate-900 rounded-full" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{fullName}</p>
        {!groupByDept && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {item.employee.department?.name}
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] tabular-nums">
          {checkInTime}
        </p>
        <div className="flex items-center gap-0.5 justify-end mt-0.5">
          <Clock size={8} className="text-slate-400" />
          <p className="text-[9px] text-slate-400 dark:text-slate-500 tabular-nums">{elapsed}</p>
        </div>
      </div>
    </div>
  );
};

const WhoIsInWidget: React.FC<WhoIsInWidgetProps> = ({ whoIsIn, fetchData }) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [groupByDept, setGroupByDept] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [liveData, setLiveData] = useState<any[]>(whoIsIn);
  const locale = getLocale(i18n.language);

  // Keep liveData in sync with prop changes
  useEffect(() => { setLiveData(whoIsIn); }, [whoIsIn]);

  // Real-time WebSocket updates
  const { connected } = useWebSocket({
    enabled: isAuthenticated,
    rooms: ['dashboard'],
    events: {
      newCheckin: useCallback((data: any) => {
        setLiveData(prev => {
          // Avoid duplicates
          if (prev.some(p => p.id === data.id)) return prev;
          return [data, ...prev];
        });
      }, []),
      newCheckout: useCallback((data: any) => {
        setLiveData(prev => prev.filter(p => p.id !== data.id));
      }, []),
    },
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const filtered = useMemo(() => {
    if (!query) return liveData;
    const q = query.toLowerCase();
    return liveData.filter(item =>
      `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}`.toLowerCase().includes(q) ||
      item.employee?.department?.name?.toLowerCase().includes(q),
    );
  }, [liveData, query]);

  const grouped = useMemo(() => {
    if (!groupByDept) return null;
    const map: Record<string, any[]> = {};
    filtered.forEach(item => {
      const dept = item.employee?.department?.name || 'Unknown';
      if (!map[dept]) map[dept] = [];
      map[dept].push(item);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupByDept]);

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden flex flex-col transition-colors">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 bg-[var(--pro-azure-100)] dark:bg-green-950/50 rounded-xl flex items-center justify-center">
              <Users size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            </div>
            {whoIsIn.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--pro-azure)] text-white text-[8px] font-semibold rounded-full flex items-center justify-center">
                {liveData.length > 99 ? '99+' : liveData.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">{t('admin.currently_in')}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {liveData.length > 0 ? `${liveData.length} active right now` : 'No one checked in'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* WebSocket live indicator */}
          <span title={connected ? 'Live updates active' : 'Polling mode'} className="mr-1">
            {connected
              ? <Wifi size={11} className="text-[var(--pro-azure-light)]" />
              : <WifiOff size={11} className="text-slate-300 dark:text-slate-600" />}
          </span>
          <button
            onClick={() => setGroupByDept(v => !v)}
            title="Group by department"
            className={`p-1.5 rounded-lg transition-all ${groupByDept ? 'bg-[var(--pro-azure)] text-white shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Building2 size={13} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
            title="Refresh"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search */}
      {liveData.length > 3 && (
        <div className="px-4 pt-3 pb-1">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or dept..."
              className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="p-4 space-y-1.5 max-h-[460px] overflow-y-auto">
        {liveData.length === 0 ? (
          <div className="py-10 text-center">
            <Users size={28} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" />
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{t('admin.no_one')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">No results for "{query}"</p>
        ) : grouped ? (
          grouped.map(([dept, items]) => (
            <div key={dept} className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <Building2 size={10} className="text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{dept}</span>
                <span className="text-[9px] text-slate-300 dark:text-slate-600">({items.length})</span>
              </div>
              <div className="space-y-1">
                {items.map(item => (
                  <EmployeeCard key={item.id} item={item} groupByDept={groupByDept} locale={locale} />
                ))}
              </div>
            </div>
          ))
        ) : (
          filtered.map(item => (
            <EmployeeCard key={item.id} item={item} groupByDept={groupByDept} locale={locale} />
          ))
        )}
      </div>

      {/* Footer */}
      {liveData.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            {connected
              ? <><Wifi size={9} className="text-[var(--pro-azure-light)]" /> Live</>
              : 'Auto-refreshes every 30s'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
};

export default WhoIsInWidget;







