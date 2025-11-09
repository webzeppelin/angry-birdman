/**
 * Audit Log API Routes
 * Story 2.17: Audit log viewing and export
 *
 * Provides endpoints for querying and exporting audit logs with
 * permission-based access control.
 */

import { authenticate } from '../middleware/auth.js';
import { createAuditService } from '../services/audit.service.js';

import type { FastifyPluginAsync } from 'fastify';

interface AuditLogQuery {
  clanId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

interface AuditLogExportQuery {
  clanId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv';
}

const auditLogRoutes: FastifyPluginAsync = async (fastify) => {
  const auditService = createAuditService(fastify.prisma);

  /**
   * GET /api/audit-logs
   * Query audit logs with filtering and pagination
   *
   * Access control:
   * - Superadmin: Can view all logs
   * - Clan admin/owner: Can view logs for their clan
   */
  fastify.get<{ Querystring: AuditLogQuery }>(
    '/',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { authUser } = request;
      if (!authUser) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const {
        clanId: clanIdStr,
        userId,
        startDate,
        endDate,
        page: pageStr = '1',
        limit: limitStr = '50',
      } = request.query;

      const page = parseInt(pageStr, 10);
      const requestedLimit = parseInt(limitStr, 10);
      const limit = Math.min(requestedLimit, 100); // Max 100 per page

      if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid pagination parameters',
        });
      }

      // Check authorization
      const isSuperadmin = authUser.realm_access?.roles.includes('superadmin') ?? false;
      let allowedClanId: number | undefined;

      if (!isSuperadmin) {
        // Non-superadmins can only view their own clan's logs
        const user = await fastify.prisma.user.findUnique({
          where: { userId: authUser.sub },
        });

        if (!user || !user.clanId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to view audit logs',
          });
        }

        allowedClanId = user.clanId;
      }

      // Build filters
      const clanId = clanIdStr ? parseInt(clanIdStr, 10) : undefined;

      // If user is not superadmin and requests different clan, deny
      if (!isSuperadmin && clanId && clanId !== allowedClanId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You can only view logs for your own clan',
        });
      }

      // If user is not superadmin, force their clan filter
      const effectiveClanId = isSuperadmin ? clanId : allowedClanId;

      try {
        const params = {
          clanId: effectiveClanId,
          actorId: userId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          limit,
          offset: (page - 1) * limit,
        };

        const result = await auditService.getLogs(params);

        // Transform logs for response
        type LogWithRelations = (typeof result.logs)[number];
        const transformedLogs = result.logs.map((log: LogWithRelations) => ({
          logId: log.logId,
          timestamp: log.createdAt.toISOString(),
          userId: log.actorId,
          username: log.actor.username,
          action: log.actionType,
          resourceType: log.entityType,
          resourceId: log.entityId,
          details: log.details,
        }));

        return {
          logs: transformedLogs,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to query audit logs');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to query audit logs',
        });
      }
    }
  );

  /**
   * GET /api/audit-logs/clan/:clanId
   * Get audit logs for a specific clan
   *
   * Access control:
   * - Superadmin: Can view any clan
   * - Clan admin/owner: Can view their own clan
   */
  fastify.get<{ Params: { clanId: string }; Querystring: Omit<AuditLogQuery, 'clanId'> }>(
    '/clan/:clanId',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { authUser } = request;
      if (!authUser) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const clanId = parseInt(request.params.clanId, 10);
      if (isNaN(clanId)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid clan ID',
        });
      }

      const {
        userId,
        startDate,
        endDate,
        page: pageStr = '1',
        limit: limitStr = '50',
      } = request.query;

      const page = parseInt(pageStr, 10);
      const requestedLimit = parseInt(limitStr, 10);
      const limit = Math.min(requestedLimit, 100);

      if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid pagination parameters',
        });
      }

      // Check authorization
      const isSuperadmin = authUser.realm_access?.roles.includes('superadmin') ?? false;

      if (!isSuperadmin) {
        const user = await fastify.prisma.user.findUnique({
          where: { userId: authUser.sub },
        });

        if (!user || user.clanId !== clanId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You can only view logs for your own clan',
          });
        }
      }

      try {
        const params = {
          clanId,
          actorId: userId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          limit,
          offset: (page - 1) * limit,
        };

        const result = await auditService.getLogs(params);

        // Transform logs for response
        type LogWithRelations = (typeof result.logs)[number];
        const transformedLogs = result.logs.map((log: LogWithRelations) => ({
          logId: log.logId,
          timestamp: log.createdAt.toISOString(),
          userId: log.actorId,
          username: log.actor.username,
          action: log.actionType,
          resourceType: log.entityType,
          resourceId: log.entityId,
          details: log.details,
        }));

        return {
          logs: transformedLogs,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to query clan audit logs');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to query clan audit logs',
        });
      }
    }
  );

  /**
   * GET /api/audit-logs/export
   * Export audit logs to JSON or CSV
   *
   * Access control:
   * - Superadmin: Can export all logs
   * - Clan admin/owner: Can export logs for their clan
   */
  fastify.get<{ Querystring: AuditLogExportQuery }>(
    '/export',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { authUser } = request;
      if (!authUser) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const { clanId: clanIdStr, userId, startDate, endDate, format = 'json' } = request.query;

      // Check authorization
      const isSuperadmin = authUser.realm_access?.roles.includes('superadmin') ?? false;
      let allowedClanId: number | undefined;

      if (!isSuperadmin) {
        const user = await fastify.prisma.user.findUnique({
          where: { userId: authUser.sub },
        });

        if (!user || !user.clanId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to export audit logs',
          });
        }

        allowedClanId = user.clanId;
      }

      // Build filters
      const clanId = clanIdStr ? parseInt(clanIdStr, 10) : undefined;

      // If user is not superadmin and requests different clan, deny
      if (!isSuperadmin && clanId && clanId !== allowedClanId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You can only export logs for your own clan',
        });
      }

      // If user is not superadmin, force their clan filter
      const effectiveClanId = isSuperadmin ? clanId : allowedClanId;

      try {
        const params = {
          clanId: effectiveClanId,
          actorId: userId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          limit: 10000, // Max 10k records for export
          offset: 0,
        };

        const result = await auditService.getLogs(params);

        type LogWithRelations = (typeof result.logs)[number];

        if (format === 'csv') {
          // Convert to CSV
          const csvLines = ['Log ID,Timestamp,User ID,Username,Action,Resource Type,Resource ID'];

          for (const log of result.logs) {
            const typedLog = log;
            const line = [
              typedLog.logId.toString(),
              typedLog.createdAt.toISOString(),
              typedLog.actorId,
              typedLog.actor.username,
              typedLog.actionType,
              typedLog.entityType || '',
              typedLog.entityId || '',
            ]
              .map((field) => `"${String(field).replace(/"/g, '""')}"`) // Escape quotes
              .join(',');
            csvLines.push(line);
          }

          const csv = csvLines.join('\n');

          void reply.header('Content-Type', 'text/csv');
          void reply.header('Content-Disposition', 'attachment; filename="audit-logs.csv"');
          return csv;
        } else {
          // Return as JSON
          const transformedLogs = result.logs.map((log: LogWithRelations) => ({
            logId: log.logId,
            timestamp: log.createdAt.toISOString(),
            userId: log.actorId,
            username: log.actor.username,
            action: log.actionType,
            resourceType: log.entityType,
            resourceId: log.entityId,
            details: log.details,
          }));

          void reply.header('Content-Type', 'application/json');
          void reply.header('Content-Disposition', 'attachment; filename="audit-logs.json"');
          return transformedLogs;
        }
      } catch (error) {
        fastify.log.error(error, 'Failed to export audit logs');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to export audit logs',
        });
      }
    }
  );
};

export default auditLogRoutes;
