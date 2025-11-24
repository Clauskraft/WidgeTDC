# Railway Deployment Fix - Zustand Import Resolution

## Problem
Railway deployment was failing with:
```
[vite]: Rollup failed to resolve import "zustand" from "/app/apps/widget-board/components/widgetStore.ts".
```

## Root Cause
The Dockerfile was copying only the root `package.json` before running `npm ci`, which meant npm workspaces couldn't properly resolve workspace dependencies like `zustand` that are declared in `apps/widget-board/package.json`.

## Solution
Updated the Dockerfile to copy workspace `package.json` files **before** running `npm ci`:

```dockerfile
# Copy package files (root first)
COPY package*.json ./

# Copy workspace package.json files to ensure npm ci installs workspace dependencies
COPY apps/widget-board/package.json ./apps/widget-board/package.json
COPY packages/shared/mcp-types/package.json ./packages/shared/mcp-types/package.json
COPY packages/shared/domain-types/package.json ./packages/shared/domain-types/package.json

# Install dependencies (this will install workspace dependencies)
RUN npm ci --legacy-peer-deps
```

This ensures that:
1. npm workspaces can properly resolve workspace dependencies
2. `zustand` (and other workspace dependencies) are available during the build
3. Vite/Rollup can resolve imports correctly

## Verification
After this fix, Railway deployments should:
- ✅ Successfully install all workspace dependencies
- ✅ Resolve `zustand` import during Vite build
- ✅ Complete the build process successfully

## Status
✅ **FIXED** - Dockerfile updated and committed

