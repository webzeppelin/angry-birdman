/**
 * Battle-related Zod validation schemas
 *
 * These schemas validate battle data entry, including metadata, performance data,
 * player stats, nonplayer stats, and action codes according to specs/high-level-spec.md
 * Section 6 (Data Concepts) and specs/epics-and-stories.md Epic 4.
 */
import { z } from 'zod';
/**
 * Battle metadata input schema
 * Field order matches data entry workflow from game UI:
 * battleId → opponentRovioId → opponentName → opponentCountry
 *
 * Note: startDate and endDate are now derived from battleId via MasterBattle table
 */
export declare const battleMetadataSchema: z.ZodObject<{
    battleId: z.ZodString;
    opponentRovioId: z.ZodNumber;
    opponentName: z.ZodString;
    opponentCountry: z.ZodString;
}, z.core.$strip>;
export type BattleMetadata = z.infer<typeof battleMetadataSchema>;
/**
 * Clan performance data input schema
 * Field order: score → baselineFp
 */
export declare const clanPerformanceSchema: z.ZodObject<{
    score: z.ZodNumber;
    baselineFp: z.ZodNumber;
}, z.core.$strip>;
export type ClanPerformance = z.infer<typeof clanPerformanceSchema>;
/**
 * Opponent performance data input schema
 * Field order: opponentScore → opponentFp
 */
export declare const opponentPerformanceSchema: z.ZodObject<{
    opponentScore: z.ZodNumber;
    opponentFp: z.ZodNumber;
}, z.core.$strip>;
export type OpponentPerformance = z.infer<typeof opponentPerformanceSchema>;
/**
 * Individual player performance input schema
 * Field order: rank → playerName/playerId → score → fp
 * Note: ratio and ratioRank are calculated, not input
 */
export declare const playerStatsInputSchema: z.ZodObject<{
    playerId: z.ZodNumber;
    rank: z.ZodNumber;
    score: z.ZodNumber;
    fp: z.ZodNumber;
    actionCode: z.ZodString;
    actionReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PlayerStatsInput = z.infer<typeof playerStatsInputSchema>;
/**
 * Array of player stats with minimum 1 player requirement
 */
export declare const playerStatsArraySchema: z.ZodArray<z.ZodObject<{
    playerId: z.ZodNumber;
    rank: z.ZodNumber;
    score: z.ZodNumber;
    fp: z.ZodNumber;
    actionCode: z.ZodString;
    actionReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
export type PlayerStatsArray = z.infer<typeof playerStatsArraySchema>;
/**
 * Nonplayer performance input schema
 * Field order: name/playerId → fp → reserve
 */
export declare const nonplayerStatsInputSchema: z.ZodObject<{
    playerId: z.ZodNumber;
    fp: z.ZodNumber;
    reserve: z.ZodDefault<z.ZodBoolean>;
    actionCode: z.ZodString;
    actionReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type NonplayerStatsInput = z.infer<typeof nonplayerStatsInputSchema>;
/**
 * Array of nonplayer stats (can be empty if all roster members played)
 */
export declare const nonplayerStatsArraySchema: z.ZodArray<z.ZodObject<{
    playerId: z.ZodNumber;
    fp: z.ZodNumber;
    reserve: z.ZodDefault<z.ZodBoolean>;
    actionCode: z.ZodString;
    actionReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
export type NonplayerStatsArray = z.infer<typeof nonplayerStatsArraySchema>;
/**
 * Complete battle entry data combining all input sections
 * This represents the full data needed to create a battle record
 *
 * Note: startDate and endDate are no longer input fields - they are derived
 * from the battleId by looking up the MasterBattle record
 */
export declare const battleEntrySchema: z.ZodObject<{
    battleId: z.ZodString;
    opponentRovioId: z.ZodNumber;
    opponentName: z.ZodString;
    opponentCountry: z.ZodString;
    score: z.ZodNumber;
    baselineFp: z.ZodNumber;
    opponentScore: z.ZodNumber;
    opponentFp: z.ZodNumber;
    playerStats: z.ZodArray<z.ZodObject<{
        playerId: z.ZodNumber;
        rank: z.ZodNumber;
        score: z.ZodNumber;
        fp: z.ZodNumber;
        actionCode: z.ZodString;
        actionReason: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    nonplayerStats: z.ZodArray<z.ZodObject<{
        playerId: z.ZodNumber;
        fp: z.ZodNumber;
        reserve: z.ZodDefault<z.ZodBoolean>;
        actionCode: z.ZodString;
        actionReason: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type BattleEntry = z.infer<typeof battleEntrySchema>;
/**
 * Schema for updating an existing battle (all fields optional except what changed)
 * Note: battleId cannot be changed - it identifies the battle
 * Note: startDate and endDate cannot be changed - they come from MasterBattle
 */
export declare const battleUpdateSchema: z.ZodObject<{
    opponentRovioId: z.ZodOptional<z.ZodNumber>;
    opponentName: z.ZodOptional<z.ZodString>;
    opponentCountry: z.ZodOptional<z.ZodString>;
    score: z.ZodOptional<z.ZodNumber>;
    baselineFp: z.ZodOptional<z.ZodNumber>;
    opponentScore: z.ZodOptional<z.ZodNumber>;
    opponentFp: z.ZodOptional<z.ZodNumber>;
    playerStats: z.ZodOptional<z.ZodArray<z.ZodObject<{
        playerId: z.ZodNumber;
        rank: z.ZodNumber;
        score: z.ZodNumber;
        fp: z.ZodNumber;
        actionCode: z.ZodString;
        actionReason: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    nonplayerStats: z.ZodOptional<z.ZodArray<z.ZodObject<{
        playerId: z.ZodNumber;
        fp: z.ZodNumber;
        reserve: z.ZodDefault<z.ZodBoolean>;
        actionCode: z.ZodString;
        actionReason: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type BattleUpdate = z.infer<typeof battleUpdateSchema>;
/**
 * Schema for querying/filtering battles
 */
export declare const battleQuerySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    opponentName: z.ZodOptional<z.ZodString>;
    opponentCountry: z.ZodOptional<z.ZodString>;
    result: z.ZodOptional<z.ZodEnum<{
        0: "0";
        1: "1";
        [-1]: "-1";
    }>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        startDate: "startDate";
        score: "score";
        opponentScore: "opponentScore";
        ratio: "ratio";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strict>;
export type BattleQuery = z.infer<typeof battleQuerySchema>;
/**
 * Schema for calculated battle data returned from API
 * Includes all input fields plus calculated fields
 */
export declare const battleResponseSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    startDate: z.ZodCoercedDate<unknown>;
    endDate: z.ZodCoercedDate<unknown>;
    result: z.ZodNumber;
    score: z.ZodNumber;
    fp: z.ZodNumber;
    baselineFp: z.ZodNumber;
    ratio: z.ZodNumber;
    averageRatio: z.ZodNumber;
    projectedScore: z.ZodNumber;
    opponentName: z.ZodString;
    opponentRovioId: z.ZodNumber;
    opponentCountry: z.ZodString;
    opponentScore: z.ZodNumber;
    opponentFp: z.ZodNumber;
    marginRatio: z.ZodNumber;
    fpMargin: z.ZodNumber;
    nonplayingCount: z.ZodNumber;
    nonplayingFpRatio: z.ZodNumber;
    reserveCount: z.ZodNumber;
    reserveFpRatio: z.ZodNumber;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export type BattleResponse = z.infer<typeof battleResponseSchema>;
/**
 * Schema for player stats response (includes calculated fields)
 */
export declare const playerStatsResponseSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    playerId: z.ZodNumber;
    playerName: z.ZodString;
    rank: z.ZodNumber;
    score: z.ZodNumber;
    fp: z.ZodNumber;
    ratio: z.ZodNumber;
    ratioRank: z.ZodNumber;
    actionCode: z.ZodString;
    actionReason: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export type PlayerStatsResponse = z.infer<typeof playerStatsResponseSchema>;
/**
 * Schema for nonplayer stats response
 */
export declare const nonplayerStatsResponseSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    playerId: z.ZodNumber;
    playerName: z.ZodString;
    fp: z.ZodNumber;
    reserve: z.ZodBoolean;
    actionCode: z.ZodString;
    actionReason: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export type NonplayerStatsResponse = z.infer<typeof nonplayerStatsResponseSchema>;
/**
 * Complete battle detail response including all related data
 */
export declare const battleDetailResponseSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    startDate: z.ZodCoercedDate<unknown>;
    endDate: z.ZodCoercedDate<unknown>;
    result: z.ZodNumber;
    score: z.ZodNumber;
    fp: z.ZodNumber;
    baselineFp: z.ZodNumber;
    ratio: z.ZodNumber;
    averageRatio: z.ZodNumber;
    projectedScore: z.ZodNumber;
    opponentName: z.ZodString;
    opponentRovioId: z.ZodNumber;
    opponentCountry: z.ZodString;
    opponentScore: z.ZodNumber;
    opponentFp: z.ZodNumber;
    marginRatio: z.ZodNumber;
    fpMargin: z.ZodNumber;
    nonplayingCount: z.ZodNumber;
    nonplayingFpRatio: z.ZodNumber;
    reserveCount: z.ZodNumber;
    reserveFpRatio: z.ZodNumber;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    playerStats: z.ZodArray<z.ZodObject<{
        clanId: z.ZodNumber;
        battleId: z.ZodString;
        playerId: z.ZodNumber;
        playerName: z.ZodString;
        rank: z.ZodNumber;
        score: z.ZodNumber;
        fp: z.ZodNumber;
        ratio: z.ZodNumber;
        ratioRank: z.ZodNumber;
        actionCode: z.ZodString;
        actionReason: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodCoercedDate<unknown>;
        updatedAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    nonplayerStats: z.ZodArray<z.ZodObject<{
        clanId: z.ZodNumber;
        battleId: z.ZodString;
        playerId: z.ZodNumber;
        playerName: z.ZodString;
        fp: z.ZodNumber;
        reserve: z.ZodBoolean;
        actionCode: z.ZodString;
        actionReason: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodCoercedDate<unknown>;
        updatedAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type BattleDetailResponse = z.infer<typeof battleDetailResponseSchema>;
/**
 * Schema for action code lookup table
 */
export declare const actionCodeRecordSchema: z.ZodObject<{
    actionCode: z.ZodString;
    displayName: z.ZodString;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export type ActionCodeRecord = z.infer<typeof actionCodeRecordSchema>;
/**
 * Valid action codes enum
 * From specs: HOLD, WARN, KICK, RESERVE, PASS
 */
export declare const validActionCodes: z.ZodEnum<{
    HOLD: "HOLD";
    WARN: "WARN";
    KICK: "KICK";
    RESERVE: "RESERVE";
    PASS: "PASS";
}>;
export type ValidActionCode = z.infer<typeof validActionCodes>;
//# sourceMappingURL=battle.d.ts.map