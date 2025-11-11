/**
 * Admin Request Routes
 *
 * Endpoints for submitting and managing admin access requests to clans
 * Covers Stories 2.9 and 2.12 from Epic 2
 *
 * @module routes/admin-requests
 */

import {
  adminRequestSchema,
  type AdminRequestSubmission,
  type AdminRequestReview,
} from '@angrybirdman/common';
import { z } from 'zod';

import { authenticate } from '../middleware/auth.js';
import {
  createAuditService,
  AuditAction,
  EntityType,
  AuditResult,
} from '../services/audit.service.js';

import type { FastifyPluginAsync } from 'fastify';

/**
 * Admin request routes plugin
 */
const adminRequestsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/admin-requests
   *
   * Story 2.9: Submit an admin request to join a clan
   *
   * Authenticated users can request to become an admin of a clan
   * Request goes to PENDING status and awaits review by clan owners/admins
   */
  fastify.post<{ Body: AdminRequestSubmission }>(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Submit a request to become a clan admin',
        tags: ['admin-requests'],
        body: adminRequestSchema,
        response: {
          201: z.object({
            requestId: z.number(),
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.authUser!.sub;
      const audit = createAuditService(fastify.prisma);

      try {
        // 1. Check if clan exists
        const clan = await fastify.prisma.clan.findUnique({
          where: { clanId: request.body.clanId },
        });

        if (!clan) {
          return reply.code(404).send({
            error: 'Clan not found',
          });
        }

        // 2. Check if user is already associated with this clan
        const user = await fastify.prisma.user.findUnique({
          where: { userId },
        });

        if (user?.clanId === request.body.clanId) {
          return reply.code(400).send({
            error: 'You are already a member of this clan',
          });
        }

        // 3. Check if user already has a pending request for this clan
        const existingRequest = await fastify.prisma.adminRequest.findFirst({
          where: {
            userId,
            clanId: request.body.clanId,
            status: 'PENDING',
          },
        });

        if (existingRequest) {
          return reply.code(400).send({
            error: 'You already have a pending request for this clan',
          });
        }

        // 4. Create admin request
        const adminRequest = await fastify.prisma.adminRequest.create({
          data: {
            userId,
            clanId: request.body.clanId,
            message: request.body.message || null,
            status: 'PENDING',
          },
        });

        // 5. Log the request submission
        await audit.log({
          actorId: userId,
          actionType: AuditAction.ADMIN_REQUEST_SUBMITTED,
          entityType: EntityType.ADMIN_REQUEST,
          entityId: String(adminRequest.requestId),
          clanId: request.body.clanId,
          targetUserId: userId,
          details: {
            clanName: clan.name,
            message: request.body.message,
          },
          result: AuditResult.SUCCESS,
        });

        return reply.code(201).send({
          requestId: adminRequest.requestId,
          message: 'Admin request submitted successfully',
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to submit admin request');
        throw error;
      }
    }
  );

  /**
   * GET /api/admin-requests
   *
   * List admin requests
   *
   * - Regular users: See only their own requests
   * - Clan admins/owners: See requests for their clan
   * - Superadmins: See all requests
   */
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'List admin requests',
        tags: ['admin-requests'],
        querystring: z.object({
          clanId: z.coerce.number().optional(),
          status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
          limit: z.coerce.number().positive().max(100).optional().default(20),
          offset: z.coerce.number().nonnegative().optional().default(0),
        }),
        response: {
          200: z.object({
            requests: z.array(
              z.object({
                requestId: z.number(),
                userId: z.string(),
                username: z.string(),
                email: z.string(),
                clanId: z.number(),
                clanName: z.string(),
                message: z.string().nullable(),
                status: z.string(),
                reviewedBy: z.string().nullable(),
                reviewedAt: z.string().nullable(),
                rejectionReason: z.string().nullable(),
                createdAt: z.string(),
              })
            ),
            total: z.number(),
            limit: z.number(),
            offset: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.authUser!.sub;
      const {
        clanId,
        status,
        limit = 20,
        offset = 0,
      } = request.query as {
        clanId?: number;
        status?: string;
        limit: number;
        offset: number;
      };

      try {
        // Determine user's access level
        const user = await fastify.prisma.user.findUnique({
          where: { userId },
        });

        const userRoles = request.authUser!.realm_access?.roles || [];
        const isSuperadmin = userRoles.includes('superadmin');
        const isAdminOfClan = user?.clanId !== null;

        // Build where clause based on permissions
        const where: {
          clanId?: number;
          userId?: string;
          status?: string;
        } = {};

        if (status) {
          where.status = status;
        }

        if (clanId) {
          where.clanId = clanId;
        }

        // Apply permission filters
        if (!isSuperadmin) {
          if (isAdminOfClan && clanId && user!.clanId === clanId) {
            // Clan admin viewing requests for their clan
            where.clanId = clanId;
          } else if (!clanId) {
            // Regular user viewing only their own requests
            where.userId = userId;
          } else {
            // User trying to view requests for a clan they don't admin
            return reply.code(403).send({
              error: 'Forbidden',
              message: 'You do not have permission to view these requests',
            });
          }
        }

        // Fetch requests with user and clan details
        const [requests, total] = await Promise.all([
          fastify.prisma.adminRequest.findMany({
            where,
            include: {
              user: {
                select: {
                  username: true,
                  email: true,
                },
              },
              clan: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: limit,
            skip: offset,
          }),
          fastify.prisma.adminRequest.count({ where }),
        ]);

        type RequestWithDetails = (typeof requests)[number];
        const formattedRequests = requests.map((req: RequestWithDetails) => ({
          requestId: req.requestId,
          userId: req.userId,
          username: req.user.username,
          email: req.user.email,
          clanId: req.clanId,
          clanName: req.clan.name,
          message: req.message,
          status: req.status,
          reviewedBy: req.reviewedBy,
          reviewedAt: req.reviewedAt?.toISOString() || null,
          rejectionReason: req.rejectionReason,
          createdAt: req.createdAt.toISOString(),
        }));

        return reply.send({
          requests: formattedRequests,
          total,
          limit,
          offset,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to list admin requests');
        throw error;
      }
    }
  );

  /**
   * GET /api/admin-requests/:requestId
   *
   * Get a single admin request by ID
   *
   * Access control:
   * - Request owner can view their own request
   * - Clan admins/owners can view requests for their clan
   * - Superadmins can view any request
   */
  fastify.get<{ Params: { requestId: string } }>(
    '/:requestId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Get a single admin request',
        tags: ['admin-requests'],
        params: z.object({
          requestId: z.string(),
        }),
        response: {
          200: z.object({
            requestId: z.number(),
            userId: z.string(),
            username: z.string(),
            email: z.string(),
            clanId: z.number(),
            clanName: z.string(),
            message: z.string().nullable(),
            status: z.string(),
            reviewedBy: z.string().nullable(),
            reviewedByUsername: z.string().nullable(),
            reviewedAt: z.string().nullable(),
            rejectionReason: z.string().nullable(),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.authUser!.sub;
      const requestId = parseInt(request.params.requestId, 10);

      try {
        // Fetch request with details
        const adminRequest = await fastify.prisma.adminRequest.findUnique({
          where: { requestId },
          include: {
            user: {
              select: {
                username: true,
                email: true,
              },
            },
            clan: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!adminRequest) {
          return reply.code(404).send({
            error: 'Admin request not found',
          });
        }

        // Check access permissions
        const user = await fastify.prisma.user.findUnique({
          where: { userId },
        });

        const userRoles = request.authUser!.realm_access?.roles || [];
        const isSuperadmin = userRoles.includes('superadmin');
        const isRequestOwner = adminRequest.userId === userId;
        const isClanAdmin = user?.clanId === adminRequest.clanId;

        if (!isSuperadmin && !isRequestOwner && !isClanAdmin) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to view this request',
          });
        }

        // Get reviewer username if request was reviewed
        let reviewedByUsername: string | null = null;
        if (adminRequest.reviewedBy) {
          const reviewer = await fastify.prisma.user.findUnique({
            where: { userId: adminRequest.reviewedBy },
            select: { username: true },
          });
          reviewedByUsername = reviewer?.username || null;
        }

        return reply.send({
          requestId: adminRequest.requestId,
          userId: adminRequest.userId,
          username: adminRequest.user.username,
          email: adminRequest.user.email,
          clanId: adminRequest.clanId,
          clanName: adminRequest.clan.name,
          message: adminRequest.message,
          status: adminRequest.status,
          reviewedBy: adminRequest.reviewedBy,
          reviewedByUsername,
          reviewedAt: adminRequest.reviewedAt?.toISOString() || null,
          rejectionReason: adminRequest.rejectionReason,
          createdAt: adminRequest.createdAt.toISOString(),
          updatedAt: adminRequest.updatedAt.toISOString(),
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to get admin request');
        throw error;
      }
    }
  );

  /**
   * POST /api/admin-requests/:requestId/review
   *
   * Story 2.12: Review (approve or reject) an admin request
   *
   * Only clan owners/admins or superadmins can review requests
   * Approval: Associates user with clan, assigns clan-admin role, removes old clan association
   * Rejection: Updates status and records reason
   */
  fastify.post<{
    Params: { requestId: string };
    Body: Omit<AdminRequestReview, 'requestId'>;
  }>(
    '/:requestId/review',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Review (approve or reject) an admin request',
        tags: ['admin-requests'],
        params: z.object({
          requestId: z.string(),
        }),
        body: z.object({
          action: z.enum(['approve', 'reject']),
          rejectionReason: z.string().max(1000).optional(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          403: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const reviewerId = request.authUser!.sub;
      const requestId = parseInt(request.params.requestId, 10);
      const { action, rejectionReason } = request.body;
      const audit = createAuditService(fastify.prisma);

      try {
        // 1. Fetch the admin request
        const adminRequest = await fastify.prisma.adminRequest.findUnique({
          where: { requestId },
          include: {
            clan: true,
            user: true,
          },
        });

        if (!adminRequest) {
          return reply.code(404).send({
            error: 'Admin request not found',
          });
        }

        // 2. Check if request is still pending
        if (adminRequest.status !== 'PENDING') {
          return reply.code(400).send({
            error: `Request has already been ${adminRequest.status.toLowerCase()}`,
          });
        }

        // 3. Check reviewer permissions
        const reviewer = await fastify.prisma.user.findUnique({
          where: { userId: reviewerId },
        });

        const userRoles = request.authUser!.realm_access?.roles || [];
        const isSuperadmin = userRoles.includes('superadmin');
        const isClanAdminOrOwner =
          reviewer?.clanId === adminRequest.clanId &&
          (userRoles.includes('clan-admin') || userRoles.includes('clan-owner'));

        if (!isSuperadmin && !isClanAdminOrOwner) {
          return reply.code(403).send({
            error: 'You do not have permission to review this request',
          });
        }

        // 4. Cannot review your own request
        if (reviewerId === adminRequest.userId) {
          return reply.code(400).send({
            error: 'You cannot review your own request',
          });
        }

        // 5. Process based on action
        if (action === 'approve') {
          // Remove user from old clan if they were associated with one
          if (adminRequest.user.clanId !== null) {
            // Log clan association change
            await audit.log({
              actorId: reviewerId,
              actionType: AuditAction.USER_CLAN_ASSOCIATION_CHANGED,
              entityType: EntityType.USER,
              entityId: adminRequest.userId,
              clanId: adminRequest.clanId,
              targetUserId: adminRequest.userId,
              details: {
                oldClanId: adminRequest.user.clanId,
                newClanId: adminRequest.clanId,
              },
              result: AuditResult.SUCCESS,
            });
          }

          // Associate user with new clan and assign clan-admin role in database
          await fastify.prisma.user.update({
            where: { userId: adminRequest.userId },
            data: {
              clanId: adminRequest.clanId,
              owner: false, // Regular admin, not owner
              roles: { set: ['user', 'clan-admin'] }, // Set roles array (removes old clan roles)
            },
          });

          // Update request status
          await fastify.prisma.adminRequest.update({
            where: { requestId },
            data: {
              status: 'APPROVED',
              reviewedBy: reviewerId,
              reviewedAt: new Date(),
            },
          });

          // Log role assignment
          await audit.log({
            actorId: reviewerId,
            actionType: AuditAction.USER_ROLE_ASSIGNED,
            entityType: EntityType.USER,
            entityId: adminRequest.userId,
            clanId: adminRequest.clanId,
            targetUserId: adminRequest.userId,
            details: { role: 'clan-admin' },
            result: AuditResult.SUCCESS,
          });

          // Log request approval
          await audit.log({
            actorId: reviewerId,
            actionType: AuditAction.ADMIN_REQUEST_APPROVED,
            entityType: EntityType.ADMIN_REQUEST,
            entityId: String(requestId),
            clanId: adminRequest.clanId,
            targetUserId: adminRequest.userId,
            details: {
              clanName: adminRequest.clan.name,
              username: adminRequest.user.username,
            },
            result: AuditResult.SUCCESS,
          });

          return reply.send({
            message: 'Admin request approved successfully',
          });
        } else {
          // Reject action
          if (!rejectionReason) {
            return reply.code(400).send({
              error: 'Rejection reason is required when rejecting a request',
            });
          }

          // Update request status
          await fastify.prisma.adminRequest.update({
            where: { requestId },
            data: {
              status: 'REJECTED',
              reviewedBy: reviewerId,
              reviewedAt: new Date(),
              rejectionReason,
            },
          });

          // Log request rejection
          await audit.log({
            actorId: reviewerId,
            actionType: AuditAction.ADMIN_REQUEST_REJECTED,
            entityType: EntityType.ADMIN_REQUEST,
            entityId: String(requestId),
            clanId: adminRequest.clanId,
            targetUserId: adminRequest.userId,
            details: {
              clanName: adminRequest.clan.name,
              username: adminRequest.user.username,
              rejectionReason,
            },
            result: AuditResult.SUCCESS,
          });

          return reply.send({
            message: 'Admin request rejected',
          });
        }
      } catch (error) {
        fastify.log.error(error, 'Failed to review admin request');
        throw error;
      }
    }
  );

  /**
   * DELETE /api/admin-requests/:requestId
   *
   * Cancel an admin request
   *
   * Users can only cancel their own pending requests
   */
  fastify.delete<{ Params: { requestId: string } }>(
    '/:requestId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Cancel an admin request',
        tags: ['admin-requests'],
        params: z.object({
          requestId: z.string(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          403: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.authUser!.sub;
      const requestId = parseInt(request.params.requestId, 10);

      try {
        // Fetch the request
        const adminRequest = await fastify.prisma.adminRequest.findUnique({
          where: { requestId },
        });

        if (!adminRequest) {
          return reply.code(404).send({
            error: 'Admin request not found',
          });
        }

        // Check ownership
        if (adminRequest.userId !== userId) {
          return reply.code(403).send({
            error: 'You can only cancel your own requests',
          });
        }

        // Check if still pending
        if (adminRequest.status !== 'PENDING') {
          return reply.code(400).send({
            error: 'Only pending requests can be cancelled',
          });
        }

        // Delete the request
        await fastify.prisma.adminRequest.delete({
          where: { requestId },
        });

        return reply.send({
          message: 'Admin request cancelled successfully',
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to cancel admin request');
        throw error;
      }
    }
  );
};

export default adminRequestsRoutes;
