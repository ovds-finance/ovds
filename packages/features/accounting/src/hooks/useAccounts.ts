/**
 * useAccounts — chart of accounts with search and tree-building helper.
 *
 * Usage:
 *   import { useAccounts } from '@ovds/features/accounting';
 *   const { accounts, tree, loading, create } = useAccounts({ companyId });
 */
import { useState, useEffect, useCallback } from 'react';
import { accountsApi } from '../services/ovdsApi';

export interface AccountNode {
  id:       string;
  code:     string;
  name:     string;
  type:     string;
  category: string;
  parentId: string | null;
  isLeaf:   boolean;
  balance?: number;
  children: AccountNode[];
}

export interface UseAccountsResult {
  accounts:   any[];
  tree:       AccountNode[];
  loading:    boolean;
  saving:     boolean;
  error:      string | null;
  search:     string;
  setSearch:  (s: string) => void;
  refetch:    () => void;
  create:     (data: any) => Promise<any>;
  update:     (id: string, data: any) => Promise<any>;
}

function buildTree(flat: any[]): AccountNode[] {
  const map = new Map<string, AccountNode>();
  const roots: AccountNode[] = [];

  flat.forEach(a => {
    map.set(a.id, { ...a, children: [] });
  });

  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort each level by code
  function sortLevel(nodes: AccountNode[]) {
    nodes.sort((a, b) => a.code.localeCompare(b.code));
    nodes.forEach(n => sortLevel(n.children));
  }
  sortLevel(roots);
  return roots;
}

export function useAccounts(params: { companyId?: string } = {}): UseAccountsResult {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await accountsApi.list({ ...params, search: search || undefined, limit: 500 } as any);
      const rows = (res as any)?.data?.data ?? (res as any)?.data ?? res ?? [];
      setAccounts(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load chart of accounts');
    } finally {
      setLoading(false);
    }
  }, [params.companyId, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function mutate<T>(fn: () => Promise<T>): Promise<T | null> {
    setSaving(true); setError(null);
    try { const r = await fn(); await fetchAll(); return r; }
    catch (err: any) { setError(err?.message ?? 'Operation failed'); return null; }
    finally { setSaving(false); }
  }

  return {
    accounts,
    tree:    buildTree(accounts),
    loading, saving, error, search, setSearch,
    refetch: fetchAll,
    create:  (d)     => mutate(() => accountsApi.create(d))       as Promise<any>,
    update:  (id, d) => mutate(() => accountsApi.update(id, d))   as Promise<any>,
  };
}
