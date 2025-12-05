# Frontend Visibility Analysis and Architecture Map

> **Note:** This analysis was created for the legacy widget-board frontend. The current frontend is `apps/matrix-frontend` (Matrix UI), which has a clean Vite configuration without the issues noted below. These notes are preserved for historical reference.

## Historical Issues (widget-board - now removed)
- **Port mismatch between tooling and Vite config:** `start-frontend.sh` and README instructed developers to open the app on port 5173, but the Vite dev server was configured for port 8888.
- **Missing runtime dependency:** `WidgeTDC_Pro.jsx` imported icons from `lucide-react`, but the package was absent from `package.json`.
- **Broken path alias:** The Vite alias mapped `@` to a non-existent nested path.

## Current Architecture (matrix-frontend)
- **Frontend (`apps/matrix-frontend`)**: Matrix UI - Vite/React single-page app bootstrapped from `main.tsx` → `App.tsx`, featuring MCP WebSocket integration via MCPContext.
- **Backend (`apps/backend`)**: Express server (`src/index.ts`) wiring REST endpoints for memory, SRAG, evolution, and PAL services, plus Model Context Protocol routing and WebSocket support for agent orchestration.
- **Shared packages (`packages/shared`)**: Type packages for MCP messages and domain entities consumed by both backend and widgets, enabling consistent typing across the stack.

## Environment Configuration
The matrix-frontend uses environment variables for backend connectivity:
- `VITE_API_URL` - Backend HTTP API endpoint (default: http://localhost:3001)
- `VITE_WS_URL` - Backend WebSocket endpoint (default: ws://localhost:3001)

See `apps/matrix-frontend/.env.example` for configuration template.
