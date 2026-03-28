/**
 * Validation utilities for Super-Son1k-2.0
 */

import { z } from 'zod';

/**
 * Validation schemas
 */
export const ValidationSchemas = {
  // User validation
  user: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30),
    password: z.string().min(8).optional(),
    tier: z.enum(['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE']).optional()
  }),
  
  // Generation validation
  generation: z.object({
    prompt: z.string().min(1).max(1000),
    duration: z.number().min(30).max(600).optional(),
    tempo: z.number().min(60).max(200).optional(),
    key: z.string().optional(),
    genre: z.string().optional(),
    mood: z.string().optional(),
    instruments: z.array(z.string()).optional(),
    style: z.string().optional(),
    complexity: z.number().min(0).max(1).optional(),
    temperature: z.number().min(0).max(1).optional(),
    seed: z.number().optional(),
    model: z.string().optional()
  }),
  
  // Token validation
  token: z.object({
    token: z.string().min(1),
    userId: z.string().optional(),
    email: z.string().email().optional(),
    tier: z.enum(['FREE', 'PREMIUM', 'ENTERPRISE']).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  }),
  
  // Collaboration validation
  collaboration: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional()
  }),

  // Stripe validation
  stripe: z.object({
    priceId: z.string().min(1),
    customerId: z.string().min(1).optional(),
    subscriptionId: z.string().min(1).optional(),
    paymentMethodId: z.string().min(1).optional()
  }),

  // Analytics validation
  analytics: z.object({
    event: z.string().min(1).max(100),
    properties: z.record(z.string(), z.any()).optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    timestamp: z.number().optional()
  }),

  // NFT validation
  nft: z.object({
    tokenId: z.string().min(1),
    contractAddress: z.string().min(1),
    metadata: z.record(z.string(), z.any()).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().min(3).max(3).optional()
  }),

  // Extension validation
  extension: z.object({
    action: z.enum(['generate', 'save', 'share', 'export']),
    data: z.record(z.string(), z.any()).optional(),
    userId: z.string().optional()
  }),

  // WebSocket validation
  websocket: z.object({
    type: z.string().min(1),
    payload: z.record(z.string(), z.any()).optional(),
    room: z.string().optional(),
    userId: z.string().optional()
  }),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1).max(255),
    mimetype: z.string().min(1),
    size: z.number().min(1).max(50 * 1024 * 1024), // 50MB max
    buffer: z.instanceof(Buffer).optional()
  })
};

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate generation parameters
 */
export function validateGenerationParameters(params: any): {
  valid: boolean;
  errors: string[];
  data?: any;
} {
  try {
    const validated = ValidationSchemas.generation.parse(params);
    return {
      valid: true,
      errors: [],
      data: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
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
export function validateUserData(data: any): {
  valid: boolean;
  errors: string[];
  user?: any;
} {
  try {
    const validated = ValidationSchemas.user.parse(data);
    return {
      valid: true,
      errors: [],
      user: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
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
export function validateTokenData(data: any): {
  valid: boolean;
  errors: string[];
  token?: any;
} {
  try {
    const validated = ValidationSchemas.token.parse(data);
    return {
      valid: true,
      errors: [],
      token: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
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
export function validateCollaborationData(data: any): {
  valid: boolean;
  errors: string[];
  collaboration?: any;
} {
  try {
    const validated = ValidationSchemas.collaboration.parse(data);
    return {
      valid: true,
      errors: [],
      collaboration: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
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
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
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
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
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
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate Stripe data
 */
export function validateStripeData(data: any): {
  valid: boolean;
  errors: string[];
  stripe?: any;
} {
  try {
    const validated = ValidationSchemas.stripe.parse(data);
    return {
      valid: true,
      errors: [],
      stripe: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      valid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate Analytics data
 */
export function validateAnalyticsData(data: any): {
  valid: boolean;
  errors: string[];
  analytics?: any;
} {
  try {
    const validated = ValidationSchemas.analytics.parse(data);
    return {
      valid: true,
      errors: [],
      analytics: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      valid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate NFT data
 */
export function validateNFTData(data: any): {
  valid: boolean;
  errors: string[];
  nft?: any;
} {
  try {
    const validated = ValidationSchemas.nft.parse(data);
    return {
      valid: true,
      errors: [],
      nft: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      valid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate Extension data
 */
export function validateExtensionData(data: any): {
  valid: boolean;
  errors: string[];
  extension?: any;
} {
  try {
    const validated = ValidationSchemas.extension.parse(data);
    return {
      valid: true,
      errors: [],
      extension: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      valid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate WebSocket data
 */
export function validateWebSocketData(data: any): {
  valid: boolean;
  errors: string[];
  websocket?: any;
} {
  try {
    const validated = ValidationSchemas.websocket.parse(data);
    return {
      valid: true,
      errors: [],
      websocket: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      valid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate File Upload data
 */
export function validateFileUploadData(data: any): {
  valid: boolean;
  errors: string[];
  fileUpload?: any;
} {
  try {
    const validated = ValidationSchemas.fileUpload.parse(data);
    return {
      valid: true,
      errors: [],
      fileUpload: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      valid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(requests: number, limit: number): boolean {
  return requests <= limit;
}

/**
 * Validate audio file MIME type
 */
export function isValidAudioMimeType(mimetype: string): boolean {
  const validFormats = [
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/ogg',
    'audio/m4a',
    'audio/aac',
    'audio/flac'
  ];
  return validFormats.includes(mimetype);
}

/**
 * Validate image file format
 */
export function isValidImageFormat(mimetype: string): boolean {
  const validFormats = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  return validFormats.includes(mimetype);
}
