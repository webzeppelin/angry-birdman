/**
 * Roster-specific validation schemas for Angry Birdman
 * These schemas provide validation for roster management operations
 */
import { z } from 'zod';
// ============================================================================
// Roster Status Change Schemas
// ============================================================================
/**
 * Schema for recording a player leaving the clan
 */
export const rosterMemberLeftSchema = z.object({
    leftDate: z.date().optional(), // Defaults to current date if not provided
});
/**
 * Schema for recording a player being kicked from the clan
 */
export const rosterMemberKickedSchema = z.object({
    kickedDate: z.date().optional(), // Defaults to current date if not provided
    reason: z.string().max(500).optional(), // Optional reason for the kick
});
/**
 * Schema for reactivating a player
 */
export const rosterMemberReactivateSchema = z.object({
    joinedDate: z.date().optional(), // Defaults to current date if not provided
});
/**
 * Schema for roster listing query parameters
 */
export const rosterListQuerySchema = z.object({
    active: z
        .enum(['true', 'false', 'all'])
        .optional()
        .default('true')
        .transform((val) => (val === 'all' ? undefined : val === 'true')),
    search: z.string().optional(),
    sortBy: z.enum(['playerName', 'joinedDate', 'leftDate', 'kickedDate']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    limit: z.number().int().positive().max(100).optional().default(50),
    page: z.number().int().positive().optional().default(1),
});
//# sourceMappingURL=roster.js.map