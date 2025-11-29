# 🕸️ NEO4J SETUP GUIDE

**Date:** 2025-11-24  
**Status:** ⚠️ Neo4j Not Yet Installed

---

## 🎯 OVERVIEW

Neo4j er **ikke** installeret endnu. Vi har implementeret `Neo4jGraphAdapter`, men Neo4j serveren skal startes først.

---

## 📦 INSTALLATION OPTIONS

### Option 1: Docker (Recommended) ✅

**Quick Start:**
```bash
docker run \
  --name neo4j-widgetdc \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  -e NEO4J_PLUGINS='["apoc"]' \
  -d \
  neo4j:5.15
```

**With Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  neo4j:
    image: neo4j:5.15
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    environment:
      NEO4J_AUTH: neo4j/password
      NEO4J_PLUGINS: '["apoc"]'
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "password", "RETURN 1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  neo4j_data:
  neo4j_logs:
```

**Start:**
```bash
docker-compose up -d neo4j
```

---

### Option 2: Local Installation

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

**Windows:**
Download installer from: https://neo4j.com/download/

---

## ⚙️ CONFIGURATION

### Environment Variables

Create `.env` file in `apps/backend/`:

```bash
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
```

**Default Values (if not set):**
- URI: `bolt://localhost:7687`
- Username: `neo4j`
- Password: `password`
- Database: `neo4j`

---

## 🔍 VERIFICATION

### Check if Neo4j is Running

**1. Check Docker:**
```bash
docker ps | grep neo4j
```

**2. Check HTTP Port:**
```bash
curl http://localhost:7474
```

**3. Check Bolt Port:**
```bash
nc -zv localhost 7687
```

**4. Test Connection:**
```bash
# Using cypher-shell (if installed)
cypher-shell -u neo4j -p password "RETURN 1"
```

---

## 🚀 QUICK START (Docker)

```bash
# 1. Start Neo4j
docker run -d \
  --name neo4j-widgetdc \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:5.15

# 2. Wait for startup (30-60 seconds)
sleep 30

# 3. Verify connection
curl http://localhost:7474

# 4. Set environment variables
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USERNAME=neo4j
export NEO4J_PASSWORD=password

# 5. Start backend
cd apps/backend
npm run dev
```

---

## 🔧 APOC PLUGIN (Optional but Recommended)

APOC (Awesome Procedures on Cypher) provides additional procedures:

```bash
# Docker with APOC
docker run -d \
  --name neo4j-widgetdc \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  -e NEO4J_PLUGINS='["apoc"]' \
  neo4j:5.15
```

**APOC Features:**
- Additional graph algorithms
- Data import/export
- Text processing
- Time functions

---

## 📊 CURRENT STATUS

### ✅ What We Have
- ✅ Neo4j driver installed (`neo4j-driver@6.0.1`)
- ✅ Neo4jGraphAdapter implemented
- ✅ Integration code ready
- ✅ Graceful degradation (continues without Neo4j)

### ❌ What's Missing
- ❌ Neo4j server not running
- ❌ No Docker container
- ❌ No local installation

---

## 🎯 RECOMMENDED ACTION

**Use Docker (Easiest):**

```bash
# Create docker-compose.yml in project root
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  neo4j:
    image: neo4j:5.15
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      NEO4J_AUTH: neo4j/password
      NEO4J_PLUGINS: '["apoc"]'
    volumes:
      - neo4j_data:/data
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "password", "RETURN 1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  neo4j_data:
EOF

# Start Neo4j
docker-compose up -d neo4j

# Verify
sleep 30
curl http://localhost:7474
```

---

## 🔗 USEFUL LINKS

- **Neo4j Docker Hub:** https://hub.docker.com/_/neo4j
- **Neo4j Documentation:** https://neo4j.com/docs/
- **Cypher Query Language:** https://neo4j.com/docs/cypher-manual/
- **APOC Procedures:** https://neo4j.com/labs/apoc/

---

## ⚠️ NOTES

1. **Default Password:** First-time setup requires password change via browser UI
2. **Ports:** 7474 (HTTP), 7687 (Bolt)
3. **Memory:** Neo4j needs ~2GB RAM minimum
4. **Data Persistence:** Use Docker volumes for data persistence
5. **Graceful Degradation:** System works without Neo4j (uses implicit patterns)

---

**Status:** ⚠️ **Neo4j Not Installed - Setup Required**  
**Next Action:** Start Neo4j using Docker or local installation

