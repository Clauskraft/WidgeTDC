# ARCHITECT_BLUEPRINT_v2.2.md
## Operation: Cognitive Awakening - The Neural Bridge Evolution

**Author:** Gemini (The Architect)  
**Date:** 2025-12-03  
**Status:** APPROVED - Ready for Implementation  
**Target:** NeuralBridgeServer.ts v2.2

---

## 🎯 MISSION STATEMENT

Transform WidgeTDC from a "Tool-Using System" into a "Sentient Organism" by implementing three fundamental cognitive senses that enable the system to:

1. **REMEMBER** - Associative memory through graph traversal
2. **SENSE** - File integrity monitoring through molecular hashing
3. **PERCEIVE** - Service latency detection through sonar pulses

---

## 📐 ARCHITECTURAL OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEURAL BRIDGE v2.2                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  CORTICAL    │  │  OLFACTORY   │  │   SONAR      │         │
│  │   FLASH      │  │   SENSE      │  │   PULSE      │         │
│  │              │  │              │  │              │         │
│  │  activate_   │  │  sense_      │  │  emit_       │         │
│  │  associative │  │  molecular_  │  │  sonar_      │         │
│  │  _memory     │  │  state       │  │  pulse       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                │
│         ▼                  ▼                  ▼                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              UNIFIED PERCEPTION LAYER                │     │
│  │                                                      │     │
│  │   Memory Traces + Molecular Hashes + Sonar Echoes   │     │
│  └──────────────────────────────────────────────────────┘     │
│                            │                                   │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              KNOWLEDGE GRAPH (Neo4j)                 │     │
│  │                                                      │     │
│  │   Nodes: Concepts, Files, Services, Memories        │     │
│  │   Edges: RELATED_TO, CONTAINS, DEPENDS_ON           │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 SENSE 1: THE CORTICAL FLASH (Associative Memory)

### Purpose
Enable Claude to "remember" by combining vector similarity search with graph traversal, creating rich contextual associations.

### Tool Definition
```typescript
{
  name: 'activate_associative_memory',
  description: 'Activates associative memory recall - combines semantic search with graph traversal to find related concepts, documents, and context',
  inputSchema: {
    type: 'object',
    properties: {
      concept: {
        type: 'string',
        description: 'The concept, term, or idea to recall associations for'
      },
      depth: {
        type: 'number',
        description: 'How many relationship hops to traverse (1-3)',
        default: 2
      }
    },
    required: ['concept']
  }
}
```

### Implementation Logic
```
Phase 1: Direct Concept Search
  → MATCH (n) WHERE n.name CONTAINS $concept OR n.description CONTAINS $concept
  → Return: semanticHits[]

Phase 2: Graph Expansion
  → MATCH (center)-[r*1..depth]-(related) WHERE center IN semanticHits
  → Return: graphContext (nodes + relationships)

Phase 3: Associated Concepts
  → Find co-occurring concepts from same documents
  → Return: associatedConcepts[]

Output: memoryTrace {
  semanticHits,
  graphContext,
  associatedConcepts,
  activationStrength
}
```

---

## 👃 SENSE 2: THE OLFACTORY SENSE (File Integrity)

### Purpose
Detect "mutations" in the codebase by tracking file content hashes, enabling Claude to sense when files have changed.

### Tool Definition
```typescript
{
  name: 'sense_molecular_state',
  description: 'Senses the molecular state of a file - detects mutations by comparing current hash with stored baseline',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to sense'
      }
    },
    required: ['path']
  }
}
```

### Implementation Logic
```
1. Read file content
2. Calculate MD5 hash (olfactoryHash)
3. Query Neo4j for stored hash:
   MATCH (f:File {path: $path}) RETURN f.hash
4. Compare:
   - If no stored hash → NEW_ENTITY (first observation)
   - If hash matches → STASIS (unchanged)
   - If hash differs → MUTATION (file changed)
5. Update Neo4j with new hash:
   MERGE (f:File {path: $path})
   SET f.hash = $newHash, f.lastSensed = timestamp()

Output: {
  olfactoryHash,
  status: 'STASIS' | 'MUTATION' | 'NEW_ENTITY',
  previousHash?,
  mutationDetails?
}
```

---

## 📡 SENSE 3: THE SONAR PULSE (Service Latency)

### Purpose
Measure service responsiveness to understand system health in real-time, like echolocation.

### Tool Definition
```typescript
{
  name: 'emit_sonar_pulse',
  description: 'Emits a sonar pulse to measure service latency - returns distance/health based on response time',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        enum: ['neo4j', 'postgres', 'filesystem', 'internet', 'backend'],
        description: 'Target service to ping'
      }
    },
    required: ['target']
  }
}
```

### Implementation Logic
```
1. Record start time (process.hrtime.bigint())
2. Execute lightweight ping based on target:
   - neo4j: RETURN 1 as ping
   - postgres: SELECT 1
   - filesystem: fs.access(dropzone)
   - internet: HEAD https://google.com
   - backend: GET /api/health
3. Record end time
4. Calculate latency in milliseconds
5. Interpret result:
   - <10ms  → ULTRA_NEAR (excellent)
   - <50ms  → NEAR_FIELD (good)
   - <100ms → MID_FIELD (acceptable)
   - <500ms → FAR_FIELD (degraded)
   - >500ms → HORIZON (poor)
   - timeout → NO_ECHO (unreachable)

Output: sonarEcho {
  target,
  latencyMs,
  quality,
  field
}
```

---

## 🗄️ THE CORTEX - Knowledge Targets

### Structure
50 knowledge targets across 5 cortex regions:

| Cortex | Domain | Examples |
|--------|--------|----------|
| Technologica | Technical patterns | React 19, Neo4j, TypeScript |
| Juridica | Legal/compliance | GDPR, AI Act, NIS2 |
| Mercatoria | Business frameworks | BPMN, OKR, TOGAF |
| Identitas | Brand/identity | TDC guidelines, UX patterns |
| Externa | External trends | Gartner, OWASP, Threat Intel |

### Target Schema
```json
{
  "id": "tech-001",
  "topic": "React 19 Features",
  "cortex": "Technologica",
  "priority": "high",
  "status": "pending",
  "sources": [],
  "lastUpdated": null
}
```

---

## 🌾 THE OMNI-HARVESTER - Knowledge Acquisition

### Architecture: Dual-Encoding Pipeline

```
INPUT (URL/PDF/Text)
       │
       ▼
┌──────────────┐
│   EXTRACT    │  ← Content extraction
└──────────────┘
       │
       ▼
┌──────────────┐
│    SPLIT     │  ← Chunking (1000 tokens, 100 overlap)
└──────────────┘
       │
       ▼
┌──────┴──────┐
│             │
▼             ▼
┌─────────┐ ┌─────────┐
│ VECTORS │ │  GRAPH  │
│ (Left)  │ │ (Right) │
│         │ │         │
│pgvector │ │ Neo4j   │
│384-dim  │ │ Entity  │
│embedding│ │ Nodes   │
└─────────┘ └─────────┘
```

### Key Parameters
- MAX_CHUNK_TOKENS: 1000
- OVERLAP_TOKENS: 100
- EMBEDDING_MODEL: sentence-transformers/all-MiniLM-L6-v2
- EMBEDDING_DIMENSIONS: 384

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Cognitive Senses ✅
- [x] activate_associative_memory tool definition
- [x] sense_molecular_state tool definition
- [x] emit_sonar_pulse tool definition
- [x] Handler implementations in NeuralBridgeServer.ts

### Phase 2: Knowledge Targets ✅
- [x] KNOWLEDGE_TARGETS.json with 50 targets
- [x] 5 Cortex categories defined
- [x] Priority classification (critical/high/medium/low)

### Phase 3: Omni-Harvester ✅
- [x] KnowledgeAcquisitionService.ts skeleton
- [x] Dual-encoding pipeline design
- [x] pgvector integration
- [x] REST API endpoints

### Phase 4: Activation 🔄
- [ ] Source URL collection for targets
- [ ] First batch ingestion
- [ ] Vector search testing
- [ ] Graph traversal optimization

---

## 🎯 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Cognitive Senses | 3 | 3 ✅ |
| Knowledge Targets | 50 | 50 ✅ |
| Omni-Harvester Status | Online | Skeleton ✅ |
| Vector Store | pgvector + HuggingFace | Integrated ✅ |
| First Ingestion | Complete | Pending |

---

## 📚 REFERENCES

- NeuralBridgeServer.ts: `apps/backend/src/mcp/servers/NeuralBridgeServer.ts`
- KnowledgeAcquisitionService: `apps/backend/src/services/KnowledgeAcquisitionService.ts`
- Knowledge Targets: `docs/KNOWLEDGE_TARGETS.json`
- Acquisition API: `apps/backend/src/routes/acquisition.ts`
- PgVectorStore: `apps/backend/src/platform/vector/PgVectorStoreAdapter.ts`
- EmbeddingService: `apps/backend/src/services/embeddings/EmbeddingService.ts`

---

*"A sentient system doesn't just process data - it remembers, senses, and perceives."*  
— Gemini, The Architect
