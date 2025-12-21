/**
 * Constants and enums for Angry Birdman
 * This module contains application-wide constants including action codes,
 * battle result values, and validation constraints.
 */
/**
 * Post-battle action codes for roster management
 * These actions determine what happens to players after each battle
 */
export declare const ACTION_CODES: {
    readonly HOLD: "HOLD";
    readonly WARN: "WARN";
    readonly KICK: "KICK";
    readonly RESERVE: "RESERVE";
    readonly PASS: "PASS";
};
export type ActionCode = (typeof ACTION_CODES)[keyof typeof ACTION_CODES];
/**
 * Display names for action codes
 */
export declare const ACTION_DISPLAY_NAMES: Record<ActionCode, string>;
/**
 * Battle result values
 * These indicate the outcome of a clan battle
 */
export declare const BATTLE_RESULTS: {
    readonly WIN: 1;
    readonly LOSS: -1;
    readonly TIE: 0;
};
export type BattleResult = (typeof BATTLE_RESULTS)[keyof typeof BATTLE_RESULTS];
/**
 * Display names for battle results
 */
export declare const BATTLE_RESULT_DISPLAY_NAMES: Record<BattleResult, string>;
/**
 * Minimum number of battles required for monthly/yearly individual stats
 */
export declare const MIN_BATTLES_FOR_STATS = 3;
/**
 * Battle ID format (YYYYMMDD)
 */
export declare const BATTLE_ID_LENGTH = 8;
/**
 * Month ID format (YYYYMM)
 */
export declare const MONTH_ID_LENGTH = 6;
/**
 * Year ID format (YYYY)
 */
export declare const YEAR_ID_LENGTH = 4;
/**
 * Ratio calculation multiplier
 * Ratio scores are multiplied by this value to put them on an approximate 100 point scale
 */
export declare const RATIO_MULTIPLIER = 1000;
/**
 * Percentage calculation multiplier
 */
export declare const PERCENTAGE_MULTIPLIER = 100;
/**
 * Maximum clan size
 */
export declare const MAX_CLAN_SIZE = 50;
/**
 * Minimum Flock Power value
 */
export declare const MIN_FLOCK_POWER = 1;
/**
 * Maximum reasonable Flock Power value
 * This is a soft limit for validation purposes
 */
export declare const MAX_FLOCK_POWER = 5000;
/**
 * Battle ID date format (YYYYMMDD)
 */
export declare const BATTLE_ID_FORMAT = "YYYYMMDD";
/**
 * Month ID date format (YYYYMM)
 */
export declare const MONTH_ID_FORMAT = "YYYYMM";
/**
 * Year ID date format (YYYY)
 */
export declare const YEAR_ID_FORMAT = "YYYY";
//# sourceMappingURL=index.d.ts.map