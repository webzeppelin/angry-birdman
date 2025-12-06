/**
 * Battle ID utilities for Angry Birdman
 * All Battle IDs are based on Official Angry Birds Time (EST, never EDT)
 *
 * This is the authoritative module for battle ID operations.
 * Functions in date-formatting.ts are deprecated for battle ID use.
 */

import { BATTLE_ID_LENGTH } from '../constants/index.js';

// ============================================================================
// Core Battle ID Operations
// ============================================================================

/**
 * Generate a battle ID from a date in EST timezone
 *
 * IMPORTANT: This function expects the date to already be normalized to EST.
 * Use createEstDate() or getBattleStartTimestamp() from timezone.ts to ensure
 * correct timezone handling.
 *
 * @param estDate - Date in EST timezone (UTC components represent EST time)
 * @returns Battle ID in YYYYMMDD format
 *
 * @example
 * ```typescript
 * import { createEstDate } from './timezone.js';
 * const estDate = createEstDate(2025, 1, 15);
 * const battleId = generateBattleIdFromEst(estDate); // "20250115"
 * ```
 */
export function generateBattleIdFromEst(estDate: Date): string {
  const year = estDate.getUTCFullYear();
  const month = String(estDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(estDate.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Parse a battle ID to a Date object
 * Returns a date in local timezone with the parsed date components
 *
 * @param battleId - Battle ID string (YYYYMMDD)
 * @returns Date object with parsed date components
 * @throws Error if battle ID is invalid
 */
export function parseBattleId(battleId: string): Date {
  if (battleId.length !== BATTLE_ID_LENGTH) {
    throw new Error(
      `Invalid battle ID length: expected ${BATTLE_ID_LENGTH}, got ${battleId.length}`
    );
  }

  const year = parseInt(battleId.substring(0, 4), 10);
  const month = parseInt(battleId.substring(4, 6), 10);
  const day = parseInt(battleId.substring(6, 8), 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid battle ID format: ${battleId}`);
  }

  const date = new Date(year, month - 1, day);

  // Validate that the date is valid (e.g., not Feb 30)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid date in battle ID: ${battleId}`);
  }

  return date;
}

/**
 * Validate a battle ID format
 * @param battleId - Battle ID to validate
 * @returns true if valid YYYYMMDD format, false otherwise
 */
export function validateBattleId(battleId: string): boolean {
  try {
    parseBattleId(battleId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse Battle ID into date components
 * @param battleId - Battle ID in YYYYMMDD format
 * @returns Date components (year, month, day)
 * @throws Error if battleId format is invalid
 */
export function parseBattleIdComponents(battleId: string): {
  year: number;
  month: number;
  day: number;
} {
  const date = parseBattleId(battleId);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

// ============================================================================
// Battle ID Manipulation
// ============================================================================

/**
 * Get next battle ID (3 days after given battle)
 * @param battleId - Current battle ID in YYYYMMDD format
 * @returns Next battle ID in YYYYMMDD format
 * @throws Error if battleId format is invalid
 */
export function getNextBattleId(battleId: string): string {
  const date = parseBattleId(battleId);

  // Add 3 days (battle lasts 2 days + 1 day between battles)
  date.setDate(date.getDate() + 3);

  // Re-generate battle ID from new date (uses local timezone components)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Get previous battle ID (3 days before given battle)
 * @param battleId - Current battle ID in YYYYMMDD format
 * @returns Previous battle ID in YYYYMMDD format
 * @throws Error if battleId format is invalid
 */
export function getPreviousBattleId(battleId: string): string {
  const date = parseBattleId(battleId);

  // Subtract 3 days
  date.setDate(date.getDate() - 3);

  // Re-generate battle ID from new date (uses local timezone components)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Convert Battle ID to Date object
 * @param battleId - Battle ID in YYYYMMDD format
 * @returns Date object representing the battle start date
 * @throws Error if battleId format is invalid
 */
export function battleIdToDate(battleId: string): Date {
  return parseBattleId(battleId);
}

/**
 * Compare two battle IDs
 * @param battleId1 - First battle ID
 * @param battleId2 - Second battle ID
 * @returns Negative if battleId1 < battleId2, 0 if equal, positive if battleId1 > battleId2
 */
export function compareBattleIds(battleId1: string, battleId2: string): number {
  return battleId1.localeCompare(battleId2);
}

/**
 * Sort battle IDs in chronological order (oldest first)
 * @param battleIds - Array of battle IDs to sort
 * @returns Sorted array of battle IDs
 */
export function sortBattleIdsAscending(battleIds: string[]): string[] {
  return [...battleIds].sort((a, b) => compareBattleIds(a, b));
}

/**
 * Sort battle IDs in reverse chronological order (newest first)
 * @param battleIds - Array of battle IDs to sort
 * @returns Sorted array of battle IDs
 */
export function sortBattleIdsDescending(battleIds: string[]): string[] {
  return [...battleIds].sort((a, b) => compareBattleIds(b, a));
}
