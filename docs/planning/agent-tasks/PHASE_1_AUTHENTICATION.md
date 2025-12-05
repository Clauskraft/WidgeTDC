# Phase 1: Authentication & Authorization System

## 🎯 Objective
Implement robust authentication and authorization with role-based access control (RBAC) for all API endpoints.

## 📋 Prerequisites
- PostgreSQL migration completed (or adapt for SQLite)
- Backend services running
- Frontend matrix-frontend available

## 🔧 Implementation Tasks

### Task 1.1: Design Authentication Architecture
**Agent**: Backend Architect
**Priority**: Critical
**Estimated Time**: 4 hours

**Deliverables**:
- [ ] Authentication strategy document (OAuth 2.0 vs JWT)
- [ ] User role definitions (admin, standard, viewer)
- [ ] Database schema for users, roles, user_roles
- [ ] API endpoint design (/api/auth/login, /api/auth/refresh, /api/auth/logout)

**Test Cases**:
- Architecture review passes security audit
- Schema supports all defined roles
- API design follows REST best practices

### Task 1.2: Implement Database Schema
**Agent**: Backend Engineer
**Priority**: Critical
**Estimated Time**: 3 hours

**Deliverables**:
```sql
-- apps/backend/src/database/auth-schema.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB
);

CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Seed default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system access', '{"*": ["read", "write", "delete"]}'),
  ('standard', 'Standard user access', '{"memory": ["read", "write"], "srag": ["read"]}'),
  ('viewer', 'Read-only access', '{"*": ["read"]}');
```

**Test Cases**:
```typescript
// Test: Schema creation
await db.query('SELECT * FROM users');
await db.query('SELECT * FROM roles');
await db.query('SELECT * FROM user_roles');
// Expected: Tables exist without error

// Test: Foreign key constraints
// Insert user_role with invalid user_id -> Should fail
```

### Task 1.3: Implement Authentication Service
**Agent**: Backend Engineer
**Priority**: Critical
**Estimated Time**: 6 hours

**Deliverables**:
```typescript
// apps/backend/src/services/auth/authService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  async register(username: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    // Insert user with passwordHash
    return { userId, message: 'User registered' };
  }

  async login(username: string, password: string) {
    const user = await this.findUserByUsername(username);
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken, user };
  }

  async refreshToken(refreshToken: string) {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    const newAccessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    return { accessToken: newAccessToken };
  }

  async verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}
```

**Test Cases**:
```typescript
// Unit tests
describe('AuthService', () => {
  it('should register new user with hashed password', async () => {
    const result = await authService.register('testuser', 'test@example.com', 'password123');
    expect(result.userId).toBeDefined();
    // Verify password is hashed in DB
  });

  it('should login with correct credentials', async () => {
    const result = await authService.login('testuser', 'password123');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    await expect(authService.login('testuser', 'wrongpassword'))
      .rejects.toThrow('Invalid credentials');
  });

  it('should refresh access token', async () => {
    const { refreshToken } = await authService.login('testuser', 'password123');
    const result = await authService.refreshToken(refreshToken);
    expect(result.accessToken).toBeDefined();
  });
});
```

### Task 1.4: Implement Authorization Middleware
**Agent**: Backend Engineer
**Priority**: Critical
**Estimated Time**: 4 hours

**Deliverables**:
```typescript
// apps/backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/authService.js';

const authService = new AuthService();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = await authService.verifyToken(token);

    req.user = payload; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Load user roles and check permissions
    const userRoles = await authService.getUserRoles(user.userId);
    const hasPermission = userRoles.some(role =>
      requiredPermissions.every(perm => role.permissions[perm])
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

**Test Cases**:
```typescript
// Integration tests
describe('Auth Middleware', () => {
  it('should allow request with valid token', async () => {
    const token = await generateValidToken();
    const response = await request(app)
      .get('/api/memory/entities')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });

  it('should reject request without token', async () => {
    const response = await request(app).get('/api/memory/entities');
    expect(response.status).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const response = await request(app)
      .get('/api/memory/entities')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });

  it('should reject viewer role from writing', async () => {
    const viewerToken = await generateTokenForRole('viewer');
    const response = await request(app)
      .post('/api/memory/ingest')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ /* data */ });
    expect(response.status).toBe(403);
  });

  it('should allow admin role full access', async () => {
    const adminToken = await generateTokenForRole('admin');
    const response = await request(app)
      .post('/api/memory/ingest')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ /* data */ });
    expect(response.status).toBe(200);
  });
});
```

### Task 1.5: Integrate Authentication in Backend
**Agent**: Backend Engineer
**Priority**: Critical
**Estimated Time**: 3 hours

**Deliverables**:
```typescript
// apps/backend/src/index.ts - Update
import { authenticate, authorize } from './middleware/auth.js';
import { authRouter } from './services/auth/authController.js';

// Public routes (no auth required)
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/memory', authenticate, memoryRouter);
app.use('/api/srag', authenticate, sragRouter);
app.use('/api/evolution', authenticate, evolutionRouter);
app.use('/api/pal', authenticate, palRouter);

// Admin-only routes
app.use('/api/admin', authenticate, authorize(['admin']), adminRouter);
```

**Test Cases**:
- All endpoints require authentication except /api/auth/*
- Role-based access works for admin routes
- Token refresh flow works end-to-end

### Task 1.6: Frontend Login Implementation
**Agent**: Frontend Engineer
**Priority**: High
**Estimated Time**: 5 hours

**Deliverables**:
```typescript
// apps/matrix-frontend/components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
};

// apps/matrix-frontend/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Test Cases**:
```typescript
// E2E tests with Playwright
test('User can login successfully', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[placeholder="Username"]', 'testuser');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button:has-text("Login")');

  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page.locator('.user-menu')).toContainText('testuser');
});

test('Login fails with wrong password', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[placeholder="Username"]', 'testuser');
  await page.fill('input[placeholder="Password"]', 'wrongpassword');
  await page.click('button:has-text("Login")');

  await expect(page.locator('.error')).toContainText('Invalid credentials');
});
```

## 📊 Success Criteria

- [ ] All API endpoints require valid JWT token
- [ ] Role-based access control working for admin/standard/viewer
- [ ] Login form functional in matrix-frontend
- [ ] Token refresh mechanism working
- [ ] All test cases passing (unit, integration, E2E)
- [ ] Security audit completed (no JWT manipulation possible)
- [ ] Documentation updated

## 🔐 Security Checklist

- [ ] Passwords hashed with bcrypt (cost factor ≥ 10)
- [ ] JWT secrets stored in environment variables
- [ ] Tokens have appropriate expiration times
- [ ] Refresh tokens stored securely (httpOnly cookies)
- [ ] CSRF protection enabled
- [ ] Rate limiting on login endpoint
- [ ] Audit logging for authentication events

## 📝 Documentation

- [ ] API documentation updated with auth requirements
- [ ] Frontend developer guide for using AuthContext
- [ ] Admin guide for managing users and roles
- [ ] Security best practices document

## 🚀 Deployment

1. Run database migrations for auth tables
2. Seed default roles
3. Create initial admin user
4. Update environment variables with JWT secrets
5. Deploy backend with authentication middleware
6. Deploy frontend with login flow
7. Test authentication end-to-end in staging
8. Monitor logs for authentication failures

## 📞 Agent Coordination

**Backend Architect** → Design complete → **Backend Engineer** starts implementation
**Backend Engineer** → API ready → **Frontend Engineer** integrates
**QA Engineer** → Runs all test suites
**Security Expert** → Performs security audit
**DevOps** → Sets up secrets management and deployment

---

**Next Phase**: Phase 2 - PostgreSQL Migration
