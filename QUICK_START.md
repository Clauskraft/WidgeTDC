# WidgeTDC Quick Start Guide

Dette er den hurtigste måde at få WidgeTDC op at køre på.

## Forudsætninger

- **Node.js** (v18 eller nyere)
- **Python** (v3.7 eller nyere)
- **npm** (installeret sammen med Node.js)

## Hurtig Start (Anbefalet)

### 1. Kør Auto-Start Scriptet

```bash
python start_fixed.py
```

Dette script gør automatisk følgende:
- ✅ Installerer alle dependencies
- ✅ Bygger shared packages (mcp-types, domain-types)
- ✅ Opretter `.env` fil hvis den mangler
- ✅ Starter backend på http://localhost:3001
- ✅ Starter frontend på http://localhost:5173
- ✅ Åbner browseren automatisk

### 2. Verificer at Alt Kører

I en **ny** terminal:

```bash
python check_health.py
```

Dette tjekker om:
- ✅ Backend svarer på port 3001
- ✅ Frontend svarer på port 5173
- ✅ API endpoints er tilgængelige

## Manuel Start (Hvis auto-scriptet fejler)

### 1. Installer Dependencies

```bash
# Root dependencies
npm install

# Build shared packages (VIGTIGT!)
cd packages/shared/mcp-types
npm install
npm run build
cd ../domain-types
npm install
npm run build
cd ../../..

# Backend dependencies
cd apps/backend
npm install
cd ../..

# Frontend dependencies
cd apps/widget-board
npm install
cd ../..
```

### 2. Start Backend

```bash
cd apps/backend
npm run dev
```

### 3. Start Frontend (i ny terminal)

```bash
cd apps/widget-board
npm run dev
```

## Miljøvariabler (.env)

Backenden bruger en `.env` fil. Hvis `start_fixed.py` opretter den automatisk, men du kan redigere den:

**Lokation:** `apps/backend/.env`

**Vigtige indstillinger:**

```env
# Database (SQLite)
DATABASE_URL=./widget-tdc.db

# JWT Secret (Skift i production!)
JWT_SECRET=dev-secret-key-only-for-local-testing-change-me

# Port
PORT=3001
```

## Typiske Problemer

### Problem: "Cannot find module '@widget-tdc/mcp-types'"

**Løsning:** Shared packages ikke bygget. Kør:

```bash
cd packages/shared/mcp-types && npm run build
cd ../domain-types && npm run build
```

### Problem: "Port 3001 already in use"

**Løsning:** En anden proces bruger porten. Find og stop den:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill <PID>
```

### Problem: Hvid skærm i browseren

**Løsning:**
1. Tryk F12 i browseren
2. Gå til "Console" tab
3. Tag screenshot af fejlene
4. Backend logger kan også hjælpe - se terminalen hvor `npm run dev` kører

## Database

Backend bruger SQLite som standard. Databasefilen oprettes automatisk ved første start:

**Lokation:** `apps/backend/widget-tdc.db`

### Seed Data

Hvis du vil have test-data:

```bash
cd apps/backend
npm run build
node dist/database/seeds.js
```

## Næste Skridt

Når systemet kører:

1. **Frontend:** http://localhost:5173
2. **Backend API:** http://localhost:3001/health
3. **Backend Docs:** Se [apps/backend/README.md](apps/backend/README.md)
4. **Widget Development:** Se [apps/widget-board/README.md](apps/widget-board/README.md)

## Support

Hvis du støder på problemer:

1. Kør `python check_health.py` for diagnostik
2. Tjek terminal logs for fejl
3. Tjek browser console (F12) for frontend fejl
4. Se [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (hvis den findes)

## Stop Serverne

Tryk **Ctrl+C** i terminalen hvor `start_fixed.py` kører.

Dette stopper både backend og frontend automatisk.
