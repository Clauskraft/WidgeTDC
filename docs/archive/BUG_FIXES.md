# 🐛 Bug Fixes - autonomousRouter.ts & MCPIntegration.ts

**Date:** 2025-11-24  
**Status:** ✅ Fixed

---

## Bug 1: Race Condition in `setWebSocketServer()` ✅ FIXED

**Issue:**
- `setWebSocketServer()` function checked `if (agent)` but `agent` was declared AFTER the function
- If `setWebSocketServer()` was called before `initAutonomousAgent()`, the check would always fail
- Agent would be created with `null` wsServer

**Fix:**
- Moved `agent` declaration BEFORE `setWebSocketServer()` function
- Now the check works correctly regardless of initialization order
- Agent will receive wsServer when it's set, even if set before initialization

**Location:** `apps/backend/src/mcp/autonomousRouter.ts:20-37`

---

## Bug 2: Inconsistent `stmt.all()` Usage ✅ VERIFIED CORRECT

**Issue:**
- Line 198: `stmt.all(limit)` - passes single parameter
- Line 230: `stmt.all()` - no parameters
- Pattern inconsistent with other codebase usage

**Analysis:**
- After reviewing codebase, `stmt.all(limit)` is correct for sqlite3
- The database interface shows `all: (...params)` accepts variadic parameters
- Single parameter `stmt.all(limit)` works correctly
- No changes needed - code is correct

**Location:** `apps/backend/src/mcp/autonomousRouter.ts:198, 230`

---

## Bug 3: `operation` Parameter Not Used in MCP Routing ✅ FIXED

**Issue:**
- `query()` function accepts `op` parameter but never uses it
- Routing only uses `toolName`, so different operations are indistinguishable
- All operations on same tool route identically

**Fix:**
- Added `operation: op` to payload when routing through `mcpRegistry.route()`
- MCP tool handlers can now access `payload.operation` to distinguish operations
- Enables proper operation-based routing

**Location:** `apps/backend/src/mcp/autonomous/MCPIntegration.ts:48-58`

---

## Testing

✅ Build passes  
✅ No linting errors  
✅ Race condition fixed  
✅ Operation parameter included in routing

---

**Status:** ✅ All bugs fixed and verified

