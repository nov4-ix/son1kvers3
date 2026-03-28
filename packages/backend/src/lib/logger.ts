/**
 * Structured Logger
 * Provides consistent, structured logging with context
 */

interface LogContext {
  userId?: string;
  userTier?: string;
  endpoint?: string;
  requestId?: string;
  ip?: string;
  [key: string]: any;
}

export class Logger {
  /**
   * Log info message
   */
  static info(message: string, context: LogContext = {}) {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  static warn(message: string, context: LogContext = {}) {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  static error(message: string, context: LogContext = {}) {
    this.log('error', message, context);
  }

  /**
   * Log debug message
   */
  static debug(message: string, context: LogContext = {}) {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      this.log('debug', message, context);
    }
  }

  /**
   * Core logging method
   */
  private static log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context: LogContext) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // Use appropriate console method
    const consoleMethod = console[level] || console.log;
    consoleMethod(JSON.stringify(logEntry));
  }

  /**
   * Log request
   */
  static request(method: string, url: string, context: LogContext = {}) {
    this.info(`${method} ${url}`, {
      type: 'request',
      method,
      endpoint: url.split('?')[0],
      ...context,
    });
  }

  /**
   * Log response
   */
  static response(method: string, url: string, statusCode: number, duration: number, context: LogContext = {}) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${url} - ${statusCode} (${duration}ms)`, {
      type: 'response',
      method,
      endpoint: url.split('?')[0],
      statusCode,
      duration,
      ...context,
    });
  }
}

