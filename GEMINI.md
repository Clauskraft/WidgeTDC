# WidgeTDC - Neural Command Center

> **Context for Gemini:** This is an Enterprise AI Platform designed for cybersecurity and OSINT analysis, featuring a React 19 frontend, Node.js backend, and a complex data layer (Neo4j, PostgreSQL + pgvector).

## 🌍 Project Overview

**WidgeTDC** is a neural interface for data analysis, integrating real-time knowledge graphs, AI agents, and automation tools. It operates as a "Neural Command Center" with a widget-based UI.

### Key Tech Stack
*   **Frontend:** React 19, Vite, Tailwind CSS v4, Zustand, TypeScript.
*   **Backend:** Node.js, Express, WebSocket (MCP implementation), Gemini AI.
*   **Database:** PostgreSQL (pgvector), Neo4j (Graph), Redis (Cache/Events).
*   **Infrastructure:** Docker, Docker Compose, PM2.
*   **Protocol:** Custom Model Context Protocol (MCP) implementation for agent communication.

## 📂 Directory Structure

The project follows a monorepo structure:

*   **`apps/`**
    *   **`backend/`**: Node.js Express API, MCP WebSocket server, AI agents (`src/cognitive/`), and OmniHarvester pipeline.
    *   **`widget-board/`**: React 19 frontend, Widget implementations (`src/widgets/`), and 3D Knowledge Graph visualizations.
*   **`packages/`**
    *   **`shared/`**: Shared TypeScript types (`mcp-types`, `domain-types`) and utilities.
*   **`monitoring/`**: Prometheus and Grafana configurations.
*   **`scripts/`**: PowerShell automation scripts (e.g., `setup-enterprise.ps1`, `update_agent.ps1`).
*   **`desktop-app/`**: Electron-based desktop wrapper (implied by scripts).

## 🚀 Development Workflow

### Prerequisites
*   Node.js 20+
*   Docker Desktop (WSL2 on Windows)

### Start Development
To start both frontend and backend in development mode:

```bash
npm run dev
```
*   **Frontend:** http://localhost:8888
*   **Backend:** http://localhost:3001

### Docker Environment
To spin up the full infrastructure (Postgres, Neo4j, Redis, etc.):

```bash
docker-compose up -d --build
```

### Building
```bash
npm run build  # Builds shared packages, backend, and frontend
```

### Testing
```bash
npm test       # Runs Vitest
npm run test:ui # Opens Vitest UI
```

## 🧠 Agentic Architecture (Context for AI)

When working on this codebase, be aware of:
1.  **MCP (Model Context Protocol):** The backend exposes tools via WebSockets. New capabilities should often be exposed as MCP tools.
2.  **UnifiedGraphRAG:** The system uses a hybrid RAG approach combining vector search (Postgres) and graph traversal (Neo4j).
3.  **Autonomous Task Engine:** Located in `apps/backend/src/cognitive/AutonomousAgent.ts`. It handles self-directed goals.
4.  **Widgets:** The UI is modular. Widgets are self-contained components located in `apps/widget-board/src/widgets/`.

## 🛠️ Key Commands Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start full stack dev environment |
| `npm run build` | Production build for all workspaces |
| `npm run lint:fix` | Fix linting errors (ESLint) |
| `npm run format` | Format code (Prettier) |
| `docker-compose logs -f` | Tail Docker logs |

## ⚠️ Important Notes
*   **Legacy Peer Deps:** `npm install` often requires `--legacy-peer-deps`.
*   **Environment Variables:** See `.env.example`. Key variables include `GEMINI_API_KEY`, `NEO4J_URI`, and `POSTGRES_HOST`.
*   **Tailwind v4:** The project recently migrated to Tailwind v4. Use standard CSS in `App.css` instead of `@apply`.
