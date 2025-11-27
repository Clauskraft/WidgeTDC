# Repository Guardrails & Best Practices

## 1. Monorepo Structure Integrity
To maintain a clean "One Source of Truth" architecture, the following rules must be strictly enforced:

### 🚫 Root Directory Restrictions
The root directory must **ONLY** contain:
- Project configuration (`package.json`, `tsconfig.json`, `.gitignore`, etc.)
- Core documentation (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`)
- Workspace folders (`apps/`, `packages/`, `docs/`, `scripts/`)

**NEVER** create:
- Source code folders (`src/`, `utils/`, `components/`) in root.
- Random script files (`.py`, `.sh`, `.bat`) in root.
- Temporary folders (`temp/`, `debug/`) in root.

### 📂 File Placement Guide
| Type | Correct Location |
|------|------------------|
| **Frontend Code** | `apps/widget-board/src/` |
| **Backend Code** | `apps/backend/src/` |
| **Shared Types** | `packages/domain-types/` or `packages/mcp-types/` |
| **Shared Logic** | `packages/shared-utils/` (Future) |
| **Documentation** | `docs/{category}/` (e.g., `docs/architecture/`) |
| **Scripts** | `scripts/` |
| **Design Assets** | `design-references/` |

## 2. Development Workflow

### 📦 Dependency Management
- **Root `package.json`**: Only for dev-dependencies (eslint, typescript, vitest) and orchestration scripts.
- **App `package.json`**: Application-specific dependencies (react, express, etc.) must live in `apps/{app-name}/package.json`.

### 🔄 Single Command Start
Always use the root `npm run dev` to start the full stack. This ensures all services run in the correct context with correct environment variables.

## 3. Documentation Standards
- **Consolidation**: Do not create new `.md` files in root for status updates. Update existing files in `docs/status/`.
- **Archive**: When a feature is complete or a document is obsolete, move it to `docs/archive/` instead of leaving it to clutter the active documentation.

## 4. Automated Enforcement (Future)
To ensure these rules are followed, we will implement:
- **Husky Hooks**: Pre-commit checks to prevent committing files in root.
- **Lint-Staged**: Ensure all committed code passes linting.
- **CI Checks**: Fail build if unauthorized directories appear in root.
