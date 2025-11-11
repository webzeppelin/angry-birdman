import { type FastifyRequest, type FastifyReply } from 'fastify';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

/**
 * JWT Authentication Middleware
 *
 * Validates JWT tokens issued by Keycloak using JWKS (JSON Web Key Set)
 * Extracts user information and attaches it to the request object
 */

// Define the structure of decoded JWT payload
export interface JWTPayload {
  sub: string; // User ID (Keycloak subject)
  email?: string; // User email
  preferred_username?: string; // Username
  realm_access?: {
    roles: string[]; // Realm roles
  };
  clanId?: string; // Custom claim for multi-tenancy
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

// Extend Fastify's request type to include authUser
declare module 'fastify' {
  interface FastifyRequest {
    authUser?: JWTPayload;
  }
}

// JWKS client for retrieving Keycloak's public keys
const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const realmName = process.env.KEYCLOAK_REALM || 'angrybirdman';

const client = jwksClient({
  jwksUri: `${keycloakUrl}/realms/${realmName}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

/**
 * Get signing key from JWKS
 */
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('No kid found in token header'));
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verify JWT token and extract payload
 *
 * In test/development mode, uses a simple secret-based verification
 * In production, uses JWKS with Keycloak's public keys
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  // Test mode: Use simple JWT verification with shared secret
  if (process.env.NODE_ENV === 'test') {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, { algorithms: ['HS256'] }, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded as JWTPayload);
      });
    });
  }

  // Production mode: Use JWKS verification with Keycloak
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: `${keycloakUrl}/realms/${realmName}`,
      },
      (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded as JWTPayload);
      }
    );
  });
}

/**
 * Authentication middleware - validates JWT tokens
 *
 * This middleware:
 * - Extracts the JWT token from httpOnly cookies (XSS-safe token storage)
 * - Falls back to Authorization header for backwards compatibility
 * - Verifies the token signature using Keycloak's public keys
 * - Validates token expiration and issuer
 * - Attaches decoded user information to request.user
 *
 * Usage: Apply to routes that require authentication
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Extract token from httpOnly cookie (primary method) or Authorization header (fallback)
    let token: string | undefined;

    // Try to get token from cookie first (Token Proxy Pattern)
    if (request.cookies?.access_token) {
      token = request.cookies.access_token;
      request.log.debug('Token found in cookie');
    }
    // Fallback to Authorization header for backwards compatibility
    else if (request.headers.authorization) {
      const authHeader = request.headers.authorization;
      const [scheme, bearerToken] = authHeader.split(' ');

      if (scheme === 'Bearer' && bearerToken) {
        token = bearerToken;
        request.log.debug('Token found in Authorization header');
      }
    }

    // No token found in either location
    if (!token) {
      request.log.debug(
        {
          hasCookies: !!request.cookies,
          cookieKeys: request.cookies ? Object.keys(request.cookies) : [],
          hasAuthHeader: !!request.headers.authorization,
        },
        'No authentication token found'
      );
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    // Verify and decode token
    const decoded = await verifyToken(token);

    // Attach user info to request
    request.authUser = decoded;
  } catch (error) {
    request.log.warn({ error }, 'JWT verification failed');

    // Determine specific error type by checking error properties
    // Note: jsonwebtoken errors may not be properly instanceof-able with namespace imports
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name;

      if (errorName === 'TokenExpiredError') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Token has expired',
        });
      }

      if (errorName === 'JsonWebTokenError') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid token',
        });
      }
    }

    // Generic error
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

/**
 * Authorization middleware - checks user roles
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function that checks if user has required role
 */
export function authorize(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Ensure user is authenticated
    const user = request.authUser;
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Extract user roles
    const userRoles = user.realm_access?.roles || [];

    // Check if user has any of the allowed roles
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      request.log.warn(
        { userId: user.sub, requiredRoles: allowedRoles, userRoles },
        'Insufficient permissions'
      );

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

/**
 * Clan authorization middleware - ensures user has access to specified clan
 *
 * @param clanIdParam - Name of route parameter containing clan ID (default: 'clanId')
 * @returns Middleware function that checks clan access
 */
export function authorizeClan(clanIdParam: string = 'clanId') {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Ensure user is authenticated
    const user = request.authUser;
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Get clan ID from route parameters
    const params = request.params as Record<string, string>;
    const requestedClanId = params[clanIdParam];

    if (!requestedClanId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Missing clan ID parameter: ${clanIdParam}`,
      });
    }

    // Superadmins can access all clans
    const userRoles = user.realm_access?.roles || [];
    if (userRoles.includes('superadmin')) {
      return; // Allow access
    }

    // Check if user's clan matches requested clan
    const userClanId = user.clanId;

    if (userClanId !== requestedClanId) {
      request.log.warn({ userId: user.sub, userClanId, requestedClanId }, 'Clan access denied');

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You do not have access to this clan',
      });
    }
  };
}
