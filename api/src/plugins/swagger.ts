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
        description: 'REST API for Angry Birdman clan management system',
        version: '0.1.0',
        contact: {
          name: 'API Support',
          email: 'support@angrybirdman.dev',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'clans', description: 'Clan management endpoints' },
        { name: 'users', description: 'User management endpoints' },
        { name: 'roster', description: 'Roster management endpoints' },
        { name: 'battles', description: 'Battle data endpoints' },
        { name: 'stats', description: 'Statistics and analytics endpoints' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token from Keycloak authentication',
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
