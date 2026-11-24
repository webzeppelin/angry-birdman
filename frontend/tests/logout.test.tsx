import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { exchangeCodeForToken, logout } from '../src/lib/auth-config';
import { CallbackPage } from '../src/pages/CallbackPage';

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ refreshUser: vi.fn() }),
}));

describe('Keycloak logout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('uses the PKCE verifier belonging to the current login after a disabled login', async () => {
    sessionStorage.clear();
    sessionStorage.setItem('oidc.old-state', JSON.stringify({ code_verifier: 'old-verifier' }));
    sessionStorage.setItem(
      'oidc.current-state',
      JSON.stringify({ code_verifier: 'current-verifier' })
    );
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await exchangeCodeForToken('code', 'current-state');

    const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
    if (typeof options.body !== 'string') throw new Error('Expected a JSON request body');
    expect(JSON.parse(options.body)).toMatchObject({ codeVerifier: 'current-verifier' });
    expect(sessionStorage.getItem('oidc.current-state')).toBeNull();
    expect(sessionStorage.getItem('oidc.old-state')).not.toBeNull();
  });

  it('clears local cookies and redirects using RP-initiated logout', async () => {
    const location = { href: '' };
    vi.stubGlobal('window', { location });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    await logout();

    const url = new URL(location.href);
    expect(url.pathname).toBe('/realms/angrybirdman/protocol/openid-connect/logout');
    expect(url.searchParams.get('client_id')).toBe('angrybirdman-frontend');
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe('http://localhost:5173');
    expect(url.searchParams.has('redirect_uri')).toBe(false);
  });

  it('uses RP-initiated logout for a disabled account', async () => {
    const location = { href: '', search: '?code=code&state=state' };
    const testWindow = Object.create(window) as Window;
    Object.defineProperty(testWindow, 'location', { value: location });
    vi.stubGlobal('window', testWindow);
    sessionStorage.setItem('oidc.state', JSON.stringify({ code_verifier: 'verifier' }));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Account disabled',
            message: 'Your account has been disabled',
            logoutUrl: 'http://localhost:8080/realms/angrybirdman/protocol/openid-connect/logout',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    render(
      <MemoryRouter>
        <CallbackPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Account Disabled')).toBeInTheDocument());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 2100)));
    const url = new URL(location.href);
    expect(url.searchParams.get('client_id')).toBe('angrybirdman-frontend');
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe('http://localhost:5173');
    expect(url.searchParams.has('redirect_uri')).toBe(false);
  });
});
