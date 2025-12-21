/**
 * Zod validation schemas for Angry Birdman
 * These schemas provide runtime validation for all data entities
 */
import { z } from 'zod';
export * from './user-management.js';
export * from './roster.js';
export * from './battle.js';
export * from './battleSchedule.js';
/**
 * Schema for action codes
 */
export declare const actionCodeSchema: z.ZodEnum<{
    HOLD: "HOLD";
    WARN: "WARN";
    KICK: "KICK";
    RESERVE: "RESERVE";
    PASS: "PASS";
}>;
/**
 * Schema for battle results
 */
export declare const battleResultSchema: z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<-1>, z.ZodLiteral<0>]>;
/**
 * Schema for positive integers (Flock Power, scores, etc.)
 */
export declare const positiveIntegerSchema: z.ZodNumber;
/**
 * Schema for non-negative integers (counts, ranks, etc.)
 */
export declare const nonNegativeIntegerSchema: z.ZodNumber;
/**
 * Schema for Flock Power values
 */
export declare const flockPowerSchema: z.ZodNumber;
/**
 * Schema for battle ID (YYYYMMDD)
 */
export declare const battleIdSchema: z.ZodString;
/**
 * Schema for month ID (YYYYMM)
 */
export declare const monthIdSchema: z.ZodString;
/**
 * Schema for year ID (YYYY)
 */
export declare const yearIdSchema: z.ZodString;
/**
 * Schema for Clan entity
 */
export declare const clanSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    rovioId: z.ZodNumber;
    name: z.ZodString;
    country: z.ZodString;
    registrationDate: z.ZodDate;
    active: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for creating a clan
 */
export declare const clanCreateSchema: z.ZodObject<{
    rovioId: z.ZodNumber;
    name: z.ZodString;
    country: z.ZodString;
    registrationDate: z.ZodOptional<z.ZodDate>;
    active: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Schema for updating a clan
 */
export declare const clanUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/**
 * Schema for User entity
 */
export declare const userSchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    clanId: z.ZodNullable<z.ZodNumber>;
    owner: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for creating a user
 */
export declare const userCreateSchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    clanId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    owner: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Schema for updating a user
 */
export declare const userUpdateSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    clanId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    owner: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/**
 * Schema for RosterMember entity
 */
export declare const rosterMemberSchema: z.ZodObject<{
    playerId: z.ZodNumber;
    clanId: z.ZodNumber;
    playerName: z.ZodString;
    active: z.ZodBoolean;
    joinedDate: z.ZodDate;
    leftDate: z.ZodNullable<z.ZodDate>;
    kickedDate: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for creating a roster member
 */
export declare const rosterMemberCreateSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    playerName: z.ZodString;
    active: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    joinedDate: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
/**
 * Schema for updating a roster member
 */
export declare const rosterMemberUpdateSchema: z.ZodObject<{
    playerName: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
    leftDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    kickedDate: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
/**
 * Schema for ClanBattle entity
 */
export declare const clanBattleSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    result: z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<-1>, z.ZodLiteral<0>]>;
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
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for creating a clan battle
 */
export declare const clanBattleCreateSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    score: z.ZodNumber;
    baselineFp: z.ZodNumber;
    opponentName: z.ZodString;
    opponentRovioId: z.ZodNumber;
    opponentCountry: z.ZodString;
    opponentScore: z.ZodNumber;
    opponentFp: z.ZodNumber;
}, z.core.$strip>;
/**
 * Schema for updating a clan battle
 */
export declare const clanBattleUpdateSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
    score: z.ZodOptional<z.ZodNumber>;
    baselineFp: z.ZodOptional<z.ZodNumber>;
    opponentName: z.ZodOptional<z.ZodString>;
    opponentRovioId: z.ZodOptional<z.ZodNumber>;
    opponentCountry: z.ZodOptional<z.ZodString>;
    opponentScore: z.ZodOptional<z.ZodNumber>;
    opponentFp: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Schema for ClanBattlePlayerStats entity
 */
export declare const clanBattlePlayerStatsSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    playerId: z.ZodNumber;
    rank: z.ZodNumber;
    score: z.ZodNumber;
    fp: z.ZodNumber;
    ratio: z.ZodNumber;
    ratioRank: z.ZodNumber;
    actionCode: z.ZodEnum<{
        HOLD: "HOLD";
        WARN: "WARN";
        KICK: "KICK";
        RESERVE: "RESERVE";
        PASS: "PASS";
    }>;
    actionReason: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for creating player stats
 */
export declare const clanBattlePlayerStatsCreateSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    playerId: z.ZodNumber;
    rank: z.ZodNumber;
    score: z.ZodNumber;
    fp: z.ZodNumber;
    actionCode: z.ZodEnum<{
        HOLD: "HOLD";
        WARN: "WARN";
        KICK: "KICK";
        RESERVE: "RESERVE";
        PASS: "PASS";
    }>;
    actionReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Schema for updating player stats
 */
export declare const clanBattlePlayerStatsUpdateSchema: z.ZodObject<{
    rank: z.ZodOptional<z.ZodNumber>;
    score: z.ZodOptional<z.ZodNumber>;
    fp: z.ZodOptional<z.ZodNumber>;
    actionCode: z.ZodOptional<z.ZodEnum<{
        HOLD: "HOLD";
        WARN: "WARN";
        KICK: "KICK";
        RESERVE: "RESERVE";
        PASS: "PASS";
    }>>;
    actionReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Schema for ClanBattleNonplayerStats entity
 */
export declare const clanBattleNonplayerStatsSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    playerId: z.ZodNumber;
    fp: z.ZodNumber;
    reserve: z.ZodBoolean;
    actionCode: z.ZodEnum<{
        HOLD: "HOLD";
        WARN: "WARN";
        KICK: "KICK";
        RESERVE: "RESERVE";
        PASS: "PASS";
    }>;
    actionReason: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for creating nonplayer stats
 */
export declare const clanBattleNonplayerStatsCreateSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    battleId: z.ZodString;
    playerId: z.ZodNumber;
    fp: z.ZodNumber;
    reserve: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    actionCode: z.ZodEnum<{
        HOLD: "HOLD";
        WARN: "WARN";
        KICK: "KICK";
        RESERVE: "RESERVE";
        PASS: "PASS";
    }>;
    actionReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Schema for updating nonplayer stats
 */
export declare const clanBattleNonplayerStatsUpdateSchema: z.ZodObject<{
    fp: z.ZodOptional<z.ZodNumber>;
    reserve: z.ZodOptional<z.ZodBoolean>;
    actionCode: z.ZodOptional<z.ZodEnum<{
        HOLD: "HOLD";
        WARN: "WARN";
        KICK: "KICK";
        RESERVE: "RESERVE";
        PASS: "PASS";
    }>>;
    actionReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Schema for MonthlyClanPerformance entity
 */
export declare const monthlyClanPerformanceSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    monthId: z.ZodString;
    battleCount: z.ZodNumber;
    wonCount: z.ZodNumber;
    lostCount: z.ZodNumber;
    tiedCount: z.ZodNumber;
    monthComplete: z.ZodBoolean;
    averageFp: z.ZodNumber;
    averageBaselineFp: z.ZodNumber;
    averageRatio: z.ZodNumber;
    averageMarginRatio: z.ZodNumber;
    averageFpMargin: z.ZodNumber;
    averageNonplayingCount: z.ZodNumber;
    averageNonplayingFpRatio: z.ZodNumber;
    averageReserveCount: z.ZodNumber;
    averageReserveFpRatio: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for MonthlyIndividualPerformance entity
 */
export declare const monthlyIndividualPerformanceSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    monthId: z.ZodString;
    playerId: z.ZodNumber;
    battlesPlayed: z.ZodNumber;
    averageScore: z.ZodNumber;
    averageFp: z.ZodNumber;
    averageRatio: z.ZodNumber;
    averageRank: z.ZodNumber;
    averageRatioRank: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for YearlyClanPerformance entity
 */
export declare const yearlyClanPerformanceSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    yearId: z.ZodString;
    battleCount: z.ZodNumber;
    wonCount: z.ZodNumber;
    lostCount: z.ZodNumber;
    tiedCount: z.ZodNumber;
    yearComplete: z.ZodBoolean;
    averageFp: z.ZodNumber;
    averageBaselineFp: z.ZodNumber;
    averageRatio: z.ZodNumber;
    averageMarginRatio: z.ZodNumber;
    averageFpMargin: z.ZodNumber;
    averageNonplayingCount: z.ZodNumber;
    averageNonplayingFpRatio: z.ZodNumber;
    averageReserveCount: z.ZodNumber;
    averageReserveFpRatio: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for YearlyIndividualPerformance entity
 */
export declare const yearlyIndividualPerformanceSchema: z.ZodObject<{
    clanId: z.ZodNumber;
    yearId: z.ZodString;
    playerId: z.ZodNumber;
    battlesPlayed: z.ZodNumber;
    averageScore: z.ZodNumber;
    averageFp: z.ZodNumber;
    averageRatio: z.ZodNumber;
    averageRank: z.ZodNumber;
    averageRatioRank: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Schema for pagination parameters
 */
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
/**
 * Schema for sorting parameters
 */
export declare const sortingSchema: z.ZodObject<{
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
}, z.core.$strip>;
/**
 * Schema for date range filter
 */
export declare const dateRangeSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export type ActionCodeSchema = z.infer<typeof actionCodeSchema>;
export type BattleResultSchema = z.infer<typeof battleResultSchema>;
export type ClanSchema = z.infer<typeof clanSchema>;
export type ClanCreateSchema = z.infer<typeof clanCreateSchema>;
export type ClanUpdateSchema = z.infer<typeof clanUpdateSchema>;
export type UserSchema = z.infer<typeof userSchema>;
export type UserCreateSchema = z.infer<typeof userCreateSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;
export type RosterMemberSchema = z.infer<typeof rosterMemberSchema>;
export type RosterMemberCreateSchema = z.infer<typeof rosterMemberCreateSchema>;
export type RosterMemberUpdateSchema = z.infer<typeof rosterMemberUpdateSchema>;
export type ClanBattleSchema = z.infer<typeof clanBattleSchema>;
export type ClanBattleCreateSchema = z.infer<typeof clanBattleCreateSchema>;
export type ClanBattleUpdateSchema = z.infer<typeof clanBattleUpdateSchema>;
export type ClanBattlePlayerStatsSchema = z.infer<typeof clanBattlePlayerStatsSchema>;
export type ClanBattlePlayerStatsCreateSchema = z.infer<typeof clanBattlePlayerStatsCreateSchema>;
export type ClanBattlePlayerStatsUpdateSchema = z.infer<typeof clanBattlePlayerStatsUpdateSchema>;
export type ClanBattleNonplayerStatsSchema = z.infer<typeof clanBattleNonplayerStatsSchema>;
export type ClanBattleNonplayerStatsCreateSchema = z.infer<typeof clanBattleNonplayerStatsCreateSchema>;
export type ClanBattleNonplayerStatsUpdateSchema = z.infer<typeof clanBattleNonplayerStatsUpdateSchema>;
export type MonthlyClanPerformanceSchema = z.infer<typeof monthlyClanPerformanceSchema>;
export type MonthlyIndividualPerformanceSchema = z.infer<typeof monthlyIndividualPerformanceSchema>;
export type YearlyClanPerformanceSchema = z.infer<typeof yearlyClanPerformanceSchema>;
export type YearlyIndividualPerformanceSchema = z.infer<typeof yearlyIndividualPerformanceSchema>;
export type PaginationSchema = z.infer<typeof paginationSchema>;
export type SortingSchema = z.infer<typeof sortingSchema>;
export type DateRangeSchema = z.infer<typeof dateRangeSchema>;
//# sourceMappingURL=index.d.ts.map