# 🚀 PHASE 2 PLAN – ADVANCED INTELLIGENCE

**Duration:** 4-5 weeks (Dec 2025)  
**Owner:** Autonomous MCP Team  
**Status:** 🟡 In Progress

---

## 🎯 Objectives
1. **Unified GraphRAG** – multi-hop reasoning across CMA + SRAG + PAL + ProjectMemory.
2. **Role-Based Agent Teams** – specialized agents coordinating via AutonomousTaskEngine.
3. **StateGraphRouter** – LangGraph-inspired orchestration of decision states.
4. **PatternEvolutionEngine** – evolutionary strategy engine with creative exploration.

---

## 🗂️ Work Breakdown

### Week 5-6 – GraphRAG + Agent Teams
| Task | Description | Owner |
| --- | --- | --- |
| Schema Design | Define graph schema (entities, relations, embeddings) | Memory Team |
| Graph Indexer | Build ingestion pipeline → `GraphIndexer` service | Memory Team |
| Reasoning Engine | Implement `UnifiedGraphRAG.ts` (multi-hop search, beam width config) | Intelligence Team |
| Agent Roles | Define `Strategist`, `Researcher`, `Guardian`, `Synthesizer` roles | Task Engine Team |
| Task Routing | Extend `AutonomousTaskEngine` to assign roles per task intent | Task Engine Team |

### Week 7-8 – State Router + Pattern Evolution
| Task | Description | Owner |
| --- | --- | --- |
| StateGraphRouter | Represent decision flow as nodes/edges with guard conditions | Orchestration |
| Memory Hooks | Each node can read/write UnifiedMemory snapshots | Memory Team |
| PatternEvolutionEngine | Genetic-like mutation of strategies, fitness via KPIs | Intelligence Team |
| Feedback Loop | Integrate PAL emotional signals into evolution fitness | PAL Team |

---

## 🔧 Technical Plan
- **Graph Storage:** Reuse SQLite (FTS + adjacency tables) for dev, abstract interface for Neo4j/Postgres later.
- **Embeddings:** Use existing SRAG embeddings; add relationship embeddings via averaged vectors.
- **Multi-Hop Search:** BFS + heuristic scoring, plus optional `maxDepth`, `beamWidth` config.
- **Agent Roles:** YAML definition in `config/agentRoles.yml` + runtime loader.
- **StateGraphRouter:** JSON/TS definition of nodes, each node points to handler + success/fail transitions.
- **Pattern Evolution:** Maintain population of strategies; evaluation uses telemetry + PAL signals; store in `pattern_strategies` table.

---

## ✅ Deliverables
1. `apps/backend/src/mcp/cognitive/UnifiedGraphRAG.ts`
2. `apps/backend/src/mcp/cognitive/StateGraphRouter.ts`
3. `apps/backend/src/mcp/cognitive/PatternEvolutionEngine.ts`
4. Updates to `AutonomousTaskEngine.ts` for role assignments
5. Config docs: `docs/PHASE_2_GUIDE.md`

---

## 📅 Milestones
| Date | Milestone |
| --- | --- |
| Week 5 end | Graph schema + GraphRAG prototype |
| Week 6 end | Role-based agents live in TaskEngine |
| Week 7 end | StateGraphRouter orchestrating decisions |
| Week 8 end | PatternEvolutionEngine generating new strategies |

---

## 🚨 Risks & Mitigations
- **Graph Complexity** – enforce depth/beam limits; fallback to classical SRAG if query too broad.
- **Agent Conflicts** – Guardian role monitors conflicting outputs.
- **Performance** – nightly batch evaluations for PatternEvolution to avoid runtime spikes.

---

## 📢 Next Actions
1. Build graph schema + ingestion helpers.  
2. Scaffold `UnifiedGraphRAG.ts`.  
3. Define role templates + update TaskEngine.  
4. Design StateGraphRouter JSON schema.

