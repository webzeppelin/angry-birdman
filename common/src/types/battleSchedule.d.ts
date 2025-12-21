/**
 * TypeScript types for battle schedule domain
 */
/**
 * Master Battle record representing a scheduled CvC battle
 * This is the centralized schedule that all clans reference
 */
export interface MasterBattle {
    /** Battle ID in YYYYMMDD format (based on start date in EST) */
    battleId: string;
    /** Battle start timestamp (midnight EST, stored as GMT) */
    startTimestamp: Date;
    /** Battle end timestamp (23:59:59 EST 2 days later, stored as GMT) */
    endTimestamp: Date;
    /** User ID who created this battle (null if created automatically by scheduler) */
    createdBy: string | null;
    /** Optional notes about schedule changes or corrections */
    notes: string | null;
    /** When this record was created */
    createdAt: Date;
    /** When this record was last updated */
    updatedAt: Date;
}
/**
 * System setting record for configuration values
 */
export interface SystemSetting {
    /** Setting key (e.g., 'nextBattleStartDate', 'schedulerEnabled') */
    key: string;
    /** Setting value (JSON-encoded) */
    value: string;
    /** Human-readable description of the setting */
    description: string | null;
    /** Data type of the value ('string', 'number', 'boolean', 'date', 'json') */
    dataType: 'string' | 'number' | 'boolean' | 'date' | 'json';
    /** When this setting was created */
    createdAt: Date;
    /** When this setting was last updated */
    updatedAt: Date;
}
/**
 * Battle schedule information for display/selection
 */
export interface BattleScheduleInfo {
    /** Current active battle (started but not ended) */
    currentBattle: MasterBattle | null;
    /** Next scheduled battle */
    nextBattle: MasterBattle | null;
    /** Next battle start date from system settings */
    nextBattleStartDate: Date;
    /** All available battles for selection (started but not future) */
    availableBattles: MasterBattle[];
}
/**
 * Input for creating a new Master Battle
 */
export interface CreateMasterBattleInput {
    /** Battle start date in EST timezone */
    startDate: Date;
    /** Optional user ID creating the battle */
    createdBy?: string;
    /** Optional notes */
    notes?: string;
}
/**
 * Input for updating next battle date
 */
export interface UpdateNextBattleDateInput {
    /** Next battle start date in ISO format (EST timezone) */
    nextBattleStartDate: string;
}
/**
 * Response from battle creation
 */
export interface CreateMasterBattleResponse {
    /** Created battle record */
    battle: MasterBattle;
    /** Success message */
    message: string;
}
/**
 * Paginated list of Master Battles
 */
export interface MasterBattlePage {
    /** Array of battles */
    battles: MasterBattle[];
    /** Total count of battles */
    total: number;
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    limit: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there is a next page */
    hasNext: boolean;
    /** Whether there is a previous page */
    hasPrevious: boolean;
}
/**
 * Options for querying Master Battles
 */
export interface MasterBattleQueryOptions {
    /** Page number (1-indexed) */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Sort field */
    sortBy?: 'battleId' | 'startTimestamp' | 'createdAt';
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
    /** Filter by start date range */
    startDateFrom?: Date;
    /** Filter by start date range */
    startDateTo?: Date;
}
//# sourceMappingURL=battleSchedule.d.ts.map