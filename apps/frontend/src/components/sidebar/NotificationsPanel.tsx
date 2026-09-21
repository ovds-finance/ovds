import React from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../../services/api';
import { Icon } from '../ui';

import { PanelShell } from './PanelPrimitives';
import type { SidebarNotification } from './types';

/* Ovds SaaS-green notification type metadata */
function notifMeta(type?: string): { icon: React.ReactNode; dot: string } {
  switch (type) {
    case 'invoice': return { icon: <Icon name="INVOICE" size={13} />,        dot: 'bg-[var(--pro-indigo)]' };
    case 'payment': return { icon: <Icon name="MONEY" size={13} />,          dot: 'bg-[var(--pro-azure)]' };
    case 'alert':   return { icon: <Icon name="ALERT_TRIANGLE" size={13} />, dot: 'bg-[var(--pro-amber)]' };
    default:        return { icon: <Icon name="BELL" size={13} />,            dot: 'bg-[var(--text-4)]' };
  }
}

export const NotificationsPanel: React.FC<{ onClose: () => void; onNavClick?: () => void }> = ({
  onClose, onNavClick,
}) => {
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
      {/* ── Loading skeleton ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col gap-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="w-8 h-8 rounded-xl animate-pulse shrink-0"
                style={{ background: 'var(--border-alt)' }}
              />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded animate-pulse w-3/4" style={{ background: 'var(--border-alt)' }} />
                <div className="h-2 rounded animate-pulse w-full"  style={{ background: 'var(--border-alt)' }} />
              </div>
            </div>
          ))}
        </div>

      /* ── Empty state ──────────────────────────────────────────────── */
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'var(--sys-bg-accent)', border: '1px solid var(--sys-border-accent)' }}
          >
            <Icon name="BELL" size={20} style={{ color: 'var(--pro-azure)' }} />
          </div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>All caught up</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-4)' }}>No new notifications</p>
        </div>

      /* ── Notification list ────────────────────────────────────────── */
      ) : (
        <div className="py-1">
          {notifications.map(n => {
            const meta = notifMeta(n.type);
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-default ${n.read ? 'opacity-60' : ''}`}
                style={{ borderBottom: '1px solid var(--border-alt)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--sys-bg-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Icon container */}
                <div
                  className={`relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5`}
                  style={{ background: 'var(--sys-bg-subtle)', color: 'var(--text-4)' }}
                >
                  {meta.icon}
                  {!n.read && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${meta.dot}`}
                      style={{ border: '1.5px solid var(--surface)' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[12px] font-semibold truncate"
                    style={{ color: 'var(--text)' }}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-4)' }}>
                      {n.body}
                    </p>
                  )}
                  {n.createdAt && (
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-5)' }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer CTA — green Ovds SaaS style ────────────────────────── */}
      <div
        className="sticky bottom-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <button
          onClick={() => { navigate('/notifications'); onClose(); onNavClick?.(); }}
          className="w-full py-3 text-[12px] font-semibold transition-colors"
          style={{ color: 'var(--pro-azure)', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--sys-bg-accent)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          View all notifications
        </button>
      </div>
    </PanelShell>
  );
};
