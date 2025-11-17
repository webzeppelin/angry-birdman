/**
 * Keycloak User Management Service
 *
 * This service provides integration with Keycloak for user management operations:
 * - User registration
 * - Password management
 * - Role assignment
 * - User account administration
 *
 * @module services/keycloak
 */

import KcAdminClient from '@keycloak/keycloak-admin-client';

import type { FastifyInstance } from 'fastify';

/**
 * User credentials for registration or password changes
 */
export interface UserCredentials {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Password change request
 */
export interface PasswordChangeRequest {
  userId: string;
  newPassword: string;
  temporary?: boolean; // If true, user must change on next login
}

/**
 * User role assignment
 */
export interface RoleAssignment {
  userId: string;
  role: 'superadmin' | 'clan-owner' | 'clan-admin' | 'user';
}

/**
 * Keycloak Service for user management operations
 */
export class KeycloakService {
  private adminClient: KcAdminClient;
  private realm: string;
  private initialized = false;

  constructor(
    private baseUrl: string,
    private clientId: string,
    private clientSecret: string,
    realmName: string = 'angrybirdman'
  ) {
    this.realm = realmName;
    this.adminClient = new KcAdminClient({
      baseUrl: this.baseUrl,
      realmName: this.realm,
    });
  }

  /**
   * Initialize the Keycloak Admin Client with service account credentials
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[KeycloakService] Attempting to authenticate with:', {
        baseUrl: this.baseUrl,
        realm: this.realm,
        clientId: this.clientId,
        hasSecret: !!this.clientSecret,
      });

      await this.adminClient.auth({
        grantType: 'client_credentials',
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      });
      this.initialized = true;
      console.log('[KeycloakService] Successfully authenticated');
    } catch (error) {
      console.error('[KeycloakService] Authentication failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize Keycloak Admin Client: ${message}`);
    }
  }

  /**
   * Ensure the admin client is authenticated
   * Handles token refresh if needed
   */
  private async ensureAuth(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Register a new user in Keycloak
   *
   * @param credentials - User registration details
   * @returns The created user's Keycloak ID
   */
  async registerUser(credentials: UserCredentials): Promise<string> {
    await this.ensureAuth();

    try {
      // Create user in Keycloak
      const createResult = await this.adminClient.users.create({
        realm: this.realm,
        username: credentials.username,
        email: credentials.email,
        emailVerified: false, // Set to true if email verification is disabled
        enabled: true,
        // firstName and lastName intentionally omitted - we don't collect this data
        credentials: [
          {
            type: 'password',
            value: credentials.password,
            temporary: false,
          },
        ],
      });

      // Extract user ID from the Location header or created object
      const userId = createResult.id || '';

      if (!userId) {
        throw new Error('Failed to retrieve created user ID');
      }

      // Assign default 'user' role to new registrants
      await this.assignRole({ userId, role: 'user' });

      return userId;
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Check for duplicate username/email errors
        if (error.message.includes('409')) {
          throw new Error('Username or email already exists');
        }
        throw new Error(`Failed to register user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Change a user's password
   *
   * @param request - Password change details
   */
  async changePassword(request: PasswordChangeRequest): Promise<void> {
    await this.ensureAuth();

    try {
      await this.adminClient.users.resetPassword({
        realm: this.realm,
        id: request.userId,
        credential: {
          type: 'password',
          value: request.newPassword,
          temporary: request.temporary ?? false,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to change password: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update user profile information in Keycloak
   *
   * @param userId - Keycloak user ID
   * @param updates - Fields to update (username, email, firstName, lastName)
   */
  async updateUser(
    userId: string,
    updates: Partial<{
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    }>
  ): Promise<void> {
    await this.ensureAuth();

    try {
      await this.adminClient.users.update(
        {
          realm: this.realm,
          id: userId,
        },
        updates
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('409')) {
          throw new Error('Username or email already exists');
        }
        throw new Error(`Failed to update user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Assign a role to a user
   *
   * @param assignment - Role assignment details
   */
  async assignRole(assignment: RoleAssignment): Promise<void> {
    await this.ensureAuth();

    try {
      // Get the role object
      const role = await this.adminClient.roles.findOneByName({
        realm: this.realm,
        name: assignment.role,
      });

      if (!role || !role.id) {
        throw new Error(`Role ${assignment.role} not found`);
      }

      // Assign the role to the user
      await this.adminClient.users.addRealmRoleMappings({
        realm: this.realm,
        id: assignment.userId,
        roles: [
          {
            id: role.id,
            name: role.name ?? assignment.role,
          },
        ],
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to assign role: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Remove a role from a user
   *
   * @param assignment - Role removal details
   */
  async removeRole(assignment: RoleAssignment): Promise<void> {
    await this.ensureAuth();

    try {
      // Get the role object
      const role = await this.adminClient.roles.findOneByName({
        realm: this.realm,
        name: assignment.role,
      });

      if (!role || !role.id) {
        throw new Error(`Role ${assignment.role} not found`);
      }

      // Remove the role from the user
      await this.adminClient.users.delRealmRoleMappings({
        realm: this.realm,
        id: assignment.userId,
        roles: [
          {
            id: role.id,
            name: role.name ?? assignment.role,
          },
        ],
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to remove role: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get user details from Keycloak
   *
   * @param userId - Keycloak user ID
   * @returns User representation
   */
  async getUser(userId: string) {
    await this.ensureAuth();

    try {
      return await this.adminClient.users.findOne({
        realm: this.realm,
        id: userId,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to get user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get all users with optional filtering
   *
   * @param params - Search parameters
   * @returns List of users
   */
  async getUsers(params?: {
    search?: string;
    email?: string;
    username?: string;
    first?: number;
    max?: number;
  }) {
    await this.ensureAuth();

    try {
      return await this.adminClient.users.find({
        realm: this.realm,
        ...params,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to get users: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Disable a user account
   *
   * @param userId - Keycloak user ID
   */
  async disableUser(userId: string): Promise<void> {
    await this.ensureAuth();

    try {
      await this.adminClient.users.update(
        {
          realm: this.realm,
          id: userId,
        },
        {
          enabled: false,
        }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to disable user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Enable a user account
   *
   * @param userId - Keycloak user ID
   */
  async enableUser(userId: string): Promise<void> {
    await this.ensureAuth();

    try {
      await this.adminClient.users.update(
        {
          realm: this.realm,
          id: userId,
        },
        {
          enabled: true,
        }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to enable user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Delete a user from Keycloak
   *
   * @param userId - Keycloak user ID
   */
  async deleteUser(userId: string): Promise<void> {
    await this.ensureAuth();

    try {
      await this.adminClient.users.del({
        realm: this.realm,
        id: userId,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get user's roles
   *
   * @param userId - Keycloak user ID
   * @returns List of assigned realm roles
   */
  async getUserRoles(userId: string) {
    await this.ensureAuth();

    try {
      return await this.adminClient.users.listRealmRoleMappings({
        realm: this.realm,
        id: userId,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to get user roles: ${error.message}`);
      }
      throw error;
    }
  }
}

/**
 * Create and export singleton Keycloak service instance
 */
export function createKeycloakService(app: FastifyInstance): KeycloakService {
  const config = app.config;

  const service = new KeycloakService(
    config.KEYCLOAK_URL || process.env.KEYCLOAK_URL || 'http://localhost:8080',
    config.KEYCLOAK_ADMIN_CLIENT_ID || process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'angrybirdman-api',
    config.KEYCLOAK_ADMIN_CLIENT_SECRET || process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '',
    config.KEYCLOAK_REALM || process.env.KEYCLOAK_REALM || 'angrybirdman'
  );

  return service;
}
