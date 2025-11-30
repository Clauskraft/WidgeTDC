# 🧠 WidgeTDC - Neural Command Center

> **EU Digital Sovereignty Platform** | GDPR-Compliant Intelligence & Automation System

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](docker-compose.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](apps/widget-board)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.15-008CC1?logo=neo4j)](docker-compose.yml)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## 🎯 What is WidgeTDC?

WidgeTDC is a sophisticated **widget-based intelligence platform** designed for cybersecurity professionals, OSINT analysts, and executive decision-makers. It serves as a neural interface for data analysis, featuring real-time knowledge graphs, AI-powered insights, and comprehensive automation tools.

### Key Capabilities

- **42+ Widgets** across 9 specialized categories
- **11 MCP Tools** for AI-powered operations
- **Knowledge Graph** visualization with Neo4j integration
- **Real-time Monitoring** via Prometheus, Grafana & Loki
- **OmniHarvester** for intelligent data ingestion
- **GDPR-Compliant** architecture with EU data sovereignty

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     WidgeTDC Neural Command Center              │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React 19 + Vite)              Port 8888              │
│  ├── 42+ Interactive Widgets                                    │
│  ├── Real-time WebSocket Communication                          │
│  └── 3D Knowledge Graph Visualization                           │
├─────────────────────────────────────────────────────────────────┤
│  Backend (Node.js + Express)             Port 3001              │
│  ├── MCP WebSocket Server (11 Tools)                            │
│  ├── Gemini AI Integration                                      │
│  ├── RESTful API Layer                                          │
│  └── OmniHarvester Data Pipeline                                │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ├── PostgreSQL + pgvector         Port 5432                    │
│  ├── Neo4j Knowledge Graph         Port 7474/7687               │
│  ├── Redis Cache                   Port 6379                    │
│  └── SQLite (embedded)                                          │
├─────────────────────────────────────────────────────────────────┤
│  Observability Stack                                            │
│  ├── Prometheus                    Port 9090                    │
│  ├── Grafana                       Port 3000                    │
│  ├── Loki                          Port 3100                    │
│  └── NocoDB Admin                  Port 8080                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** with WSL2 (Windows) or Docker Engine (Linux/Mac)
- **Node.js 20+** (for local development)
- **8GB+ RAM** recommended

### One-Command Deployment

```bash
# Clone the repository
git clone https://github.com/ClausDesWorworworworworworworworworworworworworworwor/WidgeTDC.git
cd WidgeTDC

# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:8888 | - |
| **Backend API** | http://localhost:3001 | - |
| **Grafana** | http://localhost:3000 | admin / admin |
| **Neo4j Browser** | http://localhost:7474 | neo4j / password |
| **NocoDB** | http://localhost:8080 | - |
| **Prometheus** | http://localhost:9090 | - |

---

## 📁 Project Structure

```
WidgeTDC/
├── apps/
│   ├── backend/                 # Node.js API Server
│   │   ├── src/
│   │   │   ├── database/        # SQLite + schemas
│   │   │   ├── mcp/             # MCP WebSocket router
│   │   │   ├── services/        # Business logic
│   │   │   │   ├── memory/      # Contextual Memory Agent
│   │   │   │   ├── srag/        # Structured RAG
│   │   │   │   ├── evolution/   # Self-evolving agents
│   │   │   │   ├── pal/         # AI PAL assistant
│   │   │   │   └── ai/          # Gemini integration
│   │   │   └── harvester/       # OmniHarvester pipeline
│   │   └── Dockerfile
│   │
│   └── widget-board/            # React 19 Frontend
│       ├── src/
│       │   ├── widgets/         # 42+ widget implementations
│       │   ├── components/      # Shared UI components
│       │   └── hooks/           # Custom React hooks
│       ├── nginx.conf           # Production server config
│       └── Dockerfile
│
├── packages/
│   └── shared/
│       ├── mcp-types/           # MCP message interfaces
│       └── domain-types/        # Domain entity types
│
├── monitoring/
│   ├── prometheus.yml           # Metrics configuration
│   └── grafana/                 # Dashboard provisioning
│
├── docker-compose.yml           # Full stack orchestration
└── README.md
```

---

## 🧩 Widget Categories

### 🔐 Cybersecurity & OSINT (15 widgets)
- Domain Intelligence
- IP Analysis
- Email Investigation
- Phone Number Lookup
- Geolocation Tools
- Dark Web Monitoring
- Threat Intelligence

### 🤖 AI & Machine Learning (8 widgets)
- Neural Core (ai.think, ai.analyze, ai.summarize, ai.extract)
- Knowledge Graph Explorer
- DNA Splicer (Code Analysis)
- Cyber Ops Dashboard

### 📊 Executive Decision Support (6 widgets)
- CMA Decision Assistant
- SRAG Data Governance
- KPI Monitor
- Strategic Dashboard

### 🔧 System & Development (13 widgets)
- MCP Inspector
- Harvest Control Panel
- System Logs Viewer
- Evolution Monitor
- AI PAL Assistant

---

## 🔌 MCP Tools Reference

The backend exposes **11 MCP tools** via WebSocket at `ws://localhost:3001/mcp/ws`:

| Tool | Description |
|------|-------------|
| `cma.context` | Contextual memory retrieval |
| `cma.ingest` | Memory ingestion pipeline |
| `srag.query` | Structured RAG queries |
| `evolution.report-run` | Agent evolution tracking |
| `evolution.get-prompt` | Prompt version retrieval |
| `pal.event` | User event logging |
| `pal.board-action` | Dashboard interactions |
| `ai.think` | Deep reasoning operations |
| `ai.analyze` | Data analysis tasks |
| `ai.summarize` | Content summarization |
| `ai.extract` | Entity extraction |

---

## 🔧 Development

### Local Development Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build shared packages
npm run build -w packages/shared/mcp-types
npm run build -w packages/shared/domain-types

# Start backend (Terminal 1)
cd apps/backend && npm run dev

# Start frontend (Terminal 2)
cd apps/widget-board && npm run dev
```

### Environment Variables

Create `.env` file in project root:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Security
JWT_SECRET=your_secure_jwt_secret

# Database (optional - defaults work with Docker)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=widgetdc
POSTGRES_PASSWORD=widgetdc_dev
POSTGRES_DB=widgetdc

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📊 API Examples

### Health Check
```bash
curl http://localhost:3001/health
```

### AI Operations
```bash
# Think deeply about a topic
curl -X POST http://localhost:3001/api/mcp/route \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "ai.think",
    "payload": {
      "prompt": "Analyze cybersecurity trends for 2025"
    }
  }'
```

### Memory Operations
```bash
# Ingest memory
curl -X POST http://localhost:3001/api/memory/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-1",
    "userId": "user-1",
    "entityType": "ThreatIntel",
    "content": "New APT group detected targeting EU infrastructure",
    "importance": 8,
    "tags": ["threat", "apt", "eu"]
  }'
```

### SRAG Queries
```bash
curl -X POST http://localhost:3001/api/srag/query \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-1",
    "naturalLanguageQuery": "What are the top security incidents this month?"
  }'
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Reset everything (including data)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend

# Check service status
docker-compose ps
```

---

## 🛡️ Security & Compliance

- **GDPR Compliant**: EU data sovereignty by design
- **Input Validation**: All API endpoints validated
- **SQL Injection Prevention**: Prepared statements only
- **Encrypted Communications**: TLS/SSL ready
- **Audit Logging**: Full activity trails
- **Role-Based Access**: Configurable permissions

---

## 🗺️ Roadmap

### Current (v2.0)
- [x] 42+ widgets operational
- [x] 11 MCP tools integrated
- [x] Docker orchestration
- [x] Neo4j knowledge graph
- [x] Gemini AI integration
- [x] Prometheus/Grafana monitoring

### Next (v3.0)
- [ ] Expand to 210+ widgets
- [ ] 54 MCP tools
- [ ] ThreeBrain 3D neural visualization
- [ ] 47 HuggingFace model integrations
- [ ] SpørEngine autonomous investigations
- [ ] Enterprise SSO integration

---

## 📄 License

**Proprietary** - All rights reserved.

---

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes with tests
3. Update documentation
4. Submit pull request

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Issues**: GitHub Issues

---

<p align="center">
  Built with 🧠 for Intelligence Operations<br>
  <strong>WidgeTDC Neural Command Center</strong>
</p>
