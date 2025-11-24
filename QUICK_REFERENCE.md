# 🚀 Enterprise Quick Reference

## Start Everything

```bash
# 1. Start infrastructure (ONCE - then runs in background)
docker-compose up -d

```bash
# 2. Build backend
cd apps/backend
npm install
npm run build

# 3. Run database migration (ONCE)
npx prisma migrate dev --name init

# 4. Migrate old data (ONCE, OPTIONAL)
node dist/scripts/migrate-to-postgres.js

# 5. Start backend with PM2
pm2 start ../../ecosystem.config.js
```

## Daily Commands

```bash
# Check everything is running
pm2 status
docker ps

# View logs
pm2 logs widgetdc-backend

# Restart backend (after code changes)
npm run build && pm2 restart widgetdc-backend

# Stop backend
pm2 stop widgetdc-backend
```

## Database Management

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Run migrations after schema changes
npx prisma migrate dev --name your_change_name

# View database directly
docker exec -it widgetdc-postgres psql -U widgetdc -d widgetdc
```

## Troubleshooting

```bash
# Services won't start?
docker-compose logs postgres
docker-compose logs redis

# Backend won't start?
pm2 logs widgetdc-backend --lines 100

# Reset everything (dangerous!)
pm2 delete widgetdc-backend
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
```

## Resource Check

```bash
# Monitor resource usage
docker stats

# Target usage:
# postgres: < 512MB RAM, < 0.5 CPU
# redis: < 256MB RAM, < 0.25 CPU
```

---
**Remember:** Run in detached mode (`-d`) so it doesn't block your terminal!
