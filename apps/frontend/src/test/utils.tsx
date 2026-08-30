/**
 * Custom render utility that wraps components with all required providers.
 * Use this instead of @testing-library/react's render directly.
 *
 * Usage:
 *   import { render, screen } from '../test/utils';
 *   render(<MyComponent />);
 */
import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

// Fresh QueryClient per test — no shared cache between tests
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,        // don't retry in tests
        staleTime: Infinity, // don't refetch in tests
      },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
  initialRoute?: string;
}

function AllProviders({ children, initialRoute = '/' }: WrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

function customRender(
  ui: ReactElement,
  { initialRoute, ...options }: CustomRenderOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialRoute={initialRoute}>{children}</AllProviders>
    ),
    ...options,
  });
}

// Re-export everything from testing-library so tests only need one import
export * from '@testing-library/react';
export { customRender as render };

