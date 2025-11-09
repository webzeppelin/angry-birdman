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

  it('does not render on callback pages', () => {
    const { container } = renderWithRouter('/callback');
    expect(container.firstChild).toBeNull();

    const { container: container2 } = renderWithRouter('/silent-callback');
    expect(container2.firstChild).toBeNull();
  });

  it('renders breadcrumbs for clans page', () => {
    renderWithRouter('/clans');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clans')).toBeInTheDocument();
  });

  it('renders breadcrumbs for clan detail page', () => {
    renderWithRouter('/clans/123');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clans')).toBeInTheDocument();
    expect(screen.getByText(/clan 123/i)).toBeInTheDocument();
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

  it('renders breadcrumbs for nested routes', () => {
    renderWithRouter('/clans/123/battles');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clans')).toBeInTheDocument();
    expect(screen.getByText(/clan 123/i)).toBeInTheDocument();
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

  it('does not create link for current page', () => {
    renderWithRouter('/clans/123');

    // The current page (Clan 123) should not be a link
    const currentPage = screen.getByText(/clan 123/i);
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
