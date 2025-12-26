/**
 * Singleton Prisma Client instance
 *
 * This file creates and exports a single PrismaClient instance
 * configured with the appropriate driver adapter for PostgreSQL.
 *
 * Uses @prisma/adapter-pg as required by Prisma 7 for all database connections.
 */

import 'dotenv/config';

import { type DriverAdapter, PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from './generated/prisma/client';

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString,
  // Configure connection pool for production use
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection cannot be established
});

// Create Prisma adapter using the connection pool
const adapter: DriverAdapter = new PrismaPg(pool);

// Create and export Prisma Client instance
export const prisma: PrismaClient = new PrismaClient({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', () => {
  void Promise.all([
    prisma.$disconnect().catch((err: unknown) => console.error('Error disconnecting Prisma:', err)),
    pool.end().catch((err: unknown) => console.error('Error closing pool:', err)),
  ]);
});
