/**
 * Battle-related Zod validation schemas
 *
 * These schemas validate battle data entry, including metadata, performance data,
 * player stats, nonplayer stats, and action codes according to specs/high-level-spec.md
 * Section 6 (Data Concepts) and specs/epics-and-stories.md Epic 4.
 */
import { z } from 'zod';
// ============================================================================
// Battle Metadata Schemas (Story 4.2)
// ============================================================================
/**
 * Battle metadata input schema
 * Field order matches data entry workflow from game UI:
 * battleId → opponentRovioId → opponentName → opponentCountry
 *
 * Note: startDate and endDate are now derived from battleId via MasterBattle table
 */
export const battleMetadataSchema = z.object({
    battleId: z
        .string({
        message: 'Battle ID is required',
    })
        .regex(/^\d{8}$/, 'Battle ID must be in YYYYMMDD format'),
    opponentRovioId: z
        .number({
        message: 'Opponent Rovio ID is required and must be a number',
    })
        .int()
        .positive('Opponent Rovio ID must be positive'),
    opponentName: z
        .string({
        message: 'Opponent name is required',
    })
        .min(1, 'Opponent name cannot be empty')
        .max(100, 'Opponent name too long'),
    opponentCountry: z
        .string({
        message: 'Opponent country is required',
    })
        .min(1, 'Opponent country cannot be empty')
        .max(100, 'Opponent country too long'),
});
// ============================================================================
// Performance Data Schemas (Stories 4.3-4.4)
// ============================================================================
/**
 * Clan performance data input schema
 * Field order: score → baselineFp
 */
export const clanPerformanceSchema = z.object({
    score: z
        .number({
        message: 'Clan score is required and must be a number',
    })
        .int()
        .nonnegative('Clan score cannot be negative'),
    baselineFp: z
        .number({
        message: 'Clan baseline FP is required and must be a number',
    })
        .int()
        .positive('Clan baseline FP must be positive'),
});
/**
 * Opponent performance data input schema
 * Field order: opponentScore → opponentFp
 */
export const opponentPerformanceSchema = z.object({
    opponentScore: z
        .number({
        message: 'Opponent score is required and must be a number',
    })
        .int()
        .nonnegative('Opponent score cannot be negative'),
    opponentFp: z
        .number({
        message: 'Opponent FP is required and must be a number',
    })
        .int()
        .positive('Opponent FP must be positive'),
});
// ============================================================================
// Player Stats Schemas (Story 4.5)
// ============================================================================
/**
 * Individual player performance input schema
 * Field order: rank → playerName/playerId → score → fp
 * Note: ratio and ratioRank are calculated, not input
 */
export const playerStatsInputSchema = z.object({
    playerId: z
        .number({
        message: 'Player ID is required and must be a number',
    })
        .int()
        .positive('Player ID must be positive'),
    rank: z
        .number({
        message: 'Player rank is required and must be a number',
    })
        .int()
        .positive('Player rank must be positive'),
    score: z
        .number({
        message: 'Player score is required and must be a number',
    })
        .int()
        .nonnegative('Player score cannot be negative'),
    fp: z
        .number({
        message: 'Player FP is required and must be a number',
    })
        .int()
        .positive('Player FP must be positive'),
    actionCode: z
        .string({
        message: 'Action code is required',
    })
        .min(1, 'Action code cannot be empty'),
    actionReason: z.string().max(1000, 'Action reason too long').optional(),
});
/**
 * Array of player stats with minimum 1 player requirement
 */
export const playerStatsArraySchema = z
    .array(playerStatsInputSchema)
    .min(1, 'At least one player must have participated in the battle');
// ============================================================================
// Nonplayer Stats Schemas (Story 4.6)
// ============================================================================
/**
 * Nonplayer performance input schema
 * Field order: name/playerId → fp → reserve
 */
export const nonplayerStatsInputSchema = z.object({
    playerId: z
        .number({
        message: 'Player ID is required and must be a number',
    })
        .int()
        .positive('Player ID must be positive'),
    fp: z
        .number({
        message: 'Player FP is required and must be a number',
    })
        .int()
        .positive('Player FP must be positive'),
    reserve: z
        .boolean({
        message: 'Reserve status is required and must be a boolean',
    })
        .default(false),
    actionCode: z
        .string({
        message: 'Action code is required',
    })
        .min(1, 'Action code cannot be empty'),
    actionReason: z.string().max(1000, 'Action reason too long').optional(),
});
/**
 * Array of nonplayer stats (can be empty if all roster members played)
 */
export const nonplayerStatsArraySchema = z.array(nonplayerStatsInputSchema);
// ============================================================================
// Complete Battle Entry Schema (Stories 4.1-4.7)
// ============================================================================
/**
 * Complete battle entry data combining all input sections
 * This represents the full data needed to create a battle record
 *
 * Note: startDate and endDate are no longer input fields - they are derived
 * from the battleId by looking up the MasterBattle record
 */
export const battleEntrySchema = z.object({
    // Battle metadata (Story 4.2) - now using battleId from MasterBattle
    battleId: z
        .string({
        message: 'Battle ID is required',
    })
        .regex(/^\d{8}$/, 'Battle ID must be in YYYYMMDD format'),
    opponentRovioId: z
        .number({
        message: 'Opponent Rovio ID is required and must be a number',
    })
        .int()
        .positive('Opponent Rovio ID must be positive'),
    opponentName: z
        .string({
        message: 'Opponent name is required',
    })
        .min(1, 'Opponent name cannot be empty')
        .max(100, 'Opponent name too long'),
    opponentCountry: z
        .string({
        message: 'Opponent country is required',
    })
        .min(1, 'Opponent country cannot be empty')
        .max(100, 'Opponent country too long'),
    // Clan performance (Story 4.3)
    score: z
        .number({
        message: 'Clan score is required and must be a number',
    })
        .int()
        .nonnegative('Clan score cannot be negative'),
    baselineFp: z
        .number({
        message: 'Clan baseline FP is required and must be a number',
    })
        .int()
        .positive('Clan baseline FP must be positive'),
    // Opponent performance (Story 4.4)
    opponentScore: z
        .number({
        message: 'Opponent score is required and must be a number',
    })
        .int()
        .nonnegative('Opponent score cannot be negative'),
    opponentFp: z
        .number({
        message: 'Opponent FP is required and must be a number',
    })
        .int()
        .positive('Opponent FP must be positive'),
    // Player stats (Story 4.5)
    playerStats: playerStatsArraySchema,
    // Nonplayer stats (Story 4.6)
    nonplayerStats: nonplayerStatsArraySchema,
});
// ============================================================================
// Battle Update Schema (Story 4.11)
// ============================================================================
/**
 * Schema for updating an existing battle (all fields optional except what changed)
 * Note: battleId cannot be changed - it identifies the battle
 * Note: startDate and endDate cannot be changed - they come from MasterBattle
 */
export const battleUpdateSchema = z.object({
    // Battle metadata (Story 4.2) - battleId and dates cannot be changed
    opponentRovioId: z.number().int().positive().optional(),
    opponentName: z.string().min(1).max(100).optional(),
    opponentCountry: z.string().min(1).max(100).optional(),
    // Clan performance (Story 4.3)
    score: z.number().int().nonnegative().optional(),
    baselineFp: z.number().int().positive().optional(),
    // Opponent performance (Story 4.4)
    opponentScore: z.number().int().nonnegative().optional(),
    opponentFp: z.number().int().positive().optional(),
    // Player stats (Story 4.5)
    playerStats: playerStatsArraySchema.optional(),
    // Nonplayer stats (Story 4.6)
    nonplayerStats: nonplayerStatsArraySchema.optional(),
});
// ============================================================================
// Battle Query/Filter Schemas
// ============================================================================
/**
 * Schema for querying/filtering battles
 */
export const battleQuerySchema = z
    .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    opponentName: z.string().optional(),
    opponentCountry: z.string().optional(),
    result: z.enum(['1', '-1', '0']).optional(), // Win, Loss, Tie
    limit: z.coerce.number().int().positive().max(100).default(50),
    page: z.coerce.number().int().positive().default(1),
    sortBy: z.enum(['startDate', 'ratio', 'score', 'opponentScore']).default('startDate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
    .strict();
// ============================================================================
// Battle Response Schemas
// ============================================================================
/**
 * Schema for calculated battle data returned from API
 * Includes all input fields plus calculated fields
 */
export const battleResponseSchema = z.object({
    // Composite primary key
    clanId: z.number().int().positive(),
    battleId: z.string().length(8), // YYYYMMDD format
    // Battle metadata
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    // Battle result (calculated)
    result: z.number().int().min(-1).max(1), // -1 = Loss, 0 = Tie, 1 = Win
    // Clan performance
    score: z.number().int().nonnegative(),
    fp: z.number().int().positive(), // Calculated
    baselineFp: z.number().int().positive(),
    ratio: z.number().positive(), // Calculated
    averageRatio: z.number().positive(), // Calculated
    projectedScore: z.number().positive(), // Calculated
    // Opponent data
    opponentName: z.string(),
    opponentRovioId: z.number().int().positive(),
    opponentCountry: z.string(),
    opponentScore: z.number().int().nonnegative(),
    opponentFp: z.number().int().positive(),
    // Performance margins (calculated)
    marginRatio: z.number(), // Can be negative
    fpMargin: z.number(), // Can be negative
    // Non-player statistics (calculated)
    nonplayingCount: z.number().int().nonnegative(),
    nonplayingFpRatio: z.number().nonnegative(),
    reserveCount: z.number().int().nonnegative(),
    reserveFpRatio: z.number().nonnegative(),
    // Timestamps
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
/**
 * Schema for player stats response (includes calculated fields)
 */
export const playerStatsResponseSchema = z.object({
    clanId: z.number().int().positive(),
    battleId: z.string().length(8),
    playerId: z.number().int().positive(),
    playerName: z.string(), // From roster join
    rank: z.number().int().positive(),
    score: z.number().int().nonnegative(),
    fp: z.number().int().positive(),
    ratio: z.number().positive(), // Calculated
    ratioRank: z.number().int().positive(), // Calculated
    actionCode: z.string(),
    actionReason: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
/**
 * Schema for nonplayer stats response
 */
export const nonplayerStatsResponseSchema = z.object({
    clanId: z.number().int().positive(),
    battleId: z.string().length(8),
    playerId: z.number().int().positive(),
    playerName: z.string(), // From roster join
    fp: z.number().int().positive(),
    reserve: z.boolean(),
    actionCode: z.string(),
    actionReason: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
/**
 * Complete battle detail response including all related data
 */
export const battleDetailResponseSchema = battleResponseSchema.extend({
    playerStats: z.array(playerStatsResponseSchema),
    nonplayerStats: z.array(nonplayerStatsResponseSchema),
});
// ============================================================================
// Action Code Schemas
// ============================================================================
/**
 * Schema for action code lookup table
 */
export const actionCodeRecordSchema = z.object({
    actionCode: z.string(),
    displayName: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
/**
 * Valid action codes enum
 * From specs: HOLD, WARN, KICK, RESERVE, PASS
 */
export const validActionCodes = z.enum(['HOLD', 'WARN', 'KICK', 'RESERVE', 'PASS']);
//# sourceMappingURL=battle.js.map