import { useQuery } from '@tanstack/react-query';

interface SystemModule {
  key: string;
  name: string;
  isEnabled: boolean;
  settings: Record<string, any> | null;
}

export function useActiveModules(companyId?: string) {
  return useQuery({
    queryKey: ['activeModules', companyId],
    queryFn: async (): Promise<string[]> => {
      if (!companyId) return [];

      const res = await fetch(`/api/system/modules?companyId=${encodeURIComponent(companyId)}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { success: boolean; data: SystemModule[] };
      if (!data.success) return [];

      return data.data
        .filter((m) => m.isEnabled)
        .map((m) => m.key);
    },
    enabled: !!companyId,
    staleTime: 5 * 60_000,
  });
}
