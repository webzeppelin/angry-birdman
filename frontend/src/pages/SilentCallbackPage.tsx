/**
 * Silent Callback Page
 *
 * Handles silent token renewal in an iframe.
 */

import { useEffect } from 'react';

import { handleSilentCallback } from '@/contexts/AuthContext';

export function SilentCallbackPage() {
  useEffect(() => {
    handleSilentCallback().catch((err) => {
      console.error('Silent callback error:', err);
    });
  }, []);

  return null;
}
