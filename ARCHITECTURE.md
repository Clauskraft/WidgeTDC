# Widget TDC Architecture

## Overview

This repository implements a comprehensive multi-agent widget framework with backend services, database schemas, and MCP (Model Context Protocol) integration layer.

## Repository Structure

```
WidgeTDC/
├── apps/
│   ├── backend/          # Node.js/Express backend with MCP router
│   │   └── src/
│   │       ├── database/     # SQLite database and schema
│   │       ├── mcp/          # MCP router and WebSocket server
│   │       └── services/     # Business logic services
│   │           ├── memory/   # CMA (Contextual Memory Agent)
│   │           ├── srag/     # Structured RAG Data Governance
│   │           ├── evolution/# Self-evolving agent
│   │           └── pal/      # AI PAL (Personal Assistant)
│   └── widget-board/     # React frontend with widgets
│       └── src/
│           └── widgets/      # Widget implementations
└── packages/
    └── shared/
        ├── mcp-types/        # MCP message type definitions
        └── domain-types/     # Domain entity type definitions
```

## Core Components

### 1. Contextual Memory Agent (CMA)

**Purpose**: Enhance decision-making with hyper-contextual memory

**Database Tables**:
- `memory_entities`: Stores decisions, preferences, KPIs
- `memory_relations`: Links between memory entities
- `memory_tags`: Tags for quick search

**MCP Tools**:
- `cma.context`: Get contextual prompt with relevant memories
- `cma.ingest`: Store new memory entity

**API Endpoints**:
- `POST /api/memory/ingest`: Store memory
- `POST /api/memory/contextual-prompt`: Get contextual prompt
- `POST /api/memory/search`: Search memories

### 2. Structured RAG Data Governance (SRAG)

**Purpose**: Convert unstructured data to relational structures and route queries

**Database Tables**:
- `raw_documents`: Original unstructured documents
- `structured_facts`: Normalized relational facts

**MCP Tools**:
- `srag.query`: Query data (analytical or semantic)

**API Endpoints**:
- `POST /api/srag/query`: Execute natural language query
- `POST /api/srag/ingest/document`: Ingest raw document
- `POST /api/srag/ingest/fact`: Ingest structured fact

**Query Types**:
- **Analytical**: SQL-based queries against structured_facts
- **Semantic**: Vector/LLM-based search on raw_documents

### 3. Self-Evolving Business Development Agent

**Purpose**: Monitor agent outputs and auto-adjust prompts based on KPIs

**Database Tables**:
- `agent_prompts`: Versioned prompts for agents
- `agent_runs`: Historical agent execution records

**MCP Tools**:
- `evolution.report-run`: Report agent execution results
- `evolution.get-prompt`: Get latest prompt version

**API Endpoints**:
- `POST /api/evolution/report-run`: Report agent run with KPI
- `GET /api/evolution/prompt/:agentId`: Get latest prompt
- `POST /api/evolution/prompt`: Create new prompt version
- `GET /api/evolution/runs/:agentId`: Get run history

**Evolution Logic**:
- Tracks average KPI delta over last N runs
- Triggers refinement when performance drops below threshold
- Automatically versions prompts

### 4. MCP-Based Interoperability Layer

**Purpose**: Unified communication layer for widgets and agents

**Components**:
- `mcpRegistry`: Tool registration and routing
- `mcpRouter`: HTTP API for MCP messages
- `mcpWebsocketServer`: Real-time WebSocket communication

**MCP Message Format**:
```typescript
interface MCPMessage {
  id: string;
  traceId?: string;
  sourceId: string;
  targetId: string;
  tool: string;
  payload: any;
  createdAt: string;
}
```

**API Endpoints**:
- `POST /api/mcp/route`: Route MCP message
- `GET /api/mcp/tools`: List available tools
- `WS /mcp/ws`: WebSocket for real-time messages

### 5. AI PAL - Personal Workflow Optimization

**Purpose**: Learn user patterns and optimize workflow proactively

**Database Tables**:
- `pal_user_profiles`: User preferences
- `pal_focus_windows`: Scheduled focus times
- `pal_events`: User activity events

**MCP Tools**:
- `pal.event`: Record user event
- `pal.board-action`: Get board adjustment recommendations

**API Endpoints**:
- `POST /api/pal/event`: Record event
- `GET /api/pal/recommendations`: Get personalized recommendations
- `GET /api/pal/profile`: Get user profile
- `PUT /api/pal/profile`: Update user profile
- `POST /api/pal/focus-window`: Add focus window

**Recommendations**:
- Mute notifications during high stress
- Isolate widgets during focus windows
- Contextual reminders based on patterns

## Database Schema

The system uses SQLite for lightweight data storage. All tables are defined in `apps/backend/src/database/schema.sql`.

### Key Design Decisions:
- SQLite for simplicity and portability
- JSON payloads in `structured_facts` for flexibility
- Indexed columns for performance (org_id, user_id, tags)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Install all dependencies
cd /home/runner/work/WidgeTDC/WidgeTDC
npm install --workspaces

# Build shared packages
npm run build --workspace=packages/shared/mcp-types
npm run build --workspace=packages/shared/domain-types

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

### Running the Application

```bash
# Terminal 1: Start backend
cd apps/backend
npm run dev

# Terminal 2: Start frontend
cd apps/widget-board
npm run dev
```

The backend will run on `http://localhost:3001` and frontend on `http://localhost:5173`.

### Seeding Database

```bash
cd apps/backend
npm run build
node dist/database/seeds.js
```

## API Documentation

### Health Check
```bash
GET http://localhost:3001/health
```

### Example: Store Memory
```bash
POST http://localhost:3001/api/memory/ingest
Content-Type: application/json

{
  "orgId": "org-1",
  "userId": "user-1",
  "entityType": "DecisionOutcome",
  "content": "Decided to use TypeScript",
  "importance": 5,
  "tags": ["technical", "architecture"]
}
```

### Example: Query SRAG
```bash
POST http://localhost:3001/api/srag/query
Content-Type: application/json

{
  "orgId": "org-1",
  "naturalLanguageQuery": "What is the total supplier spending?"
}
```

### Example: MCP Message
```bash
POST http://localhost:3001/api/mcp/route
Content-Type: application/json

{
  "id": "msg-123",
  "sourceId": "widget-1",
  "targetId": "cma-service",
  "tool": "cma.context",
  "payload": {
    "orgId": "org-1",
    "userId": "user-1",
    "userQuery": "What were our recent decisions?",
    "keywords": ["decision", "architecture"]
  }
}
```

## Development Workflow

1. **Shared Types**: Define new types in `packages/shared/mcp-types` or `domain-types`
2. **Backend Service**: Implement service logic in `apps/backend/src/services/`
3. **MCP Tool**: Register tool handler in `apps/backend/src/mcp/toolHandlers.ts`
4. **Widget**: Create widget component in `apps/widget-board/src/widgets/`
5. **Register Widget**: Add to `WIDGET_DEFINITIONS` in `apps/widget-board/constants.ts`

## Testing

```bash
# Run all tests
npm test --workspaces

# Test individual workspace
npm test --workspace=apps/backend
```

## Future Enhancements

- [ ] Add PostgreSQL support for production
- [ ] Implement vector embeddings for semantic search
- [ ] Add authentication and authorization
- [ ] Create admin dashboard for monitoring
- [ ] Add metrics and observability
- [ ] Implement prompt refinement LLM integration
- [ ] Add widget marketplace
- [ ] Create mobile app

## Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Update documentation
5. Submit pull request

## License

Proprietary - All rights reserved
