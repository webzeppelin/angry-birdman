/**
 * Authentication Routes - Token Proxy Pattern
 *
 * These routes implement the backend token proxy pattern for secure token management.
 * Tokens are stored in httpOnly cookies (inaccessible to JavaScript) to prevent XSS attacks.
 *
 * Flow:
 * 1. Frontend initiates OAuth2 authorization code flow with Keycloak
 * 2. Keycloak redirects back with authorization code
 * 3. Frontend sends code to /auth/token endpoint
 * 4. Backend exchanges code for tokens with Keycloak
 * 5. Backend stores tokens in httpOnly cookies
 * 6. All subsequent API requests include cookies automatically
 */

import axios from 'axios';
import { z } from 'zod';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'angrybirdman';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'angrybirdman-frontend';
const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

interface TokenExchangeBody {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

interface DecodedToken {
  sub: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  clanId?: number;
  realm_access?: {
    roles: string[];
  };
  exp: number;
  iat: number;
}

// Zod validation schemas
const tokenExchangeSchema = z.object({
  code: z.string().min(1).describe('OAuth2 authorization code from Keycloak'),
  codeVerifier: z.string().min(1).describe('PKCE code verifier'),
  redirectUri: z.string().url().describe('Redirect URI used in authorization request'),
});

const tokenResponseSchema = z.object({
  success: z.boolean(),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

const userResponseSchema = z.object({
  sub: z.string(),
  preferred_username: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  clanId: z.number().optional(),
  roles: z.array(z.string()),
});

const authStatusResponseSchema = z.object({
  authenticated: z.boolean(),
});

export default function authRoutes(fastify: FastifyInstance, _opts: unknown, done: () => void) {
  /**
   * POST /token
   * Exchange authorization code for tokens, store in httpOnly cookies
   */
  fastify.post<{ Body: TokenExchangeBody }>(
    '/token',
    {
      schema: {
        description: 'Exchange authorization code for tokens',
        tags: ['Authentication'],
        body: tokenExchangeSchema,
        response: {
          200: tokenResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Body: TokenExchangeBody }>, reply: FastifyReply) => {
      const { code, codeVerifier, redirectUri } = request.body;

      try {
        // Exchange authorization code for tokens with PKCE
        const tokenParams = {
          grant_type: 'authorization_code',
          client_id: KEYCLOAK_CLIENT_ID,
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        };

        const response = await axios.post<KeycloakTokenResponse>(
          TOKEN_ENDPOINT,
          new URLSearchParams(tokenParams),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        const { access_token, refresh_token, expires_in, refresh_expires_in } = response.data;

        // Set httpOnly cookies (JavaScript cannot access)
        void reply.setCookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          sameSite: 'lax',
          path: '/',
          maxAge: expires_in, // Token expiration in seconds
        });

        void reply.setCookie('refresh_token', refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: refresh_expires_in, // Typically 30 days
        });

        fastify.log.info('Successfully exchanged authorization code for tokens');
        return { success: true };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          fastify.log.error(
            {
              error: error.response?.data,
              status: error.response?.status,
              statusText: error.response?.statusText,
              url: error.config?.url,
            },
            'Token exchange failed - Keycloak error'
          );
          const errorDescription =
            (error.response?.data as { error_description?: string })?.error_description ||
            'Authentication failed';
          return reply.status(401).send({
            error: errorDescription,
          });
        }
        fastify.log.error(error, 'Token exchange failed - Unknown error');
        return reply.status(401).send({ error: 'Authentication failed' });
      }
    }
  );

  /**
   * POST /refresh
   * Refresh access token using refresh token from cookie
   */
  fastify.post(
    '/refresh',
    {
      schema: {
        description: 'Refresh access token using refresh token',
        tags: ['Authentication'],
        response: {
          200: tokenResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const refreshToken = request.cookies.refresh_token;

      if (!refreshToken) {
        return reply.status(401).send({ error: 'No refresh token' });
      }

      try {
        const response = await axios.post<KeycloakTokenResponse>(
          TOKEN_ENDPOINT,
          new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: KEYCLOAK_CLIENT_ID,
            refresh_token: refreshToken,
          }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        const {
          access_token,
          expires_in,
          refresh_token: newRefreshToken,
          refresh_expires_in,
        } = response.data;

        // Update cookies with new tokens
        void reply.setCookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: expires_in,
        });

        // Keycloak may or may not return a new refresh token
        if (newRefreshToken) {
          void reply.setCookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: refresh_expires_in,
          });
        }

        fastify.log.info('Successfully refreshed access token');
        return { success: true };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          fastify.log.error({ error: error.response?.data }, 'Token refresh failed');
          // Clear invalid tokens
          void reply.clearCookie('access_token', { path: '/' });
          void reply.clearCookie('refresh_token', { path: '/' });
          const errorDescription =
            (error.response?.data as { error_description?: string })?.error_description ||
            'Token refresh failed';
          return reply.status(401).send({
            error: errorDescription,
          });
        }
        fastify.log.error(error, 'Token refresh failed');
        void reply.clearCookie('access_token', { path: '/' });
        void reply.clearCookie('refresh_token', { path: '/' });
        return reply.status(401).send({ error: 'Token refresh failed' });
      }
    }
  );

  /**
   * POST /logout
   * Clear authentication cookies and optionally revoke tokens with Keycloak
   */
  fastify.post(
    '/logout',
    {
      schema: {
        description: 'Logout and clear authentication cookies',
        tags: ['Authentication'],
        response: {
          200: tokenResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const refreshToken = request.cookies.refresh_token;

      // Clear cookies regardless of token revocation success
      void reply.clearCookie('access_token', { path: '/' });
      void reply.clearCookie('refresh_token', { path: '/' });

      // Optionally revoke refresh token with Keycloak
      if (refreshToken) {
        try {
          const REVOKE_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/revoke`;
          await axios.post(
            REVOKE_ENDPOINT,
            new URLSearchParams({
              client_id: KEYCLOAK_CLIENT_ID,
              token: refreshToken,
              token_type_hint: 'refresh_token',
            }),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
          );
          fastify.log.info('Successfully revoked refresh token with Keycloak');
        } catch (error) {
          // Log but don't fail logout if revocation fails
          fastify.log.warn(error, 'Failed to revoke refresh token with Keycloak');
        }
      }

      return { success: true };
    }
  );

  /**
   * GET /user
   * Get current user information from token in cookie
   */
  fastify.get(
    '/user',
    {
      schema: {
        description: 'Get current authenticated user information',
        tags: ['Authentication'],
        response: {
          200: userResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = request.cookies.access_token;

      if (!token) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        // Decode JWT to get user info (tokens are already validated by Keycloak's signature)
        const decoded = fastify.jwt.decode(token) as DecodedToken;

        if (!decoded || !decoded.sub) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          return reply.status(401).send({ error: 'Token expired' });
        }

        return {
          sub: decoded.sub,
          preferred_username: decoded.preferred_username || '',
          email: decoded.email || '',
          name: decoded.name || '',
          clanId: decoded.clanId || null,
          roles: decoded.realm_access?.roles || [],
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to decode token');
        return reply.status(401).send({ error: 'Invalid token' });
      }
    }
  );

  /**
   * GET /status
   * Simple endpoint to check if user is authenticated (has valid cookie)
   */
  fastify.get(
    '/status',
    {
      schema: {
        description: 'Check authentication status',
        tags: ['Authentication'],
        response: {
          200: authStatusResponseSchema,
        },
      },
    },
    (request: FastifyRequest) => {
      const token = request.cookies.access_token;
      let authenticated = false;

      if (token) {
        try {
          const decoded = fastify.jwt.decode(token) as DecodedToken;
          const now = Math.floor(Date.now() / 1000);
          authenticated = !!(decoded && decoded.sub && decoded.exp && decoded.exp >= now);
        } catch {
          authenticated = false;
        }
      }

      return { authenticated };
    }
  );

  done();
}
