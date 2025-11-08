/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Integrates with Keycloak via oidc-client-ts for OAuth2/OIDC flows.
 */

import { type User } from 'oidc-client-ts';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { userManager } from '@/lib/auth-config';

import type React from 'react';

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication context methods
 */
export interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | undefined;
  hasRole: (role: string) => boolean;
  getClanId: () => string | undefined;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Custom hook to access authentication context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Authentication Provider Component
 *
 * Manages OAuth2/OIDC authentication state and provides auth methods to children.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user from storage on mount
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await userManager.getUser();
        setUser(storedUser);

        // Store access token for API client
        if (storedUser?.access_token) {
          localStorage.setItem('access_token', storedUser.access_token);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load authentication state');
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, []);

  /**
   * Handle user loaded event
   */
  useEffect(() => {
    const handleUserLoaded = (loadedUser: User) => {
      setUser(loadedUser);
      setError(null);

      // Store access token for API client
      if (loadedUser?.access_token) {
        localStorage.setItem('access_token', loadedUser.access_token);
      }
    };

    userManager.events.addUserLoaded(handleUserLoaded);
    return () => userManager.events.removeUserLoaded(handleUserLoaded);
  }, []);

  /**
   * Handle user unloaded event
   */
  useEffect(() => {
    const handleUserUnloaded = () => {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    };

    userManager.events.addUserUnloaded(handleUserUnloaded);
    return () => userManager.events.removeUserUnloaded(handleUserUnloaded);
  }, []);

  /**
   * Handle access token expiring event
   */
  useEffect(() => {
    const handleTokenExpiring = () => {
      // Silent renewal is automatic, this is just for logging in development
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('Access token expiring, attempting silent renewal...');
      }
    };

    userManager.events.addAccessTokenExpiring(handleTokenExpiring);
    return () => userManager.events.removeAccessTokenExpiring(handleTokenExpiring);
  }, []);

  /**
   * Handle silent renew error
   */
  useEffect(() => {
    const handleSilentRenewError = (error: Error) => {
      console.error('Silent renew error:', error);
      setError('Session renewal failed. Please sign in again.');
    };

    userManager.events.addSilentRenewError(handleSilentRenewError);
    return () => userManager.events.removeSilentRenewError(handleSilentRenewError);
  }, []);

  /**
   * Listen for logout events from other tabs or API interceptor
   */
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setError(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  /**
   * Initiate login flow
   */
  const login = useCallback(async () => {
    try {
      setError(null);
      await userManager.signinRedirect();
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to initiate login');
      throw err;
    }
  }, []);

  /**
   * Initiate logout flow
   */
  const logout = useCallback(async () => {
    try {
      setError(null);
      await userManager.signoutRedirect();
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
      throw err;
    }
  }, []);

  /**
   * Get current access token
   */
  const getAccessToken = useCallback(() => {
    return user?.access_token;
  }, [user]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user?.profile) return false;

      // Keycloak stores roles in realm_access.roles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const realmRoles = (user.profile as any).realm_access?.roles || [];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return realmRoles.includes(role);
    },
    [user]
  );

  /**
   * Get user's clan ID from token claims
   */
  const getClanId = useCallback((): string | undefined => {
    if (!user?.profile) return undefined;

    // Custom clanId claim from Keycloak
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return (user.profile as any).clanId;
  }, [user]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user && !user.expired,
    isLoading,
    error,
    login,
    logout,
    getAccessToken,
    hasRole,
    getClanId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Callback handler for OAuth redirect
 * Call this from your /callback route component
 */
export async function handleAuthCallback(): Promise<void> {
  try {
    const user = await userManager.signinRedirectCallback();

    // Store access token for API client
    if (user?.access_token) {
      localStorage.setItem('access_token', user.access_token);
    }

    // Navigate to intended destination or home
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const returnUrl: string = (user.state as any)?.returnUrl || '/';
    window.location.href = returnUrl;
  } catch (err) {
    console.error('Auth callback error:', err);
    throw err;
  }
}

/**
 * Silent callback handler for token renewal
 * Call this from your /silent-callback route component
 */
export async function handleSilentCallback(): Promise<void> {
  try {
    await userManager.signinSilentCallback();
  } catch (err) {
    console.error('Silent callback error:', err);
  }
}
