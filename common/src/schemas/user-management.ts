/**
 * Zod Validation Schemas for User Management, Admin Requests, and Audit Logs
 *
 * These schemas validate data for Epic 2: User and Clan Management
 *
 * @module schemas/user-management
 */

import { z } from 'zod';

// ============================================================================
// User Registration and Profile Schemas
// ============================================================================

/**
 * User registration schema
 * Note: passwordConfirm should be validated on the client side
 * The API only needs the password field
 */
export const userRegistrationSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username cannot exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * User profile update schema
 */
export const userProfileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username cannot exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email cannot exceed 255 characters')
    .optional(),
  firstName: z.string().max(100, 'First name cannot exceed 100 characters').optional(),
  lastName: z.string().max(100, 'Last name cannot exceed 100 characters').optional(),
});

/**
 * Password change schema
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Passwords do not match',
    path: ['newPasswordConfirm'],
  });

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Passwords do not match',
    path: ['newPasswordConfirm'],
  });

// ============================================================================
// Clan Registration and Update Schemas
// ============================================================================

/**
 * Clan registration schema
 */
export const clanRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Clan name must be at least 2 characters')
    .max(100, 'Clan name cannot exceed 100 characters'),
  rovioId: z
    .number()
    .int('Rovio ID must be an integer')
    .positive('Rovio ID must be positive')
    .max(2147483647, 'Rovio ID is too large'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country cannot exceed 100 characters'),
});

/**
 * Clan profile update schema (for clan owners)
 */
export const clanProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Clan name must be at least 2 characters')
    .max(100, 'Clan name cannot exceed 100 characters')
    .optional(),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country cannot exceed 100 characters')
    .optional(),
  active: z.boolean().optional(),
});

// ============================================================================
// Admin Request Schemas
// ============================================================================

/**
 * Admin request submission schema
 */
export const adminRequestSchema = z.object({
  clanId: z.number().int('Clan ID must be an integer').positive('Clan ID must be positive'),
  message: z
    .string()
    .max(256, 'Message cannot exceed 256 characters')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

/**
 * Admin request review schema
 */
export const adminRequestReviewSchema = z.object({
  requestId: z
    .number()
    .int('Request ID must be an integer')
    .positive('Request ID must be positive'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be either approve or reject' }),
  }),
  rejectionReason: z
    .string()
    .max(1000, 'Rejection reason cannot exceed 1000 characters')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

/**
 * Admin request status enum
 */
export const adminRequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

// ============================================================================
// User Role Management Schemas
// ============================================================================

/**
 * User role schema
 */
export const userRoleSchema = z.enum(['superadmin', 'clan-owner', 'clan-admin', 'user']);

/**
 * Role assignment schema
 */
export const roleAssignmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: userRoleSchema,
});

/**
 * Clan association update schema
 */
export const clanAssociationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  clanId: z
    .number()
    .int('Clan ID must be an integer')
    .positive('Clan ID must be positive')
    .nullable(),
  owner: z.boolean().optional(),
});

// ============================================================================
// Audit Log Schemas
// ============================================================================

/**
 * Audit log query schema
 */
export const auditLogQuerySchema = z.object({
  actorId: z.string().optional(),
  actionType: z.string().optional(),
  entityType: z.string().optional(),
  clanId: z.number().int().positive().optional(),
  targetUserId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(1000, 'Limit cannot exceed 1000').optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

// ============================================================================
// Type Exports
// ============================================================================

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;

export type ClanRegistration = z.infer<typeof clanRegistrationSchema>;
export type ClanProfileUpdate = z.infer<typeof clanProfileUpdateSchema>;

export type AdminRequestSubmission = z.infer<typeof adminRequestSchema>;
export type AdminRequestReview = z.infer<typeof adminRequestReviewSchema>;
export type AdminRequestStatus = z.infer<typeof adminRequestStatusSchema>;

export type UserRole = z.infer<typeof userRoleSchema>;
export type RoleAssignment = z.infer<typeof roleAssignmentSchema>;
export type ClanAssociation = z.infer<typeof clanAssociationSchema>;

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
