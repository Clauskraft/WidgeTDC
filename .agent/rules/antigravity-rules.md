---
trigger: always_on
---

# Antigravity Architecture & Dev Rules

**Role:** You are an expert Full Stack Developer working on the "Antigravity" platform.
**Context:** This is a widget-based dashboard utilizing MCP (Model Context Protocol) for real-time backend communication.

## 1. PROJECT STRUCTURE & BOUNDARIES

- **Root:** Monorepo structure.
- **Frontend:** `apps/widget-board` (React 19, Vite, TypeScript).
- **Backend:** `apps/backend` (Express, TypeScript, WebSocket).
- **Shared:** `packages/shared` (Shared types, interfaces, utilities).
- **CRITICAL RULE:** Strict Separation. Never import backend code directly into frontend files. ALWAYS use the shared package for types.

## 2. TECH STACK & STANDARDS

- **Frontend:**
  - Use **React 19** features. Prefer Functional Components and Hooks.
  - Layouts: Use `react-grid-layout` for dashboard structure.
  - Styling: Ensure responsiveness.
- **Backend:**
  - **Runtime:** Node.js / Express.
  - **Real-time:** Use `ws` for the MCPWebSocketServer. **Do NOT use polling**; push updates via WebSocket.
  - **Database:** SQLite (Development). Prepare SQL structure suitable for future PostgreSQL migration.
- **Language:** TypeScript (Strict mode). **No `any`** unless absolutely necessary and documented why.

## 3. MCP (MODEL CONTEXT PROTOCOL) IMPLEMENTATION

The core communication layer is MCP. Follow these rules strictly:

- **Message Format:** All messages MUST adhere to the `MCPMessage` interface.
- **Routing:**
  - Register new tools in `src/mcp/mcpRouter.ts`.
  - Incoming messages route via `/api/mcp/route` (REST) or `/ws` (WebSocket).
- **Events:** Use the internal `EventEmitter` to forward updates to `WebSocketServer.ts`.
- **Broadcasting:** The `MCPWebSocketServer` must broadcast JSON messages to connected clients for state updates (e.g., `agents.status`).

## 4. WIDGET DEVELOPMENT WORKFLOW

When creating or modifying widgets in `apps/widget-board`:

1. **Registry:** You MUST register the widget in `widgetRegistry.js` with metadata, default size, and `settingsSchema`.
2. **Loading:** Use `React.lazy` and dynamic imports via Vite: `import(/* @vite-ignore */ path)`.
3. **State Persistence:**
   - Persist layout/active widgets in `localStorage`.
   - Persist specific widget configs under `widgetSettings-${id}` using the modal schema.
4. **Data Fetching:** Widgets MUST request data via MCP or the specialized `IDataSource` adapters, not raw fetch calls.

## 5. DATA & DATABASE GUIDELINES

- **Scrapers:** Implement the `Scraper` class in `src/utils/scraper.ts`. Ensure normalized data returns.
- **Adapters:** Use the `IDataSource` interface (`fetch`, `transform`) for external APIs.
- **Fallback Strategy:** ALWAYS implement fallback logic to read cached data from SQLite if live sources fail.
- **Schema (SQLite):**
  - `widgets`, `layouts` (UI state)
  - `mcp_resources` (Payloads)
  - `agents`, `agent_prompts`, `agent_runs` (AI Logic)
  - `memory_entities`, `memory_relations`, `memory_tags` (Knowledge Graph)
  - `raw_documents`, `structured_facts` (Data ingestion)

## 6. GIT & CI/CD FLOW

- **Branching:** `main` (Production ready), `feature/name` (short-lived).
- **Commit Checks:** Code must pass linting, TS compilation, and tests before pushing.
- **Docker:** Changes must be compatible with the multi-stage Dockerfile (Nginx serving frontend + backend).

## 7. CRITICAL SYSTEM MEMORY

- **Standard Apps:** The system currently includes: `AgentMonitorWidget`, `LocalScanWidget`, `KanbanWidget` (backed by memory_entities), `FeedIngestion`, and `SearchInterface`.
- **Impact Rule:** Ensure any changes to `memory_*` tables are reflected functionally in the `KanbanWidget`.
