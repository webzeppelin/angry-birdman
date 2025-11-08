import { config as dotenvConfig } from 'dotenv';
import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

// Load environment variables from .env file
dotenvConfig();

/**
 * Configuration interface
 */
export interface Config {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  DATABASE_URL: string;
  KEYCLOAK_URL: string;
  KEYCLOAK_REALM: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_TIME_WINDOW: string;
}

/**
 * Extend Fastify instance type
 */
declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

/**
 * Get configuration from environment variables with defaults
 */
function getConfig(): Config {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    HOST: process.env.HOST || '0.0.0.0',
    DATABASE_URL: process.env.DATABASE_URL || '',
    KEYCLOAK_URL: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'angrybirdman',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    RATE_LIMIT_TIME_WINDOW: process.env.RATE_LIMIT_TIME_WINDOW || '1 minute',
  };
}

/**
 * Configuration plugin
 *
 * Loads and validates environment variables
 * Makes them available as fastify.config
 */
const configPlugin: FastifyPluginAsync = async (fastify) => {
  const config = getConfig();

  // Validate required configuration
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Decorate Fastify instance with config
  fastify.decorate('config', config);

  fastify.log.info(
    {
      env: config.NODE_ENV,
      port: config.PORT,
      host: config.HOST,
    },
    'Configuration loaded'
  );

  return Promise.resolve();
};

export default fp(configPlugin, {
  name: 'config',
});
