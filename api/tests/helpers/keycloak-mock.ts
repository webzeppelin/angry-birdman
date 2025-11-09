/**
 * Keycloak Service Mock for Testing
 *
 * Provides a mock implementation of KeycloakService for use in tests.
 * All methods are Vitest mock functions that can be spied on and configured.
 *
 * Usage:
 *   import { mockKeycloakService, resetKeycloakMock } from '../helpers/keycloak-mock';
 *
 *   beforeEach(() => {
 *     resetKeycloakMock();
 *     // Configure specific behaviors as needed
 *     mockKeycloakService.registerUser.mockResolvedValue('mock-keycloak-user-id');
 *   });
 */

import { vi } from 'vitest';

import type { UserCredentials } from '../../src/services/keycloak.service';

/**
 * Mock Keycloak Service with all methods as Vitest mock functions
 */
export const mockKeycloakService = {
  init: vi.fn().mockResolvedValue(undefined),

  registerUser: vi
    .fn()
    .mockImplementation(async (credentials: UserCredentials): Promise<string> => {
      // Default behavior: return a mock Keycloak user ID
      return `keycloak-${credentials.username}-${Date.now()}`;
    }),

  changePassword: vi.fn().mockResolvedValue(undefined),

  updateUser: vi.fn().mockResolvedValue(undefined),

  assignRole: vi.fn().mockResolvedValue(undefined),

  removeRole: vi.fn().mockResolvedValue(undefined),

  getUser: vi.fn().mockImplementation(async (userId: string) => {
    // Default behavior: return basic user representation
    return {
      id: userId,
      username: 'testuser',
      email: 'test@example.com',
      enabled: true,
      emailVerified: false,
      firstName: 'Test',
      lastName: 'User',
    };
  }),

  getUsers: vi.fn().mockImplementation(async () => {
    // Default behavior: return empty array
    return [];
  }),

  disableUser: vi.fn().mockResolvedValue(undefined),

  enableUser: vi.fn().mockResolvedValue(undefined),

  deleteUser: vi.fn().mockResolvedValue(undefined),

  getUserRoles: vi.fn().mockImplementation(async () => {
    // Default behavior: return user role
    return [
      {
        id: 'user-role-id',
        name: 'user',
      },
    ];
  }),
};

/**
 * Reset all mock functions to their default state
 * Call this in beforeEach to ensure test isolation
 */
export function resetKeycloakMock(): void {
  mockKeycloakService.init.mockClear();
  mockKeycloakService.registerUser.mockClear();
  mockKeycloakService.changePassword.mockClear();
  mockKeycloakService.updateUser.mockClear();
  mockKeycloakService.assignRole.mockClear();
  mockKeycloakService.removeRole.mockClear();
  mockKeycloakService.getUser.mockClear();
  mockKeycloakService.getUsers.mockClear();
  mockKeycloakService.disableUser.mockClear();
  mockKeycloakService.enableUser.mockClear();
  mockKeycloakService.deleteUser.mockClear();
  mockKeycloakService.getUserRoles.mockClear();

  // Reset to default implementations
  mockKeycloakService.init.mockResolvedValue(undefined);
  mockKeycloakService.registerUser.mockImplementation(
    async (credentials: UserCredentials): Promise<string> => {
      return `keycloak-${credentials.username}-${Date.now()}`;
    }
  );
  mockKeycloakService.changePassword.mockResolvedValue(undefined);
  mockKeycloakService.updateUser.mockResolvedValue(undefined);
  mockKeycloakService.assignRole.mockResolvedValue(undefined);
  mockKeycloakService.removeRole.mockResolvedValue(undefined);
  mockKeycloakService.getUser.mockImplementation(async (userId: string) => {
    return {
      id: userId,
      username: 'testuser',
      email: 'test@example.com',
      enabled: true,
      emailVerified: false,
      firstName: 'Test',
      lastName: 'User',
    };
  });
  mockKeycloakService.getUsers.mockResolvedValue([]);
  mockKeycloakService.disableUser.mockResolvedValue(undefined);
  mockKeycloakService.enableUser.mockResolvedValue(undefined);
  mockKeycloakService.deleteUser.mockResolvedValue(undefined);
  mockKeycloakService.getUserRoles.mockResolvedValue([
    {
      id: 'user-role-id',
      name: 'user',
    },
  ]);
}

/**
 * Configure the mock to simulate a duplicate username/email error
 */
export function mockDuplicateUserError(): void {
  mockKeycloakService.registerUser.mockRejectedValue(new Error('Username or email already exists'));
}

/**
 * Configure the mock to simulate a duplicate on update
 */
export function mockDuplicateUpdateError(): void {
  mockKeycloakService.updateUser.mockRejectedValue(new Error('Username or email already exists'));
}

/**
 * Configure the mock to simulate role not found error
 */
export function mockRoleNotFoundError(): void {
  mockKeycloakService.assignRole.mockRejectedValue(new Error('Role not found'));
}

/**
 * Configure the mock to simulate user not found error
 */
export function mockUserNotFoundError(): void {
  mockKeycloakService.getUser.mockResolvedValue(null);
}
