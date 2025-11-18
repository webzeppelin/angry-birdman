/**
 * OAuth Callback Page - Token Proxy Pattern
 *
 * Handles the OAuth redirect callback from Keycloak.
 * Exchanges authorization code for tokens via backend proxy.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { exchangeCodeForToken } from '@/lib/auth-config';

export function CallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const errorParam = params.get('error');

        if (errorParam) {
          console.error('Authentication error:', errorParam);
          const errorDescription = params.get('error_description') || errorParam;
          setError(`Authentication failed: ${errorDescription}`);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          return;
        }

        if (!state) {
          setError('No state parameter received');
          return;
        }

        // Exchange code for tokens (stored in httpOnly cookies)
        const result = await exchangeCodeForToken(code, state);

        if (result.success) {
          // Refresh user data from backend
          await refreshUser();

          // Check user role and clan affiliation to determine redirect
          const userResponse = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/user`,
            { credentials: 'include' }
          );

          if (userResponse.ok) {
            const userData = (await userResponse.json()) as {
              clanId?: number | null;
              roles?: string[];
            };

            // Superadmins go to admin dashboard regardless of clan affiliation
            if (userData.roles?.includes('superadmin')) {
              navigate('/admin', { replace: true });
              return;
            }

            // Regular users without a clan go to post-registration triage (Story 2.3)
            if (!userData.clanId) {
              navigate('/register/triage', { replace: true });
              return;
            }
          }

          // User has a clan or we couldn't verify - go to home
          navigate('/', { replace: true });
        } else if (result.error === 'Account disabled') {
          // Handle disabled account - logout from Keycloak and show error
          setError(result.message || 'Your account has been disabled');

          // Logout from Keycloak to clear their session
          if (result.logoutUrl) {
            // Small delay to show the error message, then redirect to logout
            setTimeout(() => {
              window.location.href = `${result.logoutUrl}?redirect_uri=${encodeURIComponent(window.location.origin)}`;
            }, 2000);
          }
        } else {
          setError(result.error || 'Token exchange failed');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    void handleCallback();
  }, [navigate, refreshUser]);

  if (error) {
    const isDisabledAccount = error.includes('disabled');

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="shadow-card max-w-md rounded-lg bg-white p-8 text-center">
          <div className="mb-4 text-6xl">{isDisabledAccount ? '🚫' : '❌'}</div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-800">
            {isDisabledAccount ? 'Account Disabled' : 'Authentication Error'}
          </h1>
          <p className="mb-4 text-neutral-600">{error}</p>
          {isDisabledAccount && (
            <p className="mb-4 text-sm text-neutral-500">
              You are being logged out... If you believe this is an error, please contact your clan
              administrator.
            </p>
          )}
          <a
            href="/"
            className="bg-primary hover:bg-primary-600 inline-block rounded px-6 py-2 text-white"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="border-t-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-200"></div>
        <p className="text-neutral-600">Completing sign in...</p>
      </div>
    </div>
  );
}
