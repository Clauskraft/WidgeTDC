# WidgeTDC - GitHub Copilot Instructions

## Project Overview

WidgeTDC is a comprehensive multi-agent widget framework featuring contextual memory, structured RAG, self-evolving agents, and personal workflow optimization. This is a TypeScript monorepo using npm workspaces with a React frontend and Node.js/Express backend.

## Architecture

### Repository Structure
```
WidgeTDC/
├── apps/
│   ├── backend/               # Node.js/Express backend with TypeScript
│   │   └── src/
│   │       ├── database/      # SQLite database & schemas
│   │       ├── mcp/           # MCP router & WebSocket server
│   │       └── services/      # Business logic services
│   │           ├── memory/    # Contextual Memory Agent (CMA)
│   │           ├── srag/      # Structured RAG Data Governance
│   │           ├── evolution/ # Self-evolving agent
│   │           └── pal/       # AI PAL (Personal Assistant)
│   └── widget-board/          # React frontend with Vite
│       ├── widgets/           # 20+ widget implementations
│       ├── components/        # Reusable React components
│       └── constants.ts       # Widget definitions registry
└── packages/
    └── shared/
        ├── mcp-types/         # MCP message interfaces (TypeScript)
        └── domain-types/      # Domain entity types (TypeScript)
```

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- React Grid Layout for widget management
- Google GenAI SDK

**Backend:**
- Node.js with Express
- TypeScript (ES modules)
- SQLite with better-sqlite3
- WebSocket (ws) for real-time communication
- CORS enabled for development

**Tooling:**
- npm workspaces for monorepo management
- tsx for TypeScript execution
- TypeScript 5.8.2

## Development Workflow

### Setup and Installation

```bash
# Install all workspace dependencies
npm install

# Build shared packages first (important!)
cd packages/shared/mcp-types && npm install && npm run build
cd ../domain-types && npm install && npm run build

# Install workspace dependencies
cd ../../apps/backend && npm install
cd ../widget-board && npm install
```

### Running the Application

**Backend (Terminal 1):**
```bash
cd apps/backend
npm run dev  # Runs on http://localhost:3001
```

**Frontend (Terminal 2):**
```bash
cd apps/widget-board
npm run dev  # Runs on http://localhost:5173
```

### Build Commands

```bash
# Build everything
npm run build:all

# Build specific workspaces
npm run build:backend
npm run build:frontend
```

### Testing

```bash
# Run all tests (limited test coverage currently)
npm test --workspaces

# Backend tests
npm test --workspace=apps/backend

# Frontend tests
npm test --workspace=apps/widget-board
```

**Note:** The project currently has minimal test coverage. Backend shows "No tests yet" and frontend has one test file (App.test.tsx).

## Database Schema

SQLite database with 11 tables organized by service:

**Memory (CMA):**
- `memory_entities`: Stores decisions, preferences, KPIs (org_id, user_id, entity_type, content, importance)
- `memory_relations`: Links between memory entities (source_id, target_id, relation_type)
- `memory_tags`: Tags for search and filtering

**SRAG:**
- `raw_documents`: Unstructured documents (org_id, source_type, content)
- `structured_facts`: Normalized relational facts (org_id, fact_type, json_payload)

**Evolution:**
- `agent_prompts`: Versioned agent prompts (agent_id, version, prompt_text)
- `agent_runs`: Historical execution records (agent_id, prompt_version, kpi_delta)

**PAL:**
- `pal_user_profiles`: User preferences and settings
- `pal_focus_windows`: Scheduled focus times
- `pal_events`: User activity events

## Core Services & APIs

### 1. Contextual Memory Agent (CMA)
**Purpose:** Hyper-contextual decision-making with memory

**Endpoints:**
- `POST /api/memory/ingest`: Store new memory entity
- `POST /api/memory/contextual-prompt`: Get contextual prompt with relevant memories
- `POST /api/memory/search`: Search memories by keywords/tags

**MCP Tools:** `cma.context`, `cma.ingest`

### 2. Structured RAG Data Governance (SRAG)
**Purpose:** Natural language to SQL + semantic search

**Endpoints:**
- `POST /api/srag/query`: Query with natural language (auto-routes to SQL or semantic)
- `POST /api/srag/ingest-doc`: Store raw documents
- `POST /api/srag/ingest-fact`: Store structured facts

**MCP Tools:** `srag.query`, `srag.ingest`

### 3. Evolution Agent
**Purpose:** Self-evolving agent with prompt refinement

**Endpoints:**
- `GET /api/evolution/prompt/:agentId`: Get latest prompt
- `POST /api/evolution/report-run`: Report execution results
- `GET /api/evolution/runs/:agentId`: Get run history

**MCP Tools:** `evolution.get-prompt`, `evolution.report`

### 4. AI PAL (Personal Assistant)
**Purpose:** Workflow optimization and stress management

**Endpoints:**
- `GET /api/pal/recommendations`: Get contextual recommendations
- `POST /api/pal/event`: Record user activity
- `GET /api/pal/profile/:userId`: Get user profile

**MCP Tools:** `pal.recommend`, `pal.log`

### 5. MCP Router
**Purpose:** Widget-to-service communication via MCP

**Endpoints:**
- `POST /api/mcp/route`: Route MCP message to appropriate service
- `GET /api/mcp/tools`: List available MCP tools
- WebSocket: `ws://localhost:3001` for real-time messaging

## Widget Development

### Adding a New Widget

1. Create widget component in `apps/widget-board/widgets/YourWidget.tsx`
2. Import in `apps/widget-board/constants.ts`
3. Add to `WIDGET_DEFINITIONS` array with configuration:
   ```typescript
   {
     id: 'YourWidget',
     name: 'Display Name',
     component: YourWidget,
     defaultLayout: { w: 6, h: 9 },
     source: 'proprietary',
     minW: 4,
     minH: 6,
   }
   ```
4. Build and test

### Widget Structure
- Each widget is a React functional component
- Props include standard widget metadata (id, onClose, etc.)
- Use hooks from `apps/widget-board/hooks/` for common functionality
- Communicate with backend via fetch or MCP WebSocket

### Existing Widgets (20+)
- **Core:** AgentChat, PromptLibrary, PerformanceMonitor, SystemSettings
- **MCP:** MCPConnector, MCPEmailRAG, McpRouter
- **Intelligence:** IntelligentNotes, CybersecurityOverwatch, ProcurementIntelligence
- **Media:** ImageAnalyzer, AudioTranscriber, VideoAnalyzer
- **Specialized:** CmaDecision, SragGovernance, EvolutionAgent, AiPal
- **Tools:** AgentBuilder, LiveConversation, WidgetImporter

## Coding Standards

### TypeScript
- Use strict TypeScript with ES modules (`"type": "module"`)
- Define types in shared packages when used across workspaces
- Use interfaces for MCP messages and domain entities
- Prefer `unknown` over `any` for type safety

### Code Style
- Use functional React components with hooks
- Async/await for asynchronous operations
- Prepared statements for all SQL queries (security)
- Error handling with try-catch and proper HTTP status codes
- CORS enabled for development (`cors` middleware)

### File Organization
- Services: One service per directory with controller, repository, types
- Widgets: One component per file in `widgets/` directory
- Shared types: Use workspace packages (`@widget-tdc/mcp-types`, `@widget-tdc/domain-types`)
- Database: Schema in `schema.sql`, initialization in `init.ts`

### Security
- All SQL queries use prepared statements (parameterized)
- Input validation on all API endpoints
- JSON parsing with error handling
- No credentials in source code

## Common Tasks

### Adding a Backend Service
1. Create service directory in `apps/backend/src/services/`
2. Define database tables in `apps/backend/src/database/schema.sql`
3. Create repository for database operations
4. Create controller for API endpoints
5. Register routes in `apps/backend/src/index.ts`
6. Add MCP tool handler in `apps/backend/src/mcp/router.ts` if needed

### Adding Database Tables
1. Add CREATE TABLE statements to `schema.sql`
2. Add indexes for performance
3. Run initialization to create tables
4. Create TypeScript interfaces for entities in `packages/shared/domain-types/`

### Working with MCP
- MCP messages have structure: `{ id, sourceId, targetId, tool, payload }`
- Tools named like `serviceName.action` (e.g., `cma.context`)
- WebSocket for real-time bidirectional communication
- HTTP POST for request-response patterns

## Dependencies Management

### Adding Dependencies
- Install in the specific workspace: `npm install <package> --workspace=apps/backend`
- Update shared types if adding cross-workspace dependencies
- Rebuild shared packages after type changes

### Build Order
1. `packages/shared/mcp-types` (first)
2. `packages/shared/domain-types`
3. `apps/backend`
4. `apps/widget-board`

## Known Limitations

- **Testing:** Minimal test coverage currently; backend has no tests, frontend has one test
- **Database:** Using SQLite for development; production may need PostgreSQL
- **Authentication:** No auth/authz implemented yet
- **Vector Search:** No embeddings for semantic search yet
- **LLM Integration:** Manual prompt refinement (not automated)

## Troubleshooting

### Build Failures
- Ensure shared packages are built first
- Check TypeScript version consistency (~5.8.2)
- Verify all workspace dependencies are installed

### Runtime Issues
- Backend must be running on port 3001
- Frontend proxies API calls to backend
- Check CORS configuration if fetch fails
- SQLite database auto-initializes on first run

### WebSocket Issues
- Ensure backend WebSocket server is running
- Check connection to `ws://localhost:3001`
- Verify MCP message structure

## Additional Resources

- [README.md](../README.md) - Quick start and API examples
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Detailed architecture documentation
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Deployment instructions
- [apps/backend/src/database/schema.sql](../apps/backend/src/database/schema.sql) - Complete database schema
- [packages/shared/mcp-types/](../packages/shared/mcp-types/) - MCP type definitions

## Project Philosophy

This is an enterprise-grade widget framework designed for:
- **Modularity:** Each service is independent and focused
- **Extensibility:** Easy to add new widgets and services
- **Intelligence:** Multi-agent architecture with contextual awareness
- **Real-time:** WebSocket-based communication for responsive UX
- **Type Safety:** TypeScript throughout with shared type definitions
