# Railway Deployment Guide for WidgeTDC

## Prerequisites

- Railway CLI installed (`npm install -g @railway/cli`)
- Railway account and project created

## Quick Setup

### 1. Create Two Services on Railway

You need **two separate Railway services** in the same project:

1. **Backend Service** (widgettdc-backend)
2. **Frontend Service** (widgettdc-frontend)

### 2. Add Database Plugins

In your Railway project, add:

- **PostgreSQL** (required)
- **Redis** (recommended)

Railway will automatically inject `DATABASE_URL` and `REDIS_URL`.

### 3. Backend Configuration

**Environment Variables:**

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate-secure-secret>
EMBEDDING_PROVIDER=transformers
LOG_LEVEL=info
```

**Build Settings:**
- Root Directory: `/apps/backend`
- Build Command: `npm install && npx prisma generate && npm run build`
- Start Command: `npx prisma migrate deploy && npm start`

Or use Docker:
- Dockerfile Path: `apps/backend/Dockerfile`

### 4. Frontend Configuration

**Environment Variables:**

```env
VITE_API_URL=https://<your-backend-service>.up.railway.app
```

**Build Settings:**
- Root Directory: `/apps/matrix-frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npx serve -s dist -l $PORT`

Or use Docker:
- Dockerfile Path: `apps/matrix-frontend/Dockerfile`
- Build Args: `VITE_API_URL=https://<your-backend>.up.railway.app`

### 5. Connect Services

1. Deploy backend first
2. Get backend URL from Railway dashboard
3. Set `VITE_API_URL` in frontend environment
4. Deploy frontend

## Database Migrations

Prisma migrations run automatically on deploy via:
```bash
npx prisma migrate deploy
```

To create a new migration locally:
```bash
cd apps/backend
npx prisma migrate dev --name your_migration_name
```

## Linking Frontend to Backend

The frontend uses relative URLs (`/api/*`) which work with:

1. **Same domain**: When frontend proxies to backend
2. **Different domains**: Set `VITE_API_URL` to backend URL

For Railway with separate services, always set `VITE_API_URL`.

## Troubleshooting

### Prisma Issues
```bash
# Regenerate client
npx prisma generate

# Reset database (DESTRUCTIVE!)
npx prisma migrate reset
```

### Connection Issues
1. Check Railway logs for errors
2. Verify `DATABASE_URL` is set
3. Ensure pgvector extension is enabled

### CORS Issues
Add to backend environment:
```env
CORS_ORIGIN=https://your-frontend.up.railway.app
```

## Local Development with Railway DB

```bash
# Link to Railway project
railway link

# Run with Railway environment
railway run npm run dev
```

## File Structure

```
apps/
  backend/
    railway.toml      # Backend Railway config
    Dockerfile        # Backend container
    prisma/
      schema.prisma   # Database schema
  matrix-frontend/
    railway.toml      # Frontend Railway config
    Dockerfile        # Frontend container
```
