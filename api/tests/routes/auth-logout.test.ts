import axios from 'axios';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../src/app.js';
import { prisma } from '../setup.js';

import type { FastifyInstance } from 'fastify';

describe('Keycloak session termination', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('ends the Keycloak session when a user signs out', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ status: 204 });
    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie: 'refresh_token=refresh-value' },
    });

    expect(response.statusCode).toBe(200);
    expect(post).toHaveBeenCalledWith(
      'http://localhost:8080/realms/angrybirdman/protocol/openid-connect/logout',
      expect.any(URLSearchParams),
      expect.any(Object)
    );
    const params = post.mock.calls[0]?.[1] as URLSearchParams;
    expect(params.get('client_id')).toBe('angrybirdman-frontend');
    expect(params.get('refresh_token')).toBe('refresh-value');
  });

  it('ends the newly created Keycloak session for a disabled account', async () => {
    await prisma.user.create({
      data: {
        userId: 'keycloak:disabled-sub',
        username: 'disabled-user',
        email: 'disabled@example.invalid',
        enabled: false,
      },
    });
    const accessToken = app.jwt.sign({ iss: 'keycloak', sub: 'disabled-sub' });
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({
        data: {
          access_token: accessToken,
          refresh_token: 'disabled-refresh',
          expires_in: 300,
          refresh_expires_in: 1800,
        },
      })
      .mockResolvedValueOnce({ status: 204 });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/token',
      payload: {
        code: 'code',
        codeVerifier: 'verifier',
        redirectUri: 'http://localhost:5173/callback',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1]?.[0]).toBe(
      'http://localhost:8080/realms/angrybirdman/protocol/openid-connect/logout'
    );
    const params = post.mock.calls[1]?.[1] as URLSearchParams;
    expect(params.get('refresh_token')).toBe('disabled-refresh');
  });

  it('ends the Keycloak session when a disabled account uses password login', async () => {
    await prisma.user.create({
      data: {
        userId: 'keycloak:disabled-sub',
        username: 'disabled-user',
        email: 'disabled@example.invalid',
        enabled: false,
      },
    });
    const accessToken = app.jwt.sign({ iss: 'keycloak', sub: 'disabled-sub' });
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({
        data: {
          access_token: accessToken,
          refresh_token: 'disabled-refresh',
          expires_in: 300,
          refresh_expires_in: 1800,
        },
      })
      .mockResolvedValueOnce({ status: 204 });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login-with-password',
      payload: { username: 'disabled-user', password: 'temporary-password' },
    });

    expect(response.statusCode).toBe(403);
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1]?.[0]).toBe(
      'http://localhost:8080/realms/angrybirdman/protocol/openid-connect/logout'
    );
    const params = post.mock.calls[1]?.[1] as URLSearchParams;
    expect(params.get('refresh_token')).toBe('disabled-refresh');
  });
});
