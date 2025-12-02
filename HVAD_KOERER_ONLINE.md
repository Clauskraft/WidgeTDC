# 🌐 Hvad Kører Online - Status Oversigt

**Dato:** 2025-12-01  
**Opdateret:** Nu

---

## 📊 Nuværende Status

### Lokalt (Din Maskine)

#### Docker Containers:
- ✅ **Neo4j** - Kører
  - Container: `widgetdc-neo4j`
  - Status: Up 6 hours (healthy)
  - Ports: 
    - `7474` (HTTP) → http://localhost:7474
    - `7687` (Bolt) → bolt://localhost:7687

#### Docker Compose Services:
- ❌ **Backend** - Ikke kørende
- ❌ **Frontend** - Ikke kørende
- ❌ **PostgreSQL** - Ikke kørende
- ❌ **Redis** - Ikke kørende
- ❌ **Prometheus** - Ikke kørende
- ❌ **Loki** - Ikke kørende
- ❌ **Grafana** - Ikke kørende
- ❌ **NocoDB** - Ikke kørende

#### Node.js Processer:
- ✅ **2 Node processer** kører (sandsynligvis VS Code eller dev server)

---

## 🚀 Online/Production Deployment

### Railway (Konfigureret men ikke verificeret)

**Konfiguration:**
- ✅ `railway.json` eksisterer
- ✅ Dockerfile konfigureret
- ⚠️ **Status:** Ukendt (ikke verificeret)

**Railway Config:**
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Note:** Railway deployment er konfigureret, men vi ved ikke om det faktisk kører online.

---

## 📋 Services der SKULLE Køre

### Backend Services (Ikke kørende):
- **Backend API** - Port 3001
- **Frontend** - Port 8888 (eller 5173)
- **PostgreSQL** - Port 5432
- **Redis** - Port 6379

### Monitoring (Ikke kørende):
- **Prometheus** - Port 9090
- **Grafana** - Port 3000
- **Loki** - Port 3100

### Tools (Ikke kørende):
- **NocoDB** - Port 8080

---

## 🔍 Hvordan Tjekke Online Status

### 1. Tjek Railway Deployment:
```bash
# Hvis du har Railway CLI
railway status

# Eller tjek Railway dashboard
# https://railway.app/dashboard
```

### 2. Tjek Lokale Services:
```powershell
# Docker containers
docker ps

# Docker Compose
docker-compose ps

# Node processer
Get-Process | Where-Object { $_.ProcessName -like "*node*" }
```

### 3. Tjek Ports:
```powershell
# Tjek hvilke porte der lytter
netstat -ano | Select-String -Pattern ":3001|:5173|:8888"
```

---

## 🎯 Anbefalinger

### Hvis du vil have alt kørende lokalt:

```powershell
# Start alle Docker Compose services
docker-compose up -d

# Tjek status
docker-compose ps

# Se logs
docker-compose logs -f
```

### Hvis du vil tjekke Railway deployment:

1. Gå til Railway dashboard
2. Tjek om der er aktive deployments
3. Verificer environment variables
4. Tjek logs i Railway

---

## 📝 Noter

- **Neo4j** er den eneste service der kører lige nu
- **Backend og Frontend** er ikke kørende (hverken lokalt eller i Docker)
- **Railway** er konfigureret men status er ukendt
- **Docker build fejlede** pga. TypeScript fejl (mangler @widget-tdc/mcp-types)

---

**Opdateret:** 2025-12-01

