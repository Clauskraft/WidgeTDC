# WidgeTDC Project Overview

## 🎯 Project Purpose
WidgeTDC is an enterprise widget framework designed to outperform Microsoft dashboards with:
- Intelligent widget ecosystem with MCP Foundation core architecture
- Five specialized AI-powered services (CMA, SRAG, Evolution, MCP Inspector, AI PAL)
- Enterprise-grade multi-tenant backend
- Real-time widget communication via WebSocket
- Personal workflow optimization and decision support

**Business Goal**: €10M ARR platform launch (Mar 1, 2026)

## 🏗️ Architecture
- **Frontend**: React 19 + TypeScript + Vite + React Grid Layout (responsive dashboard)
- **Backend**: Node.js/Express + TypeScript + SQLite (dev) → PostgreSQL (prod)
- **Communication**: WebSocket + MCP (Model Context Protocol) for widget-service messaging
- **Database**: 11 SQLite tables (Memory, SRAG, Evolution, PAL services)
- **Shared**: npm Workspaces with @widget-tdc packages

## 📦 Monorepo Structure
```
WidgeTDC/
├── apps/
│   ├── backend/ → Node.js API server + MCP router
│   └── widget-board/ → React frontend dashboard
├── packages/
│   └── shared/
│       ├── mcp-types/ → MCP message interfaces
│       └── domain-types/ → Domain entity types
```

## 🚀 Current Phase (Nov 18 - Dec 20, 2025)
**Phase 1.B** (Dec 1-15): Dashboard Shell Professionalization
**Phase 1.C** (Dec 16-20): Component Design System + Quality Gate

### Phase 1.B Deliverables (184 story points)
- Block 1: Dashboard Shell Pro-ready (18 pts)
- Block 2: Widget Registry 2.0 Type-safe (42 pts)  
- Block 3: Audit Log Hash-Chain (40 pts)
- Block 4: Foundation Systems - DB, Auth, Observability (50 pts)
- Block 5: E2E Testing Acceleration (32 pts)
- Block 6: Compliance & Security Review (28 pts)

## 👥 Team Structure
- **30 AI Agents** organized in 7 functional teams
- **8 Specialized Agents** (domain expert leadership nodes)
- **8 Human Specialists** being hired (€560-860K investment)
  - Database Architect (Nov 20)
  - Security Architect (Nov 20)
  - DevOps/SRE Engineer (Nov 25)
  - QA Automation Lead (Dec 1)
  - Backend Platform Engineer (Dec 1)
  - MCP Platform Architect (Dec 1) **CRITICAL**
  - Frontend Performance Specialist (Dec 15)
  - Technical Product Manager (Jan 1)

## 📊 Key Files
- `README.md` - Quick start guide
- `ARCHITECTURE.md` - Detailed architecture
- `BACKLOG.txt` - 11 future backlog items + 10 earth-rocking insights
- `PHASE_1B_EXECUTION_PLAN.md` - Dec 1-15 execution plan
- `PHASE_1C_EXECUTION_PLAN.md` - Dec 16-20 quality gate
- `project_dashboard.html` - Visual project tracking (🔴 NEEDS UPDATE for Phase 1.B)

## 🔧 Development Commands

### Installation
```bash
npm install                    # Install all dependencies
npm run build                  # Build all packages
```

### Running
```bash
cd apps/backend && npm run dev # Backend on :3001
cd apps/widget-board && npm run dev # Frontend on :5173
```

### Quality Assurance
```bash
npm run lint                   # Check code style
npm run lint:fix              # Fix style issues
npm run format                # Format all code
npm run test                  # Run all tests
npm run test:coverage         # Coverage report
```

### Database
```bash
cd apps/backend
npm run build
node dist/database/seeds.js   # Seed test data
```

## 📋 Code Style & Conventions

### TypeScript
- Strict mode enabled
- Interfaces for all public APIs
- Enums for constants
- Named exports preferred

### Naming
- Components: PascalCase (UserDashboard.tsx)
- Functions/variables: camelCase (getUserData)
- Constants: UPPER_SNAKE_CASE (MAX_RETRIES)
- Files: kebab-case (user-service.ts)

### Structure
- Features organized by domain (backend/src/services/)
- Tests colocated with source (__tests__/)
- Shared types in packages/shared/
- MCP handlers in backend/src/mcp/

## 🧪 Quality Gates Before Commit
1. ✅ Run `npm run lint:fix` (ESLint + Prettier)
2. ✅ Run `npm run test` (Vitest)
3. ✅ Check TypeScript compilation (`npm run build`)
4. ✅ Update documentation if APIs change
5. ✅ Add tests for new functionality

## ⚡ Critical Priorities
1. **MCP Foundation** - Core architecture (CRITICAL hire: MCP Platform Architect)
2. **Database Migration** - SQLite→PostgreSQL (Nov 20 start: Database Architect)
3. **Multi-Tenancy + Auth** - Missing in Phase 1 (Nov 20 start: Security Architect)
4. **Observability** - OpenTelemetry + distributed tracing (Nov 25 start: DevOps/SRE)

## 🎯 Success Criteria (Phase 1.C Quality Gate - Dec 20)
- 🟢 PASS: All 184 story points delivered + 95% test coverage
- 🟡 CONDITIONAL: Minor fixes needed (1-3 items) - can proceed with conditions
- 🔴 FAIL: Major blockers - remediation needed before Phase 2

## 📅 Timeline
- Dec 1: Phase 1.B kickoff (30 agents activated, specialists start)
- Dec 5, 10, 15: Progress checkpoints
- Dec 20: Phase 1.C quality gate (go/no-go decision)
- Jan 1: Phase 2.A begins (if Phase 1.C passed)
- Mar 1: Go-live (Production deployment)
