/**
 * OAuth Callback Page
 *
 * Handles the OAuth redirect callback from Keycloak.
 */

import { useEffect, useState } from 'react';

import { handleAuthCallback } from '@/contexts/AuthContext';

export function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleAuthCallback().catch((err: Error) => {
      console.error('Callback error:', err);
      setError(err.message || 'Authentication failed');
    });
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="shadow-card rounded-lg bg-white p-8 text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-800">Authentication Error</h1>
          <p className="mb-4 text-neutral-600">{error}</p>
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
