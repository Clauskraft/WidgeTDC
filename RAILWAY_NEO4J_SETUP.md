# ☁️ RAILWAY NEO4J SETUP GUIDE

**Date:** 2025-11-24  
**Recommended:** Railway Cloud (Easiest Option)

---

## 🎯 WHY RAILWAY?

- ✅ **No Local Setup** - Cloud managed
- ✅ **Free Tier** - Good for development
- ✅ **Auto-Scaling** - Handles traffic
- ✅ **Easy Setup** - 5 minutes
- ✅ **Production Ready** - Can use in production

---

## 🚀 SETUP STEPS

### Step 1: Create Railway Account

1. Go to: https://railway.app
2. Sign up (GitHub login works)
3. Create new project

### Step 2: Add Neo4j Database

1. In Railway dashboard, click **"New"**
2. Select **"Database"**
3. Choose **"Neo4j"**
4. Railway auto-provisions Neo4j instance

### Step 3: Get Connection Details

Railway provides:
- **Connection URI:** `bolt://[host]:[port]`
- **Username:** Auto-generated
- **Password:** Auto-generated
- **Database:** Usually `neo4j`

**Where to find:**
- Railway dashboard → Neo4j service → "Variables" tab
- Or "Connect" button shows connection string

### Step 4: Configure Backend

**Option A: Railway Environment Variables (Recommended)**

1. In Railway dashboard → Your backend service
2. Go to "Variables" tab
3. Add:
   ```
   NEO4J_URI=bolt://[railway-host]:[port]
   NEO4J_USERNAME=[railway-username]
   NEO4J_PASSWORD=[railway-password]
   NEO4J_DATABASE=neo4j
   ```

**Option B: Local .env File**

Create `apps/backend/.env`:
```bash
NEO4J_URI=bolt://[railway-host]:[port]
NEO4J_USERNAME=[railway-username]
NEO4J_PASSWORD=[railway-password]
NEO4J_DATABASE=neo4j
```

### Step 5: Deploy

**Railway Auto-Deploys:**
- Connect GitHub repo to Railway
- Railway auto-deploys on push
- Environment variables auto-injected

**Or Manual:**
- Railway CLI: `railway up`
- Or push to connected repo

---

## 🔍 VERIFICATION

### Check Railway Dashboard:

1. Neo4j service shows "Running" ✅
2. Backend service connects successfully ✅
3. Logs show: "🕸️ Neo4j Graph Database initialized" ✅

### Test Connection:

```bash
# From backend logs or Railway logs
# Should see successful Neo4j connection
```

---

## 📊 RAILWAY PRICING

**Free Tier:**
- $5 credit/month
- Enough for development/testing
- Neo4j included

**Paid Plans:**
- Start at $5/month
- More resources
- Production ready

---

## 🔗 RAILWAY LINKS

- **Dashboard:** https://railway.app
- **Documentation:** https://docs.railway.app
- **Neo4j Guide:** https://docs.railway.app/databases/neo4j

---

## ⚙️ ALTERNATIVE: NEO4J AURA (Official Cloud)

If Railway doesn't work, use Neo4j Aura:

1. Sign up: https://neo4j.com/cloud/aura/
2. Create free instance
3. Get connection string
4. Use same environment variables

**Benefits:**
- Official Neo4j cloud
- Free tier available
- Production ready

---

## 🎯 RECOMMENDED ACTION

**Use Railway:**
1. Sign up at railway.app
2. Create Neo4j database
3. Copy connection details
4. Add to environment variables
5. Deploy backend

**Time:** ~5 minutes  
**Cost:** Free (development)

---

**Status:** ⚠️ **Neo4j Not Installed**  
**Recommended:** Railway Cloud Setup  
**Next:** Follow Railway setup steps above

