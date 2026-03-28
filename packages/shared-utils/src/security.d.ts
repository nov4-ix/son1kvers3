/**
 * Security utilities for Super-Son1k-2.0
 */
export declare const SECURITY: {
    readonly JWT_ALGORITHM: "HS256";
    readonly ENCRYPTION_ALGORITHM: "aes-256-gcm";
    readonly HASH_ALGORITHM: "sha256";
    readonly SALT_ROUNDS: 12;
};
/**
 * Generate a secure random token
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Generate a secure API key
 */
export declare function generateAPIKey(): string;
/**
 * Hash a string for logging (one-way)
 */
export declare function hashForLogging(value: string): string;
/**
 * Sanitize data for logging
 */
export declare function sanitizeForLogging(data: any): any;
/**
 * Rate limiter class
 */
export declare class RateLimiter {
    private maxRequests;
    private windowMs;
    private requests;
    constructor(maxRequests: number, windowMs: number);
    isAllowed(key: string): boolean;
    getRemainingRequests(key: string): number;
    reset(key: string): void;
}
/**
 * Encrypt sensitive data
 */
export declare function encryptData(data: string, key: string): string;
/**
 * Decrypt sensitive data
 */
export declare function decryptData(encryptedData: string, key: string): string;
/**
 * Validate JWT token format
 */
export declare function isValidJWTFormat(token: string): boolean;
/**
 * Generate CSRF token
 */
export declare function generateCSRFToken(): string;
/**
 * Validate CSRF token
 */
export declare function validateCSRFToken(token: string, expectedToken: string): boolean;
//# sourceMappingURL=security.d.ts.map