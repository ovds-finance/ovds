import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  REGULATED_SECTORS,
  RegulatedSector,
  isRegulatedSector as isRegulatedSectorRaw,
  OfflineCapabilities,
  OfflineQueueStatus,
  OfflineInvoiceQueue,
  OfflineInvoiceData,
  EthiopianEconomicSector,
  ETHIOPIAN_ECONOMIC_SECTORS,
  BusinessEntityType,
  ENTITY_CHARACTERISTICS,
  WorkPermit,
  ResidenceIdCard,
  DissolutionProcess,
} from '@ovds/shared';

export function isRegulatedSector(businessType?: string): boolean {
  if (!businessType) return false;
  return isRegulatedSectorRaw({ businessType });
}

export function useOfflineCapabilities(companyId?: string) {
  return useQuery<OfflineCapabilities>({
    queryKey: ['offline-capabilities', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/offline/capabilities?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch offline capabilities');
      return response.json();
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegulatedSectors() {
  return useQuery<{ sectors: RegulatedSector[]; regulation: string; requiresOffline: boolean; legalNotice: string }>({
    queryKey: ['regulated-sectors'],
    queryFn: async () => {
      const response = await fetch('/api/offline/regulated-sectors');
      if (!response.ok) throw new Error('Failed to fetch regulated sectors');
      return response.json();
    },
    staleTime: Infinity,
  });
}

export function useBusinessSectors() {
   return useQuery<{ sectors: Record<string, EthiopianEconomicSector[]>; gdpBreakdown: Record<string, number> }>({
     queryKey: ['business-sectors'],
     queryFn: async () => {
       const sectors = ETHIOPIAN_ECONOMIC_SECTORS.reduce((acc, sector) => {
         acc[sector.classification] = acc[sector.classification] || [];
         acc[sector.classification].push(sector);
         return acc;
       }, {} as Record<string, EthiopianEconomicSector[]>);
       const gdpBreakdown = ETHIOPIAN_ECONOMIC_SECTORS.reduce((acc, sector) => {
         if (sector.gdpContribution) acc[sector.subSector] = sector.gdpContribution;
         return acc;
       }, {} as Record<string, number>);
       return { sectors, gdpBreakdown };
     },
     staleTime: Infinity,
   });
 }

export function useEntityCharacteristics(entityType: BusinessEntityType) {
  return ENTITY_CHARACTERISTICS[entityType];
}

export function useQueueOfflineInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerName: string;
      customerTin?: string;
      customerPhone?: string;
      customerAddress?: string;
      items: { description: string; quantity: number; unitPrice: number; vatRate?: number }[];
      notes?: string;
      paymentMethod?: 'CASH' | 'CHEQUE' | 'CARD' | 'MOBILE';
      deviceId: string;
      fiscalYear?: string;
    }) => {
      const response = await fetch('/api/offline/queue-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to queue offline invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offline-capabilities'] });
      queryClient.invalidateQueries({ queryKey: ['queued-invoices'] });
    },
  });
}

export function useProcessSyncQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId?: string) => {
      const response = await fetch('/api/offline/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      if (!response.ok) throw new Error('Failed to process sync queue');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offline-capabilities'] });
      queryClient.invalidateQueries({ queryKey: ['queued-invoices'] });
    },
  });
}

export function useQueuedInvoices(companyId?: string, deviceId?: string) {
  return useQuery<OfflineInvoiceQueue[]>({
    queryKey: ['queued-invoices', companyId, deviceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      if (deviceId) params.set('deviceId', deviceId);
      const response = await fetch(`/api/offline/queued-invoices?${params}`);
      if (!response.ok) throw new Error('Failed to fetch queued invoices');
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useRegisterDevice() {
  return useMutation({
    mutationFn: async (data: { deviceId: string; deviceName: string; deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'POS' }) => {
      const response = await fetch('/api/offline/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to register device');
      return response.json();
    },
  });
}

export function useWorkPermits(employeeId?: string) {
  return useQuery<WorkPermit[]>({
    queryKey: ['work-permits', employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/work-permits`);
      if (!response.ok) throw new Error('Failed to fetch work permits');
      return response.json();
    },
    enabled: !!employeeId,
  });
}

export function useResidenceId(employeeId?: string) {
  return useQuery<ResidenceIdCard | null>({
    queryKey: ['residence-id', employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/residence-id`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!employeeId,
  });
}

export function useDissolutionProcess(companyId?: string) {
  return useQuery<DissolutionProcess | null>({
    queryKey: ['dissolution-process', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/dissolution`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!companyId,
  });
}

export function useInitiateDissolution() {
  return useMutation({
    mutationFn: async (data: { companyId: string; resolutionDocument: string; liquidatorId: string }) => {
      const response = await fetch(`/api/companies/${data.companyId}/dissolution/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to initiate dissolution');
      return response.json();
    },
  });
}