import { PrismaClient } from '@angrybirdman/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import pg from 'pg';

/**
 * Database plugin that initializes and manages Prisma Client connection
 *
 * This plugin:
 * - Creates a Prisma Client instance with PostgreSQL adapter
 * - Configures query logging based on environment
 * - Makes the client available as fastify.prisma throughout the application
 * - Handles graceful connection cleanup on server shutdown
 */

// Extend Fastify's type system to include prisma
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  // Initialize database connection URL
  // In test mode, use DATABASE_URL_TEST if available
  const connectionString =
    process.env.NODE_ENV === 'test' && process.env.DATABASE_URL_TEST
      ? process.env.DATABASE_URL_TEST
      : process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create PostgreSQL connection pool
  const pool = new pg.Pool({ connectionString });

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

  // Initialize Prisma Client with adapter
  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

  // Test database connection
  try {
    await prisma.$connect();
    fastify.log.info('Database connection established');
  } catch (error) {
    fastify.log.error({ error }, 'Failed to connect to database');
    throw error;
  }

  // Decorate Fastify instance with Prisma Client
  fastify.decorate('prisma', prisma);

  // Add hook to close database connection on server shutdown
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Closing database connection');
    await instance.prisma.$disconnect();
  });
};

// Export plugin with fastify-plugin for proper encapsulation
export default fp(databasePlugin, {
  name: 'database',
});
