import {
  DEVICE_CONTROL_DEFAULT_SETTINGS,
  type CreateDeviceControlChangeRequestDTO,
  type DeviceControlCategory,
  type DeviceControlChangeRequestDTO,
  type DeviceControlPolicyDTO,
  type ReviewDeviceControlChangeRequestDTO,
} from '@ovds/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from './api';

const BASE = '/device-control';

function extract<T>(r: any): T {
  if (r && r.data && typeof r.data === 'object' && 'data' in r.data) return r.data.data as T;
  if (r && r.data !== undefined) return r.data as T;
  return r as T;
}

export type DeviceControlPolicy = DeviceControlPolicyDTO;
export type DeviceControlChangeRequest = DeviceControlChangeRequestDTO;

export function useDeviceControlPolicies() {
  return useQuery({
    queryKey: ['device-control', 'policies'],
    queryFn: () => api.get(`${BASE}/policies`).then((r: any) => extract<DeviceControlPolicy[]>(r)),
    staleTime: 20_000,
  });
}

export function useDeviceControlChangeRequests(filters?: {
  status?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['device-control', 'change-requests', filters ?? {}],
    queryFn: () =>
      api
        .get(`${BASE}/change-requests`, { params: filters })
        .then((r: any) => extract<DeviceControlChangeRequest[]>(r)),
    staleTime: 15_000,
  });
}

export function useCreateChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeviceControlChangeRequestDTO) =>
      api
        .post(`${BASE}/change-requests`, dto)
        .then((r: any) => extract<DeviceControlChangeRequest>(r)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device-control'] }),
  });
}

export function useSubmitChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api
        .post(`${BASE}/change-requests/${id}/submit`)
        .then((r: any) => extract<DeviceControlChangeRequest>(r)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device-control'] }),
  });
}

export function useReviewChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; dto: ReviewDeviceControlChangeRequestDTO }) =>
      api
        .post(`${BASE}/change-requests/${args.id}/review`, args.dto)
        .then((r: any) => extract<DeviceControlChangeRequest>(r)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device-control'] }),
  });
}

export function useCancelChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api
        .post(`${BASE}/change-requests/${id}/cancel`)
        .then((r: any) => extract<DeviceControlChangeRequest>(r)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device-control'] }),
  });
}

export function defaultSettingsFor(category: DeviceControlCategory) {
  return DEVICE_CONTROL_DEFAULT_SETTINGS[category];
}
