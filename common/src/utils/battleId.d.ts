/**
 * Battle ID utilities for Angry Birdman
 * All Battle IDs are based on Official Angry Birds Time (EST, never EDT)
 *
 * This is the authoritative module for battle ID operations.
 * Functions in date-formatting.ts are deprecated for battle ID use.
 */
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
export declare function generateBattleIdFromEst(estDate: Date): string;
/**
 * Parse a battle ID to a Date object
 * Returns a date in local timezone with the parsed date components
 *
 * @param battleId - Battle ID string (YYYYMMDD)
 * @returns Date object with parsed date components
 * @throws Error if battle ID is invalid
 */
export declare function parseBattleId(battleId: string): Date;
/**
 * Validate a battle ID format
 * @param battleId - Battle ID to validate
 * @returns true if valid YYYYMMDD format, false otherwise
 */
export declare function validateBattleId(battleId: string): boolean;
/**
 * Parse Battle ID into date components
 * @param battleId - Battle ID in YYYYMMDD format
 * @returns Date components (year, month, day)
 * @throws Error if battleId format is invalid
 */
export declare function parseBattleIdComponents(battleId: string): {
    year: number;
    month: number;
    day: number;
};
/**
 * Get next battle ID (3 days after given battle)
 * @param battleId - Current battle ID in YYYYMMDD format
 * @returns Next battle ID in YYYYMMDD format
 * @throws Error if battleId format is invalid
 */
export declare function getNextBattleId(battleId: string): string;
/**
 * Get previous battle ID (3 days before given battle)
 * @param battleId - Current battle ID in YYYYMMDD format
 * @returns Previous battle ID in YYYYMMDD format
 * @throws Error if battleId format is invalid
 */
export declare function getPreviousBattleId(battleId: string): string;
/**
 * Convert Battle ID to Date object
 * @param battleId - Battle ID in YYYYMMDD format
 * @returns Date object representing the battle start date
 * @throws Error if battleId format is invalid
 */
export declare function battleIdToDate(battleId: string): Date;
/**
 * Compare two battle IDs
 * @param battleId1 - First battle ID
 * @param battleId2 - Second battle ID
 * @returns Negative if battleId1 < battleId2, 0 if equal, positive if battleId1 > battleId2
 */
export declare function compareBattleIds(battleId1: string, battleId2: string): number;
/**
 * Sort battle IDs in chronological order (oldest first)
 * @param battleIds - Array of battle IDs to sort
 * @returns Sorted array of battle IDs
 */
export declare function sortBattleIdsAscending(battleIds: string[]): string[];
/**
 * Sort battle IDs in reverse chronological order (newest first)
 * @param battleIds - Array of battle IDs to sort
 * @returns Sorted array of battle IDs
 */
export declare function sortBattleIdsDescending(battleIds: string[]): string[];
//# sourceMappingURL=battleId.d.ts.map