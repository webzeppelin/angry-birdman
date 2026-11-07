import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { useAuth, type AuthContextValue } from '../../src/contexts/AuthContext';
import { HomePage } from '../../src/pages/HomePage';

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('HomePage', () => {
  it('redirects authenticated users to the dashboard', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      clanInfo: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      hasRole: vi.fn(),
      getClanId: vi.fn(),
    } satisfies AuthContextValue);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<h1>Dashboard destination</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'Dashboard destination' })
    ).toBeInTheDocument();
  });
});
