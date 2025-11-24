# Enterprise Upgrade: Setup Guide

## Prerequisites
- Docker Desktop installed and running
- Node.js 18+ 
- PM2 installed globally: `npm install -g pm2`

## Step-by-Step Setup

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis in detached mode
docker-compose up -d postgres redis

# Verify services are running
docker ps

# Check logs if needed
docker logs widgetdc-postgres
docker logs widgetdc-redis
```

### 2. Configure Environment

```bash
# Copy example env file
cd apps/backend
cp .env.example .env

# The DATABASE_URL and REDIS_URL should already be configured:
# DATABASE_URL="postgresql://widgetdc:widgetdc_dev@localhost:5432/widgetdc?schema=public"
# REDIS_URL="redis://localhost:6379"
```

### 3. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply database migrations
npx prisma migrate dev --name init

# This will:
# - Create the database schema
# - Enable the pgvector extension
# - Generate the Prisma Client types
```

### 4. Migrate Existing Data (Optional)

If you have existing SQLite data to migrate:

```bash
# Build the backend first
npm run build

# Run migration script
node dist/scripts/migrate-to-postgres.js
```

### 5. Build and Start Backend

```bash
# Build the backend
npm run build

# Start with PM2 (background mode)
pm2 start ../../ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs widgetdc-backend

# Stop backend
pm2 stop widgetdc-backend

# Restart backend
pm2 restart widgetdc-backend
```

### 6. Verify Everything Works

```bash
# Check Docker services
docker stats

# Should show minimal CPU/Memory usage:
# - postgres: < 512MB RAM, < 0.5 CPU
# - redis: < 256MB RAM, < 0.25 CPU

# Check PM2 status
pm2 status

# Backend should show: status=online, restart=0
```

## Development Workflow

### Accessing the Database

```bash
# Prisma Studio (GUI for database)
npx prisma studio

# Opens on http://localhost:5555
```

### Making Schema Changes

```bash
# 1. Edit schema in prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. Rebuild
npm run build
```

### Viewing Logs

```bash
# PM2 Logs (live tail)
pm2 logs widgetdc-backend

# File logs
tail -f logs/combined.log
tail -f logs/error.log

# Redis CLI
docker exec -it widgetdc-redis redis-cli
> KEYS widgetdc:events:*
> SUBSCRIBE widgetdc:events:data:ingested
```

### Stopping Everything

```bash
# Stop backend
pm2 stop widgetdc-backend

# Or delete from PM2 entirely
pm2 delete widgetdc-backend

# Stop Docker services
docker-compose stop

# Or stop and remove containers
docker-compose down
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if Postgres is running
docker ps | grep postgres

# Check logs
docker logs widgetdc-postgres

# Test connection
docker exec -it widgetdc-postgres psql -U widgetdc -d widgetdc

# In psql:
\dt  -- List tables
\q   -- Quit
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
docker exec -it widgetdc-redis redis-cli PING
# Should return: PONG
```

### PM2 Backend Not Starting

```bash
# View detailed logs
pm2 logs widgetdc-backend --lines 100

# Common issues:
# - Missing .env file
# - DATABASE_URL incorrect
# - Prisma client not generated (run: npx prisma generate)
```

### Performance Issues

```bash
# Check resource usage
docker stats

# If services use too much RAM/CPU:
# 1. Adjust limits in docker-compose.yml
# 2. Restart: docker-compose restart
```

## Next Steps

Once everything is running smoothly:

1. **Test Event Bus:** Verify Redis events work across restarts
2. **Test Vector Search:** Insert and search for similar vectors
3. **Migrate Widgets:** Ensure UI state persists correctly
4. **Configure Backups:** Set up automated Postgres backups

---
**Status:** Infrastructure ready for Enterprise operations 🚀
