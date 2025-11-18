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
 * startDate → endDate → opponentRovioId → opponentName → opponentCountry
 */
export const battleMetadataSchema = z
  .object({
    startDate: z.coerce.date({
      required_error: 'Start date is required',
      invalid_type_error: 'Start date must be a valid date',
    }),
    endDate: z.coerce.date({
      required_error: 'End date is required',
      invalid_type_error: 'End date must be a valid date',
    }),
    opponentRovioId: z
      .number({
        required_error: 'Opponent Rovio ID is required',
        invalid_type_error: 'Opponent Rovio ID must be a number',
      })
      .int()
      .positive('Opponent Rovio ID must be positive'),
    opponentName: z
      .string({
        required_error: 'Opponent name is required',
      })
      .min(1, 'Opponent name cannot be empty')
      .max(100, 'Opponent name too long'),
    opponentCountry: z
      .string({
        required_error: 'Opponent country is required',
      })
      .min(1, 'Opponent country cannot be empty')
      .max(100, 'Opponent country too long'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export type BattleMetadata = z.infer<typeof battleMetadataSchema>;

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
      required_error: 'Clan score is required',
      invalid_type_error: 'Clan score must be a number',
    })
    .int()
    .nonnegative('Clan score cannot be negative'),
  baselineFp: z
    .number({
      required_error: 'Clan baseline FP is required',
      invalid_type_error: 'Clan baseline FP must be a number',
    })
    .int()
    .positive('Clan baseline FP must be positive'),
});

export type ClanPerformance = z.infer<typeof clanPerformanceSchema>;

/**
 * Opponent performance data input schema
 * Field order: opponentScore → opponentFp
 */
export const opponentPerformanceSchema = z.object({
  opponentScore: z
    .number({
      required_error: 'Opponent score is required',
      invalid_type_error: 'Opponent score must be a number',
    })
    .int()
    .nonnegative('Opponent score cannot be negative'),
  opponentFp: z
    .number({
      required_error: 'Opponent FP is required',
      invalid_type_error: 'Opponent FP must be a number',
    })
    .int()
    .positive('Opponent FP must be positive'),
});

export type OpponentPerformance = z.infer<typeof opponentPerformanceSchema>;

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
      required_error: 'Player ID is required',
      invalid_type_error: 'Player ID must be a number',
    })
    .int()
    .positive('Player ID must be positive'),
  rank: z
    .number({
      required_error: 'Player rank is required',
      invalid_type_error: 'Player rank must be a number',
    })
    .int()
    .positive('Player rank must be positive'),
  score: z
    .number({
      required_error: 'Player score is required',
      invalid_type_error: 'Player score must be a number',
    })
    .int()
    .nonnegative('Player score cannot be negative'),
  fp: z
    .number({
      required_error: 'Player FP is required',
      invalid_type_error: 'Player FP must be a number',
    })
    .int()
    .positive('Player FP must be positive'),
  actionCode: z
    .string({
      required_error: 'Action code is required',
    })
    .min(1, 'Action code cannot be empty'),
  actionReason: z.string().max(1000, 'Action reason too long').optional(),
});

export type PlayerStatsInput = z.infer<typeof playerStatsInputSchema>;

/**
 * Array of player stats with minimum 1 player requirement
 */
export const playerStatsArraySchema = z
  .array(playerStatsInputSchema)
  .min(1, 'At least one player must have participated in the battle');

export type PlayerStatsArray = z.infer<typeof playerStatsArraySchema>;

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
      required_error: 'Player ID is required',
      invalid_type_error: 'Player ID must be a number',
    })
    .int()
    .positive('Player ID must be positive'),
  fp: z
    .number({
      required_error: 'Player FP is required',
      invalid_type_error: 'Player FP must be a number',
    })
    .int()
    .positive('Player FP must be positive'),
  reserve: z
    .boolean({
      required_error: 'Reserve status is required',
      invalid_type_error: 'Reserve status must be a boolean',
    })
    .default(false),
  actionCode: z
    .string({
      required_error: 'Action code is required',
    })
    .min(1, 'Action code cannot be empty'),
  actionReason: z.string().max(1000, 'Action reason too long').optional(),
});

export type NonplayerStatsInput = z.infer<typeof nonplayerStatsInputSchema>;

/**
 * Array of nonplayer stats (can be empty if all roster members played)
 */
export const nonplayerStatsArraySchema = z.array(nonplayerStatsInputSchema);

export type NonplayerStatsArray = z.infer<typeof nonplayerStatsArraySchema>;

// ============================================================================
// Complete Battle Entry Schema (Stories 4.1-4.7)
// ============================================================================

/**
 * Complete battle entry data combining all input sections
 * This represents the full data needed to create a battle record
 */
export const battleEntrySchema = z
  .object({
    // Battle metadata (Story 4.2)
    startDate: z.coerce.date({
      required_error: 'Start date is required',
      invalid_type_error: 'Start date must be a valid date',
    }),
    endDate: z.coerce.date({
      required_error: 'End date is required',
      invalid_type_error: 'End date must be a valid date',
    }),
    opponentRovioId: z
      .number({
        required_error: 'Opponent Rovio ID is required',
        invalid_type_error: 'Opponent Rovio ID must be a number',
      })
      .int()
      .positive('Opponent Rovio ID must be positive'),
    opponentName: z
      .string({
        required_error: 'Opponent name is required',
      })
      .min(1, 'Opponent name cannot be empty')
      .max(100, 'Opponent name too long'),
    opponentCountry: z
      .string({
        required_error: 'Opponent country is required',
      })
      .min(1, 'Opponent country cannot be empty')
      .max(100, 'Opponent country too long'),

    // Clan performance (Story 4.3)
    score: z
      .number({
        required_error: 'Clan score is required',
        invalid_type_error: 'Clan score must be a number',
      })
      .int()
      .nonnegative('Clan score cannot be negative'),
    baselineFp: z
      .number({
        required_error: 'Clan baseline FP is required',
        invalid_type_error: 'Clan baseline FP must be a number',
      })
      .int()
      .positive('Clan baseline FP must be positive'),

    // Opponent performance (Story 4.4)
    opponentScore: z
      .number({
        required_error: 'Opponent score is required',
        invalid_type_error: 'Opponent score must be a number',
      })
      .int()
      .nonnegative('Opponent score cannot be negative'),
    opponentFp: z
      .number({
        required_error: 'Opponent FP is required',
        invalid_type_error: 'Opponent FP must be a number',
      })
      .int()
      .positive('Opponent FP must be positive'),

    // Player stats (Story 4.5)
    playerStats: playerStatsArraySchema,

    // Nonplayer stats (Story 4.6)
    nonplayerStats: nonplayerStatsArraySchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export type BattleEntry = z.infer<typeof battleEntrySchema>;

// ============================================================================
// Battle Update Schema (Story 4.11)
// ============================================================================

/**
 * Schema for updating an existing battle (all fields optional except what changed)
 * This is the same as battleEntrySchema but with all fields optional
 */
export const battleUpdateSchema = z
  .object({
    // Battle metadata (Story 4.2)
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
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
  })
  .refine(
    (data) => {
      // Only validate date relationship if both dates are provided
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export type BattleUpdate = z.infer<typeof battleUpdateSchema>;

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

export type BattleQuery = z.infer<typeof battleQuerySchema>;

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

export type BattleResponse = z.infer<typeof battleResponseSchema>;

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

export type PlayerStatsResponse = z.infer<typeof playerStatsResponseSchema>;

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

export type NonplayerStatsResponse = z.infer<typeof nonplayerStatsResponseSchema>;

/**
 * Complete battle detail response including all related data
 */
export const battleDetailResponseSchema = battleResponseSchema.extend({
  playerStats: z.array(playerStatsResponseSchema),
  nonplayerStats: z.array(nonplayerStatsResponseSchema),
});

export type BattleDetailResponse = z.infer<typeof battleDetailResponseSchema>;

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

export type ActionCodeRecord = z.infer<typeof actionCodeRecordSchema>;

/**
 * Valid action codes enum
 * From specs: HOLD, WARN, KICK, RESERVE, PASS
 */
export const validActionCodes = z.enum(['HOLD', 'WARN', 'KICK', 'RESERVE', 'PASS']);

export type ValidActionCode = z.infer<typeof validActionCodes>;
