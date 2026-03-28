/**
 * Error handling utilities for Super-Son1k-2.0
 */
/**
 * Custom error classes
 */
export declare class AppError extends Error {
    statusCode: number;
    code?: string;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string, field?: string);
    field?: string;
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
/**
 * Error factory for creating errors from unknown sources
 */
export declare class ErrorFactory {
    static fromUnknown(error: unknown, message?: string): AppError;
    static validation(message: string, field?: string): ValidationError;
    static authentication(message?: string): AuthenticationError;
    static authorization(message?: string): AuthorizationError;
    static notFound(message?: string): NotFoundError;
    static conflict(message?: string): ConflictError;
    static rateLimit(message?: string): RateLimitError;
    static serviceUnavailable(message?: string): ServiceUnavailableError;
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
export declare function formatErrorResponse(error: AppError, requestId?: string): ErrorResponse;
/**
 * Global error handler
 */
export declare function handleError(error: unknown, requestId?: string): ErrorResponse;
/**
 * Async error wrapper
 */
export declare function asyncHandler<T extends any[], R>(fn: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
/**
 * Error logging
 */
export declare function logError(error: AppError, context?: any): void;
/**
 * Check if error is operational
 */
export declare function isOperationalError(error: Error): boolean;
/**
 * Error codes enum
 */
export declare const ERROR_CODES: {
    readonly MISSING_TOKEN: "MISSING_TOKEN";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly ACCOUNT_NOT_ACTIVATED: "ACCOUNT_NOT_ACTIVATED";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_PARAMETERS: "INVALID_PARAMETERS";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly RESOURCE_CONFLICT: "RESOURCE_CONFLICT";
    readonly QUOTA_EXCEEDED: "QUOTA_EXCEEDED";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
};
//# sourceMappingURL=errors.d.ts.map