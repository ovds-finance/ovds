import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { getOfflineCapabilities, getOfflineSLAReport } from '../services/api';

export interface OfflineCapabilities {
  canWorkOffline: boolean;
  requiresResilience: boolean;
  offlineStorageLimit: number;
  syncStrategy: string;
  pendingSyncCount: number;
  regulatedSectors: string[];
  companySectors: string[];
  regulatedSector?: string;
}

export interface OfflineSLAViolation {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  hoursQueued: number;
  deviceId: string;
}

export interface OfflineSLAReport {
  totalPending: number;
  syncedToday: number;
  slaViolations: number;
  violations: OfflineSLAViolation[];
  slaHours: number;
  regulation: string;
}

export function useOfflineResilience(companyId?: string | null) {
  const [capabilities, setCapabilities] = useState<OfflineCapabilities | null>(null);
  const [slaReport, setSlaReport] = useState<OfflineSLAReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOfflineCapabilities();
      setCapabilities(data);
    } catch {
      // Non-fatal — offline capabilities unavailable (module not enabled)
    } finally {
      setLoading(false);
    }
  };

  const fetchSLAReport = async () => {
    if (!companyId) return;
    // Silently skip if the module isn't enabled on this instance
    try {
      const data = await getOfflineSLAReport();
      setSlaReport(data);
      if (data?.slaViolations > 0) {
        toast.error(
          `Offline sync SLA breach: ${data.slaViolations} invoice(s) exceed the ${data.slaHours}h sync window.`,
        );
      }
    } catch {
      // Non-fatal — offline SLA module not available on this instance
    }
  };

  useEffect(() => {
    fetchCapabilities();
    fetchSLAReport();
    // Refresh SLA every 15 minutes
    const interval = setInterval(fetchSLAReport, 15 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  return {
    capabilities,
    slaReport,
    loading,
    error,
    refresh: fetchCapabilities,
    refreshSLA: fetchSLAReport,
  };
}
