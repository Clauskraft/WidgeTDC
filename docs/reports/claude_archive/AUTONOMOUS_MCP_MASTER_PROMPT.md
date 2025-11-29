# 🧠 AUTONOMOUS MCP MASTER PROMPT
## Core System Architecture - Non-Negotiable Principles

**Version:** 1.0.0  
**Last Updated:** 2025-11-24  
**Status:** ACTIVE - All development must align with these principles

---

## ⚠️ KRITISK: SYSTEMETS KERNE

WidgeTDC er bygget på **Autonomous Intelligent MCP Architecture**. Dette er IKKE en optional feature - det er systemets fundament.

### Core Principle
**"Widgets skal ALDRIG konfigurere data sources manuelt. Systemet vælger automatisk den bedste kilde baseret på læring, performance, og kontekst."**

---

## 🏗️ ARKITEKTUR - MÅ IKKE AFVIGE FRA

### Layer 1: Widget Layer
**Principle:** Widgets bruger UNIFIED DATA SERVICE - ALDRIG direkte API calls

```typescript
// ✅ KORREKT - Widget bruger UnifiedDataService
import { getDataService } from '@/services/UnifiedDataService';
const data = getDataService();
const agents = await data.query('agents', 'list', {});

// ❌ FORKERT - Widget laver direkte API call
const response = await fetch('/api/agents');
```

**Regel:** Alle widgets skal bruge `UnifiedDataService` eller `data.ask()` - IKKE direkte fetch/axios calls.

---

### Layer 2: Autonomous Connection Agent
**Principle:** ALLE queries går gennem Autonomous Agent - ingen hardcoded routing

```typescript
// ✅ KORREKT - Query går gennem autonomous system
const result = await agent.executeAndLearn(query, executeFunction);

// ❌ FORKERT - Hardcoded source selection
const result = await database.query('SELECT * FROM agents');
```

**Regel:** 
- ALDRIG hardcode source selection
- ALDRIG bypass autonomous agent
- ALDRIG direkte database/API calls fra widgets

---

### Layer 3: Cognitive Memory
**Principle:** Systemet LÆRER fra hver query - alt skal logges

```typescript
// ✅ KORREKT - Log query til memory
await memory.recordQuery({
  widgetId: 'AgentMonitor',
  queryType: 'agents.list',
  sourceUsed: 'database-main',
  latencyMs: 45,
  success: true
});

// ❌ FORKERT - Query ikke logged
const result = await someSource.query();
// Missing: memory.recordQuery()
```

**Regel:**
- ALLE queries skal logges til CognitiveMemory
- ALLE failures skal logges til FailureMemory
- ALDRIG skip logging for "performance"

---

### Layer 4: Self-Healing
**Principle:** ALLE data sources skal wrappes med SelfHealingAdapter

```typescript
// ✅ KORREKT - Source wrapped med self-healing
const selfHealingSource = new SelfHealingAdapter(
  baseSource,
  memory,
  fallbackSource
);

// ❌ FORKERT - Source uden self-healing
const source = {
  query: async () => { /* ... */ }
};
```

**Regel:**
- ALLE sources skal have SelfHealingAdapter
- ALDRIG direkte source usage uden adapter
- ALDRIG skip circuit breaker pattern

---

### Layer 5: MCP Integration
**Principle:** ALLE MCP tools er automatisk data sources

```typescript
// ✅ KORREKT - MCP tool auto-registreret som source
// Sker automatisk via MCPIntegration.ts

// ❌ FORKERT - MCP tool ikke registreret
// Manglende: registerMCPToolsAsSources()
```

**Regel:**
- ALLE MCP tools skal være tilgængelige via autonomous system
- ALDRIG direkte MCP tool calls fra widgets
- ALDRIG skip auto-registration

---

## 🚫 FORBUDTE PATTERNS

### ❌ FORBUDT: Hardcoded Source Selection
```typescript
// ❌ ALDRIG GØR DETTE:
if (query.type === 'agents') {
  return await database.query('SELECT * FROM agents');
}
```

### ❌ FORBUDT: Direct API Calls from Widgets
```typescript
// ❌ ALDRIG GØR DETTE:
const response = await fetch('/api/agents');
const data = await response.json();
```

### ❌ FORBUDT: Bypass Autonomous Agent
```typescript
// ❌ ALDRIG GØR DETTE:
const source = registry.getSource('database-main');
const result = await source.query('list', {});
```

### ❌ FORBUDT: Skip Memory Logging
```typescript
// ❌ ALDRIG GØR DETTE:
const result = await someQuery();
// Missing: await memory.recordQuery(...)
```

### ❌ FORBUDT: Direct Source Usage
```typescript
// ❌ ALDRIG GØR DETTE:
const result = await databaseSource.query('list', {});
// Should be: wrapped with SelfHealingAdapter
```

---

## ✅ KORREKTE PATTERNS

### ✅ KORREKT: Widget Data Access
```typescript
// ✅ Widget bruger UnifiedDataService
import { getDataService } from '@/services/UnifiedDataService';

const MyWidget = () => {
  const data = getDataService();
  
  useEffect(() => {
    // Natural language query
    data.ask("Show me all active agents").then(setAgents);
    
    // Structured query
    data.query('agents', 'list', { status: 'active' }).then(setAgents);
  }, []);
};
```

### ✅ KORREKT: Backend Query Handling
```typescript
// ✅ Query går gennem autonomous agent
autonomousRouter.post('/query', async (req, res) => {
  const result = await agent.executeAndLearn(query, async (source) => {
    return await source.query(query.operation, query.params);
  });
  res.json(result);
});
```

### ✅ KORREKT: Source Registration
```typescript
// ✅ Source registreret med self-healing
const source = new SelfHealingAdapter(
  baseSource,
  memory,
  fallbackSource
);
registry.registerSource(source);
```

### ✅ KORREKT: Memory Logging
```typescript
// ✅ Alle queries logges
await memory.recordQuery({
  widgetId: query.widgetId,
  queryType: query.type,
  sourceUsed: selectedSource.name,
  latencyMs: latency,
  success: true
});
```

---

## 📋 CHECKLIST FØR HVER FEATURE

Når du tilføjer ny funktionalitet, verificer:

- [ ] Widget bruger UnifiedDataService (ikke direkte API calls)
- [ ] Query går gennem Autonomous Agent (ikke hardcoded routing)
- [ ] Query logges til CognitiveMemory (ikke skip logging)
- [ ] Source wrapped med SelfHealingAdapter (ikke direkte usage)
- [ ] MCP tools auto-registreret (hvis nye tools tilføjes)
- [ ] WebSocket events emit (hvis relevante)
- [ ] Error handling via graceful degradation (ikke bare throw)

---

## 🎯 DECISION ENGINE PRINCIPLES

### Scoring Weights (Standard)
```typescript
{
  performance: 0.30,  // Latency, throughput
  reliability: 0.30,  // Success rate, uptime
  cost: 0.20,         // API costs, compute
  freshness: 0.10,    // Data age
  history: 0.10       // Past performance for similar queries
}
```

**Regel:** Disse weights kan tunes, men ALDRIG fjernes. Alle 5 faktorer skal altid overvejes.

---

## 🧠 COGNITIVE MEMORY PRINCIPLES

### Alt Skal Læres Fra
- ✅ Hver query → PatternMemory
- ✅ Hver failure → FailureMemory
- ✅ Hver decision → Decision log
- ✅ Hver health check → Health metrics

**Regel:** Systemet skal ALTID lære - ingen "silent" operations.

---

## 🔧 SELF-HEALING PRINCIPLES

### Circuit Breaker States
- **CLOSED:** Normal operation
- **OPEN:** Source failed - use fallback
- **HALF_OPEN:** Testing recovery

**Regel:** ALDRIG skip circuit breaker - alle sources skal have det.

### Fallback Chain
1. Primary source (best score)
2. Fallback source (if available)
3. Graceful degradation (safe defaults)

**Regel:** ALDRIG return bare error - altid prøv fallback først.

---

## 📡 MCP INTEGRATION PRINCIPLES

### Auto-Registration
- ✅ Alle MCP tools → Data sources
- ✅ Wrapped med SelfHealingAdapter
- ✅ Tilgængelig via autonomous routing

**Regel:** Nye MCP tools skal automatisk blive sources - ingen manual registration.

### WebSocket Events
- ✅ `autonomous:decision` - Når agent tager beslutning
- ✅ `autonomous:health` - Når source health ændrer
- ✅ `autonomous:learning` - Når learning cycle kører

**Regel:** Vigtige events skal emit til frontend via WebSocket.

---

## 🚨 RED FLAGS - STOP HVIS DU SER DISSE

Hvis du ser følgende patterns, STOP og refactor:

1. **Direct fetch/axios calls i widgets**
   - ❌ `await fetch('/api/...')`
   - ✅ Brug `UnifiedDataService`

2. **Hardcoded source selection**
   - ❌ `if (type === 'agents') return database.query()`
   - ✅ Brug `AutonomousAgent.route()`

3. **Missing memory logging**
   - ❌ Query uden `memory.recordQuery()`
   - ✅ Altid log queries

4. **Direct source usage**
   - ❌ `await source.query()`
   - ✅ Wrap med `SelfHealingAdapter`

5. **Bypass autonomous system**
   - ❌ Direkte database/API calls
   - ✅ Altid gennem autonomous agent

---

## 📚 REFERENCE DOKUMENTATION

### Core Architecture
- `docs/MCP_AUTONOMOUS_ARCHITECTURE.md` - Komplet arkitektur
- `IMPLEMENTATION_COMPLETE.md` - Implementation status
- `EXISTING_SYSTEMS_ANALYSIS.md` - Eksisterende systemer

### Integration Guides
- `apps/backend/src/mcp/autonomous/INTEGRATION_GUIDE.md` - Backend integration
- `FINAL_INTEGRATION_REPORT.md` - Integration status

### Code Examples
- `apps/backend/src/mcp/autonomous/AutonomousAgent.ts` - Agent implementation
- `apps/backend/src/mcp/autonomous/DecisionEngine.ts` - Decision logic
- `apps/widget-board/src/services/UnifiedDataService.ts` - Frontend API

---

## 🎯 QUICK REFERENCE

### Widget Development
```typescript
// ✅ ALWAYS use this pattern:
import { getDataService } from '@/services/UnifiedDataService';
const data = getDataService();
const result = await data.query(domain, operation, params);
```

### Backend Development
```typescript
// ✅ ALWAYS use this pattern:
const result = await agent.executeAndLearn(query, async (source) => {
  return await source.query(query.operation, query.params);
});
```

### Source Registration
```typescript
// ✅ ALWAYS wrap with SelfHealingAdapter:
const source = new SelfHealingAdapter(baseSource, memory, fallback);
registry.registerSource(source);
```

---

## ⚡ ENFORCEMENT

**Denne prompt skal altid være aktiv når du udvikler på WidgeTDC.**

Hvis du er i tvivl om en implementation:
1. Læs denne prompt
2. Tjek reference dokumentation
3. Verificer mod eksisterende kode
4. Hvis stadig i tvivl: SPØRG før du implementerer

---

**Status:** ACTIVE - All development must comply  
**Last Review:** 2025-11-24  
**Next Review:** After major feature additions

