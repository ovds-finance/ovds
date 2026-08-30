/**
 * OfflineSyncBanner — shows a persistent top banner when there are
 * offline-queued actions waiting to sync.
 *
 * Shows:
 *  - Queue count + oldest pending action age
 *  - "Sync Now" button (manual drain)
 *  - Spinning indicator while syncing
 *  - Auto-hides when queue is empty
 *
 * Placement: inside Layout.tsx, below the offline banner, above page content.
 */
import React, { useEffect, useState } from 'react';
import { RefreshCw, WifiOff, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { getQueueStats, type QueuedActionType } from '../services/offlineQueue';

// ─── Label map ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Partial<Record<QueuedActionType, string>> = {
  ATTENDANCE_CHECK_IN:  'Attendance check-in',
  ATTENDANCE_CHECK_OUT: 'Attendance check-out',
  EXPENSE_CREATE:       'Expense submission',
  INVOICE_DRAFT_SAVE:   'Invoice draft',
  JOURNAL_ENTRY_SAVE:   'Journal entry',
  LEAVE_REQUEST:        'Leave request',
};

// ─── Relative time helper ─────────────────────────────────────────────────────

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OfflineSyncBannerProps {
  /** zIndex value for sticky positioning */
  zIndex?: number;
}

const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ zIndex = 49 }) => {
  const { queueCount, isSyncing, syncNow } = useOfflineQueue();
  const [expanded, setExpanded]           = useState(false);
  const [dismissed, setDismissed]         = useState(false);
  const [byType, setByType]               = useState<Partial<Record<QueuedActionType, number>>>({});
  const [oldestAt, setOldestAt]           = useState<number | null>(null);

  // Reset dismissed state when new items are queued
  useEffect(() => {
    if (queueCount > 0) setDismissed(false);
  }, [queueCount]);

  // Load breakdown when expanded
  useEffect(() => {
    if (!expanded || queueCount === 0) return;
    getQueueStats().then((s) => {
      setByType(s.byType);
      setOldestAt(s.oldestAt);
    });
  }, [expanded, queueCount]);

  if (queueCount === 0 || dismissed) return null;

  return (
    <div
      style={{ zIndex }}
      className="sticky top-0 bg-amber-500 text-white shadow-md animate-in slide-in-from-top duration-200"
      role="status"
      aria-live="polite"
      aria-label={`${queueCount} offline action${queueCount !== 1 ? 's' : ''} pending sync`}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-1.5 shrink-0">
          {isSyncing ? (
            <RefreshCw size={12} className="animate-spin" aria-hidden="true" />
          ) : (
            <WifiOff size={12} aria-hidden="true" />
          )}
          <span className="text-[11px] font-bold">
            {isSyncing
              ? 'Syncing…'
              : `${queueCount} offline action${queueCount !== 1 ? 's' : ''} pending`}
          </span>
        </div>

        {oldestAt && !isSyncing && (
          <span className="text-[10px] text-amber-100 hidden sm:inline">
            · oldest {relTime(oldestAt)}
          </span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {!isSyncing && (
            <button
              onClick={() => syncNow()}
              className="flex items-center gap-1 text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors"
              aria-label="Sync offline actions now"
            >
              <RefreshCw size={10} />
              Sync Now
            </button>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            aria-label={expanded ? 'Collapse details' : 'Show details'}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Dismiss offline sync banner"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="border-t border-amber-400/50 px-4 py-2.5 bg-amber-600/30 animate-in fade-in duration-150">
          <p className="text-[10px] font-bold text-amber-100 uppercase tracking-wider mb-2">
            Pending actions by type
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(byType) as [QueuedActionType, number][]).map(([type, count]) => (
              <span
                key={type}
                className="flex items-center gap-1.5 text-[10px] font-semibold bg-white/20 px-2.5 py-1 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-200 shrink-0" />
                {TYPE_LABELS[type]} × {count}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-amber-200 mt-2 leading-relaxed">
            These actions were captured offline and will be sent to the server as soon as
            connectivity is restored. Tap "Sync Now" to attempt immediately.
          </p>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncBanner;

