# 14 — Frontend State Management Deep Dive

## 1. State Classification

The frontend manages three distinct types of state:

| State Type | Technology | Scope | Example |
|-----------|-----------|-------|---------|
| Server State | React Query v5 | Global cache | VAT returns list, transactions |
| Global Client State | Zustand | Global stores | Auth, current organization, theme |
| Local Component State | useState / useReducer | Component | Form inputs, modal open/closed |

## 2. React Query Configuration

```typescript
// lib/api/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// Prefetch helper for route loaders
export function prefetchQuery(key, fetcher) {
  return queryClient.prefetchQuery({ queryKey: key, queryFn: fetcher });
}
```

## 3. Server State Hooks Pattern

Every feature defines its own query hooks following a consistent pattern:

```typescript
// features/vat-returns/hooks/use-vat-returns.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { vatReturnsApi } from '@/services/vat-returns.service';

export function useVatReturns(filters: VatReturnFilters, options?: UseQueryOptions) {
  return useQuery({
    queryKey: ['vat-returns', filters],
    queryFn: () => vatReturnsApi.list(filters),
    ...options,
  });
}

export function useVatReturn(id: string) {
  return useQuery({
    queryKey: ['vat-returns', id],
    queryFn: () => vatReturnsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateVatReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vatReturnsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vat-returns'] });
    },
  });
}

export function useInfiniteVatReturns(filters: VatReturnFilters) {
  return useInfiniteQuery({
    queryKey: ['vat-returns', 'infinite', filters],
    queryFn: ({ pageParam }) => vatReturnsApi.list({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
  });
}
```

## 4. Global Stores (Zustand)

### 4.1 Auth Store

```typescript
// stores/auth.store.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: true,
  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  clearAuth: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
```

### 4.2 Organization Store

```typescript
// stores/organization.store.ts
interface OrganizationState {
  current: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  setCurrent: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
  addOrganization: (org: Organization) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  current: null,
  organizations: [],
  isLoading: false,
  setCurrent: (current) => set({ current }),
  setOrganizations: (organizations) => set({ organizations }),
  addOrganization: (org) => set((s) => ({ organizations: [...s.organizations, org] })),
}));
```

### 4.3 UI Store

```typescript
// stores/ui.store.ts
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  organizationId: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setOrganizationId: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
  organizationId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  setOrganizationId: (organizationId) => set({ organizationId }),
}));
```

## 5. Form State Management

### 5.1 React Hook Form + Zod

```typescript
// features/vat-returns/components/return-form.tsx
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const VatReturnFormSchema = z.object({
  vatRegistrationId: z.string().cuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  items: z.array(
    z.object({
      type: z.enum(['sales', 'purchases', 'adjustments']),
      boxCode: z.string(),
      netAmount: z.number().positive(),
      vatRate: z.number().min(0).max(100),
      vatAmount: z.number().min(0),
      grossAmount: z.number().positive(),
    })
  ).min(1),
  notes: z.string().optional(),
});

type VatReturnFormData = z.infer<typeof VatReturnFormSchema>;

export function VatReturnForm({ onSubmit, defaultValues, isSubmitting }: VatReturnFormProps) {
  const form = useForm<VatReturnFormData>({
    resolver: zodResolver(VatReturnFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="vatRegistrationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VAT Registration</FormLabel>
              <JurisdictionSelect {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <VatReturnItemsField />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Return'}
        </Button>
      </form>
    </FormProvider>
  );
}
```

### 5.2 Field-Level Performance

```typescript
// components/forms/form-field.tsx
export function FormField({ control, name, render }: FormFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          {render({ field, error })}
          {error && <FormMessage>{error.message}</FormMessage>}
        </FormItem>
      )}
    />
  );
}
```

## 6. Optimistic Updates

```typescript
// features/transactions/hooks/use-update-transaction.ts
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) =>
      transactionsApi.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', id] });
      const previous = queryClient.getQueryData(['transactions', id]);

      queryClient.setQueryData(['transactions', id], (old: Transaction) => ({
        ...old,
        ...data,
      }));

      return { previous };
    },

    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['transactions', variables.id], context.previous);
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.id] });
    },
  });
}
```

## 7. Cache Invalidation Strategy

```typescript
// lib/api/invalidate.ts
export const invalidateQueries = {
  vatReturns: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['vat-returns'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  },

  transactions: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  },

  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries();
  },
};
```

## 8. Error Handling

```typescript
// lib/api/error-handler.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message);
  }
}

// services/api.ts
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.data) {
      const { error: apiError } = error.response.data;
      throw new ApiError(
        error.response.status,
        apiError.code,
        apiError.message,
        apiError.details,
      );
    }
    throw new ApiError(500, 'NETWORK_ERROR', 'Network request failed');
  },
);

// React Query error boundary
export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => {
        if (error instanceof ApiError) {
          return <ErrorDisplay statusCode={error.statusCode} message={error.message} onRetry={resetErrorBoundary} />;
        }
        return <ErrorDisplay message="Something went wrong" onRetry={resetErrorBoundary} />;
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## 9. Loading States

```typescript
// components/common/loading-states.tsx
export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function QueryLoading({ query }: { query: UseQueryResult }) {
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorDisplay error={query.error} />;
  return null;
}
```

## 10. DevTools

```typescript
// main.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
```
