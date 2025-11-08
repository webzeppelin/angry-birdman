/**
 * Authentication Configuration
 *
 * Keycloak OAuth2/OIDC configuration for the Angry Birdman frontend.
 */

import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

// Environment variables with defaults
const KEYCLOAK_URL = (import.meta.env.VITE_KEYCLOAK_URL as string) || 'http://localhost:8080';
const KEYCLOAK_REALM = (import.meta.env.VITE_KEYCLOAK_REALM as string) || 'angrybirdman';
const KEYCLOAK_CLIENT_ID =
  (import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string) || 'angrybirdman-frontend';
const APP_URL = (import.meta.env.VITE_APP_URL as string) || 'http://localhost:5173';

// Construct Keycloak endpoints
const KEYCLOAK_BASE = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;
const AUTHORITY = KEYCLOAK_BASE;
const TOKEN_ENDPOINT = `${KEYCLOAK_BASE}/protocol/openid-connect/token`;
const AUTHORIZATION_ENDPOINT = `${KEYCLOAK_BASE}/protocol/openid-connect/auth`;
const USERINFO_ENDPOINT = `${KEYCLOAK_BASE}/protocol/openid-connect/userinfo`;
const END_SESSION_ENDPOINT = `${KEYCLOAK_BASE}/protocol/openid-connect/logout`;

/**
 * OIDC User Manager configuration
 */
const userManagerConfig: UserManagerSettings = {
  authority: AUTHORITY,
  client_id: KEYCLOAK_CLIENT_ID,
  redirect_uri: `${APP_URL}/callback`,
  post_logout_redirect_uri: APP_URL,
  response_type: 'code',
  scope: 'openid profile email',

  // PKCE enabled for security (Authorization Code Flow with PKCE)
  response_mode: 'query',

  // Token management
  automaticSilentRenew: true,
  silent_redirect_uri: `${APP_URL}/silent-callback`,
  accessTokenExpiringNotificationTimeInSeconds: 60,

  // Additional endpoints (if not auto-discovered)
  metadata: {
    issuer: KEYCLOAK_BASE,
    authorization_endpoint: AUTHORIZATION_ENDPOINT,
    token_endpoint: TOKEN_ENDPOINT,
    userinfo_endpoint: USERINFO_ENDPOINT,
    end_session_endpoint: END_SESSION_ENDPOINT,
    jwks_uri: `${KEYCLOAK_BASE}/protocol/openid-connect/certs`,
  },

  // Storage
  userStore: new WebStorageStateStore({ store: window.localStorage }),

  // Logging (development only)
  ...(import.meta.env.DEV && {
    monitorSession: true,
  }),
};

/**
 * User Manager instance for authentication
 */
export const userManager = new UserManager(userManagerConfig);

/**
 * Export configuration for reference
 */
export const authConfig = {
  keycloakUrl: KEYCLOAK_URL,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
  appUrl: APP_URL,
};

// Configure oidc-client-ts logging in development
if (import.meta.env.DEV) {
  void import('oidc-client-ts').then(({ Log }) => {
    Log.setLogger(console);
    Log.setLevel(Log.INFO);
  });
}
