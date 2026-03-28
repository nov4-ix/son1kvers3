"use strict";
/**
 * Error handling utilities for Super-Son1k-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.ErrorFactory = exports.ServiceUnavailableError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.formatErrorResponse = formatErrorResponse;
exports.handleError = handleError;
exports.asyncHandler = asyncHandler;
exports.logError = logError;
exports.isOperationalError = isOperationalError;
/**
 * Custom error classes
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}
exports.RateLimitError = RateLimitError;
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable') {
        super(message, 503, 'SERVICE_UNAVAILABLE_ERROR');
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Error factory for creating errors from unknown sources
 */
class ErrorFactory {
    static fromUnknown(error, message) {
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
    static validation(message, field) {
        return new ValidationError(message, field);
    }
    static authentication(message) {
        return new AuthenticationError(message);
    }
    static authorization(message) {
        return new AuthorizationError(message);
    }
    static notFound(message) {
        return new NotFoundError(message);
    }
    static conflict(message) {
        return new ConflictError(message);
    }
    static rateLimit(message) {
        return new RateLimitError(message);
    }
    static serviceUnavailable(message) {
        return new ServiceUnavailableError(message);
    }
}
exports.ErrorFactory = ErrorFactory;
/**
 * Format error for API response
 */
function formatErrorResponse(error, requestId) {
    return {
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message,
            field: error.field,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        timestamp: new Date().toISOString(),
        requestId
    };
}
/**
 * Global error handler
 */
function handleError(error, requestId) {
    const appError = ErrorFactory.fromUnknown(error);
    return formatErrorResponse(appError, requestId);
}
/**
 * Async error wrapper
 */
function asyncHandler(fn) {
    return (...args) => {
        return fn(...args).catch((error) => {
            throw ErrorFactory.fromUnknown(error);
        });
    };
}
/**
 * Error logging
 */
function logError(error, context) {
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
    }
    else {
        console.warn('Client Error:', logData);
    }
}
/**
 * Check if error is operational
 */
function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
/**
 * Error codes enum
 */
exports.ERROR_CODES = {
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
};
//# sourceMappingURL=errors.js.map