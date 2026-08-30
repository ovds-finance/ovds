import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../services/notificationsApi';

export function useNotifications(params: { page?: number; limit?: number; read?: boolean } = {}) {
  const [items, setItems]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [res, unreadRes] = await Promise.all([
        notificationsApi.list(params),
        notificationsApi.unread(),
      ]);
      if (Array.isArray(res)) { setItems(res); setTotal(res.length); }
      else { setItems(res.data ?? []); setTotal(res.total ?? 0); }
      setUnread(unreadRes?.count ?? unreadRes ?? 0);
    } catch (e: any) { setError(e?.message ?? 'Failed to load notifications'); }
    finally { setLoading(false); }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }, []);

  return { items, total, unread, loading, error, refetch: fetch, markRead };
}
