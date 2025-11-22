# Architecture Overview

## 1. High‑Level State Overview

- **Main branch** is the production‑ready baseline (`main`).
- Feature branches are short‑lived, prefixed with `feature/`.
- All widget‑related changes live in `apps/widget-board`.
- Backend lives in `apps/backend`.
- Shared types in `packages/shared`.

## 2. Core Architecture

- **Frontend** (`apps/widget-board`): React 19 + Vite, TypeScript, `react‑grid‑layout` for drag‑&‑drop, dynamic widget loading via `widgetRegistry.js`.
- **Backend** (`apps/backend`): Express + TypeScript, SQLite (dev) / PostgreSQL (future), WebSocket server (`ws`) for real‑time MCP push.
- **MCP (Model Context Protocol)**: Central message format (`MCPMessage`) used by widgets to call backend tools via `/api/mcp/route` and receive events via WebSocket `/ws`.
- **WebSocket Layer**: `MCPWebSocketServer` broadcasts events (e.g., agent status, widget data) to all connected clients, eliminating polling.

## 3. Global MCP Setup

- **Resource Registry** (`src/mcp/mcpRouter.ts`): Registers tools (`agents.status`, `memory.contextual-prompt`, etc.).
- **Tool Routing**: Incoming MCP messages are dispatched to the appropriate service handler.
- **Event Bus**: Internal `EventEmitter` forwards updates to WebSocket server.
- **WebSocket Server** (`src/mcp/servers/WebSocketServer.ts`): Handles client connections, broadcasts JSON messages.

## 4. Widget System

- **Widget Registry** (`widgetRegistry.js`): Lists all 36 widgets with metadata, default size, and optional `settingsSchema`.
- **Dynamic Loading**: `loadWidget` uses `React.lazy` + Vite `import(/* @vite-ignore */ path)`.
- **Layout Persistence**: `localStorage` stores `activeWidgets` and `layout` JSON.
- **Per‑Widget Settings**: Modal reads `settingsSchema` and persists config under `widgetSettings-${id}`.

## 5. Data‑Source Discovery & Integration

- **Built‑in APIs**: Backend services expose REST endpoints (`/api/mcp/route`, `/api/memory/...`).
- **Scraper Framework** (`src/utils/scraper.ts` – placeholder): Allows defining a `Scraper` class with `fetch()` that returns normalized data; results are stored in SQLite tables.
- **Adapter Pattern**: Each data source implements `IDataSource` interface (`fetch`, `transform`). Widgets declare required sources; the platform auto‑injects them.
- **Fallback**: If a source is unavailable, the scraper returns cached data from SQLite.

## 6. Database Structure

- **SQLite (dev)** – tables:
  - `widgets` (id, name, config JSON)
  - `layouts` (userId, layout JSON)
  - `mcp_resources` (resourceId, type, payload JSON)
  - `agents` (agentId, status JSON)
  - `memory_entities`, `memory_relations`, `memory_tags`
  - `raw_documents`, `structured_facts`
  - `agent_prompts`, `agent_runs`
  - `pal_user_profiles`, `pal_focus_windows`, `pal_events`
- **Future**: Migration scripts for PostgreSQL.

## 7. Standard Apps / Widgets

- **AgentMonitorWidget** – real‑time agent status via WebSocket.
- **LocalScanWidget** – filesystem scan with configurable path/depth.
- **KanbanWidget** – board UI backed by `memory_entities`.
- **FeedIngestionWidget**, **SearchInterfaceWidget**, **ActivityStreamWidget** – security intelligence widgets.
- **CMA**, **SRAG**, **Evolution**, **PAL** – specialized AI‑assisted services.

## 8. Development & CI/CD Workflow

- **Branching**: `main` (stable), `feature/*` (short‑lived), `release/*` (pre‑release).
- **CI**: GitHub Actions run lint, TypeScript compile, tests, build Docker image, push to GHCR.
- **Docker**: Multi‑stage Dockerfile builds backend + frontend, serves via Nginx.
- **Release Process**: Merge `feature/*` via PR, require passing CI, then tag release (`vX.Y.Z`).

---
*This document is version‑controlled and will be kept up‑to‑date as the platform evolves.*
