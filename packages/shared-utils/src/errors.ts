/**
 * Error handling utilities for Super-Son1k-2.0
 */

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
  
  field?: string;
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR');
  }
}

/**
 * Error factory for creating errors from unknown sources
 */
export class ErrorFactory {
  static fromUnknown(error: unknown, message?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(message || error.message, 500, 'INTERNAL_ERROR');
    }
    
    if (typeof error === 'string') {
      return new AppError(message || error, 500, 'INTERNAL_ERROR');
    }
    
    return new AppError(message || 'Unknown error occurred', 500, 'INTERNAL_ERROR');
  }
  
  static validation(message: string, field?: string): ValidationError {
    return new ValidationError(message, field);
  }
  
  static authentication(message?: string): AuthenticationError {
    return new AuthenticationError(message);
  }
  
  static authorization(message?: string): AuthorizationError {
    return new AuthorizationError(message);
  }
  
  static notFound(message?: string): NotFoundError {
    return new NotFoundError(message);
  }
  
  static conflict(message?: string): ConflictError {
    return new ConflictError(message);
  }
  
  static rateLimit(message?: string): RateLimitError {
    return new RateLimitError(message);
  }
  
  static serviceUnavailable(message?: string): ServiceUnavailableError {
    return new ServiceUnavailableError(message);
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(
  error: AppError,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      field: (error as any).field,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    timestamp: new Date().toISOString(),
    requestId
  };
}

/**
 * Global error handler
 */
export function handleError(error: unknown, requestId?: string): ErrorResponse {
  const appError = ErrorFactory.fromUnknown(error);
  return formatErrorResponse(appError, requestId);
}

/**
 * Async error wrapper
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return fn(...args).catch((error) => {
      throw ErrorFactory.fromUnknown(error);
    });
  };
}

/**
 * Error logging
 */
export function logError(error: AppError, context?: any): void {
  const logData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };
  
  if (error.statusCode >= 500) {
    console.error('Server Error:', logData);
  } else {
    console.warn('Client Error:', logData);
  }
}

/**
 * Check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Error codes enum
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_NOT_ACTIVATED: 'ACCOUNT_NOT_ACTIVATED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Service Errors
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;
