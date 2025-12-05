# Codespace Quickstart (GitHub Codespaces)

WidgeTDC is fully configured for GitHub Codespaces with auto-start of all services.

## Quick Start (Auto-Start)

1. **Create Codespace**: Click **Code > Create codespace on main**
2. **Wait for setup**: The devcontainer automatically:
   - Installs dependencies
   - Configures PostgreSQL + pgvector, Redis, Neo4j
   - Generates Prisma client and syncs database
   - Starts backend (port 3001) and frontend (port 5173)
3. **Open the app**: Click the forwarded port 5173 notification

That's it! The system is running.

## Manual Control

### Check service status
```bash
# View logs
tail -f .devcontainer/logs/backend.log
tail -f .devcontainer/logs/frontend.log

# Health check
curl http://localhost:3001/health
```

### Restart services
```bash
# Stop running services
pkill -f "node.*backend" || true
pkill -f "vite" || true

# Start again
bash .devcontainer/start-services.sh
```

### Run in foreground (for debugging)
```bash
# Terminal 1: Backend
cd apps/backend && npm run dev

# Terminal 2: Frontend
cd apps/matrix-frontend && npm run dev -- --host 0.0.0.0
```

## Services & Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | Auto-opens in browser |
| Backend API | 3001 | `http://localhost:3001` |
| Neo4j Browser | 7474 | `http://localhost:7474` |
| PostgreSQL | 5432 | Internal only |
| Redis | 6379 | Internal only |

## Environment Configuration

The Codespace uses `.env.codespace` which is auto-copied to `.env`:
- **PostgreSQL**: `postgres:5432` with pgvector extension
- **Redis**: `redis:6379`
- **Neo4j**: `neo4j:7687` (user: neo4j, pass: password)
- **Embeddings**: Local Transformers.js (no API key needed)

To add AI keys, edit `apps/backend/.env`:
```bash
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

## Recommended Codespace Size

- **Minimum**: 4-core / 8 GB RAM / 32 GB disk
- **Recommended**: 8-core / 16 GB RAM (faster builds)

## Troubleshooting

### Database connection failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart data services
docker compose -f .devcontainer/docker-compose.yml restart postgres redis neo4j
```

### Frontend won't start
```bash
cd apps/matrix-frontend
npm install
npm run dev -- --host 0.0.0.0
```

### Backend build errors
```bash
npm run build:shared   # Build shared packages first
cd apps/backend && npm run build
```
