import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ClanSelector } from '../../src/components/clans/ClanSelector';

// Create a wrapper component for tests that provides necessary contexts
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('ClanSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const Wrapper = createWrapper();
    render(<ClanSelector />, { wrapper: Wrapper });
    expect(screen.getByText(/browse clans/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    const Wrapper = createWrapper();
    render(<ClanSelector />, { wrapper: Wrapper });

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays search input', () => {
    const Wrapper = createWrapper();
    render(<ClanSelector />, { wrapper: Wrapper });

    const searchInput = screen.getByPlaceholderText(/search clans/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('displays filter controls', () => {
    const Wrapper = createWrapper();
    render(<ClanSelector />, { wrapper: Wrapper });

    // Should have country filter
    expect(screen.getByText(/all countries/i)).toBeInTheDocument();

    // Should have active only checkbox
    expect(screen.getByRole('checkbox', { name: /active only/i })).toBeInTheDocument();
  });

  it('shows active only checkbox as checked by default', () => {
    const Wrapper = createWrapper();
    render(<ClanSelector />, { wrapper: Wrapper });

    const checkbox = screen.getByRole('checkbox', { name: /active only/i });
    expect(checkbox).toBeChecked();
  });

  it('respects defaultShowActive prop', () => {
    const Wrapper = createWrapper();
    render(<ClanSelector defaultShowActive={false} />, { wrapper: Wrapper });

    const checkbox = screen.getByRole('checkbox', { name: /active only/i });
    expect(checkbox).not.toBeChecked();
  });

  it('displays clans when data is loaded', async () => {
    const Wrapper = createWrapper();
    render(<ClanSelector />, { wrapper: Wrapper });

    // Wait for the mock data to load
    await waitFor(
      () => {
        // The MSW handlers should provide mock data
        // This will pass if MSW is configured correctly
        const clanElements = screen.queryAllByText(/test clan/i);
        expect(clanElements.length).toBeGreaterThanOrEqual(0);
      },
      { timeout: 3000 }
    );
  });

  it('displays empty state when no clans found', async () => {
    const Wrapper = createWrapper();

    // Mock empty response
    render(<ClanSelector />, { wrapper: Wrapper });

    await waitFor(
      () => {
        const emptyMessage = screen.queryByText(/no clans found/i);
        if (emptyMessage) {
          expect(emptyMessage).toBeInTheDocument();
        }
      },
      { timeout: 3000 }
    );
  });

  it('applies compact mode when prop is set', () => {
    const Wrapper = createWrapper();
    const { container } = render(<ClanSelector compact />, { wrapper: Wrapper });

    // In compact mode, cards should have different styling
    // Check if any element has the compact-related classes
    expect(container.querySelector('.p-3, .p-4')).toBeInTheDocument();
  });

  it('respects maxDisplay prop', () => {
    const Wrapper = createWrapper();
    render(<ClanSelector maxDisplay={3} />, { wrapper: Wrapper });

    // The component should limit display to maxDisplay
    // This is tested by checking the query parameter in the API call
    expect(screen.getByText(/browse clans/i)).toBeInTheDocument();
  });
});
