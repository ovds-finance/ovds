import { HealthStatus, NetworkEvent } from '@ovds/ui';
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

import { apiGetBackground, apiPost } from './api';

// -- Connection Status Types --------------------------------------------------
interface HealthContextType {
  health: HealthStatus;
  recentErrors: NetworkEvent[];
  triggerCleanup: () => Promise<void>;
  checkHealth: () => Promise<void>;
  /** true when the API is completely unreachable (502/503/504/network error) */
  isServiceDown: boolean;
}

// Module-level capture — executed once when the module loads.
// All useHealthCheck instances share this reference, preventing chained fetch patches
// in environments with multiple component instances or React StrictMode remounts.
const _originalWindowFetch = typeof window !== 'undefined' ? window.fetch : undefined;

// -- Health Service Hook ------------------------------------------------------
export const useHealthCheck = () => {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'unhealthy',
    lastCheck: undefined,
    apiVersion: '',
    dbConnection: 'ERROR',
  });
  const [recentErrors, setRecentErrors] = useState<NetworkEvent[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const isCheckingRef = React.useRef(false);

  const checkHealth = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);
    try {
      const _data = await apiGetBackground<any>('/health/ready');
      setHealth({
        status: 'healthy',
        lastCheck: new Date(),
        timestamp: new Date(),
        apiVersion: '',
        dbConnection: 'OK',
      });
    } catch (error: any) {
      const statusCode: number | undefined = error?.response?.status;
      setHealth({
        status: 'unhealthy',
        lastCheck: new Date(),
        timestamp: new Date(),
        apiVersion: '',
        dbConnection: 'ERROR',
        statusCode,
        error: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, []);  

  // Auto-check every 30s + on mount
  // Delay prevents React StrictMode double-invoke and gives backend time to warm up after restart
  useEffect(() => {
    const initTid = setTimeout(() => checkHealth(), 2_000);
    const interval = setInterval(checkHealth, 30_000);
    return () => {
      clearTimeout(initTid);
      clearInterval(interval);
    };
  }, [checkHealth]);

  const triggerCleanup = useCallback(async () => {
    try {
      await apiPost('/health/cleanup');
      await checkHealth();
    } catch (error) {
      console.error('Cleanup trigger failed:', error);
    }
  }, [checkHealth]);

  // Network interceptor — track failed requests
  useEffect(() => {
    if (!_originalWindowFetch) return;
    // Guard: only patch if window.fetch hasn't been modified since we captured the original
    // This prevents conflicts with other subsystems that may also patch fetch.
    if (window.fetch !== _originalWindowFetch && (window.fetch as any)?.__ovdsPatched) return;

    const patchedFetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const start = performance.now();
      return _originalWindowFetch(input, init).then((res) => {
        const duration = performance.now() - start;
        if (!res.ok) {
          const event: NetworkEvent = {
            url: typeof input === 'string' ? input : input.toString(),
            method: (init?.method || 'GET').toUpperCase(),
            status: res.status,
            duration: Math.round(duration),
            timestamp: new Date(),
            isError: true,
          };
          setRecentErrors((prev) => [event, ...prev.slice(0, 9)]);
        }
        return res;
      });
    };
    (patchedFetch as any).__ovdsPatched = true;
    window.fetch = patchedFetch;
    return () => {
      // Only restore if we are still the active patch
      if (window.fetch === patchedFetch) {
        window.fetch = _originalWindowFetch;
      }
    };
  }, []);

  const isServiceDown =
    health.status === 'unhealthy' &&
    (health.statusCode === 502 ||
      health.statusCode === 503 ||
      health.statusCode === 504) &&
    !!health.statusCode; // only show overlay for explicit gateway errors, not network errors

  return { health, recentErrors, triggerCleanup, checkHealth, isChecking, isServiceDown };
};

// -- Health Context for global access -----------------------------------------
const HealthContext = createContext<HealthContextType | null>(null);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const healthApi = useHealthCheck();
  return React.createElement(HealthContext.Provider, { value: healthApi }, children);
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) throw new Error('useHealth must be used within HealthProvider');
  return context;
};
