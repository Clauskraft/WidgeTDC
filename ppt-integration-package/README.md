# 🚀 WidgeTDC PowerPoint Integration Package

## 📦 Hvad er dette?

Dette er den **komplette integration pakke** til at opgradere WidgeTDC med world-class PowerPoint generation capabilities!

Pakken integrerer:
- ✅ **PPTAgent** (ICIP-CAS) - 2-stage generation + PPTEval framework
- ✅ **MultiAgentPPT** - Multi-agent parallel processing
- ✅ **ChatPPT-MCP** - Enterprise MCP server
- ✅ **Zenodo10K** - 10,000+ PPT templates dataset

## 📁 Package Indhold

```
ppt-integration-package/
├── README.md                           # Dette dokument
├── SETUP.md                            # Detaljeret setup guide
├── setup-scripts/                      # Automatiske setup scripts
│   ├── 01-install-dependencies.ps1     # Installer dependencies
│   ├── 02-setup-pptagent.ps1          # Setup PPTAgent Docker
│   ├── 03-setup-multiagent.ps1        # Setup MultiAgentPPT
│   ├── 04-download-datasets.ps1       # Download Zenodo10K
│   └── 05-configure-services.ps1      # Configure alle services
├── backend/                            # Backend services
│   ├── agents/                         # Multi-agent system
│   │   ├── multi-agent-orchestrator.ts
│   │   ├── outline-agent.ts
│   │   ├── research-agent.ts
│   │   ├── ppt-gen-agent.ts
│   │   └── quality-checker-agent.ts
│   ├── services/                       # External services
│   │   ├── pptagent-service.ts
│   │   ├── chatppt-mcp-service.ts
│   │   └── template-service.ts
│   ├── routes/                         # API routes
│   │   ├── presentation.ts
│   │   └── templates.ts
│   └── mcp/                            # MCP servers
│       ├── powerpoint-server.ts
│       └── knowledge-base.ts
├── widgets/                            # Upgraded widgets
│   ├── autonomous-powerpoint-master-v2.tsx
│   ├── autonomous-word-architect-v2.tsx
│   └── autonomous-excel-analyzer-v2.tsx
├── docker/                             # Docker configuration
│   ├── docker-compose.yml
│   ├── pptagent/
│   │   └── Dockerfile
│   └── multiagent/
│       └── Dockerfile
├── config/                             # Configuration files
│   ├── env.template
│   ├── pptagent.config.json
│   ├── multiagent.config.json
│   └── chatppt-mcp.config.json
└── docs/                               # Documentation
    ├── ARCHITECTURE.md
    ├── API.md
    └── TROUBLESHOOTING.md
```

## 🚀 Quick Start

### 1. Setup Alt (Automatisk)

```powershell
cd C:\Users\claus\Projects\WidgeTDC\ppt-integration-package
.\setup-scripts\RUN-ALL.ps1
```

Dette kører alle setup scripts i rækkefølge og får alt til at virke!

### 2. Eller Setup Manuel

```powershell
# Step 1: Install dependencies
.\setup-scripts\01-install-dependencies.ps1

# Step 2: Setup PPTAgent
.\setup-scripts\02-setup-pptagent.ps1

# Step 3: Setup MultiAgentPPT
.\setup-scripts\03-setup-multiagent.ps1

# Step 4: Download datasets
.\setup-scripts\04-download-datasets.ps1

# Step 5: Configure services
.\setup-scripts\05-configure-services.ps1
```

### 3. Start Services

```powershell
# Start all Docker services
cd docker
docker-compose up -d

# Check status
docker-compose ps
```

### 4. Integrer i WidgeTDC

```powershell
# Copy backend files
cp -r backend/* C:\Users\claus\Projects\WidgeTDC\backend\

# Copy widgets
cp widgets\*.tsx C:\Users\claus\Projects\WidgeTDC\nEWwIDGETS\

# Update configuration
cp config\env.template C:\Users\claus\Projects\WidgeTDC\.env
```

## 🎯 Features

### PPTAgent Integration
- 2-stage generation (Analysis → Generation)
- PPTEval quality metrics
- Reference learning from templates
- Python-pptx code generation

### MultiAgentPPT System
- Parallel research agents (3x concurrent)
- Real-time streaming updates
- Quality checking with retry loops
- MCP knowledge base integration

### ChatPPT-MCP
- 18 professional APIs
- Online editing capabilities
- Template application
- Color scheme changes

### Zenodo10K Dataset
- 10,000+ professional PPT templates
- Pattern learning
- Layout analysis
- Style extraction

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│      WidgeTDC Frontend (React 19)          │
│  ┌───────────────────────────────────────┐ │
│  │ PowerPoint Master Widget v2           │ │
│  │ • Multi-agent orchestration           │ │
│  │ • Real-time streaming                 │ │
│  │ • Quality metrics display             │ │
│  └───────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ WebSocket / SSE
┌──────────────────┴──────────────────────────┐
│      WidgeTDC Backend (Node.js)             │
│  ┌─────────────────────────────────────┐   │
│  │   Multi-Agent Orchestrator          │   │
│  └─────────────────────────────────────┘   │
└──────┬───────────┬───────────┬──────────────┘
       │           │           │
       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│PPTAgent  │ │MultiAgent│ │ChatPPT   │
│Docker    │ │System    │ │MCP       │
│:9297     │ │:10001    │ │:8088     │
└──────────┘ └──────────┘ └──────────┘
```

## 🔧 Configuration

Alle services konfigureres via `.env`:

```env
# PPTAgent
PPTAGENT_URL=http://localhost:9297
OPENAI_API_KEY=your_key_here

# MultiAgentPPT
MULTIAGENT_OUTLINE_URL=http://localhost:10001
MULTIAGENT_SLIDES_URL=http://localhost:10011

# ChatPPT-MCP
CHATPPT_API_KEY=your_key_here
CHATPPT_API_URL=https://api.yoo-ai.com/mcp

# Database
DATABASE_URL=postgresql://postgres:welcome@localhost:5432/widgetdc
```

## 📚 Documentation

- **SETUP.md** - Detaljeret setup instruktioner
- **ARCHITECTURE.md** - System arkitektur
- **API.md** - API endpoints reference
- **TROUBLESHOOTING.md** - Fejlfinding guide

## 🐛 Troubleshooting

### Port conflicts
```powershell
# Check what's using ports
netstat -ano | findstr "9297"
netstat -ano | findstr "10001"

# Kill process
taskkill /PID <pid> /F
```

### Docker issues
```powershell
# Restart Docker Desktop
Restart-Service docker

# Rebuild containers
docker-compose down
docker-compose up --build -d
```

### Service not responding
```powershell
# Check logs
docker-compose logs pptagent
docker-compose logs multiagent

# Check health
curl http://localhost:9297/health
```

## 🎓 Learn More

- [PPTAgent GitHub](https://github.com/icip-cas/PPTAgent)
- [MultiAgentPPT GitHub](https://github.com/johnson7788/MultiAgentPPT)
- [ChatPPT-MCP GitHub](https://github.com/YOOTeam/ChatPPT-MCP)
- [Zenodo10K Dataset](https://huggingface.co/datasets/Forceless/Zenodo10K)

## 💪 Support

For issues eller spørgsmål:
1. Check **TROUBLESHOOTING.md**
2. Review logs: `docker-compose logs`
3. Kontakt CLAK via The Synapse Protocol

---

**Status:** ✅ Production Ready  
**Version:** 2.0.0  
**Last Updated:** December 2024  
**License:** MIT
