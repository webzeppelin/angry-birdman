import { type FastifyPluginCallback } from 'fastify';

/**
 * Health check routes
 *
 * Provides endpoints for monitoring API health and readiness
 */

const healthRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  /**
   * Basic health check
   *
   * Returns simple OK status - useful for load balancers
   */
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Basic health check endpoint',
        tags: ['health'],
        response: {
          200: {
            description: 'API is healthy',
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
            },
          },
        },
      },
    },
    () => {
      return { status: 'ok' };
    }
  );

  /**
   * Detailed health check with database status
   *
   * Checks database connectivity and returns detailed status
   */
  fastify.get(
    '/health/detailed',
    {
      schema: {
        description: 'Detailed health check with database status',
        tags: ['health'],
        response: {
          200: {
            description: 'Detailed health status',
            type: 'object',
            properties: {
              status: { type: 'string', example: 'healthy' },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number', description: 'Process uptime in seconds' },
              environment: { type: 'string', example: 'development' },
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'connected' },
                  responseTime: { type: 'number', description: 'Database response time in ms' },
                },
              },
            },
          },
          503: {
            description: 'Service unavailable',
            type: 'object',
            properties: {
              status: { type: 'string', example: 'unhealthy' },
              timestamp: { type: 'string', format: 'date-time' },
              errors: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const errors: string[] = [];
      let dbStatus = 'unknown';
      let dbResponseTime = 0;

      // Check database connectivity
      try {
        const start = Date.now();
        await fastify.prisma.$queryRaw`SELECT 1`;
        dbResponseTime = Date.now() - start;
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'disconnected';
        errors.push('Database connection failed');
        request.log.error({ error }, 'Database health check failed');
      }

      const isHealthy = errors.length === 0;

      const response = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: fastify.config.NODE_ENV,
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
        ...(errors.length > 0 && { errors }),
      };

      const statusCode = isHealthy ? 200 : 503;
      return reply.status(statusCode).send(response);
    }
  );

  /**
   * Readiness check
   *
   * Indicates whether the service is ready to accept traffic
   * Useful for Kubernetes readiness probes
   */
  fastify.get(
    '/health/ready',
    {
      schema: {
        description: 'Readiness check for orchestration platforms',
        tags: ['health'],
        response: {
          200: {
            description: 'Service is ready',
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: true },
            },
          },
          503: {
            description: 'Service is not ready',
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: false },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Check if database is accessible
      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
        return { ready: true };
      } catch (error) {
        request.log.error({ error }, 'Readiness check failed');
        return reply.status(503).send({
          ready: false,
          reason: 'Database not accessible',
        });
      }
    }
  );

  /**
   * Liveness check
   *
   * Indicates whether the service is alive
   * Useful for Kubernetes liveness probes
   */
  fastify.get(
    '/health/live',
    {
      schema: {
        description: 'Liveness check for orchestration platforms',
        tags: ['health'],
        response: {
          200: {
            description: 'Service is alive',
            type: 'object',
            properties: {
              alive: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
    () => {
      return { alive: true };
    }
  );

  done();
};

export default healthRoutes;
