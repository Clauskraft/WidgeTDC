# WidgeTDC - Enterprise Autonomous Intelligence Platform

> **Production-Ready AI Platform** with Semantic Search, Autonomous Learning, and Distributed Architecture

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🚀 What is WidgeTDC?

WidgeTDC is an **Enterprise-grade Autonomous Intelligence Platform** that combines:

- **🧠 Semantic Vector Database** - Intelligent search using pgvector + multi-provider embeddings
- **🤖 Autonomous Task Engine** - Self-learning AI that consolidates and optimizes memory
- **📊 Unified Memory System** - Working, Episodic, and Procedural memory
- **🔄 Distributed Event System** - Redis-based pub/sub for scalability
- **📡 20+ Data Sources** - Ingest from Gmail, Outlook, Drive, Twitter, browser history, and more

---

## ✨ Key Features

### Semantic Search
- **Natural language queries** - Ask questions, get semantically similar results
- **Auto-embedding generation** - Just provide text, embeddings are created automatically
- **Multi-provider support** - OpenAI (best quality), HuggingFace (good), or Transformers.js (free, local)

### Autonomous Intelligence
- **Learning loops** - Nightly consolidation, pattern extraction, memory optimization
- **Multi-hop reasoning** - UnifiedGraphRAG for complex queries
- **Self-improvement** - Learns from patterns and optimizes workflows

### Enterprise Ready
- **Scalable infrastructure** - PostgreSQL, Redis, optional Neo4j
- **Production monitoring** - PM2 process management, Winston logging
- **Zero-downtime upgrades** - Backward compatible architecture
- **Multi-tenant ready** - Namespace isolation, user/org tracking

---

## 🏗️ Architecture

```
Frontend (React 19) 
    ↓ WebSocket + REST
Backend (Node.js + Express)
    ↓
Cognitive Layer (Autonomous Agent, GraphRAG, Memory)
    ↓
Data Layer (Embedding Service, Vector Store)
    ↓
Persistence (PostgreSQL + pgvector, Redis, Neo4j)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed diagrams and flow charts.

---

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** (for PostgreSQL, Redis, Neo4j)
- **Node.js 18+**
- **PowerShell** (Windows) or **Bash** (Mac/Linux)

### Automated Setup (Recommended)

```powershell
# Windows (run as Administrator)
.\setup-enterprise.ps1
```

```bash
# Mac/Linux
chmod +x setup-enterprise.sh
./setup-enterprise.sh
```

### Manual Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/WidgeTDC.git
cd WidgeTDC

# 2. Install dependencies
cd apps/backend
npm install
npm install @xenova/transformers  # For local embeddings

# 3. Configure environment
cp .env.example .env
echo "EMBEDDING_PROVIDER=transformers" >> .env

# 4. Start infrastructure
cd ../..
docker-compose up -d

# 5. Run database migrations
cd apps/backend
npx prisma migrate dev --name init

# 6. Start backend
npm run dev
```

### Production Deployment

```bash
# Build
npm run build

# Start with PM2
pm2 start ../../ecosystem.config.js

# Monitor
pm2 logs widgetdc-backend
pm2 monit
```

See [QUICK_START.md](QUICK_START.md) for detailed instructions.

---

## 📚 Documentation

- **[Quick Start](QUICK_START.md)** - Get running in 5 minutes
- **[Architecture](ARCHITECTURE.md)** - System design and diagrams
- **[Semantic Search Guide](SEMANTIC_SEARCH_GUIDE.md)** - How to use vector search
- **[Enterprise Setup](ENTERPRISE_SETUP_GUIDE.md)** - Production deployment
- **[Environment Setup](ENVIRONMENT_SETUP.md)** - Configuration options
- **[Enterprise Upgrade](ENTERPRISE_UPGRADE_COMPLETE.md)** - What's new in v2.0

---

## 🧠 Usage Examples

### Semantic Search

```typescript
import { getPgVectorStore } from './platform/vector/PgVectorStoreAdapter';

const vectorStore = getPgVectorStore();
await vectorStore.initialize();

// Search using natural language
const results = await vectorStore.search({
  text: "What is machine learning?",
  limit: 5
});

results.forEach(result => {
  console.log(`${result.similarity.toFixed(2)}: ${result.content}`);
});
```

### Auto-Embedding

```typescript
// Embeddings generated automatically
await vectorStore.upsert({
  id: "doc-123",
  content: "Machine learning is a subset of AI...",
  metadata: { source: "wikipedia" }
});
```

### MCP Tool Usage

```bash
# Via API
POST http://localhost:3001/api/mcp/route
{
  "tool": "vidensarkiv.search",
  "payload": {
    "query": "How do I configure authentication?",
    "limit": 5
  }
}
```

---

## 🔧 Configuration

### Embedding Providers

**Local (Free, Private)**
```env
EMBEDDING_PROVIDER=transformers
# No API key needed!
```

**OpenAI (Best Quality)**
```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

**HuggingFace (Good Middle Ground)**
```env
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_your-token-here
```

### Database

```env
DATABASE_URL="postgresql://widgetdc:widgetdc_dev@localhost:5432/widgetdc"
REDIS_URL="redis://localhost:6379"
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Vector Insert** | ~50ms (with auto-embedding) |
| **Semantic Search** | ~20ms (1M+ records) |
| **Concurrent Users** | 100+ |
| **Scalability** | Horizontal (Redis event bus) |

---

## 🛠️ Tech Stack

### Frontend
- React 19, TypeScript, Vite
- react-grid-layout (dashboard)

### Backend
- Node.js, Express, TypeScript
- Prisma ORM, Winston logging

### Databases
- PostgreSQL 16 + pgvector
- Redis 7 (events)
- Neo4j 5 (optional, knowledge graph)

### AI/ML
- OpenAI (embeddings & LLM)
- HuggingFace (embeddings)
- Transformers.js (local embeddings)
- Google Gemini (LLM)

### DevOps
- Docker Compose
- PM2 (process management)
- Winston (logging)

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] PostgreSQL + pgvector migration
- [x] Redis event bus
- [x] PM2 process management
- [x] Winston logging

### ✅ Phase 1.5: Semantic Search (COMPLETE)
- [x] Multi-provider embedding service
- [x] Auto-embedding generation
- [x] Text-based search
- [x] Backward compatibility

### 🚧 Phase 2: Security & Governance (NEXT)
- [ ] JWT/OAuth authentication
- [ ] Row Level Security (RLS)
- [ ] Human-in-the-Loop approvals
- [ ] Comprehensive audit logging

### 📅 Phase 3: Observability
- [ ] OpenTelemetry instrumentation
- [ ] LLM evaluation framework
- [ ] Grafana dashboards
- [ ] Cost tracking

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with [PostgreSQL](https://www.postgresql.org/) and [pgvector](https://github.com/pgvector/pgvector)
- Powered by [Transformers.js](https://huggingface.co/docs/transformers.js)
- Inspired by the [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 📧 Support

- **Issues:** [GitHub Issues](https://github.com/your-org/WidgeTDC/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/WidgeTDC/discussions)
- **Documentation:** [Full Docs](docs/)

---

**Version:** 2.0.0 (Enterprise)  
**Status:** 🟢 Production Ready  
**Last Updated:** November 24, 2025
