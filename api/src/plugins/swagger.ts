import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Swagger/OpenAPI Documentation Plugin
 *
 * Generates interactive API documentation from route schemas
 * Accessible at /docs
 */
const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  // Register Swagger schema generation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Angry Birdman API',
        description: `
# Angry Birdman Clan Management API

REST API for managing Angry Birds 2 clan data, battle statistics, and performance analytics.

## Overview

This API provides comprehensive endpoints for:
- Clan management and roster tracking
- Battle data entry and analysis
- Monthly and yearly statistics
- Performance trends and reporting
- User authentication and authorization

## Authentication

Most endpoints require authentication via JWT tokens issued by Keycloak. 
Tokens should be included in the Authorization header:

\`\`\`
Authorization: Bearer <your-token-here>
\`\`\`

### Public Endpoints

Some endpoints are publicly accessible without authentication:
- Clan directory browsing
- Battle statistics viewing
- Monthly/yearly reports viewing
- Master battle schedule viewing

### Protected Endpoints

Endpoints requiring authentication are marked with a lock icon 🔒.
Access control is based on roles:
- **user**: Basic authenticated user
- **clan-admin**: Can manage clan roster and battles
- **clan-owner**: Full control over their clan
- **superadmin**: System-wide administration

## Rate Limiting

API requests are rate-limited to prevent abuse. Default limits are:
- 100 requests per 15-minute window per IP address

## Data Formats

### Dates
- Battle IDs: YYYYMMDD format (e.g., "20231215")
- Month IDs: YYYYMM format (e.g., "202312")
- Year IDs: YYYY format (e.g., "2023")
- ISO 8601 timestamps for created/updated fields

### Numbers
- Flock Power (FP): Integer values (50-4000+)
- Scores: Integer values >= 0
- Ratios: Decimal values calculated as (score / fp) * 10

## Error Responses

All error responses follow this format:
\`\`\`json
{
  "error": "Error Type",
  "message": "Human-readable error message"
}
\`\`\`

Common HTTP status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate resources)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error
`,
        version: '1.0.0',
        contact: {
          name: 'API Support',
          url: 'https://github.com/webzeppelin/angry-birdman',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Local Development Server',
        },
        {
          url: 'http://localhost:3001/api',
          description: 'Local Development API (with /api prefix)',
        },
      ],
      tags: [
        {
          name: 'Health',
          description: 'System health and status endpoints',
        },
        {
          name: 'Authentication',
          description: 'User authentication and token management',
        },
        {
          name: 'Clans',
          description: 'Clan management, profiles, and directory',
        },
        {
          name: 'Users',
          description: 'User registration, profiles, and management',
        },
        {
          name: 'Roster',
          description: 'Clan roster management and player tracking',
        },
        {
          name: 'Battles',
          description: 'Battle data entry, viewing, and management',
        },
        {
          name: 'Action Codes',
          description: 'Post-battle action code management',
        },
        {
          name: 'Monthly Stats',
          description: 'Monthly performance summaries and rollups',
        },
        {
          name: 'Yearly Stats',
          description: 'Yearly performance summaries and rollups',
        },
        {
          name: 'Reports',
          description: 'Advanced analytics and trend reports',
        },
        {
          name: 'Master Battles',
          description: 'Global battle schedule management',
        },
        {
          name: 'Admin Requests',
          description: 'Clan admin access request workflow',
        },
        {
          name: 'Admin',
          description: 'Clan administration and user management',
        },
        {
          name: 'Audit Logs',
          description: 'System activity audit trails',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: `
JWT token issued by Keycloak Identity Provider.

To obtain a token:
1. Authenticate with Keycloak via OAuth2/OIDC flow
2. Backend exchanges authorization code for tokens
3. Access token is returned in httpOnly cookie
4. Token is automatically included in subsequent requests

Token contains:
- User ID (sub claim)
- Username (preferred_username)
- Email address
- Clan ID (custom claim)
- Roles (realm_access.roles)

Token lifetime: 15 minutes (automatically refreshed)
`,
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });

  // Register Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
  });

  fastify.log.info('Swagger documentation available at /docs');
};

export default fp(swaggerPlugin, {
  name: 'swagger',
  dependencies: ['config'],
});
