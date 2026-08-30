/**
 * useLastRefreshed — tracks when data was last fetched and provides
 * a human-readable label that updates every 30 seconds.
 *
 * Usage:
 *   const { stamp, touch, label } = useLastRefreshed();
 *   // call touch() after each successful fetch
 *   // render: <span>{label}</span>  →  "Updated 2m ago"
 */
import { useState, useEffect, useCallback } from 'react';

interface UseLastRefreshedResult {
  /** The raw Date of the last refresh, or null if never refreshed */
  stamp: Date | null;
  /** Call this after a successful data fetch */
  touch: () => void;
  /** Human-readable label: "Updated just now" | "Updated 3m ago" | "Never refreshed" */
  label: string;
}

function formatLabel(stamp: Date | null): string {
  if (!stamp) return 'Never refreshed';
  const diff = Date.now() - stamp.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return 'Updated just now';
  if (secs < 60) return `Updated ${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `Updated ${hrs}h ago`;
}

export function useLastRefreshed(): UseLastRefreshedResult {
  const [stamp, setStamp] = useState<Date | null>(null);
  const [label, setLabel] = useState('Never refreshed');

  const touch = useCallback(() => {
    const now = new Date();
    setStamp(now);
    setLabel('Updated just now');
  }, []);

  // Recompute label every 30s
  useEffect(() => {
    if (!stamp) return;
    const id = setInterval(() => {
      setLabel(formatLabel(stamp));
    }, 30_000);
    return () => clearInterval(id);
  }, [stamp]);

  return { stamp, touch, label };
}

