/**
 * Health Check Routes Tests
 * Tests for system health and status endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { buildApp } from '../../src/app.js';

import type { FastifyInstance } from 'fastify';

describe('Health Check Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBeDefined();
      expect(['healthy', 'unhealthy']).toContain(body.status);
      expect(body.timestamp).toBeDefined();
      expect(body.database).toBeDefined();
      expect(body.database.status).toBeDefined();
      expect(body.uptime).toBeDefined();
      expect(body.environment).toBeDefined();
    });
  });
});
