import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * MSW Request Handlers
 * Define mock responses for API endpoints used in tests
 */
export const handlers = [
  // Health check endpoint
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }),

  // Clans endpoint - list all clans
  http.get(`${API_BASE_URL}/clans`, () => {
    return HttpResponse.json([
      {
        clanId: 1,
        rovioId: 123456,
        name: 'Test Clan 1',
        country: 'US',
        active: true,
        registrationDate: '2025-01-01',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        clanId: 2,
        rovioId: 789012,
        name: 'Test Clan 2',
        country: 'UK',
        active: true,
        registrationDate: '2025-01-15',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      },
    ]);
  }),

  // Clan detail endpoint
  http.get(`${API_BASE_URL}/clans/:clanId`, ({ params }) => {
    const clanId = String(params.clanId);
    return HttpResponse.json({
      clanId: Number(clanId),
      rovioId: 123456,
      name: `Test Clan ${clanId}`,
      country: 'US',
      active: true,
      registrationDate: '2025-01-01',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
  }),

  // User profile endpoint
  http.get(`${API_BASE_URL}/auth/profile`, () => {
    return HttpResponse.json({
      userId: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      clanId: 1,
      owner: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
  }),

  // Roster members endpoint
  http.get(`${API_BASE_URL}/clans/:clanId/roster`, ({ params }) => {
    const clanId = Number(params.clanId);
    return HttpResponse.json([
      {
        playerId: 1,
        clanId: Number(clanId),
        playerName: 'Player One',
        active: true,
        joinedDate: '2025-01-01',
        leftDate: null,
        kickedDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        playerId: 2,
        clanId: Number(clanId),
        playerName: 'Player Two',
        active: true,
        joinedDate: '2025-01-05',
        leftDate: null,
        kickedDate: null,
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      },
    ]);
  }),

  // Battles endpoint
  http.get(`${API_BASE_URL}/clans/:clanId/battles`, ({ params }) => {
    const clanId = Number(params.clanId);
    return HttpResponse.json([
      {
        clanId: Number(clanId),
        battleId: '20250101',
        startDate: '2025-01-01',
        endDate: '2025-01-02',
        result: 1,
        score: 50000,
        fp: 40000,
        baselineFp: 40000,
        ratio: 12.5,
        averageRatio: 12.5,
        opponentName: 'Opponent Clan',
        opponentScore: 45000,
        opponentFp: 38000,
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
    ]);
  }),

  // Error handlers for testing error states
  http.get(`${API_BASE_URL}/error/401`, () => {
    return new HttpResponse(null, { status: 401 });
  }),

  http.get(`${API_BASE_URL}/error/403`, () => {
    return new HttpResponse(null, { status: 403 });
  }),

  http.get(`${API_BASE_URL}/error/404`, () => {
    return HttpResponse.json(
      {
        error: 'Not Found',
        message: 'Resource not found',
        statusCode: 404,
      },
      { status: 404 }
    );
  }),

  http.get(`${API_BASE_URL}/error/500`, () => {
    return HttpResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Something went wrong',
        statusCode: 500,
      },
      { status: 500 }
    );
  }),
];
