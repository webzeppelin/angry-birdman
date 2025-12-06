/**
 * Frontend timezone utilities
 *
 * Uses browser's Intl API for timezone conversions.
 * Official Angry Birds Time is EST (UTC-5, never observes DST).
 */

/**
 * Format a date in the user's local timezone
 *
 * @param date - Date to format (can be Date object or ISO string)
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatForUserTimezone(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    ...options,
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Format a date in EST timezone (Official Angry Birds Time)
 *
 * @param date - Date to format (can be Date object or ISO string)
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string in EST
 */
export function formatInEST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York', // EST/EDT, but we'll always show as EST
    timeZoneName: 'short',
    ...options,
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Format a date as a simple date string (no time)
 *
 * @param date - Date to format
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
 * Get the user's current timezone from the browser
 *
 * @returns IANA timezone string (e.g., "America/Chicago")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a date for display in battle lists (compact format)
 *
 * @param date - Date to format
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
 *
 * @param targetDate - Future date to count down to
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
 *
 * @param targetDate - Future date to count down to
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
