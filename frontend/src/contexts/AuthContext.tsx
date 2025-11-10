/**
 * Authentication Context - Token Proxy Pattern
 *
 * Provides authentication state and methods throughout the application.
 * Uses Backend Token Proxy Pattern for secure token management.
 * Tokens are stored in httpOnly cookies (XSS-safe), never exposed to JavaScript.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { type User, getCurrentUser, logout as logoutUser, userManager } from '@/lib/auth-config';

import type React from 'react';

/**
 * Clan information interface
 */
export interface ClanInfo {
  clanId: number;
  name: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  clanInfo: ClanInfo | null;
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
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  getClanId: () => number | undefined;
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
 * Manages authentication state using Backend Token Proxy Pattern.
 * Tokens are stored in httpOnly cookies set by the backend (XSS-safe).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch clan information by ID
   */
  const fetchClanInfo = useCallback(async (clanId: number): Promise<ClanInfo | null> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/clans/${clanId}`
      );
      if (!response.ok) {
        console.error('Failed to fetch clan info:', response.status);
        return null;
      }
      const data = (await response.json()) as { clanId: number; name: string };
      return { clanId: data.clanId, name: data.name };
    } catch (err) {
      console.error('Error fetching clan info:', err);
      return null;
    }
  }, []);

  /**
   * Load user from backend on mount
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Fetch clan info if user has a clan
        if (currentUser?.clanId) {
          const clan = await fetchClanInfo(currentUser.clanId);
          setClanInfo(clan);
        } else {
          setClanInfo(null);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load authentication state');
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, [fetchClanInfo]);

  /**
   * Set up automatic token refresh
   * Tokens are automatically refreshed 1 minute before expiration (typical token lifetime: 15 minutes)
   */
  useEffect(() => {
    if (!user) return;

    // Refresh token every 14 minutes (tokens typically expire in 15 minutes)
    const interval = setInterval(
      () => {
        void (async () => {
          try {
            // refreshToken will use the refresh_token from httpOnly cookie
            const response = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/refresh`,
              {
                method: 'POST',
                credentials: 'include',
              }
            );

            if (!response.ok) {
              // Refresh failed, clear user and require re-login
              setUser(null);
              setError('Session expired. Please sign in again.');
            }
          } catch (err) {
            console.error('Token refresh failed:', err);
            setUser(null);
            setError('Session expired. Please sign in again.');
          }
        })();
      },
      14 * 60 * 1000
    ); // 14 minutes

    return () => clearInterval(interval);
  }, [user]);

  /**
   * Listen for logout events from other tabs
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
   * Initiate login flow (redirect to Keycloak)
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
   * Logout (clear cookies and redirect to Keycloak logout)
   */
  const logout = useCallback(async () => {
    try {
      setError(null);
      setUser(null);
      setClanInfo(null);
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
      throw err;
    }
  }, []);

  /**
   * Refresh user information from backend
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Fetch clan info if user has a clan
      if (currentUser?.clanId) {
        const clan = await fetchClanInfo(currentUser.clanId);
        setClanInfo(clan);
      } else {
        setClanInfo(null);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, [fetchClanInfo]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false;
      return user.roles.includes(role);
    },
    [user]
  );

  /**
   * Get user's clan ID
   */
  const getClanId = useCallback((): number | undefined => {
    return user?.clanId;
  }, [user]);

  const value: AuthContextValue = {
    user,
    clanInfo,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    hasRole,
    getClanId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
