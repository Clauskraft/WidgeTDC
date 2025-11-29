# 🧠 NEO4J INSTALLATION - SEQUENTIAL THINKING APPROACH

**Date:** 2025-11-24  
**Problem:** Neo4j skal installeres, men Java 21 mangler

---

## 🔍 STEP 1: PROBLEM ANALYSIS

### Current Situation:
- ✅ Neo4j repository tilføjet
- ❌ Java 21 ikke tilgængelig i Debian 11 repos
- ❌ Neo4j kan ikke installeres uden Java 21
- ⚠️ Systemd ikke tilgængelig (container/WSL2)

### Root Cause:
**Neo4j requires Java 21, but Debian 11 (bullseye) doesn't have Java 21 in default repositories.**

---

## 🎯 STEP 2: SOLUTION OPTIONS

### Option A: Install Java 21 from Adoptium/Temurin ✅ BEST
**Pros:**
- Official OpenJDK distribution
- Well maintained
- Easy to install

**Steps:**
1. Add Adoptium repository
2. Install temurin-21-jdk
3. Install Neo4j
4. Start Neo4j manually

### Option B: Download Neo4j Tarball (No Package Manager) ✅ ALTERNATIVE
**Pros:**
- No Java dependency resolution issues
- Works in any environment
- Self-contained

**Steps:**
1. Download Neo4j Community Edition tarball
2. Extract to /opt/neo4j
3. Set JAVA_HOME
4. Start Neo4j directly

### Option C: Railway Cloud ☁️
**Pros:**
- No local installation
- Managed service
- 5 minutes setup

**Cons:**
- Requires Railway account
- Cloud dependency

---

## 🚀 STEP 3: IMPLEMENTATION PLAN (Option A - Adoptium)

### Phase 1: Install Java 21
```bash
# 1. Add Adoptium repository
wget -qO - https://adoptium.jfrog.io/adoptium/api/gpg/key/public | sudo apt-key add -
echo "deb https://adoptium.jfrog.io/adoptium/deb bullseye main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt-get update

# 2. Install Java 21
sudo apt-get install -y temurin-21-jdk

# 3. Verify
java -version
```

### Phase 2: Install Neo4j
```bash
# 1. Install Neo4j (should work now with Java 21)
sudo apt-get install -y neo4j

# 2. Verify installation
which neo4j
neo4j version
```

### Phase 3: Configure & Start Neo4j
```bash
# 1. Set password (first time)
# Default: neo4j/neo4j, will prompt to change

# 2. Start Neo4j (manual, no systemd)
sudo /usr/bin/neo4j start
# OR
sudo neo4j start

# 3. Verify running
curl http://localhost:7474
```

### Phase 4: Configure Backend
```bash
# Update apps/backend/.env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=[your-password]
NEO4J_DATABASE=neo4j
```

---

## 🔄 STEP 4: FALLBACK PLAN (Option B - Tarball)

If package installation fails, use tarball:

```bash
# 1. Download Neo4j Community Edition
cd /tmp
wget https://neo4j.com/artifact.php?name=neo4j-community-5.15.0-unix.tar.gz -O neo4j.tar.gz

# 2. Extract
sudo mkdir -p /opt
sudo tar -xzf neo4j.tar.gz -C /opt
sudo mv /opt/neo4j-community-* /opt/neo4j

# 3. Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64
# Add to ~/.bashrc or /etc/environment

# 4. Start Neo4j
sudo /opt/neo4j/bin/neo4j start

# 5. Verify
curl http://localhost:7474
```

---

## ✅ STEP 5: VERIFICATION CHECKLIST

- [ ] Java 21 installed and verified
- [ ] Neo4j installed
- [ ] Neo4j started successfully
- [ ] HTTP port 7474 responding
- [ ] Bolt port 7687 responding
- [ ] Backend connects successfully
- [ ] Environment variables configured

---

## 🎯 EXECUTION ORDER

1. **Install Java 21** (Adoptium)
2. **Install Neo4j** (package manager)
3. **Start Neo4j** (manual)
4. **Configure** (environment variables)
5. **Test** (backend connection)

---

**Status:** Ready to execute sequential plan

