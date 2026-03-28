/**
 * Security Middleware
 * Handles security-related middleware functions
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { SECURITY } from '@super-son1k/shared-utils';

/**
 * Security headers middleware
 */
export async function securityHeadersMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Set security headers
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  reply.header('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.socket.io; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' wss: ws: https:; " +
    "media-src 'self' blob: data:; " +
    "object-src 'none'; " +
    "frame-src 'none';"
  );
}

/**
 * Request validation middleware
 */
export async function requestValidationMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Validate request size
  const contentLength = parseInt(request.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return reply.code(413).send({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large'
      }
    });
  }

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return reply.code(415).send({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Content-Type must be application/json'
        }
      });
    }
  }
}

/**
 * API key validation middleware
 */
export async function apiKeyMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'API_KEY_REQUIRED',
        message: 'API key is required'
      }
    });
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key format'
      }
    });
  }

  // Store API key in request for later use
  (request as any).apiKey = apiKey;
}

/**
 * Token validation middleware
 */
export async function tokenValidationMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const tokenHash = request.headers['x-token-hash'] as string;
  
  if (tokenHash) {
    try {
      // Validate token hash format
      if (!/^[a-f0-9]{64}$/.test(tokenHash)) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN_HASH',
            message: 'Invalid token hash format'
          }
        });
      }

      // Store token hash in request
      (request as any).tokenHash = tokenHash;
    } catch (error) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'TOKEN_VALIDATION_FAILED',
          message: 'Token validation failed'
        }
      });
    }
  }
}

/**
 * CORS middleware
 */
export async function corsMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const origin = request.headers.origin;
  const allowedOrigins = process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'];

  if (origin && allowedOrigins.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
  }

  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  reply.header('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Request-ID, X-API-Key, X-Token-Hash, User-Agent'
  );
  reply.header('Access-Control-Max-Age', '86400');
}

/**
 * Request ID middleware
 */
export async function requestIdMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const requestId = request.headers['x-request-id'] as string || 
                   request.headers['x-correlation-id'] as string ||
                   generateRequestId();

  reply.header('X-Request-ID', requestId);
  (request as any).requestId = requestId;
}

/**
 * User agent validation middleware
 */
export async function userAgentMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const userAgent = request.headers['user-agent'];
  
  if (!userAgent) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'USER_AGENT_REQUIRED',
        message: 'User-Agent header is required'
      }
    });
  }

  // Block suspicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'SUSPICIOUS_USER_AGENT',
        message: 'Automated requests are not allowed'
      }
    });
  }
}

/**
 * IP whitelist middleware
 */
export async function ipWhitelistMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const clientIp = request.ip;
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];

  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIp)) {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'IP_NOT_ALLOWED',
        message: 'IP address not allowed'
      }
    });
  }
}

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  const clientIp = request.ip;
  
  // Get rate limit based on user tier
  let maxRequests = 10; // Default for anonymous users
  
  if (user) {
    switch (user.tier) {
      case 'ENTERPRISE':
        maxRequests = 1000;
        break;
      case 'PREMIUM':
        maxRequests = 100;
        break;
      case 'PRO':
        maxRequests = 50;
        break;
      case 'FREE':
        maxRequests = 10;
        break;
    }
  }

  // Simple in-memory rate limiting (in production, use Redis)
  const key = user ? `user:${user.id}` : `ip:${clientIp}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute

  // This is a simplified implementation
  // In production, use a proper rate limiting library
  const rateLimitKey = `rate_limit:${key}`;
  const current = (global as any).rateLimitStore?.[rateLimitKey] || { count: 0, resetTime: now + windowMs };
  
  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }

  if (current.count >= maxRequests) {
    reply.header('X-RateLimit-Limit', maxRequests.toString());
    reply.header('X-RateLimit-Remaining', '0');
    reply.header('X-RateLimit-Reset', current.resetTime.toString());
    reply.header('Retry-After', Math.ceil((current.resetTime - now) / 1000).toString());

    return reply.code(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }
    });
  }

  current.count++;
  (global as any).rateLimitStore = (global as any).rateLimitStore || {};
  (global as any).rateLimitStore[rateLimitKey] = current;

  reply.header('X-RateLimit-Limit', maxRequests.toString());
  reply.header('X-RateLimit-Remaining', (maxRequests - current.count).toString());
  reply.header('X-RateLimit-Reset', current.resetTime.toString());
}

/**
 * Generate device fingerprint from request headers
 */
export function generateDeviceFingerprint(request: FastifyRequest): string {
  const userAgent = request.headers['user-agent'] || '';
  const ip = request.ip || 'unknown';
  const acceptLanguage = request.headers['accept-language'] || '';
  const acceptEncoding = request.headers['accept-encoding'] || '';
  
  // Create fingerprint string
  const fingerprintString = `${userAgent}-${ip}-${acceptLanguage}-${acceptEncoding}`;
  
  // Hash it for privacy
  return crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');
}

/**
 * Generate request ID
 */
function generateRequestId(): string {
  return 'req_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Security middleware chain
 */
export const securityMiddleware = [
  securityHeadersMiddleware,
  requestValidationMiddleware,
  requestIdMiddleware,
  corsMiddleware,
  userAgentMiddleware
];

/**
 * API security middleware chain
 */
export const apiSecurityMiddleware = [
  ...securityMiddleware,
  apiKeyMiddleware,
  tokenValidationMiddleware,
  rateLimitMiddleware
];
