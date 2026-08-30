import { useState, useEffect, useCallback } from 'react';
import { entitlementApi, productsApi } from '../services/monetizationApi';

export function useEntitlementStatus() {
  const [status, setStatus]   = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setStatus(await entitlementApi.status()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load entitlement status'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  const isEntitled = (featureKey: string): boolean => {
    if (!status) return false;
    return status.entitledFeatures?.includes(featureKey) ?? false;
  };
  return { status, loading, error, refresh: fetch, isEntitled };
}

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setProducts(await productsApi.list()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load products'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { products, loading, error, refetch: fetch };
}
