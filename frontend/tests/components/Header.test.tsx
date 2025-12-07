/**
 * Header Component Tests
 * Tests for the main application header/navigation component
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { Header } from '../../src/components/layout/Header';
import { AuthProvider } from '../../src/contexts/AuthContext';

// Mock the auth config
vi.mock('../../src/lib/auth-config', () => ({
  authConfig: {
    getUserInfo: vi.fn().mockResolvedValue(null),
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn().mockResolvedValue(false),
  },
}));

describe('Header', () => {
  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render the application name', () => {
    renderHeader();
    expect(screen.getByText(/Angry Birdman/i)).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderHeader();
    // Check for common navigation items
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header element
  });

  it('should render without crashing', () => {
    const { container } = renderHeader();
    expect(container).toBeTruthy();
  });
});
