/**
 * EntitlementContext
 *
 * Provides app-wide access to the company's monetization entitlements.
 * The backend is the SOLE authority — this context only caches the API response.
 *
 * Usage:
 *   const { isEntitled, status, loading } = useEntitlement();
 *   if (isEntitled('feature:gl')) { ... }
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { EntitlementStatusResponse, TrialRestriction } from '@ovds/ui';
import { getEntitlementStatus } from '../services/monetizationApi';
import { useAuth } from '../rbac/AuthContext';

// -- Types ---------------------------------------------------------------------

interface EntitlementContextValue {
  /** Full status response from the backend */
  status: EntitlementStatusResponse | null;
  /** True while the initial fetch is in progress */
  loading: boolean;
  /** Error from the last fetch attempt */
  error: string | null;
  /** Check if the current company is entitled to a feature key */
  isEntitled: (featureKey: string) => boolean;
  /** Slug of the active plan (e.g. "plan:business") */
  planSlug: string | null;
  /** Days remaining in the free trial (null if not on trial) */
  trialDaysRemaining: number | null;
  /** Whether the company is on a free trial */
  isOnTrial: boolean;
  /** Whether the company has an active paid subscription */
  hasActiveSubscription: boolean;
  /** Whether the company has any lifetime purchase */
  hasLifetimePurchase: boolean;
  /**
   * §4.2 Parsed trial restriction — null when not on trial.
   * Use this to show volume/structural cap warnings in the UI.
   */
  trialRestriction: TrialRestriction | null;
  /** Force-refresh the entitlement status from the backend */
  refresh: () => Promise<void>;
}

// -- Context -------------------------------------------------------------------

const EntitlementContext = createContext<EntitlementContextValue>({
  status: null,
  loading: false,
  error: null,
  isEntitled: () => false,
  planSlug: null,
  trialDaysRemaining: null,
  isOnTrial: false,
  hasActiveSubscription: false,
  hasLifetimePurchase: false,
  trialRestriction: null,
  refresh: async () => {},
});

// -- Provider ------------------------------------------------------------------

interface EntitlementProviderProps {
  children: React.ReactNode;
  /** Skip fetching if the user is not authenticated */
  isAuthenticated?: boolean;
}

export const EntitlementProvider: React.FC<EntitlementProviderProps> = ({
  children,
  isAuthenticated = true,
}) => {
  const [status, setStatus] = useState<EntitlementStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const { user } = useAuth();

  // SPURADMIN / SUPERADMIN / DEVELOPER bypass all entitlement checks
  const isBypassRole = ['SPURADMIN', 'SUPERADMIN', 'DEVELOPER'].includes(
    user?.role ?? '',
  );

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEntitlementStatus();
      setStatus(data);
    } catch (err: any) {
      // 401/403 are expected when not logged in — don't surface as errors
      if (err?.response?.status !== 401 && err?.response?.status !== 403) {
        setError(err?.message ?? 'Failed to load entitlement status');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchStatus();
    }
    if (!isAuthenticated) {
      fetchedRef.current = false;
      setStatus(null);
    }
  }, [isAuthenticated, fetchStatus]);

  const isEntitled = useCallback(
    (featureKey: string): boolean => {
      if (isBypassRole) return true;
      if (!status) return false;
      return status.entitledFeatures.includes(featureKey);
    },
    [status, isBypassRole],
  );

  const value: EntitlementContextValue = {
    status,
    loading,
    error,
    isEntitled,
    planSlug: status?.planSlug ?? null,
    trialDaysRemaining: status?.trialDaysRemaining ?? null,
    isOnTrial: !!status?.activeTrial,
    hasActiveSubscription: !!status?.activeSubscription,
    hasLifetimePurchase: (status?.lifetimePurchases?.length ?? 0) > 0,
    trialRestriction: (() => {
      const cfg = status?.activeTrial?.restrictionConfig;
      if (!cfg) return null;
      try { return JSON.parse(cfg) as TrialRestriction; } catch { return null; }
    })(),
    refresh: fetchStatus,
  };

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
};

// -- Hook ----------------------------------------------------------------------

export const useEntitlement = (): EntitlementContextValue =>
  useContext(EntitlementContext);

export default EntitlementContext;

