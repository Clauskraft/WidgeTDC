/**
 * Input Validation and Sanitization Middleware
 * FIX #2: Security hardening - prevent XSS, SQL injection, and other attacks
 *
 * Implements OWASP Top 10 input validation best practices
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Comprehensive input validation rules
 */
const VALIDATION_RULES = {
  // Maximum lengths to prevent DOS
  MAX_STRING_LENGTH: 10000,
  MAX_ARRAY_LENGTH: 1000,
  MAX_OBJECT_DEPTH: 10,
  MAX_JSON_SIZE: '10mb',

  // Forbidden patterns (XSS, SQL injection, command injection)
  DANGEROUS_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,  // Script tags
    /javascript:/gi,                                           // JavaScript protocol
    /on\w+\s*=/gi,                                             // Event handlers
    /(union|select|insert|update|delete|drop|create)\b/gi,    // SQL keywords
    /['";\\]/g,                                                // SQL special chars
    /`/g,                                                      // Template literals
    /\$\{/g,                                                   // Template injection
    /[;&|`$()]/g,                                              // Command injection
  ],

  // Allowed characters for different field types
  ALLOWED_CHARS: {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    username: /^[a-zA-Z0-9_-]{3,32}$/,
    url: /^https?:\/\/.+$/,
    id: /^[a-zA-Z0-9_-]+$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
  }
};

/**
 * Sanitize string inputs
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input
    .trim()
    .slice(0, VALIDATION_RULES.MAX_STRING_LENGTH);

  // Remove dangerous patterns
  VALIDATION_RULES.DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // HTML entity encode
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: any, depth: number = 0): any {
  if (depth > VALIDATION_RULES.MAX_OBJECT_DEPTH) {
    throw new Error('Object nesting too deep - potential DOS attack');
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length > VALIDATION_RULES.MAX_ARRAY_LENGTH) {
      throw new Error('Array too large - potential DOS attack');
    }
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const cleanKey = sanitizeString(key);

    // Sanitize value
    if (typeof value === 'string') {
      sanitized[cleanKey] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[cleanKey] = sanitizeObject(value, depth + 1);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[cleanKey] = value;
    } else {
      sanitized[cleanKey] = null;
    }
  }

  return sanitized;
}

/**
 * Validate input against schema
 */
function validateField(value: any, fieldType: 'email' | 'username' | 'url' | 'id' | 'string'): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const pattern = VALIDATION_RULES.ALLOWED_CHARS[fieldType];
  if (!pattern) {
    return true; // Unknown type, allow through
  }

  return pattern.test(value);
}

/**
 * Main input validation middleware
 */
export const inputValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check content-type
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          message: 'Only application/json is supported'
        });
      }
    }

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      try {
        req.body = sanitizeObject(req.body);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid Input',
          message: (error as Error).message
        });
      }
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      try {
        const sanitizedQuery: any = {};
        for (const [key, value] of Object.entries(req.query)) {
          sanitizedQuery[sanitizeString(key)] = sanitizeString(String(value));
        }
        req.query = sanitizedQuery;
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid Query',
          message: (error as Error).message
        });
      }
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      try {
        const sanitizedParams: any = {};
        for (const [key, value] of Object.entries(req.params)) {
          sanitizedParams[key] = sanitizeString(String(value));
        }
        req.params = sanitizedParams;
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid Parameter',
          message: (error as Error).message
        });
      }
    }

    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Input validation failed'
    });
  }
};

/**
 * CSRF Protection middleware
 */
export const csrfProtectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check origin for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.get('origin');
    const referer = req.get('referer');
    const host = req.get('host');

    // Allow localhost to localhost communication regardless of port
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));

    if (origin && !origin.includes(host || 'localhost') && !isLocalhost) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'CSRF validation failed'
      });
    }

    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (!refererUrl.hostname.includes(host?.split(':')[0] || 'localhost')) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'CSRF validation failed'
          });
        }
      } catch (e) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid referer'
        });
      }
    }
  }

  next();
};

/**
 * Rate limiting to prevent DOS attacks
 */
export const rateLimitingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clientIp = req.ip || req.socket.remoteAddress || '';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  // Simple in-memory rate limiter (replace with Redis in production)
  const key = `rate-limit:${clientIp}`;

  // In production, use Redis or similar
  // For now, this is a placeholder
  if (!req.app.locals.rateLimiter) {
    req.app.locals.rateLimiter = new Map();
  }

  const limiter = req.app.locals.rateLimiter;
  const clientData = limiter.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + windowMs;
  } else {
    clientData.count++;
  }

  limiter.set(key, clientData);

  if (clientData.count > maxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded'
    });
  }

  res.set('X-RateLimit-Limit', maxRequests.toString());
  res.set('X-RateLimit-Remaining', (maxRequests - clientData.count).toString());
  res.set('X-RateLimit-Reset', clientData.resetTime.toString());

  next();
};

export default {
  inputValidationMiddleware,
  csrfProtectionMiddleware,
  rateLimitingMiddleware,
  sanitizeString,
  sanitizeObject,
  validateField
};
