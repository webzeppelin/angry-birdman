/**
 * Date formatting utilities for Angry Birdman
 * Handles battle ID, month ID, and year ID generation
 */
/**
 * Generate a battle ID from a date
 * Format: YYYYMMDD
 *
 * @deprecated Use generateBattleIdFromEst() from battleId.ts instead.
 * This function uses local timezone which can cause inconsistencies.
 * For Master Battle schedule, use EST-aware functions.
 *
 * @param date - The date to convert
 * @returns Battle ID string
 */
export declare function generateBattleId(date: Date): string;
/**
 * Generate a month ID from a date
 * Format: YYYYMM
 * @param date - The date to convert
 * @returns Month ID string
 */
export declare function generateMonthId(date: Date): string;
/**
 * Generate a year ID from a date
 * Format: YYYY
 * @param date - The date to convert
 * @returns Year ID string
 */
export declare function generateYearId(date: Date): string;
/**
 * Parse a battle ID to a Date object
 *
 * @deprecated Use parseBattleId() from battleId.ts instead.
 * This function is kept for backward compatibility only.
 *
 * @param battleId - Battle ID string (YYYYMMDD)
 * @returns Date object
 * @throws Error if battle ID is invalid
 */
export declare function parseBattleId(battleId: string): Date;
/**
 * Parse a month ID to a Date object (first day of month)
 * @param monthId - Month ID string (YYYYMM)
 * @returns Date object set to first day of month
 * @throws Error if month ID is invalid
 */
export declare function parseMonthId(monthId: string): Date;
/**
 * Parse a year ID to a Date object (first day of year)
 * @param yearId - Year ID string (YYYY)
 * @returns Date object set to first day of year
 * @throws Error if year ID is invalid
 */
export declare function parseYearId(yearId: string): Date;
/**
 * Validate a battle ID format
 *
 * @deprecated Use validateBattleId() from battleId.ts instead.
 * This function is kept for backward compatibility only.
 *
 * @param battleId - Battle ID to validate
 * @returns true if valid
 * @throws Error if invalid
 */
export declare function validateBattleId(battleId: string): boolean;
/**
 * Validate a month ID format
 * @param monthId - Month ID to validate
 * @returns true if valid
 */
export declare function validateMonthId(monthId: string): boolean;
/**
 * Validate a year ID format
 * @param yearId - Year ID to validate
 * @returns true if valid
 */
export declare function validateYearId(yearId: string): boolean;
/**
 * Get all battle IDs for a given month
 * @param monthId - Month ID (YYYYMM)
 * @returns Array of battle IDs for all days in the month
 */
export declare function getBattleIdsForMonth(monthId: string): string[];
/**
 * Get all month IDs for a given year
 * @param yearId - Year ID (YYYY)
 * @returns Array of month IDs for all months in the year
 */
export declare function getMonthIdsForYear(yearId: string): string[];
/**
 * Extract month ID from battle ID
 * @param battleId - Battle ID (YYYYMMDD)
 * @returns Month ID (YYYYMM)
 */
export declare function getMonthIdFromBattleId(battleId: string): string;
/**
 * Extract year ID from battle ID
 * @param battleId - Battle ID (YYYYMMDD)
 * @returns Year ID (YYYY)
 */
export declare function getYearIdFromBattleId(battleId: string): string;
/**
 * Extract year ID from month ID
 * @param monthId - Month ID (YYYYMM)
 * @returns Year ID (YYYY)
 */
export declare function getYearIdFromMonthId(monthId: string): string;
/**
 * Format a date as YYYY-MM-DD
 * @param date - Date to format
 * @returns Formatted date string
 */
export declare function formatDateISO(date: Date): string;
/**
 * Format a month ID for display (e.g., "January 2025")
 * @param monthId - Month ID (YYYYMM)
 * @param locale - Locale for month name (default: 'en-US')
 * @returns Formatted month string
 */
export declare function formatMonthDisplay(monthId: string, locale?: string): string;
/**
 * Format a battle ID for display (e.g., "November 8, 2025")
 * @param battleId - Battle ID (YYYYMMDD)
 * @param locale - Locale for date formatting (default: 'en-US')
 * @returns Formatted date string
 */
export declare function formatBattleDisplay(battleId: string, locale?: string): string;
//# sourceMappingURL=date-formatting.d.ts.map