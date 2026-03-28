/**
 * Local utilities - copy of @super-son1k/shared-utils for testing
 * This file will be removed when symlinks are fixed
 */

import crypto from 'crypto';

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateAPIKey(prefix: string = 'sk_'): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}${timestamp}_${random}`;
}

export function hashForLogging(token: string, visibleChars: number = 4): string {
  if (!token || token.length <= visibleChars) return '****';
  return token.substring(0, visibleChars) + '****';
}

export function sanitizeForLogging(text: string, maxLength: number = 100): string {
  if (!text) return '';
  const sanitized = text
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + '...' : sanitized;
}

export class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  tryConsume(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    
    if (record.count >= this.maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ErrorFactory {
  static validation(message: string, field?: string): ValidationError {
    return new ValidationError(message, field);
  }
  
  static rateLimit(message: string = 'Too many requests'): Error {
    const error = new Error(message);
    (error as any).code = 'RATE_LIMIT';
    return error;
  }
  
  static unauthorized(message: string = 'Unauthorized'): Error {
    const error = new Error(message);
    (error as any).code = 'UNAUTHORIZED';
    return error;
  }
  
  static fromUnknown(error: unknown, defaultMessage: string = 'An error occurred'): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(defaultMessage);
  }
}
