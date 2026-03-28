"use strict";
/**
 * Security utilities for Super-Son1k-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.SECURITY = void 0;
exports.generateSecureToken = generateSecureToken;
exports.generateAPIKey = generateAPIKey;
exports.hashForLogging = hashForLogging;
exports.sanitizeForLogging = sanitizeForLogging;
exports.encryptData = encryptData;
exports.decryptData = decryptData;
exports.isValidJWTFormat = isValidJWTFormat;
exports.generateCSRFToken = generateCSRFToken;
exports.validateCSRFToken = validateCSRFToken;
const crypto_1 = __importDefault(require("crypto"));
exports.SECURITY = {
    JWT_ALGORITHM: 'HS256',
    ENCRYPTION_ALGORITHM: 'aes-256-gcm',
    HASH_ALGORITHM: 'sha256',
    SALT_ROUNDS: 12
};
/**
 * Generate a secure random token
 */
function generateSecureToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
/**
 * Generate a secure API key
 */
function generateAPIKey() {
    return `sk_${generateSecureToken(32)}`;
}
/**
 * Hash a string for logging (one-way)
 */
function hashForLogging(value) {
    return crypto_1.default.createHash(exports.SECURITY.HASH_ALGORITHM).update(value).digest('hex');
}
/**
 * Sanitize data for logging
 */
function sanitizeForLogging(data) {
    if (typeof data === 'string') {
        return hashForLogging(data);
    }
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('secret')) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = sanitizeForLogging(value);
            }
        }
        return sanitized;
    }
    return data;
}
/**
 * Rate limiter class
 */
class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }
    isAllowed(key) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }
        const requests = this.requests.get(key);
        // Remove old requests outside the window
        const validRequests = requests.filter(time => time > windowStart);
        this.requests.set(key, validRequests);
        // Check if under limit
        if (validRequests.length < this.maxRequests) {
            validRequests.push(now);
            return true;
        }
        return false;
    }
    getRemainingRequests(key) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        if (!this.requests.has(key)) {
            return this.maxRequests;
        }
        const requests = this.requests.get(key);
        const validRequests = requests.filter(time => time > windowStart);
        return Math.max(0, this.maxRequests - validRequests.length);
    }
    reset(key) {
        this.requests.delete(key);
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Encrypt sensitive data
 */
function encryptData(data, key) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipher(exports.SECURITY.ENCRYPTION_ALGORITHM, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
/**
 * Decrypt sensitive data
 */
function decryptData(encryptedData, key) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto_1.default.createDecipher(exports.SECURITY.ENCRYPTION_ALGORITHM, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Validate JWT token format
 */
function isValidJWTFormat(token) {
    const parts = token.split('.');
    return parts.length === 3;
}
/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Validate CSRF token
 */
function validateCSRFToken(token, expectedToken) {
    return crypto_1.default.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expectedToken, 'hex'));
}
//# sourceMappingURL=security.js.map