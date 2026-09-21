import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import toast from 'react-hot-toast';

import {
  prefixedRole,
  type BaseRole,
  type BusinessRole,
  type RoleBusinessType as BusinessType,
} from '../rbac/businessRoles';
import api from '../services/api';
import {
  SELECTED_COMPANY_ID_KEY,
  setSelectedCompanyId as setStoredCompanyId,
  clearSelectedCompanyId,
} from '../utils/storage';

interface Company {
  id: string;
  name: string;
  type: string;
  tin?: string;
}

interface BusinessContextType {
  companies: Company[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  loading: boolean;
  isMultiCompany: boolean;
  refreshCompanies: () => Promise<void>;
  /** The business type of the currently selected company (e.g. 'MANUFACTURING') */
  selectedBusinessType: BusinessType | null;
  /** Prefixed role for the current user + selected company type (e.g. 'ovds_manufacturing') */
  effectiveBusinessRole: (baseRole: BaseRole) => BusinessRole | null;
}

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined,
);

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Use local state for auth to decouple from AuthProvider and avoid circular dependency
  const [auth, setAuth] = useState<{ isAuthenticated: boolean; role?: string }>(() => {
    const token = localStorage.getItem('ovds_token');
    const userJson = localStorage.getItem('ovds_user');
    // Check token expiry the same way AuthContext does — an expired token means unauthenticated
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
          return { isAuthenticated: false };
        }
      } catch { /* malformed token — treat as unauthenticated */ }
    }
    try {
      const user = userJson ? JSON.parse(userJson) : null;
      return { isAuthenticated: !!token, role: user?.role };
    } catch {
      return { isAuthenticated: !!token };
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('ovds_token');
      const userJson = localStorage.getItem('ovds_user');
      try {
        const user = userJson ? JSON.parse(userJson) : null;
        setAuth({ isAuthenticated: !!token, role: user?.role });
      } catch {
        setAuth({ isAuthenticated: !!token });
      }
    };
    const handleSessionExpired = () => {
      setAuth({ isAuthenticated: false });
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ovds:session-expired', handleSessionExpired);
    window.addEventListener('ovds:session-cleared', handleSessionExpired);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ovds:session-expired', handleSessionExpired);
      window.removeEventListener('ovds:session-cleared', handleSessionExpired);
    };
  }, []);

  const { isAuthenticated, role } = auth;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyIdLocal] = useState<
    string | null
  >(() => localStorage.getItem(SELECTED_COMPANY_ID_KEY) || null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    if (!isAuthenticated) return;
    // Roles that don't have company access — skip the fetch silently to avoid 403 errors
    const NON_COMPANY_ROLES = ['CLIENT', 'EMPLOYEE'];
    if (role && NON_COMPANY_ROLES.includes(role)) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/ovds/companies');
      const data = res.data.data || [];
      setCompanies(data);

      // Auto-select first company if none selected — use functional updater
      // to read current state without adding it to deps (avoids re-fetch loop)
      setSelectedCompanyIdLocal((current) => {
        if (!current && data.length > 0) {
          setStoredCompanyId(data[0].id);
          return data[0].id;
        }
        // Validate: if current selection no longer exists, reset to first
        if (current && data.length > 0 && !data.find((c: Company) => c.id === current)) {
          setStoredCompanyId(data[0].id);
          return data[0].id;
        }
        return current;
      });
    } catch {
      toast.error('Failed to load companies.', { id: 'companies-error' });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  const setSelectedCompanyId = useCallback((id: string | null) => {
    setSelectedCompanyIdLocal(id);
    if (id) setStoredCompanyId(id);
    else clearSelectedCompanyId();
  }, []);

  const refreshCompanies = useCallback(async () => {
    await fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
    } else {
      setCompanies([]);
      // Clear stale company selection on logout
      clearSelectedCompanyId();
      setSelectedCompanyIdLocal(null);
      setLoading(false);
    }

    // Listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SELECTED_COMPANY_ID_KEY) {
        setSelectedCompanyIdLocal(e.newValue || null);
      }
    };

    // Listen for same-tab session clear (dispatched by AuthContext.logout)
    const handleSessionCleared = () => {
      setCompanies([]);
      clearSelectedCompanyId();
      setSelectedCompanyIdLocal(null);
      setLoading(false);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('ovds:session-cleared', handleSessionCleared);
    window.addEventListener('ovds:session-expired', handleSessionCleared);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ovds:session-cleared', handleSessionCleared);
      window.removeEventListener('ovds:session-expired', handleSessionCleared);
    };
  }, [isAuthenticated, fetchCompanies]);

  const value: BusinessContextType = {
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    loading,
    isMultiCompany: companies.length > 1,
    refreshCompanies,
    selectedBusinessType: (() => {
      const c = companies.find((x) => x.id === selectedCompanyId);
      return (c?.type as BusinessType) || null;
    })(),
    effectiveBusinessRole: (base: BaseRole) => {
      const c = companies.find((x) => x.id === selectedCompanyId);
      if (!c?.type) return null;
      return prefixedRole(base, c.type as BusinessType);
    },
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within BusinessProvider');
  }
  return context;
};
