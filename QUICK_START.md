# 🚀 Quick Start Guide

## Fastest Way to Get Running

### Option 1: Automated Setup (Recommended)

Run the setup script as Administrator:

```powershell
# Run PowerShell as Administrator
.\setup-enterprise.ps1
```

This will:
- Clean and reinstall dependencies
- Install @xenova/transformers for local embeddings
- Create .env file with correct settings
- Generate Prisma client

### Option 2: Manual Setup

```bash
# 1. Install dependencies
cd apps/backend
npm install
npm install @xenova/transformers

# 2. Configure environment
cp .env.example .env
# Add this line to .env:
echo "EMBEDDING_PROVIDER=transformers" >> .env

# 3. Generate Prisma client
npx prisma generate

# 4. Start Docker services
cd ../..
docker-compose up -d

# 5. Run database migrations
cd apps/backend
npx prisma migrate dev --name init

# 6. Build and run
npm run build
npm run dev
```

### Option 3: Production Setup (PM2)

```bash
# After manual setup above:

# Build
npm run build

# Start with PM2
pm2 start ../../ecosystem.config.js

# Monitor
pm2 logs widgetdc-backend
pm2 monit
```

## Troubleshooting

### Permission Errors (EACCES)
**Solution:** Run PowerShell/terminal as Administrator

### .env File
Cannot be committed to git (it's in .gitignore for security).

**What to add:**
```env
DATABASE_URL="postgresql://widgetdc:widgetdc_dev@localhost:5432/widgetdc?schema=public"
REDIS_URL="redis://localhost:6379"
NODE_ENV="development"
PORT=3001
EMBEDDING_PROVIDER="transformers"
```

### First Run Slow
Transformers.js downloads ~50MB model on first use. Subsequent runs are fast.

### Using OpenAI Instead (Better Quality)
```env
EMBEDDING_PROVIDER="openai"
OPENAI_API_KEY="sk-your-key-here"
```

## Verify It Works

```bash
# Check services
docker ps
# Should show: postgres, redis, neo4j

# Check backend
pm2 status
# Or if using npm run dev, check console output

# Look for these log messages:
# ✅ PostgreSQL + pgvector initialized
# 🧠 PgVector Store initialized (transformers, 384D)
# 🔴 Using Redis Event Bus OR 💾 Using In-Memory Event Bus
```

## Test Semantic Search

Once running, test via API:

```bash
# Insert some test data (embeddings generated automatically)
POST http://localhost:3001/api/mcp/route
{
  "tool": "vidensarkiv.add",
  "payload": {
    "content": "Machine learning is a subset of artificial intelligence"
  }
}

# Search semantically
POST http://localhost:3001/api/mcp/route
{
  "tool": "vidensarkiv.search",
  "payload": {
    "query": "What is AI?",
    "limit": 5
  }
}
```

---

**Status:** Everything is ready. Just need to run setup script or manual steps above.
