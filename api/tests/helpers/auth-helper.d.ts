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
export declare function createTestToken(app: FastifyInstance, payload: Partial<JWTPayload> & {
    sub: string;
}): string;
/**
 * Create a test user payload with sensible defaults
 */
export declare function createTestUser(overrides?: Partial<JWTPayload>): JWTPayload;
/**
 * Create a test admin user
 */
export declare function createTestAdmin(overrides?: Partial<JWTPayload>): JWTPayload;
/**
 * Create a test superadmin user
 */
export declare function createTestSuperadmin(overrides?: Partial<JWTPayload>): JWTPayload;
/**
 * Create a test clan owner user
 */
export declare function createTestClanOwner(clanId: string, overrides?: Partial<JWTPayload>): JWTPayload;
/**
 * Create HTTP headers with authentication token
 *
 * @param token - JWT token string
 * @returns Headers object with cookie set
 */
export declare function createAuthHeaders(token: string): Record<string, string>;
/**
 * Helper to create authenticated request options for Fastify inject
 *
 * @param app - Fastify instance
 * @param user - User payload
 * @param additionalHeaders - Optional additional headers
 * @returns Headers object ready for inject()
 */
export declare function createAuthenticatedHeaders(app: FastifyInstance, user: Partial<JWTPayload> & {
    sub: string;
}, additionalHeaders?: Record<string, string>): Record<string, string>;
//# sourceMappingURL=auth-helper.d.ts.map