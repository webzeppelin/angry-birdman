import { Prisma } from '@angrybirdman/database';
import { type FastifyError, type FastifyReply, type FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

// Extract error types from Prisma namespace
const PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError;
const PrismaClientValidationError = Prisma.PrismaClientValidationError;

/**
 * Error Handler Middleware
 *
 * Provides consistent error response formatting across the API
 * Handles different error types: Zod validation, Prisma database, and general errors
 */

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: string; // Error type/category
  message: string; // Human-readable error message
  statusCode: number; // HTTP status code
  details?: unknown; // Additional error details (validation errors, etc.)
  timestamp: string; // ISO timestamp when error occurred
  path: string; // Request path that caused the error
}

/**
 * Global error handler for Fastify
 *
 * This handler:
 * - Formats all errors consistently
 * - Logs errors with appropriate detail level
 * - Handles specific error types (Zod, Prisma, JWT, etc.)
 * - Returns appropriate HTTP status codes
 * - Sanitizes error messages in production
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const timestamp = new Date().toISOString();
  const path = request.url;

  // Log error with context
  request.log.error(
    {
      error,
      method: request.method,
      url: path,
      params: request.params,
      query: request.query,
    },
    'Request error'
  );

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ApiErrorResponse = {
      error: 'Validation Error',
      message: 'Request validation failed',
      statusCode: 400,
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
      timestamp,
      path,
    };

    return reply.status(400).send(response);
  }

  // Handle Prisma database errors
  if (error instanceof PrismaClientKnownRequestError) {
    return await handlePrismaError(error, request, reply, timestamp, path);
  }

  if (error instanceof PrismaClientValidationError) {
    const response: ApiErrorResponse = {
      error: 'Database Validation Error',
      message: 'Invalid data provided for database operation',
      statusCode: 400,
      timestamp,
      path,
    };

    return reply.status(400).send(response);
  }

  // Handle Fastify validation errors
  if (error.validation) {
    const response: ApiErrorResponse = {
      error: 'Validation Error',
      message: error.message,
      statusCode: 400,
      details: error.validation,
      timestamp,
      path,
    };

    return reply.status(400).send(response);
  }

  // Handle specific HTTP status codes
  const statusCode = error.statusCode || 500;

  // Prepare error response
  const response: ApiErrorResponse = {
    error: statusCode >= 500 ? 'Internal Server Error' : error.name || 'Error',
    message:
      statusCode >= 500 && process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred'
        : error.message,
    statusCode,
    timestamp,
    path,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.details = { stack: error.stack };
  }

  return reply.status(statusCode).send(response);
}

/**
 * Handle Prisma-specific errors with appropriate status codes and messages
 */
async function handlePrismaError(
  error: typeof PrismaClientKnownRequestError.prototype,
  _request: FastifyRequest,
  reply: FastifyReply,
  timestamp: string,
  path: string
): Promise<void> {
  let statusCode = 500;
  let errorType = 'Database Error';
  let message = 'A database error occurred';
  let details: unknown;

  switch (error.code) {
    // Unique constraint violation
    case 'P2002':
      statusCode = 409;
      errorType = 'Conflict';
      message = 'A record with this value already exists';
      details = {
        fields: (error.meta?.target as string[]) || [],
      };
      break;

    // Record not found
    case 'P2025':
      statusCode = 404;
      errorType = 'Not Found';
      message = 'The requested record was not found';
      break;

    // Foreign key constraint violation
    case 'P2003':
      statusCode = 400;
      errorType = 'Bad Request';
      message = 'Invalid reference to related record';
      details = {
        field: error.meta?.field_name,
      };
      break;

    // Required field missing
    case 'P2011':
      statusCode = 400;
      errorType = 'Bad Request';
      message = 'Required field is missing';
      details = {
        constraint: error.meta?.constraint,
      };
      break;

    // Value too long for field
    case 'P2000':
      statusCode = 400;
      errorType = 'Bad Request';
      message = 'Value is too long for field';
      details = {
        column: error.meta?.column_name,
      };
      break;

    default:
      // Generic database error
      if (process.env.NODE_ENV !== 'production') {
        message = error.message;
        details = {
          code: error.code,
          meta: error.meta,
        };
      }
  }

  const response: ApiErrorResponse = {
    error: errorType,
    message,
    statusCode,
    details,
    timestamp,
    path,
  };

  await reply.status(statusCode).send(response);
}

/**
 * Not Found (404) handler
 *
 * Handles requests to routes that don't exist
 */
export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const response: ApiErrorResponse = {
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  await reply.status(404).send(response);
}
