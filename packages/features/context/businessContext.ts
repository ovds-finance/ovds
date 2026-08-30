import { createContext, useContext } from 'react';

interface BusinessContextValue {
  companyId: string | null;
  selectedCompanyId: string | null;
  currency: string;
}

const BusinessContext = createContext<BusinessContextValue>({ companyId: null, selectedCompanyId: null, currency: 'ETB' });

export function useBusiness() {
  return useContext(BusinessContext);
}
