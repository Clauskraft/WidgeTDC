# 🚀 START NEO4J - QUICK GUIDE

**Status:** ⚠️ Neo4j er IKKE kørende - skal startes først

---

## ✅ HVAD VI HAR

- ✅ Neo4j driver installeret (`neo4j-driver@6.0.1`)
- ✅ Neo4jGraphAdapter implementeret
- ✅ Integration kode klar
- ✅ Graceful degradation (systemet virker uden Neo4j)

---

## ❌ HVAD DER MANGLER

- ❌ Neo4j server kører ikke
- ❌ Ingen Docker container
- ❌ Ingen lokal installation

---

## 🚀 HVORDAN STARTER JEG NEO4J?

### Option 1: Docker (Anbefalet) 🐳

**Hvis du har Docker installeret:**

```bash
# Start Neo4j
docker-compose up -d neo4j

# Vent 30 sekunder for startup
sleep 30

# Verificer at det virker
curl http://localhost:7474

# Eller åbn browser:
# http://localhost:7474
# Login: neo4j / password
```

**Stop Neo4j:**
```bash
docker-compose down neo4j
```

---

### Option 2: Docker direkte (uden docker-compose)

```bash
docker run -d \
  --name neo4j-widgetdc \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  -e NEO4J_PLUGINS='["apoc"]' \
  neo4j:5.15

# Vent 30 sekunder
sleep 30

# Test
curl http://localhost:7474
```

---

### Option 3: Lokal installation

**Ubuntu/Debian:**
```bash
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
sudo apt-get update
sudo apt-get install neo4j
sudo systemctl start neo4j
```

**macOS:**
```bash
brew install neo4j
brew services start neo4j
```

---

## ⚙️ ENVIRONMENT VARIABLES

Opret eller opdater `apps/backend/.env`:

```bash
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
```

---

## ✅ VERIFICER NEO4J KØRER

**1. Check HTTP port:**
```bash
curl http://localhost:7474
```

**2. Check Bolt port:**
```bash
nc -zv localhost 7687
```

**3. Åbn browser:**
```
http://localhost:7474
```

**4. Test fra backend:**
```bash
cd apps/backend
npm run dev
# Se console output - skal se: "🕸️ Neo4j Graph Database initialized"
```

---

## ⚠️ HVIS NEO4J IKKE KAN STARTES

**Systemet virker stadig!** 

- ✅ Bruger implicit graph patterns (CMA memory_relations)
- ✅ UnifiedGraphRAG virker uden Neo4j
- ✅ Alle features virker (bare uden explicit graph storage)

**Du vil se denne besked:**
```
⚠️  Neo4j not available (optional): [error]
   Continuing without Neo4j - using implicit graph patterns
```

---

## 🎯 NÆSTE STEPS EFTER NEO4J ER STARTET

1. ✅ Start Neo4j (se ovenfor)
2. ⏳ Opret MCP tools for Neo4j
3. ⏳ Opdater UnifiedGraphRAG til at bruge Neo4j
4. ⏳ Migrer CMA memory_relations til Neo4j

---

**Status:** ⚠️ **Neo4j skal startes først**  
**System:** ✅ **Virker uden Neo4j (graceful degradation)**

