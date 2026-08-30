/**
 * useCustomFields — React hooks for fetching/saving custom field values
 * via the oRPC `customFields` contract.
 *
 * These hooks complement the existing CustomFieldRenderer component:
 * they provide a clean API for loading field definitions + values for an
 * entity, and for persisting edits, all through the oRPC contract.
 *
 * Usage:
 *   const { fields, values, loading, save } = useCustomFields('invoice', entityId, companyId);
 *   // fields: CustomFieldWithValue[] — definitions with current values
 *   // values: Record<fieldId, string | null>  — convenient map for forms
 *   // save(newValues): persists the map to the backend
 */
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpcUtils } from '../lib/orpc';
import type { CustomFieldFeature } from '@ovds/contracts/schemas';

type ValuesMap = Record<string, string | null>;

export interface UseCustomFieldsResult {
  fields: any[];
  values: ValuesMap;
  loading: boolean;
  save: (values: ValuesMap) => Promise<{ saved: number }>;
  refetch: () => void;
}

export function useCustomFields(
  feature: CustomFieldFeature,
  entityId?: string,
  companyId?: string | null,
): UseCustomFieldsResult {
  const queryClient = useQueryClient();

  const { data: fields, isLoading, refetch } = useQuery({
    ...orpcUtils.customFields.values.getForEntity.queryOptions({
      input: { entityId: entityId ?? '__none__', feature, companyId: companyId ?? undefined },
    }),
    enabled: !!companyId,
  });

  const { mutateAsync } = useMutation(
    orpcUtils.customFields.values.save.mutationOptions(),
  );

  const save = useCallback(
    async (values: ValuesMap): Promise<{ saved: number }> => {
      if (!entityId) return { saved: 0 };
      const result = await mutateAsync({
        entityId,
        feature,
        companyId: companyId ?? undefined,
        values,
      });
      queryClient.invalidateQueries({
        queryKey: orpcUtils.customFields.values.getForEntity.queryOptions({
          input: {
            entityId: entityId ?? '__none__',
            feature,
            companyId: companyId ?? undefined,
          },
        }).queryKey,
      });
      return result;
    },
    [entityId, feature, companyId, mutateAsync, queryClient],
  );

  const fieldList = useMemo(() => fields ?? [], [fields]);

  const values = useMemo(() => {
    const map: ValuesMap = {};
    for (const f of fieldList as any[]) {
      map[f.id] = f.value ?? null;
    }
    return map;
  }, [fieldList]);

  return {
    fields: fieldList,
    values,
    loading: isLoading,
    save,
    refetch: () => { refetch(); },
  };
}

/**
 * Hook for listing custom field definitions for a feature (without entity values).
 * Useful for admin/configuration pages.
 */
export function useCustomFieldDefs(
  feature: CustomFieldFeature,
  companyId?: string | null,
  opts?: { isActive?: boolean },
) {
  return useQuery({
    ...orpcUtils.customFields.fields.list.queryOptions({
      input: {
        companyId: companyId ?? undefined,
        feature,
        isActive: opts?.isActive,
        page: 1,
        limit: 200,
      },
    }),
  });
}

/**
 * Hook for creating a custom field definition.
 */
export function useCreateCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpcUtils.customFields.fields.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });
}

/**
 * Hook for updating a custom field definition.
 */
export function useUpdateCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpcUtils.customFields.fields.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });
}

/**
 * Hook for deleting a custom field definition.
 */
export function useDeleteCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpcUtils.customFields.fields.remove.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });
}
