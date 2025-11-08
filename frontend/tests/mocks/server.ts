import { setupServer } from 'msw/node';

import { handlers } from './handlers.js';

/**
 * Mock Service Worker server for Node.js test environment
 * This intercepts HTTP requests during tests and returns mocked responses
 */
export const server = setupServer(...handlers);

// Enable API mocking before tests run
// This will be called from setup.ts
