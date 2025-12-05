# MCP-COGNITIVE SYSTEM INTEGRATION ARCHITECTURE
## Binding the New Intelligence to Existing Platform

**Dato:** 2025-11-24  
**Formål:** Konkret mapping mellem Master Plan og eksisterende MCP kerne

---

## 🏗️ EKSISTERENDE MCP ARKITEKTUR

### Current System Components

```
Frontend (Widget Board)
├── widgets/              (36 widgets)
│   └── UnifiedDataService.ts  (existing)
│
Backend (MCP Core)
├── /api/mcp/route       (mcpRouter.ts)
├── /api/mcp/autonomous  (autonomousRouter.ts - HansPedder)
├── toolHandlers.ts      (CMA, SRAG, PAL, Evolution, Notes handlers)
├── SourceRegistry.ts    (DataSource management)
├── EventBus.ts          (System-wide events)
│
Services Layer
├── memory/              (CMA - MemoryRepository)
├── srag/                (SRAGRepository)
├── evolution/           (EvolutionRepository)
├── pal/                 (PALRepository)
├── project/             (ProjectMemory)
│
Intelligence Layer (Current)
├── AutonomousAgent.ts
├── CognitiveMemory.ts
├── PatternMemory.ts
├── FailureMemory.ts
```

### Current Data Flow

```
Widget Request
   ↓
UnifiedDataService (frontend)
   ↓
POST /api/mcp/route
   ↓
mcpRouter.ts → mcpRegistry.route(MCPMessage)
   ↓
toolHandlers[tool](payload, context)
   ↓
Repository (CMA/SRAG/PAL/Evolution)
   ↓
SQLite Database
   ↓
Response → Widget
```

---

## 🔗 INTEGRATION POINTS: NEW COGNITIVE SYSTEM

### Phase 1 Integration: Foundation Layer

#### 1.1 UnifiedMemorySystem → Existing Repositories

**File:** `apps/backend/src/mcp/cognitive/UnifiedMemorySystem.ts`

```typescript
import { CognitiveMemory } from '../memory/CognitiveMemory.js';
import { MemoryRepository } from '../../services/memory/memoryRepository.js';
import { SragRepository } from '../../services/srag/sragRepository.js';
import { PalRepository } from '../../services/pal/palRepository.js';
import { EvolutionRepository } from '../../services/evolution/evolutionRepository.js';
import { ProjectMemory } from '../../services/project/ProjectMemory.js';

/**
 * INTEGRATION POINT 1: Unified Memory Bridge
 * Connects new 4-memory architecture to existing repositories
 */
export class UnifiedMemorySystem {
  // EXISTING COMPONENTS (reuse)
  private cognitiveMemory: CognitiveMemory;         // Pattern + Failure memory
  private memoryRepo: MemoryRepository;              // CMA (semantic memory)
  private sragRepo: SragRepository;                  // SRAG (document memory)
  private palRepo: PalRepository;                    // PAL (emotional context)
  private evolutionRepo: EvolutionRepository;        // Evolution (learning)
  private projectMemory: ProjectMemory;              // Episodic memory
  
  // NEW COMPONENTS (Phase 1)
  private workingMemory: Map<string, WorkingMemoryState>;  // Current context
  private proceduralMemory: ProductionRuleEngine;           // Pattern → Action rules
  
  constructor() {
    // Connect to existing singletons
    this.cognitiveMemory = getCognitiveMemory();
    this.memoryRepo = new MemoryRepository();
    this.sragRepo = new SragRepository();
    this.palRepo = new PalRepository();
    this.evolutionRepo = new EvolutionRepository();
    this.projectMemory = new ProjectMemory();
    
    // Initialize new components
    this.workingMemory = new Map();
    this.proceduralMemory = new ProductionRuleEngine(this.cognitiveMemory);
  }
  
  /**
   * INTEGRATION: Holographic pattern correlation
   * Uses EXISTING repositories to find cross-system patterns
   */
  async findHolographicPatterns(ctx: McpContext): Promise<CrossSystemPattern[]> {
    // Query ALL existing systems
    const [palState, cmaEntities, sragDocs, evolutionLearning, cognitivePatterns] = 
      await Promise.all([
        this.palRepo.getRecentEvents(ctx.userId, ctx.orgId, 50),
        this.memoryRepo.searchEntities({
          userId: ctx.userId,
          orgId: ctx.orgId,
          keywords: [],
          limit: 50
        }),
        this.sragRepo.searchDocuments(ctx.orgId, ''), // All recent
        this.evolutionRepo.getRecentGenerations(10),
        this.cognitiveMemory.findSimilarQueries('holographic_scan', 10)
      ]);
    
    // Cross-correlate for patterns
    return this.correlateAcrossSystems({
      emotional: this.analyzePALPatterns(palState),
      knowledge: this.analyzeCMAGraph(cmaEntities),
      documents: this.analyzeSRAGContent(sragDocs),
      learning: this.analyzeEvolutionTrends(evolutionLearning),
      meta: cognitivePatterns
    });
  }
  
  /**
   * INTEGRATION: Query routing with memory context
   * Enhances EXISTING mcpRouter with memory-aware decisions
   */
  async enrichMCPRequest(message: MCPMessage, ctx: McpContext): Promise<EnrichedMCPMessage> {
    // 1. Load working memory for this context
    const workingState = this.workingMemory.get(ctx.userId) || 
      await this.initializeWorkingMemory(ctx);
    
    // 2. Get procedural rules (learned patterns → actions)
    const applicableRules = await this.proceduralMemory.findRules({
      tool: message.tool,
      context: workingState
    });
    
    // 3. Get semantic context from CMA
    const semanticContext = await this.memoryRepo.searchEntities({
      userId: ctx.userId,
      orgId: ctx.orgId,
      keywords: this.extractKeywords(message.payload),
      limit: 10
    });
    
    // 4. Get episodic context from ProjectMemory
    const episodicContext = await this.projectMemory.queryHistory({
      limit: 10,
      filterByUser: ctx.userId
    });
    
    // 5. Enrich message
    return {
      ...message,
      enrichedContext: {
        workingMemory: workingState,
        proceduraRules: applicableRules,
        semanticMemory: semanticContext,
        episodicMemory: episodicContext,
        emotionalState: await this.getEmotionalState(ctx)
      }
    };
  }
}
```

**Integration Point:** `mcpRouter.ts` modification

```typescript
// BEFORE (current):
mcpRouter.post('/route', async (req, res) => {
  const message: MCPMessage = req.body;
  const result = await mcpRegistry.route(message);
  res.json({ success: true, result });
});

// AFTER (Phase 1):
import { getUnifiedMemorySystem } from './cognitive/UnifiedMemorySystem.js';

mcpRouter.post('/route', async (req, res) => {
  const message: MCPMessage = req.body;
  const ctx: McpContext = {
    userId: req.user?.id || 'anonymous',
    orgId: req.user?.orgId || 'default',
    timestamp: new Date()
  };
  
  // NEW: Enrich with cognitive context
  const memorySystem = getUnifiedMemorySystem();
  const enrichedMessage = await memorySystem.enrichMCPRequest(message, ctx);
  
  // Route with enriched context
  const result = await mcpRegistry.route(enrichedMessage);
  
  // NEW: Update working memory with result
  await memorySystem.updateWorkingMemory(ctx, result);
  
  res.json({ success: true, result });
});
```

---

#### 1.2 Autonomous Task Engine → AutonomousAgent Integration

**File:** `apps/backend/src/mcp/cognitive/AutonomousTaskEngine.ts`

```typescript
import { AutonomousAgent } from '../autonomous/AutonomousAgent.js';
import { UnifiedMemorySystem } from './UnifiedMemorySystem.js';
import { EventBus } from '../EventBus.js';

/**
 * INTEGRATION POINT 2: Task-Driven Loop
 * Extends EXISTING AutonomousAgent with BabyAGI-style task generation
 */
export class AutonomousTaskEngine {
  private agent: AutonomousAgent;
  private memorySystem: UnifiedMemorySystem;
  private eventBus: typeof EventBus;
  private taskQueue: PriorityQueue<Task>;
  
  constructor(
    agent: AutonomousAgent,
    memorySystem: UnifiedMemorySystem
  ) {
    this.agent = agent;
    this.memorySystem = memorySystem;
    this.eventBus = EventBus;
    this.taskQueue = new PriorityQueue();
    
    // Listen to system events for task generation
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    // INTEGRATION: React to existing EventBus events
    this.eventBus.on('system:error', (error) => {
      this.taskQueue.enqueue(new DiagnosticTask(error), 100);
    });
    
    this.eventBus.on('widget:error', ({ widgetId, error }) => {
      this.taskQueue.enqueue(new WidgetFixTask(widgetId, error), 90);
    });
    
    this.eventBus.on('mcp:slow_response', ({ tool, latency }) => {
      if (latency > 5000) {
        this.taskQueue.enqueue(new PerformanceOptimizationTask(tool), 70);
      }
    });
  }
  
  /**
   * INTEGRATION: Main autonomous loop
   * Uses EXISTING AutonomousAgent.executeAndLearn but adds task generation
   */
  async autonomousLoop() {
    while (this.isActive) {
      const task = this.taskQueue.dequeue();
      if (!task) {
        await this.sleep(1000);
        continue;
      }
      
      // Execute using EXISTING AutonomousAgent
      const intent = this.taskToQueryIntent(task);
      const result = await this.agent.executeAndLearn(intent);
      
      // Generate new tasks based on result (NEW)
      const newTasks = await this.generateTasksFromResult(task, result);
      this.taskQueue.enqueueAll(newTasks);
      
      // Reprioritize with emotional awareness (NEW)
      await this.emotionAwarePrioritization();
      
      // Log to episodic memory (INTEGRATION)
      await this.memorySystem.logEpisode({
        task,
        result,
        newTasksGenerated: newTasks.length
      });
    }
  }
}
```

**Integration Point:** `hansPedder.ts` modification

```typescript
// apps/backend/src/orchestrator/hansPedder.ts

import { AutonomousTaskEngine } from '../mcp/cognitive/AutonomousTaskEngine.js';
import { getUnifiedMemorySystem } from '../mcp/cognitive/UnifiedMemorySystem.js';

export async function startHansPedder() {
  const cognitive = getCognitiveMemory();
  const sourceReg = getSourceRegistry();
  const memorySystem = getUnifiedMemorySystem();
  
  // EXISTING AutonomousAgent
  hansPedder = new AutonomousAgent(cognitive, sourceReg);
  
  // NEW: Task engine wraps agent
  const taskEngine = new AutonomousTaskEngine(hansPedder, memorySystem);
  
  console.info('🚀 Starting HansPedder with Autonomous Task Engine...');
  hansPedderStatus.active = true;
  hansPedderStatus startedAt = new Date();
  
  // Start task-driven loop (NEW) instead of basic learning loop
  await taskEngine.autonomousLoop();
}
```

---

#### 1.3 Emotion-Aware Decisions → PAL Integration

**File:** `apps/backend/src/mcp/cognitive/EmotionAwareDecisionEngine.ts`

```typescript
import { PalRepository } from '../../services/pal/palRepository.js';
import { AutonomousAgent } from '../autonomous/AutonomousAgent.js';

/**
 * INTEGRATION POINT 3: Emotion-Aware Routing
 * Connects PAL emotional state to decision-making
 */
export class EmotionAwareDecisionEngine {
  private palRepo: PalRepository;
  private agent: AutonomousAgent;
  
  constructor(agent: AutonomousAgent) {
    this.agent = agent;
    this.palRepo = new PalRepository();
  }
  
  /**
   * INTEGRATION: Enhance EXISTING AutonomousAgent.selectSource
   * with emotional context
   */
  async makeEmotionAwareDecision(
    intent: QueryIntent,
    ctx: McpContext
  ): Promise<DataSource> {
    // 1. Get EXISTING data-driven score
    const dataScore = await this.agent.scoreSource(intent);
    
    // 2. Get emotional state from EXISTING PAL
    const emotionalState = await this.getEmotionalState(ctx);
    
    // 3. Adjust scores based on emotion (NEW)
    const emotionAdjustedScores = dataScore.map(sourceScore => ({
      ...sourceScore,
      score: this.adjustForEmotion(sourceScore, emotionalState)
    }));
    
    // 4. Select best
    return emotionAdjustedScores.sort((a, b) => b.score - a.score)[0].source;
  }
  
  private async getEmotionalState(ctx: McpContext): Promise<EmotionalState> {
    // INTEGRATION: Use EXISTING PAL repository
    const recentEvents = this.palRepo.getRecentEvents(ctx.userId, ctx.orgId, 10);
    const stressDistribution = this.palRepo.getStressLevelDistribution(
      ctx.userId, 
      ctx.orgId, 
      1 // last hour
    );
    
    // Analyze stress level
    const highStressEvents = stressDistribution.filter(d => d.stress_level === 'high');
    const stressRatio = highStressEvents.length / Math.max(stressDistribution.length, 1);
    
    return {
      stress: stressRatio > 0.5 ? 'high' : stressRatio > 0.2 ? 'medium' : 'low',
      focus: this.determineFocusLevel(recentEvents),
      engagement: this.determineEngagement(recentEvents)
    };
  }
  
  private adjustForEmotion(
    sourceScore: { source: DataSource, score: number },
    emotion: EmotionalState
  ): number {
    let adjusted = sourceScore.score;
    
    // Stress-aware routing (NEW capability)
    if (emotion.stress === 'high') {
      // Prefer fast, simple sources
      if (sourceScore.source.estimatedLatency < 100) {
        adjusted *= 1.5;  // 50% boost for fast sources
      }
      if (sourceScore.source.complexity === 'low') {
        adjusted *= 1.3;  // 30% boost for simple sources
      }
      if (sourceScore.source.estimatedLatency > 1000) {
        adjusted *= 0.5;  // 50% penalty for slow sources
      }
    }
    
    // Focus-aware routing
    if (emotion.focus === 'deep') {
      // Allow complex, thorough sources
      if (sourceScore.source.depth === 'high') {
        adjusted *= 1.4;
      }
    }
    
    return adjusted;
  }
}
```

**Integration Point:** `AutonomousAgent.ts` modification

```typescript
// apps/backend/src/mcp/autonomous/AutonomousAgent.ts

import { EmotionAwareDecisionEngine } from '../cognitive/EmotionAwareDecisionEngine.js';

export class AutonomousAgent {
  private emotionEngine: EmotionAwareDecisionEngine;
  
  constructor(cognitive: CognitiveMemory, registry: SourceRegistryImpl) {
    // ... existing code ...
    
    // NEW: Initialize emotion engine
    this.emotionEngine = new EmotionAwareDecisionEngine(this);
  }
  
  async executeAndLearn(intent: QueryIntent, ctx?: McpContext): Promise<any> {
    // BEFORE: const source = this.selectSource(intent);
    
    // AFTER: Use emotion-aware selection
    const source = ctx 
      ? await this.emotionEngine.makeEmotionAwareDecision(intent, ctx)
      : this.selectSource(intent);  // fallback to existing
    
    // ... rest of existing code ...
  }
}
```

---

### Phase 2 Integration: Intelligence Layer

#### 2.1 GraphRAG → CMA + SRAG Unification

**File:** `apps/backend/src/mcp/cognitive/UnifiedGraphRAG.ts`

```typescript
import { MemoryRepository } from '../../services/memory/memoryRepository.js';
import { SragRepository } from '../../services/srag/sragRepository.js';
import { HybridSearchEngine } from './HybridSearchEngine.js';

/**
 * INTEGRATION POINT 4: GraphRAG
 * Unifies EXISTING CMA (knowledge graph) + SRAG (documents)
 */
export class UnifiedGraphRAG {
  private cmaRepo: MemoryRepository;        // EXISTING semantic graph
  private sragRepo: SragRepository;         // EXISTING documents
  private hybridSearch: HybridSearchEngine; // NEW hybrid search
  
  /**
   * INTEGRATION: Multi-hop reasoning over CMA graph + SRAG docs
   */
  async query(naturalLanguageQuery: string, ctx: McpContext): Promise<GraphRAGResult> {
    // 1. Hybrid search (NEW) over EXISTING data
    const searchResults = await this.hybridSearch.search(naturalLanguageQuery, {
      userId: ctx.userId,
      orgId: ctx.orgId
    });
    
    // 2. Multi-hop graph traversal on CMA entities
    const graphEntities = searchResults.cma || [];
    const expandedGraph = await this.multiHopTraversal(graphEntities);
    
    // 3. Get related SRAG documents
    const relatedDocs = searchResults.srag || [];
    
    // 4. Synthesize unified context
    return {
      graphContext: expandedGraph,
      documentContext: relatedDocs,
      unifiedSummary: await this.synthesize(expandedGraph, relatedDocs)
    };
  }
  
  private async multiHopTraversal(
    startEntities: MemoryEntity[],
    maxHops: number = 3
  ): Promise<KnowledgeSubgraph> {
    // INTEGRATION: Use EXISTING CMA relations
    const subgraph = new KnowledgeSubgraph();
    const visited = new Set<string>();
    
    let frontier = startEntities;
    
    for (let hop = 0; hop < maxHops; hop++) {
      const nextFrontier: MemoryEntity[] = [];
      
      for (const entity of frontier) {
        if (visited.has(entity.id)) continue;
        visited.add(entity.id);
        subgraph.addNode(entity);
        
        // Get related entities via CMA relations (EXISTING)
        const relations = await this.cmaRepo.getEntityRelations(entity.id);
        for (const rel of relations) {
          const relatedEntity = await this.cmaRepo.getEntity(rel.target_entity_id);
          if (relatedEntity) {
            nextFrontier.push(relatedEntity);
            subgraph.addEdge(entity, relatedEntity, rel.relationship_type);
          }
        }
      }
      
      frontier = nextFrontier;
    }
    
    return subgraph;
  }
}
```

**Integration Point:** New MCP tool handler

```typescript
// apps/backend/src/mcp/toolHandlers.ts

import { getUnifiedGraphRAG } from './cognitive/UnifiedGraphRAG.js';

/**
 * NEW TOOL: graph_rag (Phase 2)
 * Intelligent multi-hop reasoning over unified knowledge
 */
export async function graphRAGHandler(
  payload: { query: string },
  ctx: McpContext
): Promise<any> {
  const graphRAG = getUnifiedGraphRAG();
  const result = await graphRAG.query(payload.query, ctx);
  
  return {
    graphNodes: result.graphContext.nodes.length,
    documents: result.documentContext.length,
    summary: result.unifiedSummary,
    fullContext: result
  };
}

// Register in mcpRegistry
mcpRegistry.registerTool('graph_rag', graphRAGHandler);
```

---

#### 2.2 Frontend Integration: UnifiedDataService Enhancement

**File:** `apps/matrix-frontend/src/services/UnifiedDataService.ts` (modify EXISTING)

```typescript
/**
 * INTEGRATION POINT 5: Frontend Access to Cognitive System
 * Enhances EXISTING UnifiedDataService
 */
export class UnifiedDataService {
  // EXISTING methods remain...
  
  /**
   * NEW (Phase 1): Memory-aware query
   */
  async queryWithMemory(request: {
    tool: string;
    payload: any;
    useMemoryContext?: boolean;
  }): Promise<any> {
    const message: MCPMessage = {
      id: uuidv4(),
      tool: request.tool,
      payload: request.payload,
      createdAt: new Date().toISOString(),
      // NEW: Request memory enrichment
      options: {
        enrichWithMemory: request.useMemoryContext ?? true,
        includeEmotionalContext: true
      }
    };
    
    const response = await fetch('/api/mcp/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    return response.json();
  }
  
  /**
   * NEW (Phase 2): GraphRAG query
   */
  async queryGraphRAG(naturalLanguageQuery: string): Promise<GraphRAGResult> {
    return this.queryWithMemory({
      tool: 'graph_rag',
      payload: { query: naturalLanguageQuery }
    });
  }
  
  /**
   * NEW (Phase 3): Get autonomous insights
   */
  async getAutonomousInsights(): Promise<SystemInsights> {
    return this.queryWithMemory({
      tool: 'autonomous_insights',
      payload: {}
    });
  }
}
```

---

## 📊 INTEGRATION DEPENDENCY GRAPH

```
Phase 1: Foundation (Week 1-4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UnifiedMemorySystem (NEW)
├─► CognitiveMemory (EXISTING)
├─► MemoryRepository/CMA (EXISTING)
├─► SRAGRepository (EXISTING)
├─► PALRepository (EXISTING)
├─► EvolutionRepository (EXISTING)
└─► ProjectMemory (EXISTING)

AutonomousTaskEngine (NEW)
├─► AutonomousAgent (EXISTING)
├─► UnifiedMemorySystem (NEW - Phase 1)
└─► EventBus (EXISTING)

EmotionAwareDecisionEngine (NEW)
├─► PALRepository (EXISTING)
└─► AutonomousAgent (EXISTING)

HybridSearchEngine (NEW)
├─► MemoryRepository (EXISTING)
├─► SRAGRepository (EXISTING)
└─► CognitiveMemory (EXISTING)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 2: Intelligence (Week 5-9)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UnifiedGraphRAG (NEW)
├─► MemoryRepository (EXISTING)
├─► SRAGRepository (EXISTING)
└─► HybridSearchEngine (NEW - Phase 1)

AgentTeam (NEW)
├─► AutonomousAgent (EXISTING)
└─► UnifiedMemorySystem (NEW - Phase 1)

StateGraphRouter (NEW)
├─► mcpRouter (EXISTING)
└─► ProjectMemory (EXISTING)

PatternEvolutionEngine (NEW)
├─► AutonomousAgent (EXISTING)
├─► CognitiveMemory (EXISTING)
└─► ProjectMemory (EXISTING)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 3: Meta-Cognition (Week 10-12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SelfReflectionEngine (NEW)
├─► AutonomousAgent (EXISTING)
├─► CognitiveMemory (EXISTING)
└─► ProjectMemory (EXISTING)

MetaLearningEngine (NEW)
└─► UnifiedMemorySystem (NEW - Phase 1)

RLHFAlignmentSystem (NEW)
├─► AutonomousAgent (EXISTING)
└─► ProjectMemory (EXISTING)
```

---

## 🔄 DATA FLOW: BEFORE vs AFTER

### BEFORE (Current):

```
Widget → UnifiedDataService → POST /api/mcp/route → mcpRouter
→ toolHandler → Repository → Database → Response
```

### AFTER Phase 1:

```
Widget → UnifiedDataService.queryWithMemory()
  ↓
POST /api/mcp/route (enrichment enabled)
  ↓
UnifiedMemorySystem.enrichMCPRequest()
  ├─► Working Memory (current context)
  ├─► Procedural Memory (learned rules)
  ├─► Semantic Memory (CMA)
  ├─► Episodic Memory (ProjectMemory)
  └─► Emotional Context (PAL)
  ↓
EmotionAwareDecisionEngine.makeDecision()
  ↓
EnrichedMCPMessage → toolHandler → Repository → Database
  ↓
UnifiedMemorySystem.updateWorkingMemory()
  ↓
Response (with memory context)
```

### AFTER Phase 2:

```
Widget → UnifiedDataService.queryGraphRAG()
  ↓
POST /api/mcp/route (tool: 'graph_rag')
  ↓
UnifiedGraphRAG.query()
  ├─► HybridSearchEngine (keyword + semantic + graph)
  ├─► Multi-hop traversal (CMA knowledge graph)
  └─► Document retrieval (SRAG)
  ↓
Synthesized context → Response
```

### AFTER Phase 3:

```
Background Loop: AutonomousTaskEngine
  ↓
Generate tasks → Execute via AutonomousAgent
  ↓
SelfReflectionEngine.reflect()
  ↓
MetaLearningEngine.optimizeLearningStrategy()
  ↓
RLHFAlignmentSystem.optimizePolicy()
  ↓
Update all systems → Improved performance
```

---

## ✅ INTEGRATION CHECKLIST

### Phase 1 (Week 1-4)

- [ ] Create `apps/backend/src/mcp/cognitive/` directory
- [ ] Implement `UnifiedMemorySystem.ts`
- [ ] Modify `mcpRouter.ts` to use enrichment
- [ ] Implement `AutonomousTaskEngine.ts`
- [ ] Modify `hansPedder.ts` to use task engine
- [ ] Implement `EmotionAwareDecisionEngine.ts`
- [ ] Modify `AutonomousAgent.ts` for emotion awareness
- [ ] Implement `HybridSearchEngine.ts`
- [ ] Modify frontend `UnifiedDataService.ts`
- [ ] Integration tests for all components
- [ ] Update `MCPMessage` interface to support enrichment

### Phase 2 (Week 5-9)

- [ ] Implement `UnifiedGraphRAG.ts`
- [ ] Add `graph_rag` tool handler
- [ ] Register GraphRAG tool in `mcpRegistry`
- [ ] Implement `AgentTeam.ts`
- [ ] Implement `StateGraphRouter.ts`
- [ ] Implement `PatternEvolutionEngine.ts`
- [ ] Integration tests for Phase 2
- [ ] Frontend GraphRAG integration
- [ ] Performance optimization

### Phase 3 (Week 10-12)

- [ ] Implement `SelfReflectionEngine.ts`
- [ ] Implement `MetaLearningEngine.ts`
- [ ] Implement `RLHFAlignmentSystem.ts`
- [ ] Connect feedback loops
- [ ] Final integration testing
- [ ] Performance tuning
- [ ] Production deployment

---

## 🎯 SUCCESS METRICS PER PHASE

**Phase 1:** Memory enrichment active, emotion-aware routing functional  
**Phase 2:** GraphRAG queries working, multi-hop reasoning operational  
**Phase 3:** Self-improvement autonomy, continuous optimization

---

**Status:** Integration architecture complete and ready for implementation 🚀
