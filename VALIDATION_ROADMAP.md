# ARCHITECTURE VALIDATION & REAL DATA INTEGRATION ROADMAP

**Created**: 2025-11-23  
**Status**: In Progress  
**Goal**: Ensure all widgets have correct data foundation with real (not mock) data

---

## 🎯 CRITICAL FINDINGS

### ✅ Completed
1. **WebSocket Infrastructure**: Minimal backend running with WebSocket support
2. **Frontend Service Layer**: AgentService, SecurityOverwatchService, FeedIngestionService created
3. **Widget Refactoring**: All security widgets use service pattern (no direct fetch)

### ⚠️ Issues Identified

#### 1. **Database Initialization Pattern**
**Problem**: `getDatabase()` is async but repositories use it synchronously
**Impact**: Backend cannot start - all repositories fail
**Solution**: Implemented singleton pattern with `initializeDatabase()` first
**Status**: Fixed in `database/index.ts` and `index.ts`

#### 2. **Mock Data Usage**
**Problem**: `index-minimal.ts` uses hardcoded agent data
**Impact**: Not production-ready, violates "real data" requirement
**Solution**: Must integrate with actual YML registry or real agent tracking

#### 3. **VectorDB Missing**
**Problem**: RAG_ARCHITECTURE.md specifies VectorDB (Pinecone/Weaviate) but none implemented
**Impact**: No semantic search, no RAG capabilities
**Solution**: Implement memory embedding pipeline as per architecture

#### 4. **Data Pipeline Not Active**
**Problem**: No active ingestion from real sources
**Impact**: Widgets show empty or stale data
**Solution**: Implement scrapers/adapters per ARCHITECTURE.md Section 5

---

## 📊 WIDGET-BY-WIDGET DATA VALIDATION

### Agent Monitor Widget
- ✅ Service: `AgentService`
- ❌ Data Source: Mock array (not reading `/agents/registry.yml`)
- **Action Required**: Read actual YAML registry, track real agent status

### Activity Stream Widget  
- ✅ Service: `SecurityOverwatchService`
- ❌ Data Source: No backend endpoint implemented
- **Action Required**: Implement `/api/security/activities` with SSE

### Feed Ingestion Widget
- ✅ Service: `FeedIngestionService`
- ❌ Data Source: Backend returns stub data
- **Action Required**: Implement real feed ingestion from external APIs

### Search Interface Widget
- ✅ Service: `SecurityOverwatchService.searchSecurity()`
- ❌ Data Source: No OpenSearch/Elasticsearch backend
- **Action Required**: Setup OpenSearch client or fallback SQLite FTS

### Kanban Widget
- ⚠️ Backend: Should use `memory_entities` table
- ❌ Integration: No service layer
- **Action Required**: Create MemoryService, connect to DB

---

## 🔧 IMPLEMENTATION PRIORITIES

### Phase 1: Database Foundation (CRITICAL)
**Priority**: P0  
**Time**: 2-4 hours

1. ✅ Fix async/sync pattern in database
2. ⏳ Test database initialization in backend
3. ⏳ Seed initial data from schema.sql
4. ⏳ Verify all repositories can query successfully

### Phase 2: Real Agent Data (HIGH)
**Priority**: P1  
**Time**: 1-2 hours

1. ⏳ Fix `AgentOrchestratorServer` to read `/agents/registry.yml`
2. ⏳ Remove mock data from `index-minimal.ts`
3. ⏳ Integrate with actual agent workflow triggers
4. ⏳ Test WebSocket broadcasts with real status changes

### Phase 3: Security Data Sources (HIGH)
**Priority**: P1  
**Time**: 3-4 hours

1. ⏳ Implement OpenSearch client in `securityRepository.ts`
2. ⏳ Create activity stream SSE endpoint
3. ⏳ Implement feed scraper for real RSS/API sources
4. ⏳ Connect SearchInterface to real search backend

### Phase 4: Memory/RAG Foundation (MEDIUM)
**Priority**: P2  
**Time**: 4-6 hours

1. ⏳ Setup VectorDB (choose: Qdrant local OR Pinecone cloud)
2. ⏳ Implement embedding pipeline (text → vector)
3. ⏳ Create memory ingestion API
4. ⏳ Connect Kanban to `memory_entities` table

### Phase 5: Data Pipeline Automation (MEDIUM)
**Priority**: P2  
**Time**: 2-3 hours

1. ⏳ Implement scraper framework from `utils/scraper.ts`
2. ⏳ Create adapters for external APIs
3. ⏳ Setup cron jobs for periodic ingestion
4. ⏳ Implement cache-first fallback strategy

---

## 🧪 VERIFICATION CHECKLIST

### For Each Widget:
- [ ] Has dedicated service class
- [ ] Service calls real backend endpoint  
- [ ] Backend endpoint reads from database/external API
- [ ] Data persists across restarts
- [ ] Fallback mechanism for unavailable sources
- [ ] No mock/hardcoded data in production code

### System-Level:
- [ ] Database initializes successfully
- [ ] WebSocket broadcasts real events
- [ ] MCP routing works for all tools
- [ ] Vector search returns relevant results
- [ ] All scrapers run without errors
- [ ] Health endpoint shows components status

---

## 🚀 NEXT IMMEDIATE ACTIONS

**Right Now** (Next 30 minutes):
1. Test backend startup with fixed database
2. Verify AgentMonitorWidget loads in frontend
3. Confirm WebSocket connection established
4. Document any remaining errors

**Today** (Next 2-4 hours):
1. Remove mock data from agent backend
2. Read actual `registry.yml` file
3. Implement at least 1 real data source (agents or security)
4. End-to-end test with real data flow

**This Week**:
1. Complete Phase 1-3 above
2. Setup VectorDB (local Qdrant recommended for dev)
3. Implement 2-3 scrapers for external APIs
4. Full system integration test

---

## 📝 DECISION LOG

**2025-11-23 19:56 - Minimal Backend Choice**
- Created `index-minimal.ts` to bypass repository issues
- Temporary: Uses mock agent array
- **Decision**: This is OK for immediate WebSocket testing
- **Action Required**: Replace with real YAML reading within 24h

**2025-11-23 19:30 - Database Pattern Refactor**
- Changed from async Promise to sync singleton
- **Rationale**: Repositories need sync access at construction
- **Risk**: Must call `initializeDatabase()` before any import
- **Mitigation**: Explicit startup sequence in `index.ts`

---

**Maintained by**: Antigravity Agent  
**Last Updated**: 2025-11-23 19:56:00 UTC  
**Review Frequency**: After each phase completion
