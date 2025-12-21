/**
 * Zod Validation Schemas for User Management, Admin Requests, and Audit Logs
 *
 * These schemas validate data for Epic 2: User and Clan Management
 *
 * @module schemas/user-management
 */
import { z } from 'zod';
/**
 * User registration schema
 * Note: passwordConfirm should be validated on the client side
 * The API only needs the password field
 */
export declare const userRegistrationSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
/**
 * User profile update schema
 */
export declare const userProfileUpdateSchema: z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Password change schema
 */
export declare const passwordChangeSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    newPasswordConfirm: z.ZodString;
}, z.core.$strip>;
/**
 * Password reset request schema
 */
export declare const passwordResetRequestSchema: z.ZodObject<{
    emailOrUsername: z.ZodString;
}, z.core.$strip>;
/**
 * Password reset schema
 */
export declare const passwordResetSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
    newPasswordConfirm: z.ZodString;
}, z.core.$strip>;
/**
 * Clan registration schema
 */
export declare const clanRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    rovioId: z.ZodNumber;
    country: z.ZodString;
}, z.core.$strip>;
/**
 * Clan profile update schema (for clan owners)
 */
export declare const clanProfileUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/**
 * Admin request submission schema
 */
export declare const adminRequestSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    message: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
}, z.core.$strip>;
/**
 * Admin request review schema
 */
export declare const adminRequestReviewSchema: z.ZodObject<{
    requestId: z.ZodNumber;
    action: z.ZodEnum<{
        approve: "approve";
        reject: "reject";
    }>;
    rejectionReason: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
}, z.core.$strip>;
/**
 * Admin request status enum
 */
export declare const adminRequestStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    APPROVED: "APPROVED";
    REJECTED: "REJECTED";
}>;
/**
 * User role schema
 */
export declare const userRoleSchema: z.ZodEnum<{
    superadmin: "superadmin";
    "clan-owner": "clan-owner";
    "clan-admin": "clan-admin";
    user: "user";
}>;
/**
 * Role assignment schema
 */
export declare const roleAssignmentSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodEnum<{
        superadmin: "superadmin";
        "clan-owner": "clan-owner";
        "clan-admin": "clan-admin";
        user: "user";
    }>;
}, z.core.$strip>;
/**
 * Clan association update schema
 */
export declare const clanAssociationSchema: z.ZodObject<{
    userId: z.ZodString;
    clanId: z.ZodNullable<z.ZodNumber>;
    owner: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/**
 * Audit log query schema
 */
export declare const auditLogQuerySchema: z.ZodObject<{
    actorId: z.ZodOptional<z.ZodString>;
    actionType: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodString>;
    clanId: z.ZodOptional<z.ZodNumber>;
    targetUserId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
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
//# sourceMappingURL=user-management.d.ts.map