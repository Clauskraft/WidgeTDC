# 🚀 WidgeTDC PowerPoint Integration - Setup Guide

## Oversigt

Denne guide hjælper dig med at integrere world-class PowerPoint generation i WidgeTDC!

**Hvad installeres:**
- ✅ PPTAgent (Docker) - 2-stage AI generation
- ✅ MultiAgentPPT - Multi-agent parallel system
- ✅ ChatPPT-MCP - Enterprise MCP server
- ✅ Zenodo10K - 10,000+ PPT templates
- ✅ PostgreSQL + Redis - Database & cache
- ✅ Upgraded widgets - New React components

**Estimeret tid:** 30-60 minutter

---

## 📋 Prerequisites

### Nødvendige programmer:
- ✅ Windows 10/11
- ✅ Docker Desktop
- ✅ Node.js 18+
- ✅ Python 3.11+
- ✅ Git + Git LFS
- ✅ PowerShell 5.1+

### API Keys (minimum 1 påkrævet):
- OpenAI API Key (PÅKRÆVET)
- ChatPPT API Key (valgfrit)

### Disk plads:
- ~15GB for datasets
- ~5GB for Docker images
- ~2GB for dependencies

---

## 🎯 Installation Method 1: AUTOMATISK (Anbefalet)

### Step 1: Download Integration Package

```powershell
# Naviger til WidgeTDC projekt
cd C:\Users\claus\Projects\WidgeTDC

# Pakken er allerede i: C:\Users\claus\Projects\WidgeTDC\ppt-integration-package
```

### Step 2: Kør Automatisk Setup

```powershell
# Naviger til setup scripts
cd ppt-integration-package\setup-scripts

# Kør alt setup automatisk
.\RUN-ALL.ps1
```

Dette script kører følgende i rækkefølge:
1. ✅ Checker og installerer dependencies
2. ✅ Setup PPTAgent Docker
3. ✅ Setup MultiAgentPPT
4. ✅ Downloader Zenodo10K dataset
5. ✅ Konfigurerer alle services

### Step 3: Indtast API Keys

Når scriptet beder om det, indtast dine API keys:

```
OpenAI API Key: sk-...
ChatPPT API Key: [Enter to skip if you don't have]
```

### Step 4: Start Services

```powershell
# Start alle Docker services
cd ..\docker
docker-compose up -d

# Check at alt kører
docker-compose ps
```

Du skulle se:
```
NAME                     STATUS
widgetdc-pptagent        Up (healthy)
widgetdc-outline         Up
widgetdc-slides          Up
widgetdc-postgres-ppt    Up
widgetdc-redis-ppt       Up
widgetdc-template-service Up
```

### Step 5: Integrer i WidgeTDC

```powershell
# Tilbage til package root
cd ..

# Copy backend filer
Copy-Item -Recurse backend\* C:\Users\claus\Projects\WidgeTDC\backend\

# Copy widgets
Copy-Item widgets\*.tsx C:\Users\claus\Projects\WidgeTDC\nEWwIDGETS\

# Copy configuration
Copy-Item config\.env C:\Users\claus\Projects\WidgeTDC\.env

Write-Host "✅ Integration complete!" -ForegroundColor Green
```

### Step 6: Restart WidgeTDC

```powershell
# Stop WidgeTDC hvis det kører
cd C:\Users\claus\Projects\WidgeTDC
docker-compose down

# Rebuild og start
docker-compose up --build -d

# Start frontend
cd frontend
npm run dev
```

### Step 7: Test Integration

1. Åbn WidgeTDC: http://localhost:5173
2. Find "Autonomous PowerPoint Master v2.0" widget
3. Indtast topic: "Test Presentation"
4. Klik "Generate Presentation"
5. Watch the magic! ✨

---

## 🛠️ Installation Method 2: MANUEL

### Step 1: Install Dependencies

```powershell
# Check Docker
docker --version

# Check Node.js
node --version

# Check Python
python --version

# Install Git LFS
git lfs install

# Install pnpm
npm install -g pnpm
```

### Step 2: Setup PPTAgent

```powershell
# Pull Docker image
docker pull forceless/pptagent

# Start container
docker run -dt --name pptagent `
  -e OPENAI_API_KEY=your_key_here `
  -p 9297:9297 -p 8088:8088 `
  -v "$env:USERPROFILE:/root" `
  forceless/pptagent

# Verify
curl http://localhost:9297/health
```

### Step 3: Setup MultiAgentPPT

```powershell
# Clone repository
cd C:\Users\claus\Projects
git clone https://github.com/johnson7788/MultiAgentPPT.git
cd MultiAgentPPT\backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environments
cd simpleOutline
Copy-Item env_template .env
# Edit .env with your API keys

cd ..\simplePPT
Copy-Item env_template .env
# Edit .env with your API keys

cd ..\slide_outline
Copy-Item env_template .env
# Edit .env with your API keys

cd ..\slide_agent
Copy-Item env_template .env
# Edit .env with your API keys
```

### Step 4: Download Zenodo10K

```powershell
# Create dataset directory
cd C:\Users\claus\Projects\WidgeTDC
New-Item -Path training-data -ItemType Directory -Force
cd training-data

# Clone dataset (WARNING: ~10GB download!)
git lfs clone https://huggingface.co/datasets/Forceless/Zenodo10K

# This will take 30-60 minutes depending on internet speed
```

### Step 5: Configure Services

Edit `.env` file in package root:

```env
# OpenAI
OPENAI_API_KEY=sk-your_key_here

# ChatPPT (optional)
CHATPPT_API_KEY=your_key_here

# PPTAgent
PPTAGENT_URL=http://localhost:9297

# MultiAgent
MULTIAGENT_OUTLINE_URL=http://localhost:10001
MULTIAGENT_SLIDES_URL=http://localhost:10011

# Database
DATABASE_URL=postgresql://postgres:welcome@localhost:5433/widgetdc_ppt

# Redis
REDIS_URL=redis://localhost:6380

# Paths
ZENODO10K_PATH=C:\Users\claus\Projects\WidgeTDC\training-data\Zenodo10K
```

### Step 6: Start Services

```powershell
# Start Docker services
cd C:\Users\claus\Projects\WidgeTDC\ppt-integration-package\docker
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 7: Start MultiAgent Services

```powershell
# Terminal 1: Outline Service
cd C:\Users\claus\Projects\MultiAgentPPT\backend\slide_outline
.\venv\Scripts\Activate.ps1
python main_api.py

# Terminal 2: Slides Service
cd C:\Users\claus\Projects\MultiAgentPPT\backend\slide_agent
.\venv\Scripts\Activate.ps1
python main_api.py
```

### Step 8: Integrer i WidgeTDC

Follow samme steps som Automatisk metode - Step 5, 6, 7.

---

## ✅ Verification Checklist

Efter setup, verificer at alt virker:

### Docker Services

```powershell
docker ps
```

Skal vise:
- ✅ widgetdc-pptagent (port 9297, 8088)
- ✅ widgetdc-outline (port 10001)
- ✅ widgetdc-slides (port 10011)
- ✅ widgetdc-postgres-ppt (port 5433)
- ✅ widgetdc-redis-ppt (port 6380)
- ✅ widgetdc-template-service (port 3010)

### API Endpoints

```powershell
# PPTAgent
curl http://localhost:9297/health

# MultiAgent Outline
curl http://localhost:10001/health

# MultiAgent Slides
curl http://localhost:10011/health

# Template Service
curl http://localhost:3010/health
```

Alle skal returnere status 200 OK.

### Database Connection

```powershell
# Test PostgreSQL
docker exec -it widgetdc-postgres-ppt psql -U postgres -d widgetdc_ppt -c "SELECT 1;"
```

Skal returnere:
```
 ?column? 
----------
        1
```

### Redis Connection

```powershell
# Test Redis
docker exec -it widgetdc-redis-ppt redis-cli ping
```

Skal returnere: `PONG`

---

## 🎓 Usage Examples

### Example 1: Basic Presentation

```typescript
const result = await fetch('http://localhost:3000/api/presentations/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'AI in Healthcare 2025',
    requirements: 'Target: Medical professionals. Focus on practical applications.'
  })
});

const { filePath, qualityScores } = await result.json();
console.log('Presentation ready:', filePath);
console.log('Quality:', qualityScores);
```

### Example 2: With Template Learning

```typescript
// First, analyze reference presentations
const analysis = await pptAgent.analyzeReferences([
  'path/to/template1.pptx',
  'path/to/template2.pptx'
]);

// Generate with learned patterns
const result = await orchestrator.generatePresentation({
  topic: 'Q4 Results',
  learnedPatterns: analysis.structural_patterns
});
```

### Example 3: Apply Enterprise Template

```typescript
// Generate presentation
const pptPath = await orchestrator.generatePresentation({ topic: 'Sales Report' });

// Apply professional template via ChatPPT-MCP
const finalPath = await chatPPT.applyTemplate(pptPath, 'corporate-blue');
```

---

## 🐛 Troubleshooting

### Problem: Docker services not starting

**Solution:**
```powershell
# Stop all containers
docker-compose down

# Remove old containers
docker system prune -a

# Restart Docker Desktop
Restart-Service docker

# Start again
docker-compose up -d
```

### Problem: Port conflicts

**Solution:**
```powershell
# Find what's using port
netstat -ano | findstr "9297"

# Kill process
taskkill /PID <pid> /F

# Or change port in docker-compose.yml
```

### Problem: API keys not working

**Solution:**
```powershell
# Check .env file exists and has correct format
Get-Content C:\Users\claus\Projects\WidgeTDC\.env

# Should show:
# OPENAI_API_KEY=sk-...
```

### Problem: Zenodo10K download stuck

**Solution:**
```powershell
# Cancel download (Ctrl+C)

# Check Git LFS
git lfs install

# Try again with verbose mode
GIT_TRACE=1 git lfs clone https://huggingface.co/datasets/Forceless/Zenodo10K
```

### Problem: Quality scores too low

**Solution:**
```powershell
# Check MIN_*_SCORE settings in .env
# Lower thresholds if needed:
MIN_CONTENT_SCORE=6.0
MIN_DESIGN_SCORE=6.0
MIN_COHERENCE_SCORE=6.0
```

---

## 🎉 Success!

Du har nu:
- ✅ World-class PPT generation
- ✅ Multi-agent parallel processing
- ✅ Quality evaluation framework
- ✅ 10,000+ template patterns
- ✅ Enterprise features

Next steps:
1. Explore widgets i WidgeTDC
2. Generate your first presentation
3. Experiment with different topics
4. Analyze quality metrics
5. Apply custom templates

---

## 📚 Further Reading

- **ARCHITECTURE.md** - System architecture details
- **API.md** - Complete API reference
- **TROUBLESHOOTING.md** - Advanced troubleshooting
- [PPTAgent GitHub](https://github.com/icip-cas/PPTAgent)
- [MultiAgentPPT GitHub](https://github.com/johnson7788/MultiAgentPPT)

## 💪 Support

Issues? Check:
1. This SETUP.md file
2. TROUBLESHOOTING.md
3. Docker logs: `docker-compose logs`
4. CLAK via The Synapse Protocol

---

**Version:** 2.0.0  
**Last Updated:** December 2024  
**Author:** CLAK + Claude (The Synapse Protocol)
