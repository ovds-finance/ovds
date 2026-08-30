import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Icon } from '../ui';
import { PanelShell } from './PanelPrimitives';
import type { SidebarNotification } from './types';

function notifMeta(type?: string): { icon: React.ReactNode; dot: string } {
  switch (type) {
    case 'invoice': return { icon: <Icon name="INVOICE" size={13} />, dot: 'bg-emerald-500' };
    case 'payment': return { icon: <Icon name="MONEY" size={13} />, dot: 'bg-blue-500' };
    case 'alert':   return { icon: <Icon name="ALERT_TRIANGLE" size={13} />, dot: 'bg-amber-500' };
    default:        return { icon: <Icon name="BELL" size={13} />, dot: 'bg-slate-400' };
  }
}

export const NotificationsPanel: React.FC<{ onClose: () => void; onNavClick?: () => void }> = ({ onClose, onNavClick }) => {
  const [notifications, setNotifications] = React.useState<SidebarNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/notifications?limit=12', { headers: { 'x-background': '1' } } as any);
        const items = res.data?.data?.notifications ?? res.data?.data ?? res.data ?? [];
        setNotifications(Array.isArray(items) ? items : []);
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, []);

  return (
    <PanelShell title="Notifications" onClose={onClose}>
      {loading ? (
        <div className="flex flex-col gap-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-2 bg-slate-100 rounded animate-pulse w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Icon name="BELL" size={20} className="text-slate-400" />
          </div>
          <p className="text-[13px] font-semibold text-slate-600">All caught up</p>
          <p className="text-[11px] text-slate-400 mt-1">No new notifications</p>
        </div>
      ) : (
        <div className="py-1">
          {notifications.map(n => {
            const meta = notifMeta(n.type);
            return (
              <div key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-default ${n.read ? 'opacity-60' : ''}`}
              >
                <div className={`relative w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 mt-0.5`}>
                  {meta.icon}
                  {!n.read && <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${meta.dot} border border-white`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-700 truncate">{n.title}</p>
                  {n.body && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  {n.createdAt && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="sticky bottom-0 border-t border-slate-100 bg-white">
        <button
          onClick={() => { navigate('/notifications'); onClose(); onNavClick?.(); }}
          className="w-full py-3 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
        >
          View all notifications
        </button>
      </div>
    </PanelShell>
  );
};
