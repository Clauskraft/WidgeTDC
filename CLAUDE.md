# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WidgeTDC is an enterprise-grade autonomous intelligence platform built as a TypeScript monorepo. It combines semantic vector search, autonomous AI agents, and a modular widget-based UI for GDPR-compliant data management.

## Build and Development Commands

```bash
# Install dependencies (all workspaces)
npm install

# Build shared packages first (required before other builds)
npm run build:shared

# Build everything
npm run build

# Development - run both frontend and backend concurrently
npm run dev

# Development - run separately
npm run dev:frontend    # Vite dev server for widget-board
npm run dev:backend     # tsx watch for backend

# Testing
npm run test           # Run vitest
npm run test:run       # Run vitest once (no watch)
npm run test:ui        # Vitest UI
npm run test:coverage  # With coverage

# Linting
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues

# Formatting
npm run format         # Format with Prettier
npm run format:check   # Check formatting
```

## Architecture

### Monorepo Structure

```
apps/
  backend/           # Express.js backend with MCP, cognitive layer, ingestion
  widget-board/      # React 19 + Vite frontend with modular widgets
  mobile/            # React Native mobile app (WIP)
packages/
  domain-types/      # Shared domain type definitions
  mcp-types/         # MCP protocol type definitions
```

### Backend Layers (apps/backend/src/)

- **mcp/** - Model Context Protocol implementation
  - `cognitive/` - AI engines: UnifiedGraphRAG, AutonomousTaskEngine, HybridSearchEngine, StateGraphRouter
  - `autonomous/` - Self-directed agent system with DecisionEngine, MCPIntegration
  - `memory/` - CognitiveMemory, PatternMemory, FailureMemory
- **platform/** - Infrastructure adapters
  - `embeddings/` - TransformersEmbeddings (local), plus OpenAI/HuggingFace options
  - `vector/` - PgVectorStoreAdapter, ChromaVectorStoreAdapter, Neo4jVectorStoreAdapter
  - `events/` - RedisEventBus for distributed messaging
  - `graph/` - Neo4jGraphAdapter for knowledge graphs
- **services/** - Business logic
  - `hyper-log.ts` - HyperLog event stream for real-time intelligence monitoring
  - `ingestion/` - Data ingestion pipeline with 20+ source adapters
  - `external/` - Gmail, Outlook, OneDrive, Teams, Twitter adapters
  - `agent/` - HansPedderAgentController orchestration

### Frontend (apps/widget-board/)

React 19 with Tailwind CSS v4, Zustand for state, react-grid-layout for dashboard layout. Widgets live in `widgets/` directory and are registered in `src/staticWidgetRegistry.ts`.

### Key Technologies

- **Frontend**: React 19, Vite, Tailwind CSS v4, Zustand
- **Backend**: Node.js 20+, Express, TypeScript strict mode
- **Databases**: PostgreSQL + pgvector, Redis 7+, Neo4j 5+ (optional), SQLite (dev cache)
- **AI/ML**: OpenAI, HuggingFace, Transformers.js (local embeddings), Google Gemini, DeepSeek

## Important Patterns

### Shared Packages Build Order

Always build shared packages before building apps:
```bash
npm run build:domain-types
npm run build:mcp-types
npm run build:backend
npm run build:frontend
```

### Widget Registration

Widgets must be registered in two places in `apps/widget-board/src/staticWidgetRegistry.ts`:
1. `staticWidgetRegistry` - lazy import of the component
2. `widgetMetadata` - name, description, category, type, defaultLayout

### MCP Tool Registration

MCP tools are registered in `apps/backend/src/index.ts` using `mcpRegistry.registerTool()`. Handler implementations live in `apps/backend/src/mcp/toolHandlers.ts`.

### HyperLog System

The HyperLog (`apps/backend/src/services/hyper-log.ts`) provides real-time event streaming for the NeuroLink Monitor widget. Events are logged via `hyperLog.log()` and exposed via `/api/hyper/events`.

### ESLint Configuration

Uses flat config (`eslint.config.js`). Unused variables prefixed with `_` are allowed. Many rules are set to `warn` rather than `error`.

### TypeScript

Strict mode enabled. The project uses `~5.8.2` TypeScript version across all packages.

## Database Setup

Development requires Docker for infrastructure:
```bash
docker-compose up -d  # Starts PostgreSQL, Redis, Neo4j
```

Environment variables in `.env`:
- `EMBEDDING_PROVIDER`: `transformers` (local/free), `openai`, or `huggingface`
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`: Neo4j connection (optional)

## Key API Endpoints

- `/api/mcp/route` - MCP tool execution
- `/api/hyper/events` - HyperLog real-time events
- `/api/hanspedder/*` - Agent controller endpoints
- `/health` - System health check
- WebSocket: `ws://localhost:3001/mcp/ws`

## Branch and PR Conventions

- Main branches: `main`, `develop`
- Feature branches: `feature/*`
- Hotfix branches: `hotfix/*`
- Prefer squash-merge for feature branches
- All tests and lint must pass before merge

## GDPR and Security Notes

- No real PII in test fixtures or commits
- Log only IDs/metadata in audit events (data minimization)
- Follow retention policies documented in `.github/architecture/`
- b   | Komponent                          | Tilstand               | Brugt af                                                        |
  |------------------------------------|------------------------|-----------------------------------------------------------------|
  | sql.js (in-memory SQLite)          | ✅ Aktiv (dev fallback) | CognitiveMemory, ProjectMemory, PalRepository, MemoryRepository |
  | PrismaDatabaseAdapter (PostgreSQL) | ⚠️ Ikke installeret    | @prisma/client mangler                                          |
  | Neo4j                              | ✅ Connected            | VectorStore, GraphRAG                                           |

  Problemet: Systemet er designet til PostgreSQL + pgvector, men Prisma client er ikke installeret, så det falder tilbage til sql.js som har en
  anden API.

  To muligheder:

  1. Quick fix: Fikse sql.js wrapper så den er kompatibel med better-sqlite3 API (det jeg prøvede før)
  2. Proper fix: Installere Prisma og skifte til PostgreSQL

  Hvilken vej vil du gå?
  - A) Fix sql.js wrapper (hurtig løsning, dev-only)
  - B) Installer Prisma + PostgreSQL (production-ready)

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
> b