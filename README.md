# WidgeTDC - Complete Widget Framework with Backend Architecture

A comprehensive multi-agent widget framework featuring contextual memory, structured RAG, self-evolving agents, and personal workflow optimization.

## 🎯 Project Overview

This project implements a complete architecture for intelligent widgets with:

- **Backend Services**: Node.js/Express with TypeScript
- **Database**: SQLite with comprehensive schemas
- **MCP Integration**: Model Context Protocol for widget-to-service communication
- **Five Specialized Widgets**: CMA, SRAG, Evolution, MCP Inspector, AI PAL
- **15+ Existing Widgets**: Chat, Notes, Procurement, Security, and more

## 📁 Repository Structure

```
WidgeTDC/
├── apps/
│   ├── backend/               # Backend API server
│   │   └── src/
│   │       ├── database/      # SQLite database & schemas
│   │       ├── mcp/           # MCP router & WebSocket
│   │       └── services/      # Business logic services
│   │           ├── memory/    # Contextual Memory Agent
│   │           ├── srag/      # Structured RAG
│   │           ├── evolution/ # Self-evolving agent
│   │           └── pal/       # AI PAL
│   └── widget-board/          # React frontend
│       └── src/
│           └── widgets/       # 20 widget implementations
└── packages/
    └── shared/
        ├── mcp-types/         # MCP message interfaces
        └── domain-types/      # Domain entity types
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install all dependencies
npm install

# Build shared packages
cd packages/shared/mcp-types && npm install && npm run build
cd ../domain-types && npm install && npm run build

# Install backend dependencies
cd ../../apps/backend && npm install

# Install frontend dependencies
cd ../widget-board && npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

Backend runs on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd apps/widget-board
npm run dev
```

Frontend runs on `http://localhost:5173`

### Environment Variables

Backend (`apps/backend/.env` or shell):

- `OPENSEARCH_NODE`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD`, `OPENSEARCH_FEED_INDEX` – live threat feed index
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` – archive storage
- `SECURITY_ACTIVITY_RETENTION_DAYS`, `SECURITY_ACTIVITY_HEARTBEAT_MS` – activity stream tuning

Frontend (`apps/widget-board/.env`):

- `VITE_WIDGET_API_URL` – points to the backend origin (defaults to `window.location.origin`)

### Seeding Test Data

```bash
cd apps/backend
npm run build
node dist/database/seeds.js
```

## 🧩 Five Specialized Widgets

### 1. 🧠 CMA Decision Assistant

Contextual memory-enhanced decision making widget.

**Features:**
- Natural language decision queries
- Contextual memory search
- Importance-weighted recommendations
- Historical decision tracking

**API:** `POST /api/memory/contextual-prompt`

### 2. 📊 SRAG Data Governance

Structured RAG with analytical and semantic query routing.

**Features:**
- Natural language to SQL conversion
- Semantic document search
- Query type detection (analytical vs semantic)
- Audit trail with SQL query display

**API:** `POST /api/srag/query`

### 3. 🧬 Evolution & KPI Monitor

Self-evolving agent with automatic prompt refinement.

**Features:**
- Prompt version tracking
- KPI delta monitoring
- Performance evaluation
- Auto-refinement triggers

**API:** 
- `GET /api/evolution/prompt/:agentId`
- `GET /api/evolution/runs/:agentId`

### 4. 🔌 MCP Inspector

Real-time MCP message stream debugger.

**Features:**
- Live message monitoring
- Tool testing interface
- Message filtering
- Request/response inspection

**API:** 
- `POST /api/mcp/route`
- `GET /api/mcp/tools`

### 5. 🤖 AI PAL Assistant

Personal workflow optimization and stress management.

**Features:**
- Focus window management
- Stress level tracking
- Contextual recommendations
- Activity logging

**API:**
- `GET /api/pal/recommendations`
- `POST /api/pal/event`

## 🛡️ Security Intelligence Widgets (Track 2.B)

Phase 2 introduces the Cyberstreams security widgets described in `BACKLOG_UPDATE.txt` and `PHASE2_OUTLINE.txt`. They are now implemented inside `apps/widget-board` and backed by the existing Widget Registry 2.0.

### 1. Feed Ingestion Widget

- Multi-source RSS + streaming ingestion with threat-level classification
- Normalization pipeline visualizing RSS poller → NLP tagger → OpenSearch → MinIO archive
- Duplicate detection controls with adjustable similarity thresholds
- Live metrics (docs/hr, ingestion latency, dedupe efficiency, backlog minutes)
- Feed-specific detail panel showing cadence, coverage regions, connected services

### 2. Search Interface Widget

- Advanced query builder targeting OpenSearch (`ti-feeds` index)
- Saved query templates (high-fidelity alerts, zero-day exploitation, supply chain)
- Source scoping across Feed Ingestion, Dark Web, Vendor Radar, CERT-EU, internal telemetry
- Highlighted search results with severity/status chips and scoring
- Search audit log capturing filters, latency, and result counts for compliance

### 3. Activity Stream Widget

- Server-sent events style live stream covering ingestion, alerts, automation, and audit categories
- Severity/category filters with pause/resume controls and SLA metrics
- Acknowledgement workflow for SOC operators
- Displays channel origin (SSE/Webhook/Job) and rule identifiers for traceability
- Bounded event buffer with automatic rotation to protect UI performance

## 🔧 API Documentation

### Health Check
```bash
curl http://localhost:3001/health
```

### Memory Service Examples

**Store Memory:**
```bash
curl -X POST http://localhost:3001/api/memory/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-1",
    "userId": "user-1",
    "entityType": "DecisionOutcome",
    "content": "Decided to use TypeScript",
    "importance": 5,
    "tags": ["technical"]
  }'
```

**Get Contextual Prompt:**
```bash
curl -X POST http://localhost:3001/api/memory/contextual-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-1",
    "userId": "user-1",
    "userQuery": "What decisions have we made about architecture?",
    "keywords": ["architecture", "decision"]
  }'
```

### SRAG Service Examples

**Query Data:**
```bash
curl -X POST http://localhost:3001/api/srag/query \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-1",
    "naturalLanguageQuery": "What is the total supplier spending?"
  }'
```

### Evolution Service Examples

**Get Agent Prompt:**
```bash
curl http://localhost:3001/api/evolution/prompt/procurement-agent
```

**Report Agent Run:**
```bash
curl -X POST http://localhost:3001/api/evolution/report-run \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "procurement-agent",
    "promptVersion": 1,
    "inputSummary": "Analyzed Q1 spending",
    "outputSummary": "Recommended 3 optimizations",
    "kpiName": "cost_savings",
    "kpiDelta": 0.15,
    "runContext": {"quarter": "Q1"}
  }'
```

### PAL Service Examples

**Get Recommendations:**
```bash
curl "http://localhost:3001/api/pal/recommendations?userId=user-1&orgId=org-1"
```

**Record Event:**
```bash
curl -X POST http://localhost:3001/api/pal/event \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "orgId": "org-1",
    "eventType": "meeting",
    "payload": {"title": "Team Meeting", "duration": 30},
    "detectedStressLevel": "low"
  }'
```

### MCP Router Example

**Route MCP Message:**
```bash
curl -X POST http://localhost:3001/api/mcp/route \
  -H "Content-Type: application/json" \
  -d '{
    "id": "msg-123",
    "sourceId": "widget-1",
    "targetId": "cma",
    "tool": "cma.context",
    "payload": {
      "orgId": "org-1",
      "userId": "user-1",
      "userQuery": "Test query",
      "keywords": ["test"]
    }
  }'
```

## 🗄️ Database Schema

SQLite database with 11 tables:

### Memory (CMA)
- `memory_entities`: Decision outcomes, preferences, KPIs
- `memory_relations`: Relationships between entities
- `memory_tags`: Tags for search

### SRAG
- `raw_documents`: Unstructured documents
- `structured_facts`: Normalized relational facts

### Evolution
- `agent_prompts`: Versioned agent prompts
- `agent_runs`: Historical execution records

### PAL
- `pal_user_profiles`: User preferences
- `pal_focus_windows`: Scheduled focus times
- `pal_events`: User activity events

## 🧪 Testing

```bash
# Run all tests
npm test --workspaces

# Test backend only
npm test --workspace=apps/backend

# Test frontend only
npm test --workspace=apps/widget-board
```

## 🔧 Development

### Building

```bash
# Build everything
npm run build:all

# Build backend only
npm run build:backend

# Build frontend only
npm run build:frontend
```

### Adding a New Widget

1. Create widget component in `apps/widget-board/widgets/`
2. Import in `apps/widget-board/constants.ts`
3. Add to `WIDGET_DEFINITIONS` array
4. Build and test

### Adding a New Service

1. Create service in `apps/backend/src/services/`
2. Add database tables in `schema.sql`
3. Create controller and repository
4. Register routes in `index.ts`
5. Add MCP tool handler if needed

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [apps/backend/src/database/schema.sql](./apps/backend/src/database/schema.sql) - Database schema
- [packages/shared/mcp-types/](./packages/shared/mcp-types/) - MCP type definitions

## 🎨 Technology Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- React Grid Layout

**Backend:**
- Node.js
- Express
- TypeScript
- SQLite (better-sqlite3)
- WebSocket (ws)

**Shared:**
- TypeScript
- npm Workspaces

## 🔐 Security

- Input validation on all API endpoints
- JSON parsing error handling
- SQL injection prevention via prepared statements
- CORS enabled for development

## 🚧 Future Enhancements

- [ ] PostgreSQL support for production
- [ ] Vector embeddings for semantic search
- [ ] Authentication & authorization
- [ ] Admin dashboard
- [ ] Metrics & observability
- [ ] LLM integration for prompt refinement
- [ ] Widget marketplace
- [ ] Mobile app

## 📄 License

Proprietary - All rights reserved

## 👥 Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Update documentation
5. Submit pull request

## 🆘 Support

For issues and questions, please check:
- [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- API documentation above for endpoint usage
- Database schema for data model

---

Built with ❤️ for intelligent widget management
