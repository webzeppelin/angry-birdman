/**
 * Constants and enums for Angry Birdman
 * This module contains application-wide constants including action codes,
 * battle result values, and validation constraints.
 */

// ============================================================================
// Action Codes
// ============================================================================

/**
 * Post-battle action codes for roster management
 * These actions determine what happens to players after each battle
 */
export const ACTION_CODES = {
  HOLD: 'HOLD', // Keep player in clan, no action
  WARN: 'WARN', // Warn player about performance/participation
  KICK: 'KICK', // Remove player from clan
  RESERVE: 'RESERVE', // Move player to reserve status
  PASS: 'PASS', // Give player a pass for this battle
} as const;

export type ActionCode = (typeof ACTION_CODES)[keyof typeof ACTION_CODES];

/**
 * Display names for action codes
 */
export const ACTION_DISPLAY_NAMES: Record<ActionCode, string> = {
  [ACTION_CODES.HOLD]: 'Hold',
  [ACTION_CODES.WARN]: 'Warn',
  [ACTION_CODES.KICK]: 'Kick',
  [ACTION_CODES.RESERVE]: 'Move to Reserve',
  [ACTION_CODES.PASS]: 'Pass',
};

// ============================================================================
// Battle Results
// ============================================================================

/**
 * Battle result values
 * These indicate the outcome of a clan battle
 */
export const BATTLE_RESULTS = {
  WIN: 1, // Clan won the battle
  LOSS: -1, // Clan lost the battle
  TIE: 0, // Battle ended in a tie
} as const;

export type BattleResult = (typeof BATTLE_RESULTS)[keyof typeof BATTLE_RESULTS];

/**
 * Display names for battle results
 */
export const BATTLE_RESULT_DISPLAY_NAMES: Record<BattleResult, string> = {
  [BATTLE_RESULTS.WIN]: 'Win',
  [BATTLE_RESULTS.LOSS]: 'Loss',
  [BATTLE_RESULTS.TIE]: 'Tie',
};

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Minimum number of battles required for monthly/yearly individual stats
 */
export const MIN_BATTLES_FOR_STATS = 3;

/**
 * Battle ID format (YYYYMMDD)
 */
export const BATTLE_ID_LENGTH = 8;

/**
 * Month ID format (YYYYMM)
 */
export const MONTH_ID_LENGTH = 6;

/**
 * Year ID format (YYYY)
 */
export const YEAR_ID_LENGTH = 4;

/**
 * Ratio calculation multiplier
 * Ratio scores are multiplied by this value to put them on an approximate 100 point scale
 */
export const RATIO_MULTIPLIER = 10;

/**
 * Percentage calculation multiplier
 */
export const PERCENTAGE_MULTIPLIER = 100;

/**
 * Maximum clan size
 */
export const MAX_CLAN_SIZE = 50;

/**
 * Minimum Flock Power value
 */
export const MIN_FLOCK_POWER = 1;

/**
 * Maximum reasonable Flock Power value
 * This is a soft limit for validation purposes
 */
export const MAX_FLOCK_POWER = 5000;

// ============================================================================
// Date Formats
// ============================================================================

/**
 * Battle ID date format (YYYYMMDD)
 */
export const BATTLE_ID_FORMAT = 'YYYYMMDD';

/**
 * Month ID date format (YYYYMM)
 */
export const MONTH_ID_FORMAT = 'YYYYMM';

/**
 * Year ID date format (YYYY)
 */
export const YEAR_ID_FORMAT = 'YYYY';
