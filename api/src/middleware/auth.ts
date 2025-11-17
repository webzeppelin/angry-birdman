import { type FastifyRequest, type FastifyReply, type FastifyInstance } from 'fastify';
import jwt, { type JwtHeader, type SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

/**
 * JWT Authentication Middleware
 *
 * Validates JWT tokens issued by Keycloak using JWKS (JSON Web Key Set)
 * Extracts user information and attaches it to the request object
 */

// Define the structure of decoded JWT payload from IdP token
export interface JWTPayload {
  iss: string; // Issuer (e.g., 'http://localhost:8080/realms/angrybirdman')
  sub: string; // Subject - IdP user ID (Keycloak UUID)
  email?: string; // User email
  preferred_username?: string; // Username
  realm_access?: {
    roles: string[]; // Realm roles (kept for backward compatibility, but not used)
  };
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

// Extended auth user with database data
export interface AuthUser extends JWTPayload {
  userId: string; // Composite user ID: {iss}:{sub} (e.g., 'keycloak:abc-123')
  username: string; // From database
  roles: string[]; // From database (not token)
  clanId: number | null; // From database (not token)
}

// Extend Fastify's request type to include authUser
declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
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
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
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
  const expectedIssuer = `${keycloakUrl}/realms/${realmName}`;

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: expectedIssuer,
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
 * Normalize issuer URL to short provider name
 *
 * Converts full issuer URLs to short, consistent provider identifiers:
 * - 'http://localhost:8080/realms/angrybirdman' → 'keycloak'
 * - Future: 'https://accounts.google.com' → 'google'
 * - Future: 'https://github.com' → 'github'
 *
 * @param iss - Full issuer URL from JWT token
 * @returns Short provider name for composite user ID
 */
export function normalizeIssuer(iss: string): string {
  // Keycloak (local or production)
  if (iss.includes('localhost:8080') || iss.includes('keycloak') || iss.includes('/realms/')) {
    return 'keycloak';
  }

  // Future providers (not yet implemented)
  if (iss.includes('accounts.google.com')) {
    return 'google';
  }

  if (iss.includes('github.com')) {
    return 'github';
  }

  // Default to keycloak for backward compatibility
  return 'keycloak';
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

    // Construct composite user ID from issuer and subject
    const issuer = normalizeIssuer(decoded.iss);
    const compositeUserId = `${issuer}:${decoded.sub}`;

    // Look up user in database to get profile data and roles
    // Access Prisma client through server instance
    const server = request.server as FastifyInstance & {
      prisma: {
        user: {
          findUnique: (args: {
            where: { userId: string };
            select: {
              userId: boolean;
              username: boolean;
              email: boolean;
              clanId: boolean;
              owner: boolean;
              roles: boolean;
              enabled: boolean;
            };
          }) => Promise<{
            userId: string;
            username: string;
            email: string;
            clanId: number | null;
            owner: boolean;
            roles: string[];
            enabled: boolean;
          } | null>;
        };
      };
    };

    const user = await server.prisma.user.findUnique({
      where: { userId: compositeUserId },
      select: {
        userId: true,
        username: true,
        email: true,
        clanId: true,
        owner: true,
        roles: true,
        enabled: true,
      },
    });

    if (!user) {
      // User authenticated with IdP but not in our database
      // This shouldn't happen with proper registration flow
      request.log.warn(
        { compositeUserId, iss: decoded.iss, sub: decoded.sub },
        'User authenticated but profile not found in database'
      );
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User profile not found',
      });
    }

    if (!user.enabled) {
      request.log.warn({ userId: user.userId }, 'Disabled user attempted to authenticate');
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Account is disabled',
      });
    }

    // Attach BOTH token payload AND database user to request
    request.authUser = {
      ...decoded,
      userId: compositeUserId, // composite ID
      username: user.username, // from database
      roles: user.roles, // from database, not token
      clanId: user.clanId, // from database, not token
    };
  } catch (error) {
    console.error('[Authenticate] Verification error:', error);
    console.error(
      '[Authenticate] Error type:',
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      '[Authenticate] Error message:',
      error instanceof Error ? error.message : String(error)
    );
    request.log.warn({ error }, 'JWT verification failed');

    // Determine specific error type by checking error properties
    // Note: jsonwebtoken errors may not be properly instanceof-able with namespace imports
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name;
      console.error('[Authenticate] Error name:', errorName);

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
 * Roles are now fetched from the database (not token claims)
 * This enables provider-agnostic identity management
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

    // Extract user roles from database (attached by authenticate middleware)
    const userRoles = user.roles || [];

    // Check if user has any of the allowed roles
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      request.log.warn(
        { userId: user.userId, requiredRoles: allowedRoles, userRoles },
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
 * ClanId is now fetched from the database (not token claims)
 * This enables provider-agnostic identity management
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
    const requestedClanIdStr = params[clanIdParam];

    if (!requestedClanIdStr) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Missing clan ID parameter: ${clanIdParam}`,
      });
    }

    // Convert to number for comparison
    const requestedClanId = parseInt(requestedClanIdStr, 10);
    if (isNaN(requestedClanId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid clan ID format',
      });
    }

    // Superadmins can access all clans (roles from database)
    const userRoles = user.roles || [];
    if (userRoles.includes('superadmin')) {
      return; // Allow access
    }

    // Check if user's clan matches requested clan (clanId from database)
    const userClanId = user.clanId;

    if (userClanId !== requestedClanId) {
      request.log.warn({ userId: user.userId, userClanId, requestedClanId }, 'Clan access denied');

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You do not have access to this clan',
      });
    }
  };
}
