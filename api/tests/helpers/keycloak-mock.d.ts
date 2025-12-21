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
/**
 * Mock Keycloak Service with all methods as Vitest mock functions
 */
export declare const mockKeycloakService: {
    init: import("vitest").Mock<import("@vitest/spy").Procedure>;
    registerUser: import("vitest").Mock<import("@vitest/spy").Procedure>;
    changePassword: import("vitest").Mock<import("@vitest/spy").Procedure>;
    updateUser: import("vitest").Mock<import("@vitest/spy").Procedure>;
    assignRole: import("vitest").Mock<import("@vitest/spy").Procedure>;
    removeRole: import("vitest").Mock<import("@vitest/spy").Procedure>;
    getUser: import("vitest").Mock<import("@vitest/spy").Procedure>;
    getUsers: import("vitest").Mock<import("@vitest/spy").Procedure>;
    disableUser: import("vitest").Mock<import("@vitest/spy").Procedure>;
    enableUser: import("vitest").Mock<import("@vitest/spy").Procedure>;
    deleteUser: import("vitest").Mock<import("@vitest/spy").Procedure>;
    getUserRoles: import("vitest").Mock<import("@vitest/spy").Procedure>;
};
/**
 * Reset all mock functions to their default state
 * Call this in beforeEach to ensure test isolation
 */
export declare function resetKeycloakMock(): void;
/**
 * Configure the mock to simulate a duplicate username/email error
 */
export declare function mockDuplicateUserError(): void;
/**
 * Configure the mock to simulate a duplicate on update
 */
export declare function mockDuplicateUpdateError(): void;
/**
 * Configure the mock to simulate role not found error
 */
export declare function mockRoleNotFoundError(): void;
/**
 * Configure the mock to simulate user not found error
 */
export declare function mockUserNotFoundError(): void;
//# sourceMappingURL=keycloak-mock.d.ts.map