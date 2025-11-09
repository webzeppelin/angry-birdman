import { type FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createTestApp, testData } from './utils/test-helpers';

describe('API Testing Infrastructure', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('can create a test Fastify app', () => {
    expect(app).toBeDefined();
    expect(app.server).toBeDefined();
  });

  it('can connect to test database', async () => {
    // Create a test clan to verify database connection
    const clan = await testData.createClan({
      name: 'Test Clan',
      country: 'US',
    });

    expect(clan).toBeDefined();
    expect(clan.clanId).toBeGreaterThan(0);
    expect(clan.name).toBe('Test Clan');
  });

  it('has access to health check endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    if (response.statusCode !== 200) {
      console.log('Health check error:', response.body);
    }
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toHaveProperty('status', 'ok');
  });
});
