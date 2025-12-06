/**
 * Date formatting utilities for Angry Birdman
 * Handles battle ID, month ID, and year ID generation
 */

import { BATTLE_ID_LENGTH, MONTH_ID_LENGTH, YEAR_ID_LENGTH } from '../constants/index.js';

// ============================================================================
// ID Generation from Dates
// ============================================================================

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
export function generateBattleId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generate a month ID from a date
 * Format: YYYYMM
 * @param date - The date to convert
 * @returns Month ID string
 */
export function generateMonthId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

/**
 * Generate a year ID from a date
 * Format: YYYY
 * @param date - The date to convert
 * @returns Year ID string
 */
export function generateYearId(date: Date): string {
  return String(date.getFullYear());
}

// ============================================================================
// ID Parsing to Dates
// ============================================================================

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
 * Parse a month ID to a Date object (first day of month)
 * @param monthId - Month ID string (YYYYMM)
 * @returns Date object set to first day of month
 * @throws Error if month ID is invalid
 */
export function parseMonthId(monthId: string): Date {
  if (monthId.length !== MONTH_ID_LENGTH) {
    throw new Error(`Invalid month ID length: expected ${MONTH_ID_LENGTH}, got ${monthId.length}`);
  }

  const year = parseInt(monthId.substring(0, 4), 10);
  const month = parseInt(monthId.substring(4, 6), 10);

  if (isNaN(year) || isNaN(month)) {
    throw new Error(`Invalid month ID format: ${monthId}`);
  }

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in month ID: ${monthId}`);
  }

  return new Date(year, month - 1, 1);
}

/**
 * Parse a year ID to a Date object (first day of year)
 * @param yearId - Year ID string (YYYY)
 * @returns Date object set to first day of year
 * @throws Error if year ID is invalid
 */
export function parseYearId(yearId: string): Date {
  if (yearId.length !== YEAR_ID_LENGTH) {
    throw new Error(`Invalid year ID length: expected ${YEAR_ID_LENGTH}, got ${yearId.length}`);
  }

  // Validate that the string contains only digits
  if (!/^\d+$/.test(yearId)) {
    throw new Error(`Invalid year ID format: ${yearId}`);
  }

  const year = parseInt(yearId, 10);

  if (isNaN(year)) {
    throw new Error(`Invalid year ID format: ${yearId}`);
  }

  return new Date(year, 0, 1);
}

// ============================================================================
// ID Validation
// ============================================================================

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
export function validateBattleId(battleId: string): boolean {
  try {
    parseBattleId(battleId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a month ID format
 * @param monthId - Month ID to validate
 * @returns true if valid
 */
export function validateMonthId(monthId: string): boolean {
  try {
    parseMonthId(monthId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a year ID format
 * @param yearId - Year ID to validate
 * @returns true if valid
 */
export function validateYearId(yearId: string): boolean {
  try {
    parseYearId(yearId);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Date Range Helpers
// ============================================================================

/**
 * Get all battle IDs for a given month
 * @param monthId - Month ID (YYYYMM)
 * @returns Array of battle IDs for all days in the month
 */
export function getBattleIdsForMonth(monthId: string): string[] {
  const date = parseMonthId(monthId);
  const year = date.getFullYear();
  const month = date.getMonth();

  const battleIds: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    battleIds.push(generateBattleId(dayDate));
  }

  return battleIds;
}

/**
 * Get all month IDs for a given year
 * @param yearId - Year ID (YYYY)
 * @returns Array of month IDs for all months in the year
 */
export function getMonthIdsForYear(yearId: string): string[] {
  const year = parseInt(yearId, 10);
  const monthIds: string[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthStr = String(month).padStart(2, '0');
    monthIds.push(`${year}${monthStr}`);
  }

  return monthIds;
}

/**
 * Extract month ID from battle ID
 * @param battleId - Battle ID (YYYYMMDD)
 * @returns Month ID (YYYYMM)
 */
export function getMonthIdFromBattleId(battleId: string): string {
  if (battleId.length !== BATTLE_ID_LENGTH) {
    throw new Error(`Invalid battle ID: ${battleId}`);
  }
  return battleId.substring(0, MONTH_ID_LENGTH);
}

/**
 * Extract year ID from battle ID
 * @param battleId - Battle ID (YYYYMMDD)
 * @returns Year ID (YYYY)
 */
export function getYearIdFromBattleId(battleId: string): string {
  if (battleId.length !== BATTLE_ID_LENGTH) {
    throw new Error(`Invalid battle ID: ${battleId}`);
  }
  return battleId.substring(0, YEAR_ID_LENGTH);
}

/**
 * Extract year ID from month ID
 * @param monthId - Month ID (YYYYMM)
 * @returns Year ID (YYYY)
 */
export function getYearIdFromMonthId(monthId: string): string {
  if (monthId.length !== MONTH_ID_LENGTH) {
    throw new Error(`Invalid month ID: ${monthId}`);
  }
  return monthId.substring(0, YEAR_ID_LENGTH);
}

// ============================================================================
// Date Formatting for Display
// ============================================================================

/**
 * Format a date as YYYY-MM-DD
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a month ID for display (e.g., "January 2025")
 * @param monthId - Month ID (YYYYMM)
 * @param locale - Locale for month name (default: 'en-US')
 * @returns Formatted month string
 */
export function formatMonthDisplay(monthId: string, locale = 'en-US'): string {
  const date = parseMonthId(monthId);
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}

/**
 * Format a battle ID for display (e.g., "November 8, 2025")
 * @param battleId - Battle ID (YYYYMMDD)
 * @param locale - Locale for date formatting (default: 'en-US')
 * @returns Formatted date string
 */
export function formatBattleDisplay(battleId: string, locale = 'en-US'): string {
  const date = parseBattleId(battleId);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
