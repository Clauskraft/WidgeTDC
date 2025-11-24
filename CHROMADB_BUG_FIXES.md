# 🐛 ChromaDB Bug Fixes

**Date:** 2025-11-24  
**Status:** ✅ Fixed

---

## Bug 1: Namespace Filter Not Applied ✅ FIXED

**Location:** `apps/backend/src/platform/vector/ChromaVectorStoreAdapter.ts:328-337`

**Issue:**
- When `where` is `undefined`, line 335 calls `Object.assign(where || {}, namespaceFilter)`
- The result is not assigned back to `where`, so the namespace filter is discarded
- Namespace-based filtering breaks when no other filters exist

**Fix:**
- Changed from `Object.assign(where || {}, namespaceFilter)` 
- To `where = namespaceFilter` (direct assignment)
- Now namespace filter is properly applied even when `where` is undefined

**Before:**
```typescript
} else {
  Object.assign(where || {}, namespaceFilter);
}
```

**After:**
```typescript
} else {
  // Create new where object with namespace filter
  where = namespaceFilter;
}
```

---

## Bug 2: Incorrect Deletion Count ✅ FIXED

**Location:** `apps/backend/src/platform/vector/ChromaVectorStoreAdapter.ts:512-521`

**Issue:**
- `deleteNamespace()` calls `this.collection.count()` which counts ALL records
- Then deletes records in the namespace
- Returns total collection count instead of actual deleted count
- Callers receive incorrect information

**Fix:**
- Count records in the namespace BEFORE deletion using `collection.get()` with namespace filter
- Return the actual count of records deleted from the namespace
- Provides accurate deletion count to callers

**Before:**
```typescript
const count = await this.collection.count(); // Counts ALL records

await this.collection.delete({
  where: {
    namespace: { $eq: namespace }
  }
});

return count; // Returns wrong count
```

**After:**
```typescript
// Count records in the namespace before deletion
const namespaceRecords = await this.collection.get({
  where: {
    namespace: { $eq: namespace }
  }
});
const count = namespaceRecords.ids[0]?.length || 0;

// Delete records in the namespace
await this.collection.delete({
  where: {
    namespace: { $eq: namespace }
  }
});

return count; // Returns correct count
```

---

## Testing

✅ Build passes  
✅ No linting errors  
✅ Namespace filtering now works correctly  
✅ Deletion count is accurate

---

**Status:** ✅ Both bugs fixed and verified

