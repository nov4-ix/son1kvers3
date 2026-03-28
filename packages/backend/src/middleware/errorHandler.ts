/**
 * Error Handler Middleware
 * Handles errors and provides consistent error responses
 */

import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ErrorFactory, ValidationError, AuthenticationError, AuthorizationError } from '@super-son1k/shared-utils';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Structured logging helper
 */
function logStructured(level: 'error' | 'warn' | 'info' | 'debug', message: string, context: Record<string, any>) {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Use appropriate console method
  console[level](JSON.stringify(logEntry));
}

/**
 * Global error handler
 */
export async function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  const requestId = (request as any).requestId || 'unknown';
  const user = (request as any).user;
  const timestamp = new Date().toISOString();

  // Build context for structured logging
  const context: Record<string, any> = {
    requestId,
    method: request.method,
    url: request.url,
    endpoint: request.url.split('?')[0], // Remove query params
    ip: request.ip || 'unknown',
    userAgent: request.headers['user-agent'] || 'unknown',
  };

  // Add user context if available
  if (user) {
    context.userId = user.id;
    context.userTier = user.tier;
    context.userEmail = user.email;
  }

  // Add error details
  context.error = {
    message: error.message,
    code: (error as any).code || 'UNKNOWN_ERROR',
    statusCode: error.statusCode || 500,
  };

  // Only include stack in development
  if (process.env.NODE_ENV === 'development') {
    context.error.stack = error.stack;
  }

  // Log error with structured format
  logStructured('error', 'Request error occurred', context);

  // Handle different types of errors
  if (error instanceof ValidationError) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: (error as any).details,
        timestamp,
        requestId
      }
    });
  }

  if (error instanceof AuthenticationError) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: error.message,
        timestamp,
        requestId
      }
    });
  }

  if (error instanceof AuthorizationError) {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: error.message,
        timestamp,
        requestId
      }
    });
  }

  // Handle Prisma errors
  if (error.message.includes('Prisma')) {
    return handlePrismaError(error, reply, requestId, timestamp);
  }

  // Handle JWT errors
  if (error.message.includes('jwt') || error.message.includes('token')) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'TOKEN_ERROR',
        message: 'Invalid or expired token',
        timestamp,
        requestId
      }
    });
  }

  // Handle rate limit errors
  if (error.statusCode === 429) {
    return reply.code(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp,
        requestId
      }
    });
  }

  // Handle validation errors
  if (error.statusCode === 400) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: error.message || 'Bad request',
        timestamp,
        requestId
      }
    });
  }

  // Handle not found errors
  if (error.statusCode === 404) {
    return reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message || 'Resource not found',
        timestamp,
        requestId
      }
    });
  }

  // Handle internal server errors
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  // Log internal errors with full context
  if (statusCode >= 500) {
    logStructured('error', 'Internal server error', {
      ...context,
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }

  return reply.code(statusCode).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      timestamp,
      requestId
    }
  });
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: FastifyError, reply: FastifyReply, requestId: string, timestamp: string) {
  if (error.message.includes('Unique constraint')) {
    return reply.code(409).send({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists',
        timestamp,
        requestId
      }
    });
  }

  if (error.message.includes('Record to update not found')) {
    return reply.code(404).send({
      success: false,
      error: {
        code: 'RECORD_NOT_FOUND',
        message: 'Record not found',
        timestamp,
        requestId
      }
    });
  }

  if (error.message.includes('Foreign key constraint')) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'FOREIGN_KEY_CONSTRAINT',
        message: 'Invalid reference to related resource',
        timestamp,
        requestId
      }
    });
  }

  if (error.message.includes('Connection')) {
    return reply.code(503).send({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Database connection error',
        timestamp,
        requestId
      }
    });
  }

  // Generic Prisma error
  return reply.code(500).send({
    success: false,
    error: {
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
      timestamp,
      requestId
    }
  });
}

/**
 * Not found handler
 */
export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  const requestId = (request as any).requestId || 'unknown';
  const timestamp = new Date().toISOString();

  return reply.code(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
      timestamp,
      requestId
    }
  });
}

/**
 * Validation error handler
 */
export function createValidationError(message: string, details?: any): ValidationError {
  return new ValidationError(message, details);
}

/**
 * Authentication error handler
 */
export function createAuthenticationError(message: string = 'Authentication required'): AuthenticationError {
  return new AuthenticationError(message);
}

/**
 * Authorization error handler
 */
export function createAuthorizationError(message: string = 'Insufficient permissions'): AuthorizationError {
  return new AuthorizationError(message);
}

/**
 * Custom error handler for specific routes
 */
export function createCustomErrorHandler(errorCode: string, statusCode: number) {
  return (message: string, details?: any) => {
    const error = new Error(message) as FastifyError;
    error.statusCode = statusCode;
    (error as any).code = errorCode;
    (error as any).details = details;
    return error;
  };
}

/**
 * Async error wrapper
 */
export function asyncErrorWrapper(fn: Function) {
  return (request: FastifyRequest, reply: FastifyReply) => {
    return Promise.resolve(fn(request, reply)).catch((error) => {
      errorHandler(error, request, reply);
    });
  };
}

/**
 * Error response helper
 */
export function createErrorResponse(
  code: string, 
  message: string, 
  statusCode: number = 500, 
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  };
}
