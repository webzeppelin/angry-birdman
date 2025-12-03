/**
 * Authentication Test Helper
 *
 * Provides utilities for testing authenticated API endpoints without
 * requiring a real Keycloak instance.
 *
 * Strategy:
 * - Uses Fastify's JWT plugin with a test secret
 * - Signs tokens with the same secret the app uses for decoding
 * - Bypasses JWKS verification in test environment
 */

import type { JWTPayload } from '../../src/middleware/auth';
import type { FastifyInstance } from 'fastify';

/**
 * Create a test JWT token for authenticated requests
 *
 * @param app - Fastify instance (needed for JWT signing)
 * @param payload - JWT payload to include in token
 * @returns Signed JWT token string
 */
export function createTestToken(
  app: FastifyInstance,
  payload: Partial<JWTPayload> & { sub: string }
): string {
  const defaultPayload: JWTPayload = {
    iss: 'http://localhost:8080/realms/angrybirdman',
    sub: payload.sub,
    email: payload.email,
    preferred_username: payload.preferred_username,
    realm_access: payload.realm_access || { roles: [] },
    // @ts-expect-error - clanId is a test extension, not in actual JWT
    clanId: payload.clanId,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
  };

  return app.jwt.sign(defaultPayload);
}

/**
 * Create a test user payload with sensible defaults
 */
export function createTestUser(overrides?: Partial<JWTPayload>): JWTPayload {
  return {
    iss: 'http://localhost:8080/realms/angrybirdman',
    sub: 'test-keycloak-user-id',
    email: 'test@example.com',
    preferred_username: 'testuser',
    realm_access: { roles: [] },
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

/**
 * Create a test admin user
 */
export function createTestAdmin(overrides?: Partial<JWTPayload>): JWTPayload {
  return createTestUser({
    preferred_username: 'admin',
    email: 'admin@example.com',
    realm_access: { roles: ['admin'] },
    ...overrides,
  });
}

/**
 * Create a test superadmin user
 */
export function createTestSuperadmin(overrides?: Partial<JWTPayload>): JWTPayload {
  return createTestUser({
    preferred_username: 'superadmin',
    email: 'superadmin@example.com',
    realm_access: { roles: ['superadmin'] },
    ...overrides,
  });
}

/**
 * Create a test clan owner user
 */
export function createTestClanOwner(clanId: string, overrides?: Partial<JWTPayload>): JWTPayload {
  return createTestUser({
    preferred_username: 'clanowner',
    email: 'owner@example.com',
    // @ts-expect-error - clanId is a test extension, not in actual JWT
    clanId,
    realm_access: { roles: ['clan-owner'] },
    ...overrides,
  });
}

/**
 * Create HTTP headers with authentication token
 *
 * @param token - JWT token string
 * @returns Headers object with cookie set
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    cookie: `access_token=${token}`,
  };
}

/**
 * Helper to create authenticated request options for Fastify inject
 *
 * @param app - Fastify instance
 * @param user - User payload
 * @param additionalHeaders - Optional additional headers
 * @returns Headers object ready for inject()
 */
export function createAuthenticatedHeaders(
  app: FastifyInstance,
  user: Partial<JWTPayload> & { sub: string },
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  const token = createTestToken(app, user);
  return {
    ...createAuthHeaders(token),
    ...additionalHeaders,
  };
}
