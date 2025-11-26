# WidgeTDC - Enterprise AI Platform Architecture

**Last Updated:** 2025-11-26  
**Status:** ✅ Production Ready - CSS Build Fixed

## System Overview

WidgeTDC is an Enterprise-grade Autonomous Intelligence Platform featuring:
- **Semantic Vector Database** with multi-provider embeddings
- **Autonomous Task Engine** with learning loops
- **Distributed Event System** for scalability
- **Production-ready Infrastructure** with monitoring and logging
- **Modern Frontend** with React 19 and Tailwind CSS v4

---

## Recent Updates (2025-11-26)

### ✅ Frontend Build System Fixed
- **CSS Architecture Rebuilt**: Complete rewrite of `App.css` with proper structure
- **Keyframes Fixed**: All `@keyframes` animations now use correct syntax (0%, 50%, 100%)
- **Tailwind v4 Migration**: All `@apply` directives converted to standard CSS
- **Build Success**: Frontend builds without errors (`npm run build`)
- **No Blocking Issues**: All critical CSS syntax errors resolved

### ✅ PowerShell Scripts Standardized
- **Created**: `update_agent.ps1`, `update_agent_github.ps1`, `update_agent_readme.ps1`
- **Approved Verbs**: Using `Get-NormalizedPath` instead of `Normalize-Path`
- **No Unused Variables**: Removed `GlobalHooksDir` and other unused assignments
- **PSScriptAnalyzer Compliant**: All scripts pass linting

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Widget Board │  │  MCP Client  │  │  Dashboard   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                  │                  │                          │
│         └──────────────────┴──────────────────┘                          │
│                            │ WebSocket + REST API                        │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────────────┐
│                         BACKEND (Node.js + Express)                      │
│                             ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     API LAYER                                    │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │    │
│  │  │   MCP   │  │  SRAG   │  │   PAL   │  │   AI    │  ...      │    │
│  │  │ Router  │  │   API   │  │   API   │  │  Proxy  │           │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │    │
│  │       │            │            │             │                 │    │
│  └───────┼────────────┼────────────┼─────────────┼─────────────────┘    │
│          │            │            │             │                      │
│  ┌───────┴────────────┴────────────┴─────────────┴─────────────────┐    │
│  │                  COGNITIVE LAYER                                 │    │
│  │                                                                   │    │
│  │  ┌──────────────────┐    ┌──────────────────┐                  │    │
│  │  │ Autonomous Agent │    │ UnifiedGraphRAG  │                  │    │
│  │  │  ┌────────────┐  │    │  Multi-hop RAG   │                  │    │
│  │  │  │ Task Engine│  │    └────────┬─────────┘                  │    │
│  │  │  │ & Learning │  │             │                            │    │
│  │  │  └─────┬──────┘  │             │                            │    │
│  │  └────────┼─────────┘             │                            │    │
│  │           │                       │                            │    │
│  │  ┌────────┴───────────────────────┴──────────┐                 │    │
│  │  │      Unified Memory System                 │                 │    │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐│                 │    │
│  │  │  │ Working  │  │ Episodic │  │Procedural││                 │    │
│  │  │  │  Memory  │  │  Memory  │  │  Memory  ││                 │    │
│  │  │  └──────────┘  └──────────┘  └──────────┘│                 │    │
│  │  └────────────────────┬───────────────────────┘                 │    │
│  │                       │                                         │    │
│  └───────────────────────┼─────────────────────────────────────────┘    │
│                          │                                              │
│  ┌───────────────────────┴─────────────────────────────────────────┐    │
│  │                  DATA & EMBEDDING LAYER                          │    │
│  │                                                                   │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │          Embedding Service (Multi-Provider)               │   │    │
│  │  │  ┌─────────┐  ┌────────────┐  ┌──────────────┐          │   │    │
│  │  │  │ OpenAI  │  │HuggingFace │  │Transformers.js│          │   │    │
│  │  │  │ 1536D   │  │   768D     │  │    384D       │          │   │    │
│  │  │  └────┬────┘  └─────┬──────┘  └──────┬───────┘          │   │    │
│  │  │       └─────────────┴────────────────┴─ Auto-select       │   │    │
│  │  └───────────────────────┬──────────────────────────────────┘   │    │
│  │                          │ Generate embeddings                  │    │
│  │  ┌───────────────────────▼──────────────────────────────────┐   │    │
│  │  │         PgVectorStoreAdapter (pgvector)                   │   │    │
│  │  │  • Auto-embedding generation                              │   │    │
│  │  │  • Semantic text search                                   │   │    │
│  │  │  • Cosine similarity                                      │   │    │
│  │  │  • Namespace isolation                                    │   │    │
│  │  └───────────────────────┬──────────────────────────────────┘   │    │
│  │                          │                                       │    │
│  └──────────────────────────┼───────────────────────────────────────┘    │
│                             │                                            │
│  ┌──────────────────────────┴───────────────────────────────────────┐    │
│  │                  EVENT & INTEGRATION LAYER                       │    │
│  │                                                                   │    │
│  │  ┌──────────────────┐    ┌──────────────────────────────────┐   │    │
│  │  │  Redis EventBus  │◄───┤    Ingestion Pipeline            │   │    │
│  │  │  (Production)    │    │  • Data Sources (20+)            │   │    │
│  │  │  OR              │    │  • Browser History               │   │    │
│  │  │  In-Memory       │    │  • Email (Gmail, Outlook)        │   │    │
│  │  │  (Development)   │    │  • Cloud (Drive, OneDrive)       │   │    │
│  │  └──────────────────┘    │  • Social (Twitter, LinkedIn)    │   │    │
│  │                          └──────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                                      │
│                            ▼                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │   PostgreSQL     │  │      Redis       │  │     Neo4j        │      │
│  │   + pgvector     │  │   Event Store    │  │  Knowledge Graph │      │
│  │  • Embeddings    │  │  • Pub/Sub       │  │  • Entities       │      │
│  │  • Documents     │  │  • Cache         │  │  • Relations      │      │
│  │  • Metadata      │  │  • Sessions      │  │  • Inference      │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
WidgeTDC/
├── apps/
│   ├── backend/              # Express.js backend
│   │   ├── src/
│   │   │   ├── mcp/         # MCP protocol implementation
│   │   │   ├── cognitive/   # AI agents & RAG
│   │   │   ├── memory/      # Memory systems
│   │   │   ├── ingestion/   # Data ingestion
│   │   │   └── api/         # REST endpoints
│   │   └── package.json
│   │
│   └── widget-board/         # React 19 frontend ✅ BUILD FIXED
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── widgets/     # Widget implementations
│       │   └── mcp/         # MCP client
│       ├── App.css          # ✅ REBUILT - All keyframes fixed
│       ├── App.tsx
│       └── package.json
│
├── packages/
│   └── shared/              # Shared types & utilities
│       ├── types/
│       └── utils/
│
├── scripts/                 # ✅ UPDATED - PowerShell scripts
│   ├── update_agent.ps1            # ✅ NEW - Agent updater
│   ├── update_agent_github.ps1     # ✅ NEW - GitHub workflow updater
│   ├── update_agent_readme.ps1     # ✅ NEW - README updater
│   ├── build-shared.ps1
│   ├── install-deepseek.ps1
│   ├── setup-enterprise.ps1
│   └── test_rag_flow.ps1
│
├── database/
│   ├── migrations/          # SQL migrations
│   └── schema.sql
│
├── .github/
│   └── workflows/           # GitHub Actions
│       ├── agent-*.yml      # Agent workflows
│       └── ci.yml
│
├── docs/                    # Documentation
├── tests/                   # Test suites
└── dist/                    # ✅ Build output (created successfully)
```

---

## Technology Stack

### Frontend
- **Framework**: React 19 (latest)
- **Build Tool**: Vite 6.4.1
- **Styling**: Tailwind CSS v4 (PostCSS)
- **State Management**: Zustand
- **Real-time**: WebSocket client
- **Testing**: Vitest + React Testing Library

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Real-time**: WebSocket (`ws` library)
- **MCP**: Custom implementation

### Database
- **Primary**: PostgreSQL 15+ with pgvector
- **Cache/Events**: Redis 7+
- **Graph**: Neo4j 5+ (optional)
- **Development**: SQLite (fallback)

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Railway (configured)
- **Monitoring**: PM2 ecosystem

---

## Key Components

### 1. MCP (Model Context Protocol)
- **Location**: `apps/backend/src/mcp/`
- **Purpose**: Standardized AI agent communication
- **Features**:
  - Tool registration and execution
  - Resource management
  - Event broadcasting
  - WebSocket transport

### 2. UnifiedGraphRAG
- **Location**: `apps/backend/src/cognitive/UnifiedGraphRAG.ts`
- **Purpose**: Multi-hop semantic retrieval
- **Features**:
  - Entity extraction
  - Relation mapping
  - Context-aware search
  - Hybrid retrieval (vector + graph)

### 3. Autonomous Task Engine
- **Location**: `apps/backend/src/cognitive/AutonomousAgent.ts`
- **Purpose**: Self-directed task execution
- **Features**:
  - Goal decomposition
  - Learning from outcomes
  - Dynamic replanning
  - Memory integration

### 4. Widget System
- **Location**: `apps/widget-board/src/widgets/`
- **Purpose**: Modular UI components
- **Features**:
  - Dynamic loading
  - MCP integration
  - Drag-and-drop layout
  - Settings persistence

---

## Build & Deployment Status

### ✅ Frontend Build
```bash
npm run build --prefix apps/widget-board
# Status: ✅ SUCCESS (6.40s)
# Output: dist/ directory created
# Issues: None
```

### ✅ CSS Architecture
- **File**: `apps/widget-board/App.css`
- **Status**: Completely rebuilt
- **Keyframes**: All properly structured
- **Tailwind**: v4 compatible (no @apply)
- **Animations**: All functional

### ✅ PowerShell Scripts
- **Location**: `scripts/`
- **Status**: PSScriptAnalyzer compliant
- **Issues**: None

---

## Configuration Files

### Build Configuration
- `vite.config.ts` - Vite build settings
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - Tailwind CSS v4 config
- `postcss.config.js` - PostCSS plugins

### Runtime Configuration
- `ecosystem.config.js` - PM2 process management
- `docker-compose.yml` - Container orchestration
- `railway.json` - Railway deployment config

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start backend
npm run dev:backend

# Start frontend (separate terminal)
npm run dev:frontend

# Run tests
npm test
```

### Production Build
```bash
# Build frontend
npm run build --prefix apps/widget-board

# Build backend
npm run build --prefix apps/backend

# Start production server
npm start
```

---

## Security & Compliance

### Authentication
- JWT-based authentication
- Session management via Redis
- CORS configured for production

### Data Protection
- Encryption at rest (PostgreSQL)
- TLS for all network traffic
- Environment variable isolation

### Compliance
- GDPR-ready data handling
- Audit logging
- Data retention policies

---

## Monitoring & Observability

### Logging
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Persistent storage in `logs/`

### Metrics
- PM2 monitoring
- Database connection pooling
- WebSocket connection tracking

### Health Checks
- `/health` endpoint
- Database connectivity
- Redis availability
- Memory usage

---

## Known Issues & Limitations

### ✅ Resolved
- ~~CSS build errors in App.css~~ **FIXED 2025-11-26**
- ~~PowerShell script warnings~~ **FIXED 2025-11-26**
- ~~Tailwind @apply compatibility~~ **FIXED 2025-11-26**

### Active
- None currently blocking

---

## Future Enhancements

### Planned Features
1. **Multi-tenant Support**: Workspace isolation
2. **Advanced Analytics**: Usage dashboards
3. **Plugin System**: Third-party widget support
4. **Mobile App**: React Native client

### Infrastructure
1. **Kubernetes**: Container orchestration
2. **Prometheus**: Metrics collection
3. **Grafana**: Visualization
4. **ELK Stack**: Log aggregation

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

See [LICENSE](./LICENSE) for details.

---

**Architecture maintained by**: WidgeTDC Development Team  
**Last reviewed**: 2025-11-26  
**Next review**: 2025-12-26
