# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities to security@widgettdc.dev

We will respond within 48 hours and provide a timeline for fixes.

## Security Measures

- All passwords are hashed using bcrypt
- JWT tokens with 24-hour expiration
- SQL injection prevention via parameterized queries
- XSS protection with input sanitization
- CSRF tokens on all state-changing operations
- Rate limiting on authentication endpoints
- Security headers (HSTS, CSP, X-Frame-Options)

## Dependency Management

Dependencies are scanned weekly for known vulnerabilities.
Critical vulnerabilities are patched within 24 hours.
