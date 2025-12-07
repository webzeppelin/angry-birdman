/**
 * Utilities for Official Angry Birds Time (EST) and timezone conversions
 *
 * IMPORTANT: Official Angry Birds Time is ALWAYS Eastern Standard Time (EST),
 * it does NOT observe daylight saving time (never EDT).
 *
 * EST is UTC-5 year-round.
 */

// EST offset from UTC in milliseconds (5 hours)
const EST_OFFSET_MS = 5 * 60 * 60 * 1000;

/**
 * Convert any date to Official Angry Birds Time (EST)
 * This normalizes a date to EST timezone (UTC-5)
 *
 * @param date - Date in any timezone
 * @returns Date normalized to EST (UTC-5)
 */
export function toOfficialAngryBirdsTime(date: Date): Date {
  // Get UTC timestamp
  const utcTime = date.getTime();

  // Calculate EST time (UTC - 5 hours)
  const estTime = utcTime - EST_OFFSET_MS;

  // Create new date in EST
  const estDate = new Date(estTime);

  // Return date with time adjusted to EST
  return new Date(
    Date.UTC(
      estDate.getUTCFullYear(),
      estDate.getUTCMonth(),
      estDate.getUTCDate(),
      estDate.getUTCHours(),
      estDate.getUTCMinutes(),
      estDate.getUTCSeconds(),
      estDate.getUTCMilliseconds()
    )
  );
}

/**
 * Convert EST date to GMT for database storage
 * Takes a date that represents EST time and converts it to GMT
 *
 * @param estDate - Date representing EST time
 * @returns Date converted to GMT (adds 5 hours)
 */
export function estToGmt(estDate: Date): Date {
  // EST is UTC-5, so to convert to GMT we add 5 hours
  const gmtTime = estDate.getTime() + EST_OFFSET_MS;
  return new Date(gmtTime);
}

/**
 * Convert GMT date to EST for display
 * Takes a GMT date and converts it to EST time
 *
 * @param gmtDate - Date in GMT timezone
 * @returns Date converted to EST (subtracts 5 hours)
 */
export function gmtToEst(gmtDate: Date): Date {
  // GMT to EST is UTC-5, so we subtract 5 hours
  const estTime = gmtDate.getTime() - EST_OFFSET_MS;
  return new Date(estTime);
}

/**
 * Get current time in Official Angry Birds Time (EST)
 * @returns Current date/time in EST timezone
 */
export function getCurrentAngryBirdsTime(): Date {
  return toOfficialAngryBirdsTime(new Date());
}

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
export function createEstDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date {
  // Create date representing EST time, stored as UTC
  // EST is UTC-5, so to represent midnight EST we need 05:00 UTC
  // Example: Dec 9 00:00 EST = Dec 9 05:00 UTC
  return new Date(Date.UTC(year, month - 1, day, hour + 5, minute, second));
}

/**
 * Format date for display in user's local timezone
 * @param date - Date to format (can be Date object or ISO string)
 * @param timezoneOrOptions - IANA timezone string OR Intl.DateTimeFormatOptions
 * @param optionsParam - Intl.DateTimeFormatOptions (only used if second param is timezone string)
 * @returns Formatted date string
 */
export function formatForUserTimezone(
  date: Date | string,
  timezoneOrOptions?: string | Intl.DateTimeFormatOptions,
  optionsParam?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  };

  // If second parameter is a string, it's a timezone
  if (typeof timezoneOrOptions === 'string') {
    const options = optionsParam || defaultOptions;
    const formatOptions = { ...options, timeZone: timezoneOrOptions };
    return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
  }

  // Otherwise, second parameter is options
  const formatOptions = timezoneOrOptions || defaultOptions;
  return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
}

/**
 * Format date in EST timezone (permanent UTC-5, no DST)
 * Official Angry Birds Time is always EST, never EDT
 * @param date - Date to format (can be Date object or ISO string)
 * @param options - Optional Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string in EST (always UTC-5)
 */
export function formatInEst(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Subtract 5 hours to get EST time (UTC-5, no DST)
  const estTime = new Date(dateObj.getTime() - EST_OFFSET_MS);

  // Format using UTC methods (which will show the EST time we calculated)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const formatOptions = options || defaultOptions;
  const formatted = new Intl.DateTimeFormat('en-US', {
    ...formatOptions,
    timeZone: 'UTC', // Use UTC so it shows the pre-adjusted time
  }).format(estTime);

  return formatted;
}

/**
 * Get battle start timestamp (midnight EST) for a given date
 * @param date - Date in any timezone
 * @returns Date representing midnight EST on the given date
 */
export function getBattleStartTimestamp(date: Date): Date {
  return createEstDate(date.getFullYear(), date.getMonth() + 1, date.getDate(), 0, 0, 0);
}

/**
 * Get battle end timestamp (23:59:59 EST, 1 day after start for 48-hour duration)
 * @param startDate - Battle start date
 * @returns Date representing end of battle (48 hours = 1 day later at 23:59:59 EST)
 */
export function getBattleEndTimestamp(startDate: Date): Date {
  // Battle lasts 48 hours: starts at midnight day 0, ends at 23:59:59 day 1
  // So we add 1 day, not 2
  const endYear = startDate.getFullYear();
  const endMonth = startDate.getMonth() + 1;
  const endDay = startDate.getDate() + 1;

  // Create date with 1 day added (Date constructor handles overflow)
  const tempDate = new Date(endYear, endMonth - 1, endDay);

  // Set to 23:59:59
  return createEstDate(
    tempDate.getFullYear(),
    tempDate.getMonth() + 1,
    tempDate.getDate(),
    23,
    59,
    59
  );
}

/**
 * Check if a date is in the future (compared to current Official Angry Birds Time)
 * @param date - Date to check
 * @returns true if date is in the future
 */
export function isInFuture(date: Date): boolean {
  const now = new Date();
  return date.getTime() > now.getTime();
}

/**
 * Check if a date is in the past (compared to current Official Angry Birds Time)
 * @param date - Date to check
 * @returns true if date is in the past
 */
export function isInPast(date: Date): boolean {
  const now = new Date();
  return date.getTime() < now.getTime();
}

/**
 * Get the user's current timezone from the browser (client-side only)
 * @returns IANA timezone string (e.g., "America/Chicago")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a date as a simple date string (no time)
 * @param date - Date to format (can be Date object or ISO string)
 * @param timezone - Optional timezone (defaults to user's timezone)
 * @returns Date string like "Dec 5, 2024"
 */
export function formatDateOnly(date: Date | string, timezone?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  };

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format a date for display in battle lists (compact format)
 * @param date - Date to format (can be Date object or ISO string)
 * @returns Compact date string like "12/05/24"
 */
export function formatBattleDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Calculate time remaining until a future date
 * @param targetDate - Future date to count down to (can be Date object or ISO string)
 * @returns Object with days, hours, minutes, seconds remaining
 */
export function getTimeRemaining(targetDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const total = target.getTime() - now.getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Format time remaining as a human-readable string
 * @param targetDate - Future date to count down to (can be Date object or ISO string)
 * @returns String like "2 days, 5 hours" or "Started" if past
 */
export function formatTimeRemaining(targetDate: Date | string): string {
  const remaining = getTimeRemaining(targetDate);

  if (remaining.total <= 0) {
    return 'Started';
  }

  if (remaining.days > 0) {
    return `${remaining.days} day${remaining.days !== 1 ? 's' : ''}, ${remaining.hours} hour${remaining.hours !== 1 ? 's' : ''}`;
  }

  if (remaining.hours > 0) {
    return `${remaining.hours} hour${remaining.hours !== 1 ? 's' : ''}, ${remaining.minutes} minute${remaining.minutes !== 1 ? 's' : ''}`;
  }

  return `${remaining.minutes} minute${remaining.minutes !== 1 ? 's' : ''}`;
}
