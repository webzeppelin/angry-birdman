/**
 * Validation schemas for battle schedule operations
 */
import { z } from 'zod';
/**
 * Validate Battle ID format (YYYYMMDD)
 */
export declare const battleIdSchema: z.ZodString;
/**
 * Schema for Master Battle record
 */
export declare const masterBattleSchema: z.ZodObject<{
    battleId: z.ZodString;
    startTimestamp: z.ZodDate;
    endTimestamp: z.ZodDate;
    createdBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Schema for creating a new Master Battle
 */
export declare const createMasterBattleSchema: z.ZodObject<{
    startDate: z.ZodCoercedDate<unknown>;
    createdBy: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Schema for updating next battle date
 */
export declare const updateNextBattleDateSchema: z.ZodObject<{
    nextBattleStartDate: z.ZodString;
}, z.core.$strip>;
/**
 * Schema for battle selection (used in battle entry form)
 */
export declare const battleSelectionSchema: z.ZodObject<{
    battleId: z.ZodString;
}, z.core.$strip>;
/**
 * Schema for system setting
 */
export declare const systemSettingSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dataType: z.ZodEnum<{
        string: "string";
        number: "number";
        boolean: "boolean";
        date: "date";
        json: "json";
    }>;
}, z.core.$strip>;
/**
 * Schema for updating a system setting
 */
export declare const updateSystemSettingSchema: z.ZodObject<{
    value: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Schema for Master Battle query options
 */
export declare const masterBattleQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        battleId: "battleId";
        startTimestamp: "startTimestamp";
        createdAt: "createdAt";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    startDateFrom: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    startDateTo: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
/**
 * Helper to validate Battle ID with detailed error message
 */
export declare function validateBattleIdWithError(battleId: string): {
    success: boolean;
    error?: string;
};
/**
 * Helper to validate next battle date with detailed error message
 */
export declare function validateNextBattleDateWithError(dateStr: string): {
    success: boolean;
    error?: string;
};
//# sourceMappingURL=battleSchedule.d.ts.map