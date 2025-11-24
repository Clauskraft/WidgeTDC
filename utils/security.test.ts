import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeInput,
  isValidEmail,
  isValidUrl,
  sanitizeFilePath,
  generateSecureToken,
  isValidJWTFormat,
  RateLimiter,
  sanitizeJSON,
  secureCompare,
  validatePasswordStrength,
  containsXSSPatterns,
  redactSensitiveData,
} from './security';

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('should sanitize XSS attempts', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should preserve safe text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should reject javascript: protocol', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject data: URLs', () => {
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should validate HTTP when allowed', () => {
      expect(isValidUrl('http://example.com', ['http:', 'https:'])).toBe(true);
    });
  });

  describe('sanitizeFilePath', () => {
    it('should allow safe paths', () => {
      expect(sanitizeFilePath('file.txt')).toBe('file.txt');
      expect(sanitizeFilePath('dir/file.txt')).toBe('dir_file.txt');
    });

    it('should reject directory traversal attempts', () => {
      expect(sanitizeFilePath('../etc/passwd')).toBe(null);
      expect(sanitizeFilePath('./config')).toBe(null);
      expect(sanitizeFilePath('~/secrets')).toBe(null);
    });

    it('should reject absolute paths', () => {
      expect(sanitizeFilePath('/etc/passwd')).toBe(null);
      expect(sanitizeFilePath('C:\\Windows\\System32')).toBe(null);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of correct length', () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken(16);
      const token2 = generateSecureToken(16);
      expect(token1).not.toBe(token2);
    });
  });

  describe('isValidJWTFormat', () => {
    it('should validate JWT format', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(isValidJWTFormat(validJWT)).toBe(true);
    });

    it('should reject invalid JWT format', () => {
      expect(isValidJWTFormat('invalid')).toBe(false);
      expect(isValidJWTFormat('header.payload')).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter(3, 1000); // 3 requests per second
    });

    it('should allow requests within limit', () => {
      expect(limiter.allowRequest()).toBe(true);
      expect(limiter.allowRequest()).toBe(true);
      expect(limiter.allowRequest()).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      limiter.allowRequest();
      limiter.allowRequest();
      limiter.allowRequest();
      expect(limiter.allowRequest()).toBe(false);
    });

    it('should reset after time window', async () => {
      limiter.allowRequest();
      limiter.allowRequest();
      limiter.allowRequest();
      expect(limiter.allowRequest()).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(limiter.allowRequest()).toBe(true);
    });

    it('should report retry time correctly', () => {
      limiter.allowRequest();
      limiter.allowRequest();
      limiter.allowRequest();
      const retryAfter = limiter.getRetryAfter();
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(1000);
    });
  });

  describe('sanitizeJSON', () => {
    it('should parse valid JSON', () => {
      const result = sanitizeJSON('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should reject deeply nested objects', () => {
      const deep = '{"a":{"b":{"c":{"d":{"e":{"f":{"g":{"h":{"i":{"j":{"k":"too deep"}}}}}}}}}}}';
      const result = sanitizeJSON(deep, 5);
      expect(result).toBe(null);
    });

    it('should handle invalid JSON', () => {
      const result = sanitizeJSON('invalid json');
      expect(result).toBe(null);
    });
  });

  describe('secureCompare', () => {
    it('should return true for equal strings', () => {
      expect(secureCompare('secret123', 'secret123')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('secret123', 'secret124')).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(secureCompare('short', 'longer')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const result = validatePasswordStrength('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
    });

    it('should reject weak passwords', () => {
      const result = validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback for improvement', () => {
      const result = validatePasswordStrength('lowercase');
      expect(result.feedback).toContain('Add uppercase letters');
      expect(result.feedback).toContain('Add numbers');
      expect(result.feedback).toContain('Add special characters');
    });
  });

  describe('containsXSSPatterns', () => {
    it('should detect script tags', () => {
      expect(containsXSSPatterns('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsXSSPatterns('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsXSSPatterns('<img onerror="alert(1)">')).toBe(true);
    });

    it('should allow safe content', () => {
      expect(containsXSSPatterns('Hello, World!')).toBe(false);
    });
  });

  describe('redactSensitiveData', () => {
    it('should redact password fields', () => {
      const data = { username: 'john', password: 'secret123' };
      const redacted = redactSensitiveData(data);
      expect(redacted.username).toBe('john');
      expect(redacted.password).toBe('[REDACTED]');
    });

    it('should redact nested sensitive fields', () => {
      const data = {
        user: {
          name: 'john',
          apiKey: 'sk-123456'
        }
      };
      const redacted = redactSensitiveData(data);
      expect(redacted.user.name).toBe('john');
      expect(redacted.user.apiKey).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const data = [
        { id: 1, token: 'abc' },
        { id: 2, token: 'def' }
      ];
      const redacted = redactSensitiveData(data);
      expect(redacted[0].token).toBe('[REDACTED]');
      expect(redacted[1].token).toBe('[REDACTED]');
    });
  });
});
