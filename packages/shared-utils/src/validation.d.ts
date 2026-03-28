/**
 * Validation utilities for Super-Son1k-2.0
 */
import { z } from 'zod';
/**
 * Validation schemas
 */
export declare const ValidationSchemas: {
    user: z.ZodObject<{
        email: z.ZodString;
        username: z.ZodString;
        password: z.ZodOptional<z.ZodString>;
        tier: z.ZodOptional<z.ZodEnum<{
            FREE: "FREE";
            PRO: "PRO";
            PREMIUM: "PREMIUM";
            ENTERPRISE: "ENTERPRISE";
        }>>;
    }, z.core.$strip>;
    generation: z.ZodObject<{
        prompt: z.ZodString;
        duration: z.ZodOptional<z.ZodNumber>;
        tempo: z.ZodOptional<z.ZodNumber>;
        key: z.ZodOptional<z.ZodString>;
        genre: z.ZodOptional<z.ZodString>;
        mood: z.ZodOptional<z.ZodString>;
        instruments: z.ZodOptional<z.ZodArray<z.ZodString>>;
        style: z.ZodOptional<z.ZodString>;
        complexity: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
        seed: z.ZodOptional<z.ZodNumber>;
        model: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    token: z.ZodObject<{
        token: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        tier: z.ZodOptional<z.ZodEnum<{
            FREE: "FREE";
            PREMIUM: "PREMIUM";
            ENTERPRISE: "ENTERPRISE";
        }>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>;
    collaboration: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
};
/**
 * Validation error class
 */
export declare class ValidationError extends Error {
    field?: string;
    code?: string;
    constructor(message: string, field?: string, code?: string);
}
/**
 * Validate generation parameters
 */
export declare function validateGenerationParameters(params: any): {
    valid: boolean;
    errors: string[];
    data?: any;
};
/**
 * Validate user data
 */
export declare function validateUserData(data: any): {
    valid: boolean;
    errors: string[];
    user?: any;
};
/**
 * Validate token data
 */
export declare function validateTokenData(data: any): {
    valid: boolean;
    errors: string[];
    token?: any;
};
/**
 * Validate collaboration data
 */
export declare function validateCollaborationData(data: any): {
    valid: boolean;
    errors: string[];
    collaboration?: any;
};
/**
 * Sanitize input data
 */
export declare function sanitizeInput(input: any): any;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate password strength
 */
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    feedback: string[];
};
/**
 * Validate URL format
 */
export declare function isValidURL(url: string): boolean;
/**
 * Validate UUID format
 */
export declare function isValidUUID(uuid: string): boolean;
//# sourceMappingURL=validation.d.ts.map