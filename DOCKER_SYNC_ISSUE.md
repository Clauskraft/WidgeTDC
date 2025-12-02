# 🔄 Docker Repository Sync Issue

**Dato:** 2025-12-01  
**Problem:** Repository i Docker container matcher ikke lokalt repository

---

## 🔍 Problem Identificering

### Situation
- **Lokalt repository:** Har `EmotionAwareDecisionEngine.ts` ✅
- **Docker container:** VS Code dev container har filen ✅
- **Men:** Du ser forskelle mellem Docker og lokalt

### Mulige Årsager

#### 1. **VS Code Dev Container Cache**
VS Code dev containers kan cache filer. Selvom volume er mountet, kan VS Code vise cached versioner.

**Løsning:**
```powershell
# Genstart VS Code dev container
# I VS Code: Command Palette (Ctrl+Shift+P) → "Dev Containers: Rebuild Container"
```

#### 2. **Docker Volume Mount Timing**
Hvis containeren blev startet før filen blev oprettet, kan der være sync issues.

**Løsning:**
```powershell
# Genstart container
docker restart recursing_mclean
```

#### 3. **Forskellige Git Branches**
Docker container kan være på en anden branch end lokalt.

**Tjek:**
```powershell
# Lokalt
git branch

# I Docker container
docker exec recursing_mclean git -C /workspaces/WidgeTDC branch
```

#### 4. **Uncommitted Changes**
Lokale ændringer der ikke er committet vises måske ikke i Docker.

**Tjek:**
```powershell
# Lokalt
git status

# I Docker - tjek om filen eksisterer
docker exec recursing_mclean test -f /workspaces/WidgeTDC/apps/backend/src/mcp/cognitive/EmotionAwareDecisionEngine.ts && echo "EXISTS" || echo "NOT FOUND"
```

---

## ✅ Verificering

### Nuværende Status

**VS Code Dev Container:**
- Container: `recursing_mclean`
- Mount: `C:\Users\claus\Projects\WidgeTDC\WidgeTDC` → `/workspaces/WidgeTDC`
- Mode: Read-Write ✅
- EmotionAwareDecisionEngine.ts: **EXISTS** ✅

**Docker Compose Services:**
- Backend container: **IKKE KØRENDE** ❌
- Neo4j: Kører ✅
- Frontend: Ikke kørende ❌

---

## 🔧 Løsninger

### Løsning 1: Rebuild VS Code Dev Container (Anbefalet)

1. **I VS Code:**
   - Tryk `Ctrl+Shift+P`
   - Vælg: `Dev Containers: Rebuild Container`
   - Vent på rebuild

2. **Eller via Command Line:**
```powershell
# Stop container
docker stop recursing_mclean

# Fjern container
docker rm recursing_mclean

# VS Code vil automatisk oprette ny container
```

### Løsning 2: Force Sync

```powershell
# Tjek git status i container
docker exec recursing_mclean git -C /workspaces/WidgeTDC status

# Hvis der er forskelle, pull i container
docker exec recursing_mclean git -C /workspaces/WidgeTDC pull origin main
```

### Løsning 3: Start Docker Compose Services

Hvis du vil have backend kørende i Docker:

```powershell
# Build og start alle services
docker-compose up -d --build

# Tjek status
docker-compose ps

# Se logs
docker-compose logs -f backend
```

**Note:** Docker Compose backend bruger sin egen Dockerfile der kopierer kode ved build-tid, ikke runtime. For at få ny kode skal du rebuild:

```powershell
docker-compose build backend
docker-compose up -d backend
```

---

## 📊 Sammenligning: Lokalt vs Docker

### Lokalt Repository
- **Branch:** `main` (opdateret til origin/main)
- **EmotionAwareDecisionEngine.ts:** ✅ Eksisterer
- **Sti:** `apps/backend/src/mcp/cognitive/EmotionAwareDecisionEngine.ts`

### VS Code Dev Container
- **Mount:** Bind mount (real-time sync)
- **EmotionAwareDecisionEngine.ts:** ✅ Eksisterer (verificeret)
- **Sti:** `/workspaces/WidgeTDC/apps/backend/src/mcp/cognitive/EmotionAwareDecisionEngine.ts`

### Docker Compose Backend
- **Status:** Ikke kørende
- **Build:** Kopierer kode ved build-tid
- **Volume:** Mount `/project` (read-only) for self-evolution features

---

## 🎯 Anbefaling

### Hvis du ser forskelle i VS Code Dev Container:

1. **Rebuild container** (mest sikkert)
2. **Tjek git branch** i container
3. **Tjek git status** for uncommitted changes

### Hvis du vil have backend kørende i Docker:

1. **Rebuild Docker image:**
   ```powershell
   docker-compose build backend
   ```

2. **Start services:**
   ```powershell
   docker-compose up -d
   ```

3. **Verificer:**
   ```powershell
   docker-compose ps
   docker-compose logs backend
   ```

---

## 🔍 Debug Commands

```powershell
# Tjek container mounts
docker inspect recursing_mclean --format '{{json .Mounts}}' | ConvertFrom-Json

# Tjek fil i container
docker exec recursing_mclean ls -la /workspaces/WidgeTDC/apps/backend/src/mcp/cognitive/

# Tjek git status i container
docker exec recursing_mclean git -C /workspaces/WidgeTDC status

# Tjek git branch i container
docker exec recursing_mclean git -C /workspaces/WidgeTDC branch

# Sammenlign fil størrelse
docker exec recursing_mclean stat /workspaces/WidgeTDC/apps/backend/src/mcp/cognitive/EmotionAwareDecisionEngine.ts --format='%s'
Get-Item apps/backend/src/mcp/cognitive/EmotionAwareDecisionEngine.ts | Select-Object Length
```

---

**Opdateret:** 2025-12-01

