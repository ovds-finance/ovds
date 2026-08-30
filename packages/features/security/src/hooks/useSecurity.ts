import { useQuery } from '@tanstack/react-query';
import { securityApi } from '../services/securityApi';

export function useSecurityChecklist() {
  return useQuery({ queryKey: ['security', 'checklist'], queryFn: () => securityApi.checklist() });
}

export function useSecurityReadiness() {
  return useQuery({ queryKey: ['security', 'readiness'], queryFn: () => securityApi.readiness() });
}

export function useSecurityHealth() {
  return useQuery({ queryKey: ['security', 'health'], queryFn: () => securityApi.health() });
}

export function useSecurityAlerts(limit = 50) {
  return useQuery({
    queryKey: ['security', 'alerts', limit],
    queryFn: () => securityApi.alerts(limit),
  });
}
