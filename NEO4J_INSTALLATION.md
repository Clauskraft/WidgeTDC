# 🕸️ NEO4J INSTALLATION GUIDE

**Date:** 2025-11-24  
**Options:** Direct Installation OR Railway Cloud

---

## 🎯 INSTALLATION OPTIONS

### Option 1: Railway (Cloud - Recommended) ☁️

**Benefits:**
- ✅ No local setup needed
- ✅ Managed service
- ✅ Auto-scaling
- ✅ Free tier available
- ✅ Easy to setup

**Steps:**

1. **Create Railway Account:**
   - Go to: https://railway.app
   - Sign up/login

2. **Create Neo4j Service:**
   - Click "New Project"
   - Click "New" → "Database" → "Neo4j"
   - Railway will auto-provision Neo4j

3. **Get Connection Details:**
   - Railway provides connection string
   - Format: `bolt://[host]:[port]`
   - Username/password auto-generated

4. **Update Environment Variables:**
   ```bash
   # In Railway dashboard or .env
   NEO4J_URI=bolt://[railway-host]:[port]
   NEO4J_USERNAME=[railway-username]
   NEO4J_PASSWORD=[railway-password]
   NEO4J_DATABASE=neo4j
   ```

5. **Deploy:**
   - Railway handles everything
   - No local installation needed

---

### Option 2: Direct Installation (Local) 💻

#### Ubuntu/Debian/WSL2:

```bash
# 1. Add Neo4j repository
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list

# 2. Update and install
sudo apt-get update
sudo apt-get install neo4j

# 3. Start Neo4j
sudo systemctl start neo4j
sudo systemctl enable neo4j

# 4. Set password (first time)
# Default password is 'neo4j', you'll be prompted to change it
# Access: http://localhost:7474

# 5. Verify
sudo systemctl status neo4j
curl http://localhost:7474
```

#### macOS:

```bash
# Using Homebrew
brew install neo4j
brew services start neo4j

# Access: http://localhost:7474
```

#### Windows:

1. Download installer: https://neo4j.com/download/
2. Run installer
3. Start Neo4j Desktop
4. Create new database
5. Start database

---

### Option 3: Docker (If Available) 🐳

```bash
# Quick start
docker run -d \
  --name neo4j-widgetdc \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:5.15

# Or use docker-compose
docker-compose up -d neo4j
```

---

## ⚙️ CONFIGURATION

### Environment Variables

Create/update `apps/backend/.env`:

```bash
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
```

**For Railway:**
```bash
# Use Railway-provided values
NEO4J_URI=bolt://[railway-host]:[port]
NEO4J_USERNAME=[railway-username]
NEO4J_PASSWORD=[railway-password]
```

---

## ✅ VERIFICATION

### Test Connection:

```bash
# 1. Check if Neo4j is running
curl http://localhost:7474

# 2. Test Bolt connection
nc -zv localhost 7687

# 3. Start backend and check logs
cd apps/backend
npm run dev
# Should see: "🕸️ Neo4j Graph Database initialized"
```

### Browser Access:

- **Local:** http://localhost:7474
- **Railway:** Railway provides URL in dashboard

---

## 🚀 QUICK START (Railway Recommended)

**1. Setup Railway:**
- Sign up at https://railway.app
- Create Neo4j database
- Copy connection details

**2. Update Environment:**
```bash
# Add to Railway environment variables or .env
NEO4J_URI=bolt://[railway-host]
NEO4J_USERNAME=[username]
NEO4J_PASSWORD=[password]
```

**3. Deploy:**
- Railway auto-deploys
- Backend connects automatically

---

## 📊 RECOMMENDATION

**For Development:** Railway (easiest, no local setup)  
**For Production:** Railway or Managed Neo4j Aura  
**For Local Testing:** Direct installation or Docker

---

**Status:** ⚠️ **Neo4j Not Installed - Choose Installation Method**  
**Recommended:** Railway (cloud, easiest)

