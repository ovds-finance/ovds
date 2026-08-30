import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, Clock, RefreshCw,
  ArrowRight, Wifi, WifiOff, Activity,
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../rbac/AuthContext';

interface CheckinEvent {
  employeeId: string;
  firstName: string;
  lastName: string;
  checkIn: string;
  status: 'PRESENT' | 'LATE';
  type?: string;
}

interface RealtimePresenceWidgetProps {
  whoIsIn: any[];
  fetchData: () => void;
}

const StatusDot: React.FC<{ status: 'PRESENT' | 'LATE' }> = ({ status }) => (
  <span className={`w-2 h-2 rounded-full shrink-0 ${status === 'LATE' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
);

const RealtimePresenceWidget: React.FC<RealtimePresenceWidgetProps> = ({ whoIsIn, fetchData }) => {
  const { isAuthenticated } = useAuth();
  const [liveEvents, setLiveEvents] = useState<CheckinEvent[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const { connected } = useWebSocket({
    enabled: isAuthenticated,
    events: {
      newCheckin: (data: CheckinEvent) => {
        setLiveEvents(prev => [data, ...prev].slice(0, 5));
        fetchData();
      },
      newCheckout: () => {
        fetchData();
      },
    },
  });

  useEffect(() => {
    setWsConnected(connected);
  }, [connected]);

  const displayList = whoIsIn.slice(0, 8);
  const overflow = whoIsIn.length - 8;

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

  const AVATAR_COLORS = [
    'bg-emerald-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
    'bg-teal-500', 'bg-rose-500', 'bg-indigo-500', 'bg-orange-500',
  ];

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
            <UserCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Who's In</p>
            <p className="ovds-caption">Real-time presence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${wsConnected ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            {wsConnected ? <Wifi size={9} /> : <WifiOff size={9} />}
            {wsConnected ? 'Live' : 'Polling'}
          </div>
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw size={12} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Count banner */}
      <div className="px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
            <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{whoIsIn.length}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Currently In</p>
            <p className="ovds-caption">checked in today</p>
          </div>
        </div>
        {liveEvents.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Activity size={10} className="text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {liveEvents[0].firstName} just checked in
            </span>
          </div>
        )}
      </div>

      {/* Avatar stack */}
      {displayList.length > 0 ? (
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-2">
            {displayList.map((emp: any, i: number) => {
              const first = emp.employee?.firstName ?? emp.firstName ?? '';
              const last = emp.employee?.lastName ?? emp.lastName ?? '';
              const status = emp.status ?? 'PRESENT';
              return (
                <div key={emp.id ?? i} className="relative group" title={`${first} ${last}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-semibold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                    {getInitials(first, last)}
                  </div>
                  <StatusDot status={status} />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[9px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {first} {last}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                  </div>
                </div>
              );
            })}
            {overflow > 0 && (
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-500">
                +{overflow}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-5 pb-4 flex flex-col items-center justify-center py-4 text-center">
          <Users size={24} className="text-slate-200 dark:text-slate-700 mb-2" />
          <p className="text-xs text-slate-400">No one checked in yet</p>
        </div>
      )}

      {/* Live feed */}
      {liveEvents.length > 0 && (
        <div className="px-5 pb-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Live Feed</p>
          <div className="space-y-1.5">
            {liveEvents.slice(0, 3).map((ev, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <StatusDot status={ev.status} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1">
                  {ev.firstName} {ev.lastName}
                </span>
                <span className="ovds-caption">
                  {new Date(ev.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link to="/hr/attendance" className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          <Clock size={12} /> Attendance Log
        </Link>
        <Link to="/entry" className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">
          Entry Portal <ArrowRight size={9} />
        </Link>
      </div>
    </div>
  );
};

export default RealtimePresenceWidget;








