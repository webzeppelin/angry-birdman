/**
 * Extended utilities for working with Battle IDs (YYYYMMDD format)
 * All Battle IDs are based on Official Angry Birds Time (EST, never EDT)
 *
 * NOTE: Core functions generateBattleId and parseBattleId are in date-formatting.ts
 * This file contains additional battle ID manipulation utilities.
 */

import { parseBattleId as parseBattleIdToDate } from './date-formatting.js';

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
  const date = parseBattleIdToDate(battleId);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * Validate Battle ID format
 * @param battleId - Battle ID to validate
 * @returns true if valid YYYYMMDD format, false otherwise
 */
export function isValidBattleId(battleId: string): boolean {
  try {
    parseBattleIdToDate(battleId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get next battle ID (3 days after given battle)
 * @param battleId - Current battle ID in YYYYMMDD format
 * @returns Next battle ID in YYYYMMDD format
 * @throws Error if battleId format is invalid
 */
export function getNextBattleId(battleId: string): string {
  const date = parseBattleIdToDate(battleId);

  // Add 3 days (battle lasts 2 days + 1 day between battles)
  date.setDate(date.getDate() + 3);

  // Re-generate battle ID from new date
  return generateBattleId(date);
}

/**
 * Get previous battle ID (3 days before given battle)
 * @param battleId - Current battle ID in YYYYMMDD format
 * @returns Previous battle ID in YYYYMMDD format
 * @throws Error if battleId format is invalid
 */
export function getPreviousBattleId(battleId: string): string {
  const date = parseBattleIdToDate(battleId);

  // Subtract 3 days
  date.setDate(date.getDate() - 3);

  // Re-generate battle ID from new date
  return generateBattleId(date);
}

/**
 * Convert Battle ID to Date object
 * @param battleId - Battle ID in YYYYMMDD format
 * @returns Date object representing the battle start date
 * @throws Error if battleId format is invalid
 */
export function battleIdToDate(battleId: string): Date {
  return parseBattleIdToDate(battleId);
}

// Helper function for generating battle IDs
function generateBattleId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
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
