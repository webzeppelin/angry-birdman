/**
 * Authentication Configuration - Token Proxy Pattern
 *
 * This implementation uses the Backend Token Proxy Pattern for secure token management.
 * Tokens are stored in httpOnly cookies set by the backend, eliminating JavaScript access
 * and protecting against XSS attacks.
 *
 * Flow:
 * 1. Frontend initiates OAuth2 authorization code flow with Keycloak
 * 2. User authenticates with Keycloak
 * 3. Keycloak redirects back with authorization code
 * 4. Frontend sends code to backend /auth/token endpoint
 * 5. Backend exchanges code for tokens and stores in httpOnly cookies
 * 6. All subsequent API requests automatically include cookies
 */

import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

// Environment variables with defaults
const KEYCLOAK_URL = (import.meta.env.VITE_KEYCLOAK_URL as string) || 'http://localhost:8080';
const KEYCLOAK_REALM = (import.meta.env.VITE_KEYCLOAK_REALM as string) || 'angrybirdman';
const KEYCLOAK_CLIENT_ID =
  (import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string) || 'angrybirdman-frontend';
const APP_URL = (import.meta.env.VITE_APP_URL as string) || 'http://localhost:5173';
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

// Construct Keycloak endpoints
const KEYCLOAK_BASE = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;
const AUTHORIZATION_ENDPOINT = `${KEYCLOAK_BASE}/protocol/openid-connect/auth`;
const END_SESSION_ENDPOINT = `${KEYCLOAK_BASE}/protocol/openid-connect/logout`;

/**
 * User information returned from backend
 */
export interface User {
  sub: string;
  preferred_username: string;
  email: string;
  name: string;
  clanId?: number;
  roles: string[];
}

/**
 * OIDC User Manager configuration
 * Note: We only use this for initiating the login flow and getting the authorization code.
 * Tokens are managed by the backend and stored in httpOnly cookies.
 */
const userManagerConfig: UserManagerSettings = {
  authority: KEYCLOAK_BASE,
  client_id: KEYCLOAK_CLIENT_ID,
  redirect_uri: `${APP_URL}/callback`,
  post_logout_redirect_uri: APP_URL,
  response_type: 'code', // Authorization code flow
  scope: 'openid profile email clan-context',

  // PKCE enabled for security
  response_mode: 'query',

  // Metadata for authorization endpoint
  metadata: {
    issuer: KEYCLOAK_BASE,
    authorization_endpoint: AUTHORIZATION_ENDPOINT,
    end_session_endpoint: END_SESSION_ENDPOINT,
    // Note: Token endpoint is proxied through backend
  },

  // Store PKCE state in sessionStorage (required for code exchange)
  // Note: We don't store tokens here, only OIDC flow state (state, nonce, code_verifier)
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),

  // Don't automatically refresh tokens (backend handles this)
  automaticSilentRenew: false,
};

/**
 * User Manager instance for authentication flow initiation
 */
export const userManager = new UserManager(userManagerConfig);

/**
 * Exchange authorization code for tokens via backend proxy
 *
 * @param code - Authorization code from Keycloak
 * @param state - State parameter from callback URL
 * @returns True if token exchange successful
 */
export async function exchangeCodeForToken(code: string, state: string): Promise<boolean> {
  try {
    // Retrieve PKCE code_verifier from session storage (stored by oidc-client-ts)
    let codeVerifier: string | undefined;

    // Search all sessionStorage keys for PKCE data
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.includes(state) || key?.includes('oidc')) {
        const data = sessionStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data) as { code_verifier?: string; code_challenge?: string };
            if (parsed.code_verifier) {
              codeVerifier = parsed.code_verifier;
              break;
            }
          } catch {
            // Not JSON, skip
          }
        }
      }
    }

    if (!codeVerifier) {
      console.error('PKCE code_verifier not found in storage');
      return false;
    }

    const response = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies in request
      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri: `${APP_URL}/callback`,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      console.error('Token exchange failed:', response.status, error);
      return false;
    }

    // Clean up PKCE state after successful exchange
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.includes(state) || key?.includes('oidc')) {
        sessionStorage.removeItem(key);
      }
    }

    return true;
  } catch (error) {
    console.error('Token exchange failed:', error);
    return false;
  }
}

/**
 * Refresh access token using refresh token from httpOnly cookie
 *
 * @returns True if token refresh successful
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Logout and clear authentication cookies
 * Also redirects to Keycloak logout to end the session there
 */
export async function logout(): Promise<void> {
  try {
    // Clear backend cookies
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    // Redirect to Keycloak logout
    const logoutUrl = `${END_SESSION_ENDPOINT}?redirect_uri=${encodeURIComponent(APP_URL)}`;
    window.location.href = logoutUrl;
  } catch (error) {
    console.error('Logout failed:', error);
    // Still redirect to Keycloak logout even if backend logout fails
    const logoutUrl = `${END_SESSION_ENDPOINT}?redirect_uri=${encodeURIComponent(APP_URL)}`;
    window.location.href = logoutUrl;
  }
}

/**
 * Get current authenticated user information from backend
 *
 * @returns User information or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/auth/user`, {
      credentials: 'include',
    });

    if (!response.ok) {
      // 401 is expected when not authenticated, don't log as error
      if (response.status !== 401) {
        console.error('Failed to get current user:', response.status, response.statusText);
      }
      return null;
    }

    return (await response.json()) as User;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Check if user is currently authenticated
 *
 * @returns True if authenticated (has valid token)
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/status`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { authenticated: boolean };
    return data.authenticated;
  } catch (error) {
    console.error('Failed to check auth status:', error);
    return false;
  }
}

/**
 * Export configuration for reference
 */
export const authConfig = {
  keycloakUrl: KEYCLOAK_URL,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
  appUrl: APP_URL,
  apiUrl: API_URL,
};

// Configure oidc-client-ts logging in development
if (import.meta.env.DEV) {
  void import('oidc-client-ts').then(({ Log }) => {
    Log.setLogger(console);
    Log.setLevel(Log.INFO);
  });
}
