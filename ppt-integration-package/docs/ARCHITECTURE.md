# 🏗️ WidgeTDC PowerPoint Integration - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│               WIDGETDC FRONTEND (React 19)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Autonomous PowerPoint Master v2.0                    │  │
│  │  • Real-time WebSocket updates                        │  │
│  │  • Multi-agent orchestration UI                       │  │
│  │  • Quality metrics visualization                      │  │
│  │  • Slide preview & download                           │  │
│  └────────────────────┬──────────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────────┘
                         │ WebSocket / REST
┌────────────────────────┴─────────────────────────────────────┐
│            WIDGETDC BACKEND (Node.js/Express)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Multi-Agent Orchestrator                      │  │
│  │  • Agent lifecycle management                         │  │
│  │  • Parallel execution coordinator                     │  │
│  │  • Real-time progress streaming                       │  │
│  │  • Quality loop orchestration                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────┬────────────────┬────────────────┐         │
│  │ PPTAgent      │ ChatPPT-MCP    │ Template       │         │
│  │ Service       │ Service        │ Service        │         │
│  └───────────────┴────────────────┴────────────────┘         │
└──────────┬───────────────┬────────────────┬──────────────────┘
           │               │                │
           ▼               ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PPTAgent    │  │ MultiAgent   │  │  ChatPPT     │
│  Docker      │  │  System      │  │  MCP Server  │
│  :9297       │  │  :10001      │  │  :8088       │
│  :8088       │  │  :10011      │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       │   ┌─────────────┴────────┐         │
       │   │                      │         │
       │   ▼                      ▼         │
       │ ┌─────────┐         ┌─────────┐   │
       │ │Research │         │Research │   │
       │ │Agent 1  │         │Agent 2  │   │
       │ └────┬────┘         └────┬────┘   │
       │      │                   │         │
       │      ▼                   ▼         │
       │ ┌─────────────────────────────┐   │
       │ │   Knowledge Base (MCP)      │   │
       │ │   • Neo4j                   │   │
       │ │   • RAG Vector DB           │   │
       │ └─────────────────────────────┘   │
       │                                   │
       └───────────────┬───────────────────┘
                       │
        ┌──────────────┴───────────────┐
        │                              │
        ▼                              ▼
┌──────────────┐              ┌──────────────┐
│ PostgreSQL   │              │  Zenodo10K   │
│ :5433        │              │  Dataset     │
│ (Metadata)   │              │ (Templates)  │
└──────────────┘              └──────────────┘
```

## Component Details

### Frontend Layer

**Autonomous PowerPoint Master v2.0 Widget**
- React 19 functional component
- WebSocket client for real-time updates
- Progress visualization for all stages
- Slide preview grid
- Quality metrics dashboard (PPTEval scores)
- Download interface

**Key Features:**
- Real-time streaming of generation progress
- Multi-stage pipeline visualization
- Agent activity monitoring
- Quality score display (Content, Design, Coherence)
- Responsive layout optimized for WidgeTDC grid

### Backend Layer

**Multi-Agent Orchestrator**
```typescript
class MultiAgentOrchestrator {
  // Stage 1: Outline generation
  runOutlineAgent() 
  
  // Stage 2: Parallel research (3x agents)
  runParallelResearch()
  
  // Stage 3: Slide generation with quality loops
  runPPTGeneration()
  
  // Stage 4: Export to .pptx
  exportPresentation()
}
```

**Services:**

1. **PPTAgent Service**
   - 2-stage generation: Analysis → Generation
   - Reference presentation learning
   - PPTEval quality assessment
   - Python-pptx integration

2. **ChatPPT-MCP Service**
   - Enterprise PPT APIs (18 endpoints)
   - Template application
   - Color scheme customization
   - Online editing capabilities

3. **Template Service**
   - Zenodo10K dataset integration
   - Pattern extraction
   - Layout analysis
   - Style learning

### External Services

**PPTAgent (Docker)**
```yaml
Port: 9297 (API), 8088 (UI)
Models:
  - Language: Qwen2.5-72B-Instruct
  - Vision: gpt-4o-2024-08-06
  - Embeddings: text-embedding-3-small
Features:
  - 2-stage generation
  - PPTEval framework
  - Reference learning
```

**MultiAgentPPT**
```yaml
Outline Service: Port 10001
Slides Service: Port 10011
Download Service: Port 10021
Agents:
  - OutlineAgent: GPT-4/Claude
  - ResearchAgent x3: Parallel execution
  - PPTGenAgent: Loop generation
  - QualityChecker: 3-retry validation
Features:
  - A2A (Agent2Agent) communication
  - MCP protocol support
  - Streaming responses
  - RAG integration
```

**ChatPPT-MCP**
```yaml
URL: https://api.yoo-ai.com/mcp (eller self-hosted)
APIs: 18 professional endpoints
Features:
  - Theme generation
  - Document conversion
  - Template application
  - Online editing
```

### Data Layer

**PostgreSQL Database**
```sql
-- Presentations table
CREATE TABLE presentations (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(255),
  file_path VARCHAR(512),
  created_at TIMESTAMP,
  quality_scores JSONB,
  metadata JSONB
);

-- Slides table
CREATE TABLE slides (
  id SERIAL PRIMARY KEY,
  presentation_id INTEGER REFERENCES presentations(id),
  slide_number INTEGER,
  type VARCHAR(50),
  title VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP
);

-- Templates table (from Zenodo10K)
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  source_file VARCHAR(512),
  patterns JSONB,
  layouts JSONB,
  created_at TIMESTAMP
);
```

**Redis Cache**
```
# Template patterns cache
template:patterns:{template_id} -> JSON
TTL: 3600 seconds

# Quality scores cache
quality:scores:{presentation_id} -> JSON
TTL: 7200 seconds

# Agent status
agent:status:{agent_id} -> JSON
TTL: 300 seconds
```

## Data Flow

### Generation Pipeline

```
1. USER INPUT
   ↓
   Topic: "AI in Healthcare 2025"
   Requirements: "Target medical professionals"

2. ORCHESTRATOR
   ↓
   Initialize agents
   Start WebSocket stream

3. OUTLINE AGENT
   ↓
   GPT-4 generates outline:
   - 8-12 main sections
   - 2-3 subsections each
   - Key points per section
   ↓
   Stream to frontend: { stage: 'outline', progress: 100, data: outline }

4. RESEARCH AGENTS (Parallel)
   ↓
   Agent 1: Research Section 1,4,7
   Agent 2: Research Section 2,5,8
   Agent 3: Research Section 3,6,9
   ↓
   Each uses MCP to search knowledge base:
   - Neo4j graph queries
   - Vector similarity search
   - External API calls
   ↓
   Synthesize findings with GPT-4
   ↓
   Stream to frontend: { stage: 'research', progress: 33/66/100 }

5. PPT GENERATION (Loop per slide)
   ↓
   FOR EACH section:
     Generate slide with PPTAgent
     ↓
     Check quality with QualityChecker
     ↓
     IF quality < threshold (content<7, design<7, coherence<7):
       Retry with feedback (max 3 attempts)
     ELSE:
       Accept slide
     ↓
     Stream to frontend: { stage: 'generation', progress: X%, data: { slide } }

6. EXPORT
   ↓
   Call python-pptx backend
   Generate .pptx file
   Save to /presentations/
   ↓
   Stream to frontend: { stage: 'export', progress: 100, data: { filePath } }

7. QUALITY ASSESSMENT
   ↓
   Run PPTEval on complete presentation:
   - Content score (accuracy, relevance)
   - Design score (visual appeal, consistency)
   - Coherence score (logical flow)
   ↓
   Return scores to frontend

8. COMPLETE
   ↓
   User downloads .pptx
   (Optional) Apply enterprise template via ChatPPT-MCP
```

## API Endpoints

### Backend REST API

```typescript
// Generate presentation
POST /api/presentations/generate
Body: {
  topic: string,
  requirements?: string,
  templateId?: string
}
Response: {
  success: boolean,
  filePath: string,
  outline: Outline,
  slides: Slide[],
  qualityScores: QualityScores
}

// Get presentation status
GET /api/presentations/:id/status
Response: {
  status: 'generating' | 'complete' | 'failed',
  progress: number,
  currentStage: string
}

// Download presentation
GET /api/presentations/:id/download
Response: File (.pptx)

// Get quality evaluation
GET /api/presentations/:id/evaluation
Response: {
  content: number,
  design: number,
  coherence: number,
  suggestions: string[]
}
```

### WebSocket API

```typescript
// Connect to generation stream
WebSocket: ws://localhost:3000/ppt-generation

// Messages from server
{
  type: 'progress',
  stage: 'outline' | 'research' | 'generation' | 'export',
  progress: number (0-100),
  data?: any
}

{
  type: 'slide-generated',
  slide: Slide,
  index: number,
  total: number
}

{
  type: 'complete',
  filePath: string,
  qualityScores: QualityScores
}

{
  type: 'error',
  error: string,
  stage: string
}
```

## Agent Communication

### A2A (Agent2Agent) Protocol

```typescript
// Outline → Research agents
{
  protocol: 'A2A',
  from: 'outline-agent',
  to: 'research-agent-1',
  action: 'research',
  payload: {
    section: Section,
    keywords: string[],
    priority: 'high'
  }
}

// Research → PPT Gen agent
{
  protocol: 'A2A',
  from: 'research-agent-1',
  to: 'ppt-gen-agent',
  action: 'generate-slide',
  payload: {
    section: Section,
    research: ResearchResult,
    template: TemplatePattern
  }
}

// PPT Gen → Quality Checker
{
  protocol: 'A2A',
  from: 'ppt-gen-agent',
  to: 'quality-checker-agent',
  action: 'validate',
  payload: {
    slide: Slide,
    criteria: {
      minContentScore: 7.0,
      minDesignScore: 7.0,
      minCoherenceScore: 7.0
    }
  }
}
```

### MCP (Model Context Protocol)

```typescript
// Knowledge base search
{
  protocol: 'MCP',
  tool: 'knowledge-search',
  parameters: {
    query: string,
    top_k: number,
    filters: { type: string, date_range?: [string, string] }
  }
}

// Neo4j graph query
{
  protocol: 'MCP',
  tool: 'neo4j-query',
  parameters: {
    cypher: string,
    params: Record<string, any>
  }
}

// Template pattern extraction
{
  protocol: 'MCP',
  tool: 'extract-template-patterns',
  parameters: {
    file_path: string,
    analysis_type: 'layout' | 'color' | 'typography'
  }
}
```

## Quality Assurance

### PPTEval Framework

**Content Score (0-10)**
- Accuracy: Facts correct?
- Relevance: On-topic?
- Completeness: All key points?
- Clarity: Easy to understand?

**Design Score (0-10)**
- Visual appeal: Attractive?
- Consistency: Uniform styling?
- Layout: Well-organized?
- Readability: Font sizes appropriate?

**Coherence Score (0-10)**
- Logical flow: Makes sense?
- Transitions: Smooth connections?
- Structure: Clear organization?
- Narrative: Story flows well?

### Quality Loop

```
Generate Slide
    ↓
Evaluate Quality
    ↓
Score < 7.0? ──YES─→ Retry (Max 3x)
    ↓ NO               ↓
Accept Slide ←─────────┘
```

## Scaling & Performance

### Horizontal Scaling

```yaml
# Scale research agents
docker-compose scale research-agent=5

# Scale orchestrator workers
docker-compose scale orchestrator=3
```

### Caching Strategy

```
Level 1: Redis (Hot cache)
  - Template patterns
  - Recent presentations
  - Agent status

Level 2: PostgreSQL (Warm storage)
  - Presentation metadata
  - Quality scores
  - User preferences

Level 3: File System (Cold storage)
  - .pptx files
  - Template library
  - Training data
```

### Performance Metrics

**Target Times:**
- Outline generation: 10-15s
- Research (3 agents): 20-30s
- Slide generation (per slide): 15-20s
- Quality check: 5s
- Export: 5-10s

**Total:** 8-12 slides in 3-5 minutes

## Security

### API Key Management

```env
# Stored in .env (never committed)
OPENAI_API_KEY=sk-...
CHATPPT_API_KEY=...

# Accessed via process.env in backend
# Never exposed to frontend
```

### CORS Policy

```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### Rate Limiting

```typescript
rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

---

**Version:** 2.0.0  
**Last Updated:** December 2024  
**Architecture:** Multi-Agent + MCP + Docker Microservices
