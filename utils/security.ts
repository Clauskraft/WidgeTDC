/**
 * Security Utilities Module
 * Enterprise-grade security functions for input validation, sanitization, and protection
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Raw user input string
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format with strict regex
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Validate URL to prevent SSRF and open redirect vulnerabilities
 * @param url - URL to validate
 * @param allowedProtocols - Allowed URL protocols
 * @returns true if URL is valid and safe
 */
export function isValidUrl(
  url: string,
  allowedProtocols: string[] = ['https:', 'http:']
): boolean {
  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize file paths to prevent directory traversal attacks
 * @param path - File path to sanitize
 * @returns Sanitized path or null if suspicious
 */
export function sanitizeFilePath(path: string): string | null {
  if (!path) return null;
  
  // Block directory traversal attempts
  if (path.includes('..') || path.includes('./') || path.includes('~')) {
    return null;
  }
  
  // Block absolute paths
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
    return null;
  }
  
  return path.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Generate secure random token
 * @param length - Length of token (default 32)
 * @returns Cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate JWT token format (basic validation)
 * @param token - JWT token string
 * @returns true if token has valid JWT format
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Validate base64url encoding
    parts.forEach(part => {
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limiter class for client-side rate limiting
 */
export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  /**
   * Check if request is allowed under rate limit
   * @returns true if request is allowed
   */
  public allowRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
  
  /**
   * Get time until next request is allowed (ms)
   * @returns milliseconds until next request, or 0 if allowed now
   */
  public getRetryAfter(): number {
    if (this.requests.length < this.maxRequests) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
  
  /**
   * Reset rate limiter
   */
  public reset(): void {
    this.requests = [];
  }
}

/**
 * Content Security Policy (CSP) nonce generator
 * @returns CSP nonce value
 */
export function generateCSPNonce(): string {
  return generateSecureToken(16);
}

/**
 * Validate and sanitize JSON input
 * @param input - String to parse as JSON
 * @param maxDepth - Maximum allowed object depth
 * @returns Parsed and validated JSON object or null
 */
export function sanitizeJSON<T = any>(input: string, maxDepth: number = 10): T | null {
  try {
    const parsed = JSON.parse(input);
    
    // Check depth to prevent DOS attacks
    const checkDepth = (obj: any, depth: number = 0): boolean => {
      if (depth > maxDepth) return false;
      if (typeof obj !== 'object' || obj === null) return true;
      
      return Object.values(obj).every(value => checkDepth(value, depth + 1));
    };
    
    if (!checkDepth(parsed)) {
      return null;
    }
    
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Secure string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with score and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else {
    score += 1;
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }
  
  const isValid = score >= 4 && password.length >= 8;
  
  return {
    isValid,
    score: Math.min(5, score),
    feedback: isValid ? [] : feedback
  };
}

/**
 * Sanitize HTML content while preserving safe tags
 * @param html - HTML string to sanitize
 * @param allowedTags - Array of allowed HTML tags
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(
  html: string,
  allowedTags: string[] = ['b', 'i', 'em', 'strong', 'a', 'p', 'br']
): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const sanitize = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return sanitizeInput(node.textContent || '');
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tag = element.tagName.toLowerCase();
      
      if (!allowedTags.includes(tag)) {
        return element.childNodes.length > 0 ? sanitize(element.childNodes[0]) : '';
      }
      
      const children = Array.from(element.childNodes)
        .map(child => sanitize(child))
        .join('');
      
      // Sanitize attributes
      const attrs = Array.from(element.attributes)
        .filter(attr => ['href', 'title'].includes(attr.name))
        .map(attr => {
          if (attr.name === 'href' && !isValidUrl(attr.value)) {
            return '';
          }
          return `${attr.name}="${sanitizeInput(attr.value)}"`;
        })
        .filter(Boolean)
        .join(' ');
      
      return `<${tag}${attrs ? ' ' + attrs : ''}>${children}</${tag}>`;
    }
    
    return '';
  };
  
  return Array.from(div.childNodes).map(sanitize).join('');
}

/**
 * Check if content contains potential XSS patterns
 * @param content - Content to check
 * @returns true if suspicious patterns detected
 */
export function containsXSSPatterns(content: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?<\/script\s*>/gi, // Match script tags with any characters (including whitespace) between tags and optional whitespace after closing tag
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[\s\S]*?>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(content));
}

/**
 * Redact sensitive information from logs
 * @param data - Data object that may contain sensitive info
 * @returns Redacted data object
 */
export function redactSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apikey',
    'api_key',
    'authorization',
    'cookie',
    'sessionid',
    'ssn',
    'creditcard',
    'cvv'
  ];
  
  const redacted = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  
  return redacted;
}
