import { PrismaClient } from '@prisma/client';
import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Database plugin that initializes and manages Prisma Client connection
 *
 * This plugin:
 * - Creates a Prisma Client instance with query logging in development
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
  // Initialize Prisma Client with appropriate logging
  const prisma = new PrismaClient({
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
