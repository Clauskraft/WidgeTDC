# Repository Guidelines

## Project Structure & Module Organization
- `apps/backend` contains the Node/TypeScript GraphRAG, MCP, and integration services; integration and smoke specs sit in `apps/backend/src/tests` and mirror the service tree.
- `apps/matrix-frontend` houses the Vite/React dashboard; UI assets live in `apps/matrix-frontend/public`, while component hooks keep colocated specs under `__tests__`.
- Shared contracts reside in `packages/domain-types` and `packages/mcp-types`; rebuild them before consuming new DTOs elsewhere.
- Packaging layers live in `desktop-app` and automation reference material in `agents/`, `docs/`, `scripts/`, and `tests/`.

## Build, Test, and Development Commands
- `npm install` (repo root) hydrates all workspaces.
- `npm run dev` launches backend + widget board; use `npm run dev:backend` or `npm run dev:frontend` when debugging one surface.
- `npm run build` compiles shared packages, backend, and frontend; follow with `npm run build:desktop[:os]` for installers.
- `npm run lint`, `npm run lint:fix`, and `npm run format:check` keep ESLint/Prettier baselines; run them before opening a PR.
- `npm run test`, `npm run test:coverage`, and `node run-comprehensive-tests.js` cover unit, coverage-gated, and long smoke paths.

## Coding Style & Naming Conventions
- TypeScript first, strict mode on; avoid `any` and prefer typed service interfaces from `/packages`.
- Prettier enforces two-space indent, single quotes, and trailing commas; `.editorconfig` matches this setup.
- React components use `PascalCase`, hooks `useCamelCase`, feature folders remain kebab-case, and env files stay uppercase snake case (`.env.PROFILE`).

## Testing Guidelines
- Write `*.test.ts` for units, `*.integration.test.ts` for cross-service flows, and colocate specs with the code aside from backend suites that belong in `apps/backend/src/tests`.
- Vitest + Testing Library cover UI logic; backend suites lean on Neo4j fixtures and GraphRAG mocks documented in `tests/README`.
- Aim for ≥80% statement coverage on adapters and persistence layers (`npm run test:coverage`), and attach coverage deltas to PRs when dipping.
- Use Playwright (`npx playwright test`) only after `npm run build:frontend` passes locally.

## Commit & Pull Request Guidelines
- Follow the existing conventional commit style (`feat(scope):`, `fix(scope):`, etc.) and mention ticket IDs in the subject or body.
- Keep commits focused (types, backend, matrix-frontend) and push only formatted, lint-clean diffs.
- PRs must include a summary, reproduction/validation steps, linked issues, and screenshots or API traces for UI/API work; mention relevant docs under `docs/`.
- Before requesting review, rerun `npm run lint`, `npm run test`, `npm run build`, and document any suites intentionally skipped.

## Security & Configuration Tips
- Never commit credentials; seed secrets by copying `.env.example` to `.env`, `.env.local`, or profile-specific files and rotate through `switch-env.ps1`.
- Review `security/` threat notes before exposing endpoints, and scrub PII from `logs/` or `monitoring/` artifacts shared externally.
- Desktop builds embed frontend assets—validate `.env.production` overrides before tagging a release.
