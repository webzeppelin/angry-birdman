import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import { Breadcrumbs } from '../../src/components/layout/Breadcrumbs';

// Helper to render with router
function renderWithRouter(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumbs />
    </MemoryRouter>
  );
}

describe('Breadcrumbs', () => {
  it('does not render on home page', () => {
    const { container } = renderWithRouter('/');
    expect(container.firstChild).toBeNull();
  });

  it('does not render on /callback page', () => {
    const { container } = renderWithRouter('/callback');
    // Breadcrumbs should not render on callback pages
    expect(container.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull();
  });

  it('does not render on /silent-callback page', () => {
    const { container } = renderWithRouter('/silent-callback');
    // Breadcrumbs should not render on silent callback page
    expect(container.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull();
  });

  it('renders breadcrumbs for clans page', () => {
    renderWithRouter('/clans');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clans')).toBeInTheDocument();
  });

  // SKIP: This test requires async clan name fetching which needs proper API mocking
  it.skip('renders breadcrumbs for clan detail page', () => {
    renderWithRouter('/clans/123');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clans')).toBeInTheDocument();
    // The component shows "Loading..." until clan name is fetched
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders breadcrumbs for about page', () => {
    renderWithRouter('/about');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders breadcrumbs for dashboard', () => {
    renderWithRouter('/dashboard');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  // SKIP: This test requires async clan name fetching which needs proper API mocking
  it.skip('renders breadcrumbs for nested routes', () => {
    renderWithRouter('/clans/123/battles');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clans')).toBeInTheDocument();
    // The component shows "Loading..." until clan name is fetched
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.getByText('Battles')).toBeInTheDocument();
  });

  it('capitalizes path segments correctly', () => {
    renderWithRouter('/roster/members');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Roster')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
  });

  it('creates links for non-current breadcrumbs', () => {
    renderWithRouter('/clans/123');

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/');

    const clansLink = screen.getByRole('link', { name: /^clans$/i });
    expect(clansLink).toHaveAttribute('href', '/clans');
  });

  // SKIP: This test requires async clan name fetching which needs proper API mocking
  it.skip('does not create link for current page', () => {
    renderWithRouter('/clans/123');

    // The current page (Clan 123) should not be a link
    // Component shows "Loading..." initially, then clan name after fetch
    const currentPage = screen.getByText(/loading/i);
    expect(currentPage.tagName).not.toBe('A');
  });

  it('uses correct ARIA labels', () => {
    renderWithRouter('/clans');

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
  });

  it('adds separators between breadcrumbs', () => {
    const { container } = renderWithRouter('/clans/123');

    // Check for separator text content (/)
    const breadcrumbText = container.textContent;
    expect(breadcrumbText).toContain('/');
  });
});
