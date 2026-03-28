/**
 * Custom Error Classes
 * Structured error handling for the Super-Son1k platform
 */

export enum ErrorCode {
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  
  // Generation errors
  GENERATION_FAILED = 'GENERATION_FAILED',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
  GENERATION_QUOTA_EXCEEDED = 'GENERATION_QUOTA_EXCEEDED',
  
  // API errors
  API_ERROR = 'API_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  originalError?: Error;
  userMessage?: string; // User-friendly message
  retryable?: boolean;
  statusCode?: number;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly originalError?: Error;
  public readonly userMessage?: string;
  public readonly retryable: boolean;
  public readonly statusCode?: number;
  public readonly timestamp: Date;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.originalError = options.originalError;
    this.userMessage = options.userMessage || options.message;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.userMessage || this.message;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      retryable: this.retryable,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Helper functions to create specific error types
 */
export class ErrorFactory {
  static authRequired(message = 'Authentication required') {
    return new AppError({
      code: ErrorCode.AUTH_REQUIRED,
      message,
      userMessage: 'Por favor, inicia sesión para continuar',
      retryable: false,
      statusCode: 401,
    });
  }

  static generationFailed(message = 'Generation failed', details?: Record<string, any>) {
    return new AppError({
      code: ErrorCode.GENERATION_FAILED,
      message,
      userMessage: 'Error al generar música. Por favor, intenta de nuevo.',
      details,
      retryable: true,
      statusCode: 500,
    });
  }

  static generationTimeout(message = 'Generation timeout') {
    return new AppError({
      code: ErrorCode.GENERATION_TIMEOUT,
      message,
      userMessage: 'La generación tardó demasiado. Por favor, intenta de nuevo.',
      retryable: true,
      statusCode: 504,
    });
  }

  static quotaExceeded(message = 'Quota exceeded') {
    return new AppError({
      code: ErrorCode.GENERATION_QUOTA_EXCEEDED,
      message,
      userMessage: 'Has alcanzado el límite de generaciones. Actualiza tu plan para continuar.',
      retryable: false,
      statusCode: 403,
    });
  }

  static apiError(message = 'API error', statusCode?: number, details?: Record<string, any>) {
    return new AppError({
      code: ErrorCode.API_ERROR,
      message,
      userMessage: 'Error al comunicarse con el servidor. Por favor, intenta de nuevo.',
      details,
      retryable: true,
      statusCode: statusCode || 500,
    });
  }

  static networkError(message = 'Network error', originalError?: Error) {
    return new AppError({
      code: ErrorCode.NETWORK_ERROR,
      message,
      userMessage: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
      originalError,
      retryable: true,
    });
  }

  static validationError(message = 'Validation error', details?: Record<string, any>) {
    return new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      userMessage: 'Datos inválidos. Por favor, verifica la información.',
      details,
      retryable: false,
      statusCode: 400,
    });
  }

  static notFound(resource = 'Resource') {
    return new AppError({
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `${resource} not found`,
      userMessage: 'No se encontró el recurso solicitado.',
      retryable: false,
      statusCode: 404,
    });
  }

  static fromError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: error.message,
        userMessage: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        originalError: error,
        retryable: true,
      });
    }

    return new AppError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Unknown error',
      userMessage: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
      retryable: true,
    });
  }
}

