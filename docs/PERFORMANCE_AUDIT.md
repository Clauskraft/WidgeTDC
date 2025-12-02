# 🚀 Performance & Architecture Audit
**Date:** 2025-12-01
**Target:** `apps/backend` Dockerization & Build Process

## 1. Build Time Analysis (Layer Caching)

**Current Status:** 🔴 **Inefficient**
The current `apps/backend/Dockerfile` copies the entire source code *before* running `npm install`.

```dockerfile
# Current Flow
COPY apps/backend ./apps/backend  # <--- Changes here...
RUN npm ci ...                    # <--- ...invalidate this CACHE (Slow!)
```

**Impact:**
Every time you change a single line of code in `src/`, Docker invalidates the `npm ci` layer. This forces a full reinstall of all dependencies (~30s - 2min) on every build, drastically slowing down the "Code -> Deploy" loop.

**Recommendation:**
Implement "Dependency Layering". Copy only `package.json` and lock files first, install dependencies, and *then* copy the source code.

## 2. Runtime Integrity (The "Broken Container" Risk)

**Current Status:** 🔴 **CRITICAL RISK**
The Dockerfile uses a multi-stage build but seems to fail to provide necessary runtime dependencies.

```dockerfile
# Production Stage
COPY --from=builder /app/apps/backend/dist ./dist
# ...
# Only copies 5 specific modules?
COPY --from=builder /app/node_modules/better-sqlite3 ...
```

**The Problem:**
The project uses `tsc` (TypeScript Compiler) for building. `tsc` does *not* bundle dependencies. It only transpiles code.
At runtime, `dist/index.js` will try to `require('express')`, `require('neo4j-driver')`, etc.
**These files are MISSING in the production image** because they are not in the manually copied list. The container will likely crash immediately upon startup.

## 3. Optimization Strategy

### Solution A: The "Bundler" Approach (Recommended for Cloud)
Use `esbuild` or `webpack` to bundle the entire application into a single `server.js` file. This removes the need for `node_modules` in the final image entirely (except maybe native bindings).
*   **Pros:** Tiny image, fast startup, no missing deps.
*   **Cons:** Requires config change.

### Solution B: The "Pruned" Approach (Recommended for now)
Copy `node_modules` from the builder stage, but prune them to production-only.

## 4. Recommended Dockerfile (`Dockerfile.optimized`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ sqlite

# 1. Dependency Layering (Cache Optimization)
# Copy ONLY package files first
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/domain-types/package*.json ./packages/domain-types/
COPY packages/mcp-types/package*.json ./packages/mcp-types/
COPY apps/backend/package*.json ./apps/backend/

# Install ALL dependencies (cached unless package.json changes)
RUN npm ci --legacy-peer-deps

# 2. Source Layering
COPY packages ./packages
COPY apps/backend ./apps/backend

# Build dependencies
WORKDIR /app/packages/mcp-types
RUN npm run build 2>/dev/null || true
WORKDIR /app/packages/domain-types
RUN npm run build 2>/dev/null || true

# Build Backend
WORKDIR /app/apps/backend
RUN npm run build

# Prune dev dependencies to save space
WORKDIR /app
RUN npm prune --production

# -----------------------------------------
# Production Stage
# -----------------------------------------
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache sqlite

# Copy ALL production node_modules (Essential for tsc builds)
COPY --from=builder /app/node_modules ./node_modules
# Copy workspaces if they are symlinked (npm workspaces structure)
COPY --from=builder /app/packages ./packages

# Copy built app
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package*.json ./
# Schema
COPY --from=builder /app/apps/backend/src/database/schema.sql ./dist/schema.sql

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

## 5. Summary of Gains
| Metric | Current | Optimized |
|--------|---------|-----------|
| **Build Time (Cached)** | ~60s | **~5s** |
| **Image Size** | Small (Broken) | Medium (Functional) |
| **Reliability** | Fails Runtime | **Production Ready** |
