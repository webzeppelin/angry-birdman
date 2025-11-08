import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Custom render function that wraps components with common providers
 * for testing (React Query, Router, Auth)
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    route = '/',
    ...renderOptions
  }: RenderOptions & {
    queryClient?: QueryClient;
    route?: string;
  } = {}
) {
  // Set initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Custom render function that wraps components with React Query only
 * (useful for testing components that don't need routing or auth)
 */
export function renderWithQuery(
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  }: RenderOptions & {
    queryClient?: QueryClient;
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Wait for React Query to finish all pending queries and mutations
 */
export async function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
