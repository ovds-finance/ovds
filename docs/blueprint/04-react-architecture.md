# 04 — React Frontend Architecture

## 1. Technology Stack

| Concern               | Choice               | Rationale                                                         |
|-----------------------|----------------------|-------------------------------------------------------------------|
| Build Tool            | Vite                 | Fast HMR, native ESM, Nx integration                              |
| UI Framework          | React 18             | Concurrent features, Suspense, large ecosystem                    |
| Styling               | Tailwind CSS v3      | Utility-first, consistent design system, dark mode support        |
| Component Primitives  | Radix UI             | Accessible, unstyled, composable primitives                       |
| State Management       | Zustand              | Minimal boilerplate, devtools, type-safe                          |
| Server State          | TanStack Query v5    | Caching, deduplication, background refetch, optimistic updates    |
| Forms                 | React Hook Form v7   | Performance, schema validation with Zod                           |
| Routing               | React Router v6      | Nested routes, loaders, data APIs                                 |
| Charts                | Recharts             | Declarative, React-native, good accessibility                     |
| Tables                | TanStack Table v8    | Headless, flexible sorting/filtering/pagination                  |
| i18n                  | react-i18next        | Industry standard, namespaces, interpolation                      |
| HTTP Client           | Axios                | Interceptors, request/response transformation, timeout config     |
| Testing               | Vitest + Testing Lib | Fast unit/integration; Playwright for E2E                         |

## 2. Feature-Based Folder Structure

```
apps/web/src/
├── features/                    # Feature modules (domain logic + UI)
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   ├── mfa-form.tsx
│   │   │   └── forgot-password-form.tsx
│   │   ├── hooks/
│   │   │   └── use-auth.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── stores/
│   │   │   └── auth.store.ts
│   │   └── types/
│   │       └── auth.types.ts
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── dashboard-shell.tsx
│   │   │   ├── return-status-card.tsx
│   │   │   ├── upcoming-deadlines.tsx
│   │   │   └── recent-transactions.tsx
│   │   ├── hooks/
│   │   │   └── use-dashboard-stats.ts
│   │   └── services/
│   │       └── dashboard.service.ts
│   ├── vat-returns/
│   │   ├── components/
│   │   │   ├── return-list.tsx
│   │   │   ├── return-form.tsx
│   │   │   ├── return-review.tsx
│   │   │   ├── return-submit-dialog.tsx
│   │   │   ├── return-item-row.tsx
│   │   │   └── return-status-badge.tsx
│   │   ├── hooks/
│   │   │   ├── use-vat-return.ts
│   │   │   └── use-return-validation.ts
│   │   ├── services/
│   │   │   └── vat-return.service.ts
│   │   ├── stores/
│   │   │   └── vat-return.store.ts
│   │   ├── types/
│   │   │   └── vat-return.types.ts
│   │   └── utils/
│   │       └── vat-calculator.ts
│   ├── transactions/
│   ├── jurisdictions/
│   ├── integrations/
│   ├── billing/
│   ├── reporting/
│   └── organizations/
├── components/                  # Shared app-level components
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── organization-switcher.tsx
│   │   └── mobile-nav.tsx
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── common/
├── hooks/                       # Global custom hooks
│   ├── use-media-query.ts
│   ├── use-local-storage.ts
│   ├── use-debounce.ts
│   └── use-clipboard.ts
├── stores/                      # Zustand global stores
│   ├── auth.store.ts
│   ├── organization.store.ts
│   ├── ui.store.ts
│   └── notification.store.ts
├── services/                    # API layer
│   ├── api.ts                   # Axios instance
│   ├── auth.service.ts
│   ├── vat-returns.service.ts
│   ├── transactions.service.ts
│   ├── organizations.service.ts
│   └── types.ts                 # API response types
├── lib/                         # Utility libraries
│   ├── api/
│   │   └── query-client.ts      # React Query client setup
│   ├── auth/
│   │   └── auth-context.tsx     # Auth provider
│   ├── utils/
│   │   ├── cn.ts                # Classname utility
│   │   ├── format.ts            # Date/number formatting
│   │   ├── currency.ts          # Currency formatting
│   │   └── validation.ts        # Shared validation helpers
│   ├── constants/
│   │   ├── countries.ts         # ISO country list with VAT info
│   │   ├── currencies.ts        # ISO currency list
│   │   └── vat-rates.ts         # EU VAT rate defaults
│   └── error-handler.ts         # Global error boundary
├── styles/
│   ├── global.css
│   ├── variables.css
│   ├── tailwind.css
│   └── themes/
│       ├── light.css
│       └── dark.css
├── types/
│   ├── api.d.ts
│   ├── auth.d.ts
│   ├── vat-returns.d.ts
│   └── index.ts
├── routes/
│   ├── index.tsx                # Root route with layout
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── dashboard/
│   │   └── index.tsx
│   ├── organizations/
│   │   ├── index.tsx
│   │   ├── settings.tsx
│   │   └── members.tsx
│   ├── vat-registrations/
│   │   ├── index.tsx
│   │   ├── new.tsx
│   │   └── [id].tsx
│   ├── vat-returns/
│   │   ├── index.tsx
│   │   ├── new.tsx
│   │   ├── [id].tsx
│   │   └── [id]/review.tsx
│   ├── transactions/
│   │   ├── index.tsx
│   │   ├── import.tsx
│   │   └── [id].tsx
│   ├── reports/
│   │   ├── index.tsx
│   │   ├── vat-summary.tsx
│   │   └── export.tsx
│   ├── settings/
│   │   ├── profile.tsx
│   │   ├── organization.tsx
│   │   ├── integrations.tsx
│   │   └── billing.tsx
│   └── admin/
│       ├── users.tsx
│       ├── organizations.tsx
│       └── system.tsx
├── App.tsx
├── main.tsx
├── vite-env.d.ts
└── index.html
```

## 3. State Management Architecture

### 3.1 Server State (React Query)

All server-derived data lives in React Query. Features define their own query keys and hooks:

```typescript
// features/vat-returns/hooks/use-vat-return.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vatReturnsService } from '../services/vat-return.service';

export function useVatReturn(id: string) {
  return useQuery({
    queryKey: ['vat-returns', id],
    queryFn: () => vatReturnsService.getById(id),
    enabled: !!id,
  });
}

export function useVatReturns(filters: VatReturnFilters) {
  return useQuery({
    queryKey: ['vat-returns', filters],
    queryFn: () => vatReturnsService.list(filters),
  });
}

export function useCreateVatReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vatReturnsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vat-returns'] });
    },
  });
}
```

### 3.2 Client State (Zustand)

Client-only state (UI preferences, modals, sidebar state):

```typescript
// stores/ui.store.ts
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  organizationId: string | null;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setOrganization: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  organizationId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setOrganization: (id) => set({ organizationId: id }),
}));
```

### 3.3 Auth State (Zustand + React Query)

```typescript
// stores/auth.store.ts
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));
```

## 4. Routing and Data Loading

React Router v6 with data loaders for prefetching:

```typescript
// routes/vat-returns/[id].tsx
import { useParams } from 'react-router-dom';
import { useVatReturn } from '@/features/vat-returns/hooks/use-vat-return';

export const Route = createFileRoute('/vat-returns/$id')({
  component: VatReturnPage,
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ['vat-returns', params.id],
      queryFn: () => vatReturnsService.getById(params.id),
    }),
});

function VatReturnPage() {
  const { id } = useParams();
  const { data: vatReturn, isLoading } = useVatReturn(id);

  if (isLoading) return <Skeleton className="h-96" />;
  if (!vatReturn) return <EmptyState message="Return not found" />;

  return (
    <div className="space-y-6">
      <PageHeader title={`VAT Return ${vatReturn.reference}`} />
      <ReturnDetails return={vatReturn} />
      <ReturnItems items={vatReturn.items} />
    </div>
  );
}
```

## 5. Form Handling

React Hook Form + Zod for type-safe forms:

```typescript
// features/vat-returns/components/return-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ReturnFormSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  vatRegistrationId: z.string().cuid(),
  items: z.array(
    z.object({
      type: z.enum(['sales', 'purchases', 'adjustments']),
      boxCode: z.string(),
      netAmount: z.number().positive(),
      vatRate: z.number().min(0).max(100),
      vatAmount: z.number().min(0),
    })
  ).min(1),
});

type ReturnFormData = z.infer<typeof ReturnFormSchema>;

export function ReturnForm({ onSubmit, defaultValues }: ReturnFormProps) {
  const form = useForm<ReturnFormData>({
    resolver: zodResolver(ReturnFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="periodStart"
        label="Period Start"
        render={({ field }) => (
          <DatePicker {...field} />
        )}
      />
      <FormField
        control={form.control}
        name="items"
        render={({ field }) => (
          <VatReturnItemsField items={field.value} onChange={field.onChange} />
        )}
      />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Save Return
      </Button>
    </form>
  );
}
```

## 6. API Client

Axios instance with interceptors:

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

// Request interceptor: attach auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Organization-ID'] = useAuthStore.getState().organizationId;
  return config;
});

// Response interceptor: handle 401/403, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 7. Shared UI Component Library (libs/ui)

Built with Radix UI primitives + Tailwind:

```typescript
// libs/ui/src/lib/components/ui/button/button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

## 8. VAT-Specific Components

```typescript
// libs/ui/src/lib/components/vat/vat-rate-input/vat-rate-input.tsx
export function VatRateInput({ value, onChange, rates, disabled }: VatRateInputProps) {
  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        {rates.map((rate) => (
          <SelectItem key={rate.code} value={rate.code}>
            {rate.name} ({rate.rate}%)
          </SelectItem>
        ))}
      </Select>
      <Input
        type="number"
        value={rates.find(r => r.code === value)?.rate ?? 0}
        disabled
        className="w-24"
      />
    </div>
  );
}

// libs/ui/src/lib/components/vat/jurisdiction-select/jurisdiction-select.tsx
export function JurisdictionSelect({ value, onChange, jurisdictions }: JurisdictionSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      {jurisdictions.map((jurisdiction) => (
        <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
          {jurisdiction.name} ({jurisdiction.countryCode})
        </SelectItem>
      ))}
    </Select>
  );
}
```

## 9. Theming

CSS custom properties for light/dark mode:

```css
/* styles/variables.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
}
```

## 10. Accessibility

- All interactive elements have visible focus states.
- Radix UI primitives manage ARIA attributes.
- Color contrast meets WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text).
- Keyboard navigation for all modals, dropdowns, and tables.
- Screen reader announcements for dynamic content (React Aria Live Region).

## 11. Internationalization

```typescript
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: await import('./locales/en.json') },
    de: { translation: await import('./locales/de.json') },
    fr: { translation: await import('./locales/fr.json') },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Usage in components
function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('vat_returns.title')}</h1>;
}
```

## 12. Error Boundaries

```typescript
// lib/error-handler.tsx
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div role="alert" className="p-8">
          <h2>Something went wrong</h2>
          <pre>{error.message}</pre>
          <Button onClick={resetErrorBoundary}>Try again</Button>
        </div>
      )}
      onError={(error) => console.error('Caught by error boundary:', error)}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## 13. Performance Optimizations

- **Code Splitting**: Routes lazy-loaded with `React.lazy` + `Suspense`.
- **Bundle Analysis**: `rollup-plugin-visualizer` in CI.
- **Image Optimization**: `next/image` equivalent via `vite-imagetools` + responsive srcset.
- **Memoization**: `React.memo` for table rows, `useMemo` for derived calculations.
- **Virtualization**: `@tanstack/react-virtual` for long transaction lists (1000+ rows).

## 14. Design System Tokens

| Token                    | Value         | Usage                           |
|--------------------------|---------------|----------------------------------|
| `--radius`               | 0.5rem (8px)  | Card, input, button borders      |
| `--font-sans`            | Inter         | Body text                       |
| `--font-mono`            | JetBrains Mono| Code, amounts                   |
| `--text-xs` through `xl` | Tailwind scale | Typography scale                 |
| `--success`              | green-600     | Accepted returns, successful ops |
| `--warning`              | amber-500     | Pending deadlines, warnings      |
| `--destructive`          | red-600       | Rejected returns, errors         |
| `--info`                 | blue-600      | Informational messages           |
