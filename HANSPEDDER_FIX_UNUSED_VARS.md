# feat: hANSPEDDER MISSION: Fix Unused Variable Errors

**Mission Type:** Code Quality Fix  
**Priority:** HIGH  
**Assigned To:** HansPedder + Agent Team  
**Deadline:** 10 minutes monitoring + completion  
**Status:** 🚀 ACTIVE

---

## 📋 MISSION BRIEF

Fix all unused variable errors in the codebase to prepare for deployment.

### Current Status

- **Total Linter Errors:** 289
- **Unused Variable Errors:** ~200+ (estimated)
- **Build Status:** ✅ Passing
- **Deployment Status:** ⚠️ Blocked by linter errors

---

## 🎯 OBJECTIVES

1. **Fix Unused Variables**
   - Prefix unused parameters with `_` (e.g., `_operation`, `_params`)
   - Remove unused imports
   - Remove unused variable declarations
   - Keep variables that are used in comments or future implementations

2. **Maintain Code Quality**
   - Don't break existing functionality
   - Follow TypeScript best practices
   - Keep code readable

3. **Verify Fixes**
   - Run linter after fixes
   - Ensure build still passes
   - Verify no functionality broken

---

## 📁 FILES TO FIX (Priority Order)

### High Priority (Backend Core)

1. `apps/backend/src/mcp/autonomous/MCPIntegration.ts`
   - Line 116: `operation`, `params` unused
2. `apps/backend/src/mcp/toolHandlers.ts`
   - Multiple unused `ctx`, `error`, `params` parameters

3. `apps/backend/src/mcp/autonomous/AutonomousAgent.ts`
   - Already partially fixed
   - Check for remaining issues

### Medium Priority (Services)

4. `apps/backend/src/services/**/*.ts`
   - Various unused variables

### Low Priority (Frontend)

5. `apps/widget-board/src/**/*.tsx`
   - React component unused variables
   - Will be handled separately for React errors

---

## 🔧 FIX PATTERNS

### Pattern 1: Unused Function Parameters

```typescript
// ❌ BEFORE
query: async (operation: string, params: any) => { ... }

// ✅ AFTER
query: async (_operation: string, _params: any) => { ... }
```

### Pattern 2: Unused Variables

```typescript
// ❌ BEFORE
const timestamp = Date.now();
const requestId = uuidv4();

// ✅ AFTER
// Remove if truly unused, or prefix with _ if needed for future
const _timestamp = Date.now();
const _requestId = uuidv4();
```

### Pattern 3: Unused Imports

```typescript
// ❌ BEFORE
import { QueryPattern, Database } from './types';

// ✅ AFTER
// Remove unused imports
```

---

## 📊 PROGRESS TRACKING

- [ ] Backend MCP files fixed
- [ ] Service files fixed
- [ ] Linter errors reduced to < 100
- [ ] Build verified passing
- [ ] Tests verified passing

---

## ⚠️ IMPORTANT NOTES

1. **Don't break functionality** - Only remove variables that are truly unused
2. **Keep future-proof code** - If a variable might be used soon, prefix with `_`
3. **Test after fixes** - Run linter and build after each batch
4. **Commit frequently** - Small, focused commits

---

**Mission Start:** 2025-11-24  
**Expected Completion:** 10-15 minutes  
**Status Updates:** Every 2-3 minutes
