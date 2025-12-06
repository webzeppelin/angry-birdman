/**
 * Audit Logging Service
 *
 * This service provides centralized audit logging for all administrative actions:
 * - User registration and profile changes
 * - Clan management actions
 * - Role assignments
 * - Roster changes
 *
 * @module services/audit
 */

import type { PrismaClient } from '@angrybirdman/database';

/**
 * Action types for audit logging
 */
export enum AuditAction {
  // User actions
  USER_REGISTERED = 'USER_REGISTERED',
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',
  USER_DISABLED = 'USER_DISABLED',
  USER_ENABLED = 'USER_ENABLED',
  USER_DELETED = 'USER_DELETED',

  // Clan actions
  CLAN_CREATED = 'CLAN_CREATED',
  CLAN_UPDATED = 'CLAN_UPDATED',
  CLAN_DEACTIVATED = 'CLAN_DEACTIVATED',
  CLAN_REACTIVATED = 'CLAN_REACTIVATED',

  // Admin request actions
  ADMIN_REQUEST_SUBMITTED = 'ADMIN_REQUEST_SUBMITTED',
  ADMIN_REQUEST_APPROVED = 'ADMIN_REQUEST_APPROVED',
  ADMIN_REQUEST_REJECTED = 'ADMIN_REQUEST_REJECTED',

  // Role actions
  USER_ROLE_ASSIGNED = 'USER_ROLE_ASSIGNED',
  USER_ROLE_REMOVED = 'USER_ROLE_REMOVED',
  USER_PROMOTED_TO_OWNER = 'USER_PROMOTED_TO_OWNER',
  USER_DEMOTED_FROM_OWNER = 'USER_DEMOTED_FROM_OWNER',
  USER_CLAN_ASSOCIATION_CHANGED = 'USER_CLAN_ASSOCIATION_CHANGED',

  // Roster actions
  ROSTER_MEMBER_ADDED = 'ROSTER_MEMBER_ADDED',
  ROSTER_MEMBER_UPDATED = 'ROSTER_MEMBER_UPDATED',
  ROSTER_MEMBER_LEFT = 'ROSTER_MEMBER_LEFT',
  ROSTER_MEMBER_KICKED = 'ROSTER_MEMBER_KICKED',
  ROSTER_MEMBER_REACTIVATED = 'ROSTER_MEMBER_REACTIVATED',

  // Battle actions
  BATTLE_CREATED = 'BATTLE_CREATED',
  BATTLE_UPDATED = 'BATTLE_UPDATED',
  BATTLE_DELETED = 'BATTLE_DELETED',

  // Period statistics actions
  MONTH_COMPLETED = 'MONTH_COMPLETED',
  MONTH_REOPENED = 'MONTH_REOPENED',
  YEAR_COMPLETED = 'YEAR_COMPLETED',
  YEAR_REOPENED = 'YEAR_REOPENED',
  RECALCULATE = 'RECALCULATE',

  // Master Battle / System actions
  MASTER_BATTLE_CREATED = 'MASTER_BATTLE_CREATED',
  SYSTEM_SETTING_UPDATED = 'SYSTEM_SETTING_UPDATED',

  // Generic actions for flexibility
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * Entity types for audit logging
 */
export enum EntityType {
  USER = 'USER',
  CLAN = 'CLAN',
  ROSTER_MEMBER = 'ROSTER_MEMBER',
  BATTLE = 'BATTLE',
  ADMIN_REQUEST = 'ADMIN_REQUEST',
  MONTHLY_STATS = 'MONTHLY_STATS',
  YEARLY_STATS = 'YEARLY_STATS',
  MASTER_BATTLE = 'MASTER_BATTLE',
  SYSTEM_SETTING = 'SYSTEM_SETTING',
}

/**
 * Result types for audit logging
 */
export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PARTIAL = 'PARTIAL',
}

/**
 * Audit log entry parameters
 */
export interface AuditLogEntry {
  actorId: string; // User who performed the action
  actionType: AuditAction;
  entityType: EntityType;
  entityId: string; // ID of the affected entity
  clanId?: number | null; // Clan context (if applicable)
  targetUserId?: string | null; // Affected user (if applicable)
  details?: string | object; // Additional details (will be JSON stringified if object)
  result: AuditResult;
}

/**
 * Audit Service for logging administrative actions
 */
export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create an audit log entry
   *
   * @param entry - Audit log parameters
   * @returns Created audit log entry
   */
  async log(entry: AuditLogEntry) {
    const details =
      typeof entry.details === 'object' ? JSON.stringify(entry.details) : entry.details;

    return await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        actionType: entry.actionType,
        entityType: entry.entityType,
        entityId: entry.entityId,
        clanId: entry.clanId,
        targetUserId: entry.targetUserId,
        details: details || null,
        result: entry.result,
      },
    });
  }

  /**
   * Get audit logs with optional filtering
   *
   * @param params - Filter parameters
   * @returns List of audit log entries
   */
  async getLogs(params?: {
    actorId?: string;
    actionType?: AuditAction;
    entityType?: EntityType;
    clanId?: number;
    targetUserId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: {
      actorId?: string;
      actionType?: string;
      entityType?: string;
      clanId?: number;
      targetUserId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (params?.actorId) where.actorId = params.actorId;
    if (params?.actionType) where.actionType = params.actionType;
    if (params?.entityType) where.entityType = params.entityType;
    if (params?.clanId) where.clanId = params.clanId;
    if (params?.targetUserId) where.targetUserId = params.targetUserId;

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              userId: true,
              username: true,
              email: true,
            },
          },
          targetUser: {
            select: {
              userId: true,
              username: true,
              email: true,
            },
          },
          clan: {
            select: {
              clanId: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: params?.limit || 100,
        skip: params?.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: params?.limit || 100,
      offset: params?.offset || 0,
    };
  }

  /**
   * Get audit logs for a specific clan
   *
   * @param clanId - Clan ID
   * @param limit - Maximum number of entries to return
   * @param offset - Number of entries to skip
   * @returns List of audit log entries
   */
  async getClanLogs(clanId: number, limit = 100, offset = 0) {
    return this.getLogs({ clanId, limit, offset });
  }

  /**
   * Get audit logs for a specific user
   *
   * @param userId - User ID
   * @param limit - Maximum number of entries to return
   * @param offset - Number of entries to skip
   * @returns List of audit log entries
   */
  async getUserLogs(userId: string, limit = 100, offset = 0) {
    return this.getLogs({ actorId: userId, limit, offset });
  }

  /**
   * Get recent audit logs
   *
   * @param limit - Maximum number of entries to return
   * @returns List of recent audit log entries
   */
  async getRecentLogs(limit = 100) {
    return this.getLogs({ limit });
  }
}

/**
 * Create and export Audit Service instance
 */
export function createAuditService(prisma: PrismaClient): AuditService {
  return new AuditService(prisma);
}
