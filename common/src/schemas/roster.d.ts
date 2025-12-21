/**
 * Roster-specific validation schemas for Angry Birdman
 * These schemas provide validation for roster management operations
 */
import { z } from 'zod';
/**
 * Schema for recording a player leaving the clan
 */
export declare const rosterMemberLeftSchema: z.ZodObject<{
    leftDate: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
/**
 * Schema for recording a player being kicked from the clan
 */
export declare const rosterMemberKickedSchema: z.ZodObject<{
    kickedDate: z.ZodOptional<z.ZodDate>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Schema for reactivating a player
 */
export declare const rosterMemberReactivateSchema: z.ZodObject<{
    joinedDate: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
/**
 * Schema for roster listing query parameters
 */
export declare const rosterListQuerySchema: z.ZodObject<{
    active: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        all: "all";
        true: "true";
        false: "false";
    }>>>, z.ZodTransform<boolean | undefined, "all" | "true" | "false">>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodEnum<{
        leftDate: "leftDate";
        kickedDate: "kickedDate";
        joinedDate: "joinedDate";
        playerName: "playerName";
    }>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type RosterMemberLeftSchema = z.infer<typeof rosterMemberLeftSchema>;
export type RosterMemberKickedSchema = z.infer<typeof rosterMemberKickedSchema>;
export type RosterMemberReactivateSchema = z.infer<typeof rosterMemberReactivateSchema>;
export type RosterListQuerySchema = z.infer<typeof rosterListQuerySchema>;
//# sourceMappingURL=roster.d.ts.map