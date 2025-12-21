/**
 * Utilities for Official Angry Birds Time (EST) and timezone conversions
 *
 * IMPORTANT: Official Angry Birds Time is ALWAYS Eastern Standard Time (EST),
 * it does NOT observe daylight saving time (never EDT).
 *
 * EST is UTC-5 year-round.
 */
/**
 * Convert any date to Official Angry Birds Time (EST)
 * This normalizes a date to EST timezone (UTC-5)
 *
 * @param date - Date in any timezone
 * @returns Date normalized to EST (UTC-5)
 */
export declare function toOfficialAngryBirdsTime(date: Date): Date;
/**
 * Convert EST date to GMT for database storage
 * Takes a date that represents EST time and converts it to GMT
 *
 * @param estDate - Date representing EST time
 * @returns Date converted to GMT (adds 5 hours)
 */
export declare function estToGmt(estDate: Date): Date;
/**
 * Convert GMT date to EST for display
 * Takes a GMT date and converts it to EST time
 *
 * @param gmtDate - Date in GMT timezone
 * @returns Date converted to EST (subtracts 5 hours)
 */
export declare function gmtToEst(gmtDate: Date): Date;
/**
 * Get current time in Official Angry Birds Time (EST)
 * @returns Current date/time in EST timezone
 */
export declare function getCurrentAngryBirdsTime(): Date;
/**
 * Create a date in EST timezone from date components
 * @param year - Year
 * @param month - Month (1-12, not 0-11)
 * @param day - Day of month
 * @param hour - Hour (0-23), defaults to 0
 * @param minute - Minute (0-59), defaults to 0
 * @param second - Second (0-59), defaults to 0
 * @returns Date in EST timezone
 */
export declare function createEstDate(year: number, month: number, day: number, hour?: number, minute?: number, second?: number): Date;
/**
 * Format date for display in user's local timezone
 * @param date - Date to format (can be Date object or ISO string)
 * @param timezoneOrOptions - IANA timezone string OR Intl.DateTimeFormatOptions
 * @param optionsParam - Intl.DateTimeFormatOptions (only used if second param is timezone string)
 * @returns Formatted date string
 */
export declare function formatForUserTimezone(date: Date | string, timezoneOrOptions?: string | Intl.DateTimeFormatOptions, optionsParam?: Intl.DateTimeFormatOptions): string;
/**
 * Format date in EST timezone (permanent UTC-5, no DST)
 * Official Angry Birds Time is always EST, never EDT
 * @param date - Date to format (can be Date object or ISO string)
 * @param options - Optional Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string in EST (always UTC-5)
 */
export declare function formatInEst(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Get battle start timestamp (midnight EST) for a given date
 * @param date - Date in any timezone
 * @returns Date representing midnight EST on the given date
 */
export declare function getBattleStartTimestamp(date: Date): Date;
/**
 * Get battle end timestamp (23:59:59 EST, 1 day after start for 48-hour duration)
 * @param startDate - Battle start date
 * @returns Date representing end of battle (48 hours = 1 day later at 23:59:59 EST)
 */
export declare function getBattleEndTimestamp(startDate: Date): Date;
/**
 * Check if a date is in the future (compared to current Official Angry Birds Time)
 * @param date - Date to check
 * @returns true if date is in the future
 */
export declare function isInFuture(date: Date): boolean;
/**
 * Check if a date is in the past (compared to current Official Angry Birds Time)
 * @param date - Date to check
 * @returns true if date is in the past
 */
export declare function isInPast(date: Date): boolean;
/**
 * Get the user's current timezone from the browser (client-side only)
 * @returns IANA timezone string (e.g., "America/Chicago")
 */
export declare function getUserTimezone(): string;
/**
 * Format a date as a simple date string (no time)
 * @param date - Date to format (can be Date object or ISO string)
 * @param timezone - Optional timezone (defaults to user's timezone)
 * @returns Date string like "Dec 5, 2024"
 */
export declare function formatDateOnly(date: Date | string, timezone?: string): string;
/**
 * Format a date for display in battle lists (compact format)
 * @param date - Date to format (can be Date object or ISO string)
 * @returns Compact date string like "12/05/24"
 */
export declare function formatBattleDate(date: Date | string): string;
/**
 * Calculate time remaining until a future date
 * @param targetDate - Future date to count down to (can be Date object or ISO string)
 * @returns Object with days, hours, minutes, seconds remaining
 */
export declare function getTimeRemaining(targetDate: Date | string): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
};
/**
 * Format time remaining as a human-readable string
 * @param targetDate - Future date to count down to (can be Date object or ISO string)
 * @returns String like "2 days, 5 hours" or "Started" if past
 */
export declare function formatTimeRemaining(targetDate: Date | string): string;
//# sourceMappingURL=timezone.d.ts.map