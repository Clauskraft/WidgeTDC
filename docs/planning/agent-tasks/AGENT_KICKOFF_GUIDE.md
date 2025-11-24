# Agent Kickoff Guide

## 🚀 Starting Your Implementation

This guide helps agents quickly understand how to start working on WidgeTDC improvements.

## 📖 Quick Start (5 minutes)

### 1. Read Current State
```bash
# Check main branch status
git checkout main
git pull origin main

# Review current architecture
cat README.md
cat docs/planning/agent-tasks/README.md
```

### 2. Understand Project Structure
```
WidgeTDC/
├── apps/
│   ├── backend/          # Node.js/Express backend
│   │   ├── src/
│   │   │   ├── services/ # Business logic (Memory, SRAG, Evolution, PAL)
│   │   │   ├── mcp/      # MCP gateway and tools
│   │   │   └── database/ # SQLite (to be migrated to PostgreSQL)
│   │   └── package.json
│   └── widget-board/     # React frontend
│       ├── components/   # UI components
│       ├── widgets/      # Individual widgets
│       └── package.json
├── packages/
│   └── shared/
│       └── mcp-types/    # Shared TypeScript types
└── docs/
    └── planning/
        └── agent-tasks/  # Implementation plans (YOU ARE HERE)
```

### 3. Choose Your Phase

**If you're the first agent**:
→ Start with [Phase 1: Authentication](./PHASE_1_AUTHENTICATION.md) OR [Phase 9: CI/CD](./PHASE_9_CICD.md) (can run in parallel)

**If Phase 1 is done**:
→ Start [Phase 2: PostgreSQL Migration](./PHASE_2_POSTGRESQL_MIGRATION.md)

**If you want observability**:
→ [Phase 6: Observability](./PHASE_6_OBSERVABILITY.md) (can run anytime)

### 4. Create Your Branch
```bash
# Pattern: agent/<your-role>/phase<N>-<task-name>
git checkout -b agent/backend-engineer/phase1-auth-service

# Example names:
# agent/backend-architect/phase1-auth-design
# agent/frontend-engineer/phase1-login-form
# agent/devops/phase2-postgres-setup
```

## 🎯 Agent Role Assignments

### Backend Architect
**Responsibilities**: System design, architecture decisions, database schema
**Primary Phases**: 1, 2, 4
**Skills Required**: System architecture, database design, microservices patterns

**Start Here**:
1. Phase 1, Task 1.1: Design Authentication Architecture
2. Phase 2, Task 2.1: Database Schema Analysis & Design

### Backend Engineer
**Responsibilities**: API implementation, business logic, testing
**Primary Phases**: 1, 2, 3, 4, 6, 7, 10
**Skills Required**: Node.js, TypeScript, Express, SQL, Testing

**Start Here**:
1. Phase 1, Task 1.2: Implement Database Schema
2. Phase 1, Task 1.3: Implement Authentication Service
3. Phase 2, Task 2.4: Update Repository Layer

### Frontend Engineer
**Responsibilities**: UI components, state management, responsive design
**Primary Phases**: 1, 5, 7, 8
**Skills Required**: React, TypeScript, CSS, Mobile development

**Start Here**:
1. Phase 1, Task 1.6: Frontend Login Implementation
2. Phase 5: Widget marketplace UI
3. Phase 8: Mobile app development

### Data Engineer
**Responsibilities**: Database migrations, data pipelines, ETL
**Primary Phases**: 2, 3
**Skills Required**: SQL, PostgreSQL, data migration, vector databases

**Start Here**:
1. Phase 2, Task 2.1: Database Schema Analysis & Design
2. Phase 2, Task 2.5: Data Migration Script
3. Phase 3: Vector embeddings setup

### DevOps Engineer
**Responsibilities**: Infrastructure, CI/CD, containerization, monitoring
**Primary Phases**: 4, 6, 9
**Skills Required**: Docker, Kubernetes, GitHub Actions, Prometheus, Grafana

**Start Here**:
1. Phase 9: CI/CD Automation (HIGH PRIORITY - enables all other work)
2. Phase 2, Task 2.2: Set Up PostgreSQL Infrastructure
3. Phase 6: Observability stack

### Security Expert
**Responsibilities**: Security audits, compliance, vulnerability assessment
**Primary Phases**: 1, 10
**Skills Required**: Security best practices, GDPR, penetration testing

**Start Here**:
1. Phase 1: Authentication security review
2. Phase 10: Data privacy and compliance implementation

### QA Engineer
**Responsibilities**: Test strategy, test automation, quality assurance
**Primary Phases**: All phases (cross-cutting)
**Skills Required**: Jest, Playwright, E2E testing, performance testing

**Start Here**:
1. Phase 1: Write test suites for authentication
2. Phase 9: Set up automated testing in CI/CD
3. Review test coverage across all phases

## 📝 Implementation Workflow

### Step 1: Read Phase Document
```bash
# Open your assigned phase
cat docs/planning/agent-tasks/PHASE_1_AUTHENTICATION.md
```

**What to look for**:
- [ ] Objective and prerequisites
- [ ] Task breakdown with estimates
- [ ] Deliverables (code, config, docs)
- [ ] Test cases
- [ ] Success criteria

### Step 2: Verify Prerequisites
Example for Phase 1:
```bash
# Check Node.js version
node --version  # Should be >= 18

# Check if backend runs
cd apps/backend
npm install
npm run dev

# Check if frontend runs
cd ../widget-board
npm install
npm run dev
```

### Step 3: Implement Task by Task
```bash
# Create feature branch for each task
git checkout -b agent/backend-engineer/phase1-task1.2-db-schema

# Make changes
# ... implement task ...

# Run tests
npm test

# Commit with descriptive message
git add .
git commit -m "Phase 1, Task 1.2: Implement auth database schema

- Created users, roles, and user_roles tables
- Added foreign key constraints
- Seeded default roles (admin, standard, viewer)
- Tests: Schema creation and constraint validation

Test Results: ✅ All passing (8/8)
"

# Push and create PR
git push origin agent/backend-engineer/phase1-task1.2-db-schema
```

### Step 4: Write Tests FIRST (TDD)
```typescript
// BEFORE implementing feature, write the test

describe('AuthService.login', () => {
  it('should return token for valid credentials', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'password123';

    // Act
    const result = await authService.login(username, password);

    // Assert
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});

// NOW implement the feature to make test pass
```

### Step 5: Document As You Go
```typescript
/**
 * Authenticates a user with username and password.
 *
 * @param username - User's username
 * @param password - Plain text password (will be compared with hashed version)
 * @returns Access token, refresh token, and user object
 * @throws {Error} If credentials are invalid
 *
 * @example
 * ```typescript
 * const result = await authService.login('john', 'password123');
 * console.log(result.accessToken); // JWT token
 * ```
 */
async login(username: string, password: string): Promise<AuthResult> {
  // ... implementation
}
```

### Step 6: Create Pull Request
**PR Title Format**: `[Phase X] Task X.Y: <Brief Description>`

**PR Description Template**:
```markdown
## Phase 1, Task 1.3: Implement Authentication Service

### Deliverables
✅ AuthService class with login, register, refresh methods
✅ Password hashing with bcrypt
✅ JWT token generation and verification
✅ Unit tests with 95% coverage

### Test Results
- Unit Tests: 15/15 passing ✅
- Integration Tests: 5/5 passing ✅
- Code Coverage: 95% ✅

### Breaking Changes
None

### Dependencies
Requires Task 1.2 (database schema) to be merged first

### Screenshots
N/A (backend service)

### Checklist
- [x] Code follows project style guide
- [x] Tests written and passing
- [x] Documentation updated
- [x] No console.log statements
- [x] Error handling implemented
- [x] Security best practices followed

### Review Notes
Please verify:
1. JWT secret handling (using env vars)
2. Password hashing cost factor (set to 10)
3. Token expiration times (15m access, 7d refresh)
```

## 🧪 Testing Standards

### Unit Tests (Jest)
**Location**: `*.test.ts` next to implementation
**Coverage Target**: ≥ 80%
**Run Command**: `npm test`

Example:
```typescript
// apps/backend/src/services/auth/authService.test.ts
import { AuthService } from './authService';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should hash passwords securely', async () => {
    const password = 'mypassword';
    const hash = await authService.hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });
});
```

### Integration Tests
**Location**: `apps/backend/src/__tests__/integration/`
**Run Command**: `npm run test:integration`

Example:
```typescript
// apps/backend/src/__tests__/integration/auth.test.ts
import request from 'supertest';
import app from '../../index';

describe('Auth Integration', () => {
  it('should login and access protected endpoint', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(loginRes.status).toBe(200);
    const { accessToken } = loginRes.body;

    // 2. Access protected endpoint
    const protectedRes = await request(app)
      .get('/api/memory/entities')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(protectedRes.status).toBe(200);
  });
});
```

### E2E Tests (Playwright)
**Location**: `apps/widget-board/tests/`
**Run Command**: `npm run test:e2e`

Example:
```typescript
// apps/widget-board/tests/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete auth flow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');

  // Fill login form
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Login")');

  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('.user-menu')).toContainText('testuser');

  // Logout
  await page.click('.user-menu');
  await page.click('text=Logout');

  // Verify redirect to login
  await expect(page).toHaveURL(/.*login/);
});
```

## 🔍 Code Quality Standards

### TypeScript
```typescript
// ✅ GOOD: Explicit types, no 'any'
function login(username: string, password: string): Promise<AuthResult> {
  // ...
}

// ❌ BAD: Implicit any, no return type
function login(username, password) {
  // ...
}
```

### Error Handling
```typescript
// ✅ GOOD: Specific error types, proper error messages
class InvalidCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

async function login(username: string, password: string) {
  const user = await findUser(username);
  if (!user) {
    throw new InvalidCredentialsError('User not found');
  }
  // ...
}

// ❌ BAD: Generic errors, no context
async function login(username: string, password: string) {
  const user = await findUser(username);
  if (!user) {
    throw new Error('Error');
  }
}
```

### Async/Await
```typescript
// ✅ GOOD: Async/await with try-catch
async function login(username: string, password: string) {
  try {
    const user = await findUser(username);
    return user;
  } catch (error) {
    logger.error('Login failed', { username, error });
    throw error;
  }
}

// ❌ BAD: Promise chains, no error handling
function login(username, password) {
  return findUser(username)
    .then(user => user);
}
```

## 📞 Communication & Coordination

### Daily Updates
**Format**: Git commit messages
**Frequency**: At least one commit per task

### Blockers
**Report Via**: GitHub issues with `[BLOCKER]` tag
**Include**:
1. Phase and task number
2. Description of blocker
3. What you've tried
4. What help you need

Example:
```markdown
Title: [BLOCKER] Phase 1, Task 1.3: Missing JWT_SECRET environment variable

Description:
Cannot test authentication service because JWT_SECRET is not defined.

Attempted Solutions:
- Checked .env.example
- Searched codebase for .env template

Needed:
- .env.example with JWT_SECRET
- OR documentation on how to generate secrets
- OR default value for development

Blocking:
- Task 1.3: Authentication Service
- Task 1.4: Authorization Middleware
```

### Handoffs
**When completing a phase**, create handoff document:

```markdown
# Phase 1 Handoff Document

## Completed
✅ All 6 tasks complete
✅ 100% test coverage
✅ Documentation updated
✅ Security audit passed

## What's Ready
- Authentication API (/api/auth/*)
- Authorization middleware
- Login form component
- User/role database

## Known Issues
None

## Next Phase Dependencies Met
✅ Phase 2 can start (auth not blocking)
✅ Phase 10 can start (auth foundation ready)

## Environment Variables Added
- JWT_SECRET (required)
- JWT_REFRESH_SECRET (required)
- JWT_EXPIRY (optional, default: 15m)

## Migration Required
Yes - run: npm run migrate:auth

## Notes for Next Agent
- User table has username and email (both unique)
- Default roles seeded on first migration
- Admin user must be created manually (see docs)
```

## 🎓 Learning Resources

### Codebase Patterns
Read these before starting:
- `apps/backend/src/services/memory/memoryRepository.ts` - Repository pattern
- `apps/backend/src/mcp/toolHandlers.ts` - MCP integration pattern
- `apps/widget-board/widgets/AiPalWidget.tsx` - Widget structure

### External Docs
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Testing](https://playwright.dev/docs/intro)

## 🚨 Common Pitfalls

### 1. Not Running Tests Before Committing
```bash
# ❌ DON'T
git add .
git commit -m "Fix"
git push

# ✅ DO
npm test
npm run lint
npm run build
git add .
git commit -m "Phase 1, Task 1.3: Implement AuthService - Tests passing"
git push
```

### 2. Working Directly on Main
```bash
# ❌ DON'T
git checkout main
# ... make changes ...
git push

# ✅ DO
git checkout -b agent/backend-engineer/phase1-task3
# ... make changes ...
git push origin agent/backend-engineer/phase1-task3
# ... create PR ...
```

### 3. Skipping Documentation
```typescript
// ❌ DON'T
async function login(u, p) {
  // code
}

// ✅ DO
/**
 * Authenticates user with username and password.
 * @param username - User's unique username
 * @param password - Plain text password
 * @returns Authentication tokens and user object
 */
async function login(username: string, password: string): Promise<AuthResult> {
  // code
}
```

## ✅ Final Checklist

Before starting:
- [ ] Read phase document completely
- [ ] Verified prerequisites
- [ ] Created feature branch
- [ ] Understand test requirements
- [ ] Know where to report blockers

Before committing:
- [ ] All tests passing
- [ ] Lint passing
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] Error handling implemented

Before merging:
- [ ] PR created with proper description
- [ ] Another agent reviewed
- [ ] All CI checks passing
- [ ] Conflicts resolved
- [ ] Handoff document created (if final task)

---

**Ready to start?** Pick your phase and create your branch! 🚀

**Questions?** Create a GitHub issue with your question.

**Stuck?** Review the phase document test cases - they show expected behavior.
