"use strict";
/**
 * Validation utilities for Super-Son1k-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ValidationSchemas = void 0;
exports.validateGenerationParameters = validateGenerationParameters;
exports.validateUserData = validateUserData;
exports.validateTokenData = validateTokenData;
exports.validateCollaborationData = validateCollaborationData;
exports.sanitizeInput = sanitizeInput;
exports.isValidEmail = isValidEmail;
exports.validatePasswordStrength = validatePasswordStrength;
exports.isValidURL = isValidURL;
exports.isValidUUID = isValidUUID;
const zod_1 = require("zod");
/**
 * Validation schemas
 */
exports.ValidationSchemas = {
    // User validation
    user: zod_1.z.object({
        email: zod_1.z.string().email(),
        username: zod_1.z.string().min(3).max(30),
        password: zod_1.z.string().min(8).optional(),
        tier: zod_1.z.enum(['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE']).optional()
    }),
    // Generation validation
    generation: zod_1.z.object({
        prompt: zod_1.z.string().min(1).max(1000),
        duration: zod_1.z.number().min(30).max(600).optional(),
        tempo: zod_1.z.number().min(60).max(200).optional(),
        key: zod_1.z.string().optional(),
        genre: zod_1.z.string().optional(),
        mood: zod_1.z.string().optional(),
        instruments: zod_1.z.array(zod_1.z.string()).optional(),
        style: zod_1.z.string().optional(),
        complexity: zod_1.z.number().min(0).max(1).optional(),
        temperature: zod_1.z.number().min(0).max(1).optional(),
        seed: zod_1.z.number().optional(),
        model: zod_1.z.string().optional()
    }),
    // Token validation
    token: zod_1.z.object({
        token: zod_1.z.string().min(1),
        userId: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        tier: zod_1.z.enum(['FREE', 'PREMIUM', 'ENTERPRISE']).optional(),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
    }),
    // Collaboration validation
    collaboration: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        description: zod_1.z.string().max(500).optional(),
        isPublic: zod_1.z.boolean().optional()
    })
};
/**
 * Validation error class
 */
class ValidationError extends Error {
    constructor(message, field, code) {
        super(message);
        this.field = field;
        this.code = code;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Validate generation parameters
 */
function validateGenerationParameters(params) {
    try {
        const validated = exports.ValidationSchemas.generation.parse(params);
        return {
            valid: true,
            errors: [],
            data: validated
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                valid: false,
                errors: error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
            };
        }
        return {
            valid: false,
            errors: ['Unknown validation error']
        };
    }
}
/**
 * Validate user data
 */
function validateUserData(data) {
    try {
        const validated = exports.ValidationSchemas.user.parse(data);
        return {
            valid: true,
            errors: [],
            user: validated
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                valid: false,
                errors: error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
            };
        }
        return {
            valid: false,
            errors: ['Unknown validation error']
        };
    }
}
/**
 * Validate token data
 */
function validateTokenData(data) {
    try {
        const validated = exports.ValidationSchemas.token.parse(data);
        return {
            valid: true,
            errors: [],
            token: validated
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                valid: false,
                errors: error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
            };
        }
        return {
            valid: false,
            errors: ['Unknown validation error']
        };
    }
}
/**
 * Validate collaboration data
 */
function validateCollaborationData(data) {
    try {
        const validated = exports.ValidationSchemas.collaboration.parse(data);
        return {
            valid: true,
            errors: [],
            collaboration: validated
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                valid: false,
                errors: error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
            };
        }
        return {
            valid: false,
            errors: ['Unknown validation error']
        };
    }
}
/**
 * Sanitize input data
 */
function sanitizeInput(input) {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    if (typeof input === 'object' && input !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    return input;
}
/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
    const feedback = [];
    let score = 0;
    if (password.length >= 8) {
        score += 1;
    }
    else {
        feedback.push('Password must be at least 8 characters long');
    }
    if (/[a-z]/.test(password)) {
        score += 1;
    }
    else {
        feedback.push('Password must contain at least one lowercase letter');
    }
    if (/[A-Z]/.test(password)) {
        score += 1;
    }
    else {
        feedback.push('Password must contain at least one uppercase letter');
    }
    if (/[0-9]/.test(password)) {
        score += 1;
    }
    else {
        feedback.push('Password must contain at least one number');
    }
    if (/[^a-zA-Z0-9]/.test(password)) {
        score += 1;
    }
    else {
        feedback.push('Password must contain at least one special character');
    }
    return {
        valid: score >= 4,
        score,
        feedback
    };
}
/**
 * Validate URL format
 */
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
//# sourceMappingURL=validation.js.map