/**
 * NotificationBell — header bell icon with unread badge + dropdown feed.
 * Drop this into your top navigation bar.
 *
 * Usage:
 *   <NotificationBell />
 */
import React, { useRef, useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';
import { useAuth } from '../rbac/AuthContext';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead, remove } =
    useNotifications(isAuthenticated);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n: AppNotification) => {
    if (!n.isRead) markRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Bell button */}
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          width: 36, height: 36,
          borderRadius: 10,
          border: '1.5px solid var(--border, #e5e7eb)',
          background: open ? 'var(--lv-dim, #eef2ff)' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <Bell size={16} style={{ color: open ? 'var(--lv, #4f46e5)' : '#6b7280' }} />
        {unreadCount > 0 && (
          <span
            aria-hidden
            style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 18, height: 18,
              borderRadius: 999,
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.625rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: 'absolute', top: 44, right: 0,
            width: 360, maxHeight: 500,
            background: '#fff',
            border: '1.5px solid var(--border, #e5e7eb)',
            borderRadius: 14,
            boxShadow: '0 12px 48px rgba(0,0,0,.14)',
            zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border, #e5e7eb)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 6, padding: '1px 7px', borderRadius: 999,
                  background: 'var(--lv-dim, #eef2ff)',
                  color: 'var(--lv, #4f46e5)',
                  fontSize: '0.6875rem', fontWeight: 700,
                }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                title="Mark all read"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--lv, #4f46e5)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 8px', borderRadius: 6,
                }}
              >
                <CheckCheck size={13} /> All read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Bell size={32} style={{ color: '#d1d5db', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex', gap: 10,
                    padding: '11px 14px',
                    background: n.isRead ? 'transparent' : 'oklch(0.97 0.02 278)',
                    borderBottom: '1px solid var(--border, #f3f4f6)',
                    cursor: n.link ? 'pointer' : 'default',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      n.isRead ? 'transparent' : 'oklch(0.97 0.02 278)';
                  }}
                  onClick={() => handleClick(n)}
                >
                  {/* Unread dot */}
                  <div style={{ paddingTop: 5, flexShrink: 0 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: n.isRead ? '#d1d5db' : 'var(--lv, #4f46e5)',
                      transition: 'background .2s',
                    }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: n.isRead ? 500 : 700,
                      fontSize: '0.8125rem',
                      color: '#111827',
                      marginBottom: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {n.title}
                    </p>
                    <p style={{
                      fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#9ca3af', marginTop: 4 }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-end', gap: 4, flexShrink: 0,
                  }}>
                    {n.link && (
                      <ExternalLink size={12} style={{ color: '#9ca3af' }} aria-hidden />
                    )}
                    <button
                      type="button"
                      aria-label="Mark as read"
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#9ca3af', padding: 2, borderRadius: 4,
                        display: n.isRead ? 'none' : 'flex',
                      }}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete notification"
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#9ca3af', padding: 2, borderRadius: 4,
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border, #e5e7eb)',
            textAlign: 'center',
          }}>
            <button
              type="button"
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              style={{
                fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--lv, #4f46e5)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
