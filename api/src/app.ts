import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import configPlugin from './plugins/config.js';
import databasePlugin from './plugins/database.js';
import swaggerPlugin from './plugins/swagger.js';
import authRoutes from './routes/auth.js';
import clanRoutes from './routes/clans.js';
import healthRoutes from './routes/health.js';

/**
 * Build Fastify application with all plugins and routes
 *
 * This is separated from index.ts to allow for easier testing
 */
export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      ...(process.env.NODE_ENV !== 'production' && {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true,
          },
        },
      }),
    },
  });

  // Register configuration plugin first (other plugins depend on it)
  await fastify.register(configPlugin);

  // Cookie plugin (for httpOnly cookie token storage)
  await fastify.register(cookie, {
    secret:
      fastify.config.COOKIE_SECRET ||
      process.env.COOKIE_SECRET ||
      'default-secret-change-in-production',
    parseOptions: {},
  });

  // JWT plugin (for token decoding and validation)
  await fastify.register(jwt, {
    secret:
      fastify.config.JWT_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production',
    // We're using Keycloak tokens, so we primarily use decode(), not sign()
  });

  // Security plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  await fastify.register(cors, {
    origin: fastify.config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await fastify.register(rateLimit, {
    max: fastify.config.RATE_LIMIT_MAX,
    timeWindow: fastify.config.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later',
      statusCode: 429,
    }),
  });

  // Database plugin
  await fastify.register(databasePlugin);

  // Documentation plugin
  await fastify.register(swaggerPlugin);

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(clanRoutes);
  await fastify.register(healthRoutes);

  // Error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  return fastify;
}
