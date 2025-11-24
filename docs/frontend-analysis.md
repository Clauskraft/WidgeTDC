# Frontend Visibility Analysis and Architecture Map

## Why the frontend is not showing correctly
- **Port mismatch between tooling and Vite config:** `start-frontend.sh` and README instruct developers to open the app on port 5173, but the Vite dev server is configured for port 8888. When developers follow the documented URL they hit the wrong port and see nothing rendered. Aligning the configured port (or the documentation) is required for the app to appear. 
- **Missing runtime dependency:** `WidgeTDC_Pro.jsx` imports several icons from `lucide-react`, but the package is absent from `package.json`. `npm run dev` therefore fails with a module resolution error before the UI can render.
- **Broken path alias:** The Vite alias maps `@` to `<repo>/apps/widget-board/apps/widget-board`, a non-existent path. Any future use of the alias will fail to resolve, increasing the risk of blank screens once the alias is referenced.

## Architecture map (high level)
- **Frontend (`apps/widget-board`)**: Vite/React single-page app bootstrapped from `index.tsx` → `App.tsx` → `WidgeTDC_Pro.jsx`, which orchestrates dynamic widget loading and grid layout management.
- **Backend (`apps/backend`)**: Express server (`src/index.ts`) wiring REST endpoints for memory, SRAG, evolution, and PAL services, plus Model Context Protocol routing and WebSocket support for agent orchestration.
- **Shared packages (`packages/shared`)**: Type packages for MCP messages and domain entities consumed by both backend and widgets, enabling consistent typing across the stack.

## Code review observations / potential issues
- Update the Vite dev server port or the developer scripts so they agree; otherwise the documented URL will keep failing.
- Add `lucide-react` to the frontend dependencies to satisfy the icon imports and allow the bundle to compile.
- Fix the `@` path alias to point at the frontend source (e.g., `path.resolve(__dirname, 'src')`) before it is used in imports.
- Consider updating the README to reflect the actual dev server port after alignment to avoid onboarding confusion.
