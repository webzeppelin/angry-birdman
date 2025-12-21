/**
 * Validation schemas for battle schedule operations
 */
import { z } from 'zod';
/**
 * Battle ID validation regex (YYYYMMDD format)
 */
const BATTLE_ID_REGEX = /^\d{8}$/;
/**
 * Validate Battle ID format (YYYYMMDD)
 */
export const battleIdSchema = z
    .string()
    .regex(BATTLE_ID_REGEX, 'Battle ID must be in YYYYMMDD format')
    .refine((id) => {
    // Additional validation: must be a valid date
    const year = parseInt(id.substring(0, 4), 10);
    const month = parseInt(id.substring(4, 6), 10);
    const day = parseInt(id.substring(6, 8), 10);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}, { message: 'Battle ID must represent a valid date' });
/**
 * Schema for Master Battle record
 */
export const masterBattleSchema = z.object({
    battleId: battleIdSchema,
    startTimestamp: z.date(),
    endTimestamp: z.date(),
    createdBy: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});
/**
 * Schema for creating a new Master Battle
 */
export const createMasterBattleSchema = z.object({
    startDate: z.coerce.date(),
    createdBy: z.string().optional(),
    notes: z.string().max(1000).optional(),
});
/**
 * Schema for updating next battle date
 */
export const updateNextBattleDateSchema = z.object({
    nextBattleStartDate: z
        .string()
        .datetime({ message: 'Must be a valid ISO datetime string' })
        .refine((dateStr) => {
        // Must be a future date
        const date = new Date(dateStr);
        return date.getTime() > Date.now();
    }, { message: 'Next battle date must be in the future' }),
});
/**
 * Schema for battle selection (used in battle entry form)
 */
export const battleSelectionSchema = z.object({
    battleId: battleIdSchema,
});
/**
 * Schema for system setting
 */
export const systemSettingSchema = z.object({
    key: z.string().min(1).max(100),
    value: z.string(),
    description: z.string().nullable().optional(),
    dataType: z.enum(['string', 'number', 'boolean', 'date', 'json']),
});
/**
 * Schema for updating a system setting
 */
export const updateSystemSettingSchema = z.object({
    value: z.string(),
    description: z.string().nullable().optional(),
});
/**
 * Schema for Master Battle query options
 */
export const masterBattleQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(['battleId', 'startTimestamp', 'createdAt']).default('battleId'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    startDateFrom: z.coerce.date().optional(),
    startDateTo: z.coerce.date().optional(),
});
/**
 * Helper to validate Battle ID with detailed error message
 */
export function validateBattleIdWithError(battleId) {
    const result = battleIdSchema.safeParse(battleId);
    if (result.success) {
        return { success: true };
    }
    return {
        success: false,
        error: result.error.issues[0]?.message || 'Invalid Battle ID',
    };
}
/**
 * Helper to validate next battle date with detailed error message
 */
export function validateNextBattleDateWithError(dateStr) {
    const result = updateNextBattleDateSchema.safeParse({ nextBattleStartDate: dateStr });
    if (result.success) {
        return { success: true };
    }
    return {
        success: false,
        error: result.error.issues[0]?.message || 'Invalid date',
    };
}
//# sourceMappingURL=battleSchedule.js.map