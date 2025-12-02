# 🚀 WidgeTDC Deployment Guide: Railway

Denne guide forklarer, hvordan du deployer WidgeTDC til produktion på **Railway**.

---

## 📋 Forudsætninger

- GitHub repository: `Clauskraft/WidgeTDC`
- Railway konto: [railway.app](https://railway.app)
- Neo4j Aura konto (gratis): [console.neo4j.io](https://console.neo4j.io)

---

## 🟢 Trin 1: Opret Neo4j AuraDB (Gratis)

1. Gå til [Neo4j Aura Console](https://console.neo4j.io/) og opret en konto
2. Klik **"New Instance"** → vælg **"Free Tier"**
3. **VIGTIGT:** Kopier og gem kodeordet! Du ser det kun én gang
4. Når instansen kører, gem **Connection URI** (f.eks. `neo4j+s://xxxxxxxx.databases.neo4j.io`)

---

## 🚂 Trin 2: Opret Railway Projekt

### A. Opret nyt projekt
1. Gå til [Railway Dashboard](https://railway.app/dashboard)
2. Klik **"New Project"** → **"Empty Project"**
3. Giv projektet et navn (f.eks. `widgetdc-prod`)

### B. Tilføj Databaser
1. Klik **"New"** → **"Database"** → **"PostgreSQL"**
2. Klik **"New"** → **"Database"** → **"Redis"**

---

## 🔧 Trin 3: Deploy Backend Service

1. Klik **"New"** → **"GitHub Repo"** → Vælg `Clauskraft/WidgeTDC`
2. I **Settings** → **General**:
   - **Service Name**: `backend`
3. I **Settings** → **Build**:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `apps/backend/Dockerfile`
4. I **Settings** → **Networking**:
   - Klik **"Generate Domain"** (gem URL'en til frontend config)

### Backend Environment Variables
Gå til **Variables** og tilføj:

| Variabel | Værdi |
|----------|-------|
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `NEO4J_URI` | Din AuraDB URI |
| `NEO4J_USER` | `neo4j` |
| `NEO4J_PASSWORD` | Dit AuraDB kodeord |
| `JWT_SECRET` | Et langt, sikkert kodeord |
| `GEMINI_API_KEY` | Din Google Gemini nøgle (optional) |
| `OPENAI_API_KEY` | Din OpenAI nøgle (optional) |

---

## 🎨 Trin 4: Deploy Frontend Service

1. Klik **"New"** → **"GitHub Repo"** → Vælg `Clauskraft/WidgeTDC` igen
2. I **Settings** → **General**:
   - **Service Name**: `frontend`
3. I **Settings** → **Build**:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `apps/widget-board/Dockerfile`
4. I **Settings** → **Networking**:
   - Klik **"Generate Domain"**

### Frontend Environment Variables (Build-time)
Gå til **Variables** og tilføj:

| Variabel | Værdi |
|----------|-------|
| `VITE_API_URL` | `https://[din-backend-url].railway.app` |

---

## 🔄 Trin 5: Verificer Deployment

### Tjek Backend
```bash
curl https://[backend-url].railway.app/health
```

### Tjek Frontend
Åbn `https://[frontend-url].railway.app` i browseren.

---

## 🐛 Troubleshooting

### Backend starter ikke
- Tjek at alle environment variables er sat
- Se logs i Railway dashboard
- Verificer at `DATABASE_URL` er korrekt formateret

### Frontend viser blank side
- Tjek browser console for errors
- Verificer at `VITE_API_URL` peger på korrekt backend URL
- Redeploy frontend efter backend URL er genereret

### Neo4j forbindelsesfejl
- Brug `neo4j+s://` protokol (ikke `bolt://`) for AuraDB
- Tjek at IP whitelist er korrekt i AuraDB

### API calls fejler
- Frontend proxy virker kun i dev-mode
- I produktion skal frontend kalde backend direkte via `VITE_API_URL`
- Verificer CORS er konfigureret i backend

---

## 📁 Fil-oversigt

```
apps/backend/Dockerfile           # Backend Docker build
apps/widget-board/Dockerfile      # Frontend Docker build
scripts/deploy/railway.toml       # Railway config for backend
scripts/deploy/railway.frontend.toml  # Railway config for frontend
```

---

## 🔐 Security Checklist

- [ ] Brug unikke, stærke passwords til JWT_SECRET og Neo4j
- [ ] Aktiver HTTPS på alle endpoints (Railway gør dette automatisk)
- [ ] Begræns API rate limiting i produktion
- [ ] Overvej IP whitelist for admin endpoints
