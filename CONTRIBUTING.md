# Contributing to WidgetBoard

Thank you for your interest in contributing to WidgetBoard! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm 9+
- Git
- Familiarity with React, TypeScript, and modern web development

### Setup Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/WidgeTDC.git
   cd WidgeTDC
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/Clauskraft/WidgeTDC.git
   ```
4. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
5. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or modifications
- `security/description` - Security fixes

### Making Changes

1. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Write or update tests:

   ```bash
   npm test
   ```

4. Run linter:

   ```bash
   npm run lint
   ```

5. Format your code:

   ```bash
   npm run format
   ```

6. Commit your changes:
   ```bash
   git commit -m "feat: add amazing feature"
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or tooling changes
- `security`: Security improvements

**Examples:**

```
feat(widgets): add email RAG widget
fix(security): prevent XSS in input fields
docs(readme): update installation instructions
test(utils): add security utility tests
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define types for all function parameters and return values
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes
- Use enums for fixed sets of values

### React

- Use functional components with hooks
- Keep components small and focused (< 300 lines)
- Extract complex logic into custom hooks
- Use memo/useMemo/useCallback for performance optimization
- Implement error boundaries for widget isolation

### Security

- Sanitize all user input
- Validate all external data
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines
- Never commit secrets or API keys

### Testing

- Write tests for all new features
- Maintain minimum 70% code coverage
- Test both happy paths and error cases
- Use descriptive test names
- Mock external dependencies

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small (< 50 lines)
- Maximum line length: 100 characters

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- security.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeInput } from './security';

describe('sanitizeInput', () => {
  it('should remove XSS attempts', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeInput(input);
    expect(result).not.toContain('<script>');
  });
});
```

## Pull Request Process

### Before Submitting

- [ ] Tests pass: `npm test`
- [ ] Linter passes: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Build succeeds: `npm run build`
- [ ] Documentation updated (if needed)
- [ ] Changelog updated (for significant changes)

### Submitting PR

1. Push your branch to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub

3. Fill out the PR template completely

4. Link related issues

5. Request review from maintainers

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

### Review Process

- At least one approval required
- All checks must pass
- No unresolved conversations
- Branch up to date with main
- Squash and merge preferred

## Documentation

### Code Documentation

- Add JSDoc comments for functions:
  ```typescript
  /**
   * Sanitize user input to prevent XSS attacks
   * @param input - Raw user input string
   * @returns Sanitized string safe for display
   */
  export function sanitizeInput(input: string): string {
    // Implementation
  }
  ```

### Architecture Decisions

Document significant architectural decisions in `docs/ADR/`:

```markdown
# ADR-001: Use Circuit Breaker Pattern

## Status

Accepted

## Context

Need fault tolerance for external service calls

## Decision

Implement circuit breaker pattern in MCP client

## Consequences

- Improved resilience
- Faster failure detection
- Additional complexity
```

## Security Guidelines

### Security-First Mindset

- Assume all input is malicious
- Validate on server and client
- Use allowlists over denylists
- Fail securely
- Log security events

### Common Vulnerabilities to Avoid

1. **XSS (Cross-Site Scripting)**
   - Sanitize all user input
   - Use Content Security Policy
   - Escape HTML entities

2. **SQL Injection**
   - Use parameterized queries
   - Validate input types
   - Implement least privilege

3. **CSRF (Cross-Site Request Forgery)**
   - Use CSRF tokens
   - Validate origin headers
   - SameSite cookies

4. **Authentication Issues**
   - Use strong passwords
   - Implement MFA
   - Secure session management

### Reporting Security Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@widgetboard.example.com

Include:

- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

## Performance Guidelines

### Optimization Techniques

- Lazy load components
- Implement code splitting
- Use React.memo for expensive components
- Debounce user input
- Throttle scroll/resize handlers
- Optimize images and assets

### Performance Testing

```typescript
import { logger } from './utils/logger';

const endTimer = logger.startTimer('Operation Name');
// ... your code ...
endTimer(); // Logs: Performance: Operation Name { duration: "12.34ms" }
```

## Getting Help

### Resources

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Security Policy](SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Reference](docs/API.md)

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Email**: dev@widgetboard.example.com

## Recognition

Contributors will be recognized in:

- README.md acknowledgments section
- Release notes
- GitHub contributors page

Thank you for contributing to WidgetBoard! 🎉
