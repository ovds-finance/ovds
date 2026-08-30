import { useEffect, useRef } from 'react';
import { setupApi, type CompanySetupProgress } from '../services/setupApi';

/** Auto-mark setup wizard steps complete when compliance readiness is met */
export function useSetupComplianceSync(
  companyId: string | null | undefined,
  opts: {
    eimsReady?: boolean;
    securityScore?: number;
    onSynced?: (progress: CompanySetupProgress, synced: string[]) => void;
  },
) {
  const syncedRef = useRef<string>('');
  const onSyncedRef = useRef(opts.onSynced);
  onSyncedRef.current = opts.onSynced;

  useEffect(() => {
    if (!companyId) return;

    const eimsTrigger = opts.eimsReady === true;
    const securityTrigger = (opts.securityScore ?? 0) >= 90;
    if (!eimsTrigger && !securityTrigger) return;

    const key = `${companyId}:${eimsTrigger}:${opts.securityScore ?? 0}`;
    if (syncedRef.current === key) return;
    syncedRef.current = key;

    setupApi
      .syncComplianceSteps(companyId, {
        eimsReady: eimsTrigger || undefined,
        securityScore: securityTrigger ? opts.securityScore : undefined,
      })
      .then(({ progress, synced }) => {
        if (synced.length > 0) onSyncedRef.current?.(progress, synced);
      })
      .catch(() => {
        syncedRef.current = '';
      });
  }, [companyId, opts.eimsReady, opts.securityScore]);
}
