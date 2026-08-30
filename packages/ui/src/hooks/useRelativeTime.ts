/**
 * useRelativeTime — returns a human-readable relative time string
 * that auto-updates every minute.
 *
 * Usage:
 *   const label = useRelativeTime(notification.createdAt);
 *   // → "just now" | "3m ago" | "2h ago" | "Apr 5"
 */
import { useState, useEffect } from 'react';

function format(date: Date): string {
  const diff = Date.now() - date.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 30) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function useRelativeTime(input: string | Date | null | undefined): string {
  const date = input ? new Date(input) : null;
  const dateTime = date?.getTime() ?? null;
  const [label, setLabel] = useState(() => (date ? format(date) : ''));

  useEffect(() => {
    if (!date) return;
    setLabel(format(date));
    const interval = setInterval(() => setLabel(format(date)), 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateTime]);

  return label;
}
